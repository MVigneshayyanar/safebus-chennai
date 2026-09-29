'use client';

import React, { useState } from 'react';
import { 
  Search, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, 
  Globe, AlertOctagon, CheckCircle2, ArrowRight, RefreshCw, 
  Smartphone, IndianRupee, Sparkles, Building, Lock
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface DomainCheckerProps {
  locale: Locale;
  onReportPrefill?: (entity: { type: string; value: string }) => void;
}

export default function DomainChecker({ locale, onReportPrefill }: DomainCheckerProps) {
  const isTa = locale === 'ta';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCases = [
    { label: 'redbus-booking.xyz', desc: 'Phishing', type: 'fraud' },
    { label: 'kcbt-booking.com', desc: 'KCBT Fake', type: 'fraud' },
    { label: 'tambaram-bus-online.site', desc: 'Scam', type: 'fraud' },
    { label: 'kpntravels.com', desc: 'Official', type: 'safe' },
    { label: 'redbus.in', desc: 'Aggregator', type: 'safe' },
  ];

  const handleCheck = async (domainToCheck?: string) => {
    const val = (domainToCheck || query).trim();
    if (!val) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/domains/check?d=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.data) {
        setResult(data.data);
      } else {
        setResult({
          verdict: 'SUSPICIOUS',
          riskScore: 65,
          host: val,
          reasons: [{ signal: 'unknown', description: 'Domain not in Tamil Nadu omnibus registry' }],
        });
      }
    } catch (e: any) {
      console.error(e);
      setResult({
        verdict: 'SUSPICIOUS',
        riskScore: 70,
        host: val,
        reasons: [{ signal: 'network_error', description: 'Could not contact verification gateway' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number, verdict: string) => {
    if (verdict === 'ALLOWLISTED') {
      return {
        text: 'text-[#1E9E5A]',
        bg: 'bg-[#F0FDF4] border-[#1E9E5A]',
        badge: 'bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30',
        bar: 'bg-[#1E9E5A]',
        label: isTa ? 'சரிபார்க்கப்பட்ட அதிகாரப்பூர்வ தளம்' : 'OFFICIAL ALLOWLISTED PLATFORM',
        icon: ShieldCheck,
      };
    } else if (verdict === 'FRAUD' || score >= 60) {
      return {
        text: 'text-[#D64545]',
        bg: 'bg-[#FEF2F2] border-[#D64545]',
        badge: 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30',
        bar: 'bg-[#D64545]',
        label: isTa ? 'நம்பத்தகாதது! மோசடி தளம் (UNTRUSTED)' : 'UNTRUSTED — FRAUD DETECTED (DO NOT PAY)',
        icon: AlertOctagon,
      };
    } else {
      return {
        text: 'text-[#F5A623]',
        bg: 'bg-[#FFFBEB] border-[#F5A623]',
        badge: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30',
        bar: 'bg-[#F5A623]',
        label: isTa ? 'சரிபார்க்கப்படாத தளம் (UNVERIFIED)' : 'UNVERIFIED / SUSPICIOUS (EXERCISE CAUTION)',
        icon: AlertTriangle,
      };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header Banner (Navy #183264 Surface) */}
      <div className="bg-[#183264] text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7F50] text-[#183264] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODULE 1 & 3: Pre-Payment Scam Prevention Crawler</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'இணையதள & UPI மோசடி சோதனை' : 'Pre-Payment Domain & UPI Scam Checker'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'பணம் செலுத்துவதற்கு முன் இணையதள முகவரி, தொலைபேசி எண் அல்லது UPI ஐடியை சரிபார்த்து போலி தளங்களை கண்டறியவும்.'
              : 'Scan private omnibus booking portals, UPI payment handles, and phone numbers before paying. Detects typosquatting, freshly registered domains, and personal UPI accounts.'}
          </p>
        </div>
      </div>

      {/* Quick Test Scenarios */}
      <div className="card-clean p-3 sm:p-4">
        <div className="text-xs font-bold text-[#4A5D7E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#183264]" />
          <span>{isTa ? 'விரைவு சோதனை தளங்கள்' : 'Quick Test Cases (Known Fraud vs Genuine)'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {testCases.map((tc) => (
            <button
              key={tc.label}
              type="button"
              onClick={() => {
                setQuery(tc.label);
                handleCheck(tc.label);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tc.type === 'safe'
                  ? 'bg-[#1E9E5A]/10 border-[#1E9E5A]/40 text-[#1E9E5A] hover:bg-[#1E9E5A]/20'
                  : 'bg-[#D64545]/10 border-[#D64545]/40 text-[#D64545] hover:bg-[#D64545]/20'
              }`}
            >
              <span className="truncate max-w-[140px] sm:max-w-none">{tc.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                tc.type === 'safe' ? 'bg-[#1E9E5A] text-white' : 'bg-[#D64545] text-white'
              }`}>
                {tc.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="card-clean p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTa ? 'URL, தொலைபேசி அல்லது UPI ஐடி உள்ளிடவும்...' : 'Enter website URL, Phone, or UPI ID (e.g. kcbt-bus.in)...'}
              className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs sm:text-sm text-[#183264] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-coral cursor-pointer shrink-0 py-2.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" /> : <Search className="w-4 h-4 text-[#183264]" />}
            <span>{isTa ? 'சரிபார்' : 'Analyze Risk'}</span>
          </button>
        </form>
      </div>

      {/* Analysis Result Card */}
      {result && (
        <div className={`p-4 sm:p-6 rounded-2xl border ${getRiskColor(result.riskScore, result.verdict).bg} space-y-4 sm:space-y-6 transition-all shadow-xs`}>
          {/* Top Bar with Verdict & Risk Gauge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E8F2] pb-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`p-2.5 rounded-xl ${getRiskColor(result.riskScore, result.verdict).badge} border shrink-0`}>
                {React.createElement(getRiskColor(result.riskScore, result.verdict).icon, { className: 'w-6 h-6' })}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#183264] font-mono break-all">
                    {result.host}
                  </h3>
                  <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getRiskColor(result.riskScore, result.verdict).badge}`}>
                    {result.verdict}
                  </span>
                </div>
                <p className={`text-xs font-bold mt-0.5 ${getRiskColor(result.riskScore, result.verdict).text}`}>
                  {getRiskColor(result.riskScore, result.verdict).label}
                </p>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="bg-white p-3 rounded-xl border border-[#E3E8F2] w-full sm:w-auto sm:min-w-[200px] shadow-xs">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#4A5D7E] font-bold text-[11px]">Scam Likelihood</span>
                <span className={`font-mono font-bold text-xs ${getRiskColor(result.riskScore, result.verdict).text}`}>
                  {result.riskScore} / 100
                </span>
              </div>
              <div className="w-full h-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getRiskColor(result.riskScore, result.verdict).bar}`}
                  style={{ width: `${Math.max(5, Math.min(100, result.riskScore))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Details & Signals Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Heuristics Signals */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E3E8F2] space-y-2.5 shadow-xs">
              <h4 className="text-xs font-bold text-[#183264] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF7F50]" />
                <span>Detection Signals</span>
              </h4>
              <div className="space-y-1.5">
                {result.reasons && result.reasons.length > 0 ? (
                  result.reasons.map((r: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#183264] bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E3E8F2]">
                      <span className="w-2 h-2 rounded-full bg-[#FF7F50] mt-1 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[#183264] uppercase text-[10px] tracking-wider font-mono">
                          {r.signal || 'Notice'}
                        </div>
                        <div className="text-[#4A5D7E] text-[11px] mt-0.5 break-words">{r.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#4A5D7E]">No adverse threat signals detected.</div>
                )}
              </div>
            </div>

            {/* Technical Verification (WHOIS, TLS, Operator Match) */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E3E8F2] space-y-2.5 shadow-xs">
              <h4 className="text-xs font-bold text-[#183264] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#183264]" />
                <span>Registry Technicals</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E3E8F2]">
                  <div className="text-[#4A5D7E] text-[10px] font-medium">Domain Age</div>
                  <div className="font-bold text-[#183264] mt-0.5 text-[11px] truncate">
                    {result.whoisAgeDays ? `${result.whoisAgeDays} days` : 'Fresh Domain'}
                  </div>
                </div>
                <div className="bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E3E8F2]">
                  <div className="text-[#4A5D7E] text-[10px] font-medium">SSL Issuer</div>
                  <div className="font-bold text-[#183264] mt-0.5 text-[11px] truncate">
                    {result.tlsIssuer || 'Standard SSL'}
                  </div>
                </div>
                <div className="bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E3E8F2]">
                  <div className="text-[#4A5D7E] text-[10px] font-medium">Registry Match</div>
                  <div className={`font-bold mt-0.5 text-[11px] truncate ${result.verdict === 'ALLOWLISTED' ? 'text-[#1E9E5A]' : 'text-[#4A5D7E]'}`}>
                    {result.verdict === 'ALLOWLISTED' ? 'Official Member' : 'Not In Registry'}
                  </div>
                </div>
                <div className="bg-[#F5F7FB] p-2.5 rounded-lg border border-[#E3E8F2]">
                  <div className="text-[#4A5D7E] text-[10px] font-medium">Operator Link</div>
                  <div className="font-bold text-[#183264] mt-0.5 text-[11px] truncate">
                    {result.operatorMatch ? result.operatorMatch.name : 'None'}
                  </div>
                </div>
              </div>

              {/* Action Banner depending on risk */}
              {result.riskScore > 50 && (
                <div className="mt-2.5 p-3 bg-[#D64545]/10 border border-[#D64545]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-[#D64545] font-semibold">
                    <span className="font-bold">Caution: </span>
                    Do not transfer funds to this domain or UPI handle!
                  </div>
                  {onReportPrefill && (
                    <button
                      type="button"
                      onClick={() => onReportPrefill({ type: 'FAKE_PORTAL', value: result.host })}
                      className="px-3 py-1.5 bg-[#D64545] text-white font-bold text-[11px] rounded-lg shrink-0 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
                    >
                      Report Fraud Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
