import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Timer
} from 'lucide-react';
import { authService } from '../services/firebase';
import type { UserProfile } from '../services/firebase';
import SoumLogo from './SoumLogo';

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export default function Navigation({ currentPage, setCurrentPage, user, onLogout }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', name: 'Task Manager', icon: CheckSquare },
    { id: 'focus', name: 'Focus Session', icon: Timer },
    { id: 'chat', name: 'AI Assistant', icon: MessageSquare },
    { id: 'calendar', name: 'Calendar View', icon: Calendar },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const handleNav = (pageId: string) => {
    setCurrentPage(pageId);
    setIsOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      await authService.logout();
      onLogout();
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-card border-b border-hairline text-ink z-50 sticky top-0 relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
        <div className="flex items-center gap-2 mt-1">
          <div className="w-8 h-8 flex items-center justify-center">
            <SoumLogo withText={false} />
          </div>
          <span className="font-extrabold text-base tracking-widest text-ink uppercase">
            SOUM
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1.5 rounded-none border border-hairline bg-canvas hover:bg-surface-card transition-colors cursor-pointer"
        >
          {isOpen ? <X className="w-4 h-4 text-ink" /> : <Menu className="w-4 h-4 text-ink" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-canvas border-r border-hairline p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Box with M-stripe accent */}
          <div className="flex flex-col gap-3 px-2 py-4 mb-6 border-b border-hairline-strong relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 flex items-center justify-center">
                <SoumLogo withText={false} />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-widest text-ink leading-none uppercase">
                  SOUM
                </h1>
                <span className="text-[9px] text-muted tracking-[1.5px] font-semibold uppercase block mt-1">
                  AI COMPANION
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-none font-bold text-xs uppercase tracking-[1.5px] transition-all duration-150 group relative cursor-pointer
                    ${isActive 
                      ? 'bg-surface-card text-ink border-l-[3.5px] border-m-blue-dark pl-[12.5px]' 
                      : 'text-body hover:text-ink hover:bg-surface-soft/60'
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-ink' : 'text-muted group-hover:text-ink'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-hairline-strong pt-5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-surface-card border border-hairline flex items-center justify-center font-bold text-sm text-ink rounded-none">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider truncate text-ink">
                {user?.displayName || 'User'}
              </p>
              <p className="text-[10px] truncate text-muted">
                {user?.email || 'guest@soum.ai'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-none border border-hairline text-ink bg-surface-card hover:bg-canvas hover:border-ink text-[10px] font-bold tracking-[1.5px] uppercase transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile navigation drawer */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-30 md:hidden"
        />
      )}
    </>
  );
}
