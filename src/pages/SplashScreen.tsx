import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotIndex(d => (d + 1) % 4);
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(onContinue, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onContinue]);

  const dots = ['', '.', '..', '...'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0533] via-[#2d0d66] to-[#1a0533] flex flex-col items-center justify-between py-12 overflow-hidden relative">
      {/* Background channel logos collage */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="grid grid-cols-5 gap-1 -rotate-12 scale-125 translate-y-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/20 rounded flex items-center justify-center text-xs text-white">
              {['📺','📡','🎬','🎵','📰','⚽','🎭'][i % 7]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-36 h-36 rounded-3xl bg-black/60 border-2 border-yellow-500/50 overflow-hidden shadow-2xl shadow-yellow-500/20 backdrop-blur flex items-center justify-center">
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
              alt="MKV SAT+"
              className="w-28 h-28 object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = 'none';
              }}
            />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-yellow-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-black text-yellow-500 tracking-widest text-center mb-2 drop-shadow-lg">
          MKV SAT+
        </h1>
        <p className="text-sm font-semibold text-yellow-400/80 tracking-[0.2em] text-center uppercase mb-12">
          LE MONDE DANS LA POCHE
        </p>

        {/* Loading indicator */}
        <div className="w-full space-y-3">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Loading channels{dots[dotIndex]}</span>
            <span className="text-xs font-bold text-yellow-500">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Continue button appears at 100% */}
      {progress >= 100 && (
        <button
          onClick={onContinue}
          className="z-10 px-12 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-black font-black text-lg tracking-widest shadow-2xl shadow-yellow-500/40 hover:scale-105 transition-transform animate-fade-in"
        >
          CONTINUER
        </button>
      )}

      {/* Footer */}
      <p className="z-10 text-[10px] text-gray-500 tracking-widest">
        Tous Droits Réservés © MKV SAT+ — 2025
      </p>
    </div>
  );
}
