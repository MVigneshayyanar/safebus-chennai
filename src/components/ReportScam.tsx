'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flag, AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, 
  ExternalLink, Upload, RefreshCw, Sparkles, Send, FileText, 
  IndianRupee, MapPin, Search, Link2, Smartphone
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface ReportScamProps {
  locale: Locale;
  prefill?: { type: string; value: string } | null;
}

export default function ReportScam({ locale, prefill }: ReportScamProps) {
  const isTa = locale === 'ta';

  const [formData, setFormData] = useState({
    type: prefill?.type || 'FAKE_PORTAL',
    url: prefill?.type === 'FAKE_PORTAL' ? prefill.value : '',
    phone: '',
    upiId: '',
    amountLost: '',
    route: 'KCBT Kilambakkam → Madurai',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    if (prefill) {
      if (prefill.type === 'FAKE_PORTAL') {
        setFormData(prev => ({ ...prev, url: prefill.value, type: 'FAKE_PORTAL' }));
      }
    }
  }, [prefill]);

  // Load recent community reports
  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/reports?limit=5');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setRecentReports(json.data);
        }
      } catch (e) {
        console.error('Failed to load reports', e);
      }
    }
    loadReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const payload: any = {
        type: formData.type,
        description: formData.description || 'Reported via SafeBus Chennai portal',
      };
      if (formData.url) payload.url = formData.url;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.upiId) payload.upiId = formData.upiId;
      if (formData.amountLost) payload.amountLost = parseFloat(formData.amountLost);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.data) {
        setSubmissionResult(data.data);
        setRecentReports(prev => [data.data.report, ...prev.slice(0, 4)]);
      } else {
        alert(data.error?.message || 'Submission failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateOcr = () => {
    setFormData({
      type: 'SCALPER',
      url: 'https://wa.me/p/9840192831',
      phone: '9840192831',
      upiId: 'tickets.fastbus@oksbi',
      amountLost: '2400',
      route: 'KCBT Kilambakkam → Coimbatore',
      description: 'Seller on WhatsApp scalping Deepavali special bus tickets at 2.5x normal fare, demanded advance payment via UPI to tickets.fastbus@oksbi then blocked number.',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header Banner (Navy #183264 Surface) */}
      <div className="bg-[#183264] text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7F50] text-[#183264] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODULE 4: Citizen Scam Reporting & AI Syndicate Detection</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'மோசடி விற்பனையாளர்களை புகாரளிக்கவும்' : 'Citizen Scam Reporting & Grievance Channel'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'போலி ஆம்னிபஸ் இணையதளங்கள், கள்ளச்சந்தை டிக்கெட் விற்பனையாளர்கள் மற்றும் போலி UPI ஐடிகளை உடனடியாகப் புகாரளிக்கவும்.'
              : 'Report fake omnibus portals, counterfeit ticket sellers, and WhatsApp scalpers. AI automatically links fraudsters into organized crime rings and triggers national 1930 action.'}
          </p>
        </div>

        {/* Emergency Helpline CTA */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href="tel:1930"
            className="btn-coral flex items-center gap-2 text-xs font-bold shadow-xs cursor-pointer py-2 px-3.5"
          >
            <PhoneCall className="w-4 h-4 text-[#183264]" />
            <span>Call 1930 Helpline</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Form (Card Clean) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-clean p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E8F2] pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-[#183264] flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-[#FF7F50]" />
                <span>{isTa ? 'புதிய மோசடி புகார் பதிவு' : 'File a New Scam Report'}</span>
              </h3>
              <button
                type="button"
                onClick={handleSimulateOcr}
                className="text-[10px] sm:text-[11px] font-bold text-[#183264] bg-[#F5F7FB] hover:bg-[#E3E8F2] px-2.5 py-1 rounded-lg border border-[#E3E8F2] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#FF7F50]" />
                <span>Auto-Fill OCR</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Scam Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#183264]">
                  {isTa ? 'மோசடி வகை' : 'Category of Fraud'}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-3 py-2.5 text-xs text-[#183264] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                >
                  <option value="FAKE_PORTAL">Fake Omnibus Booking Website (Phishing)</option>
                  <option value="SCALPER">Ticket Scalper / WhatsApp Black Market</option>
                  <option value="FAKE_TICKET">Counterfeit Paper / PDF Ticket</option>
                  <option value="FAKE_OPERATOR">Phantom Bus Operator (Unregistered Service)</option>
                  <option value="OVERCHARGING">Excessive Surge Fare Exceeding STA Rules</option>
                </select>
              </div>

              {/* URL and Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#183264]">
                    {isTa ? 'சந்தேகத்திற்குரிய URL' : 'Suspect Website / Portal URL'}
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="e.g. kcbt-bus-booking.site"
                      className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#183264]">
                    {isTa ? 'பயண வழித்தடம்' : 'Bus Route'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="e.g. KCBT Chennai → Madurai"
                      className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                    />
                  </div>
                </div>
              </div>

              {/* Phone and UPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#183264]">
                    {isTa ? 'தொலைபேசி எண்' : 'Fraudster Phone / WhatsApp'}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9840192831"
                      className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#183264]">
                    {isTa ? 'மோசடி UPI ஐடி' : 'Fraud UPI Handle (VPA)'}
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      placeholder="e.g. tickets.fastbus@oksbi"
                      className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                    />
                  </div>
                </div>
              </div>

              {/* Amount Lost & Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#183264]">
                  {isTa ? 'இழந்த தொகை (₹)' : 'Extorted Amount (INR)'}
                </label>
                <input
                  type="number"
                  value={formData.amountLost}
                  onChange={(e) => setFormData({ ...formData, amountLost: e.target.value })}
                  placeholder="e.g. 2400"
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#183264]">
                  {isTa ? 'சம்பவ விவரம்' : 'Incident Details & Evidence Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what occurred, any WhatsApp chats, fake booking confirmation receipts, or fake boarding points at KCBT / Tambaram..."
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50] placeholder-slate-400"
                />
              </div>

              {/* Coral Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-coral w-full cursor-pointer py-3"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" /> : <Send className="w-4 h-4 text-[#183264]" />}
                <span>{isTa ? 'புகாரை உடனடியாகச் சமர்ப்பிக்கவும்' : 'Submit Grievance to STA & Cybercrime'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Community Feed */}
        <div className="lg:col-span-5 space-y-4">
          {/* Success Banner */}
          {submissionResult && (
            <div className="bg-[#F0FDF4] border border-[#1E9E5A] p-4 sm:p-5 rounded-2xl text-[#1E9E5A] space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Grievance Registered Successfully</span>
              </div>
              <div className="text-xs space-y-1 text-[#183264]">
                <div>Reference ID: <span className="font-mono font-bold text-[#FF7F50]">{submissionResult.referenceNumber}</span></div>
                <div>AI Severity Triage: <span className="font-bold text-[#D64545]">{submissionResult.triage?.severity || 'HIGH'}</span></div>
                <div className="text-[11px] text-[#4A5D7E] mt-1.5 leading-relaxed">
                  Extracted fraud entities have been added to the SafeBus Chennai dynamic blocklist and forwarded to STA Enforcement cell.
                </div>
              </div>
              <div className="pt-1.5 flex flex-col gap-2">
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-navy py-2 text-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>File National Cybercrime Portal FIR</span>
                </a>
              </div>
            </div>
          )}

          {/* Recent Community Scam Reports Feed */}
          <div className="card-clean p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E3E8F2] pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#183264] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF7F50]" />
                <span>Recent Community Scam Alerts</span>
              </h3>
              <span className="text-[10px] bg-[#F5F7FB] text-[#183264] px-2 py-0.5 rounded border border-[#E3E8F2] font-mono font-bold">
                Live
              </span>
            </div>

            <div className="space-y-2.5">
              {recentReports.length > 0 ? (
                recentReports.map((rpt, idx) => (
                  <div
                    key={rpt.id || idx}
                    className="p-3 rounded-xl bg-[#F5F7FB] border border-[#E3E8F2] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D64545] text-[10px] sm:text-[11px] uppercase tracking-wider font-mono">
                        {rpt.type}
                      </span>
                      <span className="text-[10px] text-[#4A5D7E] font-mono">
                        RPT-{rpt.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[#183264] text-xs font-medium line-clamp-2">
                      {rpt.description}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#4A5D7E] pt-1 border-t border-[#E3E8F2]">
                      {rpt.phone && <span className="font-semibold text-[#183264]">📱 {rpt.phone}</span>}
                      {rpt.upiId && <span className="font-bold text-[#FF7F50]">💳 {rpt.upiId}</span>}
                      {rpt.amountLost ? <span className="text-[#D64545] font-bold">₹{rpt.amountLost}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#4A5D7E]">
                  Loading recent scam alerts...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
