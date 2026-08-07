import { Play } from 'lucide-react';
import { Channel } from '@/types/channel';

interface ChannelCardProps {
  channel: Channel;
  onClick: () => void;
}

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all hover:scale-105 shadow-lg"
    >
      {/* Logo Area with White Background */}
      <div className="aspect-[4/3] bg-white relative overflow-hidden flex items-center justify-center p-2">
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/300x200/ffffff/000000?text=' + encodeURIComponent(channel.name);
          }}
        />
        
        {/* LIVE Badge */}
        {channel.isLive && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase">
              LIVE
            </span>
          </div>
        )}

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-xl">
            <Play className="h-6 w-6 text-black fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Channel Name and Number */}
      <div className="bg-black px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-[11px] font-bold text-yellow-500 uppercase tracking-wide truncate flex-1">
            {channel.name}
          </h3>
          {channel.number && (
            <span className="text-[11px] font-bold text-gray-300 flex-shrink-0">
              {channel.number}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
