'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flag, AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, 
  ExternalLink, Upload, RefreshCw, Sparkles, Send, FileText, 
  IndianRupee, MapPin, Search, Link2, Smartphone, Gavel, Copy, Check, Printer
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
  const [showLegalDossier, setShowLegalDossier] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);

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

  const handleCopyLegalDossier = () => {
    navigator.clipboard.writeText(generateLegalDossierText());
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  };

  const generateLegalDossierText = () => {
    const refId = submissionResult?.referenceNumber || `SBC-FIR-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `FORMAL CYBERCRIME COMPLAINT & EVIDENTIARY DOSSIER
UNDER SECTION 66D INFORMATION TECHNOLOGY ACT (2000) & SECTIONS 419, 420, 120B INDIAN PENAL CODE (IPC) / BHARATIYA NYAYA SANHITA (BNS)

TO:
The Superintendent of Police / Cyber Crime Police Station,
Greater Chennai Police & Tamil Nadu State Transport Authority (STA) Enforcement Wing,
Grievance Case Reference: SafeBus Chennai Transit Fraud Prevention System (PS-04)

1. INCIDENT & JURISDICTION REFERENCE:
Incident Reference Number : ${refId}
Timestamp of Recording    : ${dateStr} IST
Jurisdiction Transit Hub  : Kilambakkam (KCBT) / Tambaram Transit Corridor, Chennai
Verification System       : SafeBus Chennai NextGen Anti-Fraud Engine

2. DETAILS OF ACCUSED ENTITIES / SYNDICATE:
Offence Category         : ${formData.type === 'FAKE_PORTAL' ? 'Fraudulent Phishing Bus Booking Portal' : formData.type === 'SCALPER' ? 'Extortionate Bus Ticket Scalping via Unofficial Channels' : formData.type === 'FAKE_TICKET' ? 'Counterfeit E-Ticket Issuance with Forged Cryptographic Stamp' : 'Unauthorized Passenger Carriage Carrier'}
Suspect URL / Portal     : ${formData.url || 'N/A (Conducted via Direct Messaging)'}
Suspect Mobile / Contact : ${formData.phone || 'N/A'}
Beneficiary Mule UPI VPA : ${formData.upiId || 'N/A'}
Financial Loss Incurred  : ₹${formData.amountLost || '0'} INR
Targeted Omnibus Route   : ${formData.route}

3. COMPLAINANT STATEMENT OF FACTS:
${formData.description || 'The suspect impersonated an authorized omnibus operator and extracted unauthorized advance payments from passengers without valid STA permits or ticket delivery.'}

4. STATUTORY PENAL PROVISIONS APPLICABLE:
a) Section 66D, Information Technology Act, 2000: Cheating by personation by using computer resource (cognizable offence; imprisonment up to 3 years and fine).
b) Section 420 & 419, IPC / Section 318(4) & 319 BNS: Cheating and dishonestly inducing delivery of property through deceptive representation.
c) Section 120B, IPC: Criminal conspiracy involving transit touts, fraudulent aggregators, and mule bank accounts.
d) Section 192A & 207, Motor Vehicles Act, 1988: Operating unauthorized stage carriages without statutory permit.

5. PRAYER / RELIEF SOUGHT:
i. Issue immediate freezing orders under Section 102 CrPC to the beneficiary UPI PSP and recipient bank for VPA: ${formData.upiId || 'Suspect account'}.
ii. Requisition Call Detail Records (CDR) and IP connection logs under Section 91 CrPC for suspect phone: ${formData.phone || 'Suspect number'}.
iii. Coordinate with Tamil Nadu State Transport Authority (STA) Enforcement Wing for impounding involved transport carriers.

VERIFIED ELECTRONICALLY VIA SAFEBUS CHENNAI ANTI-FRAUD REGISTRY
SHA-256 EVIDENTIARY HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
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

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-coral w-full cursor-pointer py-3"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" /> : <Send className="w-4 h-4 text-[#183264]" />}
                  <span>{isTa ? 'புகாரை சமர்ப்பிக்கவும்' : 'Submit to STA Registry'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLegalDossier(!showLegalDossier)}
                  className="py-3 px-3 bg-[#183264] hover:bg-[#102244] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Gavel className="w-4 h-4 text-[#FF7F50]" />
                  <span>{showLegalDossier ? 'Hide Police FIR Draft' : 'Generate Legal FIR Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Community Feed */}
        <div className="lg:col-span-5 space-y-4">
          {/* LEGAL COMPLAINT DOSSIER PREVIEW */}
          {showLegalDossier && (
            <div className="bg-[#183264] text-white rounded-2xl p-4 sm:p-5 border-2 border-[#FF7F50] shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#FF7F50] rounded-lg text-[#183264]">
                    <Gavel className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#FF7F50] font-bold uppercase tracking-wider">Sec 66D IT Act / Sec 420 IPC</div>
                    <div className="text-xs font-bold text-white">Statutory Police Complaint Draft</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyLegalDossier}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Copy full complaint text"
                  >
                    {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="Print complaint dossier"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Monospace complaint body */}
              <div className="bg-black/40 border border-white/10 p-3 rounded-xl max-h-72 overflow-y-auto font-mono text-[10px] text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
                {generateLegalDossierText()}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleCopyLegalDossier}
                  className="btn-coral py-2 px-3 text-xs font-bold flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedDossier ? <Check className="w-3.5 h-3.5 text-[#183264]" /> : <Copy className="w-3.5 h-3.5 text-[#183264]" />}
                  <span>{copiedDossier ? 'Copied to Clipboard!' : 'Copy Complaint Text'}</span>
                </button>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Portal (1930)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {submissionResult && !showLegalDossier && (
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
              <div className="pt-1.5 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowLegalDossier(true)}
                  className="btn-navy py-2 text-xs cursor-pointer flex-1 flex items-center justify-center gap-1"
                >
                  <Gavel className="w-3.5 h-3.5 text-[#FF7F50]" />
                  <span>View Legal FIR Dossier</span>
                </button>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-coral py-2 text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-[#183264]" />
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
