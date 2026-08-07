import { Header } from '@/components/layout/Header';
import { VideoPlayer } from '@/components/features/VideoPlayer';
import { ChannelCard } from '@/components/features/ChannelCard';
import { Channel } from '@/types/channel';
import { TV_CHANNELS } from '@/constants/channels';

interface PlayerPageProps {
  channel: Channel;
  onBack: () => void;
  onChannelSelect: (channel: Channel) => void;
}

export function PlayerPage({ channel, onBack, onChannelSelect }: PlayerPageProps) {
  return (
    <div className="min-h-screen bg-black">
      <Header title="En Direct" onBackClick={onBack} showBack />

      <VideoPlayer streamUrl={channel.streamUrl} channelName={channel.name} />

      <div className="bg-dark-purple p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-accent">
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {channel.name}
              </h2>
              {channel.description && (
                <p className="text-sm text-muted-foreground italic">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-slow" />
                <span className="text-xs font-bold text-accent uppercase">
                  LIVE HD
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground mb-4 italic">
              By Channel
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {TV_CHANNELS.slice(0, 5).map((ch) => (
                <div key={ch.id} className="flex-shrink-0 w-40">
                  <div
                    onClick={() => onChannelSelect(ch)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-secondary hover:border-accent transition-colors">
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-bold text-foreground mt-2 text-center truncate">
                      {ch.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-foreground mb-4">
              All Channels
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {TV_CHANNELS.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => onChannelSelect(ch)}
                  className="cursor-pointer"
                >
                  <div className="aspect-video rounded-xl overflow-hidden border-2 border-secondary hover:border-accent transition-all hover:scale-105">
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-bold text-foreground mt-2 text-center truncate">
                    {ch.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
