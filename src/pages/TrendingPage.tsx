import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Eye, TrendingUp, Star, Heart, Users, MessageSquare } from 'lucide-react';
import { WORLD_CHANNELS } from '@/constants/worldChannels';
import { WorldChannelCard } from '@/components/features/WorldChannelCard';
import { channelService } from '@/lib/channelService';
import { communityService, Post } from '@/lib/communityService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { AdBanner } from '@/components/features/AdBanner';
import { useAuth } from '@/hooks/useAuth';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

export function TrendingPage() {
  const [topChannels, setTopChannels] = useState(WORLD_CHANNELS.filter(c => c.streamUrl).slice(0, 12));
  const [likedChannels, setLikedChannels] = useState(WORLD_CHANNELS.slice(0, 0));
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    communityService.getTrendingPosts(6).then(setTrendingPosts);

    if (user) {
      channelService.getLikedChannels().then(ids => {
        setLikedChannels(WORLD_CHANNELS.filter(c => ids.includes(c.id)));
      });
      channelService.getTrendingChannels().then(stats => {
        const ordered = stats.map(s => WORLD_CHANNELS.find(c => c.id === s.channel_id)).filter(Boolean) as typeof WORLD_CHANNELS;
        if (ordered.length > 0) setTopChannels(ordered);
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Tendances</h1>
            <p className="text-xs text-gray-500">Chaînes & posts populaires</p>
          </div>
        </div>
      </header>

      <AdBanner slot="trending-top" className="max-w-5xl mx-auto" />

      <div className="px-4 py-4 max-w-5xl mx-auto space-y-8">
        {/* Trending Channels Now */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-black text-white">Chaînes tendances</h2>
            <span className="ml-auto text-xs text-gray-500">{topChannels.length} chaînes</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {topChannels.slice(0, 9).map(channel => (
              <WorldChannelCard key={channel.id} channel={channel} onClick={() => navigate('/')} />
            ))}
          </div>
        </section>

        {/* Trending Community Posts */}
        {trendingPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-black text-white">Posts tendances</h2>
              <button
                onClick={() => navigate('/community')}
                className="ml-auto text-xs text-yellow-400 font-semibold"
              >
                Voir tout →
              </button>
            </div>
            <div className="space-y-2">
              {trendingPosts.slice(0, 4).map(post => (
                <div
                  key={post.id}
                  onClick={() => navigate('/community')}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-all hover:bg-white/8"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/30 to-purple-700/20 border border-white/10 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
                    {(post.user?.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{post.user?.username || 'User'}</span>
                      <span className="text-[10px] text-gray-600">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Heart className="h-3 w-3" />{post.like_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-600">
                        <MessageSquare className="h-3 w-3" />{post.view_count || 0} vues
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Most Viewed Channels */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-black text-white">Plus regardés</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {WORLD_CHANNELS.filter(c => c.streamUrl).slice(0, 6).map(channel => (
              <WorldChannelCard key={channel.id} channel={channel} onClick={() => navigate('/')} />
            ))}
          </div>
        </section>

        {/* Ad */}
        <AdBanner slot="trending-mid" />

        {/* User Liked */}
        {user ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-red-400" />
              <h2 className="text-base font-black text-white">Vos aimés</h2>
            </div>
            {likedChannels.length === 0 ? (
              <div className="py-8 text-center rounded-xl bg-white/5 border border-white/5">
                <Heart className="h-10 w-10 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune chaîne aimée</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {likedChannels.map(channel => (
                  <WorldChannelCard key={channel.id} channel={channel} onClick={() => navigate('/')} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="py-8 text-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <TrendingUp className="h-10 w-10 text-yellow-500/50 mx-auto mb-3" />
            <p className="text-sm font-semibold text-yellow-400">Connectez-vous pour vos tendances</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Chaînes aimées, communauté et plus</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-full text-sm hover:bg-yellow-400 transition-colors"
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Join Community CTA */}
        <div
          onClick={() => navigate('/community')}
          className="cursor-pointer p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center gap-4 hover:border-blue-500/40 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Rejoignez la Communauté</p>
            <p className="text-xs text-gray-400">Partagez, commentez, tendancez</p>
          </div>
          <span className="ml-auto text-yellow-400 text-sm">→</span>
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
