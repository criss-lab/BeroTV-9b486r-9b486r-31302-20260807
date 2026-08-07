import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Bell, LogIn } from 'lucide-react';
import { WORLD_CHANNELS } from '@/constants/worldChannels';
import { WorldChannelCard } from '@/components/features/WorldChannelCard';
import { channelService } from '@/lib/channelService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';

export function FavoritesPage() {
  const [likedChannels, setLikedChannels] = useState(WORLD_CHANNELS.slice(0, 0));
  const [favoriteChannels, setFavoriteChannels] = useState(WORLD_CHANNELS.slice(0, 0));
  const [followedChannels, setFollowedChannels] = useState(WORLD_CHANNELS.slice(0, 0));
  const [activeTab, setActiveTab] = useState<'liked' | 'favorites' | 'followed'>('liked');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      channelService.getLikedChannels().then(ids => {
        setLikedChannels(WORLD_CHANNELS.filter(c => ids.includes(c.id)));
      });
      channelService.getFavoriteChannels().then(ids => {
        setFavoriteChannels(WORLD_CHANNELS.filter(c => ids.includes(c.id)));
      });
      channelService.getFollowedChannels().then(ids => {
        setFollowedChannels(WORLD_CHANNELS.filter(c => ids.includes(c.id)));
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-yellow-500/60" />
          </div>
          <h2 className="text-xl font-black text-white mb-3">Vos Favoris</h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Connectez-vous pour sauvegarder vos chaînes favorites, suivre des chaînes et retrouver votre contenu préféré.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-base shadow-2xl shadow-yellow-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Se connecter
          </button>
        </div>
        <NavigationBar />
      </div>
    );
  }

  const tabs = [
    { id: 'liked' as const, label: 'Aimés', icon: Heart, count: likedChannels.length, color: 'text-red-400' },
    { id: 'favorites' as const, label: 'Favoris', icon: Star, count: favoriteChannels.length, color: 'text-yellow-400' },
    { id: 'followed' as const, label: 'Suivis', icon: Bell, count: followedChannels.length, color: 'text-blue-400' },
  ];

  const currentChannels = activeTab === 'liked' ? likedChannels : activeTab === 'favorites' ? favoriteChannels : followedChannels;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <h1 className="text-lg font-black text-white max-w-5xl mx-auto">Mes Chaînes</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/5 max-w-5xl mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-4 transition-all border-b-2 ${
              activeTab === tab.id ? 'border-yellow-500 bg-yellow-500/5' : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : 'text-gray-600'}`} />
              <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </div>
            <span className={`text-lg font-black ${activeTab === tab.id ? 'text-yellow-400' : 'text-gray-700'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-5xl mx-auto">
        {currentChannels.length === 0 ? (
          <div className="py-16 text-center">
            {tabs.find(t => t.id === activeTab)?.icon && (
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'liked' && <Heart className="h-8 w-8 text-gray-700" />}
                {activeTab === 'favorites' && <Star className="h-8 w-8 text-gray-700" />}
                {activeTab === 'followed' && <Bell className="h-8 w-8 text-gray-700" />}
              </div>
            )}
            <p className="text-base font-semibold text-gray-500">Aucune chaîne</p>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'liked' && 'Aimez des chaînes pour les retrouver ici'}
              {activeTab === 'favorites' && 'Ajoutez des favoris pour les retrouver ici'}
              {activeTab === 'followed' && 'Suivez des chaînes pour les retrouver ici'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-full text-sm hover:bg-yellow-400 transition-colors"
            >
              Découvrir des chaînes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {currentChannels.map(channel => (
              <WorldChannelCard
                key={channel.id}
                channel={channel}
                onClick={() => navigate('/')}
              />
            ))}
          </div>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
