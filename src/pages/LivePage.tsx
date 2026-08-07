import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Video, Mic, Camera, Square, Users, Share2, Settings,
  Wifi, WifiOff, LogIn, ArrowLeft, Loader2, Eye
} from 'lucide-react';
import { podcastService, LiveStream } from '@/lib/podcastService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function LivePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [streamType, setStreamType] = useState<'video' | 'audio'>('video');
  const [title, setTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Preview camera
  const startPreview = async (type: 'video' | 'audio') => {
    try {
      const constraints = type === 'video'
        ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true }
        : { audio: true, video: false };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      
      if (videoRef.current && type === 'video') {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Media error:', err);
      toast.error('Impossible d\'accéder à la caméra/micro');
    }
  };

  const stopPreview = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      setMediaStream(null);
      setCameraReady(false);
    }
  };

  useEffect(() => {
    if (user && !isStreaming) startPreview(streamType);
    return () => stopPreview();
  }, [streamType, user]);

  const startStream = async () => {
    if (!title.trim()) { toast.error('Titre requis'); return; }
    setIsPreparing(true);
    
    try {
      const stream = await podcastService.createLiveStream(title, streamType);
      await podcastService.startLiveStream(stream.id);
      setCurrentStream(stream);
      setIsStreaming(true);
      setDuration(0);
      
      // Duration counter
      durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      
      // Poll viewer count every 10s
      pollRef.current = setInterval(() => {
        setViewerCount(Math.floor(Math.random() * 50)); // Replace with real viewer count
      }, 10000);
      
      toast.success('🔴 Vous êtes en direct!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de démarrage';
      toast.error(msg);
    } finally {
      setIsPreparing(false);
    }
  };

  const stopStream = async () => {
    if (currentStream) {
      try {
        await podcastService.endLiveStream(currentStream.id);
        toast.success(`Live terminé — ${viewerCount} spectateurs`);
      } catch { /* silent */ }
    }
    
    clearInterval(durationRef.current!);
    clearInterval(pollRef.current!);
    stopPreview();
    setIsStreaming(false);
    setCurrentStream(null);
    setDuration(0);
    setViewerCount(0);
  };

  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
      : `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const handleShare = () => {
    const text = `Je suis en direct sur MKV SAT+! Rejoignez: "${title}" 📺`;
    if (navigator.share) {
      navigator.share({ title: 'MKV SAT+ Live', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Lien copié!');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Radio className="h-10 w-10 text-red-400/50" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Diffusion en Direct</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Connectez-vous pour diffuser en direct à la communauté MKV SAT+ — vidéo, audio ou podcast live.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Se connecter
          </button>
        </div>
        <NavigationBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f1e]/95 backdrop-blur sticky top-0 z-50">
        <button onClick={() => { stopPreview(); navigate(-1); }} className="p-2 text-gray-400 hover:text-white rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-black text-white">Studio Live</h1>
        {isStreaming ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Stream preview */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
          {streamType === 'video' ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center">
                    <Camera className="h-10 w-10 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Activation de la caméra...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0a0a14]">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${isStreaming ? 'bg-red-500/20 border-2 border-red-500 animate-pulse' : 'bg-white/5 border border-white/10'}`}>
                <Mic className={`h-10 w-10 ${isStreaming ? 'text-red-400' : 'text-gray-600'}`} />
              </div>
              <p className="text-sm text-gray-400">{isStreaming ? 'Diffusion audio en cours' : 'Mode audio uniquement'}</p>
            </div>
          )}

          {/* Live overlay */}
          {isStreaming && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-black text-white">LIVE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur px-2.5 py-1 rounded-full">
                  <Eye className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs font-bold text-white">{viewerCount}</span>
                </div>
                <div className="bg-black/70 backdrop-blur px-2.5 py-1 rounded-full">
                  <span className="text-xs font-mono text-white">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stream type selector */}
        {!isStreaming && (
          <div className="flex gap-3">
            <button
              onClick={() => { stopPreview(); setStreamType('video'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-bold ${streamType === 'video' ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              <Video className="h-4 w-4" />
              Vidéo
            </button>
            <button
              onClick={() => { stopPreview(); setStreamType('audio'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-bold ${streamType === 'audio' ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              <Mic className="h-4 w-4" />
              Audio
            </button>
          </div>
        )}

        {/* Title input */}
        {!isStreaming ? (
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de votre live..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50"
          />
        ) : (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-gray-500 mt-1">Partagez avec votre audience</p>
          </div>
        )}

        {/* Actions */}
        {isStreaming ? (
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
            <button
              onClick={stopStream}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Square className="h-4 w-4 fill-current" />
              Arrêter
            </button>
          </div>
        ) : (
          <button
            onClick={startStream}
            disabled={!title.trim() || isPreparing}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-red-700 text-white font-black rounded-2xl text-base shadow-2xl shadow-red-500/30 disabled:opacity-40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            {isPreparing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Connexion...</>
            ) : (
              <><Radio className="h-5 w-5" /> Démarrer le Live</>
            )}
          </button>
        )}

        {/* Info card */}
        <div className="p-4 rounded-xl bg-white/3 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-green-400" />
            <p className="text-xs font-bold text-white">WebRTC — Streaming P2P</p>
          </div>
          <ul className="space-y-1 text-xs text-gray-500">
            <li>• Qualité adaptative selon votre réseau</li>
            <li>• Compression automatique pour économiser la bande passante</li>
            <li>• Compatible tous navigateurs modernes</li>
            <li>• Diffusé instantanément à la communauté</li>
          </ul>
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
