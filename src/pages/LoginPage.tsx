import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Satellite } from 'lucide-react';
import { authService } from '@/lib/authService';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.sendOtp(email);
      setMode('verify');
      toast.success('Code envoyé ! Vérifiez votre email.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.verifyOtpAndSetPassword(email, otp, password, username);
      if (user) {
        login(authService.mapUser(user));
        navigate('/');
        toast.success('Compte créé avec succès !');
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.signInWithPassword(email, password);
      login(authService.mapUser(user));
      navigate('/');
      toast.success('Connexion réussie !');
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Hero background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="relative z-10 flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-4 w-fit"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm">Retour</span>
      </button>

      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-black border border-yellow-500/30 overflow-hidden mx-auto mb-4 shadow-2xl shadow-yellow-500/10">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
                alt="MKV SAT+"
                className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h1 className="text-2xl font-black text-yellow-500 tracking-widest">MKV SAT+</h1>
            <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">LE MONDE DANS LA POCHE</p>
          </div>

          {/* Card */}
          <div className="bg-[#0f0f1e] rounded-2xl border border-white/10 shadow-2xl p-6">
            <h2 className="text-lg font-black text-white mb-1">
              {mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Vérification'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              {mode === 'login' ? 'Accédez à votre espace' : mode === 'signup' ? 'Rejoignez MKV SAT+' : `Code envoyé à ${email}`}
            </p>

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-white/8 transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full pl-9 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-xl text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Pas de compte ?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-yellow-500 font-bold hover:text-yellow-400">
                    Créer un compte
                  </button>
                </p>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nom d'utilisateur</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text" value={username} onChange={e => setUsername(e.target.value)} required
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                      placeholder="Votre pseudo"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-xl text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] transition-transform disabled:opacity-60">
                  {loading ? 'Envoi...' : 'Recevoir le code'}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Déjà inscrit ?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-yellow-500 font-bold hover:text-yellow-400">
                    Se connecter
                  </button>
                </p>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Code de vérification (4 chiffres)</label>
                  <input
                    type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={4}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-black text-center tracking-[1em] focus:outline-none focus:border-yellow-500/50 transition-colors"
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mot de passe (min. 6 caractères)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-9 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                      placeholder="Créer un mot de passe"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-xl text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] transition-transform disabled:opacity-60">
                  {loading ? 'Vérification...' : 'Créer mon compte'}
                </button>
                <button type="button" onClick={() => setMode('signup')} className="w-full text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                  ← Renvoyer un code
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
