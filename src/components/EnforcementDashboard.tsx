'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, AlertTriangle, Download, RefreshCw, 
  Trash2, Globe, Phone, IndianRupee, ExternalLink, Network, 
  CheckCircle, ArrowUpRight, TrendingUp, Sparkles, Filter, Radio
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import TransitThreatRadar from '@/components/TransitThreatRadar';

interface EnforcementDashboardProps {
  locale: Locale;
}

export default function EnforcementDashboard({ locale }: EnforcementDashboardProps) {
  const isTa = locale === 'ta';

  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'domains' | 'syndicates'>('alerts');

  // Crawler simulator state
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleRunCrawler = async () => {
    setIsCrawling(true);
    setCrawlerLogs([
      `[${new Date().toLocaleTimeString()}] [PROBE-INIT] Starting autonomous crawler sweep across South Chennai transit keywords...`,
      `[${new Date().toLocaleTimeString()}] [TARGET-SCOPES] Probing search engines for 'Kilambakkam private bus', 'Tambaram omni tickets', 'KCBT festive booking'...`,
    ]);

    try {
      const res = await fetch('/api/crawler/run', { method: 'POST' });
      const json = await res.json();

      if (json.data && json.data.discovered) {
        setCrawlerLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [DISCOVERY-COMPLETE] Processed ${json.data.scannedCount} domains with live DNS/WHOIS risk scoring.`,
          ...json.data.discovered.map((d: any) => 
            `[${new Date().toLocaleTimeString()}] [ALERT] Host: ${d.host} | Risk: ${d.riskScore}/100 | Verdict: ${d.verdict}`
          ),
          `[${new Date().toLocaleTimeString()}] [DATABASE-SYNC] Inserted into Neon PostgreSQL. Takedown records queued for CERT-In / DoT!`,
        ]);

        // Refresh domains list in state
        const domRes = await fetch('/api/domains?limit=10').then(r => r.json());
        if (domRes.data) setDomains(domRes.data);
        const statsRes = await fetch('/api/stats/overview').then(r => r.json());
        if (statsRes.data) setStats(statsRes.data);
      }
    } catch (e: any) {
      setCrawlerLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Crawler execution failed: ${e.message}`,
      ]);
    } finally {
      setIsCrawling(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsRes, alertsRes, domainsRes, clustersRes] = await Promise.all([
          fetch('/api/stats/overview').then(r => r.json()),
          fetch('/api/alerts?limit=6').then(r => r.json()),
          fetch('/api/domains?limit=10').then(r => r.json()),
          fetch('/api/clusters').then(r => r.json()),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (alertsRes.data) setAlerts(alertsRes.data);
        if (domainsRes.data) setDomains(domainsRes.data);
        if (clustersRes.data) setClusters(clustersRes.data);
      } catch (e) {
        console.error('Failed to load enforcement data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadBlocklist = async () => {
    try {
      const res = await fetch('/api/blocklist');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safebus_chennai_blocklist_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      alert('Failed to download blocklist feed');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full pb-16 sm:pb-0">
      {/* Header Banner (Navy #183264 Surface) */}
      <div className="bg-[#183264] text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7F50] text-[#183264] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODULE 1, 4 & 5: State Transport Authority (STA) Enforcement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'அதிகாரிகள் அமலாக்க கட்டுப்பாட்டு மையம்' : 'RTO Enforcement & Scam Intelligence Command Center'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'கள்ளச்சந்தை எச்சரிக்கைகள், போலி இணையதள கிராலர் மற்றும் மோசடி வளையங்களின் (Scam Rings) முழுமையான கண்காணிப்பு.'
              : 'Real-time monitoring of festival surge scalping, crawler discovered phishing portals, and multi-entity scam syndicates operating in South Chennai.'}
          </p>
        </div>

        {/* Export Feed Button */}
        <button
          type="button"
          onClick={handleDownloadBlocklist}
          className="btn-coral flex items-center gap-2 text-xs font-bold shadow-xs cursor-pointer self-start md:self-auto py-2.5 px-4"
        >
          <Download className="w-4 h-4 text-[#183264]" />
          <span>Export CERT-In / DoT Feed</span>
        </button>
      </div>

      {/* KPI Cards (Clean Cards with Navy Text) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="card-clean p-3 sm:p-4">
          <div className="text-[11px] sm:text-xs font-bold text-[#4A5D7E] truncate">Domains Scanned</div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#183264] font-mono mt-0.5">
            {stats ? stats.domainsScanned : '18'}
          </div>
          <div className="text-[10px] text-[#1E9E5A] font-semibold flex items-center gap-1 mt-0.5 truncate">
            <span>+4 crawler today</span>
          </div>
        </div>

        <div className="card-clean p-3 sm:p-4">
          <div className="text-[11px] sm:text-xs font-bold text-[#4A5D7E] truncate">Phishing Blocked</div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#D64545] font-mono mt-0.5">
            {stats ? stats.fraudsBlocked : '12'}
          </div>
          <div className="text-[10px] text-[#D64545] font-semibold flex items-center gap-1 mt-0.5 truncate">
            <span>DNS Sinkholes</span>
          </div>
        </div>

        <div className="card-clean p-3 sm:p-4">
          <div className="text-[11px] sm:text-xs font-bold text-[#4A5D7E] truncate">Scalping Alerts</div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#F5A623] font-mono mt-0.5">
            {stats ? stats.openAlerts : '6'}
          </div>
          <div className="text-[10px] text-[#F5A623] font-semibold flex items-center gap-1 mt-0.5 truncate">
            <span>Festival Rush</span>
          </div>
        </div>

        <div className="card-clean p-3 sm:p-4">
          <div className="text-[11px] sm:text-xs font-bold text-[#4A5D7E] truncate">Reports Clustered</div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#183264] font-mono mt-0.5">
            {stats ? stats.reportsReceived : '14'}
          </div>
          <div className="text-[10px] text-[#183264] font-semibold flex items-center gap-1 mt-0.5 truncate">
            <span>AI Syndicate Linked</span>
          </div>
        </div>
      </div>

      {/* South Chennai Transit Radar Embed */}
      <TransitThreatRadar locale={locale} />

      {/* Sub Tabs (Scrollable on small screens) */}
      <div className="flex border-b border-[#E3E8F2] space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'alerts'
              ? 'border-[#FF7F50] text-[#183264]'
              : 'border-transparent text-[#4A5D7E] hover:text-[#183264]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#FF7F50]" />
          <span>Ticket Scalping Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('domains')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'domains'
              ? 'border-[#FF7F50] text-[#183264]'
              : 'border-transparent text-[#4A5D7E] hover:text-[#183264]'
          }`}
        >
          <Globe className="w-4 h-4 text-[#FF7F50]" />
          <span>Autonomous AI Crawler Bot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('syndicates')}
          className={`pb-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'syndicates'
              ? 'border-[#FF7F50] text-[#183264]'
              : 'border-transparent text-[#4A5D7E] hover:text-[#183264]'
          }`}
        >
          <Network className="w-4 h-4 text-[#FF7F50]" />
          <span>Interactive Syndicate Graph</span>
        </button>
      </div>

      {/* Tab 1: Scalping Alerts */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {alerts.length > 0 ? (
              alerts.map((al) => {
                const details = typeof al.details === 'string' ? JSON.parse(al.details || '{}') : (al.details || {});
                return (
                  <div
                    key={al.id}
                    className="card-clean p-4 sm:p-5 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30">
                          {al.kind}
                        </span>
                        <span className="text-[10px] text-[#4A5D7E] font-mono">
                          {new Date(al.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="mt-2 text-xs sm:text-sm font-bold text-[#183264]">
                        {al.route ? `${al.route.fromCity} → ${al.route.toCity}` : 'Chennai KCBT Outbound'}
                      </div>

                      <div className="mt-2 text-xs text-[#4A5D7E] space-y-1">
                        {details.ratio && (
                          <div>
                            Surge Multiplier:{' '}
                            <span className="font-bold text-[#D64545]">{details.ratio.toFixed(2)}x STA Base Fare</span>
                          </div>
                        )}
                        {details.actualFare && (
                          <div>
                            Reported Fare: <span className="font-bold text-[#183264]">₹{details.actualFare}</span> (STA Cap: ₹{details.maxAllowed})
                          </div>
                        )}
                        {details.ticketNumber && (
                          <div className="truncate">
                            Target Ticket: <span className="font-mono font-bold text-[#FF7F50]">{details.ticketNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E3E8F2] flex items-center justify-between text-xs">
                      <span className="text-[#4A5D7E] text-[11px]">Status: <span className="text-[#F5A623] font-bold">Investigating</span></span>
                      <button
                        type="button"
                        onClick={() => alert(`Issued RTO statutory fine notice for alert #${al.id}`)}
                        className="btn-coral text-[11px] py-1 px-3 shadow-2xs cursor-pointer"
                      >
                        Issue RTO Fine Notice
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8 text-xs text-[#4A5D7E]">
                No active scalping alerts recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Crawler Domains & Live Crawler Execution */}
      {activeSubTab === 'domains' && (
        <div className="space-y-4">
          {/* Live Crawler Control Banner */}
          <div className="bg-[#183264] text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1E9E5A] animate-ping" />
                <h4 className="font-bold text-sm text-white">Autonomous Domain Discovery Engine (Module 1)</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Probes search indices, social media ads, and typosquat variations targeting Kilambakkam (KCBT) & Tambaram passengers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunCrawler}
              disabled={isCrawling}
              className="btn-coral text-xs py-2.5 px-4 flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-4 h-4 text-[#183264] ${isCrawling ? 'animate-spin' : ''}`} />
              <span>{isCrawling ? 'Crawler Scanning...' : 'Run Autonomous Crawler Bot'}</span>
            </button>
          </div>

          {/* Crawler Live Streaming Terminal Log */}
          {crawlerLogs.length > 0 && (
            <div className="bg-[#0b1329] text-emerald-400 font-mono text-[11px] p-3.5 sm:p-4 rounded-xl border border-emerald-900/60 shadow-inner space-y-1 overflow-x-auto max-h-48 overflow-y-auto">
              <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>TERMINAL: CRAWLER-BOT-CLUSTER-01 (South Chennai Sweep)</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              {crawlerLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Domains Table Card */}
          <div className="card-clean overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[#E3E8F2] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#183264]">
                Discovered Ticketing Portals ({domains.length})
              </h3>
              <span className="text-[10px] sm:text-[11px] text-[#4A5D7E]">CERT-In Sinkhole Ready</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7FB] text-[#183264] border-b border-[#E3E8F2] font-bold">
                  <tr>
                    <th className="p-3.5">Domain Host</th>
                    <th className="p-3.5">Verdict</th>
                    <th className="p-3.5">Risk Score</th>
                    <th className="p-3.5">Age (Days)</th>
                    <th className="p-3.5">Discovery Source</th>
                    <th className="p-3.5">Takedown Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F2]">
                  {domains.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F7FB]">
                      <td className="p-3.5 font-mono font-bold text-[#183264]">{d.host}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          d.verdict === 'FRAUD'
                            ? 'bg-[#D64545]/15 text-[#D64545]'
                            : d.verdict === 'ALLOWLISTED'
                            ? 'bg-[#1E9E5A]/15 text-[#1E9E5A]'
                            : 'bg-[#F5A623]/15 text-[#F5A623]'
                        }`}>
                          {d.verdict}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold">{d.riskScore}/100</td>
                      <td className="p-3.5 text-[#4A5D7E]">{d.whoisAgeDays ? `${d.whoisAgeDays}d` : 'New'}</td>
                      <td className="p-3.5 font-mono text-[#4A5D7E] text-[11px] font-semibold">{d.source}</td>
                      <td className="p-3.5">
                        {d.verdict === 'FRAUD' ? (
                          <span className="text-[11px] text-[#D64545] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D64545]" />
                            <span>Takedown Dispatched</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert(`Marked ${d.host} for ISP review`)}
                            className="text-[11px] text-[#183264] hover:text-[#FF7F50] underline font-bold cursor-pointer"
                          >
                            Review Domain
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden divide-y divide-[#E3E8F2]">
              {domains.map((d) => (
                <div key={d.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#183264] break-all">{d.host}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                      d.verdict === 'FRAUD'
                        ? 'bg-[#D64545]/15 text-[#D64545]'
                        : d.verdict === 'ALLOWLISTED'
                        ? 'bg-[#1E9E5A]/15 text-[#1E9E5A]'
                        : 'bg-[#F5A623]/15 text-[#F5A623]'
                    }`}>
                      {d.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#4A5D7E]">
                    <span>Risk: <strong className="text-[#183264]">{d.riskScore}/100</strong></span>
                    <span>Age: <strong className="text-[#183264]">{d.whoisAgeDays ? `${d.whoisAgeDays}d` : 'New'}</strong></span>
                    <span>Src: <strong className="text-[#183264] font-mono">{d.source}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Visual Syndicate Graph (Module 4) */}
      {activeSubTab === 'syndicates' && (
        <div className="card-clean p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8F2] pb-3">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#183264]/10 text-[#183264] text-[10px] font-bold mb-1">
                <Sparkles className="w-3 h-3 text-[#FF7F50]" />
                <span>MODULE 4: MULTI-ENTITY AI CORRELATION GRAPH</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#183264]">
                Interactive Scam Syndicate Network Graph
              </h3>
              <p className="text-xs text-[#4A5D7E] mt-0.5">
                AI automated correlation uncovering multi-entity fraud rings across shared UPI VPAs, burner phone numbers, bank accounts, and phishing hosts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20 px-2.5 py-1 rounded-full font-mono font-bold">
                2 Critical Rings Tracked
              </span>
            </div>
          </div>

          {/* Interactive Visual Graph Canvas (SVG Network) */}
          <div className="bg-[#183264] rounded-2xl p-4 sm:p-6 relative overflow-hidden border border-[#E3E8F2]">
            <div className="text-white/80 text-[11px] font-mono mb-2 flex items-center justify-between">
              <span>VISUAL TOPOLOGY • SOUTH CHENNAI CYBERCRIME SYNDICATES</span>
              <span className="text-[#FF7F50] text-[10px]">CLICK NODES TO INSPECT</span>
            </div>

            {/* SVG Visual Connections */}
            <div className="relative w-full h-64 sm:h-72 bg-[#0e2144] rounded-xl border border-white/10 flex items-center justify-center p-4">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                {/* Connecting Lines Ring 1 */}
                <line x1="25%" y1="30%" x2="50%" y2="50%" stroke="#FF7F50" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="25%" y1="70%" x2="50%" y2="50%" stroke="#FF7F50" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#D64545" strokeWidth="2" />

                {/* Connecting Lines Ring 2 */}
                <line x1="75%" y1="30%" x2="50%" y2="50%" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="75%" y1="70%" x2="50%" y2="50%" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="85%" y1="50%" x2="50%" y2="50%" stroke="#F5A623" strokeWidth="2" />
              </svg>

              {/* Central Hub Node */}
              <div 
                onClick={() => setSelectedNode('hub')}
                className="absolute z-10 w-20 h-20 rounded-full bg-[#FF7F50] text-[#183264] flex flex-col items-center justify-center p-2 text-center cursor-pointer shadow-lg hover:scale-105 transition-transform"
                style={{ top: 'calc(50% - 40px)', left: 'calc(50% - 40px)' }}
              >
                <Network className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-black leading-tight">STA CYBER NEXUS</span>
              </div>

              {/* Ring 1 Nodes (Left) */}
              <div 
                onClick={() => setSelectedNode('kcbt-domain')}
                className="absolute z-10 p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-[10px] font-mono cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '22%', left: '12%' }}
              >
                <div className="font-bold flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>kcbt-booking.com</span>
                </div>
                <div className="text-[8px] text-white/80">Phishing Portal</div>
              </div>

              <div 
                onClick={() => setSelectedNode('kcbt-upi')}
                className="absolute z-10 p-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-[#183264] text-[10px] font-mono font-bold cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '62%', left: '14%' }}
              >
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  <span>ramesh.k@ybl</span>
                </div>
                <div className="text-[8px] text-[#183264]/80 font-normal">Mule UPI VPA</div>
              </div>

              <div 
                onClick={() => setSelectedNode('kcbt-phone')}
                className="absolute z-10 p-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] font-mono cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '42%', left: '4%' }}
              >
                <div className="font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>9876543210</span>
                </div>
                <div className="text-[8px] text-white/80">Burner Sim</div>
              </div>

              {/* Ring 2 Nodes (Right) */}
              <div 
                onClick={() => setSelectedNode('tambaram-domain')}
                className="absolute z-10 p-2 rounded-xl bg-sky-600/90 hover:bg-sky-600 text-white text-[10px] font-mono cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '22%', right: '12%' }}
              >
                <div className="font-bold flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>tambaram-bus.site</span>
                </div>
                <div className="text-[8px] text-white/80">WhatsApp Clone</div>
              </div>

              <div 
                onClick={() => setSelectedNode('tambaram-upi')}
                className="absolute z-10 p-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-[#183264] text-[10px] font-mono font-bold cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '62%', right: '14%' }}
              >
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  <span>fastbus@oksbi</span>
                </div>
                <div className="text-[8px] text-[#183264]/80 font-normal">Scalper UPI</div>
              </div>

              <div 
                onClick={() => setSelectedNode('tambaram-phone')}
                className="absolute z-10 p-2 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] font-mono cursor-pointer border border-white/20 shadow-md transition-transform hover:scale-105"
                style={{ top: '42%', right: '4%' }}
              >
                <div className="font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>9840192831</span>
                </div>
                <div className="text-[8px] text-white/80">WhatsApp Broker</div>
              </div>
            </div>

            {/* Selected Node Details Drawer */}
            <div className="mt-3 p-3 bg-white/10 backdrop-blur-md rounded-xl text-white text-xs border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[#FF7F50] font-bold">Node Inspected: </span>
                <span className="font-mono">{selectedNode ? selectedNode.toUpperCase() : 'Click any node to see evidence trail'}</span>
              </div>
              <span className="text-[11px] text-slate-300">
                Correlated with 10+ Citizen Reports across Kilambakkam & Tambaram
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
