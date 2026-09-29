'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, PhoneCall, QrCode, Search, Flag, Bus, 
  Activity, Terminal, Shield, User, Lock, LogOut, CheckCircle2, X
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OFFICER';
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  locale: Locale;
  setLocale: (loc: Locale) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  locale, 
  setLocale,
  user,
  setUser,
  showLoginModal,
  setShowLoginModal
}: NavbarProps) {
  const isTa = locale === 'ta';

  const [loginEmail, setLoginEmail] = useState('admin@safebus.in');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (emailToUse?: string, passToUse?: string) => {
    setLoginLoading(true);
    setLoginError(null);
    const email = emailToUse || loginEmail;
    const password = passToUse || loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }
      setUser(json.data.user);
      setShowLoginModal(false);
      setActiveTab('enforcement');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveTab('verifier');
    } catch {}
  };

  // Role-Based Navigation Filtering:
  // 1. PUBLIC / GUEST: Passenger verification and reporting tools alone
  // 2. OFFICER: Enforcement role functionality alone (RTO Enforcement, Verify, Registry, Check Link)
  // 3. ADMIN: FULL WEBSITE (All 6 modules including Web Scraper Crawler Bot & Aggregator Registry API)
  const allNavItems = [
    { id: 'verifier', label: isTa ? 'சரிபார்' : 'Verify', fullLabel: isTa ? 'டிக்கெட் சரிபார்' : 'Verify Ticket', icon: QrCode, roles: ['PUBLIC', 'OFFICER', 'ADMIN'] },
    { id: 'checker', label: isTa ? 'சோதனை' : 'Check', fullLabel: isTa ? 'தள / UPI சோதனை' : 'Check Link', icon: Search, roles: ['PUBLIC', 'OFFICER', 'ADMIN'] },
    { id: 'report', label: isTa ? 'புகார்' : 'Report', fullLabel: isTa ? 'புகார் செய்' : 'Report Fraud', icon: Flag, roles: ['PUBLIC', 'ADMIN'] },
    { id: 'operators', label: isTa ? 'பேருந்து' : 'Registry', fullLabel: isTa ? 'ஆம்னிபஸ் பதிவேடு' : 'Omnibus Registry', icon: Bus, roles: ['PUBLIC', 'OFFICER', 'ADMIN'] },
    { id: 'enforcement', label: isTa ? 'அதிகாரி' : 'RTO', fullLabel: isTa ? 'அதிகாரிகள்' : 'RTO Enforcement', icon: Activity, roles: ['OFFICER', 'ADMIN'] },
    { id: 'developer', label: isTa ? 'API' : 'API', fullLabel: isTa ? 'API கன்சோல்' : 'Aggregator API', icon: Terminal, roles: ['ADMIN'] },
  ];

  const currentRole = user ? user.role : 'PUBLIC';
  const navItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E3E8F2] shadow-xs">
      {/* Top Tamil Nadu Transport Alert Header Band */}
      <div className="bg-[#183264] text-white px-3 py-1.5 text-[11px] sm:text-xs flex flex-wrap items-center justify-between gap-1.5 border-b border-[#12254b]">
        <div className="flex items-center gap-1.5 font-medium flex-1 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-[#FF7F50] animate-ping shrink-0" />
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
          <span className="truncate">
            {isTa
              ? 'பண்டிகை கால எச்சரிக்கை: கிளம்பாக்கம் (KCBT) போலி டிக்கெட் விற்பனை எச்சரிக்கை!'
              : 'Festival Advisory: Omnibus scam alert active at Kilambakkam & Tambaram.'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px]">
          <a
            href="tel:1930"
            className="flex items-center gap-1 bg-[#FF7F50] text-[#183264] px-2 py-0.5 rounded font-bold hover:bg-[#ff956e] transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>1930</span>
          </a>
          <span className="text-white/80 hidden md:inline">STA: 1800-425-6151</span>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo (Shield + Bus SVG inline in palette) */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none" onClick={() => setActiveTab('verifier')}>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#183264] flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#183264" stroke="#FF7F50" strokeWidth="1.5" />
                <rect x="8" y="7" width="8" height="9" rx="1.5" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M8 12h8" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="10" cy="14" r="0.75" fill="#FF7F50" />
                <circle cx="14" cy="14" r="0.75" fill="#FF7F50" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-bold tracking-tight text-[#183264] truncate">
                  SafeBus <span className="text-[#FF7F50]">Chennai</span>
                </span>
                <span className="hidden xs:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#183264]/10 text-[#183264] border border-[#183264]/20">
                  STA-TN
                </span>
              </div>
              <p className="text-[10px] text-[#4A5D7E] leading-none truncate hidden sm:block">
                {isTa ? 'தென் சென்னை பேருந்து டிக்கெட் மோசடி தடுப்பு தளம்' : 'Omnibus Scam Prevention • South Chennai'}
              </p>
            </div>
          </div>

          {/* Verification Badge (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-[#F5F7FB] px-3.5 py-1.5 rounded-full border border-[#E3E8F2] text-[#183264] font-medium">
            <span className="h-2 w-2 rounded-full bg-[#1E9E5A]" />
            <span>Ed25519 Cryptographic Gate</span>
            <span className="text-slate-300">•</span>
            <span>Kilambakkam (KCBT) RTO</span>
          </div>

          {/* Right Controls: Admin Login + Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin / Officer Profile or Login Trigger */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-2.5 py-1 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#1E9E5A]" />
                <span className="font-bold text-[#183264] max-w-[120px] truncate hidden sm:inline">
                  {user.name} ({user.role})
                </span>
                <span className="font-bold text-[#183264] sm:hidden">
                  {user.role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[#4A5D7E] hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl bg-[#183264] text-white hover:bg-[#12254b] transition-all cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#FF7F50]" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center bg-[#F5F7FB] rounded-xl p-0.5 border border-[#E3E8F2]">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  locale === 'en'
                    ? 'bg-[#183264] text-white shadow-xs'
                    : 'text-[#4A5D7E] hover:text-[#183264]'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale('ta')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  locale === 'ta'
                    ? 'bg-[#183264] text-white shadow-xs'
                    : 'text-[#4A5D7E] hover:text-[#183264]'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop Top Navigation >= 640px) */}
        <nav className="hidden sm:flex space-x-2 py-2 border-t border-[#E3E8F2] overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF7F50] text-[#183264] shadow-xs'
                    : 'text-[#4A5D7E] hover:text-[#183264] hover:bg-[#F5F7FB]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#183264]' : 'text-[#4A5D7E]'}`} />
                <span>{item.fullLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Tab Bar (< 640px screen width) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E3E8F2] px-1 py-1 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-all min-h-[44px] cursor-pointer ${
                isActive ? 'text-[#183264]' : 'text-[#4A5D7E]'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-transform ${isActive ? 'bg-[#FF7F50] text-[#183264] scale-110 shadow-xs' : 'text-[#4A5D7E]'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`mt-0.5 leading-none ${isActive ? 'font-extrabold text-[#183264]' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Admin / Officer Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#E3E8F2] relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3E8F2] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#183264] text-[#FF7F50]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#183264]">Admin & Officer Portal</h3>
                  <p className="text-[11px] text-[#4A5D7E]">State Transport Authority (STA) Command Center</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="text-[#4A5D7E] hover:text-[#183264] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Demo Login Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#4A5D7E] uppercase tracking-wider">
                1-Click Quick Demo Credentials
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLogin('admin@safebus.in', 'admin123')}
                  disabled={loginLoading}
                  className="p-2.5 rounded-xl border border-[#E3E8F2] bg-[#F5F7FB] hover:border-[#183264] text-left transition-all cursor-pointer"
                >
                  <div className="font-bold text-xs text-[#183264] flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#FF7F50]" />
                    <span>SafeBus Admin</span>
                  </div>
                  <div className="text-[10px] text-[#4A5D7E] font-mono mt-0.5 truncate">
                    admin@safebus.in
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin('officer@safebus.in', 'officer123')}
                  disabled={loginLoading}
                  className="p-2.5 rounded-xl border border-[#E3E8F2] bg-[#F5F7FB] hover:border-[#183264] text-left transition-all cursor-pointer"
                >
                  <div className="font-bold text-xs text-[#183264] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#1E9E5A]" />
                    <span>RTO Inspector</span>
                  </div>
                  <div className="text-[10px] text-[#4A5D7E] font-mono mt-0.5 truncate">
                    officer@safebus.in
                  </div>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {loginError}
              </div>
            )}

            {/* Manual Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3 pt-1"
            >
              <div>
                <label className="block text-xs font-bold text-[#183264] mb-1">Officer Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="admin@safebus.in"
                  className="w-full text-xs p-2.5 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183264] mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-coral w-full py-2.5 text-xs font-bold cursor-pointer shadow-sm mt-2"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to Enforcement Center'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
