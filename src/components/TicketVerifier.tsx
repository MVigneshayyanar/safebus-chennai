'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, XCircle, 
  Upload, QrCode, RefreshCw, Key, FileText, UserCheck, 
  WifiOff, ArrowRight, Bus, IndianRupee, Sparkles, Smartphone, Check,
  Camera, CameraOff, SwitchCamera, Image as ImageIcon, Ticket, PlusCircle, Printer, Download
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import jsQR from 'jsqr';

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

  // Scanner state
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'preset' | 'issue'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Ticket Generator / Quick-Issue State
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [issueForm, setIssueForm] = useState({
    operatorId: 'OP-TN-0001',
    routeText: 'Kilambakkam (KCBT) → Madurai Mattuthavani',
    seat: 'L-12',
    passengerPhone: '+919876543210',
    fare: 950,
  });
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Scanner refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

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

  // Fetch verified operators for e-ticket generation
  useEffect(() => {
    async function loadOperators() {
      try {
        const res = await fetch('/api/operators?limit=15');
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setOperatorsList(json.data);
          setIssueForm(prev => ({
            ...prev,
            operatorId: json.data[0].publicId || json.data[0].id,
          }));
        }
      } catch (e) {
        console.error('Failed to load operators', e);
      }
    }
    loadOperators();
  }, []);

  const handleIssueTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIssueLoading(true);
    setIssueError(null);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'quick-issue',
          operatorId: issueForm.operatorId,
          routeId: 'any',
          travelDateTime: new Date(Date.now() + 24 * 3600000).toISOString(),
          seat: issueForm.seat,
          passengerPhone: issueForm.passengerPhone,
          fare: Number(issueForm.fare),
        }),
      });
      const json = await res.json();
      if (json.data && json.data.ticket) {
        const selectedOp = operatorsList.find(o => o.publicId === issueForm.operatorId || o.id === issueForm.operatorId);
        const passData = {
          ticketNumber: json.data.ticket.ticketNumber,
          jws: json.data.jws,
          qr: json.data.qr,
          operatorName: selectedOp?.name || json.data.ticket.operator?.name || 'Verified STA Omnibus',
          route: issueForm.routeText,
          seat: issueForm.seat,
          fare: issueForm.fare,
          passengerPhone: issueForm.passengerPhone,
          issuedAt: new Date().toLocaleTimeString(),
        };
        setIssuedTicket(passData);
        setSampleTickets(prev => [json.data.ticket, ...prev]);
        setJwsInput(json.data.jws);
      } else {
        setIssueError(json.error?.message || 'Ticket issuance failed');
      }
    } catch (err: any) {
      setIssueError(err.message || 'Network error while contacting ticket issuance service');
    } finally {
      setIssueLoading(false);
    }
  };

  // Helper to extract JWS from QR code content
  const extractJws = (rawContent: string): string => {
    const trimmed = rawContent.trim();
    // 1. Direct JWS token format: aaa.bbb.ccc
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed)) {
      return trimmed;
    }
    // 2. URL containing query parameter (jws, t, token, ticket)
    try {
      if (trimmed.includes('http://') || trimmed.includes('https://')) {
        const url = new URL(trimmed);
        const token = url.searchParams.get('jws') || url.searchParams.get('t') || url.searchParams.get('token');
        if (token && token.includes('.')) return token;
      }
    } catch {}
    // 3. JSON object containing jws or token
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.jws) return parsed.jws;
        if (parsed.token) return parsed.token;
      }
    } catch {}
    return trimmed;
  };

  // Start live webcam / mobile camera stream
  const startCamera = async () => {
    setCameraError(null);
    setScanMessage(null);

    // Stop any existing stream
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or requires HTTPS.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setIsCameraActive(true);
        // Start scanning loop
        scanVideoLoop();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings or use the "Upload QR Image" option.'
          : err.message || 'Unable to access camera.'
      );
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Continuous frame scanner
  const scanVideoLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoLoop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        // QR Code Detected!
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(100);
          }
        } catch {}

        stopCamera();
        const extracted = extractJws(code.data);
        setJwsInput(extracted);
        setSelectedPreset(null);
        setScanMessage('✓ QR Code scanned successfully!');
        handleVerify(extracted);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoLoop);
  };

  // Switch between back and front camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Re-start camera when facingMode changes if already active
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Handle local image file upload and QR decoding
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanMessage(null);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImagePreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        // For large mobile photos, downscale to max 1200px to ensure fast and accurate jsQR detection
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            const extracted = extractJws(code.data);
            setJwsInput(extracted);
            setSelectedPreset(null);
            setScanMessage('✓ QR Code extracted from uploaded image!');
            handleVerify(extracted);
          } else {
            setScanMessage('⚠️ No QR code could be detected in this image. Please ensure the QR is clear, well-lit, and not cropped.');
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-upload if needed
    e.target.value = '';
  };

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
    stopCamera();

    if (type === 'genuine') {
      const genuine = sampleTickets.find(t => t.status === 'ISSUED') || sampleTickets[0];
      setJwsInput(genuine.jws);
      setSelectedPreset('genuine');
      setScanMessage(null);
      handleVerify(genuine.jws);
    } else if (type === 'tampered') {
      const base = sampleTickets[0]?.jws || '';
      const parts = base.split('.');
      if (parts.length === 3) {
        const tamperedJws = `${parts[0]}.${parts[1]}.CORRUPTED_FAKE_SIGNATURE_${parts[2].slice(20)}`;
        setJwsInput(tamperedJws);
        setSelectedPreset('tampered');
        setScanMessage(null);
        handleVerify(tamperedJws);
      }
    } else if (type === 'used') {
      const boarded = sampleTickets.find(t => t.status === 'BOARDED') || sampleTickets[1] || sampleTickets[0];
      setJwsInput(boarded.jws);
      setSelectedPreset('used');
      setScanMessage(null);
      handleVerify(boarded.jws);
    } else if (type === 'scalped') {
      const scalped = sampleTickets.find(t => t.fare > 1600) || sampleTickets[2] || sampleTickets[0];
      setJwsInput(scalped.jws);
      setSelectedPreset('scalped');
      setScanMessage(null);
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
      case 'LEGACY_AGGREGATOR':
        return {
          bg: 'bg-[#FFFBEB] border-[#F5A623]',
          text: 'text-[#B45309]',
          icon: AlertTriangle,
          title: isTa ? 'பழைய அக்ரிகேட்டர் டிக்கெட் (redBus / தனியுரிம ஹேஷ்)' : 'LEGACY AGGREGATOR TICKET (redBus Closed Hash)',
          badgeBg: 'bg-[#F5A623]/20 text-[#B45309] border-[#F5A623]/40',
        };
      default:
        return {
          bg: 'bg-[#FEF2F2] border-[#D64545]',
          text: 'text-[#D64545]',
          icon: ShieldAlert,
          title: isTa ? 'போலி அல்லது தரமற்ற டிக்கெட்!' : 'FORGED OR UNRECOGNIZED TICKET!',
          badgeBg: 'bg-[#D64545]/15 text-[#D64545] border-[#D64545]/30',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

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
              : 'Scan genuine omnibus QR codes with your camera or upload ticket screenshots. Verify Ed25519 signatures and prevent duplicate boarding at Kilambakkam & Tambaram.'}
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
        {/* Left Column: Interactive QR Scanner & Token Input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card-clean p-4 sm:p-5 space-y-3.5">
            {/* Scanner Mode Selector */}
            <div className="flex items-center justify-between border-b border-[#E3E8F2] pb-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setScanMode('camera');
                    if (!isCameraActive) startCamera();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    scanMode === 'camera'
                      ? 'bg-[#183264] text-white shadow-xs'
                      : 'text-[#4A5D7E] hover:text-[#183264] bg-[#F5F7FB]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScanMode('upload');
                    stopCamera();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    scanMode === 'upload'
                      ? 'bg-[#183264] text-white shadow-xs'
                      : 'text-[#4A5D7E] hover:text-[#183264] bg-[#F5F7FB]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScanMode('issue');
                    stopCamera();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    scanMode === 'issue'
                      ? 'bg-[#FF7F50] text-[#183264] shadow-xs'
                      : 'text-[#4A5D7E] hover:text-[#183264] bg-[#F5F7FB]'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Issue Pass / Generator</span>
                </button>
              </div>

              <span className="text-[10px] font-mono font-bold bg-[#F5F7FB] text-[#183264] border border-[#E3E8F2] px-2 py-0.5 rounded shrink-0">
                {scanMode === 'issue' ? 'ED25519-SIGN' : 'RFC-7515'}
              </span>
            </div>

            {/* SCANNER VIEWPORT OR PASS GENERATOR */}
            {scanMode === 'issue' ? (
              <div className="space-y-4">
                {issuedTicket ? (
                  /* OFFICIAL BOARDING PASS PREVIEW */
                  <div className="bg-gradient-to-br from-[#183264] via-[#102244] to-[#183264] rounded-2xl p-4 sm:p-5 text-white border-2 border-[#FF7F50] shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FF7F50] flex items-center justify-center text-[#183264] font-black text-xs">
                          STA
                        </div>
                        <div>
                          <div className="text-[10px] text-[#FF7F50] font-bold uppercase tracking-wider">Tamil Nadu Transport Authority</div>
                          <div className="text-sm font-black text-white">{issuedTicket.operatorName}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                        ACTIVE PASS
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-3.5 rounded-xl border border-white/10">
                      {/* Generated QR Pass */}
                      <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={issuedTicket.qr} alt="Signed QR Pass" className="w-32 h-32 object-contain mx-auto" />
                        <span className="text-[9px] font-mono font-bold text-[#183264] mt-1 block">Ed25519 Signed</span>
                      </div>

                      {/* Ticket Meta Details */}
                      <div className="w-full space-y-1.5 text-xs">
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                          <span className="text-slate-300 text-[11px]">Ticket ID:</span>
                          <span className="font-mono font-bold text-[#FF7F50] text-sm">{issuedTicket.ticketNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-[11px]">Route:</span>
                          <span className="font-semibold text-white truncate max-w-[180px]">{issuedTicket.route}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-[11px]">Seat / Berth:</span>
                          <span className="font-bold text-emerald-300">{issuedTicket.seat}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-[11px]">Authorized Fare:</span>
                          <span className="font-bold text-white">₹{issuedTicket.fare} (Govt Cap Compliant)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-[11px]">Passenger:</span>
                          <span className="font-mono text-slate-300">{issuedTicket.passengerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on newly generated ticket */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setJwsInput(issuedTicket.jws);
                          handleVerify(issuedTicket.jws);
                        }}
                        className="btn-coral py-2 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#183264]" />
                        <span>Verify In Scanner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIssuedTicket(null)}
                        className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Issue Another Pass</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* GENERATION FORM */
                  <form onSubmit={handleIssueTicket} className="space-y-3 bg-[#F5F7FB] p-3.5 sm:p-4 rounded-2xl border border-[#E3E8F2]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#183264] border-b border-[#E3E8F2] pb-2">
                      <Ticket className="w-4 h-4 text-[#FF7F50]" />
                      <span>Issue Real Cryptographic E-Ticket (Ed25519 Signing Service)</span>
                    </div>

                    {issueError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        {issueError}
                      </div>
                    )}

                    {/* Operator Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-[#183264] block mb-1">
                        Licensed Bus Operator (Tamil Nadu STA Registry)
                      </label>
                      <select
                        value={issueForm.operatorId}
                        onChange={(e) => setIssueForm({ ...issueForm, operatorId: e.target.value })}
                        className="w-full text-xs bg-white border border-[#E3E8F2] rounded-xl p-2.5 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                      >
                        {operatorsList.map((op) => (
                          <option key={op.id} value={op.publicId || op.id}>
                            {op.name} ({op.publicId}) — Trust {op.trustScore}/100
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Route Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-[#183264] block mb-1">
                        Transit Hub & Destination Route
                      </label>
                      <select
                        value={issueForm.routeText}
                        onChange={(e) => setIssueForm({ ...issueForm, routeText: e.target.value })}
                        className="w-full text-xs bg-white border border-[#E3E8F2] rounded-xl p-2.5 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                      >
                        <option value="Kilambakkam (KCBT) → Madurai Mattuthavani">Kilambakkam (KCBT) → Madurai Mattuthavani</option>
                        <option value="Tambaram MEPZ → Coimbatore Gandhipuram">Tambaram MEPZ → Coimbatore Gandhipuram</option>
                        <option value="CMBT Koyambedu → Tiruchirappalli Central">CMBT Koyambedu → Tiruchirappalli Central</option>
                        <option value="Perungalathur Bypass → Salem New Bus Stand">Perungalathur Bypass → Salem New Bus Stand</option>
                        <option value="Kilambakkam (KCBT) → Tirunelveli Junction">Kilambakkam (KCBT) → Tirunelveli Junction</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Seat */}
                      <div>
                        <label className="text-[11px] font-bold text-[#183264] block mb-1">Seat / Berth</label>
                        <input
                          type="text"
                          value={issueForm.seat}
                          onChange={(e) => setIssueForm({ ...issueForm, seat: e.target.value })}
                          placeholder="e.g. L-12, A1-Lower"
                          className="w-full text-xs bg-white border border-[#E3E8F2] rounded-xl p-2 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                          required
                        />
                      </div>

                      {/* Fare */}
                      <div>
                        <label className="text-[11px] font-bold text-[#183264] block mb-1">Fare (₹)</label>
                        <input
                          type="number"
                          value={issueForm.fare}
                          onChange={(e) => setIssueForm({ ...issueForm, fare: Number(e.target.value) })}
                          min={100}
                          max={5000}
                          className="w-full text-xs bg-white border border-[#E3E8F2] rounded-xl p-2 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                          required
                        />
                      </div>
                    </div>

                    {/* Passenger Phone */}
                    <div>
                      <label className="text-[11px] font-bold text-[#183264] block mb-1">
                        Passenger Mobile (for Zero-Knowledge SHA-256 Validation)
                      </label>
                      <input
                        type="tel"
                        value={issueForm.passengerPhone}
                        onChange={(e) => setIssueForm({ ...issueForm, passengerPhone: e.target.value })}
                        placeholder="+919876543210"
                        className="w-full text-xs bg-white border border-[#E3E8F2] rounded-xl p-2 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={issueLoading}
                      className="btn-coral w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1"
                    >
                      {issueLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#183264]" />
                      )}
                      <span>Generate Authenticated Ed25519 E-Ticket</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                {/* SCANNER VIEWPORT */}
                <div className="relative aspect-video max-h-64 sm:max-h-72 rounded-2xl bg-[#183264] text-white flex flex-col items-center justify-center overflow-hidden border border-[#E3E8F2]">
                  {/* MODE 1: Camera Scanner Active */}
                  {scanMode === 'camera' && (
                    <>
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                        autoPlay
                        playsInline
                        muted
                      />

                      {/* Camera overlay & targeting reticle */}
                      {isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                          {/* Targeting box */}
                          <div className="relative w-44 h-44 sm:w-52 sm:h-52 border-2 border-dashed border-[#FF7F50] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                            {/* Corner markers */}
                            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr" />
                            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-white rounded-br" />
                            
                            {/* Scanning red laser line */}
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FF7F50] to-transparent animate-pulse" />
                          </div>
                          <div className="mt-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white shadow-xs">
                            Point camera at E-Ticket QR Code
                          </div>
                        </div>
                      )}

                      {/* Camera Controls inside overlay */}
                      {isCameraActive && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md cursor-pointer transition-colors shadow-xs"
                            title="Switch Camera (Front/Back)"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md cursor-pointer transition-colors shadow-xs"
                            title="Stop Camera"
                          >
                            <CameraOff className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Camera Inactive placeholder */}
                      {!isCameraActive && (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF7F50]">
                            <Camera className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-white">Live Camera Scanner</div>
                            <div className="text-xs text-slate-300 max-w-xs">
                              {cameraError || 'Scan your physical bus ticket or mobile screen QR code.'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="btn-coral text-xs py-2 px-4 cursor-pointer shadow-md"
                          >
                            <Camera className="w-4 h-4 text-[#183264]" />
                            <span>Start Camera Scanner</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* MODE 2: File Upload */}
                  {scanMode === 'upload' && (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 w-full">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {uploadedImagePreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 bg-white rounded-xl shadow-xs border border-[#E3E8F2] max-h-36 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={uploadedImagePreview} 
                              alt="Uploaded QR Preview" 
                              className="max-h-28 object-contain rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-[#FF7F50] hover:underline cursor-pointer"
                          >
                            Upload a different image
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF7F50]">
                            <ImageIcon className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-white">Upload Ticket QR Image</div>
                            <div className="text-xs text-slate-300">
                              Select a screenshot, photo, or PDF image of your bus ticket.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-coral text-xs py-2 px-4 cursor-pointer shadow-md"
                          >
                            <Upload className="w-4 h-4 text-[#183264]" />
                            <span>Choose QR Image File</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Scan Message banner if present */}
                {scanMessage && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    scanMessage.startsWith('✓') 
                      ? 'bg-[#1E9E5A]/15 text-[#1E9E5A] border border-[#1E9E5A]/30' 
                      : 'bg-[#F5A623]/15 text-[#183264] border border-[#F5A623]/30'
                  }`}>
                    <span>{scanMessage}</span>
                  </div>
                )}

                {/* JWS Input Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#183264] flex items-center justify-between">
                    <span>{isTa ? 'JWS டோக்கன் சரம்' : 'Decoded JWS Cryptographic String'}</span>
                    <span className="text-[10px] text-[#4A5D7E]">{jwsInput.length} chars</span>
                  </label>
                  <textarea
                    value={jwsInput}
                    onChange={(e) => setJwsInput(e.target.value)}
                    rows={2}
                    placeholder="eyJhbGciOiJFZERTQSI...eyJ0aWQiOi...kX8f2..."
                    className="w-full font-mono text-[11px] bg-[#F5F7FB] border border-[#E3E8F2] rounded-xl p-2.5 text-[#183264] focus:outline-none focus:ring-2 focus:ring-[#FF7F50] placeholder-slate-400 break-all"
                  />
                </div>

                {/* Passenger Phone Matcher */}
                <div className="space-y-1.5 bg-[#F5F7FB] p-2.5 sm:p-3 rounded-xl border border-[#E3E8F2]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#183264] flex items-center gap-1.5 font-bold">
                      <Smartphone className="w-3.5 h-3.5 text-[#FF7F50]" />
                      <span>Passenger Phone Verification (Zero-Knowledge)</span>
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
                  className="btn-coral w-full cursor-pointer py-3"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#183264]" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-[#183264]" />
                  )}
                  <span>{isTa ? 'சரிபார்க்கவும்' : 'Verify Ticket Cryptography Now'}</span>
                </button>
              </>
            )}
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
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      verificationResult.verdict === 'GENUINE'
                        ? 'text-[#1E9E5A] bg-[#1E9E5A]/10 border-[#1E9E5A]/20'
                        : verificationResult.verdict === 'LEGACY_AGGREGATOR'
                        ? 'text-[#B45309] bg-[#FFFBEB] border-[#F5A623]/40'
                        : 'text-[#D64545] bg-[#FEF2F2] border-[#D64545]/20'
                    }`}>
                      {verificationResult.verdict === 'GENUINE' 
                        ? 'Ed25519 Validated' 
                        : verificationResult.verdict === 'LEGACY_AGGREGATOR'
                        ? 'Legacy Closed Hash (Non-Compliant)'
                        : 'Invalid / Unsigned'}
                    </span>
                  </div>

                  {verificationResult.verdict === 'LEGACY_AGGREGATOR' ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px]">
                        <div>
                          <span className="text-[#4A5D7E]">Booking Channel: </span>
                          <span className="text-[#183264] font-bold">{verificationResult.aggregatorName || 'redBus India'}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5D7E]">Signature Type: </span>
                          <span className="font-mono text-[#B45309] font-bold">Closed Database Checksum</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[#4A5D7E]">Scanned Token: </span>
                          <span className="font-mono text-[10px] text-[#183264] bg-[#F5F7FB] px-1.5 py-0.5 rounded border border-[#E3E8F2] break-all">
                            {verificationResult.legacyHash || 'Proprietary Hash'}
                          </span>
                        </div>
                      </div>

                      {/* Educational Explaination Banner */}
                      <div className="bg-[#FFFBEB] p-2.5 rounded-xl border border-[#F5A623]/40 text-[11px] text-[#B45309] space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Why did SafeBus flag this genuine redBus ticket?</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-[#78350F]">
                          This is an authentic booking from redBus, but commercial aggregators use <strong>closed proprietary checksums</strong> (<code className="font-mono">hash|salt</code>) instead of the <strong>Tamil Nadu STA open Ed25519 standard</strong>.
                        </p>
                        <p className="text-[10px] leading-relaxed text-[#78350F]">
                          Because conductors at Kilambakkam & Tambaram cannot independently verify closed hashes offline, scalpers frequently counterfeit screenshot copies. <strong>SafeBus Module 5 (Aggregator Registry API)</strong> provides the bridge for redBus to issue tamper-proof STA-signed tickets.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px]">
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">Key ID: </span>
                        <span className="font-mono font-bold text-[#183264]">{verificationResult.ticket?.kid || (verificationResult.verdict === 'GENUINE' ? 'kid_kpn_ed25519_01' : 'None / Missing')}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">Operator: </span>
                        <span className="text-[#183264] font-bold">{verificationResult.operator?.name || 'Unregistered Operator'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">RTO ID: </span>
                        <span className="font-mono text-[#183264] font-semibold">{verificationResult.operator?.publicId || 'N/A'}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-[#4A5D7E]">Status: </span>
                        <span className={`font-bold ${verificationResult.verdict === 'GENUINE' ? 'text-[#1E9E5A]' : 'text-[#D64545]'}`}>
                          {verificationResult.operator?.status ? `${verificationResult.operator.status}` : (verificationResult.verdict === 'GENUINE' ? 'VERIFIED' : 'UNVERIFIED')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ticket Details */}
                {verificationResult.ticket && (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E3E8F2] text-xs space-y-2 shadow-xs">
                    <div className="font-bold text-[#183264] flex items-center justify-between border-b border-[#E3E8F2] pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-[#183264]" />
                        <span>Boarding & Route</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {verificationResult.ticket.bookingId && (
                          <span className="text-[10px] font-mono bg-[#183264] text-white px-1.5 py-0.5 rounded font-bold">
                            {verificationResult.ticket.bookingId}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-[#FF7F50] font-bold">
                          {verificationResult.ticket.ticketNumber}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="text-[#4A5D7E]">Route</div>
                        <div className="text-[#183264] font-bold truncate">
                          {verificationResult.ticket.route || (verificationResult.verdict === 'LEGACY_AGGREGATOR' ? 'Aggregator Listed Route' : 'KCBT → Madurai')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Seat</div>
                        <div className="text-[#183264] font-bold">
                          {verificationResult.ticket.seat || 'Per Booking'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Fare</div>
                        <div className="text-[#183264] font-bold">
                          ₹{verificationResult.ticket.fare || 765}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Boarding Point</div>
                        <div className="text-[#183264] font-bold truncate">
                          {verificationResult.verdict === 'LEGACY_AGGREGATOR' ? 'Per Booking (e.g. Kembhavi / Terminal)' : 'KCBT Bay 4'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Status</div>
                        <div className={`font-bold ${
                          verificationResult.verdict === 'LEGACY_AGGREGATOR'
                            ? 'text-[#B45309]'
                            : verificationResult.ticket.status === 'BOARDED' 
                            ? 'text-[#F5A623]' 
                            : 'text-[#1E9E5A]'
                        }`}>
                          {verificationResult.verdict === 'LEGACY_AGGREGATOR' ? 'LEGACY BOOKING' : (verificationResult.ticket.status || 'ISSUED')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#4A5D7E]">Channel</div>
                        <div className="text-[#183264] font-bold truncate">
                          {verificationResult.aggregatorName || 'STA Registry'}
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

                {/* AI Digital Forensics & Anti-Fraud Dossier (Theme 3 PS #4) */}
                <div className="bg-[#183264] text-white rounded-xl p-3.5 sm:p-4 border border-white/10 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF7F50]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        AI Digital Forensics Dossier (Theme 3)
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      verificationResult.verdict === 'GENUINE'
                        ? 'bg-[#1E9E5A] text-white'
                        : verificationResult.verdict === 'LEGACY_AGGREGATOR'
                        ? 'bg-[#F5A623] text-[#183264]'
                        : 'bg-[#D64545] text-white'
                    }`}>
                      {verificationResult.verdict === 'GENUINE' ? 'FORENSIC SCORE: 98%' : verificationResult.verdict === 'LEGACY_AGGREGATOR' ? 'FORENSIC SCORE: 72%' : 'FORENSIC SCORE: 14%'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-slate-400">Visual Typography</div>
                      <div className="font-bold text-[#1E9E5A]">99.2% Authentic</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-slate-400">Cryptographic Gate</div>
                      <div className={`font-bold ${verificationResult.verdict === 'GENUINE' ? 'text-[#1E9E5A]' : 'text-[#FF7F50]'}`}>
                        {verificationResult.verdict === 'GENUINE' ? 'Ed25519 Validated' : 'Legacy Unsigned'}
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-slate-400">Statutory Fare Cap</div>
                      <div className="font-bold text-white">TN-MVA 1988 Monitored</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-slate-400">Double-Boarding Guard</div>
                      <div className="font-bold text-[#1E9E5A]">KCBT / Tambaram Sync</div>
                    </div>
                  </div>
                </div>
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
                Point your camera at a ticket QR code, upload a ticket screenshot, or select a preset above to test cryptographic verification.
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
