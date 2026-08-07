import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, WifiOff, RefreshCw, Settings } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  channelName: string;
  channelLogo?: string;
  onError?: () => void;
  compact?: boolean;
}

// HLS.js optimal config for live streaming
const HLS_CONFIG: Partial<Hls['config']> = {
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 60,
  maxBufferLength: 30,
  maxMaxBufferLength: 90,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  highBufferWatchdogPeriod: 2,
  nudgeOffset: 0.2,
  nudgeMaxRetry: 5,
  maxFragLookUpTolerance: 0.25,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 10,
  liveDurationInfinity: true,
  levelLoadingTimeOut: 20000,
  manifestLoadingTimeOut: 20000,
  fragLoadingTimeOut: 30000,
  levelLoadingMaxRetry: 6,
  fragLoadingMaxRetry: 6,
  manifestLoadingMaxRetry: 6,
  levelLoadingRetryDelay: 1000,
  fragLoadingRetryDelay: 1000,
  manifestLoadingRetryDelay: 500,
  startFragPrefetch: true,
  testBandwidth: true,
  progressive: false,
  // XHR timeout + CORS headers
  xhrSetup: (xhr: XMLHttpRequest, url: string) => {
    xhr.timeout = 25000;
    // Try to set headers for streams that need them
    try { xhr.setRequestHeader('Accept', '*/*'); } catch { /* skip */ }
  },
};

// CORS proxy fallback for blocked streams
function withProxy(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

export function StreamPlayer({ streamUrl, channelName, channelLogo, onError, compact = false }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [quality, setQuality] = useState('AUTO');
  const [useProxy, setUseProxy] = useState(false);

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  };

  const initPlayer = useCallback((url: string, isRetry = false) => {
    const video = videoRef.current;
    if (!video || !url) return;

    destroyHls();
    setIsLoading(true);
    setHasError(false);

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setRetrying(false);
        retryCountRef.current = 0;
        // Set quality label
        if (data.levels && data.levels.length > 0) {
          const maxH = Math.max(...data.levels.map((l: { height: number }) => l.height || 0));
          if (maxH >= 1080) setQuality('FHD');
          else if (maxH >= 720) setQuality('HD');
          else if (maxH >= 480) setQuality('SD');
          else setQuality('AUTO');
        }
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked — set muted and retry
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsLoading(false));
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('HLS error:', data.type, data.details, url);
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Retry up to 3 times with proxy
            if (retryCountRef.current < 3) {
              retryCountRef.current++;
              setRetrying(true);
              retryTimerRef.current = setTimeout(() => {
                const proxyUrl = retryCountRef.current >= 2 ? withProxy(streamUrl) : url;
                initPlayer(proxyUrl, true);
              }, 2000 * retryCountRef.current);
            } else {
              setHasError(true);
              setIsLoading(false);
              setRetrying(false);
              onError?.();
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            // Try with proxy
            if (!useProxy && retryCountRef.current < 2) {
              retryCountRef.current++;
              setRetrying(true);
              setUseProxy(true);
              retryTimerRef.current = setTimeout(() => {
                initPlayer(withProxy(streamUrl), true);
              }, 2000);
            } else {
              setHasError(true);
              setIsLoading(false);
              setRetrying(false);
              onError?.();
            }
          }
        } else {
          // Non-fatal — HLS.js will recover
          hls.startLoad();
        }
      });

      hls.on(Hls.Events.BUFFER_STALLED_ERROR, () => {
        hls.startLoad(-1);
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      const handleLoaded = () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
        video.removeEventListener('loadedmetadata', handleLoaded);
      };
      const handleErr = () => {
        if (!useProxy && retryCountRef.current < 2) {
          retryCountRef.current++;
          video.src = withProxy(streamUrl);
          setUseProxy(true);
        } else {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }
        video.removeEventListener('error', handleErr);
      };
      video.addEventListener('loadedmetadata', handleLoaded);
      video.addEventListener('error', handleErr);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [streamUrl, useProxy, onError]);

  useEffect(() => {
    if (!streamUrl) { setHasError(true); setIsLoading(false); return; }
    retryCountRef.current = 0;
    setUseProxy(false);
    initPlayer(streamUrl);
    return destroyHls;
  }, [streamUrl]);

  const manualRetry = () => {
    retryCountRef.current = 0;
    setUseProxy(false);
    initPlayer(streamUrl);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen?.();
  };

  const showCtrl = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  };

  return (
    <div
      className={`relative bg-black overflow-hidden select-none ${compact ? 'rounded-xl' : ''}`}
      onMouseMove={showCtrl}
      onTouchStart={showCtrl}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        playsInline
        autoPlay
        muted={isMuted}
        onStalled={() => hlsRef.current?.startLoad(-1)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          if (!useProxy) { setUseProxy(true); initPlayer(withProxy(streamUrl)); }
          else { setHasError(true); setIsLoading(false); }
        }}
      />

      {/* Loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm pointer-events-none">
          {channelLogo && (
            <img src={channelLogo} alt={channelName} className="w-16 h-16 object-contain mb-4 opacity-50 rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <Loader2 className="h-8 w-8 text-yellow-500 animate-spin mb-3" />
          <p className="text-sm text-gray-300 font-semibold">{retrying ? 'Reconnexion...' : 'Connexion au flux...'}</p>
          <p className="text-xs text-gray-600 mt-1">{channelName}</p>
          {retrying && <p className="text-xs text-yellow-500/60 mt-1">Tentative {retryCountRef.current}/3</p>}
        </div>
      )}

      {/* Error */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/92 p-6 pointer-events-none">
          {channelLogo && (
            <img src={channelLogo} alt={channelName} className="w-14 h-14 object-contain mb-4 opacity-30 rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <WifiOff className="h-10 w-10 text-red-500/70 mb-3" />
          <p className="text-base font-bold text-white text-center mb-1">{channelName}</p>
          <p className="text-xs text-gray-500 text-center mb-4">Flux non disponible actuellement</p>
          <button
            onClick={(e) => { e.stopPropagation(); manualRetry(); }}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full text-sm font-bold hover:bg-yellow-500/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      )}

      {/* Controls overlay */}
      {!hasError && (
        <div
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
              <span className="text-xs font-black text-white">LIVE</span>
            </div>
            <span className="text-sm font-bold text-white drop-shadow truncate">{channelName}</span>
            <div className="ml-auto flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-xs font-bold text-green-400 flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              {quality}
            </div>
          </div>

          {/* Center play */}
          <div className="flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all hover:scale-110 active:scale-95"
            >
              {isLoading
                ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                : isPlaying
                  ? <Pause className="h-7 w-7 text-white fill-current" />
                  : <Play className="h-7 w-7 text-white fill-current ml-1" />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-t from-black/70 to-transparent">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            {useProxy && (
              <span className="text-[10px] text-yellow-400/60 bg-black/40 px-2 py-1 rounded">
                proxy
              </span>
            )}
            <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
