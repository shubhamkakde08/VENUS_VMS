import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Sliders, Moon, Sun, LogOut, 
  User, CheckCircle2, KeyRound, Building2, UserCheck
} from 'lucide-react';
import { vmsEngine } from '../../services/vmsEngine';
import { UserMasterItem } from '../../types';

interface HeaderProps {
  currentView: 'SECURITY' | 'HR' | 'ADMIN' | 'PRE_REG';
  onNavigate: (view: 'SECURITY' | 'HR' | 'ADMIN' | 'PRE_REG') => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onLogout,
  isDark,
  onToggleTheme
}) => {
  const [currentUser, setCurrentUser] = useState<UserMasterItem>(vmsEngine.getCurrentUser());
  const [logoConfig, setLogoConfig] = useState(vmsEngine.getLogoConfig());
  const [liveTime, setLiveTime] = useState('');
  const [nextId, setNextId] = useState(vmsEngine.generateNextGatePassId());
  const dateKey = vmsEngine.getSystemDateKey();
  const stats = vmsEngine.getStats();

  useEffect(() => {
    const unsub = vmsEngine.subscribe(() => {
      setCurrentUser(vmsEngine.getCurrentUser());
      setNextId(vmsEngine.generateNextGatePassId());
      setLogoConfig(vmsEngine.getLogoConfig());
    });
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors">
      {/* Top Navbar */}
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            {logoConfig.showLogoOnHeader && (
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden"
                style={{ backgroundColor: logoConfig.primaryColor || '#1C2E63' }}
              >
                {logoConfig.logoUrl && logoConfig.logoUrl !== 'DEFAULT_VENUS_SVG' ? (
                  <img src={logoConfig.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg viewBox="0 0 450 150" className="w-full h-auto">
                    <path d="M 20 20 L 70 120 L 120 20" fill="none" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 140 120 C 140 70, 180 70, 180 120 C 180 70, 220 70, 220 120" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                    <path d="M 250 20 L 250 120 C 250 120, 280 130, 310 110 C 340 90, 340 30, 310 20 C 280 10, 280 60, 320 70" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                    <path d="M 370 20 C 340 20, 340 60, 370 70 C 400 80, 400 120, 370 120" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold text-[#1C2E63] dark:text-white tracking-tight uppercase truncate">
                {logoConfig.companyName}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block">
                {logoConfig.tagline}
              </p>
            </div>
          </div>

          {/* Role Navigation Switcher & Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Desktop / Tablet Role Navigation Tabs */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => onNavigate('SECURITY')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'SECURITY'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security</span>
              </button>

              <button
                onClick={() => onNavigate('PRE_REG')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'PRE_REG'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pre-Reg</span>
              </button>

              <button
                onClick={() => onNavigate('HR')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'HR'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>HR Desk</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'ADMIN'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Profile Info & Switch User */}
            <div className="flex items-center space-x-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 hover:opacity-85 transition text-left"
                title="Click to Switch User Persona or Log Out"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1C2E63] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                    <span>{currentUser.firstName} {currentUser.lastName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : currentUser.role === 'HR'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {currentUser.username}
                  </div>
                </div>
              </button>

              <button
                onClick={onLogout || onOpenLogin}
                title="Log Out"
                className="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Segmented Bar (< 640px) */}
        <div className="sm:hidden pb-2.5 pt-1">
          <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-bold text-center">
            <button
              onClick={() => onNavigate('SECURITY')}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                currentView === 'SECURITY'
                  ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Guard</span>
            </button>

            <button
              onClick={() => onNavigate('PRE_REG')}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                currentView === 'PRE_REG'
                  ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pre-Reg</span>
            </button>

            <button
              onClick={() => onNavigate('HR')}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                currentView === 'HR'
                  ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>HR</span>
            </button>

            <button
              onClick={() => onNavigate('ADMIN')}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                currentView === 'ADMIN'
                  ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

      </div>

      {/* Clean Sub-header: Live Status & Metrics Bar */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Gate Operations Live</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{liveTime || '11:16 AM'}</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
            <span>Inside: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.activeInside}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>Today: <strong className="text-slate-900 dark:text-white font-bold">{stats.todayTotal}</strong></span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="hidden md:inline">Main Gate Desks 01 & 02</span>
          </div>
        </div>
      </div>
    </header>
  );
};
