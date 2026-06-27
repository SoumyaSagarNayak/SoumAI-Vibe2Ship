import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import AIChat from './pages/AIChat';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import FocusSession from './pages/FocusSession';
import { authService } from './services/firebase';
import type { UserProfile } from './services/firebase';
import { WorkspaceProvider } from './context/WorkspaceContext';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((profile: any) => {
      setUser(profile);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-m-blue-light border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold tracking-widest text-ink uppercase">
            Starting SOUM Engine...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Page Content conditionally based on page routing state
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskManagement />;
      case 'focus':
        return <FocusSession />;
      case 'chat':
        return <AIChat />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
        
        {/* Sidebar Navigation */}
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          user={user} 
          onLogout={handleLogout} 
        />

        {/* Main Workspace Frame */}
        <main className="flex-1 flex flex-col min-w-0">
          {renderPage()}
        </main>

      </div>
    </WorkspaceProvider>
  );
}
