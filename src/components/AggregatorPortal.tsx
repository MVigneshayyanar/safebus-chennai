'use client';

import React, { useState } from 'react';
import { 
  Terminal, Code2, Key, CheckCircle, Copy, Check, 
  ExternalLink, Play, Globe, Shield, RefreshCw, Sparkles
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface AggregatorPortalProps {
  locale: Locale;
}

export default function AggregatorPortal({ locale }: AggregatorPortalProps) {
  const isTa = locale === 'ta';

  const [activeEndpoint, setActiveEndpoint] = useState<'verify' | 'jwks' | 'check' | 'blocklist'>('verify');
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const endpoints = [
    {
      id: 'verify',
      method: 'POST',
      path: '/api/tickets/verify',
      desc: 'Verify e-ticket digital signature & operator validity before booking or boarding.',
    },
    {
      id: 'jwks',
      method: 'GET',
      path: '/api/keys/public',
      desc: 'Retrieve JWKS public key set for offline and fast local signature verification.',
    },
    {
      id: 'check',
      method: 'GET',
      path: '/api/domains/check?d=redbus-booking.xyz',
      desc: 'Check domain risk score and phishing likelihood before allowing link redirections.',
    },
    {
      id: 'blocklist',
      method: 'GET',
      path: '/api/blocklist',
      desc: 'Download dynamic sync feed of confirmed scam domains, UPI handles, and phones.',
    },
  ];

  const codeSnippets: Record<string, Record<string, string>> = {
    verify: {
      curl: `curl -X POST https://safebus.tn.gov.in/api/tickets/verify \\
  -H "Content-Type: application/json" \\
  -d '{"jws": "eyJhbGciOiJFZERTQSIsImtpZCI6ImtpZF9rcG5fMDEifQ..."}'`,
      js: `const response = await fetch('https://safebus.tn.gov.in/api/tickets/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jws: ticketJwsToken })
});
const { data } = await response.json();
console.log(data.verdict); // "GENUINE" | "INVALID"`,
      python: `import requests

res = requests.post(
    "https://safebus.tn.gov.in/api/tickets/verify",
    json={"jws": ticket_jws_token}
)
data = res.json()["data"]
print("Verdict:", data["verdict"])`,
    },
    jwks: {
      curl: `curl https://safebus.tn.gov.in/api/keys/public`,
      js: `const response = await fetch('https://safebus.tn.gov.in/api/keys/public');
const { keys } = await response.json();`,
      python: `import requests
keys = requests.get("https://safebus.tn.gov.in/api/keys/public").json()["keys"]`,
    },
    check: {
      curl: `curl https://safebus.tn.gov.in/api/domains/check?d=redbus-booking.xyz`,
      js: `const res = await fetch('https://safebus.tn.gov.in/api/domains/check?d=redbus-booking.xyz');
const { data } = await res.json();
console.log(data.riskScore, data.verdict);`,
      python: `import requests
res = requests.get("https://safebus.tn.gov.in/api/domains/check?d=redbus-booking.xyz")
print(res.json()["data"])`,
    },
    blocklist: {
      curl: `curl https://safebus.tn.gov.in/api/blocklist`,
      js: `const res = await fetch('https://safebus.tn.gov.in/api/blocklist');
const { blockedDomains, blockedPhones } = await res.json();`,
      python: `import requests
blocklist = requests.get("https://safebus.tn.gov.in/api/blocklist").json()`,
    },
  };

  const handleRunTest = async () => {
    setRunning(true);
    setApiResponse(null);
    try {
      let url = '';
      let opts: any = {};

      if (activeEndpoint === 'verify') {
        url = '/api/tickets/verify';
        const tRes = await fetch('/api/tickets?limit=1');
        const tData = await tRes.json();
        const jws = tData.data?.[0]?.jws || 'sample';
        opts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jws }),
        };
      } else if (activeEndpoint === 'jwks') {
        url = '/api/keys/public';
      } else if (activeEndpoint === 'check') {
        url = '/api/domains/check?d=redbus-booking.xyz';
      } else if (activeEndpoint === 'blocklist') {
        url = '/api/blocklist';
      }

      const res = await fetch(url, opts);
      const data = await res.json();
      setApiResponse(data);
    } catch (e: any) {
      setApiResponse({ error: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    const text = codeSnippets[activeEndpoint]?.[activeLang] || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full pb-16 sm:pb-0">
      {/* Header Banner (Navy #183264 Surface) */}
      <div className="bg-[#183264] text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7F50] text-[#183264] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODULE 5: Central Registry Verification API for Aggregators</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'அக்ரிகேட்டர் ஒருங்கிணைப்பு API' : 'Aggregator Integration Portal & Sandbox'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'RedBus, AbhiBus, MakeMyTrip போன்ற தளங்கள் டிக்கெட் உண்மைத்தன்மையை சரிபார்க்க அதிகாரப்பூர்வ API.'
              : 'Enabling major OTA aggregators (RedBus, AbhiBus, MakeMyTrip) and field conductors to verify omnibus digital signatures in real-time or offline via JWKS.'}
          </p>
        </div>
      </div>

      {/* Aggregator Badges */}
      <div className="card-clean p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[#4A5D7E] font-bold text-[11px] sm:text-xs">Standardized API for:</span>
        <div className="flex flex-wrap items-center gap-1.5 font-bold text-[#183264] text-[10px] sm:text-xs">
          <span className="px-2 sm:px-3 py-1 rounded-lg bg-[#F5F7FB] border border-[#E3E8F2]">RedBus</span>
          <span className="px-2 sm:px-3 py-1 rounded-lg bg-[#F5F7FB] border border-[#E3E8F2]">AbhiBus</span>
          <span className="px-2 sm:px-3 py-1 rounded-lg bg-[#F5F7FB] border border-[#E3E8F2]">MakeMyTrip</span>
          <span className="px-2 sm:px-3 py-1 rounded-lg bg-[#F5F7FB] border border-[#E3E8F2]">TNSTC</span>
        </div>
      </div>

      {/* Main Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Endpoint Selector & Code */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-clean p-4 sm:p-5 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183264]">
              Select API Endpoint
            </h3>

            <div className="space-y-2">
              {endpoints.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => {
                    setActiveEndpoint(ep.id as any);
                    setApiResponse(null);
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                    activeEndpoint === ep.id
                      ? 'bg-[#FF7F50]/15 border-[#FF7F50] text-[#183264] ring-1 ring-[#FF7F50]'
                      : 'bg-[#F5F7FB] border-[#E3E8F2] text-[#4A5D7E] hover:border-[#183264]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-[#183264] truncate max-w-[200px] sm:max-w-none">{ep.path}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-[#E3E8F2] font-bold text-[#FF7F50] shrink-0">
                      {ep.method}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#4A5D7E] mt-1 line-clamp-1">{ep.desc}</div>
                </button>
              ))}
            </div>

            {/* Code Snippet */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#F5F7FB] p-0.5 rounded-lg border border-[#E3E8F2] text-[10px] sm:text-[11px]">
                  {(['curl', 'js', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer ${
                        activeLang === lang ? 'bg-[#183264] text-white shadow-xs' : 'text-[#4A5D7E] hover:text-[#183264]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-[#4A5D7E] hover:text-[#183264] font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#1E9E5A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-3 sm:p-4 bg-[#183264] text-slate-100 rounded-xl font-mono text-[10px] sm:text-[11px] overflow-x-auto shadow-inner max-w-full">
                {codeSnippets[activeEndpoint]?.[activeLang]}
              </pre>
            </div>

            {/* Coral Action Button */}
            <button
              type="button"
              onClick={handleRunTest}
              disabled={running}
              className="btn-coral w-full cursor-pointer py-2.5"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" /> : <Play className="w-4 h-4 text-[#183264]" />}
              <span>Execute Live API Sandbox Call</span>
            </button>
          </div>
        </div>

        {/* Live Response Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-clean p-4 sm:p-5 flex flex-col h-full min-h-[300px] sm:min-h-[360px]">
            <div className="flex items-center justify-between border-b border-[#E3E8F2] pb-2.5 mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#183264] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#1E9E5A]" />
                <span>Live Response (200 OK)</span>
              </h3>
              <span className="text-[10px] font-mono text-[#1E9E5A] bg-[#1E9E5A]/10 px-2 py-0.5 rounded font-bold border border-[#1E9E5A]/20">
                JSON API
              </span>
            </div>

            {apiResponse ? (
              <pre className="p-3 sm:p-4 bg-[#F5F7FB] text-[#183264] rounded-xl border border-[#E3E8F2] font-mono text-[11px] overflow-x-auto flex-1 max-h-[460px] shadow-inner font-semibold max-w-full">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#4A5D7E]">
                <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#4A5D7E]/40" />
                <p className="text-xs font-medium">Click &quot;Execute Live API Sandbox Call&quot; to test the live endpoint.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
