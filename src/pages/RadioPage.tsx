import { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX, Loader2, Music, ChevronLeft, Wifi } from 'lucide-react';
import { RADIO_STATIONS } from '@/constants/worldChannels';
import { NavigationBar } from '@/components/layout/NavigationBar';

interface RadioStation {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  countryFlag: string;
  country: string;
  description?: string;
  category?: string;
}

// Audio Visualizer Component
function AudioVisualizer({ analyser, isPlaying }: { analyser: AnalyserNode | null; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const BAR_COUNT = 48;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    ctx.clearRect(0, 0, W, H);

    const barW = (W / BAR_COUNT) - 1;

    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIdx = Math.floor(i * data.length / BAR_COUNT);
      const val = isPlaying ? data[dataIdx] / 255 : (Math.sin(i * 0.3 + Date.now() / 800) * 0.1 + 0.05);
      const barH = Math.max(2, val * H);
      const x = i * (barW + 1);
      const y = H - barH;

      const hue = 40 + (val * 20);
      const alpha = 0.4 + val * 0.6;
      ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [analyser, isPlaying]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={60}
      className="w-full h-[60px] rounded-lg"
    />
  );
}

export function RadioPage() {
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const stations = RADIO_STATIONS as RadioStation[];

  const setupAnalyser = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      }
      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') ctx.resume();

      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch { /* ignore */ }
        sourceNodeRef.current = null;
      }

      const source = ctx.createMediaElementSource(audio);
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.8;

      source.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      sourceNodeRef.current = source;
      setAnalyser(analyserNode);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }, []);

  const playStation = useCallback((station: RadioStation) => {
    setError('');
    setIsLoading(true);

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setActiveStation(station);
    setIsPlaying(false);

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = station.streamUrl;
    audio.preload = 'none';
    audioRef.current = audio;

    audio.oncanplay = () => {
      setIsLoading(false);
      setupAnalyser(audio);
      audio.play().then(() => setIsPlaying(true)).catch(e => {
        setError('Lecture impossible: ' + e.message);
        setIsLoading(false);
      });
    };

    audio.onerror = () => {
      setError('Flux non disponible. Essayez une autre station.');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.onended = () => setIsPlaying(false);

    audio.load();
  }, [setupAnalyser]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
  };

  const toggleMute = () => {
    if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/97 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center flex-shrink-0">
            <Radio className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Radio Mondiale</h1>
            <p className="text-[10px] text-gray-500">{stations.length} stations en direct</p>
          </div>
        </div>
      </header>

      {/* Now Playing Player */}
      {activeStation && (
        <div className="sticky top-[57px] z-40 bg-[#0f0f1e]/97 backdrop-blur border-b border-white/5 shadow-lg">
          <div className="px-4 py-3 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              {/* Station logo */}
              <div className="w-12 h-12 rounded-xl bg-[#1a1a2e] border border-white/10 overflow-hidden flex-shrink-0">
                <img src={activeStation.logo} alt={activeStation.name}
                  className="w-full h-full object-contain p-1"
                  onError={e => { (e.currentTarget.style.display = 'none'); }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{activeStation.countryFlag}</span>
                  <p className="text-sm font-black text-white truncate">{activeStation.name}</p>
                  {isPlaying && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-1 bg-green-400 rounded-full animate-bounce"
                          style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 truncate">{activeStation.description || activeStation.country}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center hover:bg-yellow-400 transition-colors active:scale-95">
                  {isLoading ? <Loader2 className="h-4 w-4 text-black animate-spin" /> :
                    isPlaying ? <Pause className="h-4 w-4 text-black fill-black" /> :
                    <Play className="h-4 w-4 text-black fill-black ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Visualizer */}
            <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />

            {error && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Wifi className="h-3 w-3" /> {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hero (when no station playing) */}
      {!activeStation && (
        <div className="px-4 py-6 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-[#0a0a14] border border-white/10 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/30">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Radio en Direct</h2>
            <p className="text-xs text-gray-400 mb-3">Sélectionnez une station pour commencer</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-400">{stations.length} stations disponibles</span>
            </div>
          </div>
        </div>
      )}

      {/* Station List */}
      <div className="px-4 max-w-5xl mx-auto" style={{ paddingTop: activeStation ? '8px' : '0' }}>
        {!activeStation && (
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Toutes les stations</h3>
        )}
        <div className="space-y-2">
          {stations.map(station => {
            const isActive = activeStation?.id === station.id;
            return (
              <button key={station.id}
                onClick={() => playStation(station)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all border text-left ${
                  isActive
                    ? 'bg-yellow-500/10 border-yellow-500/40 ring-1 ring-yellow-500/20'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}>
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a2e] border border-white/10 flex-shrink-0">
                  <img src={station.logo} alt={station.name}
                    className="w-full h-full object-contain p-1"
                    onError={e => {
                      const t = e.target as HTMLImageElement;
                      t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(station.name.slice(0,2))}&background=1a1a2e&color=f59e0b&size=48&bold=true`;
                    }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm">{station.countryFlag}</span>
                    <p className={`font-bold truncate text-sm ${isActive ? 'text-yellow-400' : 'text-white'}`}>{station.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{station.description || station.country}</p>
                </div>
                <div className="flex-shrink-0">
                  {isActive && isPlaying ? (
                    <div className="flex items-end gap-0.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-1 bg-yellow-500 rounded-full animate-bounce"
                          style={{ height: `${6 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  ) : isActive && isLoading ? (
                    <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                      isActive ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-white/5 border-white/10'
                    }`}>
                      <Play className={`h-3.5 w-3.5 ml-0.5 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
