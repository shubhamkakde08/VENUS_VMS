import React, { useState } from 'react';
import { Shield, Key, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Building2, Lock } from 'lucide-react';
import { vmsEngine, DEFAULT_USERS } from '../../services/vmsEngine';
import { UserMasterItem } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserMasterItem) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel, isModal = false }) => {
  const logoConfig = vmsEngine.getLogoConfig();
  const [username, setUsername] = useState('guard.patil');
  const [password, setPassword] = useState('Guard@123');
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = vmsEngine.authenticate(username, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.message);
      return;
    }

    setSuccessMsg(result.message);
    setTimeout(() => {
      onLoginSuccess(result.user!);
    }, 400);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className={
      isModal 
        ? "fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto" 
        : "min-h-screen w-full bg-slate-950 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden"
    }>
      {/* Decorative ambient background for standalone full-screen login */}
      {!isModal && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Outer Card matching uploaded LocusVMS style */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-300 dark:border-slate-800 min-h-[580px] md:h-[660px] relative z-10">
        
        {/* Left Hero Pane: Signature Venus Navy Blue & Brand */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-[#1C2E63] via-[#152146] to-[#0C132B] p-8 md:p-12 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10">
            {/* Venus Pipes Logo Monogram */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-lg shadow-black/30 overflow-hidden">
                {logoConfig.logoUrl && logoConfig.logoUrl !== 'DEFAULT_VENUS_SVG' ? (
                  <img src={logoConfig.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg viewBox="0 0 450 150" className="w-full h-auto">
                    <path d="M 20 20 L 70 120 L 120 20" fill="none" stroke="#1C2E63" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 140 120 C 140 70, 180 70, 180 120 C 180 70, 220 70, 220 120" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                    <path d="M 250 20 L 250 120 C 250 120, 280 130, 310 110 C 340 90, 340 30, 310 20 C 280 10, 280 60, 320 70" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                    <path d="M 370 20 C 340 20, 340 60, 370 70 C 400 80, 400 120, 370 120" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">VenusVMS</h1>
                <p className="text-xs text-slate-300 font-medium tracking-wide">{logoConfig.companyName}</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                Plant Gate Pass & Identity Governance
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed font-light">
                A powerful, yet easy-to-use enterprise platform for managing high-security perimeter gates, automated GP series tokens, webcam badges, and dynamic role master permissions across Bhuj manufacturing units.
              </p>
            </div>
          </div>

          {/* Quick 1-Click Role Login Selector */}
          <div className="relative z-10 mt-8 pt-5 border-t border-slate-700/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Select Demo User ID Profile
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('guard.patil', 'Guard@123')}
                className={`px-2 py-2 rounded-xl text-left border transition ${
                  username === 'guard.patil'
                    ? 'bg-emerald-950/70 border-emerald-500/80'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700'
                }`}
              >
                <span className="block text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Guard
                </span>
                <span className="block text-[11px] font-mono text-slate-200 truncate">guard.patil</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('hr.sharma', 'Hr@123')}
                className={`px-2 py-2 rounded-xl text-left border transition ${
                  username === 'hr.sharma'
                    ? 'bg-cyan-950/70 border-cyan-500/80'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700'
                }`}
              >
                <span className="block text-[9px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                  <User className="w-3 h-3" /> HR Desk
                </span>
                <span className="block text-[11px] font-mono text-slate-200 truncate">hr.sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('shubham.kakde', 'Admin@123')}
                className={`px-2 py-2 rounded-xl text-left border transition ${
                  username === 'shubham.kakde'
                    ? 'bg-amber-950/70 border-amber-500/80'
                    : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700'
                }`}
              >
                <span className="block text-[9px] text-amber-400 font-bold uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Admin
                </span>
                <span className="block text-[11px] font-mono text-slate-200 truncate">shubham.kakde</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-slate-500">
              <span>Version 2.1 &bull; Active Node 01</span>
              <span>&copy; 2026 Venus Pipes & Tubes Ltd</span>
            </div>
          </div>
        </div>

        {/* Right Form Pane: Authentic Locus style with User ID */}
        <div className="w-full md:w-7/12 p-8 md:p-14 flex flex-col justify-between bg-white dark:bg-slate-900 relative">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-400">Enterprise Access Gateway</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Don't have an account?</span>
              <button 
                type="button" 
                onClick={() => alert('New User ID creation is managed centrally via the Admin User Master panel.')}
                className="text-xs font-bold px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition uppercase tracking-wider"
              >
                REQUEST ID
              </button>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto my-auto py-6">
            <div className="mb-7">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Log into VenusVMS
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Enter your employee username (<code className="text-blue-600 dark:text-blue-400 font-mono">firstname.lastname</code> format) and password.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  EMPLOYEE USER ID / USERNAME (NOT EMAIL)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500 focus:border-[#1C2E63] dark:focus:border-blue-500 transition outline-none font-mono font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                    placeholder="e.g. shubham.kakde or guard.patil"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format: <span className="font-mono">name.surname</span> (Configured in User Master)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset request notified to IT Security desk (shubham.kakde).');
                    }}
                    className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500 focus:border-[#1C2E63] dark:focus:border-blue-500 transition outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                    placeholder="Enter security passphrase"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="authRemember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 text-[#1C2E63] border-slate-300 rounded focus:ring-[#1C2E63] cursor-pointer"
                />
                <label htmlFor="authRemember" className="ml-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  Remember this security terminal
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-slate-900 hover:bg-[#1C2E63] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>SIGN IN & AUTHENTICATE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Plant IT Security Node #01 &bull; Active Directory Synced</span>
            {onCancel && (
              <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
