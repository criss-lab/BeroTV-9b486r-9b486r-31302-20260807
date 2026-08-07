import { Play, Signal } from 'lucide-react';
import { WorldChannel } from '@/constants/worldChannels';

interface WorldChannelCardProps {
  channel: WorldChannel;
  onClick: () => void;
  isActive?: boolean;
}

export function WorldChannelCard({ channel, onClick, isActive }: WorldChannelCardProps) {
  const hasStream = !!channel.streamUrl;

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
        isActive
          ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/30'
          : 'ring-1 ring-white/10 hover:ring-yellow-500/60'
      }`}
    >
      {/* Logo Area */}
      <div className="aspect-[16/10] bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain p-2"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=1a1a2e&color=f59e0b&size=128&bold=true`;
          }}
        />

        {/* LIVE Badge */}
        {hasStream && channel.isLive && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-600 px-1.5 py-0.5 rounded-md shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wide">LIVE</span>
          </div>
        )}

        {/* Quality badge */}
        {channel.quality && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold text-yellow-400 border border-yellow-500/30">
            {channel.quality}
          </div>
        )}

        {/* No stream overlay */}
        {!hasStream && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Signal className="h-5 w-5 text-gray-500" />
          </div>
        )}

        {/* Hover play overlay */}
        {hasStream && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/40 backdrop-blur-sm">
            <div className="w-11 h-11 rounded-full bg-yellow-500 flex items-center justify-center shadow-xl ring-2 ring-yellow-300/50">
              <Play className="h-5 w-5 text-black fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-black px-2 py-1.5 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none flex-shrink-0">{channel.countryFlag}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide truncate leading-tight">
              {channel.name}
            </p>
            {channel.number && (
              <p className="text-[9px] text-gray-500">CH {channel.number}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
