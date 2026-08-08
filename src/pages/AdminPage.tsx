import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { NavigationBar } from '@/components/layout/NavigationBar';
import {
  Shield, Users, Crown, TrendingUp, DollarSign, MessageSquare,
  Eye, Heart, ArrowLeft, Loader2, RefreshCw, BarChart2, Tv, AlertTriangle
} from 'lucide-react';

const ADMIN_EMAIL = 'nahashonnyaga794@gmail.com';

interface DashboardStats {
  totalUsers: number;
  premiumActive: number;
  premiumRevenue: number;
  totalPosts: number;
  totalChannelViews: number;
}

interface RecentPost {
  id: string;
  content: string;
  like_count: number;
  created_at: string;
  user_id: string;
}

interface TopChannel {
  channel_id: string;
  total_views: number;
  total_likes: number;
  total_follows: number;
}

interface RecentSub {
  id: string;
  plan: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-[#0f0f1e] border border-white/5 rounded-2xl p-4">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs font-bold text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, premiumActive: 0, premiumRevenue: 0, totalPosts: 0, totalChannelViews: 0 });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [topChannels, setTopChannels] = useState<TopChannel[]>([]);
  const [recentSubs, setRecentSubs] = useState<RecentSub[]>([]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        usersRes,
        premiumRes,
        postsCountRes,
        recentPostsRes,
        topChannelsRes,
        recentSubsRes,
        channelStatsRes,
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('premium_subscriptions').select('id', { count: 'exact', head: true })
          .eq('status', 'active').gte('ends_at', new Date().toISOString()),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }),
        supabase.from('community_posts').select('id, content, like_count, created_at, user_id')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('channel_statistics').select('channel_id, total_views, total_likes, total_follows')
          .order('total_views', { ascending: false }).limit(10),
        supabase.from('premium_subscriptions').select('id, plan, status, starts_at, ends_at')
          .order('starts_at', { ascending: false }).limit(8),
        supabase.from('channel_statistics').select('total_views'),
      ]);

      const totalViews = (channelStatsRes.data || []).reduce((acc, r) => acc + (r.total_views || 0), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        premiumActive: premiumRes.count || 0,
        premiumRevenue: (premiumRes.count || 0) * 100,
        totalPosts: postsCountRes.count || 0,
        totalChannelViews: totalViews,
      });

      setRecentPosts((recentPostsRes.data || []) as RecentPost[]);
      setTopChannels((topChannelsRes.data || []) as TopChannel[]);
      setRecentSubs((recentSubsRes.data || []) as RecentSub[]);
    } catch (e) {
      console.error('Admin data error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/60 mx-auto mb-4" />
          <h2 className="text-lg font-black text-white mb-2">Accès Refusé</h2>
          <p className="text-sm text-gray-400 mb-4">Cette page est réservée aux administrateurs.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-xl text-sm border border-yellow-500/20">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/97 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Admin Dashboard</h1>
              <p className="text-[10px] text-green-400">✓ Connecté en tant qu'admin</p>
            </div>
          </div>
          <button onClick={loadData} className="ml-auto p-2 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500/50" />
        </div>
      ) : (
        <div className="px-4 py-4 max-w-5xl mx-auto space-y-6">

          {/* Stats Grid */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Vue d'ensemble</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard icon={Users} label="Utilisateurs total" value={stats.totalUsers} color="bg-blue-600/30" />
              <StatCard icon={Crown} label="Abonnés Premium" value={stats.premiumActive} sub="Actifs en ce moment" color="bg-yellow-600/30" />
              <StatCard icon={DollarSign} label="Revenus" value={`${stats.premiumRevenue.toLocaleString()} KES`} sub="Abonnements actifs" color="bg-green-600/30" />
              <StatCard icon={MessageSquare} label="Posts communauté" value={stats.totalPosts} color="bg-purple-600/30" />
              <StatCard icon={Eye} label="Vues chaînes" value={stats.totalChannelViews} color="bg-orange-600/30" />
              <StatCard icon={Tv} label="Chaînes actives" value="100K+" sub="Via iptv-org API" color="bg-teal-600/30" />
            </div>
          </div>

          {/* Revenue Progress */}
          <div className="bg-[#0f0f1e] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-black text-white">Revenus mensuels estimés</h3>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-black text-yellow-400">{stats.premiumRevenue.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-400 mb-1">KES</span>
              <span className="text-xs text-gray-600 mb-1">/ cycle 4 semaines</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                style={{ width: `${Math.min((stats.premiumActive / Math.max(stats.totalUsers, 1)) * 100 * 5, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              Taux de conversion: {stats.totalUsers > 0 ? ((stats.premiumActive / stats.totalUsers) * 100).toFixed(1) : 0}%
            </p>
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-[#0f0f1e] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-black text-white">Abonnements récents</h3>
            </div>
            {recentSubs.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-600">Aucun abonnement enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentSubs.map(sub => (
                  <div key={sub.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{sub.plan}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(sub.starts_at).toLocaleDateString('fr-FR')} → {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      sub.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : sub.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Channels */}
          {topChannels.length > 0 && (
            <div className="bg-[#0f0f1e] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-black text-white">Chaînes les plus vues</h3>
              </div>
              <div className="divide-y divide-white/5">
                {topChannels.map((ch, i) => (
                  <div key={ch.channel_id} className="px-4 py-3 flex items-center gap-3">
                    <span className={`text-xs font-black w-5 flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{ch.channel_id}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-shrink-0">
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {ch.total_views}</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3 text-red-400/60" /> {ch.total_likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Community Posts */}
          {recentPosts.length > 0 && (
            <div className="bg-[#0f0f1e] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-black text-white">Posts récents</h3>
              </div>
              <div className="divide-y divide-white/5">
                {recentPosts.map(post => (
                  <div key={post.id} className="px-4 py-3">
                    <p className="text-xs text-gray-300 line-clamp-2 mb-1">{post.content}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <span>{new Date(post.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5 text-red-400/60" /> {post.like_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="bg-[#0f0f1e] border border-yellow-500/10 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">Actions Admin</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Voir tous les utilisateurs', action: () => navigate('/search') },
                { label: 'Accès illimité actif', action: () => {} },
                { label: 'Configurer PesaPal', action: () => window.open('https://www.pesapal.com', '_blank') },
                { label: 'Publier annonce', action: () => navigate('/community') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left">
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <NavigationBar />
    </div>
  );
}
