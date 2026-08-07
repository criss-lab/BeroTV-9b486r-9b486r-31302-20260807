import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, XCircle, Crown } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Vérification du paiement...');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const orderTrackingId =
      searchParams.get('OrderTrackingId') ||
      searchParams.get('orderTrackingId') ||
      searchParams.get('order_tracking_id');

    if (!orderTrackingId) {
      setStatus('failed');
      setMessage('Paramètres de paiement manquants. Vérifiez votre e-mail pour confirmation.');
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const checkPayment = async () => {
      attempts++;
      try {
        const { data, error } = await supabase.functions.invoke('pesapal-payment', {
          body: { action: 'check_status', orderTrackingId, userId: user?.id },
        });

        if (error) {
          let errorMsg = error.message;
          if (error instanceof FunctionsHttpError) {
            try { errorMsg = await error.context.text(); } catch { /* ignore */ }
          }
          throw new Error(errorMsg);
        }

        const payStatus = data?.payment_status_description;
        console.log('Payment status:', payStatus);

        if (payStatus === 'Completed') {
          setStatus('success');
          setMessage('Votre abonnement Premium est actif pour 4 semaines!');
          toast.success('Paiement réussi! Bienvenue Premium! 🎉');
          setTimeout(() => navigate('/'), 4000);
        } else if (payStatus === 'Failed' || payStatus === 'Invalid') {
          setStatus('failed');
          setMessage(`Statut: ${payStatus}. Aucun montant n'a été débité.`);
        } else if (attempts < maxAttempts) {
          setMessage(`Paiement en attente... (${payStatus || 'Processing'})`);
          setTimeout(checkPayment, 4000);
        } else {
          setStatus('failed');
          setMessage('Le paiement est en cours de traitement. Vérifiez votre e-mail.');
        }
      } catch (e) {
        console.error('Payment check error:', e);
        if (attempts < maxAttempts) {
          setTimeout(checkPayment, 5000);
        } else {
          setStatus('failed');
          setMessage(e instanceof Error ? e.message : 'Erreur de vérification');
        }
      }
    };

    const timer = setTimeout(checkPayment, 1000);
    return () => clearTimeout(timer);
  }, [searchParams, user?.id]);

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Crown className="h-10 w-10 text-yellow-400" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Vérification...</h2>
            <p className="text-sm text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3">🎉 Paiement Réussi!</h2>
            <p className="text-sm text-gray-300 mb-2">{message}</p>
            <p className="text-xs text-gray-500 mb-8">Redirection dans quelques secondes...</p>
            <button onClick={() => navigate('/')}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-base shadow-xl shadow-yellow-500/30">
              Commencer à regarder →
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Non Confirmé</h2>
            <p className="text-sm text-gray-400 mb-2">{message}</p>
            <p className="text-xs text-gray-600 mb-8">
              Si débité, contactez: kembavodomaurice@gmail.com
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/premium')}
                className="flex-1 py-3.5 bg-white/10 text-white font-bold rounded-xl border border-white/10">
                Réessayer
              </button>
              <button onClick={() => navigate('/')}
                className="flex-1 py-3.5 bg-yellow-500/10 text-yellow-400 font-bold rounded-xl border border-yellow-500/20">
                Accueil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
