'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import TicketVerifier from '@/components/TicketVerifier';
import DomainChecker from '@/components/DomainChecker';
import ReportScam from '@/components/ReportScam';
import OperatorDirectory from '@/components/OperatorDirectory';
import EnforcementDashboard from '@/components/EnforcementDashboard';
import AggregatorPortal from '@/components/AggregatorPortal';
import { Locale } from '@/lib/i18n';
import { ShieldCheck, PhoneCall, Bus, MapPin, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('verifier');
  const [locale, setLocale] = useState<Locale>('en');
  const [reportPrefill, setReportPrefill] = useState<{ type: string; value: string } | null>(null);

  const isTa = locale === 'ta';

  const handleReportPrefill = (entity: { type: string; value: string }) => {
    setReportPrefill(entity);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#183264] selection:bg-[#FF7F50] selection:text-[#183264] w-full max-w-full overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        locale={locale}
        setLocale={setLocale}
      />

      {/* Main Content Area (pb-24 on mobile ensures no content is hidden behind bottom bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
        {activeTab === 'verifier' && <TicketVerifier locale={locale} />}
        {activeTab === 'checker' && (
          <DomainChecker locale={locale} onReportPrefill={handleReportPrefill} />
        )}
        {activeTab === 'report' && (
          <ReportScam locale={locale} prefill={reportPrefill} />
        )}
        {activeTab === 'operators' && <OperatorDirectory locale={locale} />}
        {activeTab === 'enforcement' && <EnforcementDashboard locale={locale} />}
        {activeTab === 'developer' && <AggregatorPortal locale={locale} />}
      </main>

      {/* Footer Band (Navy #183264 with White Text and Coral Accents) */}
      <footer className="mt-auto border-t border-[#183264] bg-[#183264] text-white py-8 sm:py-10 text-xs pb-28 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Col 1: Brand & Gov Info */}
            <div className="space-y-2.5 sm:space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#FF7F50] flex items-center justify-center text-[#183264] font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#183264]" />
                </div>
                <span className="font-bold text-sm sm:text-base text-white">SafeBus <span className="text-[#FF7F50]">Chennai</span></span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">
                  STA-TN PS4
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed max-w-md">
                {isTa
                  ? 'தென் சென்னை பயணிகளை போலி ஆம்னிபஸ் இணையதளங்கள், கள்ளச்சந்தை டிக்கெட் விற்பனை மற்றும் போலி ஆபரேட்டர்களிடமிருந்து பாதுகாக்கும் அதிகாரப்பூர்வ சரிபார்ப்பு தளம்.'
                  : 'An official verification initiative protecting omnibus passengers across South Chennai (Kilambakkam KCBT, Tambaram, Perungalathur, Guindy) against fake ticketing domains, scalping, and counterfeit travel bookings.'}
              </p>
              <div className="text-[11px] text-slate-300 font-medium pt-0.5">
                Hackathon Theme 3, PS No. 4: &quot;Bus-Reservation Scam Prevention (South Chennai)&quot;
              </div>
            </div>

            {/* Col 2: South Chennai Terminals */}
            <div className="space-y-2">
              <div className="font-bold text-[#FF7F50] uppercase tracking-wider text-[11px]">
                South Chennai Hubs
              </div>
              <ul className="space-y-1 text-slate-200 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
                  <span>Kilambakkam Terminus (KCBT)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
                  <span>Tambaram Sanatorium Stand</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
                  <span>Perungalathur Bypass Bay</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
                  <span>Guindy & Velachery Link</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Emergency & Helplines */}
            <div className="space-y-2">
              <div className="font-bold text-[#FF7F50] uppercase tracking-wider text-[11px]">
                Official Helplines
              </div>
              <ul className="space-y-1.5 text-slate-200 text-[11px]">
                <li>
                  <a
                    href="tel:1930"
                    className="inline-flex items-center gap-1.5 bg-[#FF7F50] text-[#183264] px-2.5 py-1 rounded-md font-bold hover:bg-[#ff956e] transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Cybercrime: 1930</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:18004256151"
                    className="flex items-center gap-1.5 text-slate-200 hover:text-white"
                  >
                    <Bus className="w-3.5 h-3.5 text-[#FF7F50]" />
                    <span>STA: 1800-425-6151</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-200 hover:text-white"
                  >
                    <span>cybercrime.gov.in</span>
                    <ExternalLink className="w-3 h-3 text-[#FF7F50]" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-300">
            <div>
              © 2026 SafeBus Chennai • State Transport Authority (STA) Tamil Nadu
            </div>
            <div className="flex items-center gap-3 font-medium">
              <span className="hover:text-[#FF7F50] cursor-pointer" onClick={() => setActiveTab('developer')}>
                OpenAPI
              </span>
              <span>•</span>
              <span className="hover:text-[#FF7F50] cursor-pointer" onClick={() => setActiveTab('enforcement')}>
                CERT-In Feed
              </span>
              <span>•</span>
              <span className="hover:text-[#FF7F50] cursor-pointer" onClick={() => setActiveTab('verifier')}>
                Conductor JWKS
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
