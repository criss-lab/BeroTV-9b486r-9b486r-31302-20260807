import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Heart, Share2, Repeat2, MoreHorizontal, Image, Video, Mic,
  X, Send, Flame, TrendingUp, Users, LogIn, Trash2, Loader2, Radio, Plus
} from 'lucide-react';
import { communityService, Post, CreatePostData } from '@/lib/communityService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AdBanner } from '@/components/features/AdBanner';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function PostCard({ post, onLike, onDelete, currentUserId }: {
  post: Post;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}) {
  const [liked, setLiked] = useState(post.is_liked_by_me || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const result = await communityService.toggleLike(post.id);
      setLiked(result);
      setLikeCount(c => result ? c + 1 : Math.max(c - 1, 0));
      onLike(post.id);
    } catch {
      toast.error('Connexion requise');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = () => {
    const text = `${post.user?.username || 'User'} on MKV SAT+: "${post.content.slice(0, 100)}"`;
    if (navigator.share) {
      navigator.share({ title: 'MKV SAT+ Community', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Lien copié!');
    }
  };

  const initials = (post.user?.username || 'U').slice(0, 2).toUpperCase();
  const isOwner = currentUserId === post.user_id;

  return (
    <article className="px-4 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {post.user?.avatar_url ? (
            <img src={post.user.avatar_url} alt={initials} className="w-10 h-10 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border border-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-white truncate">{post.user?.username || 'Utilisateur'}</span>
            {post.user?.is_verified && <span className="text-yellow-400 text-xs">✓</span>}
            {post.is_live && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
            <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{timeAgo(post.created_at)}</span>
            {isOwner && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words mb-3">
            {post.content}
          </p>

          {/* Media */}
          {post.media_url && post.media_type === 'image' && (
            <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-72 object-cover"
                loading="lazy"
              />
            </div>
          )}
          {post.media_url && post.media_type === 'video' && (
            <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
              <video src={post.media_url} controls className="w-full max-h-72" preload="metadata" />
            </div>
          )}
          {post.media_url && post.media_type === 'audio' && (
            <div className="mb-3 rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Mic className="h-5 w-5 text-yellow-400" />
              </div>
              <audio src={post.media_url} controls className="flex-1 h-8" preload="metadata" />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-400 transition-colors">
              <MessageSquare className="h-4 w-4" />
              {post.reply_count ? <span>{post.reply_count}</span> : null}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-400 transition-colors"
            >
              {copied ? <Share2 className="h-4 w-4 text-green-400" /> : <Repeat2 className="h-4 w-4" />}
              {post.share_count > 0 && <span>{post.share_count}</span>}
            </button>
            <span className="ml-auto text-[10px] text-gray-700">{(post.view_count || 0).toLocaleString()} vues</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ComposeModal({ onClose, onPost }: { onClose: () => void; onPost: (post: Post) => void }) {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' | 'audio' } | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type });
    setMediaFile(file);
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | 'audio' | undefined;
      
      if (mediaFile && mediaPreview) {
        setUploading(true);
        try {
          const result = await communityService.uploadMedia(mediaFile);
          mediaUrl = result.url;
          mediaType = result.type;
        } catch {
          // Storage not set up - use object URL as fallback for demo
          mediaUrl = mediaPreview.url;
          mediaType = mediaPreview.type;
        }
        setUploading(false);
      }
      
      const postData: CreatePostData = {
        content: content.trim() || ' ',
        media_url: mediaUrl,
        media_type: mediaType,
      };
      
      const post = await communityService.createPost(postData);
      onPost(post);
      toast.success('Publié avec succès!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la publication';
      toast.error(msg);
      setPosting(false);
    }
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#0f0f1e] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h3 className="font-bold text-white text-sm">Nouveau Post</h3>
          <button
            onClick={handlePost}
            disabled={(!content.trim() && !mediaFile) || posting}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black text-sm rounded-full disabled:opacity-40 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publier
          </button>
        </div>

        {/* Compose area */}
        <div className="flex gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border border-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Quoi de neuf? Partagez avec la communauté MKV SAT+..."
              maxLength={500}
              rows={4}
              className="w-full bg-transparent text-white placeholder:text-gray-600 text-sm leading-relaxed resize-none focus:outline-none"
            />
            
            {/* Media Preview */}
            {mediaPreview && (
              <div className="mt-2 relative">
                {mediaPreview.type === 'image' && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={mediaPreview.url} className="w-full max-h-48 object-cover" alt="Preview" />
                  </div>
                )}
                {mediaPreview.type === 'video' && (
                  <video src={mediaPreview.url} className="w-full max-h-48 rounded-xl border border-white/10" controls preload="metadata" />
                )}
                {mediaPreview.type === 'audio' && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-yellow-400" />
                    <audio src={mediaPreview.url} controls className="flex-1" />
                  </div>
                )}
                <button
                  onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Compression & envoi du fichier...
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input type="file" ref={fileRef} className="hidden" accept="image/*,video/*" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                <input type="file" ref={audioRef} className="hidden" accept="audio/*" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-500 hover:text-yellow-400 rounded-full hover:bg-white/5 transition-colors">
                  <Image className="h-4 w-4" />
                </button>
                <button onClick={() => audioRef.current?.click()} className="p-2 text-gray-500 hover:text-yellow-400 rounded-full hover:bg-white/5 transition-colors">
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <span className={`text-xs ${content.length > 450 ? 'text-red-400' : 'text-gray-600'}`}>
                {content.length}/500
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'live'>('feed');
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadPosts = async (reset = false) => {
    const p = reset ? 0 : page;
    if (!reset) setLoadingMore(true);
    
    try {
      let newPosts: Post[];
      if (activeTab === 'trending') {
        newPosts = await communityService.getTrendingPosts();
      } else {
        newPosts = await communityService.getPosts(p);
      }
      
      if (reset) {
        setPosts(newPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(p + 1);
      }
      setHasMore(newPosts.length === 20);
    } catch (err) {
      console.error('Load posts error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setPage(0);
    setHasMore(true);
    loadPosts(true);
  }, [activeTab]);

  // Poll for new posts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'feed') loadPosts(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleLike = (_postId: string) => {
    // Like state is managed within PostCard
  };

  const handleDelete = async (postId: string) => {
    try {
      await communityService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const tabs = [
    { id: 'feed', label: 'Fil', icon: MessageSquare },
    { id: 'trending', label: 'Tendances', icon: TrendingUp },
    { id: 'live', label: 'Lives', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div>
            <h1 className="text-base font-black text-white">Communauté</h1>
            <p className="text-[10px] text-gray-500">MKV SAT+ Social</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-yellow-400 rounded-lg hover:bg-white/5 transition-colors">
              <Users className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 max-w-5xl mx-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === id ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Ad banner */}
      <AdBanner slot="community-top" className="max-w-5xl mx-auto" />

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500/50" />
            <p className="text-sm text-gray-500">Chargement du fil...</p>
          </div>
        ) : activeTab === 'live' ? (
          <LiveTab />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-yellow-500/50" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Soyez le premier à publier!</h3>
            <p className="text-sm text-gray-500 mb-6">Partagez vos chaînes préférées, clips et actualités avec la communauté.</p>
            {user ? (
              <button
                onClick={() => setShowCompose(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-full text-sm shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
              >
                Créer un post
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-full text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"
              >
                <LogIn className="h-4 w-4" />
                Se connecter pour publier
              </button>
            )}
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <div key={post.id}>
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  currentUserId={user?.id}
                />
                {/* Ad after every 10 posts */}
                {(i + 1) % 10 === 0 && <AdBanner slot={`community-feed-${i}`} className="mx-4 my-2" />}
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => loadPosts()}
                disabled={loadingMore}
                className="w-full py-4 text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                {loadingMore ? 'Chargement...' : 'Voir plus'}
              </button>
            )}
          </>
        )}
      </div>

      {/* FAB - Compose button */}
      {user && (
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-2xl shadow-yellow-500/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6 font-black" />
        </button>
      )}

      {/* Compose Modal */}
      {showCompose && user && (
        <ComposeModal onClose={() => setShowCompose(false)} onPost={handleNewPost} />
      )}

      <NavigationBar />
    </div>
  );
}

// Need ChevronDown import
import { ChevronDown } from 'lucide-react';

function LiveTab() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="py-8 px-4 text-center">
      <div className="max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Radio className="h-10 w-10 text-red-400" />
        </div>
        <h3 className="text-lg font-black text-white mb-2">Go Live</h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Diffusez en direct à la communauté MKV SAT+. Partagez vos vidéos, audio ou votre écran avec des milliers d'utilisateurs.
        </p>
        {user ? (
          <button
            onClick={() => navigate('/live')}
            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-red-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Radio className="h-5 w-5" />
            Démarrer un Live
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-sm shadow-lg shadow-yellow-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Se connecter pour diffuser
          </button>
        )}
      </div>
    </div>
  );
}
