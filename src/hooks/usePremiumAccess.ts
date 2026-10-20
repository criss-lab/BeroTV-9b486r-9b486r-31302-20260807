import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const PREMIUM_CHANGED_EVENT = 'berotv:premium-changed';
const ADMIN_EMAIL = 'nahashonnyaga794@gmail.com';

/** The database entitlement, not the browser redirect, is the source of truth. */
export async function fetchPremiumEntitlement(userId: string): Promise<{ active: boolean; endsAt: string | null }> {
  const { data, error } = await supabase.from('premium_subscriptions')
    .select('ends_at').eq('user_id', userId).eq('status', 'active')
    .gt('ends_at', new Date().toISOString()).order('ends_at', { ascending: false }).limit(1);
  if (error) throw error;
  return { active: !!data?.length, endsAt: data?.[0]?.ends_at ?? null };
}

export function notifyPremiumChanged() {
  window.dispatchEvent(new Event(PREMIUM_CHANGED_EVENT));
}

export function usePremiumAccess(user: { id: string; email?: string | null } | null | undefined) {
  const [active, setActive] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!user) { setActive(false); setEndsAt(null); setLoading(false); return false; }
    if (user.email === ADMIN_EMAIL) { setActive(true); setEndsAt(null); setLoading(false); return true; }
    try {
      const entitlement = await fetchPremiumEntitlement(user.id);
      setActive(entitlement.active); setEndsAt(entitlement.endsAt);
      return entitlement.active;
    } catch (error) {
      console.error('Premium entitlement refresh failed:', error);
      // Fail closed on a new session; never grant access from an unverified payment redirect.
      setActive(false); setEndsAt(null);
      return false;
    } finally { setLoading(false); }
  }, [user?.id, user?.email]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const onFocus = () => { void refresh(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener(PREMIUM_CHANGED_EVENT, onFocus);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 15000);
    return () => {
      window.removeEventListener(PREMIUM_CHANGED_EVENT, onFocus);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(timer);
    };
  }, [refresh]);
  return { active, endsAt, loading, refresh };
}
