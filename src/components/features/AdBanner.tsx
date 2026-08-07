// AdBanner — Google AdSense integration + house ads fallback
// Replace ADSENSE_CLIENT_ID and slot IDs with your real AdSense credentials

export const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXX'; // Replace with real Publisher ID
export const ADS_ENABLED = false; // Set true when AdSense is approved

interface AdBannerProps {
  slot: string;
  className?: string;
  format?: 'banner' | 'rectangle' | 'leaderboard' | 'native' | 'interstitial';
  adSlotId?: string; // Real Google AdSense slot ID
}

// House ads for demo / before AdSense approval
const HOUSE_ADS = [
  {
    id: 'mkv-premium',
    title: '🌟 MKV SAT+ Premium',
    subtitle: 'Sans pub • HD/4K • 100,000+ chaînes mondiales',
    cta: 'Découvrir →',
    href: '/premium',
    gradient: 'from-yellow-500/15 to-yellow-700/5',
    border: 'border-yellow-500/20',
    ctaColor: 'bg-yellow-500 text-black',
    ctaHover: 'hover:bg-yellow-400',
  },
  {
    id: 'mkv-community',
    title: '📡 Communauté MKV SAT+',
    subtitle: 'Partagez clips, tendances et vivez en direct',
    cta: 'Rejoindre →',
    href: '/community',
    gradient: 'from-blue-500/15 to-blue-700/5',
    border: 'border-blue-500/20',
    ctaColor: 'bg-blue-500 text-white',
    ctaHover: 'hover:bg-blue-400',
  },
  {
    id: 'mkv-podcast',
    title: '🎙️ Lancez votre Podcast',
    subtitle: 'Uploadez vos épisodes et diffusez en direct',
    cta: 'Commencer →',
    href: '/podcasts',
    gradient: 'from-purple-500/15 to-purple-700/5',
    border: 'border-purple-500/20',
    ctaColor: 'bg-purple-500 text-white',
    ctaHover: 'hover:bg-purple-400',
  },
];

export function AdBanner({ slot, className = '', format = 'banner', adSlotId }: AdBannerProps) {
  const adIdx = slot.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % HOUSE_ADS.length;
  const ad = HOUSE_ADS[adIdx];

  // === GOOGLE ADSENSE (Activate when approved) ===
  if (ADS_ENABLED && adSlotId) {
    return (
      <div className={`${className} overflow-hidden`}>
        {/* Google AdSense display ad */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: format === 'banner' ? '50px' : format === 'rectangle' ? '250px' : '90px' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={adSlotId}
          data-ad-format={format === 'native' ? 'fluid' : 'auto'}
          data-full-width-responsive="true"
        />
        <span className="sr-only">Advertisement</span>
      </div>
    );
  }

  // === HOUSE ADS (Shown while waiting for AdSense approval) ===
  if (format === 'native') {
    return (
      <div className={`${className} px-3 py-1.5`}>
        <a
          href={ad.href}
          className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${ad.gradient} border ${ad.border} p-3 hover:opacity-90 transition-opacity relative`}
        >
          <span className="absolute top-1 right-2 text-[8px] text-gray-700 font-medium">Pub</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{ad.title}</p>
            <p className="text-[10px] text-gray-400 truncate">{ad.subtitle}</p>
          </div>
          <span className={`flex-shrink-0 px-3 py-1.5 ${ad.ctaColor} ${ad.ctaHover} rounded-full text-[11px] font-bold whitespace-nowrap`}>
            {ad.cta}
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden px-3 my-1`}>
      <a
        href={ad.href}
        className={`block rounded-xl bg-gradient-to-r ${ad.gradient} border ${ad.border} p-3 hover:opacity-90 transition-opacity`}
      >
        <span className="absolute top-2 right-3 text-[9px] text-gray-600 font-medium">Sponsorisé</span>
        <p className="text-xs font-bold text-white pr-14">{ad.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 pr-4">{ad.subtitle}</p>
        <span className={`inline-flex items-center mt-2 px-4 py-1.5 ${ad.ctaColor} ${ad.ctaHover} rounded-full text-[11px] font-bold`}>
          {ad.cta}
        </span>
      </a>
    </div>
  );
}

export function VideoAdSlot({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10 relative">
      <div className="text-center">
        <div className="text-4xl mb-2">📺</div>
        <p className="text-sm text-gray-400 font-semibold">Espace Publicitaire Vidéo</p>
        <p className="text-xs text-gray-600 mt-1">Intégrez Google AdSense ou DFP/GAM</p>
      </div>
      {onComplete && (
        <button
          onClick={onComplete}
          className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full border border-white/20 hover:bg-black/90 transition-colors"
        >
          Ignorer →
        </button>
      )}
    </div>
  );
}
