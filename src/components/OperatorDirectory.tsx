'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bus, CheckCircle2, AlertTriangle, XCircle, Search, 
  MapPin, Shield, RefreshCw, Sparkles, Building2, FileCheck, Check
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface OperatorDirectoryProps {
  locale: Locale;
}

export default function OperatorDirectory({ locale }: OperatorDirectoryProps) {
  const isTa = locale === 'ta';
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHub, setSelectedHub] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadOperators() {
      setLoading(true);
      try {
        let url = '/api/operators?limit=20';
        if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
        if (selectedHub !== 'ALL') url += `&hub=${selectedHub}`;
        if (search) url += `&q=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.data) {
          setOperators(data.data);
        }
      } catch (e) {
        console.error('Error fetching operators', e);
      } finally {
        setLoading(false);
      }
    }
    loadOperators();
  }, [search, selectedHub, selectedStatus]);

  const handleValidateOperator = async (opId: string) => {
    setValidatingId(opId);
    try {
      const res = await fetch(`/api/operators/${opId}/validate`, { method: 'POST' });
      const data = await res.json();
      if (data.data) {
        setValidationResults(prev => ({
          ...prev,
          [opId]: data.data,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setValidatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: 'bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30',
          icon: CheckCircle2,
          text: 'VERIFIED',
        };
      case 'PENDING':
        return {
          bg: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30',
          icon: AlertTriangle,
          text: 'PENDING',
        };
      case 'SUSPENDED':
        return {
          bg: 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30',
          icon: XCircle,
          text: 'SUSPENDED',
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-700 border-slate-300',
          icon: AlertTriangle,
          text: status,
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full pb-16 sm:pb-0">
      {/* Header Banner (Navy #183264 Surface) */}
      <div className="bg-[#183264] text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF7F50] text-[#183264] text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODULE 3: Merchant Verification & License Validation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'சரிபார்க்கப்பட்ட ஆம்னிபஸ் ஆபரேட்டர்கள்' : 'Tamil Nadu Private Omnibus Operator Registry'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'தமிழ்நாடு போக்குவரத்து துறை (STA) அனுமதி பெற்ற தனியார் ஆம்னிபஸ் ஆபரேட்டர்கள், Vahan பதிவு மற்றும் GST விவரங்களை சரிபார்க்கவும்.'
              : 'Official STA-authorized omnibus operators running out of South Chennai terminals (Kilambakkam KCBT, Tambaram, Guindy, OMR). Live Vahan, GST, and permit re-verification.'}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-clean p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-[#4A5D7E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTa ? 'ஆபரேட்டர் பெயர் அல்லது எண்...' : 'Search operator or permit (e.g. KPN)...'}
            className="w-full pl-9 pr-3 py-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl text-xs sm:text-sm text-[#183264] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF7F50] font-medium"
          />
        </div>

        {/* Hub & Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="flex-1 sm:flex-none bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-2.5 py-2 text-xs text-[#183264] font-medium focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
          >
            <option value="ALL">All Hubs</option>
            <option value="KCBT">KCBT (Kilambakkam)</option>
            <option value="Tambaram">Tambaram</option>
            <option value="Guindy">Guindy</option>
            <option value="Velachery">Velachery</option>
            <option value="OMR">OMR</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-none bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-2.5 py-2 text-xs text-[#183264] font-medium focus:outline-none focus:ring-1 focus:ring-[#FF7F50]"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Operator Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-[#4A5D7E] text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#FF7F50]" />
          <span>Querying Tamil Nadu STA Omnibus Registry...</span>
        </div>
      ) : operators.length === 0 ? (
        <div className="card-clean p-12 text-center text-[#4A5D7E] text-sm">
          No bus operators found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {operators.map((op) => {
            const badge = getStatusBadge(op.status);
            const valResult = validationResults[op.id];
            const parsedHubs = Array.isArray(op.hubs) ? op.hubs : (typeof op.hubs === 'string' ? JSON.parse(op.hubs) : []);

            return (
              <div
                key={op.id}
                className="card-clean p-4 sm:p-5 flex flex-col justify-between space-y-3.5 hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-[#183264] flex items-center gap-1.5 truncate">
                        <Bus className="w-4 h-4 text-[#FF7F50] shrink-0" />
                        <span className="truncate">{op.name}</span>
                      </h3>
                      <div className="text-[10px] sm:text-[11px] font-mono text-[#4A5D7E] mt-0.5 truncate">
                        Permit: <span className="text-[#183264] font-bold">{op.permitNumber}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Trust Score & Details */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between items-center text-[10px] sm:text-[11px] mb-1">
                        <span className="text-[#4A5D7E] font-bold">STA Trust Score</span>
                        <span className="font-mono font-bold text-[#183264]">{op.trustScore} / 100</span>
                      </div>
                      <div className="w-full h-2 bg-[#F5F7FB] border border-[#E3E8F2] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#183264] rounded-full"
                          style={{ width: `${op.trustScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] bg-[#F5F7FB] p-2.5 rounded-xl border border-[#E3E8F2]">
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">GSTIN: </span>
                        <span className="font-mono font-bold text-[#183264]">{op.gstin || 'None'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">Fleet: </span>
                        <span className="text-[#183264] font-bold">{op.vehicles?.length || '12'} Buses</span>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-[#4A5D7E]">UPI: </span>
                        <span className="font-mono font-bold text-[#FF7F50]">{op.registeredUpiVpa || 'Corporate Merchant'}</span>
                      </div>
                    </div>

                    {/* South Chennai Hubs */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {parsedHubs.map((hub: string) => (
                        <span
                          key={hub}
                          className="text-[9px] sm:text-[10px] font-bold bg-white text-[#183264] border border-[#E3E8F2] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs"
                        >
                          <MapPin className="w-2.5 h-2.5 text-[#FF7F50] shrink-0" />
                          <span>{hub}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Validation Status or Action */}
                <div className="pt-2 border-t border-[#E3E8F2]">
                  {valResult ? (
                    <div className="bg-[#F0FDF4] border border-[#1E9E5A]/40 p-2.5 rounded-xl text-[10px] sm:text-[11px] text-[#1E9E5A] space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Mock STA & Vahan Validated</span>
                      </div>
                      <div className="text-[10px] text-[#183264] flex flex-wrap gap-2 font-medium">
                        <span>Permit: {valResult.permit?.valid ? 'Valid' : 'Expired'}</span>
                        <span>• GST: {valResult.gst?.valid ? 'Active' : 'Unverified'}</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleValidateOperator(op.id)}
                      disabled={validatingId === op.id}
                      className="w-full py-2 px-3 bg-[#F5F7FB] hover:bg-[#E3E8F2] text-[#183264] font-bold text-[11px] rounded-xl border border-[#E3E8F2] flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
                    >
                      {validatingId === op.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#183264]" />
                      ) : (
                        <FileCheck className="w-3.5 h-3.5 text-[#FF7F50]" />
                      )}
                      <span>Live Re-validate STA / Vahan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
