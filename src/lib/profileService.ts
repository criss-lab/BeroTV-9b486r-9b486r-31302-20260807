import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  website?: string;
  location?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  follower_count?: number;
  following_count?: number;
  joined_at?: string;
}

export interface ProfileStats {
  likedChannels: number;
  favoriteChannels: number;
  followedChannels: number;
  posts: number;
  followers: number;
  following: number;
}

export class ProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, email, bio, avatar_url, cover_url, website, location, is_verified, is_premium, follower_count, following_count, joined_at')
      .eq('id', userId)
      .single();
    if (error) { console.error('getProfile error', error); return null; }
    return data;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const allowed = ['username', 'bio', 'avatar_url', 'cover_url', 'website', 'location'];
    const clean: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) clean[k] = (updates as Record<string, unknown>)[k];
    }

    const { error } = await supabase.from('user_profiles').update(clean).eq('id', user.id);
    if (error) throw error;

    // Sync metadata
    const metaUpdate: Record<string, unknown> = {};
    if ('username' in clean) metaUpdate['username'] = clean['username'];
    if ('avatar_url' in clean) metaUpdate['avatar_url'] = clean['avatar_url'];
    if (Object.keys(metaUpdate).length > 0) {
      await supabase.auth.updateUser({ data: metaUpdate });
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    // Validate file
    if (file.size > 5 * 1024 * 1024) throw new Error('Fichier trop grand (max 5MB)');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      throw new Error('Format non supporté (JPEG, PNG, WebP, GIF uniquement)');
    }

    const ext = file.type.split('/')[1];
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    await this.updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  }

  async uploadCover(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    if (file.size > 10 * 1024 * 1024) throw new Error('Fichier trop grand (max 10MB)');

    const ext = file.type.split('/')[1];
    const path = `${user.id}/cover.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    await this.updateProfile({ cover_url: publicUrl });
    return publicUrl;
  }

  async getStats(userId: string): Promise<ProfileStats> {
    const results = await Promise.allSettled([
      supabase.from('channel_interactions').select('channel_id', { count: 'exact', head: true }).eq('user_id', userId).not('liked_at', 'is', null),
      supabase.from('channel_interactions').select('channel_id', { count: 'exact', head: true }).eq('user_id', userId).not('favorited_at', 'is', null),
      supabase.from('channel_follows').select('channel_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_profiles').select('follower_count, following_count').eq('id', userId).single(),
    ]);

    return {
      likedChannels: results[0].status === 'fulfilled' ? (results[0].value.count ?? 0) : 0,
      favoriteChannels: results[1].status === 'fulfilled' ? (results[1].value.count ?? 0) : 0,
      followedChannels: results[2].status === 'fulfilled' ? (results[2].value.count ?? 0) : 0,
      posts: results[3].status === 'fulfilled' ? (results[3].value.count ?? 0) : 0,
      followers: results[4].status === 'fulfilled' ? ((results[4].value.data as { follower_count?: number })?.follower_count ?? 0) : 0,
      following: results[4].status === 'fulfilled' ? ((results[4].value.data as { following_count?: number })?.following_count ?? 0) : 0,
    };
  }

  async getLikedChannelIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('channel_interactions')
      .select('channel_id')
      .eq('user_id', userId)
      .not('liked_at', 'is', null)
      .order('liked_at', { ascending: false })
      .limit(100);
    return data?.map(d => d.channel_id) || [];
  }

  async getFollowedChannelIds(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('channel_follows')
      .select('channel_id')
      .eq('user_id', userId)
      .order('followed_at', { ascending: false })
      .limit(100);
    return data?.map(d => d.channel_id) || [];
  }

  async getFollowers(userId: string, page = 0): Promise<UserProfile[]> {
    const { data } = await supabase
      .from('user_follows')
      .select('follower:follower_id(id, username, email, avatar_url, is_verified, follower_count, following_count)')
      .eq('following_id', userId)
      .range(page * 20, page * 20 + 19);
    return (data || []).map(d => d.follower as unknown as UserProfile);
  }

  async getFollowing(userId: string, page = 0): Promise<UserProfile[]> {
    const { data } = await supabase
      .from('user_follows')
      .select('following:following_id(id, username, email, avatar_url, is_verified, follower_count, following_count)')
      .eq('follower_id', userId)
      .range(page * 20, page * 20 + 19);
    return (data || []).map(d => d.following as unknown as UserProfile);
  }

  async isFollowingUser(targetId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).single();
    return !!data;
  }
}

export const profileService = new ProfileService();
