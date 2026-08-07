import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, LogOut, Settings, Heart, Star, Bell, Globe, ChevronRight,
  Shield, Phone, Edit2, Radio, Users, Mic, Crown, Camera, MapPin, Link,
  CalendarDays, CheckCircle2, UserPlus, UserMinus, Loader2, Image, X,
  ChevronLeft, Tv, TrendingUp, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/authService';
import { profileService, UserProfile, ProfileStats } from '@/lib/profileService';
import { userSearchService } from '@/lib/socialService';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { WORLD_CHANNELS } from '@/constants/worldChannels';
import { toast } from 'sonner';

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
interface EditModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

function EditProfileModal({ profile, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({
    username: profile.username || '',
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(profile.avatar_url || '');
  const [previewCover, setPreviewCover] = useState(profile.cover_url || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewAvatar(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const url = await profileService.uploadAvatar(file);
      setPreviewAvatar(url);
      toast.success('Photo de profil mise à jour!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewCover(URL.createObjectURL(file));
    setCoverUploading(true);
    try {
      const url = await profileService.uploadCover(file);
      setPreviewCover(url);
      toast.success('Photo de couverture mise à jour!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.username.trim()) { toast.error("Le nom d'utilisateur est requis"); return; }
    setSaving(true);
    try {
      await profileService.updateProfile(form);
      onSave({ ...profile, ...form, avatar_url: previewAvatar, cover_url: previewCover });
      toast.success('Profil mis à jour!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#0f0f1e] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg font-black text-white">Modifier le profil</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Cover photo */}
          <div className="relative h-32 bg-gradient-to-br from-yellow-500/20 to-purple-700/20 group">
            {previewCover ? (
              <img src={previewCover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-8 w-8 text-white/20" />
              </div>
            )}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            >
              {coverUploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Avatar */}
          <div className="px-5 pb-4">
            <div className="relative -mt-10 mb-4 w-fit">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border-4 border-[#0f0f1e] overflow-hidden">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-yellow-400 text-xl font-black bg-[#1a1a2e]">
                    {form.username.slice(0, 2).toUpperCase() || 'MK'}
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-500 border-2 border-[#0f0f1e] flex items-center justify-center hover:bg-yellow-400 transition-colors shadow-lg"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 text-black animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-black" />
                )}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Form fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Nom d'utilisateur *</label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  maxLength={50}
                  placeholder="Votre nom d'utilisateur"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  maxLength={160}
                  rows={3}
                  placeholder="Parlez-vous en quelques mots..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-700 text-right mt-1">{form.bio.length}/160</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Localisation</label>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  maxLength={50}
                  placeholder="Votre ville ou pays"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1.5 block flex items-center gap-1.5"><Link className="h-3 w-3" /> Site web</label>
                <input
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  maxLength={100}
                  placeholder="https://votre-site.com"
                  type="url"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-6 pt-3 border-t border-white/5 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2 hover:from-yellow-300 hover:to-yellow-500 transition-all disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde...</> : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Follower/Following List Modal ───────────────────────────────────────────
function UserListModal({ title, users, onClose, onFollow }: {
  title: string;
  users: UserProfile[];
  onClose: () => void;
  onFollow: (id: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#0f0f1e] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {users.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">Aucun utilisateur</div>
          ) : users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 border border-yellow-500/20 flex items-center justify-center text-xs font-black text-yellow-400 flex-shrink-0 overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt={u.username} /> : (u.username || u.email).slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-white truncate">{u.username || u.email}</p>
                  {u.is_verified && <CheckCircle2 className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
                </div>
                {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
              </div>
              {user && user.id !== u.id && (
                <button onClick={() => onFollow(u.id)} className="px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-colors flex-shrink-0">
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ userId?: string }>();

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !params.userId || params.userId === user?.id;
  const viewedUserId = params.userId || user?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'liked' | 'following' | 'posts'>('channels');
  const [likedChannelIds, setLikedChannelIds] = useState<string[]>([]);
  const [followedChannelIds, setFollowedChannelIds] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!viewedUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [p, s, likedIds, followedIds] = await Promise.all([
        profileService.getProfile(viewedUserId),
        profileService.getStats(viewedUserId),
        profileService.getLikedChannelIds(viewedUserId),
        profileService.getFollowedChannelIds(viewedUserId),
      ]);
      setProfile(p);
      setStats(s);
      setLikedChannelIds(likedIds);
      setFollowedChannelIds(followedIds);

      if (!isOwnProfile && user) {
        const following = await profileService.isFollowingUser(viewedUserId);
        setIsFollowingUser(following);
      }
    } catch (e) {
      console.error('loadProfile error', e);
    } finally {
      setLoading(false);
    }
  }, [viewedUserId, isOwnProfile, user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFollowUser = async () => {
    if (!user) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      const following = await userSearchService.toggleFollow(viewedUserId!);
      setIsFollowingUser(following);
      setStats(s => s ? { ...s, followers: following ? s.followers + 1 : Math.max(s.followers - 1, 0) } : s);
      toast.success(following ? 'Utilisateur suivi!' : 'Désabonné');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowers = async () => {
    if (!viewedUserId) return;
    const data = await profileService.getFollowers(viewedUserId);
    setFollowers(data);
    setShowFollowers(true);
  };

  const openFollowing = async () => {
    if (!viewedUserId) return;
    const data = await profileService.getFollowing(viewedUserId);
    setFollowing(data);
    setShowFollowing(true);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      navigate('/');
      toast.success('Déconnecté avec succès');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Channels to display in tabs
  const likedChannels = WORLD_CHANNELS.filter(c => likedChannelIds.includes(c.id));
  const followedChannels = WORLD_CHANNELS.filter(c => followedChannelIds.includes(c.id));

  // ── Not logged in (guest viewing own profile) ──
  if (!user && isOwnProfile) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-purple-700/20 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-yellow-500/50" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Mon Profil</h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Créez un compte pour personnaliser votre profil, suivre des chaînes et interagir avec la communauté.
          </p>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black rounded-2xl text-base shadow-2xl shadow-yellow-500/30 hover:scale-[1.02] transition-transform mb-3">
            Se connecter
          </button>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl text-base border border-white/10 hover:bg-white/10 transition-colors">
            Créer un compte
          </button>
        </div>
        <NavigationBar />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500/50" />
      </div>
    );
  }

  const displayProfile = profile || {
    id: user?.id || '',
    username: user?.username || '',
    email: user?.email || '',
    avatar_url: '',
    cover_url: '',
    bio: '',
    is_verified: false,
    is_premium: false,
    follower_count: 0,
    following_count: 0,
  };

  const initials = (displayProfile.username || displayProfile.email).slice(0, 2).toUpperCase();

  return (
    <>
      {showEdit && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={updated => { setProfile(updated); }}
        />
      )}
      {showFollowers && (
        <UserListModal
          title={`Abonnés (${stats?.followers || 0})`}
          users={followers}
          onClose={() => setShowFollowers(false)}
          onFollow={async (id) => { await userSearchService.toggleFollow(id); }}
        />
      )}
      {showFollowing && (
        <UserListModal
          title={`Abonnements (${stats?.following || 0})`}
          users={following}
          onClose={() => setShowFollowing(false)}
          onFollow={async (id) => { await userSearchService.toggleFollow(id); }}
        />
      )}

      <div className="min-h-screen bg-[#0a0a14] text-white pb-28">
        {/* Back button if viewing someone else */}
        {!isOwnProfile && (
          <div className="sticky top-0 z-50 bg-[#0a0a14]/90 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-white/5">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-black text-white">Profil</h1>
          </div>
        )}

        {/* Cover Photo */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-br from-yellow-500/20 via-purple-700/10 to-[#0a0a14]">
          {displayProfile.cover_url ? (
            <img src={displayProfile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-purple-900/20 to-[#0f0f1e]" />
          )}
          {/* Cover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />

          {/* Edit / Settings button */}
          {isOwnProfile && (
            <button
              onClick={() => setShowEdit(true)}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-black/50 backdrop-blur border border-white/20 text-white text-xs font-bold rounded-full hover:bg-black/70 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="px-4 -mt-14 relative z-10">
          <div className="flex items-end justify-between mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[#1a1a2e] border-4 border-[#0a0a14] overflow-hidden shadow-2xl">
                {displayProfile.avatar_url ? (
                  <img src={displayProfile.avatar_url} alt={displayProfile.username} className="w-full h-full object-cover" onError={e => { (e.currentTarget.style.display = 'none'); }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 text-yellow-400 text-2xl font-black">
                    {initials}
                  </div>
                )}
              </div>
              {displayProfile.is_premium && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 border-2 border-[#0a0a14] flex items-center justify-center">
                  <Crown className="h-3 w-3 text-black" />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-8">
              {isOwnProfile ? (
                <>
                  <button onClick={() => navigate('/search')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors">
                    <Users className="h-4 w-4 text-yellow-400" />
                    Chercher
                  </button>
                  <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-colors">
                    <Settings className="h-4 w-4" />
                    Modifier
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowUser}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                    isFollowingUser
                      ? 'bg-white/5 border border-white/20 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      : 'bg-yellow-500 text-black hover:bg-yellow-400'
                  }`}
                >
                  {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowingUser ? <><UserMinus className="h-4 w-4" />Suivi</> : <><UserPlus className="h-4 w-4" />Suivre</>}
                </button>
              )}
            </div>
          </div>

          {/* Name + info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-black text-white">{displayProfile.username || displayProfile.email}</h2>
              {displayProfile.is_verified && <CheckCircle2 className="h-5 w-5 text-yellow-400 flex-shrink-0" />}
              {displayProfile.is_premium && (
                <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full font-bold">PREMIUM</span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
              <Mail className="h-3 w-3" />
              {displayProfile.email}
            </p>
            {displayProfile.bio && (
              <p className="text-sm text-gray-300 leading-relaxed mb-2">{displayProfile.bio}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {displayProfile.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{displayProfile.location}</span>
              )}
              {displayProfile.website && (
                <a href={displayProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-yellow-400 hover:underline">
                  <Link className="h-3 w-3" />{displayProfile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {displayProfile.joined_at && (
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />Rejoint {new Date(displayProfile.joined_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Abonnés', value: stats?.followers ?? 0, onClick: openFollowers },
              { label: 'Abonnements', value: stats?.following ?? 0, onClick: openFollowing },
              { label: 'Chaînes', value: stats?.followedChannels ?? 0, onClick: () => setActiveTab('channels') },
              { label: 'Posts', value: stats?.posts ?? 0, onClick: () => setActiveTab('posts') },
            ].map(({ label, value, onClick }) => (
              <button key={label} onClick={onClick} className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-lg font-black text-white">{value.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500 font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/5 mb-4 overflow-x-auto scrollbar-hide">
            {([
              { id: 'channels', label: 'Chaînes suivies', icon: Tv },
              { id: 'liked', label: 'Aimées', icon: Heart },
              { id: 'posts', label: 'Posts', icon: MessageSquare },
              { id: 'following', label: 'Abonnements', icon: Users },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === id ? 'text-yellow-400 border-yellow-500' : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'channels' && (
            <div>
              {followedChannels.length === 0 ? (
                <div className="text-center py-10">
                  <Tv className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune chaîne suivie</p>
                  <button onClick={() => navigate('/')} className="mt-3 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-xs border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                    Découvrir des chaînes →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {followedChannels.map(ch => (
                    <button key={ch.id} onClick={() => navigate('/')} className="aspect-square rounded-xl bg-[#1a1a2e] border border-white/5 overflow-hidden hover:border-yellow-500/30 transition-all group">
                      <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" onError={e => { (e.currentTarget.style.display='none'); }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked' && (
            <div>
              {likedChannels.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune chaîne aimée</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {likedChannels.map(ch => (
                    <button key={ch.id} onClick={() => navigate('/')} className="aspect-square rounded-xl bg-[#1a1a2e] border border-white/5 overflow-hidden hover:border-red-500/30 transition-all group">
                      <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" onError={e => { (e.currentTarget.style.display='none'); }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Posts disponibles sur la Communauté</p>
              <button onClick={() => navigate('/community')} className="mt-3 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                Voir la Communauté →
              </button>
            </div>
          )}

          {activeTab === 'following' && (
            <div>
              {following.length === 0 && stats?.following === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun abonnement</p>
                  <button onClick={() => navigate('/search')} className="mt-3 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-xs border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                    Chercher des utilisateurs →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {following.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-yellow-700/20 flex items-center justify-center text-xs font-black text-yellow-400 flex-shrink-0 overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt={u.username} /> : (u.username || u.email).slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.username || u.email}</p>
                        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                      </div>
                    </div>
                  ))}
                  {stats && stats.following > following.length && (
                    <button onClick={openFollowing} className="w-full py-3 text-xs text-gray-500 hover:text-gray-300 text-center">
                      Voir tous ({stats.following})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings + Logout — only own profile */}
          {isOwnProfile && (
            <div className="mt-6 space-y-2">
              <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
                {[
                  { icon: TrendingUp, label: 'Tendances', path: '/trending', color: 'text-orange-400' },
                  { icon: Users, label: 'Communauté', path: '/community', color: 'text-blue-400' },
                  { icon: Mic, label: 'Mes Podcasts', path: '/podcasts', color: 'text-purple-400' },
                  { icon: Radio, label: 'Diffusion Live', path: '/live', color: 'text-red-400' },
                  { icon: Crown, label: 'Premium', path: '/premium', color: 'text-yellow-400' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition-colors text-left">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-4.5 w-4.5 ${color}`} />
                    </div>
                    <span className="text-sm font-semibold text-white flex-1">{label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/5 divide-y divide-white/5 overflow-hidden">
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-gray-400">+243 835 412 718 • kembavodomaurice@gmail.com</span>
                </div>
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-400">MKV SAT+ v4.0 — LE MONDE DANS LA POCHE</span>
                </div>
              </div>

              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-colors">
                <LogOut className="h-5 w-5" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        <NavigationBar />
      </div>
    </>
  );
}
