import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, TrendingUp } from 'lucide-react';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { WORLD_CHANNELS } from '@/constants/worldChannels';

interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  gradient: string;
  borderColor: string;
  count?: number;
}

const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'news', label: 'News & Info', icon: '📰', description: 'Actualités mondiales en temps réel', gradient: 'from-blue-900/60 to-blue-700/30', borderColor: 'border-blue-500/30' },
  { id: 'sports', label: 'Sports', icon: '⚽', description: 'Football, basketball, F1, tennis & plus', gradient: 'from-green-900/60 to-green-700/30', borderColor: 'border-green-500/30' },
  { id: 'entertainment', label: 'Divertissement', icon: '🎭', description: 'Films, séries TV, talk-shows & plus', gradient: 'from-purple-900/60 to-purple-700/30', borderColor: 'border-purple-500/30' },
  { id: 'music', label: 'Musique', icon: '🎵', description: 'Clips, concerts, radio & hits 24/7', gradient: 'from-pink-900/60 to-pink-700/30', borderColor: 'border-pink-500/30' },
  { id: 'documentary', label: 'Documentaires', icon: '🎬', description: 'Nature, histoire, sciences & exploration', gradient: 'from-amber-900/60 to-amber-700/30', borderColor: 'border-amber-500/30' },
  { id: 'crime', label: 'True Crime', icon: '🔍', description: 'Enquêtes criminelles & investigations', gradient: 'from-red-900/60 to-red-700/30', borderColor: 'border-red-500/30' },
  { id: 'kids', label: 'Enfants', icon: '🧒', description: 'Dessins animés, éducation & aventures', gradient: 'from-yellow-900/60 to-yellow-700/30', borderColor: 'border-yellow-500/30' },
  { id: 'religious', label: 'Religieux', icon: '✝️', description: 'Culte, prière, enseignements & louanges', gradient: 'from-indigo-900/60 to-indigo-700/30', borderColor: 'border-indigo-500/30' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🏠', description: 'Cuisine, voyage, mode & décoration', gradient: 'from-teal-900/60 to-teal-700/30', borderColor: 'border-teal-500/30' },
  { id: 'business', label: 'Business', icon: '💼', description: 'Finance, marchés, économie mondiale', gradient: 'from-slate-900/60 to-slate-700/30', borderColor: 'border-slate-500/30' },
  { id: 'africa', label: 'Afrique', icon: '🌍', description: 'Chaînes africaines & culture du continent', gradient: 'from-orange-900/60 to-orange-700/30', borderColor: 'border-orange-500/30' },
  { id: 'europe', label: 'Europe', icon: '🇪🇺', description: 'Télévisions européennes en direct', gradient: 'from-blue-800/60 to-indigo-800/30', borderColor: 'border-blue-400/30' },
  { id: 'asia', label: 'Asie', icon: '🌏', description: 'K-drama, anime, bollywood & plus', gradient: 'from-red-800/60 to-orange-800/30', borderColor: 'border-red-400/30' },
  { id: 'americas', label: 'Amériques', icon: '🌎', description: 'USA, Brésil, Mexique & Caraïbes', gradient: 'from-green-800/60 to-teal-800/30', borderColor: 'border-green-400/30' },
  { id: 'general', label: 'Général', icon: '📡', description: 'Chaînes généralistes tous azimuts', gradient: 'from-gray-800/60 to-gray-700/30', borderColor: 'border-gray-500/30' },
  { id: 'featured', label: 'Vedettes', icon: '⭐', description: 'Les chaînes les plus populaires', gradient: 'from-yellow-800/60 to-yellow-600/30', borderColor: 'border-yellow-500/40' },
];

// Count channels per category
const categoryCounts: Record<string, number> = {};
WORLD_CHANNELS.forEach(ch => {
  categoryCounts[ch.category] = (categoryCounts[ch.category] || 0) + 1;
});

const WORLD_STATS = {
  total: WORLD_CHANNELS.length,
  countries: new Set(WORLD_CHANNELS.map(c => c.country)).size,
  languages: new Set(WORLD_CHANNELS.map(c => c.language).filter(Boolean)).size,
};

export function CategoriesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1e]/97 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-white">Catégories</h1>
            <p className="text-[10px] text-gray-500">Explorez par genre ou région</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-yellow-500/70">
            <Globe className="h-3.5 w-3.5" />
            <span className="font-bold">{WORLD_STATS.countries} pays</span>
          </div>
        </div>
      </header>

      {/* Hero stats */}
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-yellow-500/10 via-[#0f0f1e] to-purple-900/10 border border-yellow-500/20 p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">MKV SAT+ — World TV</h2>
              <p className="text-[10px] text-gray-400">Le monde entier dans votre poche</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Chaînes', value: `${WORLD_STATS.total}+` },
              { label: 'Pays', value: `${WORLD_STATS.countries}` },
              { label: 'Langues', value: `${WORLD_STATS.languages}` },
            ].map(stat => (
              <div key={stat.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-lg font-black text-yellow-400">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Grid */}
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Toutes les catégories</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORY_DEFS.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => navigate('/', { state: { category: cat.id } })}
                className={`relative flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br ${cat.gradient} border ${cat.borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all text-left shadow-lg`}
              >
                <span className="text-3xl mb-2 drop-shadow-lg">{cat.icon}</span>
                <h3 className="text-sm font-black text-white leading-tight mb-1">{cat.label}</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{cat.description}</p>
                <div className="flex items-center gap-1 mt-auto">
                  {count > 0 && (
                    <span className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-full font-semibold">
                      {count >= 100 ? `100+` : count}+ chaînes
                    </span>
                  )}
                  {cat.id === 'news' || cat.id === 'sports' ? (
                    <span className="text-[9px] bg-red-600/80 text-white px-1.5 py-0.5 rounded-full font-bold">🔴 LIVE</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Extra info */}
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            📡 Plus de <strong className="text-yellow-400">100,000 chaînes</strong> chargées dynamiquement depuis les meilleures sources mondiales.<br />
            Les chaînes supplémentaires se chargent en arrière-plan après votre première visite.
          </p>
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
