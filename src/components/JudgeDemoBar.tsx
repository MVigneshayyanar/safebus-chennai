'use client';

import React, { useState } from 'react';
import { 
  Trophy, Sparkles, CheckCircle2, ChevronDown, ChevronUp, 
  Terminal, ShieldCheck, Search, Network, ArrowRight, Play, Eye
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface JudgeDemoBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  locale: Locale;
  onRunCrawler?: () => void;
}

export default function JudgeDemoBar({ activeTab, setActiveTab, locale, onRunCrawler }: JudgeDemoBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const scenarios = [
    {
      module: 'Module 1',
      title: 'Automated Crawler Bot & Typosquat Discovery',
      tab: 'enforcement',
      subTab: 'domains',
      description: 'Crawls unregistered domains, extracts payment VPAs, and compiles CERT-In takedown feeds.',
      badge: 'PS4 Req #1',
    },
    {
      module: 'Module 2',
      title: 'Cryptographic Ed25519 Ticket QR Verification',
      tab: 'verifier',
      subTab: null,
      description: 'Decentralized RFC-7515 signature verification with Kilambakkam duplicate boarding prevention.',
      badge: 'PS4 Req #2',
    },
    {
      module: 'Module 3',
      title: 'Merchant Verification & STA License Validation',
      tab: 'operators',
      subTab: null,
      description: 'Checks omnibus permits, GSTIN, PAN, and registered merchant UPI against STA registry.',
      badge: 'PS4 Req #3',
    },
    {
      module: 'Module 4',
      title: 'Scam Syndicate Graph & Citizen Reporting',
      tab: 'enforcement',
      subTab: 'syndicates',
      description: 'Uncovers coordinated crime rings sharing fraudulent UPI VPAs and burner phones in South Chennai.',
      badge: 'PS4 Req #4',
    },
    {
      module: 'Module 5',
      title: 'Aggregator Verification API (redBus / MMT)',
      tab: 'developer',
      subTab: null,
      description: 'Central registry API allowing travel aggregators to verify permits before listing omnibus routes.',
      badge: 'PS4 Req #5',
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-[#183264] via-[#1f3f7d] to-[#183264] text-white border-b-2 border-[#FF7F50] shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#FF7F50] text-[#183264] shrink-0 font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">
                  NextGen AI Hacks 2026 • Judge & Evaluator Demo Bar
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF7F50] text-[#183264] text-[10px] font-black uppercase tracking-wider">
                  Theme 3 / PS No. 4
                </span>
                <span className="hidden md:inline-block text-[10px] text-slate-300 font-mono">
                  Rajalakshmi Eng College × UPS
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Hide Scenarios' : 'Evaluate 5 Modules'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible 1-Click Evaluation Scenarios */}
        {isExpanded && (
          <div className="pt-2.5 pb-1 space-y-2">
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>Click any scenario below for an instant live demonstration of all 5 required modules:</span>
              <span className="font-mono text-[#FF7F50] text-[10px] font-bold hidden sm:inline">100% PS4 COMPLIANT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {scenarios.map((sc, idx) => {
                const isActive = activeTab === sc.tab;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTab(sc.tab);
                    }}
                    className={`p-2 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                      isActive 
                        ? 'bg-white text-[#183264] border-[#FF7F50] shadow-sm ring-2 ring-[#FF7F50]/40' 
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-[#FF7F50] text-[#183264]' : 'bg-white/20 text-white'
                        }`}>
                          {sc.module}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-[#FF7F50]' : 'text-slate-300'}`}>
                          {sc.badge}
                        </span>
                      </div>
                      <div className="font-bold text-xs leading-tight line-clamp-2">
                        {sc.title}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] pt-1 border-t border-current/10">
                      <span className="opacity-80">Test Live</span>
                      <ArrowRight className="w-3 h-3 text-[#FF7F50]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
