import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tv, Radio, Users, Grid3x3, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Tv, label: 'TV' },
  { path: '/radio', icon: Radio, label: 'Radio' },
  { path: '/community', icon: Users, label: 'Social' },
  { path: '/categories', icon: Grid3x3, label: 'Catégories' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const delta = currentY - lastScrollY.current;
          if (delta > 8 && currentY > 80) {
            setVisible(false);
          } else if (delta < -8 || currentY < 80) {
            setVisible(true);
          }
          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always show when route changes
  useEffect(() => {
    setVisible(true);
    lastScrollY.current = 0;
  }, [location.pathname]);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-[#0f0f1e]/98 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="flex items-stretch max-w-5xl mx-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all duration-150 relative min-h-[52px] ${
                  isActive ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400 active:scale-95'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-yellow-500/0 via-yellow-500 to-yellow-500/0" />
                )}
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-yellow-500/10' : ''}`}>
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {path === '/community' && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-500 rounded-full border border-[#0f0f1e]" />
                  )}
                </div>
                <span className={`text-[9px] font-semibold ${isActive ? 'text-yellow-400' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
