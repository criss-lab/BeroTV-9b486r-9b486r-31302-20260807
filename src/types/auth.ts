export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface ChannelInteraction {
  id: string;
  user_id: string;
  channel_id: string;
  viewed_at?: string;
  liked_at?: string;
  favorited_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelFollow {
  id: string;
  user_id: string;
  channel_id: string;
  followed_at: string;
}

export interface ChannelStatistics {
  channel_id: string;
  total_views: number;
  total_likes: number;
  total_favorites: number;
  total_follows: number;
  trending_score: number;
  updated_at: string;
}
