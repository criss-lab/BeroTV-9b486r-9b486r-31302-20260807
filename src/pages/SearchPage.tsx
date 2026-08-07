import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, UserMinus, Loader2, User2, Users, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { userSearchService, UserSearchResult } from '@/lib/socialService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await userSearchService.searchUsers(q);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleFollow = async (targetId: string) => {
    if (!user) { navigate('/login'); return; }
    setFollowLoading(targetId);
    try {
      const following = await userSearchService.toggleFollow(targetId);
      setResults(prev => prev.map(u =>
        u.id === targetId ? {
          ...u,
          is_following: following,
          follower_count: (u.follower_count || 0) + (following ? 1 : -1),
        } : u
      ));
      toast.success(following ? 'Suivi avec succès' : 'Désabonné');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-black text-white">Rechercher des utilisateurs</h1>
        </div>
        <div className="px-4 pb-3 max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom d'utilisateur ou email..."
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/40"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-500/50" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">Aucun utilisateur trouvé</p>
            <p className="text-xs text-gray-600 mt-1">pour "{query}"</p>
          </div>
        )}

        {!loading && !query && (
          <div className="text-center py-12">
            <User2 className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">Trouvez des utilisateurs MKV SAT+</p>
            <p className="text-xs text-gray-600 mt-1">Tapez un nom ou email pour chercher</p>
          </div>
        )}

        <div className="space-y-2">
          {results.map(profile => (
            <div key={profile.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border border-yellow-500/20 flex items-center justify-center text-base font-bold text-yellow-400 flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt={profile.username} />
                ) : (
                  (profile.username || profile.email).slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white truncate">{profile.username || profile.email}</p>
                  {profile.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
                </div>
                {profile.bio && <p className="text-xs text-gray-500 truncate mt-0.5">{profile.bio}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-600">{profile.follower_count || 0} abonnés</span>
                  <span className="text-[10px] text-gray-600">{profile.following_count || 0} abonnements</span>
                </div>
              </div>
              {user && user.id !== profile.id && (
                <button
                  onClick={() => handleFollow(profile.id)}
                  disabled={followLoading === profile.id}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                    profile.is_following
                      ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                  }`}
                >
                  {followLoading === profile.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : profile.is_following ? (
                    <><UserMinus className="h-3.5 w-3.5" /> Suivi</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Suivre</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
