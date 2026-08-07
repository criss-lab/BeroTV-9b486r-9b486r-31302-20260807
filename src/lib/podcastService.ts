import { supabase } from './supabase';

export interface Podcast {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  audio_url: string;
  duration_seconds?: number;
  play_count: number;
  category: string;
  is_public: boolean;
  file_size_bytes?: number;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_key: string;
  is_active: boolean;
  viewer_count: number;
  stream_type: 'video' | 'audio';
  started_at?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export class PodcastService {
  async getPodcasts(category?: string, page = 0): Promise<Podcast[]> {
    let query = supabase
      .from('podcasts')
      .select(`*, user:user_id(id, username, avatar_url, is_verified)`)
      .eq('is_public', true)
      .order('play_count', { ascending: false })
      .range(page * 20, page * 20 + 19);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async uploadPodcast(
    audioFile: File,
    metadata: { title: string; description?: string; category: string },
    onProgress?: (pct: number) => void
  ): Promise<Podcast> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    // Compress/upload audio
    const fileExt = audioFile.name.split('.').pop() || 'mp3';
    const filePath = `podcasts/${user.id}/${Date.now()}.${fileExt}`;

    onProgress?.(10);
    
    const { error: uploadError } = await supabase.storage
      .from('podcasts')
      .upload(filePath, audioFile, { 
        contentType: audioFile.type || 'audio/mpeg',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    onProgress?.(80);

    const { data: { publicUrl } } = supabase.storage.from('podcasts').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('podcasts')
      .insert({
        user_id: user.id,
        title: metadata.title,
        description: metadata.description,
        audio_url: publicUrl,
        category: metadata.category,
        file_size_bytes: audioFile.size,
        is_public: true,
      })
      .select(`*, user:user_id(id, username, avatar_url, is_verified)`)
      .single();

    if (error) throw error;
    onProgress?.(100);
    return data;
  }

  async incrementPlayCount(podcastId: string): Promise<void> {
    await supabase.rpc('increment_podcast_plays', { podcast_id: podcastId });
  }

  async getMyPodcasts(): Promise<Podcast[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('podcasts')
      .select(`*, user:user_id(id, username, avatar_url, is_verified)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Live streaming management
  async createLiveStream(title: string, streamType: 'video' | 'audio'): Promise<LiveStream> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('user_live_streams')
      .insert({ user_id: user.id, title, stream_type: streamType, is_active: false })
      .select(`*, user:user_id(id, username, avatar_url, is_verified)`)
      .single();
    
    if (error) throw error;
    return data;
  }

  async startLiveStream(streamId: string): Promise<void> {
    await supabase
      .from('user_live_streams')
      .update({ is_active: true, started_at: new Date().toISOString() })
      .eq('id', streamId);
  }

  async endLiveStream(streamId: string): Promise<void> {
    await supabase
      .from('user_live_streams')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', streamId);
  }

  async getActiveLiveStreams(): Promise<LiveStream[]> {
    const { data, error } = await supabase
      .from('user_live_streams')
      .select(`*, user:user_id(id, username, avatar_url, is_verified)`)
      .eq('is_active', true)
      .order('viewer_count', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export const podcastService = new PodcastService();

// Podcast categories
export const PODCAST_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: '🎙️' },
  { id: 'news', label: 'Actualités', icon: '📰' },
  { id: 'technology', label: 'Technologie', icon: '💻' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'music', label: 'Musique', icon: '🎵' },
  { id: 'education', label: 'Éducation', icon: '📚' },
  { id: 'comedy', label: 'Comédie', icon: '😂' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'religious', label: 'Religion', icon: '✝️' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'general', label: 'Général', icon: '🎧' },
];
