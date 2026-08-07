import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
}

export function VideoPlayer({ streamUrl, channelName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('Stream ready to play');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const reload = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.load();
    if (isPlaying) {
      video.play();
    }
  };

  return (
    <div
      className="relative w-full aspect-video bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      <div className="absolute top-4 left-4 bg-primary px-4 py-2 rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse-slow" />
          <span className="text-sm font-bold text-primary-foreground uppercase">
            LIVE HD
          </span>
        </div>
      </div>

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={reload}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-12 w-12"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-16 w-16"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-12 w-12"
            >
              <Repeat className="h-6 w-6" />
            </Button>

            <Button
              onClick={toggleMute}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-12 w-12"
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </Button>

            <Button
              onClick={toggleFullscreen}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-12 w-12"
            >
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
