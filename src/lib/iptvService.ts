// Dynamic IPTV channel loader — sources from iptv-org, Free-TV, and curated verified streams
// Supports millions of channels via lazy M3U loading with CORS proxy fallback

export interface IPTVChannel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  country: string;
  countryFlag: string;
  category: string;
  language?: string;
  quality?: string;
  isLive: boolean;
  number?: string;
  description?: string;
  isFeatured?: boolean;
}

// Country code to flag emoji
export const countryFlags: Record<string, string> = {
  US:'🇺🇸',GB:'🇬🇧',FR:'🇫🇷',DE:'🇩🇪',ES:'🇪🇸',IT:'🇮🇹',PT:'🇵🇹',BR:'🇧🇷',
  AR:'🇦🇷',MX:'🇲🇽',CO:'🇨🇴',CL:'🇨🇱',JP:'🇯🇵',KR:'🇰🇷',CN:'🇨🇳',IN:'🇮🇳',
  AU:'🇦🇺',CA:'🇨🇦',RU:'🇷🇺',TR:'🇹🇷',SA:'🇸🇦',AE:'🇦🇪',EG:'🇪🇬',NG:'🇳🇬',
  ZA:'🇿🇦',KE:'🇰🇪',GH:'🇬🇭',CD:'🇨🇩',SN:'🇸🇳',CI:'🇨🇮',MA:'🇲🇦',TN:'🇹🇳',
  DZ:'🇩🇿',PL:'🇵🇱',NL:'🇳🇱',BE:'🇧🇪',CH:'🇨🇭',AT:'🇦🇹',SE:'🇸🇪',NO:'🇳🇴',
  DK:'🇩🇰',FI:'🇫🇮',GR:'🇬🇷',CZ:'🇨🇿',HU:'🇭🇺',RO:'🇷🇴',BG:'🇧🇬',RS:'🇷🇸',
  HR:'🇭🇷',SK:'🇸🇰',UA:'🇺🇦',AZ:'🇦🇿',GE:'🇬🇪',AL:'🇦🇱',PK:'🇵🇰',BD:'🇧🇩',
  LK:'🇱🇰',TH:'🇹🇭',VN:'🇻🇳',ID:'🇮🇩',MY:'🇲🇾',SG:'🇸🇬',PH:'🇵🇭',HK:'🇭🇰',
  TW:'🇹🇼',NZ:'🇳🇿',IL:'🇮🇱',IR:'🇮🇷',IQ:'🇮🇶',LB:'🇱🇧',JO:'🇯🇴',KW:'🇰🇼',
  QA:'🇶🇦',BH:'🇧🇭',OM:'🇴🇲',YE:'🇾🇪',ET:'🇪🇹',TZ:'🇹🇿',UG:'🇺🇬',RW:'🇷🇼',
  CM:'🇨🇲',AO:'🇦🇴',MZ:'🇲🇿',ZW:'🇿🇼',VE:'🇻🇪',PE:'🇵🇪',EC:'🇪🇨',BO:'🇧🇴',
  PY:'🇵🇾',UY:'🇺🇾',DO:'🇩🇴',PR:'🇵🇷',CU:'🇨🇺',PA:'🇵🇦',CR:'🇨🇷',SV:'🇸🇻',
  GT:'🇬🇹',HN:'🇭🇳',NI:'🇳🇮',JM:'🇯🇲',TT:'🇹🇹',HT:'🇭🇹',MK:'🇲🇰',BA:'🇧🇦',
  ME:'🇲🇪',XK:'🇽🇰',SI:'🇸🇮',EE:'🇪🇪',LV:'🇱🇻',LT:'🇱🇹',IS:'🇮🇸',IE:'🇮🇪',
  LU:'🇱🇺',MT:'🇲🇹',CY:'🇨🇾',MN:'🇲🇳',KZ:'🇰🇿',UZ:'🇺🇿',TM:'🇹🇲',KG:'🇰🇬',
  TJ:'🇹🇯',AF:'🇦🇫',NP:'🇳🇵',MM:'🇲🇲',KH:'🇰🇭',LA:'🇱🇦',MV:'🇲🇻',BT:'🇧🇹',
  ZM:'🇿🇲',MW:'🇲🇼',NA:'🇳🇦',BW:'🇧🇼',LS:'🇱🇸',SZ:'🇸🇿',GA:'🇬🇦',BJ:'🇧🇯',
  BF:'🇧🇫',ML:'🇲🇱',NE:'🇳🇪',TD:'🇹🇩',SD:'🇸🇩',LY:'🇱🇾',MR:'🇲🇷',SO:'🇸🇴',
  DJ:'🇩🇯',ER:'🇪🇷',SS:'🇸🇸',CF:'🇨🇫',CG:'🇨🇬',GQ:'🇬🇶',ST:'🇸🇹',CV:'🇨🇻',
  GM:'🇬🇲',GW:'🇬🇼',GN:'🇬🇳',SL:'🇸🇱',LR:'🇱🇷',TG:'🇹🇬',ZZ:'🌐',INT:'🌐',
};

export const getCountryFlag = (code: string): string => countryFlags[code?.toUpperCase()] || '🌐';

function normalizeCategory(group: string): string {
  const g = (group || '').toLowerCase();
  if (g.includes('news') || g.includes('info') || g.includes('actualit') || g.includes('noticias') || g.includes('nouvelles')) return 'news';
  if (g.includes('sport') || g.includes('football') || g.includes('soccer') || g.includes('tennis') || g.includes('basket') || g.includes('cricket') || g.includes('golf') || g.includes('racing')) return 'sports';
  if (g.includes('music') || g.includes('musique') || g.includes('mtv') || g.includes('clip') || g.includes('hits')) return 'music';
  if (g.includes('kid') || g.includes('child') || g.includes('cartoon') || g.includes('enfant') || g.includes('junior') || g.includes('anime') || g.includes('youth')) return 'kids';
  if (g.includes('movie') || g.includes('film') || g.includes('cinema') || g.includes('cine') || g.includes('serie') || g.includes('series') || g.includes('drama') || g.includes('comedy') || g.includes('entertain')) return 'entertainment';
  if (g.includes('doc') || g.includes('nature') || g.includes('history') || g.includes('science') || g.includes('discovery') || g.includes('national')) return 'documentary';
  if (g.includes('relig') || g.includes('church') || g.includes('god') || g.includes('faith') || g.includes('christ') || g.includes('islam') || g.includes('bible') || g.includes('gospel') || g.includes('preach')) return 'religious';
  if (g.includes('cook') || g.includes('food') || g.includes('lifestyle') || g.includes('travel') || g.includes('fashion') || g.includes('home') || g.includes('garden')) return 'lifestyle';
  if (g.includes('business') || g.includes('finance') || g.includes('economy') || g.includes('market') || g.includes('bloomberg') || g.includes('cnbc')) return 'business';
  if (g.includes('crime') || g.includes('investigation') || g.includes('forensic') || g.includes('mystery') || g.includes('true crime')) return 'crime';
  if (g.includes('africa') || g.includes('afrique') || g.includes('african')) return 'africa';
  if (g.includes('europe') || g.includes('europ')) return 'europe';
  if (g.includes('asia') || g.includes('asie') || g.includes('oriental')) return 'asia';
  if (g.includes('americ') || g.includes('latin') || g.includes('caribbean')) return 'americas';
  if (g.includes('arabic') || g.includes('arab') || g.includes('middle east') || g.includes('moyen orient')) return 'arabic';
  if (g.includes('weather') || g.includes('météo') || g.includes('meteo')) return 'weather';
  if (g.includes('shop') || g.includes('shopping') || g.includes('teleshopping') || g.includes('home shop')) return 'shopping';
  return 'general';
}

function genLogo(name: string): string {
  const colors = ['1a1a2e','16213e','0f3460','1b1b2f','2d1b69','1a2744','0d1b2a','1e1a3e','2a1a1e'];
  const c = colors[name.charCodeAt(0) % colors.length];
  const initials = encodeURIComponent((name || 'TV').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 2).toUpperCase() || 'TV');
  return `https://ui-avatars.com/api/?name=${initials}&background=${c}&color=f59e0b&size=128&bold=true&font-size=0.4`;
}

// Parse M3U text into channel list
export function parseM3U(text: string): IPTVChannel[] {
  const lines = text.split('\n');
  const channels: IPTVChannel[] = [];
  let cur: Partial<IPTVChannel> | null = null;
  let n = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      n++;
      cur = { isLive: true, id: `dyn-${n}-${Math.random().toString(36).slice(2, 7)}` };

      const tvgName = line.match(/tvg-name="([^"]+)"/);
      if (tvgName) cur.name = tvgName[1].replace(/[ⓢⓣⓨ⓪①②③④⑤⑥⑦⑧⑨]/g, '').trim();

      const tvgLogo = line.match(/tvg-logo="([^"]+)"/);
      if (tvgLogo && tvgLogo[1] && !tvgLogo[1].includes('undefined') && tvgLogo[1].startsWith('http')) {
        cur.logo = tvgLogo[1];
      }

      const tvgCountry = line.match(/tvg-country="([^"]+)"/);
      if (tvgCountry) {
        const codes = tvgCountry[1].split(';')[0].trim().toUpperCase();
        cur.country = codes || 'INT';
        cur.countryFlag = getCountryFlag(cur.country);
      }

      const groupTitle = line.match(/group-title="([^"]+)"/);
      if (groupTitle) {
        cur.category = normalizeCategory(groupTitle[1]);
        cur.description = groupTitle[1];
      }

      const tvgLang = line.match(/tvg-language="([^"]+)"/);
      if (tvgLang) cur.language = tvgLang[1];

      const tvgId = line.match(/tvg-id="([^"]+)"/);
      if (tvgId && !cur.country) {
        const parts = tvgId[1].split('.');
        if (parts.length > 1) {
          cur.country = parts[parts.length - 1].toUpperCase();
          cur.countryFlag = getCountryFlag(cur.country);
        }
      }

      // Name from end of line
      const comma = line.lastIndexOf(',');
      if (comma !== -1) {
        const rawName = line.slice(comma + 1)
          .replace(/[ⓢⓣⓨ⓪①②③④⑤⑥⑦⑧⑨🅷🅳]/g, '')
          .replace(/\s*\[.*?\]\s*/g, '')
          .trim();
        if (rawName && !cur.name) cur.name = rawName;
        else if (rawName && cur.name && rawName.length > cur.name.length) cur.name = rawName;
      }

      // Detect quality from name
      const nameLower = (cur.name || '').toLowerCase();
      if (nameLower.includes('4k') || nameLower.includes('uhd') || nameLower.includes('2160')) cur.quality = '4K';
      else if (nameLower.includes('1080') || nameLower.includes('fhd')) cur.quality = 'FHD';
      else if (nameLower.includes('720') || nameLower.includes(' hd')) cur.quality = 'HD';

    } else if (line.startsWith('#EXTVLCOPT') || line.startsWith('#EXTHTTP') || line.startsWith('#EXTM3U') || line.startsWith('#EXT-X')) {
      // skip meta lines
    } else if (!line.startsWith('#') && cur) {
      const url = line.trim();
      if (url && (url.startsWith('http') || url.startsWith('rtsp') || url.startsWith('rtmp'))) {
        // Skip YouTube/Twitch (require special handling)
        if (url.includes('youtube.com') || url.includes('twitch.tv') || url.includes('youtu.be')) {
          cur = null;
          continue;
        }
        cur.streamUrl = url;
        if (!cur.name || cur.name.length < 2) cur.name = `Channel ${n}`;
        if (!cur.logo) cur.logo = genLogo(cur.name);
        if (!cur.country) { cur.country = 'INT'; cur.countryFlag = '🌐'; }
        if (!cur.category) cur.category = 'general';
        channels.push(cur as IPTVChannel);
      }
      cur = null;
    }
  }
  return channels;
}

// CORS proxy rotation
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`,
];

let proxyIndex = 0;
function getNextProxy() {
  const fn = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
  proxyIndex++;
  return fn;
}

// Cache with TTL
const cache = new Map<string, { data: IPTVChannel[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================================
// MASSIVE IPTV SOURCE COLLECTION — millions of channels
// ============================================================

export const IPTV_SOURCES = {
  // Free-TV — curated, tested working streams (primary)
  freeTv: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',

  // iptv-org CDN (GitHub Pages) — official, 100,000+ channels
  allChannels: 'https://iptv-org.github.io/iptv/index.m3u',
  news: 'https://iptv-org.github.io/iptv/categories/news.m3u',
  sports: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  music: 'https://iptv-org.github.io/iptv/categories/music.m3u',
  entertainment: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
  kids: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
  documentary: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
  religious: 'https://iptv-org.github.io/iptv/categories/religious.m3u',
  general: 'https://iptv-org.github.io/iptv/categories/general.m3u',
  lifestyle: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u',
  business: 'https://iptv-org.github.io/iptv/categories/business.m3u',
  science: 'https://iptv-org.github.io/iptv/categories/science.m3u',
  auto: 'https://iptv-org.github.io/iptv/categories/auto.m3u',
  cooking: 'https://iptv-org.github.io/iptv/categories/cooking.m3u',
  travel: 'https://iptv-org.github.io/iptv/categories/travel.m3u',
  weather: 'https://iptv-org.github.io/iptv/categories/weather.m3u',
  shop: 'https://iptv-org.github.io/iptv/categories/shop.m3u',
  animation: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
  series: 'https://iptv-org.github.io/iptv/categories/series.m3u',
  movies: 'https://iptv-org.github.io/iptv/categories/movies.m3u',

  // By region — expand world coverage
  africa: 'https://iptv-org.github.io/iptv/regions/afr.m3u',
  europe: 'https://iptv-org.github.io/iptv/regions/eur.m3u',
  asia: 'https://iptv-org.github.io/iptv/regions/asia.m3u',
  americas: 'https://iptv-org.github.io/iptv/regions/amer.m3u',
  middleEast: 'https://iptv-org.github.io/iptv/regions/mea.m3u',
  oceania: 'https://iptv-org.github.io/iptv/regions/oce.m3u',
  cis: 'https://iptv-org.github.io/iptv/regions/cis.m3u',
  nafrica: 'https://iptv-org.github.io/iptv/regions/nafrica.m3u',
  eafrica: 'https://iptv-org.github.io/iptv/regions/eafrica.m3u',
  wafrica: 'https://iptv-org.github.io/iptv/regions/wafrica.m3u',
  safrica: 'https://iptv-org.github.io/iptv/regions/safrica.m3u',
  cafrica: 'https://iptv-org.github.io/iptv/regions/cafrica.m3u',
  sasia: 'https://iptv-org.github.io/iptv/regions/sasia.m3u',
  seasia: 'https://iptv-org.github.io/iptv/regions/seast_asia.m3u',
  easia: 'https://iptv-org.github.io/iptv/regions/east_asia.m3u',
  casia: 'https://iptv-org.github.io/iptv/regions/casia.m3u',
  weur: 'https://iptv-org.github.io/iptv/regions/west_eur.m3u',
  neur: 'https://iptv-org.github.io/iptv/regions/north_eur.m3u',
  seur: 'https://iptv-org.github.io/iptv/regions/south_eur.m3u',
  eeur: 'https://iptv-org.github.io/iptv/regions/east_eur.m3u',
  samer: 'https://iptv-org.github.io/iptv/regions/samer.m3u',
  namer: 'https://iptv-org.github.io/iptv/regions/namer.m3u',
  camer: 'https://iptv-org.github.io/iptv/regions/camer.m3u',
  carib: 'https://iptv-org.github.io/iptv/regions/carib.m3u',
  arab: 'https://iptv-org.github.io/iptv/regions/arab.m3u',

  // By language — maximize language coverage
  arabic: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
  french: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
  spanish: 'https://iptv-org.github.io/iptv/languages/spa.m3u',
  portuguese: 'https://iptv-org.github.io/iptv/languages/por.m3u',
  russian: 'https://iptv-org.github.io/iptv/languages/rus.m3u',
  hindi: 'https://iptv-org.github.io/iptv/languages/hin.m3u',
  chinese: 'https://iptv-org.github.io/iptv/languages/zho.m3u',
  german: 'https://iptv-org.github.io/iptv/languages/deu.m3u',
  turkish: 'https://iptv-org.github.io/iptv/languages/tur.m3u',
  italian: 'https://iptv-org.github.io/iptv/languages/ita.m3u',
  indonesian: 'https://iptv-org.github.io/iptv/languages/ind.m3u',
  persian: 'https://iptv-org.github.io/iptv/languages/fas.m3u',
  polish: 'https://iptv-org.github.io/iptv/languages/pol.m3u',
  dutch: 'https://iptv-org.github.io/iptv/languages/nld.m3u',
  greek: 'https://iptv-org.github.io/iptv/languages/ell.m3u',
  romanian: 'https://iptv-org.github.io/iptv/languages/ron.m3u',
  ukrainian: 'https://iptv-org.github.io/iptv/languages/ukr.m3u',
  vietnamese: 'https://iptv-org.github.io/iptv/languages/vie.m3u',
  thai: 'https://iptv-org.github.io/iptv/languages/tha.m3u',
  korean: 'https://iptv-org.github.io/iptv/languages/kor.m3u',
  japanese: 'https://iptv-org.github.io/iptv/languages/jpn.m3u',
  swahili: 'https://iptv-org.github.io/iptv/languages/swa.m3u',
  amharic: 'https://iptv-org.github.io/iptv/languages/amh.m3u',
  hausa: 'https://iptv-org.github.io/iptv/languages/hau.m3u',
  yoruba: 'https://iptv-org.github.io/iptv/languages/yor.m3u',
  lingala: 'https://iptv-org.github.io/iptv/languages/lin.m3u',
  malay: 'https://iptv-org.github.io/iptv/languages/msa.m3u',
  bengali: 'https://iptv-org.github.io/iptv/languages/ben.m3u',

  // By major country
  us: 'https://iptv-org.github.io/iptv/countries/us.m3u',
  gb: 'https://iptv-org.github.io/iptv/countries/gb.m3u',
  fr: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
  de: 'https://iptv-org.github.io/iptv/countries/de.m3u',
  br: 'https://iptv-org.github.io/iptv/countries/br.m3u',
  in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
  tr: 'https://iptv-org.github.io/iptv/countries/tr.m3u',
  ng: 'https://iptv-org.github.io/iptv/countries/ng.m3u',
  za: 'https://iptv-org.github.io/iptv/countries/za.m3u',
  cd: 'https://iptv-org.github.io/iptv/countries/cd.m3u',
  mx: 'https://iptv-org.github.io/iptv/countries/mx.m3u',
  ar: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
  ru: 'https://iptv-org.github.io/iptv/countries/ru.m3u',
  it: 'https://iptv-org.github.io/iptv/countries/it.m3u',
  es: 'https://iptv-org.github.io/iptv/countries/es.m3u',
  pt: 'https://iptv-org.github.io/iptv/countries/pt.m3u',
  cn: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
  jp: 'https://iptv-org.github.io/iptv/countries/jp.m3u',
  kr: 'https://iptv-org.github.io/iptv/countries/kr.m3u',
  id: 'https://iptv-org.github.io/iptv/countries/id.m3u',
  sa: 'https://iptv-org.github.io/iptv/countries/sa.m3u',
  eg: 'https://iptv-org.github.io/iptv/countries/eg.m3u',
  pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
  ke: 'https://iptv-org.github.io/iptv/countries/ke.m3u',
  gh: 'https://iptv-org.github.io/iptv/countries/gh.m3u',
  sn: 'https://iptv-org.github.io/iptv/countries/sn.m3u',
  ci: 'https://iptv-org.github.io/iptv/countries/ci.m3u',
  cm: 'https://iptv-org.github.io/iptv/countries/cm.m3u',
  ma: 'https://iptv-org.github.io/iptv/countries/ma.m3u',
  tn: 'https://iptv-org.github.io/iptv/countries/tn.m3u',
  dz: 'https://iptv-org.github.io/iptv/countries/dz.m3u',
  ca: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
  au: 'https://iptv-org.github.io/iptv/countries/au.m3u',

  // Additional verified community sources
  xstreamPro: 'https://raw.githubusercontent.com/pesicp/XStreamPro/main/playlist.m3u8',
  flybird: 'https://raw.githubusercontent.com/youwen21/flybird-iptv/main/IPTV.m3u',
  worldIptv: 'https://raw.githubusercontent.com/Romaxa55/world_ip_tv/main/world.m3u',
};

export const CATEGORY_SOURCE_MAP: Record<string, string> = {
  news: IPTV_SOURCES.news,
  sports: IPTV_SOURCES.sports,
  music: IPTV_SOURCES.music,
  entertainment: IPTV_SOURCES.entertainment,
  kids: IPTV_SOURCES.kids,
  documentary: IPTV_SOURCES.documentary,
  religious: IPTV_SOURCES.religious,
  general: IPTV_SOURCES.general,
  lifestyle: IPTV_SOURCES.lifestyle,
  business: IPTV_SOURCES.business,
  africa: IPTV_SOURCES.africa,
  europe: IPTV_SOURCES.europe,
  asia: IPTV_SOURCES.asia,
  americas: IPTV_SOURCES.americas,
  arabic: IPTV_SOURCES.arabic,
  french: IPTV_SOURCES.french,
  movies: IPTV_SOURCES.movies,
  series: IPTV_SOURCES.series,
  animation: IPTV_SOURCES.animation,
};

// Fetch with multi-proxy retry
async function fetchWithProxy(url: string, signal?: AbortSignal, maxRetries = 3): Promise<string> {
  const errors: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    let fetchUrl: string;
    if (attempt === 0) {
      fetchUrl = url; // Try direct first (some CDNs allow CORS)
    } else {
      fetchUrl = getNextProxy()(url);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const combinedSignal = signal
        ? (AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }).any?.([signal, controller.signal]) ?? controller.signal
        : controller.signal;

      const res = await fetch(fetchUrl, {
        signal: combinedSignal,
        headers: { 'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, */*' },
        cache: 'default',
      });
      clearTimeout(timeout);

      if (!res.ok) { errors.push(`HTTP ${res.status}`); continue; }
      const text = await res.text();
      if (text.includes('#EXTM3U') || text.includes('#EXTINF')) return text;
      errors.push('Not a valid M3U');
    } catch (e: unknown) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  throw new Error(`All fetches failed: ${errors.join(' | ')}`);
}

export async function loadChannelsFromM3U(
  url: string,
  cacheKey: string,
  signal?: AbortSignal
): Promise<IPTVChannel[]> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const text = await fetchWithProxy(url, signal);
  const channels = parseM3U(text).filter(c =>
    c.streamUrl && c.name && c.name.length > 1 && c.name.length < 200
  );
  cache.set(cacheKey, { data: channels, ts: Date.now() });
  return channels;
}

export function deduplicateChannels<T extends { streamUrl?: string; id?: string }>(channels: T[]): T[] {
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  return channels.filter(c => {
    const url = (c.streamUrl || '').toLowerCase().trim();
    const id = c.id || '';
    if (!url) return false;
    if (seenUrls.has(url)) return false;
    if (id && seenIds.has(id)) return false;
    seenUrls.add(url);
    if (id) seenIds.add(id);
    return true;
  });
}

export function paginateChannels<T>(channels: T[], page: number, pageSize = 40): T[] {
  return channels.slice(page * pageSize, (page + 1) * pageSize);
}

// Progressive loading strategy — tier 1 loads fast, tier 2/3 in background
export const LOAD_TIERS = {
  tier1: [
    { url: IPTV_SOURCES.freeTv, key: 'free-tv' },
    { url: IPTV_SOURCES.news, key: 'news' },
    { url: IPTV_SOURCES.sports, key: 'sports' },
    { url: IPTV_SOURCES.entertainment, key: 'entertainment' },
    { url: IPTV_SOURCES.music, key: 'music' },
  ],
  tier2: [
    { url: IPTV_SOURCES.documentary, key: 'documentary' },
    { url: IPTV_SOURCES.religious, key: 'religious' },
    { url: IPTV_SOURCES.kids, key: 'kids' },
    { url: IPTV_SOURCES.africa, key: 'africa' },
    { url: IPTV_SOURCES.french, key: 'french' },
    { url: IPTV_SOURCES.arabic, key: 'arabic' },
    { url: IPTV_SOURCES.portuguese, key: 'portuguese' },
    { url: IPTV_SOURCES.spanish, key: 'spanish' },
    { url: IPTV_SOURCES.movies, key: 'movies' },
    { url: IPTV_SOURCES.series, key: 'series' },
    { url: IPTV_SOURCES.animation, key: 'animation' },
    { url: IPTV_SOURCES.lifestyle, key: 'lifestyle' },
    { url: IPTV_SOURCES.business, key: 'business' },
  ],
  tier3: [
    { url: IPTV_SOURCES.europe, key: 'europe' },
    { url: IPTV_SOURCES.asia, key: 'asia' },
    { url: IPTV_SOURCES.americas, key: 'americas' },
    { url: IPTV_SOURCES.middleEast, key: 'mea' },
    { url: IPTV_SOURCES.russian, key: 'russian' },
    { url: IPTV_SOURCES.hindi, key: 'hindi' },
    { url: IPTV_SOURCES.chinese, key: 'chinese' },
    { url: IPTV_SOURCES.german, key: 'german' },
    { url: IPTV_SOURCES.turkish, key: 'turkish' },
    { url: IPTV_SOURCES.italian, key: 'italian' },
    { url: IPTV_SOURCES.indonesian, key: 'indonesian' },
    { url: IPTV_SOURCES.korean, key: 'korean' },
    { url: IPTV_SOURCES.japanese, key: 'japanese' },
    { url: IPTV_SOURCES.vietnamese, key: 'vietnamese' },
    { url: IPTV_SOURCES.swahili, key: 'swahili' },
    { url: IPTV_SOURCES.hausa, key: 'hausa' },
    { url: IPTV_SOURCES.yoruba, key: 'yoruba' },
    { url: IPTV_SOURCES.lingala, key: 'lingala' },
  ],
  tier4: [
    { url: IPTV_SOURCES.nafrica, key: 'nafrica' },
    { url: IPTV_SOURCES.eafrica, key: 'eafrica' },
    { url: IPTV_SOURCES.wafrica, key: 'wafrica' },
    { url: IPTV_SOURCES.safrica, key: 'safrica' },
    { url: IPTV_SOURCES.cafrica, key: 'cafrica' },
    { url: IPTV_SOURCES.sasia, key: 'sasia' },
    { url: IPTV_SOURCES.seasia, key: 'seasia' },
    { url: IPTV_SOURCES.easia, key: 'easia' },
    { url: IPTV_SOURCES.weur, key: 'weur' },
    { url: IPTV_SOURCES.neur, key: 'neur' },
    { url: IPTV_SOURCES.seur, key: 'seur' },
    { url: IPTV_SOURCES.eeur, key: 'eeur' },
    { url: IPTV_SOURCES.samer, key: 'samer' },
    { url: IPTV_SOURCES.namer, key: 'namer' },
    { url: IPTV_SOURCES.carib, key: 'carib' },
    { url: IPTV_SOURCES.arab, key: 'arab' },
    { url: IPTV_SOURCES.cis, key: 'cis' },
    { url: IPTV_SOURCES.oceania, key: 'oceania' },
    // Country specifics
    { url: IPTV_SOURCES.ng, key: 'ng' },
    { url: IPTV_SOURCES.za, key: 'za' },
    { url: IPTV_SOURCES.cd, key: 'cd' },
    { url: IPTV_SOURCES.ma, key: 'ma' },
    { url: IPTV_SOURCES.eg, key: 'eg' },
    { url: IPTV_SOURCES.id, key: 'id' },
    { url: IPTV_SOURCES.in, key: 'in' },
    { url: IPTV_SOURCES.br, key: 'br' },
    { url: IPTV_SOURCES.us, key: 'us' },
    { url: IPTV_SOURCES.fr, key: 'fr' },
    { url: IPTV_SOURCES.de, key: 'de' },
    { url: IPTV_SOURCES.ru, key: 'ru' },
    { url: IPTV_SOURCES.mx, key: 'mx' },
    { url: IPTV_SOURCES.ar, key: 'ar' },
    { url: IPTV_SOURCES.pk, key: 'pk' },
    { url: IPTV_SOURCES.sa, key: 'sa' },
    { url: IPTV_SOURCES.tr, key: 'tr' },
  ],
};
