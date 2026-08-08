import { useState, useEffect } from 'react';
import { Clock, Tv, ChevronRight, CalendarDays } from 'lucide-react';
import { WorldChannel } from '@/constants/worldChannels';

interface EPGGuideProps {
  channel: WorldChannel;
}

// Category-based program schedule templates
const SCHEDULE_TEMPLATES: Record<string, string[]> = {
  news: ['Journal', 'Actualités Internationales', 'Flash Info', 'Revue de Presse', 'Débat du Jour', 'Grand Journal', 'Bulletin Météo'],
  sports: ['Match en Direct', 'Analyse Sportive', 'Highlights', 'Magazine Sportif', 'Conférence de Presse', 'Tour d\'horizon Sportif'],
  entertainment: ['Film en Direct', 'Série TV', 'Talk Show', 'Magazine Divertissement', 'Émission Spéciale', 'Documentaire'],
  music: ['Clips Musicaux', 'Concert Live', 'Top 20', 'Radio Show', 'Session Acoustique', 'Music Awards'],
  documentary: ['Documentaire Nature', 'Expédition', 'Sciences & Vie', 'Histoire Secrète', 'Exploration', 'Planète Bleue'],
  kids: ['Dessin Animé', 'Émission Jeunesse', 'Aventures', 'Jeux & Quiz', 'Contes et Histoires'],
  religious: ['Culte en Direct', 'Message du Jour', 'Prière du Matin', 'Enseignement Biblique', 'Louanges & Adoration'],
  general: ['Programme Général', 'Variétés', 'Magazine', 'Émission Spéciale', 'Film de Soirée'],
  lifestyle: ['Cuisine du Monde', 'Art de Vivre', 'Décoration', 'Voyage & Découverte', 'Mode & Style'],
  business: ['Marchés Financiers', 'Économie Mondiale', 'Bourse en Temps Réel', 'Business Report'],
  crime: ['Enquête Criminelle', 'Dossier Secret', 'Investigation', 'Cold Case', 'Affaires Non Résolues'],
  africa: ['Actualités Africaines', 'Culture & Traditions', 'Musique Africaine', 'Magazine Continent'],
  movies: ['Film du Soir', 'Cinéma Classique', 'Avant-Première', 'Festival du Film'],
  animation: ['Anime', 'Dessin Animé', 'Animation 3D', 'Manga Live'],
};

function getSchedule(category: string): string[] {
  return SCHEDULE_TEMPLATES[category] || SCHEDULE_TEMPLATES.general;
}

function getCurrentProgram(channel: WorldChannel): { current: string; next: string; progress: number } {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const schedule = getSchedule(channel.category);
  // Derive a program slot from current time (30-60 min slots)
  const slotDuration = 45;
  const slotIndex = Math.floor(minutes / slotDuration) % schedule.length;
  const nextIndex = (slotIndex + 1) % schedule.length;
  const slotStart = Math.floor(minutes / slotDuration) * slotDuration;
  const progress = Math.round(((minutes - slotStart) / slotDuration) * 100);

  return {
    current: schedule[slotIndex],
    next: schedule[nextIndex],
    progress,
  };
}

function formatTime(offset = 0): string {
  const d = new Date(Date.now() + offset);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getRoundedTime(minuteSlot: number): string {
  const now = new Date();
  const slotDuration = 45;
  const current = now.getHours() * 60 + now.getMinutes();
  const slotStart = Math.floor(current / slotDuration) * slotDuration;
  const targetMinutes = slotStart + minuteSlot * slotDuration;
  const h = Math.floor(targetMinutes / 60) % 24;
  const m = targetMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function EPGGuide({ channel }: EPGGuideProps) {
  const [prog, setProg] = useState(() => getCurrentProgram(channel));
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setProg(getCurrentProgram(channel));
  }, [channel]);

  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      setProg(getCurrentProgram(channel));
    }, 30000);
    return () => clearInterval(t);
  }, [channel]);

  const schedule = getSchedule(channel.category);
  const slotDuration = 45;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const currentSlot = Math.floor(minutes / slotDuration);

  return (
    <div className="bg-[#0d0d1f] border-t border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Guide TV · EPG</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-[10px] text-gray-500 font-mono">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Now Playing */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[9px] font-black text-white">MAINTENANT</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{prog.current}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {getRoundedTime(0)} – {getRoundedTime(1)} · {channel.language || 'Multilangue'}
            </p>
            {/* Progress bar */}
            <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-1000"
                style={{ width: `${prog.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-gray-600 mt-0.5">{prog.progress}% · reste ~{Math.round((100 - prog.progress) * 0.45)} min</p>
          </div>
        </div>

        {/* Upcoming programs */}
        <div className="space-y-1.5">
          {[1, 2, 3].map(offset => {
            const idx = (currentSlot + offset) % schedule.length;
            return (
              <div key={offset} className="flex items-center gap-2.5 py-1.5 opacity-60">
                <span className="text-[10px] text-gray-500 font-mono w-11 flex-shrink-0">{getRoundedTime(offset)}</span>
                <ChevronRight className="h-3 w-3 text-gray-700 flex-shrink-0" />
                <p className="text-xs text-gray-400 truncate">{schedule[idx]}</p>
                <div className="ml-auto flex-shrink-0">
                  <Tv className="h-3 w-3 text-gray-700" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
