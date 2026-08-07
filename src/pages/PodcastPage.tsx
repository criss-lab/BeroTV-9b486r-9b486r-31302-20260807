import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Play, Pause, Upload, Plus, Headphones, Music2, Clock,
  Loader2, LogIn, Trash2, Radio, X, ChevronLeft, Search
} from 'lucide-react';
import { podcastService, Podcast, PODCAST_CATEGORIES } from '@/lib/podcastService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AdBanner } from '@/components/features/AdBanner';

function formatDuration(secs?: number): string {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function PodcastCard({ podcast, onPlay, isPlaying }: {
  podcast: Podcast;
  onPlay: (podcast: Podcast) => void;
  isPlaying: boolean;
}) {
  const initials = (podcast.user?.username || 'U').slice(0, 2).toUpperCase();
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-white/5 cursor-pointer ${isPlaying ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/5'}`}
      onClick={() => onPlay(podcast)}
    >
      {/* Cover */}
      <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-yellow-500/20 to-purple-700/20 border border-white/10 flex items-center justify-center">
        {podcast.cover_url ? (
          <img src={podcast.cover_url} alt={podcast.title} className="w-full h-full object-cover" />
        ) : (
          <Music2 className="h-6 w-6 text-yellow-500/50" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white truncate">{podcast.title}</h3>
        <p className="text-xs text-gray-500 truncate">{podcast.user?.username || 'Auteur'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-600">{timeAgo(podcast.created_at)}</span>
          {podcast.duration_seconds && (
            <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatDuration(podcast.duration_seconds)}
            </span>
          )}
          <span className="text-[10px] text-gray-600">{podcast.play_count} écoutes</span>
        </div>
      </div>
      
      <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isPlaying ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-yellow-500/20'}`}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
    </div>
  );
}

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (p: Podcast) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !title.trim()) { toast.error('Titre et fichier requis'); return; }
    setUploading(true);
    setProgress(0);
    
    try {
      const podcast = await podcastService.uploadPodcast(
        file,
        { title: title.trim(), description: description.trim(), category },
        setProgress
      );
      onUploaded(podcast);
      toast.success('Podcast publié avec succès!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la publication';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#0f0f1e] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
          <h3 className="font-bold text-white text-sm">Publier un Podcast</h3>
          <button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black text-sm rounded-full disabled:opacity-40 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Publier
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* File picker */}
          <input type="file" ref={fileRef} className="hidden" accept="audio/*" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${file ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 hover:border-yellow-500/30'}`}
          >
            {file ? (
              <>
                <Music2 className="h-8 w-8 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </>
            ) : (
              <>
                <Mic className="h-8 w-8 text-gray-600" />
                <span className="text-sm text-gray-400">Sélectionner un fichier audio</span>
                <span className="text-xs text-gray-600">MP3, AAC, OGG, WAV (compressé auto)</span>
              </>
            )}
          </button>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre du podcast *"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50"
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none"
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-500/50"
          >
            {PODCAST_CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id} className="bg-[#0f0f1e]">{c.icon} {c.label}</option>
            ))}
          </select>

          {uploading && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 text-center">Compression & envoi... {progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PodcastPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    podcastService.getPodcasts(activeCategory).then(data => {
      setPodcasts(data);
      setLoading(false);
    });
  }, [activeCategory]);

  const handlePlay = (podcast: Podcast) => {
    if (currentPodcast?.id === podcast.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentPodcast(podcast);
      setIsPlaying(true);
      podcastService.incrementPlayCount(podcast.id);
    }
  };

  useEffect(() => {
    if (currentPodcast && audioRef.current) {
      audioRef.current.src = currentPodcast.audio_url;
      if (isPlaying) audioRef.current.play();
    }
  }, [currentPodcast]);

  const filteredPodcasts = podcasts.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div>
            <h1 className="text-base font-black text-white">Podcasts</h1>
            <p className="text-[10px] text-gray-500">Écoutez & publiez</p>
          </div>
          <div className="flex items-center gap-1">
            {user && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold hover:bg-yellow-500/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Publier
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher des podcasts..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/30"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-0 scrollbar-hide border-b border-white/5 max-w-5xl mx-auto">
          {PODCAST_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeCategory === cat.id ? 'text-yellow-400 border-yellow-500 bg-yellow-500/5' : 'text-gray-600 border-transparent hover:text-gray-400'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Ad banner */}
      <AdBanner slot="podcast-top" className="max-w-5xl mx-auto" />

      {/* Content */}
      <div className="px-4 py-4 max-w-5xl mx-auto">
        {!user && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-700/5 border border-yellow-500/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-yellow-400">Publiez votre podcast!</p>
              <p className="text-xs text-gray-500">Connectez-vous pour partager vos émissions</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-black font-black rounded-full text-xs hover:bg-yellow-400 transition-colors flex-shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
              Connexion
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500/50" />
          </div>
        ) : filteredPodcasts.length === 0 ? (
          <div className="py-16 text-center">
            <Headphones className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">Aucun podcast disponible</p>
            <p className="text-xs text-gray-600 mt-1">Soyez le premier à publier un podcast!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPodcasts.map((podcast, i) => (
              <div key={podcast.id}>
                <PodcastCard
                  podcast={podcast}
                  onPlay={handlePlay}
                  isPlaying={isPlaying && currentPodcast?.id === podcast.id}
                />
                {(i + 1) % 8 === 0 && <AdBanner slot={`podcast-${i}`} className="my-3" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player Bar */}
      {currentPodcast && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-[#0f0f1e]/98 backdrop-blur border-t border-yellow-500/20 px-4 py-3 shadow-2xl">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-purple-700/20 flex items-center justify-center flex-shrink-0">
              <Music2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentPodcast.title}</p>
              <p className="text-[10px] text-gray-500">{currentPodcast.user?.username}</p>
              <audio
                ref={audioRef}
                className="hidden"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <input
                type="range"
                className="w-full h-1 mt-1 accent-yellow-400"
                defaultValue={0}
                onChange={(e) => {
                  if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) * audioRef.current.duration / 100;
                }}
              />
            </div>
            <button
              onClick={() => handlePlay(currentPodcast)}
              className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center flex-shrink-0 hover:bg-yellow-400 transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={() => { setCurrentPodcast(null); setIsPlaying(false); }}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(p) => setPodcasts(prev => [p, ...prev])}
        />
      )}

      <NavigationBar />
    </div>
  );
}
