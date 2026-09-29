'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, AlertTriangle, Download, RefreshCw, 
  Trash2, Globe, Phone, IndianRupee, ExternalLink, Network, 
  CheckCircle, ArrowUpRight, TrendingUp, Sparkles, Filter
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

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
          <span>Ticket Scalping</span>
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
          <span>Phishing Discovery</span>
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
          <span>Scam Ring Graph</span>
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
                        onClick={() => alert(`Issued RTO notice for alert #${al.id}`)}
                        className="text-xs text-[#183264] hover:text-[#FF7F50] underline font-bold cursor-pointer"
                      >
                        Issue RTO Notice
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

      {/* Tab 2: Crawler Domains (Collapsible into stacked cards on mobile) */}
      {activeSubTab === 'domains' && (
        <div className="card-clean overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[#E3E8F2] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183264]">
              Discovered Ticketing Portals
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[#4A5D7E]">Auto-Crawler Active</span>
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7FB] text-[#183264] border-b border-[#E3E8F2] font-bold">
                <tr>
                  <th className="p-3.5">Domain Host</th>
                  <th className="p-3.5">Verdict</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Age (Days)</th>
                  <th className="p-3.5">Discovery Source</th>
                  <th className="p-3.5">Action</th>
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
                        <span className="text-[11px] text-[#D64545] font-bold">Takedown Requested</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert(`Marked ${d.host} for ISP review`)}
                          className="text-[11px] text-[#183264] hover:text-[#FF7F50] underline font-bold cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View (< 640px) */}
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
                <div className="pt-1 flex justify-end">
                  {d.verdict === 'FRAUD' ? (
                    <span className="text-[10px] text-[#D64545] font-bold">Takedown Requested</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`Marked ${d.host} for review`)}
                      className="text-[11px] text-[#183264] font-bold underline"
                    >
                      Review Domain
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Scam Syndicate Ring Graph */}
      {activeSubTab === 'syndicates' && (
        <div className="card-clean p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8F2] pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#183264] flex items-center gap-1.5">
                <Network className="w-4 h-4 text-[#FF7F50]" />
                <span>Interconnected Scam Syndicate Graph</span>
              </h3>
              <p className="text-xs text-[#4A5D7E] mt-0.5">
                AI automated correlation of shared UPI VPAs, phone numbers, and phishing domains.
              </p>
            </div>
            <span className="text-[10px] sm:text-xs bg-[#183264]/10 text-[#183264] border border-[#183264]/20 px-2 py-0.5 rounded-lg font-mono font-bold self-start sm:self-auto">
              2 Crime Rings
            </span>
          </div>

          {/* Graph visual representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Cluster 1 */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F5F7FB] border border-[#D64545]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D64545] uppercase font-mono">
                  Ring #1: KCBT Phishing
                </span>
                <span className="text-[9px] bg-[#D64545] text-white px-1.5 py-0.5 rounded font-bold">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-[#183264]">
                Phishing portal clone targeting Kilambakkam travelers with advance booking scams during festival rush.
              </p>
              <div className="space-y-1 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-[#E3E8F2]">
                <div className="truncate"><span className="text-[#4A5D7E]">UPI: </span><span className="font-bold text-[#183264]">ramesh.k@ybl</span></div>
                <div className="truncate"><span className="text-[#4A5D7E]">Phone: </span><span className="font-bold text-[#183264]">9876543210</span></div>
                <div className="truncate"><span className="text-[#4A5D7E]">Domains: </span><span className="font-bold text-[#D64545]">kcbt-booking.com</span></div>
                <div><span className="text-[#4A5D7E]">Total Scammed: </span><span className="text-[#D64545] font-bold">₹14,200</span> (6 reports)</div>
              </div>
            </div>

            {/* Cluster 2 */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F5F7FB] border border-[#F5A623]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F5A623] uppercase font-mono">
                  Ring #2: Tambaram WhatsApp
                </span>
                <span className="text-[9px] bg-[#F5A623] text-white px-1.5 py-0.5 rounded font-bold">
                  HIGH
                </span>
              </div>
              <p className="text-xs text-[#183264]">
                Scalper group circulating fake PDF tickets in WhatsApp bus groups for Chennai-Coimbatore routes.
              </p>
              <div className="space-y-1 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-[#E3E8F2]">
                <div className="truncate"><span className="text-[#4A5D7E]">UPI: </span><span className="font-bold text-[#183264]">tickets.fastbus@oksbi</span></div>
                <div className="truncate"><span className="text-[#4A5D7E]">Phone: </span><span className="font-bold text-[#183264]">9840192831</span></div>
                <div className="truncate"><span className="text-[#4A5D7E]">Domains: </span><span className="font-bold text-[#D64545]">tambaram-bus.site</span></div>
                <div><span className="text-[#4A5D7E]">Total Scammed: </span><span className="text-[#F5A623] font-bold">₹9,800</span> (4 reports)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
