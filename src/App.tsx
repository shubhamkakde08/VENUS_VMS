import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { SecurityGuardConsole } from './components/security/SecurityGuardConsole';
import { HRApprovalView } from './components/hr/HRApprovalView';
import { AdminControlPanel } from './components/admin/AdminControlPanel';
import { VisitorPreRegistration } from './components/visitor/VisitorPreRegistration';
import { LoginView } from './components/auth/LoginView';
import { PrintableBadgeModal } from './components/common/PrintableBadgeModal';
import { vmsEngine } from './services/vmsEngine';
import { VenusGatePass, UserMasterItem } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if user session exists in storage
    return localStorage.getItem('venus_vms_auth') === 'true';
  });
  const [currentView, setCurrentView] = useState<'SECURITY' | 'HR' | 'ADMIN' | 'PRE_REG'>('SECURITY');
  const [isDark, setIsDark] = useState<boolean>(vmsEngine.getTheme() === 'dark');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activePrintPass, setActivePrintPass] = useState<VenusGatePass | null>(null);

  // Sync theme with HTML document class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const nextTheme = vmsEngine.toggleTheme();
    setIsDark(nextTheme === 'dark');
  };

  const handleLoginSuccess = (user: UserMasterItem) => {
    localStorage.setItem('venus_vms_auth', 'true');
    setIsAuthenticated(true);
    setIsLoginOpen(false);
    // Route to appropriate view based on role
    if (user.role === 'ADMIN') {
      setCurrentView('ADMIN');
    } else if (user.role === 'HR') {
      setCurrentView('HR');
    } else {
      setCurrentView('SECURITY');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('venus_vms_auth');
    setIsAuthenticated(false);
    setIsLoginOpen(false);
  };

  // If not authenticated, render pure full-screen login page (no dashboard underneath)
  if (!isAuthenticated) {
    return (
      <div className={isDark ? 'dark bg-slate-950 text-slate-100 min-h-screen' : 'bg-slate-950 text-slate-100 min-h-screen'}>
        <LoginView
          isModal={false}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {currentView === 'SECURITY' && (
          <SecurityGuardConsole onOpenPrintBadge={(p) => setActivePrintPass(p)} />
        )}

        {currentView === 'HR' && (
          <HRApprovalView />
        )}

        {currentView === 'PRE_REG' && (
          <VisitorPreRegistration 
            onOpenPrintBadge={(p) => setActivePrintPass(p)} 
            onNavigateToSecurity={() => setCurrentView('SECURITY')}
          />
        )}

        {currentView === 'ADMIN' && (
          <AdminControlPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        &copy; 2026 Venus Pipes and Tubes Limited &bull; Enterprise Visitor Management &amp; Security &bull; MySQL 8.4 LTS
      </footer>

      {/* Split-Pane Login Window (LocusVMS Style with Employee User ID) */}
      {isLoginOpen && (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setIsLoginOpen(false)}
        />
      )}

      {/* Physical Pass Badge Print Modal */}
      <PrintableBadgeModal
        pass={activePrintPass}
        isOpen={Boolean(activePrintPass)}
        onClose={() => setActivePrintPass(null)}
      />
    </div>
  );
}
