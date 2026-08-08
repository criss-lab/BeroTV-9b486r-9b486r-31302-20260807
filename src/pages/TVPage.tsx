import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Globe, Flame, Eye, Star, Heart, BookmarkPlus, Bell, BellOff,
  LogIn, RefreshCw, WifiOff, Loader2, Satellite, Crown, Users, Sun, Moon, Lock
} from 'lucide-react';
import { WORLD_CHANNELS, CATEGORIES, WorldChannel } from '@/constants/worldChannels';
import { WorldChannelCard } from '@/components/features/WorldChannelCard';
import { StreamPlayer } from '@/components/features/StreamPlayer';
import { ChannelComments } from '@/components/features/ChannelComments';
import { CategoryHero } from '@/components/features/CategoryHero';
import { LockedChannelCard } from '@/components/features/LockedChannelCard';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { channelService } from '@/lib/channelService';
import { loadChannelsFromM3U, IPTV_SOURCES, CATEGORY_SOURCE_MAP, IPTVChannel, deduplicateChannels, LOAD_TIERS } from '@/lib/iptvService';
import { AdBanner } from '@/components/features/AdBanner';
import { EPGGuide } from '@/components/features/EPGGuide';
import { notificationService } from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const PAGE_SIZE = 40;
const FREE_LIMIT = 15;
const ADMIN_EMAIL = 'nahashonnyaga794@gmail.com';

function iptvToWorld(ch: IPTVChannel, idx: number): WorldChannel {
  return {
    id: ch.id || `dyn-${idx}-${ch.name}`,
    name: ch.name,
    logo: ch.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name.slice(0, 2))}&background=1a1a2e&color=f59e0b&size=128&bold=true`,
    streamUrl: ch.streamUrl || '',
    country: ch.country || 'INT',
    countryFlag: ch.countryFlag || '🌐',
    category: ch.category || 'general',
    language: ch.language,
    quality: ch.quality,
    isLive: true,
    number: ch.number,
    description: ch.description,
    isFeatured: false,
  };
}

let _iptvGlobalCache: WorldChannel[] = [];
let _iptvLoaded = false;

// ── Paywall Modal ─────────────────────────────────────────────────────────────
function PaywallModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-xs bg-[#0f0f1e] border border-yellow-500/30 rounded-3xl p-6 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-yellow-400" />
        </div>
        <h2 className="text-lg font-black text-white mb-2">Accès Premium Requis</h2>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Vous avez utilisé vos <strong className="text-white">15 chaînes gratuites</strong>.<br />
          Débloquez l'accès illimité à <strong className="text-yellow-400">100,000+ chaînes</strong>.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5">
          <p className="text-3xl font-black text-yellow-400">100 KES</p>
          <p className="text-xs text-gray-400">pour 4 semaines d'accès illimité</p>
        </div>
        <button onClick={onUpgrade}
          className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-sm mb-2.5 shadow-xl shadow-yellow-500/25 hover:from-yellow-300 hover:to-yellow-500 transition-all">
          🔓 Débloquer Premium
        </button>
        <button onClick={onClose} className="w-full py-2 text-gray-600 text-xs hover:text-gray-400 transition-colors">
          Continuer gratuitement (15 chaînes)
        </button>
      </div>
    </div>
  );
}

export function TVPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [featuredChannel, setFeaturedChannel] = useState<WorldChannel>(WORLD_CHANNELS[0]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [expiryWarning, setExpiryWarning] = useState<string | null>(null);
  const [showEPG, setShowEPG] = useState(false);

  const [iptvChannels, setIptvChannels] = useState<WorldChannel[]>(_iptvGlobalCache);
  const [iptvLoading, setIptvLoading] = useState(!_iptvLoaded);
  const [iptvError, setIptvError] = useState(false);
  const [loadedSources, setLoadedSources] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Merge channels
  const allChannels: WorldChannel[] = deduplicateChannels([...WORLD_CHANNELS, ...iptvChannels]) as WorldChannel[];

  // Check premium/admin access
  useEffect(() => {
    if (!user) { setHasFullAccess(false); return; }
    if (user.email === ADMIN_EMAIL) { setHasFullAccess(true); return; }
    supabase
      .from('premium_subscriptions')
      .select('id, ends_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHasFullAccess(true);
          // Check expiry warning (3 days)
          const endsAt = new Date(data[0].ends_at);
          const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 3) {
            setExpiryWarning(`⚠️ Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`);
          }
        } else {
          setHasFullAccess(false);
        }
      });
  }, [user]);

  // Filter channels
  const filteredChannels = (() => {
    let chs = allChannels;
    if (activeCategory === 'featured') {
      chs = chs.filter(c => c.isFeatured || c.streamUrl);
    } else if (activeCategory !== 'all') {
      const africaCodes = ['CD','NG','ZA','KE','GH','SN','CI','CM','AO','ET','TZ','UG','RW','BJ','BF','ML','NE','TD','SD','LY','MR','SO','MZ','ZW'];
      const europeCodes = ['GB','FR','DE','ES','IT','PT','NL','BE','CH','AT','SE','NO','DK','FI','GR','CZ','HU','RO','BG','RS','HR','SK','UA','AL','PL'];
      const asiaCodes = ['JP','KR','CN','IN','ID','MY','SG','PH','HK','TW','TH','VN','BD','LK','PK'];
      const americasCodes = ['US','CA','MX','BR','AR','CO','CL','VE','PE','EC','BO','PY','UY','DO','PR','CU'];
      if (activeCategory === 'africa') chs = chs.filter(c => africaCodes.includes(c.country));
      else if (activeCategory === 'europe') chs = chs.filter(c => europeCodes.includes(c.country));
      else if (activeCategory === 'asia') chs = chs.filter(c => asiaCodes.includes(c.country));
      else if (activeCategory === 'americas') chs = chs.filter(c => americasCodes.includes(c.country));
      else chs = chs.filter(c => c.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      chs = chs.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.language?.toLowerCase().includes(q)
      );
    }
    return chs;
  })();

  const displayedChannels = filteredChannels.slice(0, (page + 1) * PAGE_SIZE);
  const canLoadMore = displayedChannels.length < filteredChannels.length;

  // Load IPTV
  const loadIPTV = useCallback(async (forceReload = false) => {
    if (_iptvLoaded && !forceReload) { setIptvChannels(_iptvGlobalCache); setIptvLoading(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIptvLoading(true); setIptvError(false);

    const sources = [
      { url: IPTV_SOURCES.freeTv, key: 'free-tv' },
      { url: IPTV_SOURCES.news, key: 'news' },
      { url: IPTV_SOURCES.sports, key: 'sports' },
      { url: IPTV_SOURCES.entertainment, key: 'entmt' },
      { url: IPTV_SOURCES.music, key: 'music' },
    ];

    const existingNames = new Set(WORLD_CHANNELS.map(c => c.streamUrl?.toLowerCase()));
    let anySuccess = false;

    await Promise.allSettled(sources.map(async ({ url, key }) => {
      if (abortRef.current?.signal.aborted) return;
      try {
        const channels = await loadChannelsFromM3U(url, key, abortRef.current?.signal);
        const newOnes = channels
          .filter(c => c.streamUrl && !existingNames.has(c.streamUrl.toLowerCase()))
          .map((c, i) => iptvToWorld(c, i));
        newOnes.forEach(c => existingNames.add(c.streamUrl?.toLowerCase()));
        anySuccess = true;
        setIptvChannels(prev => {
          const combined = deduplicateChannels([...prev, ...newOnes]) as WorldChannel[];
          _iptvGlobalCache = combined;
          return combined;
        });
        setLoadedSources(prev => new Set([...prev, key]));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }));

    const loadTier = async (tier: { url: string; key: string }[]) => {
      await Promise.allSettled(tier.map(async ({ url, key }) => {
        if (abortRef.current?.signal.aborted) return;
        try {
          const channels = await loadChannelsFromM3U(url, key);
          const newOnes = channels
            .filter(c => c.streamUrl && !existingNames.has(c.streamUrl.toLowerCase()))
            .map((c, i) => iptvToWorld(c, i));
          if (newOnes.length > 0) {
            newOnes.forEach(c => existingNames.add(c.streamUrl?.toLowerCase()));
            setIptvChannels(prev => {
              const combined = deduplicateChannels([...prev, ...newOnes]) as WorldChannel[];
              _iptvGlobalCache = combined;
              return combined;
            });
          }
        } catch { /* silent */ }
      }));
    };

    loadTier(LOAD_TIERS.tier2)
      .then(() => loadTier(LOAD_TIERS.tier3))
      .then(() => loadTier(LOAD_TIERS.tier4))
      .then(() => { _iptvLoaded = true; setIptvLoading(false); });

    if (!anySuccess) setIptvError(true);
    setIptvLoading(false);
  }, []);

  useEffect(() => { loadIPTV(); return () => { abortRef.current?.abort(); }; }, [loadIPTV]);

  useEffect(() => {
    setPage(0);
    const srcUrl = CATEGORY_SOURCE_MAP[activeCategory];
    if (srcUrl && !loadedSources.has(`cat-${activeCategory}`)) {
      const existingUrls = new Set(allChannels.map(c => c.streamUrl?.toLowerCase()));
      loadChannelsFromM3U(srcUrl, `cat-${activeCategory}`)
        .then(channels => {
          const newOnes = channels
            .filter(c => c.streamUrl && !existingUrls.has(c.streamUrl.toLowerCase()))
            .map((c, i) => iptvToWorld(c, i + iptvChannels.length));
          if (newOnes.length > 0) {
            setIptvChannels(prev => {
              const combined = deduplicateChannels([...prev, ...newOnes]) as WorldChannel[];
              _iptvGlobalCache = combined;
              return combined;
            });
          }
          setLoadedSources(prev => new Set([...prev, `cat-${activeCategory}`]));
        })
        .catch(() => {});
    }
  }, [activeCategory]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && canLoadMore) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [canLoadMore]);

  // User state
  useEffect(() => {
    if (user) {
      channelService.getLikedChannels().then(ids => setLikedIds(ids));
      notificationService.isSubscribed().then(setNotifEnabled);
    }
  }, [user]);

  useEffect(() => {
    if (user && featuredChannel) {
      channelService.isLiked(featuredChannel.id).then(setIsLiked);
      channelService.isFavorited(featuredChannel.id).then(setIsFavorited);
      channelService.isFollowing(featuredChannel.id).then(setIsFollowed);
    } else {
      setIsLiked(false); setIsFavorited(false); setIsFollowed(false);
    }
  }, [user, featuredChannel]);

  const handleChannelClick = (ch: WorldChannel) => {
    if (!ch.streamUrl) { toast.info(`${ch.name} — flux non disponible`, { duration: 2000 }); return; }
    setFeaturedChannel(ch);
    if (user) channelService.recordView(ch.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockedClick = () => {
    if (!user) { navigate('/login'); return; }
    setShowPaywall(true);
  };

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading('like');
    try { setIsLiked(await channelService.toggleLike(featuredChannel.id)); } finally { setActionLoading(null); }
  };
  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading('fav');
    try { setIsFavorited(await channelService.toggleFavorite(featuredChannel.id)); } finally { setActionLoading(null); }
  };
  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setActionLoading('follow');
    try { setIsFollowed(await channelService.toggleFollow(featuredChannel.id)); } finally { setActionLoading(null); }
  };
  const handleNotifToggle = async () => {
    if (!user) { navigate('/login'); return; }
    if (notifEnabled) {
      await notificationService.unsubscribe(); setNotifEnabled(false); toast.info('Notifications désactivées');
    } else {
      const ok = await notificationService.subscribe(); setNotifEnabled(ok);
      if (ok) toast.success('Notifications activées! 🔔'); else toast.error('Notifications refusées');
    }
  };

  const channelsWithStream = allChannels.filter(c => c.streamUrl);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-20">
      {/* Paywall Modal */}
      {showPaywall && !hasFullAccess && (
        <PaywallModal onClose={() => setShowPaywall(false)} onUpgrade={() => { setShowPaywall(false); navigate('/premium'); }} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/97 backdrop-blur border-b border-white/5 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher parmi 100,000+ chaînes..."
                  className="w-full pl-9 pr-4 py-2 bg-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 border border-white/10 focus:outline-none focus:border-yellow-500/50" />
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <img src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
                  alt="MKV SAT+" className="w-9 h-9 rounded-lg object-contain bg-black border border-yellow-500/30"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <h1 className="text-base font-black text-yellow-500 leading-tight tracking-wide">MKV SAT+</h1>
                  <p className="text-[10px] text-gray-500 leading-tight flex items-center gap-1">
                    {iptvLoading ? (
                      <><Loader2 className="h-2.5 w-2.5 animate-spin text-yellow-500/60" /><span className="text-yellow-500/60">Chargement...</span></>
                    ) : (
                      <><Satellite className="h-2.5 w-2.5 text-yellow-500/60" /> <span className="font-semibold text-yellow-500/80">{channelsWithStream.length.toLocaleString()}+</span> chaînes</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {iptvError && (
                  <button onClick={() => loadIPTV(true)} className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/5">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/5" title="Thème">
                  {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </button>
                <button onClick={() => navigate('/premium')} className={`p-2 transition-colors rounded-lg hover:bg-yellow-500/5 ${hasFullAccess ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}>
                  <Crown className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => navigate('/search')} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/5">
                  <Users className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => setShowSearch(true)} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/5">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Category Hero Strip */}
      <CategoryHero channels={allChannels} onChannelSelect={handleChannelClick} activeChannelId={featuredChannel.id} />

      {/* Top Ad Banner */}
      <AdBanner slot="tv-top" format="native" className="max-w-5xl mx-auto" />

      {/* Featured Player */}
      <div className="bg-black max-w-5xl mx-auto">
        <StreamPlayer streamUrl={featuredChannel.streamUrl} channelName={featuredChannel.name} channelLogo={featuredChannel.logo} />

        {/* Channel info + actions */}
        <div className="px-4 py-3 bg-gradient-to-b from-[#111120] to-[#0a0a14]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-lg">{featuredChannel.countryFlag}</span>
                <h2 className="text-base font-black text-white truncate">{featuredChannel.name}</h2>
                {featuredChannel.quality && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold border border-yellow-500/30 flex-shrink-0">
                    {featuredChannel.quality}
                  </span>
                )}
              </div>
              {featuredChannel.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{featuredChannel.description}</p>
              )}
            </div>
            {featuredChannel.number && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-gray-600">Canal</p>
                <p className="text-xl font-black text-yellow-500">{featuredChannel.number}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleLike} disabled={actionLoading === 'like'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isLiked ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-red-400'}`}>
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Aimé' : 'Aimer'}
            </button>
            <button onClick={handleFavorite} disabled={actionLoading === 'fav'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isFavorited ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-yellow-400'}`}>
              <BookmarkPlus className="h-3.5 w-3.5" />
              {isFavorited ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
            <button onClick={handleFollow} disabled={actionLoading === 'follow'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isFollowed ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-blue-400'}`}>
              {isFollowed ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {isFollowed ? 'Suivi' : 'Suivre'}
            </button>
            <button onClick={handleNotifToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${notifEnabled ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-purple-400'}`}>
              <Bell className={`h-3.5 w-3.5 ${notifEnabled ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{notifEnabled ? 'Notifs ON' : 'Notifs'}</span>
            </button>
            {!user && (
              <button onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 ml-auto">
                <LogIn className="h-3.5 w-3.5" />
                Connexion
              </button>
            )}
          </div>
        </div>

        {/* EPG Guide toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
          <button
            onClick={() => setShowEPG(v => !v)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
              showEPG
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>📅</span> Guide TV / EPG
          </button>
          <span className="text-[10px] text-gray-600">{showEPG ? 'Masquer' : 'Afficher'} le programme</span>
        </div>
        {showEPG && <EPGGuide channel={featuredChannel} />}
        <ChannelComments channelId={featuredChannel.id} channelName={featuredChannel.name} />
      </div>

      {/* Subscription expiry warning */}
      {expiryWarning && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between max-w-5xl mx-auto">
          <p className="text-xs text-orange-300 font-semibold">{expiryWarning}</p>
          <button onClick={() => navigate('/premium')} className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-bold hover:bg-yellow-500/30 flex-shrink-0 ml-2">
            Renouveler
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#0f0f1e] border-y border-white/5 max-w-5xl mx-auto overflow-x-auto scrollbar-hide text-xs">
        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span><span className="font-bold text-white">{channelsWithStream.length.toLocaleString()}</span> live</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span><span className="font-bold text-white">{new Set(allChannels.map(c => c.country)).size}</span> pays</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
          <Eye className="h-3.5 w-3.5 text-green-400" />
          <span><span className="font-bold text-white">{allChannels.length.toLocaleString()}</span> total</span>
        </div>
        {!hasFullAccess && (
          <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0 ml-auto">
            <Lock className="h-3 w-3 text-yellow-500/60" />
            <span className="text-yellow-500/70 text-[10px]">15 gratuites · <button onClick={() => setShowPaywall(true)} className="underline hover:text-yellow-400">100 KES = illimité</button></span>
          </div>
        )}
        {iptvLoading && (
          <div className="flex items-center gap-1 text-yellow-400/70 flex-shrink-0 ml-auto">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px]">Chargement...</span>
          </div>
        )}
        {iptvError && (
          <button onClick={() => loadIPTV(true)} className="flex items-center gap-1 text-red-400 flex-shrink-0 ml-auto text-[10px] hover:text-red-300">
            <WifiOff className="h-3.5 w-3.5" /> Réessayer
          </button>
        )}
        {user && likedIds.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            <span className="font-bold text-yellow-400">{likedIds.length} aimés</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[57px] z-40 bg-[#0a0a14]/97 backdrop-blur border-b border-white/5">
        <div className="flex overflow-x-auto gap-0 scrollbar-hide max-w-5xl mx-auto">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeCategory === cat.id ? 'text-yellow-400 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Channel Grid */}
      <div className="px-3 pt-4 max-w-5xl mx-auto">
        {searchQuery && (
          <p className="text-xs text-gray-500 mb-3 px-1">
            <span className="font-bold text-yellow-400">{filteredChannels.length.toLocaleString()}</span> résultats pour "{searchQuery}"
          </p>
        )}

        {/* Free limit banner */}
        {!hasFullAccess && !searchQuery && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-yellow-500/5 border border-yellow-500/15 flex items-center justify-between">
            <p className="text-[10px] text-yellow-400/80">
              <Lock className="h-3 w-3 inline mr-1" />
              Accès gratuit: <strong>{Math.min(filteredChannels.length, FREE_LIMIT)}</strong> chaînes · Premium: tout illimité
            </p>
            <button onClick={() => setShowPaywall(true)} className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold hover:bg-yellow-500/30 transition-colors">
              100 KES/4sem
            </button>
          </div>
        )}

        {displayedChannels.length === 0 && !iptvLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-gray-700 mb-4" />
            <p className="text-base font-semibold text-gray-400">Aucune chaîne trouvée</p>
            <button onClick={() => loadIPTV(true)} className="mt-4 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm border border-yellow-500/20 hover:bg-yellow-500/20 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Recharger
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {displayedChannels.map((channel, index) => {
                if (!hasFullAccess && index >= FREE_LIMIT) {
                  return <LockedChannelCard key={channel.id} channel={channel} onClick={handleLockedClick} />;
                }
                return (
                  <WorldChannelCard key={channel.id} channel={channel}
                    onClick={() => handleChannelClick(channel)}
                    isActive={featuredChannel.id === channel.id} />
                );
              })}
            </div>

            {displayedChannels.length >= 40 && displayedChannels.length % 80 < PAGE_SIZE && (
              <AdBanner slot={`tv-mid-${page}`} className="my-4" />
            )}

            <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
              {canLoadMore ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-500/40" />
                  <span>Chargement de plus...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-700">✓ {filteredChannels.length.toLocaleString()} chaînes affichées</p>
                  {iptvLoading && (
                    <div className="flex items-center gap-1 text-xs text-yellow-500/60">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Chargement sources supplémentaires...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
