import React, { useState } from 'react';
import { Zap, Calendar, MessageSquare, BrainCircuit, ChevronRight } from 'lucide-react';
import { authService } from '../services/firebase';
import type { UserProfile } from '../services/firebase';
import SoumLogo from '../components/SoumLogo';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await authService.signIn(email, password);
      } else {
        user = await authService.signUp(email, password);
      }
      onLoginSuccess(user);
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const guestUser = await authService.signIn('guest@lifesaver.ai', 'guestPassword123');
      onLoginSuccess(guestUser);
    } catch (e: any) {
      setError('Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BrainCircuit, name: 'Planner Agent', desc: 'Decomposes complex workflows into structured subtask timelines.' },
    { icon: Zap, name: 'Priority Agent', desc: 'Evaluates task effort and deadlines against active workload limits.' },
    { icon: Calendar, name: 'Scheduler Agent', desc: 'Schedules items into Morning, Afternoon, and Evening plans.' },
    { icon: MessageSquare, name: 'AI Chat Assistant', desc: 'Parses conversation descriptions to bulk-extract tasks instantly.' }
  ];

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col items-center justify-center p-4 relative overflow-hidden font-light selection:bg-ink selection:text-canvas">
      {/* Subtle Background Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[4px] m-stripe" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-m-blue-dark/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 my-8">
        
        {/* Marketing Hero (7 columns) */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-hairline bg-surface-soft text-ink text-[10px] font-bold uppercase tracking-[1.5px]">
            <div className="w-4 h-4"><SoumLogo /></div>
            SOUM AI: Multi-Agent Workspace
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-none text-ink uppercase">
            MEET THE LAST-MINUTE <br className="hidden md:inline" />
            <span className="text-transparent bg-gradient-to-r from-ink via-body-strong to-muted bg-clip-text">SOUM AI COMPANION</span>
          </h1>
          
          <p className="text-body text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
            SOUM AI Companion operates a network of active cognitive agents that automatically break down tasks, calculate priority levels, and draft daily schedules before deadlines crash.
          </p>

          {/* Grid of Agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-hairline">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4 bg-surface-card border border-hairline rounded-none">
                  <div className="p-2 bg-canvas border border-hairline text-ink shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[1.5px] text-ink">{f.name}</h3>
                    <p className="text-xs text-body mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Authentication Card (5 columns) */}
        <div className="lg:col-span-5">
          <div className="bg-surface-card border border-hairline rounded-none p-6 md:p-8 shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] m-stripe" />
            
            <div className="text-center mb-6 pt-2">
              <h2 className="text-lg font-bold text-ink uppercase tracking-[1.5px]">
                {isLogin ? 'Workspace Authentication' : 'Create Agent Account'}
              </h2>
              <p className="text-muted text-[10px] uppercase font-bold tracking-wider mt-1.5">
                {isLogin ? 'Enter credentials or login as Guest' : 'Setup your workspace keys'}
              </p>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 border border-m-red/35 bg-m-red/5 text-m-red text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. pilot@lifesaver.ai"
                  className="w-full bmw-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bmw-input text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bmw-btn-primary"
              >
                {loading ? 'Consulting Auth...' : isLogin ? 'Access Workspace' : 'Initialize Account'}
              </button>
            </form>

            <div className="relative my-5 text-center">
              <span className="absolute inset-x-0 top-1/2 border-t border-hairline -z-10" />
              <span className="px-3 bg-surface-card text-muted text-[10px] font-bold uppercase tracking-widest">or</span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full bmw-btn-secondary flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-ink" />
                Initialize Guest Mode
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-center bmw-link hover:underline mt-2 justify-center"
              >
                {isLogin ? 'Register New Profile' : 'Existing Workspace login'}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
