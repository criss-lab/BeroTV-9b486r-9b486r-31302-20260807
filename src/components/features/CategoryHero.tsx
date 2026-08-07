import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { WorldChannel } from '@/constants/worldChannels';

interface CategoryHeroProps {
  channels: WorldChannel[];
  onChannelSelect: (ch: WorldChannel) => void;
  activeChannelId?: string;
}

const CAT_INFO: Record<string, { label: string; color: string }> = {
  news: { label: '📰 Info', color: 'bg-blue-600/80' },
  sports: { label: '⚽ Sport', color: 'bg-green-600/80' },
  entertainment: { label: '🎬 Divertissement', color: 'bg-purple-600/80' },
  music: { label: '🎵 Musique', color: 'bg-pink-600/80' },
  documentary: { label: '🎥 Documentaire', color: 'bg-orange-600/80' },
  kids: { label: '🎪 Enfants', color: 'bg-yellow-600/80' },
  religious: { label: '✝️ Religion', color: 'bg-indigo-600/80' },
  general: { label: '📺 Général', color: 'bg-gray-600/80' },
  africa: { label: '🌍 Afrique', color: 'bg-amber-600/80' },
  arabic: { label: '🌙 Arabe', color: 'bg-teal-600/80' },
};

export function CategoryHero({ channels, onChannelSelect, activeChannelId }: CategoryHeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroChannels = (() => {
    const cats = ['news', 'sports', 'entertainment', 'music', 'documentary', 'kids', 'religious', 'africa'];
    const picks: WorldChannel[] = [];
    const seenIds = new Set<string>();

    for (const cat of cats) {
      const ch = channels.find(c =>
        c.category === cat && c.streamUrl && c.logo &&
        !c.logo.includes('ui-avatars') && !seenIds.has(c.id)
      );
      if (ch) { picks.push(ch); seenIds.add(ch.id); }
    }

    for (const ch of channels) {
      if (picks.length >= 10) break;
      if (!seenIds.has(ch.id) && ch.streamUrl && ch.logo && !ch.logo.includes('ui-avatars')) {
        picks.push(ch); seenIds.add(ch.id);
      }
    }
    return picks.slice(0, 10);
  })();

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIdx(i => (i + 1) % Math.max(heroChannels.length, 1));
    }, 5000);
  };

  useEffect(() => {
    if (heroChannels.length > 0) startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroChannels.length]);

  if (heroChannels.length === 0) return null;

  const current = heroChannels[currentIdx] || heroChannels[0];
  const catInfo = CAT_INFO[current.category] || CAT_INFO.general;

  const handleClick = (ch: WorldChannel) => {
    onChannelSelect(ch);
    startTimer();
  };

  return (
    <div className="bg-black">
      {/* Hero Banner */}
      <div
        className="relative h-28 cursor-pointer overflow-hidden"
        onClick={() => handleClick(current)}
      >
        {current.logo && (
          <div className="absolute inset-0">
            <img src={current.logo} alt="" className="w-full h-full object-cover scale-150 blur-2xl opacity-25"
              onError={e => { (e.currentTarget.style.display = 'none'); }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="relative z-10 flex items-center gap-4 h-full px-4">
          <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
            <img src={current.logo} alt={current.name} className="w-full h-full object-contain p-1.5"
              onError={e => { (e.currentTarget.style.display = 'none'); }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold text-white ${catInfo.color}`}>
                {catInfo.label}
              </span>
              <span className="flex items-center gap-1 text-[9px] bg-red-600 px-1.5 py-0.5 rounded font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                LIVE
              </span>
            </div>
            <h3 className="text-sm font-black text-white truncate leading-tight">{current.name}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {current.countryFlag} {current.country}{current.quality ? ` · ${current.quality}` : ''}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleClick(current); }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors active:scale-95"
          >
            <Play className="h-4 w-4 text-black fill-black ml-0.5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {heroChannels.map((_, i) => (
            <button key={i}
              onClick={e => { e.stopPropagation(); setCurrentIdx(i); startTimer(); }}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-5 bg-yellow-400' : 'w-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Horizontal channel strip */}
      <div className="flex overflow-x-auto gap-2 px-3 py-2 scrollbar-hide border-b border-white/5">
        {heroChannels.map((ch, i) => (
          <button key={ch.id}
            onClick={() => { setCurrentIdx(i); handleClick(ch); }}
            className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              i === currentIdx || activeChannelId === ch.id
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#1a1a2e] border border-white/10 overflow-hidden flex items-center justify-center">
              <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain p-1"
                onError={e => { (e.currentTarget.style.display = 'none'); }} />
            </div>
            <span className={`text-[8px] font-bold max-w-[44px] truncate text-center ${
              i === currentIdx || activeChannelId === ch.id ? 'text-yellow-400' : 'text-gray-600'
            }`}>
              {ch.name.slice(0, 8)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
