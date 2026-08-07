import { supabase } from './supabase';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  post_type: 'post' | 'stream' | 'podcast' | 'clip';
  reply_to?: string;
  share_count: number;
  view_count: number;
  like_count: number;
  is_live: boolean;
  stream_url?: string;
  tags?: string[];
  created_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  is_liked_by_me?: boolean;
  reply_count?: number;
}

export interface CreatePostData {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  post_type?: 'post' | 'stream' | 'podcast' | 'clip';
  reply_to?: string;
  tags?: string[];
  stream_url?: string;
  is_live?: boolean;
}

export class CommunityService {
  async getPosts(page = 0, limit = 20): Promise<Post[]> {
    const offset = page * limit;
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:user_id(id, username, email, avatar_url, is_verified)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Check if current user liked each post
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      const likedIds = new Set(likes?.map(l => l.post_id) || []);
      return data.map(p => ({ ...p, is_liked_by_me: likedIds.has(p.id) }));
    }

    return data || [];
  }

  async getTrendingPosts(limit = 20): Promise<Post[]> {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:user_id(id, username, email, avatar_url, is_verified)
      `)
      .order('like_count', { ascending: false })
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content: data.content,
        media_url: data.media_url,
        media_type: data.media_type,
        post_type: data.post_type || 'post',
        reply_to: data.reply_to,
        tags: data.tags,
        stream_url: data.stream_url,
        is_live: data.is_live || false,
      })
      .select(`*, user:user_id(id, username, email, avatar_url, is_verified)`)
      .single();

    if (error) throw error;
    return post;
  }

  async toggleLike(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single();

    if (existing) {
      await supabase.from('post_likes').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId });
      return true;
    }
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) throw error;
  }

  async sharePost(postId: string): Promise<void> {
    await supabase.from('community_posts')
      .update({ share_count: supabase.rpc('increment', { row_id: postId }) })
      .eq('id', postId);
  }

  async uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' | 'audio' }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `community/${user.id}/${Date.now()}.${fileExt}`;
    
    // Determine media type
    let mediaType: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type.startsWith('audio/')) mediaType = 'audio';

    const { error: uploadError } = await supabase.storage
      .from('community-media')
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('community-media')
      .getPublicUrl(filePath);

    return { url: publicUrl, type: mediaType };
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`*, user:user_id(id, username, email, avatar_url, is_verified)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    return data || [];
  }

  async followUser(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');
    if (user.id === targetUserId) throw new Error('Cannot follow yourself');

    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existing) {
      await supabase.from('user_follows').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetUserId });
      return true;
    }
  }

  async isFollowingUser(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('user_follows')
      .select('id').eq('follower_id', user.id).eq('following_id', targetUserId).single();
    return !!data;
  }
}

export const communityService = new CommunityService();
