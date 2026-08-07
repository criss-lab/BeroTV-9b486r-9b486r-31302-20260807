import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PESAPAL_BASE = 'https://pay.pesapal.com/v3';

async function getOAuthToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
  if (!consumerKey || !consumerSecret) throw new Error('PesaPal credentials not configured in Secrets');

  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });
  const data = await res.json();
  console.log('PesaPal auth:', JSON.stringify(data));
  if (!data.token) throw new Error(`PesaPal auth failed: ${data.message || JSON.stringify(data)}`);
  return data.token;
}

async function registerIPN(token: string, notifyUrl: string): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ url: notifyUrl, ipn_notification_type: 'GET' }),
  });
  const data = await res.json();
  console.log('IPN register:', JSON.stringify(data));
  return data.ipn_id || data.id || '';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'initiate') {
      const { userId, userEmail, appUrl } = body;
      if (!userId || !userEmail) throw new Error('userId and userEmail required');

      const token = await getOAuthToken();
      const baseUrl = (appUrl || 'https://mkvsat.onspace.app').replace(/\/$/, '');
      const callbackUrl = `${baseUrl}/payment-callback`;

      const ipnId = await registerIPN(token, callbackUrl);
      const orderId = `MKV-${Date.now()}-${userId.slice(0, 8)}`;

      const orderPayload = {
        id: orderId,
        currency: 'KES',
        amount: 100,
        description: 'MKV SAT+ Premium — Accès illimité 4 semaines',
        callback_url: callbackUrl,
        notification_id: ipnId,
        cancellation_url: `${baseUrl}/premium`,
        redirect_mode: '',
        billing_address: {
          email_address: userEmail,
          phone_number: '',
          country_code: 'KE',
          first_name: 'MKV',
          last_name: 'User',
          line_1: '',
          city: '',
          state: '',
          postal_code: '',
          zip_code: '',
        },
      };

      console.log('Submitting order:', JSON.stringify(orderPayload));

      const submitRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderPayload),
      });
      const submitData = await submitRes.json();
      console.log('PesaPal submit:', JSON.stringify(submitData));

      if (!submitData.redirect_url) throw new Error(`PesaPal order failed: ${submitData.message || JSON.stringify(submitData)}`);

      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      const endsAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      await supabaseAdmin.from('premium_subscriptions').upsert({
        user_id: userId,
        plan: 'ksh100_4weeks',
        status: 'pending',
        pesapal_order_id: orderId,
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        redirect_url: submitData.redirect_url,
        order_id: orderId,
        order_tracking_id: submitData.order_tracking_id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'check_status') {
      const { orderTrackingId, userId } = body;
      if (!orderTrackingId) throw new Error('orderTrackingId required');

      const token = await getOAuthToken();
      const statusRes = await fetch(
        `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
      );
      const statusData = await statusRes.json();
      console.log('PesaPal status:', JSON.stringify(statusData));

      if (statusData.payment_status_description === 'Completed' && userId) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        const endsAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin.from('premium_subscriptions').update({
          status: 'active',
          pesapal_tracking_id: orderTrackingId,
          ends_at: endsAt,
        }).eq('user_id', userId).in('status', ['pending', 'active']);

        await supabaseAdmin.from('user_profiles').update({ is_premium: true }).eq('id', userId);
      }

      return new Response(JSON.stringify(statusData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PesaPal error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
