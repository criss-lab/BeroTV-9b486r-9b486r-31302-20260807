import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Trash2, Send, MessageCircle, Loader2, LogIn, ChevronDown, CornerDownRight, Reply, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface ChannelComment {
  id: string;
  user_id: string;
  channel_id: string;
  content: string;
  like_count: number;
  reply_count: number;
  parent_id: string | null;
  created_at: string;
  is_liked_by_me?: boolean;
  showReplies?: boolean;
  replies?: ChannelComment[];
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}j`;
}

// ─── Comment Service ─────────────────────────────────────────────────────────
const commentService = {
  async getComments(channelId: string, page = 0, parentId: string | null = null): Promise<ChannelComment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const query = supabase
      .from('channel_comments')
      .select('*, user:user_id(id, username, avatar_url, is_verified)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19);

    if (parentId) query.eq('parent_id', parentId);
    else query.is('parent_id', null);

    const { data, error } = await query;
    if (error) throw error;

    if (user && data && data.length > 0) {
      const ids = data.map((c: ChannelComment) => c.id);
      const { data: likes } = await supabase
        .from('channel_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', ids);
      const likedSet = new Set((likes || []).map((l: { comment_id: string }) => l.comment_id));
      return (data || []).map((c: ChannelComment) => ({ ...c, is_liked_by_me: likedSet.has(c.id) }));
    }
    return data || [];
  },

  async addComment(channelId: string, content: string, parentId: string | null = null): Promise<ChannelComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');
    const { data, error } = await supabase
      .from('channel_comments')
      .insert({ user_id: user.id, channel_id: channelId, content: content.trim(), parent_id: parentId })
      .select('*, user:user_id(id, username, avatar_url, is_verified)')
      .single();
    if (error) throw error;
    return data;
  },

  async toggleLike(commentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');
    const { data: existing } = await supabase
      .from('channel_comment_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .single();
    if (existing) {
      await supabase.from('channel_comment_likes').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('channel_comment_likes').insert({ user_id: user.id, comment_id: commentId });
      return true;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('channel_comments').delete().eq('id', commentId);
    if (error) throw error;
  },
};

// ─── Single Comment ───────────────────────────────────────────────────────────
function CommentItem({
  comment,
  onLike,
  onDelete,
  onReply,
  currentUserId,
  depth = 0,
}: {
  comment: ChannelComment;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string, username: string) => void;
  currentUserId?: string;
  depth?: number;
}) {
  return (
    <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <div className={`${depth > 0 ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'} rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 border border-yellow-500/20 flex items-center justify-center font-bold text-yellow-400 flex-shrink-0 mt-0.5 overflow-hidden`}>
        {comment.user?.avatar_url ? (
          <img src={comment.user.avatar_url} className="w-full h-full object-cover rounded-full" alt="" onError={e => { (e.currentTarget.style.display='none'); }} />
        ) : (
          (comment.user?.username || 'U').slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-xs font-bold text-white">{comment.user?.username || 'Utilisateur'}</span>
          {comment.user?.is_verified && <span className="text-yellow-400 text-[9px]">✓</span>}
          <span className="text-[10px] text-gray-600">{timeAgo(comment.created_at)}</span>
          {depth > 0 && <CornerDownRight className="h-2.5 w-2.5 text-gray-700 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-300 leading-relaxed break-words">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-[10px] transition-colors ${comment.is_liked_by_me ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
          >
            <Heart className={`h-3 w-3 ${comment.is_liked_by_me ? 'fill-current' : ''}`} />
            {comment.like_count > 0 && <span>{comment.like_count}</span>}
          </button>
          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id, comment.user?.username || 'Utilisateur')}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-400 transition-colors"
            >
              <Reply className="h-3 w-3" />
              {comment.reply_count > 0 ? `${comment.reply_count} réponse${comment.reply_count > 1 ? 's' : ''}` : 'Répondre'}
            </button>
          )}
          {currentUserId === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-[10px] text-gray-700 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {/* Replies */}
        {comment.showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 border-l-2 border-white/5 pl-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onDelete={onDelete}
                onReply={() => {}}
                currentUserId={currentUserId}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channel Comments Main ────────────────────────────────────────────────────
interface ChannelCommentsProps {
  channelId: string;
  channelName: string;
}

export function ChannelComments({ channelId, channelName }: ChannelCommentsProps) {
  const [comments, setComments] = useState<ChannelComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadComments = useCallback(async (pg = 0, reset = false) => {
    if (pg === 0) setLoading(true); else setLoadingMore(true);
    try {
      const data = await commentService.getComments(channelId, pg);
      if (reset || pg === 0) setComments(data);
      else setComments(prev => [...prev, ...data]);
      setHasMore(data.length === 20);
      setPage(pg);
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  }, [channelId]);

  useEffect(() => {
    if (isExpanded) loadComments(0, true);
  }, [channelId, isExpanded, loadComments]);

  useEffect(() => {
    if (!isExpanded) return;
    const iv = setInterval(() => loadComments(0, true), 20000);
    return () => clearInterval(iv);
  }, [isExpanded, loadComments]);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    if (!user) { navigate('/login'); return; }
    setPosting(true);
    try {
      const comment = await commentService.addComment(channelId, text.trim(), replyTo?.id || null);
      if (replyTo) {
        // Add to parent replies
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, reply_count: c.reply_count + 1, replies: [comment, ...(c.replies || [])], showReplies: true }
            : c
        ));
      } else {
        setComments(prev => [comment, ...prev]);
      }
      setText('');
      setReplyTo(null);
      toast.success('Commentaire publié!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setPosting(false); }
  };

  const handleLike = async (commentId: string) => {
    if (!user) { navigate('/login'); return; }
    try {
      const liked = await commentService.toggleLike(commentId);
      const update = (list: ChannelComment[]) => list.map(c =>
        c.id === commentId
          ? { ...c, is_liked_by_me: liked, like_count: liked ? c.like_count + 1 : Math.max(c.like_count - 1, 0) }
          : { ...c, replies: c.replies ? update(c.replies) : undefined }
      );
      setComments(prev => update(prev));
    } catch { /* silent */ }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      const remove = (list: ChannelComment[]): ChannelComment[] =>
        list.filter(c => c.id !== commentId).map(c => ({
          ...c, replies: c.replies ? remove(c.replies) : undefined
        }));
      setComments(prev => remove(prev));
    } catch { /* silent */ }
  };

  const handleReply = (id: string, username: string) => {
    if (!user) { navigate('/login'); return; }
    setReplyTo({ id, username });
    setText(`@${username} `);
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleToggleReplies = async (commentId: string, currentlyShowing: boolean) => {
    if (currentlyShowing) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, showReplies: false } : c));
      return;
    }
    setLoadingReplies(commentId);
    try {
      const replies = await commentService.getComments(channelId, 0, commentId);
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies, showReplies: true } : c
      ));
    } catch { /* silent */ }
    finally { setLoadingReplies(null); }
  };

  const totalCount = comments.length;

  return (
    <div className="border-t border-white/5 bg-[#0a0a14]">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-bold text-white">Commentaires</span>
          {totalCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">{totalCount}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-xs text-blue-300 flex items-center gap-1.5">
                <Reply className="h-3 w-3" />
                Répondre à <strong>{replyTo.username}</strong>
              </span>
              <button onClick={() => { setReplyTo(null); setText(''); }} className="text-gray-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Compose */}
          <div className="flex gap-2.5 mb-4">
            {user ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border border-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0 mt-1 overflow-hidden">
                {(user.username || user.email).slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1 flex gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
                placeholder={user ? (replyTo ? `Répondre à @${replyTo.username}...` : `Commenter ${channelName}...`) : 'Connectez-vous pour commenter'}
                disabled={!user}
                rows={1}
                maxLength={300}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none disabled:opacity-40"
              />
              {user ? (
                <button
                  onClick={handlePost}
                  disabled={!text.trim() || posting}
                  className="w-8 h-8 rounded-xl bg-yellow-500 text-black flex items-center justify-center hover:bg-yellow-400 transition-colors disabled:opacity-40 mt-0.5 flex-shrink-0"
                >
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <button onClick={() => navigate('/login')} className="flex-shrink-0 px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-[10px] font-bold hover:bg-yellow-500/20 transition-colors mt-0.5">
                  <LogIn className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="flex justify-center py-5">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500/40" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Aucun commentaire. Soyez le premier!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    currentUserId={user?.id}
                  />
                  {/* Load replies button */}
                  {comment.reply_count > 0 && !comment.showReplies && (
                    <button
                      onClick={() => handleToggleReplies(comment.id, false)}
                      disabled={loadingReplies === comment.id}
                      className="ml-10 mt-1.5 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      {loadingReplies === comment.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <CornerDownRight className="h-2.5 w-2.5" />
                      )}
                      {comment.reply_count} réponse{comment.reply_count > 1 ? 's' : ''}
                    </button>
                  )}
                  {comment.showReplies && (
                    <button
                      onClick={() => handleToggleReplies(comment.id, true)}
                      className="ml-10 mt-1.5 text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
                    >
                      <ChevronDown className="h-2.5 w-2.5 rotate-180" />
                      Masquer les réponses
                    </button>
                  )}
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={() => loadComments(page + 1)}
                  disabled={loadingMore}
                  className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 flex items-center justify-center gap-1"
                >
                  {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                  {loadingMore ? 'Chargement...' : 'Voir plus'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
