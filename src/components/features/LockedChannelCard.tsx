import { Lock } from 'lucide-react';

interface LockedChannelCardProps {
  channel: { id: string; name: string; logo: string; number?: string; countryFlag?: string; };
  onClick: () => void;
}

export function LockedChannelCard({ channel, onClick }: LockedChannelCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/5 hover:border-yellow-500/30 transition-all active:scale-95 group"
      title="Contenu Premium — Débloquer"
    >
      {/* Blurred logo background */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={channel.logo}
          alt=""
          className="absolute inset-0 w-full h-full object-contain p-2 opacity-15 blur-sm"
          onError={e => { (e.currentTarget.style.display = 'none'); }}
        />
        <div className="absolute inset-0 bg-black/70" />

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/25 transition-colors">
            <Lock className="h-3.5 w-3.5 text-yellow-400" />
          </div>
          <span className="text-[8px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black tracking-wide">
            PREMIUM
          </span>
        </div>

        {/* Country flag */}
        {channel.countryFlag && (
          <span className="absolute top-1 right-1 text-[10px] opacity-40">{channel.countryFlag}</span>
        )}
      </div>

      {/* Name */}
      <div className="px-1.5 py-1.5">
        <p className="text-[9px] font-semibold text-gray-700 truncate">{channel.name}</p>
        {channel.number && <p className="text-[8px] text-gray-800">{channel.number}</p>}
      </div>
    </button>
  );
}
