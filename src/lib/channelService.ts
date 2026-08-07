import { supabase } from './supabase';

export class ChannelService {
  async recordView(channelId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('channel_interactions')
      .select('view_count')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .single();

    if (existing) {
      await supabase
        .from('channel_interactions')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (existing.view_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('channel_id', channelId);
    } else {
      await supabase
        .from('channel_interactions')
        .insert({
          user_id: user.id,
          channel_id: channelId,
          viewed_at: new Date().toISOString(),
          view_count: 1,
        });
    }
  }

  async toggleLike(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data: existing } = await supabase
      .from('channel_interactions')
      .select('id, liked_at')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .single();

    const isLiked = !!existing?.liked_at;

    if (existing) {
      await supabase
        .from('channel_interactions')
        .update({ liked_at: isLiked ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('channel_interactions')
        .insert({ user_id: user.id, channel_id: channelId, liked_at: new Date().toISOString() });
    }

    return !isLiked;
  }

  async toggleFavorite(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data: existing } = await supabase
      .from('channel_interactions')
      .select('id, favorited_at')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .single();

    const isFavorited = !!existing?.favorited_at;

    if (existing) {
      await supabase
        .from('channel_interactions')
        .update({ favorited_at: isFavorited ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('channel_interactions')
        .insert({ user_id: user.id, channel_id: channelId, favorited_at: new Date().toISOString() });
    }

    return !isFavorited;
  }

  async toggleFollow(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data: existing } = await supabase
      .from('channel_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .single();

    if (existing) {
      await supabase.from('channel_follows').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('channel_follows').insert({ user_id: user.id, channel_id: channelId });
      return true;
    }
  }

  async isLiked(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('channel_interactions').select('liked_at').eq('user_id', user.id).eq('channel_id', channelId).single();
    return !!data?.liked_at;
  }

  async isFavorited(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('channel_interactions').select('favorited_at').eq('user_id', user.id).eq('channel_id', channelId).single();
    return !!data?.favorited_at;
  }

  async isFollowing(channelId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('channel_follows').select('id').eq('user_id', user.id).eq('channel_id', channelId).single();
    return !!data;
  }

  async getLikedChannels(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('channel_interactions').select('channel_id').eq('user_id', user.id).not('liked_at', 'is', null);
    return data?.map(d => d.channel_id) || [];
  }

  async getFavoriteChannels(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('channel_interactions').select('channel_id').eq('user_id', user.id).not('favorited_at', 'is', null);
    return data?.map(d => d.channel_id) || [];
  }

  async getFollowedChannels(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('channel_follows').select('channel_id').eq('user_id', user.id);
    return data?.map(d => d.channel_id) || [];
  }

  async getTrendingChannels(limit = 12) {
    const { data } = await supabase.from('channel_statistics').select('*').order('total_views', { ascending: false }).limit(limit);
    return data || [];
  }

  async getMostViewedChannels(limit = 12) {
    const { data } = await supabase.from('channel_statistics').select('*').order('total_views', { ascending: false }).limit(limit);
    return data || [];
  }

  async getChannelStats(channelId: string) {
    const { data } = await supabase.from('channel_statistics').select('*').eq('channel_id', channelId).single();
    return data;
  }
}

export const channelService = new ChannelService();
