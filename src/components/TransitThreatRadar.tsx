'use client';

import React, { useState } from 'react';
import { 
  MapPin, ShieldAlert, AlertTriangle, CheckCircle, Radio, 
  TrendingUp, Users, Bus, IndianRupee, ArrowUpRight, Sparkles
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface TransitThreatRadarProps {
  locale: Locale;
}

export default function TransitThreatRadar({ locale }: TransitThreatRadarProps) {
  const isTa = locale === 'ta';

  const [selectedHub, setSelectedHub] = useState<string>('kcbt');

  const hubs = [
    {
      id: 'kcbt',
      name: 'Kilambakkam Terminus (KCBT)',
      tamilName: 'கிளம்பாக்கம் பேருந்து முனையம்',
      riskLevel: 'HIGH_ALERT',
      riskColor: 'text-[#D64545] bg-[#D64545]/10 border-[#D64545]/30',
      activeAlerts: 3,
      surgeMultiplier: '1.95x',
      scansLastHour: 482,
      interceptedToday: '₹34,800',
      description: 'Major South Chennai hub. Active scalping reported for Madurai & Coimbatore AC Sleeper buses. Phishing ring active.',
      flaggedBrokers: ['Fake KCBT Bay 4 Counter', 'Online Clone: kcbt-booking.com'],
      coordinates: '12.8682° N, 80.0818° E',
    },
    {
      id: 'tambaram',
      name: 'Tambaram Sanatorium Stand',
      tamilName: 'தாம்பரம் சானடோரியம்',
      riskLevel: 'ELEVATED',
      riskColor: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30',
      activeAlerts: 2,
      surgeMultiplier: '1.58x',
      scansLastHour: 290,
      interceptedToday: '₹18,500',
      description: 'Unauthorized brokers circulating duplicate PDF e-tickets via WhatsApp groups for Salem and Trichy buses.',
      flaggedBrokers: ['Tambaram FastBus WhatsApp Group', 'UPI: tickets.fastbus@oksbi'],
      coordinates: '12.9304° N, 80.1345° E',
    },
    {
      id: 'perungalathur',
      name: 'Perungalathur Bypass Bay',
      tamilName: 'பெருங்களத்தூர் பைபாஸ்',
      riskLevel: 'MODERATE',
      riskColor: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30',
      activeAlerts: 1,
      surgeMultiplier: '1.34x',
      scansLastHour: 195,
      interceptedToday: '₹6,400',
      description: 'Conductor Ed25519 QR scanners intercepted duplicate boarding pass for Tirunelveli omnibus.',
      flaggedBrokers: ['Unlicensed agent near Perungalathur flyover'],
      coordinates: '12.9056° N, 80.0984° E',
    },
    {
      id: 'guindy',
      name: 'Guindy / Kathipara Junction',
      tamilName: 'கிண்டி / கத்திப்பாரா சந்திப்பு',
      riskLevel: 'NORMAL',
      riskColor: 'text-[#1E9E5A] bg-[#1E9E5A]/10 border-[#1E9E5A]/30',
      activeAlerts: 0,
      surgeMultiplier: '1.08x',
      scansLastHour: 340,
      interceptedToday: '₹0',
      description: 'All omnibus operators compliant with STA tariff ceiling. High Ed25519 verification adherence rate (98.4%).',
      flaggedBrokers: ['No active scam alerts'],
      coordinates: '13.0067° N, 80.2026° E',
    },
    {
      id: 'omr',
      name: 'Velachery / OMR Tech Corridor',
      tamilName: 'வேளச்சேரி / ஓ.எம்.ஆர்',
      riskLevel: 'MODERATE',
      riskColor: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30',
      activeAlerts: 1,
      surgeMultiplier: '1.42x',
      scansLastHour: 215,
      interceptedToday: '₹9,200',
      description: 'Weekend surge scalping targeting IT employees traveling to Bengaluru and Hyderabad.',
      flaggedBrokers: ['Unregistered booking portal: omr-express.in'],
      coordinates: '12.9756° N, 80.2206° E',
    },
  ];

  const currentHub = hubs.find(h => h.id === selectedHub) || hubs[0];

  return (
    <div className="card-clean p-4 sm:p-6 space-y-4">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8F2] pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#183264]/10 text-[#183264] text-[10px] font-bold mb-1">
            <Radio className="w-3 h-3 text-[#FF7F50] animate-pulse" />
            <span>SOUTH CHENNAI GEO-FORENSICS RADAR</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#183264] tracking-tight">
            {isTa ? 'தென் சென்னை பேருந்து முனையங்கள் நேரடி கண்காணிப்பு' : 'South Chennai Transit Terminals • Live Threat Intelligence'}
          </h3>
          <p className="text-xs text-[#4A5D7E] mt-0.5">
            Real-time fraud surveillance, ticket scalping multipliers, and on-ground conductor checks across South Chennai hubs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#1E9E5A] animate-ping" />
          <span className="text-xs font-mono font-bold text-[#183264]">RTO Live Link</span>
        </div>
      </div>

      {/* South Chennai Hub Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {hubs.map((hub) => {
          const isSelected = selectedHub === hub.id;
          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => setSelectedHub(hub.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#183264] text-white border-[#183264] shadow-xs'
                  : 'bg-[#F5F7FB] text-[#183264] border-[#E3E8F2] hover:border-[#183264]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF7F50]' : 'text-[#4A5D7E]'}`} />
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : hub.riskColor
                  }`}>
                    {hub.riskLevel.replace('_', ' ')}
                  </span>
                </div>
                <div className="font-bold text-xs line-clamp-1">
                  {isTa ? hub.tamilName : hub.name}
                </div>
              </div>
              <div className={`text-[10px] font-mono mt-2 pt-1 border-t ${
                isSelected ? 'border-white/20 text-slate-300' : 'border-[#E3E8F2] text-[#4A5D7E]'
              }`}>
                Surge: <strong>{hub.surgeMultiplier}</strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Hub Detailed Intelligence Card */}
      <div className="bg-[#F5F7FB] rounded-2xl p-4 sm:p-5 border border-[#E3E8F2] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8F2] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#183264] text-[#FF7F50]">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#183264]">
                {currentHub.name}
              </h4>
              <p className="text-[11px] font-mono text-[#4A5D7E]">
                {currentHub.coordinates} • South Chennai Command
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${currentHub.riskColor}`}>
              {currentHub.riskLevel}
            </span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 rounded-xl border border-[#E3E8F2] shadow-2xs">
            <div className="text-[10px] font-bold text-[#4A5D7E] uppercase">Peak Surge Multiplier</div>
            <div className="text-base sm:text-lg font-black text-[#D64545] font-mono mt-0.5">
              {currentHub.surgeMultiplier}
            </div>
            <div className="text-[10px] text-[#4A5D7E]">Statutory STA Cap: 1.50x</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E3E8F2] shadow-2xs">
            <div className="text-[10px] font-bold text-[#4A5D7E] uppercase">Hourly Scans (KCBT)</div>
            <div className="text-base sm:text-lg font-black text-[#183264] font-mono mt-0.5">
              {currentHub.scansLastHour}
            </div>
            <div className="text-[10px] text-[#1E9E5A]">Conductor Verified</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E3E8F2] shadow-2xs">
            <div className="text-[10px] font-bold text-[#4A5D7E] uppercase">Active Alerts</div>
            <div className="text-base sm:text-lg font-black text-[#FF7F50] font-mono mt-0.5">
              {currentHub.activeAlerts}
            </div>
            <div className="text-[10px] text-[#4A5D7E]">Under RTO Investigation</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E3E8F2] shadow-2xs">
            <div className="text-[10px] font-bold text-[#4A5D7E] uppercase">Intercepted Fraud</div>
            <div className="text-base sm:text-lg font-black text-[#1E9E5A] font-mono mt-0.5">
              {currentHub.interceptedToday}
            </div>
            <div className="text-[10px] text-[#4A5D7E]">Protected Commuter Money</div>
          </div>
        </div>

        {/* Intelligence Intel Banner */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E8F2] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#183264]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF7F50]" />
            <span>Ground Intelligence & Scalper Interception Report</span>
          </div>
          <p className="text-xs text-[#4A5D7E] leading-relaxed">
            {currentHub.description}
          </p>
          <div className="pt-1.5 border-t border-[#E3E8F2] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#183264]">Flagged Entities / Phishing Vectors:</span>
            {currentHub.flaggedBrokers.map((fb, idx) => (
              <span key={idx} className="text-[10px] font-mono font-bold bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20 px-2 py-0.5 rounded">
                {fb}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
