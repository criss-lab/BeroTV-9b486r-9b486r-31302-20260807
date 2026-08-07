import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { ChannelCard } from '@/components/features/ChannelCard';
import { VideoPlayer } from '@/components/features/VideoPlayer';
import { TV_CHANNELS } from '@/constants/channels';
import { Channel } from '@/types/channel';
import { Tv, Radio, Monitor, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomePageProps {
  onChannelSelect: (channel: Channel) => void;
  onNavigate: (page: string) => void;
}

export function HomePage({ onChannelSelect, onNavigate }: HomePageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const featuredChannel = TV_CHANNELS[0]; // BARAKA TV as default featured channel

  return (
    <div className="min-h-screen bg-dark-purple pb-20">
      <Header title="MKV SAT+ LE MONDE DANS LA POCHE" onMenuClick={() => setIsDrawerOpen(true)} />
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={onNavigate}
      />

      <div className="relative">
        {/* Featured Video Player */}
        <div className="bg-black">
          <div className="relative w-full max-w-4xl mx-auto">
            <VideoPlayer channel={featuredChannel} />
            
            {/* Channel Info Below Video */}
            <div className="bg-black px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {featuredChannel.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">Canal :</span>
                  <span className="text-xl font-bold text-white">{featuredChannel.number}</span>
                </div>
              </div>
              {featuredChannel.description && (
                <p className="text-sm text-green-500 mt-1">
                  {featuredChannel.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Channel Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-3 p-3 max-w-4xl mx-auto bg-gradient-to-b from-gray-900 to-black">
          {TV_CHANNELS.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onClick={() => onChannelSelect(channel)}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-secondary shadow-2xl">
        <div className="grid grid-cols-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 py-4 text-accent hover:bg-secondary/80 rounded-none"
          >
            <Tv className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">TV LIVE</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 py-4 text-primary-foreground hover:bg-secondary/80 rounded-none"
            onClick={() => onNavigate('radios')}
          >
            <Radio className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">RADIOS</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 py-4 text-primary-foreground hover:bg-secondary/80 rounded-none"
          >
            <Monitor className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">AFRO TV</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-2 py-4 text-primary-foreground hover:bg-secondary/80 rounded-none"
          >
            <List className="h-6 w-6" />
            <span className="text-xs font-bold uppercase">GENERALISTE</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
