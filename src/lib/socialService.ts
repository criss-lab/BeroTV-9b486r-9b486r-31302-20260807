import { supabase } from './supabase';

export interface ChannelComment {
  id: string;
  user_id: string;
  channel_id: string;
  content: string;
  like_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export class CommentService {
  async getComments(channelId: string, page = 0): Promise<ChannelComment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('channel_comments')
      .select('*, user:user_id(id, username, avatar_url, is_verified)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19);
    
    if (error) throw error;
    
    // Check likes if user is logged in
    if (user && data && data.length > 0) {
      const commentIds = data.map((c: ChannelComment) => c.id);
      const { data: likes } = await supabase
        .from('channel_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);
      
      const likedSet = new Set((likes || []).map((l: { comment_id: string }) => l.comment_id));
      return (data || []).map((c: ChannelComment) => ({ ...c, is_liked_by_me: likedSet.has(c.id) }));
    }
    
    return data || [];
  }

  async addComment(channelId: string, content: string): Promise<ChannelComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');
    
    const { data, error } = await supabase
      .from('channel_comments')
      .insert({ user_id: user.id, channel_id: channelId, content: content.trim() })
      .select('*, user:user_id(id, username, avatar_url, is_verified)')
      .single();
    
    if (error) throw error;
    return data;
  }

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
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('channel_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
  }
}

export class UserSearchService {
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, email, bio, avatar_url, is_verified, follower_count, following_count')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);
    
    if (error) throw error;
    
    if (user && data && data.length > 0) {
      const userIds = data.map((u: UserSearchResult) => u.id);
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);
      
      const followedSet = new Set((follows || []).map((f: { following_id: string }) => f.following_id));
      return (data || []).map((u: UserSearchResult) => ({ ...u, is_following: followedSet.has(u.id) }));
    }
    
    return data || [];
  }

  async toggleFollow(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');
    if (user.id === targetUserId) throw new Error('Vous ne pouvez pas vous suivre vous-même');
    
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

  async getUserProfile(userId: string): Promise<UserSearchResult | null> {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, username, email, bio, avatar_url, is_verified, follower_count, following_count')
      .eq('id', userId)
      .single();
    return data;
  }
}

export class PremiumService {
  async checkPremium(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data } = await supabase
      .from('premium_subscriptions')
      .select('id, status, ends_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!data) return false;
    if (data.ends_at && new Date(data.ends_at) < new Date()) return false;
    return true;
  }

  async activatePremium(plan: 'monthly' | 'yearly' | 'lifetime'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Connexion requise');
    
    const endsAt = plan === 'lifetime' ? null
      : plan === 'yearly' ? new Date(Date.now() + 365 * 86400000).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString();
    
    await supabase.from('premium_subscriptions').upsert({
      user_id: user.id,
      plan,
      status: 'active',
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
    }, { onConflict: 'user_id' });
    
    // Update user profile
    await supabase.from('user_profiles').update({ is_premium: true }).eq('id', user.id);
  }
}

export const commentService = new CommentService();
export const userSearchService = new UserSearchService();
export const premiumService = new PremiumService();
