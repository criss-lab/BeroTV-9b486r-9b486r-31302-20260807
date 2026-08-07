import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Zap, Star, Globe, Tv, Loader2, Shield, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'nahashonnyaga794@gmail.com';

const PREMIUM_FEATURES = [
  { icon: Tv, text: '100,000+ chaînes HD/FHD/4K sans limitation' },
  { icon: Zap, text: 'Zéro publicité sur toutes les pages' },
  { icon: Globe, text: 'Accès illimité à tous les pays et catégories' },
  { icon: Star, text: 'Badge vérifié et profil premium' },
  { icon: Shield, text: 'Support prioritaire et accès bêta' },
  { icon: Lock, text: 'Streaming sécurisé et confidentiel' },
];

export function PremiumPage() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.email === ADMIN_EMAIL) { setIsPremium(true); setLoading(false); return; }

    supabase
      .from('premium_subscriptions')
      .select('id, ends_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .limit(1)
      .then(({ data }) => {
        setIsPremium(!!data && data.length > 0);
        setLoading(false);
      });
  }, [user]);

  const handlePesaPalPayment = async () => {
    if (!user) { navigate('/login'); return; }
    setPaying(true);
    try {
      const appUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('pesapal-payment', {
        body: { action: 'initiate', userId: user.id, userEmail: user.email, appUrl },
      });

      if (error) {
        let errorMsg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { errorMsg = await error.context.text(); } catch { /* ignore */ }
        }
        throw new Error(errorMsg);
      }

      if (data?.redirect_url) {
        toast.success('Redirection vers PesaPal...');
        window.location.href = data.redirect_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (e: unknown) {
      console.error('PesaPal error:', e);
      const msg = e instanceof Error ? e.message : 'Erreur de paiement';
      toast.error(`Erreur: ${msg}`);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500/50" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white pb-28 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20">
            <Crown className="h-12 w-12 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            {user?.email === ADMIN_EMAIL ? '👑 Admin — Accès Total' : '🎉 Vous êtes Premium!'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {user?.email === ADMIN_EMAIL
              ? 'Accès illimité — Aucune restriction.'
              : 'Profitez de tous les avantages sans limitation.'}
          </p>
          <div className="space-y-2 mb-8">
            {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-xs text-gray-300 flex-1 text-left">{text}</p>
                <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-sm shadow-xl shadow-yellow-500/20">
            Regarder maintenant →
          </button>
        </div>
        <NavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-black text-white">Passer à Premium</h1>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-yellow-500/15">
          <Crown className="h-10 w-10 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">MKV SAT+ Premium</h1>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
          Accès illimité à <strong className="text-white">100,000+ chaînes</strong> du monde entier, sans publicité.
        </p>
      </div>

      <div className="px-4 max-w-md mx-auto">
        {/* Main Plan */}
        <div className="relative rounded-3xl bg-gradient-to-br from-yellow-500/15 via-yellow-700/10 to-[#0f0f1e] border-2 border-yellow-500/40 p-6 mb-5 shadow-2xl shadow-yellow-500/10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            🔥 OFFRE SPÉCIALE — PAIEMENT MOBILE
          </div>

          {/* Price */}
          <div className="text-center mb-5 pt-2">
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-5xl font-black text-white">100</span>
              <span className="text-2xl font-black text-yellow-400 mb-1">KES</span>
            </div>
            <p className="text-sm text-gray-400">pour <strong className="text-white">4 semaines</strong> d'accès illimité</p>
            <p className="text-xs text-gray-600 mt-1">≈ 0.77 USD · Renouvelable</p>
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-6">
            {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <p className="text-xs text-gray-300">{text}</p>
                <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0 ml-auto" />
              </div>
            ))}
          </div>

          {/* PesaPal Button */}
          {user ? (
            <button onClick={handlePesaPalPayment} disabled={paying}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/30 hover:from-yellow-300 hover:to-yellow-500 transition-all active:scale-95 disabled:opacity-70">
              {paying ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Redirection vers PesaPal...</>
              ) : (
                <><CreditCard className="h-5 w-5" /> Payer 100 KES avec PesaPal</>
              )}
            </button>
          ) : (
            <button onClick={() => navigate('/login')}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-base shadow-xl shadow-yellow-500/30">
              Se connecter pour payer →
            </button>
          )}

          {/* Payment info */}
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              🔒 Paiement sécurisé via <strong className="text-white">PesaPal</strong> · M-Pesa, Visa, Mastercard acceptés<br />
              Accès immédiat après confirmation · Renouvelable toutes les 4 semaines
            </p>
          </div>
        </div>

        {/* Why Premium */}
        <div className="rounded-2xl bg-white/5 border border-white/5 p-4 mb-6">
          <h3 className="text-sm font-black text-white mb-3">Pourquoi passer Premium?</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-base">📺</span>
              <div>
                <p className="text-xs font-bold text-white">Gratuit: 15 chaînes</p>
                <p className="text-[10px] text-gray-500">Accès limité aux premières chaînes affichées</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">👑</span>
              <div>
                <p className="text-xs font-bold text-yellow-400">Premium: 100,000+ chaînes</p>
                <p className="text-[10px] text-gray-500">Accès total à tous les pays, catégories et qualités</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <p className="text-center text-[10px] text-gray-700 leading-relaxed">
          Problème de paiement? Contactez-nous:<br />
          <a href="mailto:kembavodomaurice@gmail.com" className="text-yellow-500/60 hover:text-yellow-400">kembavodomaurice@gmail.com</a>
          {' · '}+243 835 412 718
        </p>
      </div>

      <NavigationBar />
    </div>
  );
}
