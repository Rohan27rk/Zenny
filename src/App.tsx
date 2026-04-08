import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { ProfileSetup } from './pages/ProfileSetup';
import { Dashboard } from './pages/Dashboard';
import { DollarSign } from 'lucide-react';
import { ZennyLogo } from './components/ZennyLogo';

type AppPage = 'landing' | 'auth';

function AppContent() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [page, setPage] = useState<AppPage>('landing');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #1a1a2e 100%)' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 40px rgba(139,92,246,0.6)' }}>
            <ZennyLogo size={42} />
          </div>
          <p className="text-white font-bold text-lg">Zenny</p>
          <p className="text-slate-500 text-sm animate-pulse mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  // Still loading profile after login
  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #1a1a2e 100%)' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 40px rgba(139,92,246,0.6)' }}>
            <ZennyLogo size={42} />
          </div>
          <p className="text-white font-bold text-lg">Zenny</p>
          <p className="text-slate-500 text-sm animate-pulse mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  // Logged in but profile not set up yet (or profile null — treat as onboarding)
  if (user && (!profile || !profile.onboarding_complete)) {
    return <ProfileSetup />;
  }

  // Logged in and profile complete
  if (user && profile?.onboarding_complete) {
    return <Dashboard />;
  }

  // Not logged in
  if (page === 'auth') {
    return <Auth onBack={() => setPage('landing')} />;
  }

  return <Landing onGetStarted={() => setPage('auth')} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
