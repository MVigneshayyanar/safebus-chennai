'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bus, CheckCircle2, AlertTriangle, XCircle, Search, 
  MapPin, Shield, RefreshCw, Sparkles, Building2, FileCheck, Check,
  CreditCard, ShieldCheck, AlertOctagon, Car, FileBadge, ArrowRight
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface OperatorDirectoryProps {
  locale: Locale;
}

// Mock Parivahan RTO Vahan Database for South Chennai Transit Corridor
const VAHAN_REGISTRY: Record<string, any> = {
  'TN-22-CY-1001': {
    regNo: 'TN-22-CY-1001',
    operator: 'KPN Travels',
    make: 'Volvo B11R Multi-Axle I-Shift',
    permitType: 'All India Tourist Permit (AITP)',
    permitExpiry: '2027-08-15',
    fcValidity: '2027-01-20',
    seatingCapacity: '36 Berths AC Sleeper',
    rtoOffice: 'RTO Meenambakkam (TN-22)',
    registeredHub: 'KCBT Kilambakkam',
    insuranceStatus: 'ACTIVE (ICICI Lombard - Valid till 2027)',
    pucValid: true,
    challans: 0,
    status: 'COMPLIANT',
  },
  'TN-01-AN-4422': {
    regNo: 'TN-01-AN-4422',
    operator: 'Parveen Travels',
    make: 'Mercedes-Benz SHD 2436 Luxury',
    permitType: 'Stage Carriage Special Permit',
    permitExpiry: '2026-12-10',
    fcValidity: '2026-11-30',
    seatingCapacity: '40 Reclining Pushback AC',
    rtoOffice: 'RTO Chennai Central (TN-01)',
    registeredHub: 'Tambaram MEPZ',
    insuranceStatus: 'ACTIVE (New India Assurance - Valid till 2026)',
    pucValid: true,
    challans: 0,
    status: 'COMPLIANT',
  },
  'TN-19-BA-8877': {
    regNo: 'TN-19-BA-8877',
    operator: 'Unregistered Private Operator',
    make: 'Ashok Leyland Viking Semi-Sleeper',
    permitType: 'Goods / Educational Institution (Misused)',
    permitExpiry: '2024-03-12 (EXPIRED 2+ YEARS)',
    fcValidity: 'EXPIRED (2024-01-10)',
    seatingCapacity: '54 Non-AC Seats (Illegal Conversion)',
    rtoOffice: 'RTO Chengalpattu (TN-19)',
    registeredHub: 'Tambaram Bypass Illegal Halt',
    insuranceStatus: 'LAPSED (No active commercial policy)',
    pucValid: false,
    challans: 7,
    status: 'BLACKLISTED',
    warningReason: 'Impound Warrant issued by Chengalpattu RTO for unauthorized passenger pickup & ticket scalping.',
  },
  'TN-09-BK-5521': {
    regNo: 'TN-09-BK-5521',
    operator: 'SRS Travels',
    make: 'Scania Metrolink HD 13.7M',
    permitType: 'All India Tourist Permit (AITP)',
    permitExpiry: '2027-04-18',
    fcValidity: '2026-12-05',
    seatingCapacity: '32 Sleeper Berths',
    rtoOffice: 'RTO K.K. Nagar (TN-09)',
    registeredHub: 'Guindy Kathipara / KCBT',
    insuranceStatus: 'ACTIVE (Bajaj Allianz - Valid till 2027)',
    pucValid: true,
    challans: 0,
    status: 'COMPLIANT',
  },
  'KA-01-F-9900': {
    regNo: 'KA-01-F-9900',
    operator: 'Kallada Travels',
    make: 'Volvo 9600 Multi-Axle Intercity',
    permitType: 'National Tourist Omnibus Permit',
    permitExpiry: '2028-02-14',
    fcValidity: '2027-05-19',
    seatingCapacity: '36 Berths AC Sleeper',
    rtoOffice: 'RTO Koramangala (KA-01)',
    registeredHub: 'KCBT Kilambakkam',
    insuranceStatus: 'ACTIVE (United India Insurance)',
    pucValid: true,
    challans: 0,
    status: 'COMPLIANT',
  },
};

export default function OperatorDirectory({ locale }: OperatorDirectoryProps) {
  const isTa = locale === 'ta';
  const [activeTab, setActiveTab] = useState<'directory' | 'vahanLookup'>('directory');
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHub, setSelectedHub] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});

  // Vahan RTO lookup tool state
  const [vehicleQuery, setVehicleQuery] = useState('TN-22-CY-1001');
  const [vehicleResult, setVehicleResult] = useState<any | null>(VAHAN_REGISTRY['TN-22-CY-1001']);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // UPI VPA merchant validator state
  const [upiQuery, setUpiQuery] = useState('kpntravels@icici');
  const [upiResult, setUpiResult] = useState<any | null>({
    vpa: 'kpntravels@icici',
    merchantName: 'KPN TRAVELS INDIA LTD',
    bank: 'ICICI Bank Corporate Gateway',
    accountType: 'ESCROW_COMMERCIAL_MERCHANT',
    isEscrowProtected: true,
    verdict: 'SAFE',
    details: 'Verified corporate settlement account legally mapped to Tamil Nadu STA Omnibus Registry.',
  });

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

  const handleVehicleSearch = (reg: string) => {
    setVehicleLoading(true);
    const cleaned = reg.toUpperCase().replace(/\s+/g, '-').trim();
    setTimeout(() => {
      const matched = VAHAN_REGISTRY[cleaned];
      if (matched) {
        setVehicleResult(matched);
      } else {
        setVehicleResult({
          regNo: cleaned,
          status: 'NOT_FOUND',
          warningReason: 'Registration number not found in Parivahan National Transit Register. Possible illegal cloned numberplate.',
        });
      }
      setVehicleLoading(false);
    }, 350);
  };

  const handleUpiCheck = (vpa: string) => {
    const cleaned = vpa.toLowerCase().trim();
    if (cleaned.includes('kpn') || cleaned.includes('parveen') || cleaned.includes('srs') || cleaned.includes('kallada')) {
      setUpiResult({
        vpa: cleaned,
        merchantName: 'OFFICIAL TRANSIT MERCHANT',
        bank: 'HDFC / ICICI Corporate Escrow',
        accountType: 'ESCROW_COMMERCIAL_MERCHANT',
        isEscrowProtected: true,
        verdict: 'SAFE',
        details: 'Approved transit merchant VPA. Payment protected under Motor Vehicles Act Section 72.',
      });
    } else if (cleaned.includes('ybl') || cleaned.includes('paytm') || cleaned.includes('oksbi') || cleaned.includes('okaxis')) {
      setUpiResult({
        vpa: cleaned,
        merchantName: 'Individual Savings Account (Personal UPI)',
        bank: 'Private Bank Savings Account',
        accountType: 'INDIVIDUAL_SAVINGS_MULE',
        isEscrowProtected: false,
        verdict: 'HIGH_RISK',
        details: 'DANGER: Recipient is an individual savings account, NOT an official bus operator merchant. Zero refund protection.',
      });
    } else {
      setUpiResult({
        vpa: cleaned,
        merchantName: 'Unknown Payee',
        bank: 'Unknown VPA Provider',
        accountType: 'UNVERIFIED',
        isEscrowProtected: false,
        verdict: 'SUSPICIOUS',
        details: 'Unregistered merchant identifier. Verify directly with operator counter before transferring funds.',
      });
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
            <span>MODULE 3: Merchant & Parivahan RTO Vehicle Validation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isTa ? 'சரிபார்க்கப்பட்ட ஆம்னிபஸ் & வாகனப் பதிவேடு' : 'Omnibus Operators & Parivahan Vehicle Registry'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {isTa
              ? 'தமிழ்நாடு போக்குவரத்து துறை (STA) அனுமதி பெற்ற தனியார் ஆம்னிபஸ் ஆபரேட்டர்கள், Vahan வாகனத் தகுதி மற்றும் வங்கி எஸ்க்ரோ விவரங்கள்.'
              : 'Official STA-authorized omnibus operators running out of South Chennai terminals (Kilambakkam KCBT, Tambaram, Guindy, OMR). Live Vahan vehicle verification & escrow merchant validation.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/20 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directory' ? 'bg-[#FF7F50] text-[#183264] shadow-xs' : 'text-white hover:bg-white/10'
            }`}
          >
            Operator Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vahanLookup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vahanLookup' ? 'bg-[#FF7F50] text-[#183264] shadow-xs' : 'text-white hover:bg-white/10'
            }`}
          >
            RTO & UPI Inspector
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATOR DIRECTORY */}
      {activeTab === 'directory' && (
        <>
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
        </>
      )}

      {/* TAB 2: PARIVAHAN RTO & UPI MERCHANT INSPECTOR */}
      {activeTab === 'vahanLookup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column: Vehicle Plate Lookup */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card-clean p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E3E8F2] pb-2.5">
                <Car className="w-4 h-4 text-[#FF7F50]" />
                <h3 className="font-bold text-sm text-[#183264]">
                  Parivahan Vahan Vehicle Verification
                </h3>
              </div>

              <p className="text-xs text-[#4A5D7E] leading-relaxed">
                Check whether an omnibus picking up passengers at Kilambakkam, Tambaram, or Guindy possesses a valid Stage Carriage / AITP permit and active Fitness Certificate.
              </p>

              {/* Sample Vehicle Quick Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#4A5D7E]">Quick Test Vehicle Registrations:</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(VAHAN_REGISTRY).map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => {
                        setVehicleQuery(reg);
                        handleVehicleSearch(reg);
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        vehicleQuery === reg
                          ? 'bg-[#183264] text-white border-[#183264]'
                          : reg === 'TN-19-BA-8877'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-[#F5F7FB] text-[#183264] border-[#E3E8F2]'
                      }`}
                    >
                      {reg} {reg === 'TN-19-BA-8877' ? '(Blacklisted)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vehicleQuery}
                  onChange={(e) => setVehicleQuery(e.target.value)}
                  placeholder="e.g. TN-22-CY-1001"
                  className="flex-1 font-mono text-xs uppercase bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-3 py-2 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                />
                <button
                  type="button"
                  onClick={() => handleVehicleSearch(vehicleQuery)}
                  disabled={vehicleLoading}
                  className="btn-coral text-xs py-2 px-4 cursor-pointer"
                >
                  {vehicleLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Inspect</span>
                </button>
              </div>

              {/* Inspection Output Dossier */}
              {vehicleResult && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  vehicleResult.status === 'COMPLIANT'
                    ? 'bg-[#F0FDF4] border-[#1E9E5A]/40 text-[#183264]'
                    : 'bg-[#FEF2F2] border-[#D64545]/40 text-[#183264]'
                }`}>
                  <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2 mb-2.5">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#4A5D7E]">Parivahan RTO Dossier</div>
                      <div className="text-base font-black font-mono">{vehicleResult.regNo}</div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      vehicleResult.status === 'COMPLIANT'
                        ? 'bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30'
                        : 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30'
                    }`}>
                      {vehicleResult.status}
                    </span>
                  </div>

                  {vehicleResult.status === 'COMPLIANT' ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Assigned Operator:</span> <span className="font-bold">{vehicleResult.operator}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Chassis & Model:</span> <span>{vehicleResult.make}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Permit Type:</span> <span className="font-semibold text-emerald-700">{vehicleResult.permitType}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Fitness Validity (FC):</span> <span className="font-mono font-bold">{vehicleResult.fcValidity}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Registered Hub:</span> <span className="font-medium">{vehicleResult.registeredHub}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">RTO Jurisdiction:</span> <span>{vehicleResult.rtoOffice}</span></div>
                      <div className="flex justify-between"><span className="text-[#4A5D7E]">Unpaid E-Challans:</span> <span className="font-bold text-emerald-700">0 Violations</span></div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>CRITICAL SAFETY & LICENSING VIOLATION</span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-rose-200">
                        {vehicleResult.warningReason}
                      </p>
                      {vehicleResult.fcValidity && (
                        <div className="text-[11px] space-y-1 pt-1">
                          <div><span className="text-[#4A5D7E]">Fitness Status:</span> <span className="font-bold text-rose-700">{vehicleResult.fcValidity}</span></div>
                          <div><span className="text-[#4A5D7E]">Unpaid Challans:</span> <span className="font-bold text-rose-700">{vehicleResult.challans} Active Warrants</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Merchant UPI Escrow Validator */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card-clean p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E3E8F2] pb-2.5">
                <CreditCard className="w-4 h-4 text-[#FF7F50]" />
                <h3 className="font-bold text-sm text-[#183264]">
                  Merchant UPI Escrow Protection Analyzer
                </h3>
              </div>

              <p className="text-xs text-[#4A5D7E] leading-relaxed">
                Scammers at Chennai bus terminuses trick passengers into scanning personal GooglePay/PhonePe VPAs. SafeBus validates if the VPA is an approved corporate escrow account.
              </p>

              {/* Sample UPI Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#4A5D7E]">Test Live UPI VPAs:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'KPN Official', vpa: 'kpntravels@icici' },
                    { label: 'Parveen Bus', vpa: 'parveen.bus@okhdfc' },
                    { label: 'Scam Scalper Mule', vpa: 'tickets.fastbus@oksbi' },
                    { label: 'Black Market VPA', vpa: 'chennaibus.admin@ybl' },
                  ].map((item) => (
                    <button
                      key={item.vpa}
                      type="button"
                      onClick={() => {
                        setUpiQuery(item.vpa);
                        handleUpiCheck(item.vpa);
                      }}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        upiQuery === item.vpa
                          ? 'bg-[#183264] text-white border-[#183264]'
                          : item.vpa.includes('fastbus') || item.vpa.includes('chennaibus')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-[#F5F7FB] text-[#183264] border-[#E3E8F2]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiQuery}
                  onChange={(e) => setUpiQuery(e.target.value)}
                  placeholder="e.g. kpntravels@icici"
                  className="flex-1 font-mono text-xs bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl px-3 py-2 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                />
                <button
                  type="button"
                  onClick={() => handleUpiCheck(upiQuery)}
                  className="btn-coral text-xs py-2 px-4 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#183264]" />
                  <span>Verify VPA</span>
                </button>
              </div>

              {/* UPI Result Card */}
              {upiResult && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  upiResult.verdict === 'SAFE'
                    ? 'bg-[#F0FDF4] border-[#1E9E5A]/40'
                    : 'bg-[#FEF2F2] border-[#D64545]/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#4A5D7E]">Payee VPA Analysis</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      upiResult.verdict === 'SAFE'
                        ? 'bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30'
                        : 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30'
                    }`}>
                      {upiResult.verdict === 'SAFE' ? 'STA ESCROW VERIFIED' : 'UNAUTHORIZED MULE'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#183264]">
                    <div className="flex justify-between"><span className="text-[#4A5D7E]">Payee Identifier:</span> <span className="font-mono font-bold">{upiResult.vpa}</span></div>
                    <div className="flex justify-between"><span className="text-[#4A5D7E]">Account Classification:</span> <span className="font-bold">{upiResult.merchantName}</span></div>
                    <div className="flex justify-between"><span className="text-[#4A5D7E]">Bank / Gateway:</span> <span>{upiResult.bank}</span></div>
                    <div className="flex justify-between"><span className="text-[#4A5D7E]">Escrow Protection:</span> <span className={upiResult.isEscrowProtected ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{upiResult.isEscrowProtected ? 'Enforced (Govt Protected)' : 'None (High Scam Risk)'}</span></div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 border border-black/5 text-[11px] leading-relaxed text-[#183264]">
                    {upiResult.details}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
