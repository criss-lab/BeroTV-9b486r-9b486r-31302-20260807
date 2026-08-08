import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/pages/SplashScreen';
import { TVPage } from '@/pages/TVPage';
import { RadioPage } from '@/pages/RadioPage';
import { TrendingPage } from '@/pages/TrendingPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { PodcastPage } from '@/pages/PodcastPage';
import { LivePage } from '@/pages/LivePage';
import { SearchPage } from '@/pages/SearchPage';
import { PremiumPage } from '@/pages/PremiumPage';
import { PaymentCallbackPage } from '@/pages/PaymentCallbackPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { AdminPage } from '@/pages/AdminPage';
import { useState } from 'react';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useState(() => {
    window.scrollTo(0, 0);
  });
  return null;
}

function AppContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-black border border-yellow-500/30 overflow-hidden mx-auto mb-4">
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/BVZmK6t8Khs4L6jZx5ZqrY/IMG-20251227-WA0007.jpg"
              alt="MKV SAT+"
              className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/2 bg-yellow-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onContinue={() => setShowSplash(false)} />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TVPage />} />
        <Route path="/radio" element={<RadioPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/podcasts" element={<PodcastPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/payment-callback" element={<PaymentCallbackPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: '#0f0f1e',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
