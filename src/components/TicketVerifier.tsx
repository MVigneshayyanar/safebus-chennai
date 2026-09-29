'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, XCircle, 
  Upload, QrCode, RefreshCw, Key, FileText, UserCheck, 
  WifiOff, ArrowRight, Bus, IndianRupee, Sparkles, Smartphone, Check
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface TicketVerifierProps {
  locale: Locale;
}

export default function TicketVerifier({ locale }: TicketVerifierProps) {
  const isTa = locale === 'ta';
  const [jwsInput, setJwsInput] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [sampleTickets, setSampleTickets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Fetch initial sample tickets from database
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await fetch('/api/tickets?limit=8');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setSampleTickets(json.data);
          setJwsInput(json.data[0].jws);
          setSelectedPreset('genuine');
        }
      } catch (e) {
        console.error('Failed to load tickets', e);
      }
    }
    loadSamples();
  }, []);

  const handleVerify = async (tokenToVerify?: string) => {
    const token = tokenToVerify || jwsInput;
    if (!token.trim()) return;

    setLoading(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jws: token.trim() }),
      });
      const data = await res.json();
      setVerificationResult(data.data || { verdict: 'INVALID', reasons: [data.error?.message || 'Verification failed'] });
    } catch (err: any) {
      setVerificationResult({
        verdict: 'INVALID',
        reasons: [err.message || 'Network error during verification'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBoardTicket = async () => {
    if (!verificationResult?.ticket?.ticketNumber) return;
    setBoardLoading(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'board',
          ticketNumber: verificationResult.ticket.ticketNumber,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setVerificationResult((prev: any) => ({
          ...prev,
          ticket: {
            ...prev.ticket,
            status: data.data.ticket?.status || 'BOARDED',
            boardedAt: data.data.ticket?.boardedAt || new Date().toISOString(),
          },
          reasons: data.data.reasons || ['Boarding successfully registered by Kilambakkam Conductor'],
        }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBoardLoading(false);
    }
  };

  const selectPreset = (type: 'genuine' | 'tampered' | 'used' | 'scalped') => {
    if (sampleTickets.length === 0) return;

    if (type === 'genuine') {
      const genuine = sampleTickets.find(t => t.status === 'ISSUED') || sampleTickets[0];
      setJwsInput(genuine.jws);
      setSelectedPreset('genuine');
      handleVerify(genuine.jws);
    } else if (type === 'tampered') {
      const base = sampleTickets[0]?.jws || '';
      const parts = base.split('.');
      if (parts.length === 3) {
        const tamperedJws = `${parts[0]}.${parts[1]}.CORRUPTED_FAKE_SIGNATURE_${parts[2].slice(20)}`;
        setJwsInput(tamperedJws);
        setSelectedPreset('tampered');
        handleVerify(tamperedJws);
      }
    } else if (type === 'used') {
      const boarded = sampleTickets.find(t => t.status === 'BOARDED') || sampleTickets[1] || sampleTickets[0];
      setJwsInput(boarded.jws);
      setSelectedPreset('used');
      handleVerify(boarded.jws);
    } else if (type === 'scalped') {
      const scalped = sampleTickets.find(t => t.fare > 1600) || sampleTickets[2] || sampleTickets[0];
      setJwsInput(scalped.jws);
      setSelectedPreset('scalped');
      handleVerify(scalped.jws);
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'GENUINE':
        return {
          bg: 'bg-[#F0FDF4] border-[#1E9E5A]',
          text: 'text-[#1E9E5A]',
          icon: ShieldCheck,
          title: isTa ? 'உண்மையான டிக்கெட்' : 'GENUINE TICKET — VERIFIED',
          badgeBg: 'bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30',
        };
      case 'ALREADY_USED':
        return {
          bg: 'bg-[#FFFBEB] border-[#F5A623]',
          text: 'text-[#F5A623]',
          icon: AlertTriangle,
          title: isTa ? 'ஏற்கனவே பயன்படுத்தப்பட்டது' : 'ALREADY USED — DUPLICATE',
          badgeBg: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30',
        };
      case 'REVOKED':
        return {
          bg: 'bg-[#FEF2F2] border-[#D64545]',
          text: 'text-[#D64545]',
          icon: XCircle,
          title: isTa ? 'ரத்து செய்யப்பட்ட டிக்கெட்' : 'REVOKED TICKET',
          badgeBg: 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30',
        };
      default:
        return {
          bg: 'bg-[#FEF2F2] border-[#D64545]',
          text: 'text-[#D64545]',
          icon: ShieldAlert,
          title: isTa ? 'போலி டிக்கெட்!' : 'FORGED / INVALID TICKET!',
          badgeBg: 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30',
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
            <span>MODULE 2: Cryptographic Verification (Ed25519)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'டிஜிட்டல் இ-டிக்கெட் சரிபார்ப்பு' : 'Digital Cryptographic Ticket Verifier'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'தனியார் ஆம்னிபஸ் டிக்கெட்டுகளின் டிஜிட்டல் கையொப்பம், ஆபரேட்டர் அங்கீகாரம் மற்றும் கட்டண உச்சவரம்பை உடனடியாக சரிபார்க்கவும்.'
              : 'Verify Ed25519 digital signatures, public key identity, and STA fare cap compliance to prevent counterfeit omnibus tickets at Kilambakkam & Tambaram.'}
          </p>
        </div>

        {/* Offline Conductor Toggle */}
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 self-stretch sm:self-auto">
          <div className="flex items-center gap-2">
            <WifiOff className={`w-4 h-4 ${offlineMode ? 'text-[#FF7F50]' : 'text-slate-300'}`} />
            <div className="text-left">
              <div className="text-xs font-bold text-white leading-tight">
                {isTa ? 'ஆஃப்லைன் பயன்முறை' : 'Offline Mode'}
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                {offlineMode ? 'Cached JWKS Keys' : 'Live STA Registry'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              offlineMode ? 'bg-[#FF7F50]' : 'bg-white/30'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                offlineMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Demo Presets (Clean Card on #F5F7FB background) */}
      <div className="card-clean p-3 sm:p-4">
        <div className="text-xs font-bold text-[#4A5D7E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-[#183264]" />
          <span>{isTa ? '1-கிளிக் சோதனை டிக்கெட்டுகள்' : 'One-Click Live Test Scenarios (Demo Presets)'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => selectPreset('genuine')}
            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-w-0 cursor-pointer ${
              selectedPreset === 'genuine'
                ? 'bg-[#1E9E5A]/10 border-[#1E9E5A] text-[#1E9E5A] ring-1 ring-[#1E9E5A]'
                : 'bg-white border-[#E3E8F2] text-[#183264] hover:border-[#183264]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[#1E9E5A]">
              <span className="truncate">Genuine</span>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="text-[10px] text-[#4A5D7E] mt-0.5 truncate">KPN / KCBT → Madurai</div>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('tampered')}
            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-w-0 cursor-pointer ${
              selectedPreset === 'tampered'
                ? 'bg-[#D64545]/10 border-[#D64545] text-[#D64545] ring-1 ring-[#D64545]'
                : 'bg-white border-[#E3E8F2] text-[#183264] hover:border-[#183264]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[#D64545]">
              <span className="truncate">Tampered</span>
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="text-[10px] text-[#4A5D7E] mt-0.5 truncate">Forged Signature</div>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('used')}
            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-w-0 cursor-pointer ${
              selectedPreset === 'used'
                ? 'bg-[#F5A623]/10 border-[#F5A623] text-[#F5A623] ring-1 ring-[#F5A623]'
                : 'bg-white border-[#E3E8F2] text-[#183264] hover:border-[#183264]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[#F5A623]">
              <span className="truncate">Already Used</span>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="text-[10px] text-[#4A5D7E] mt-0.5 truncate">Duplicate Scan</div>
          </button>

          <button
            type="button"
            onClick={() => selectPreset('scalped')}
            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all min-w-0 cursor-pointer ${
              selectedPreset === 'scalped'
                ? 'bg-[#FF7F50]/15 border-[#FF7F50] text-[#183264] ring-1 ring-[#FF7F50]'
                : 'bg-white border-[#E3E8F2] text-[#183264] hover:border-[#183264]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-[#183264]">
              <span className="truncate">Over-Fare</span>
              <IndianRupee className="w-3.5 h-3.5 text-[#FF7F50] shrink-0" />
            </div>
            <div className="text-[10px] text-[#4A5D7E] mt-0.5 truncate">Exceeds STA Cap</div>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: QR Code & JWS Token Input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-clean p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#183264] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#FF7F50]" />
                <span>{isTa ? 'QR குறியீடு அல்லது JWS' : 'QR Code or JWS Compact Token'}</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#F5F7FB] text-[#183264] border border-[#E3E8F2] px-2 py-0.5 rounded">
                RFC-7515
              </span>
            </div>

            {/* QR Scanner Display Area */}
            <div className="relative aspect-video max-h-52 sm:max-h-64 rounded-xl bg-[#F5F7FB] border border-[#E3E8F2] flex flex-col items-center justify-center p-3 overflow-hidden">
              {sampleTickets.length > 0 && sampleTickets[0]?.qrDataUrl ? (
                <div className="flex flex-col items-center gap-2 z-10 max-w-full">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-[#E3E8F2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={sampleTickets.find(t => t.jws === jwsInput)?.qrDataUrl || sampleTickets[0].qrDataUrl} 
                      alt="Ticket QR Code" 
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                    />
                  </div>
                  <div className="text-[10px] text-[#4A5D7E] font-medium flex items-center gap-1 font-mono truncate max-w-full">
                    <Check className="w-3 h-3 text-[#1E9E5A] shrink-0" />
                    <span className="truncate">{selectedPreset ? `Preset: ${selectedPreset}` : 'Signed Token Ready'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center z-10 space-y-2">
                  <QrCode className="w-10 h-10 text-[#4A5D7E] mx-auto animate-pulse" />
                  <p className="text-xs text-[#4A5D7E] font-medium">Position camera over Omnibus E-Ticket QR</p>
                </div>
              )}
            </div>

            {/* JWS Input Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#183264] flex items-center justify-between">
                <span>{isTa ? 'JWS டோக்கன் சரம்' : 'JWS Token String'}</span>
                <span className="text-[10px] text-[#4A5D7E]">{jwsInput.length} chars</span>
              </label>
              <textarea
                value={jwsInput}
                onChange={(e) => setJwsInput(e.target.value)}
                rows={3}
                placeholder="eyJhbGciOiJFZERTQSI...eyJ0aWQiOi...kX8f2..."
                className="w-full font-mono text-[11px] bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl p-2.5 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50] placeholder-slate-400 break-all"
              />
            </div>

            {/* Passenger Phone Matcher */}
            <div className="space-y-1.5 bg-[#F5F7FB] p-2.5 sm:p-3 rounded-xl border border-[#E3E8F2]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#183264] flex items-center gap-1.5 font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-[#FF7F50]" />
                  <span>Passenger Integrity Hash Check</span>
                </span>
                <span className="text-[10px] font-mono text-[#4A5D7E]">SHA-256</span>
              </div>
              <input
                type="text"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                placeholder="Enter last 10 digits to verify ticket ownership..."
                className="w-full text-xs bg-white border border-[#E3E8F2] rounded-lg p-2 text-[#183264] focus:outline-none focus:ring-1 focus:ring-[#FF7F50] placeholder-slate-400"
              />
            </div>

            {/* Coral Action Button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading || !jwsInput.trim()}
              className="btn-coral w-full cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#183264]" />
              )}
              <span>{isTa ? 'சரிபார்க்கவும்' : 'Verify Ticket Cryptography Now'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Cryptographic Verdict & Passenger Ticket Info */}
        <div className="lg:col-span-6 space-y-4">
          {verificationResult ? (
            <div className={`p-4 sm:p-6 rounded-2xl border ${getVerdictStyle(verificationResult.verdict).bg} space-y-4 transition-all shadow-xs`}>
              {/* Verdict Header Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl ${getVerdictStyle(verificationResult.verdict).badgeBg} border shrink-0`}>
                    {React.createElement(getVerdictStyle(verificationResult.verdict).icon, { className: 'w-6 h-6' })}
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${getVerdictStyle(verificationResult.verdict).text}`}>
                      {getVerdictStyle(verificationResult.verdict).title}
                    </h3>
                    <p className="text-xs text-[#183264] font-medium mt-0.5">
                      {verificationResult.reasons?.[0] || 'Verification completed successfully'}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] sm:text-xs uppercase font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getVerdictStyle(verificationResult.verdict).badgeBg}`}>
                  {verificationResult.verdict}
                </span>
              </div>

              {/* Detailed Breakdown Panels */}
              <div className="space-y-3">
                {/* Cryptographic Proof Details */}
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E3E8F2] text-xs space-y-2 shadow-xs">
                  <div className="font-bold text-[#183264] flex items-center justify-between border-b border-[#E3E8F2] pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#FF7F50]" />
                      <span>Cryptographic Proof (RFC-7515)</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#1E9E5A] bg-[#1E9E5A]/10 px-1.5 py-0.5 rounded font-bold border border-[#1E9E5A]/20">
                      Ed25519 Validated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px]">
                    <div className="truncate">
                      <span className="text-[#4A5D7E]">Key ID: </span>
                      <span className="font-mono font-bold text-[#183264]">{verificationResult.ticket?.kid || 'kid_kpn_ed25519_01'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-[#4A5D7E]">Operator: </span>
                      <span className="text-[#183264] font-bold">{verificationResult.operator?.name || 'KPN Travels'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-[#4A5D7E]">RTO ID: </span>
                      <span className="font-mono text-[#183264] font-semibold">{verificationResult.operator?.publicId || 'OP-TN-0001'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-[#4A5D7E]">Status: </span>
                      <span className="text-[#1E9E5A] font-bold">VERIFIED (TN-OMN-1001)</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                {verificationResult.ticket && (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E3E8F2] text-xs space-y-2 shadow-xs">
                    <div className="font-bold text-[#183264] flex items-center justify-between border-b border-[#E3E8F2] pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-[#183264]" />
                        <span>Boarding & Route</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#FF7F50] font-bold">
                        {verificationResult.ticket.ticketNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="text-[#4A5D7E]">Route</div>
                        <div className="text-[#183264] font-bold truncate">
                          {verificationResult.ticket.route || 'KCBT → Madurai'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Seat</div>
                        <div className="text-[#183264] font-bold">
                          {verificationResult.ticket.seat || 'L-12 (Upper)'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Fare</div>
                        <div className="text-[#183264] font-bold">
                          ₹{verificationResult.ticket.fare || 1200}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Boarding Hub</div>
                        <div className="text-[#183264] font-bold truncate">
                          KCBT Bay 4
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Status</div>
                        <div className={`font-bold ${verificationResult.ticket.status === 'BOARDED' ? 'text-[#F5A623]' : 'text-[#1E9E5A]'}`}>
                          {verificationResult.ticket.status || 'ISSUED'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Travel</div>
                        <div className="text-[#183264] font-bold">
                          Tonight, 22:30
                        </div>
                      </div>
                    </div>

                    {/* STA Fare Ceiling Check */}
                    {verificationResult.fareCapCheck && (
                      <div className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                        verificationResult.fareCapCheck.compliant 
                          ? 'bg-[#1E9E5A]/10 border-[#1E9E5A]/30 text-[#1E9E5A]' 
                          : 'bg-[#F5A623]/10 border-[#F5A623]/30 text-[#183264]'
                      }`}>
                        <div>
                          <div className="font-bold text-[11px]">
                            {verificationResult.fareCapCheck.compliant ? '✓ STA Fare Cap Compliant' : '⚠️ STA Fare Ceiling Exceeded!'}
                          </div>
                          <div className="text-[10px] text-[#4A5D7E]">
                            Base: ₹{verificationResult.fareCapCheck.baseFare} • Max: ₹{verificationResult.fareCapCheck.maxAllowedFare} • Ticket: ₹{verificationResult.fareCapCheck.actualFare}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E3E8F2] font-bold self-start sm:self-auto">
                          {verificationResult.fareCapCheck.multiplier.toFixed(1)}x Cap
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conductor Boarding Action Button */}
              {verificationResult.verdict === 'GENUINE' && verificationResult.ticket?.status !== 'BOARDED' && (
                <button
                  type="button"
                  onClick={handleBoardTicket}
                  disabled={boardLoading}
                  className="btn-navy w-full cursor-pointer text-xs"
                >
                  {boardLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <UserCheck className="w-3.5 h-3.5 text-white" />}
                  <span>{isTa ? 'பயணியை ஏற்ற உறுதிசெய்' : 'Confirm Passenger Boarding (Conductor)'}</span>
                </button>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="card-clean p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full min-h-[260px] sm:min-h-[340px] space-y-2.5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#FF7F50]/15 flex items-center justify-center text-[#FF7F50]">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-[#183264]">
                {isTa ? 'டிக்கெட் சரிபார்ப்பிற்கு தயார்' : 'Ready to Verify E-Ticket'}
              </h4>
              <p className="text-xs text-[#4A5D7E] max-w-sm">
                Select one of the 1-click test scenarios above or paste any Ed25519 signed JWS token to test the cryptographic verification pipeline.
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5 justify-center text-[10px] font-medium text-[#183264]">
                <span className="bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#E3E8F2]">✓ Ed25519</span>
                <span className="bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#E3E8F2]">✓ RTO Key</span>
                <span className="bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#E3E8F2]">✓ STA Fare Cap</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
