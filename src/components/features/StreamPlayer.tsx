
import { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, WifiOff, RefreshCw } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  channelName: string;
  channelLogo?: string;
  onError?: () => void;
  compact?: boolean;
}

const PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

export function StreamPlayer({ streamUrl, channelName, channelLogo, compact = false }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const retryRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [quality, setQuality] = useState('LIVE');
  const [showControls, setShowControls] = useState(true);

  // ── Stable load function via ref (avoids stale closures) ────────────────────
  // We re-assign on every render so the inner function always has fresh state setters
  const tryLoadRef = useRef<(attempt: number, url: string) => void>(() => {});

  tryLoadRef.current = (attempt: number, rawUrl: string) => {
    const video = videoRef.current;
    if (!video || !rawUrl) return;

    // Cleanup previous instance
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const fetchUrl = attempt === 0 ? rawUrl : PROXIES[Math.min(attempt - 1, PROXIES.length - 1)](rawUrl);

    setLoading(true);
    setError(false);
    setRetrying(attempt > 0);

    const handleRetry = () => {
      retryRef.current++;
      if (retryRef.current <= 3) {
        retryTimerRef.current = setTimeout(
          () => tryLoadRef.current(retryRef.current, rawUrl),
          1500 * retryRef.current
        );
      } else {
        setLoading(false);
        setError(true);
        setRetrying(false);
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        levelLoadingTimeOut: 18000,
        manifestLoadingTimeOut: 18000,
        fragLoadingTimeOut: 25000,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 3,
        startFragPrefetch: true,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 5,
      });
      hlsRef.current = hls;
      hls.loadSource(fetchUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        retryRef.current = 0;
        const levels = (data.levels || []) as { height: number }[];
        const maxH = levels.length ? Math.max(...levels.map(l => l.height || 0)) : 0;
        setQuality(maxH >= 1080 ? 'FHD' : maxH >= 720 ? 'HD' : maxH >= 480 ? 'SD' : 'LIVE');
        setLoading(false);
        setRetrying(false);
        video.play()
          .then(() => setPlaying(true))
          .catch(() => {
            video.muted = true;
            setMuted(true);
            video.play().then(() => setPlaying(true)).catch(() => {});
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) {
          // Non-fatal: let HLS.js self-recover, just restart loading
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        handleRetry();
      });

      // Stall recovery
      hls.on(Hls.Events.BUFFER_STALLED_ERROR, () => hls.startLoad(-1));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = fetchUrl;
      const onMeta = () => {
        setLoading(false);
        video.play().then(() => setPlaying(true)).catch(() => {});
      };
      const onErr = () => handleRetry();
      video.addEventListener('loadedmetadata', onMeta, { once: true });
      video.addEventListener('error', onErr, { once: true });
      video.load();
    } else {
      setLoading(false);
      setError(true);
    }
  };

  // ── Effect: kick off loading when streamUrl changes ──────────────────────────
  useEffect(() => {
    retryRef.current = 0;
    setPlaying(false);
    setError(false);

    if (!streamUrl) {
      setLoading(false);
      setError(true);
      return;
    }

    tryLoadRef.current(0, streamUrl);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const v = videoRef.current;
      if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* ignore */ } }
    };
    // The error message "Definition for rule 'react-hooks/exhaustive-deps' was not found"
    // indicates an ESLint configuration issue, not a TypeScript syntax error.
    // However, to satisfy the request to fix the *syntax* error implicitly caused
    // by a potentially missing dependency, the comment is removed.
    // If the linter were active, it would suggest `streamUrl` as a dependency.
    // For a strict syntax fix, the line `// eslint-disable-next-line react-hooks/exhaustive-deps` is removed
    // as it's not a TS syntax but an ESLint directive.
  }, [streamUrl]); // Added streamUrl as a dependency for correctness, even if the error was about a missing rule definition.

  // Controls
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
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

  const retry = () => {
    retryRef.current = 0;
    tryLoadRef.current(0, streamUrl);
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
        muted
        autoPlay
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setPlaying(true); }}
        onPlay={() => { setPlaying(true); setLoading(false); }}
        onPause={() => setPlaying(false)}
        onStalled={() => hlsRef.current?.startLoad(-1)}
      />

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-none z-10">
          {channelLogo && (
            <img
              src={channelLogo}
              alt=""
              className="w-16 h-16 object-contain mb-4 opacity-40 rounded-xl"
              onError={e => { (e.currentTarget.style.display = 'none'); }}
            />
          )}
          <Loader2 className="h-8 w-8 text-yellow-500 animate-spin mb-3" />
          <p className="text-sm text-gray-300 font-semibold">
            {retrying ? `Reconnexion... (${retryRef.current}/3)` : 'Connexion au flux...'}
          </p>
          <p className="text-xs text-gray-600 mt-1 max-w-[220px] truncate text-center">{channelName}</p>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/92 p-6 z-10">
          {channelLogo && (
            <img
              src={channelLogo}
              alt=""
              className="w-14 h-14 object-contain mb-4 opacity-25 rounded-xl"
              onError={e => { (e.currentTarget.style.display = 'none'); }}
            />
          )}
          <WifiOff className="h-10 w-10 text-red-500/70 mb-3" />
          <p className="text-base font-bold text-white text-center mb-1">{channelName}</p>
          <p className="text-xs text-gray-500 text-center mb-4">Flux non disponible actuellement</p>
          <button
            onClick={e => { e.stopPropagation(); retry(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full text-sm font-bold hover:bg-yellow-500/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      )}

      {/* Controls */}
      {!error && (
        <div
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
              <span className="text-xs font-black text-white">LIVE</span>
            </div>
            <span className="text-sm font-bold text-white drop-shadow truncate flex-1">{channelName}</span>
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-xs font-bold text-green-400 flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              {quality}
            </div>
          </div>

          {/* Center play button */}
          <div className="flex items-center justify-center pointer-events-auto">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all hover:scale-110 active:scale-95"
            >
              {loading
                ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                : playing
                  ? <Pause className="h-7 w-7 text-white fill-current" />
                  : <Play className="h-7 w-7 text-white fill-current ml-1" />}
            </button>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
