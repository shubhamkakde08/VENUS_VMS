import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Shield, QrCode, Camera, Printer, CheckCircle2, 
  AlertTriangle, UserCheck, Car, Package, Clock, 
  Download, Search, Sparkles, ArrowRight, X, ExternalLink,
  Upload, Eye, FileText, Image, RefreshCw, FileSpreadsheet,
  LayoutGrid, List, Phone, MapPin, Building, Copy, Database,
  Plus, ArrowLeft, Activity, CheckCircle
} from 'lucide-react';
import { vmsEngine } from '../../services/vmsEngine';
import { VenusGatePass, FieldConfigItem } from '../../types';
import { GatePassReportModal } from '../reports/GatePassReportModal';
import { CameraCaptureModal } from '../common/CameraCaptureModal';


interface SecurityGuardConsoleProps {
  onOpenPrintBadge: (pass: VenusGatePass) => void;
}

export const SecurityGuardConsole: React.FC<SecurityGuardConsoleProps> = ({ onOpenPrintBadge }) => {
  const [passes, setPasses] = useState<VenusGatePass[]>(vmsEngine.getPasses());
  const [fields, setFields] = useState<FieldConfigItem[]>(vmsEngine.getFields());
  const currentUser = vmsEngine.getCurrentUser();
  const logoConfig = vmsEngine.getLogoConfig();

  // Console View Tab: Default is 'DASHBOARD' when user logs in (NOT direct entry form)
  const [consoleTab, setConsoleTab] = useState<'DASHBOARD' | 'DIRECT_ENTRY' | 'EXIT_SCANNER'>('DASHBOARD');

  // Next Pass ID
  const [nextPassId, setNextPassId] = useState(vmsEngine.generateNextGatePassId());
  const dateKey = vmsEngine.getSystemDateKey();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Dashboard Live Metrics
  const activeInside = passes.filter(p => p.status === 'INSIDE').length;
  const todayPassesCount = passes.filter(p => p.dateKey === dateKey || p.checkIn?.startsWith(new Date().toISOString().slice(0, 10))).length;
  const vehiclesInside = passes.filter(p => p.status === 'INSIDE' && p.vehicle && p.vehicle !== 'None' && p.vehicle.trim() !== '').length;
  const preRegExpected = passes.filter(p => p.isPreRegistered && (p.status === 'PRE_REGISTERED' || p.status === 'SCHEDULED')).length;
  const highRiskCount = passes.filter(p => p.aiRiskScore === 'HIGH' && p.status === 'INSIDE').length;

  // Form State
  const [visitorName, setVisitorName] = useState('Anand K. Verma');
  const [visitorPhone, setVisitorPhone] = useState('+91 98251 44521');
  const [company, setCompany] = useState('Jindal Stainless Steel Ltd');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('8899-1122-3344');
  const [category, setCategory] = useState('Vendor / Supplier');
  const [hostName, setHostName] = useState('Er. Jayesh Patel');
  const [purpose, setPurpose] = useState('Coil Slitting & Heat Treatment Inspection');
  const [accessZone, setAccessZone] = useState('Seamless Pipes Mill Floor');
  const [vehicleNo, setVehicleNo] = useState('GJ 12 AB 9988');
  const [assets, setAssets] = useState('Surface Hardness Tester #HT-88');
  
  // Photos: Visitor, Vehicle, Assets
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=300&q=80');
  const [assetsPhotoUrl, setAssetsPhotoUrl] = useState('');

  // Browser Camera API Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTargetPass, setCameraTargetPass] = useState<{ passId: string; name: string } | null>(null);

  // Custom Fields Dynamic Values
  const [customValues, setCustomValues] = useState<Record<string, any>>({});


  // File Input References
  const visitorFileInputRef = useRef<HTMLInputElement | null>(null);
  const vehicleFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetsFileInputRef = useRef<HTMLInputElement | null>(null);

  // Photo Preview Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  const [ppeHelmet, setPpeHelmet] = useState(true);
  const [ppeVest, setPpeVest] = useState(true);
  const [ppeShoes, setPpeShoes] = useState(true);

  // Fast Exit Scanner
  const [quickExitInput, setQuickExitInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertFeedback, setAlertFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Preview QR Canvas
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = vmsEngine.subscribe(() => {
      setPasses([...vmsEngine.getPasses()]);
      setFields([...vmsEngine.getFields()]);
      setNextPassId(vmsEngine.generateNextGatePassId());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        `VENUS_VMS:${nextPassId}|${visitorName}|HOST:${hostName}`,
        { width: 72, margin: 1, color: { dark: '#1C2E63', light: '#ffffff' } },
        (err) => { if (err) console.error(err); }
      );
    }
  }, [nextPassId, visitorName, hostName]);

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertFeedback({ text, type });
    setTimeout(() => setAlertFeedback(null), 4000);
  };

  const isFieldMandatory = (id: string) => fields.find(f => f.id === id)?.state === 'MANDATORY';
  const isFieldDisabled = (id: string) => fields.find(f => f.id === id)?.state === 'DISABLED';

  // Photo File Handlers
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('File is larger than 5MB. Please upload an image under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        showAlert(`${fieldName} uploaded successfully.`, 'success');
      }
    };
    reader.onerror = () => {
      showAlert(`Failed to read image file.`, 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce dynamic mandatory checks from admin panel (including custom fields)
    for (const fc of fields) {
      if (fc.state === 'MANDATORY') {
        let val: any = '';
        if (fc.id === 'visitorName') val = visitorName;
        else if (fc.id === 'visitorPhone') val = visitorPhone;
        else if (fc.id === 'company') val = company;
        else if (fc.id === 'idType') val = idType;
        else if (fc.id === 'idNumber') val = idNumber;
        else if (fc.id === 'category') val = category;
        else if (fc.id === 'hostName') val = hostName;
        else if (fc.id === 'purpose') val = purpose;
        else if (fc.id === 'accessZone') val = accessZone;
        else if (fc.id === 'vehicleNo') val = vehicleNo;
        else if (fc.id === 'assets') val = assets;
        else if (fc.id === 'photo') val = photoUrl;
        else if (fc.id === 'vehiclePhoto') val = vehiclePhotoUrl;
        else if (fc.id === 'assetsPhoto') val = assetsPhotoUrl;
        else if (fc.isCustom) val = customValues[fc.id];

        if (!val || (typeof val === 'string' && !val.trim())) {
          showAlert(`Field '${fc.label}' is configured as MANDATORY in Admin Panel. Please fill in.`, 'error');
          return;
        }
      }
    }

    const created = vmsEngine.createGatePass({
      name: visitorName.trim(),
      phone: visitorPhone.trim(),
      company: company.trim(),
      idType,
      idNumber: idNumber.trim(),
      category,
      hostName,
      purpose: purpose.trim(),
      accessZone,
      vehicle: vehicleNo.trim() || 'None',
      assets: assets.trim() || 'None',
      guardUser: currentUser.username,
      checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'INSIDE',
      photo: photoUrl,
      vehiclePhoto: vehiclePhotoUrl || undefined,
      assetsPhoto: assetsPhotoUrl || undefined,
      customValues: Object.keys(customValues).length > 0 ? customValues : undefined,
      ppe_helmet: ppeHelmet,
      ppe_vest: ppeVest,
      ppe_shoes: ppeShoes
    });

    setVisitorName('');
    setVisitorPhone('');
    setCompany('');
    setIdNumber('');
    setPurpose('');
    setVehicleNo('');
    setAssets('');
    setPhotoUrl('');
    setVehiclePhotoUrl('');
    setAssetsPhotoUrl('');
    setCustomValues({});
    setNextPassId(vmsEngine.peekNextGatePassId());

    showAlert(`Gate Pass #${created.passId} issued successfully! Opening badge dispatch...`, 'success');
    onOpenPrintBadge(created);
  };

  const handleQuickExit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickExitInput.trim()) {
      showAlert('Enter Pass ID to checkout (e.g. GP141026-001)', 'error');
      return;
    }
    const res = vmsEngine.checkOutGatePass(quickExitInput.trim());
    if (res.success) {
      showAlert(res.message, 'success');
      setQuickExitInput('');
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleOpenLiveCamera = (targetPassId?: string, targetName?: string) => {
    if (targetPassId && targetName) {
      setCameraTargetPass({ passId: targetPassId, name: targetName });
    } else {
      setCameraTargetPass(null);
    }
    setIsCameraModalOpen(true);
  };

  const handleCameraPhotoCaptured = (capturedDataUrl: string) => {
    if (cameraTargetPass) {
      // Directly update existing pass in MySQL database
      const res = vmsEngine.storeProfilePhoto(
        cameraTargetPass.passId,
        capturedDataUrl,
        'PORTRAIT',
        'BROWSER_CAMERA_API'
      );
      if (res.success) {
        showAlert(`Live profile photo captured & saved directly to MySQL database for Pass #${cameraTargetPass.passId}!`, 'success');
        setPasses(vmsEngine.getPasses());
      } else {
        showAlert('Failed to update photo in database.', 'error');
      }
    } else {
      // Set for newly issued gate pass
      setPhotoUrl(capturedDataUrl);
      showAlert('Visitor profile photo captured via Browser Camera API! Stored directly to MySQL backend on pass issuance.', 'success');
    }
  };


  const handleExportCSV = () => {
    let csv = 'Pass ID,Visitor Name,Phone,Company,Host Employee,Purpose,Zone,Check-In Time,Status\n';
    passes.forEach(p => {
      csv += `"${p.passId}","${p.name}","${p.phone}","${p.company}","${p.hostName}","${p.purpose}","${p.accessZone}","${p.checkIn}","${p.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VenusPipes_GateRegister_${dateKey}.csv`;
    a.click();
    showAlert('Daily gate register CSV exported.', 'success');
  };

  const filteredPasses = passes.filter(p => 
    p.passId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-lg transition-all ${
          alertFeedback.type === 'success' 
            ? 'bg-emerald-600 text-white font-semibold' 
            : alertFeedback.type === 'error'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-blue-600 text-white font-semibold'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{alertFeedback.text}</span>
          </div>
          <button onClick={() => setAlertFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Executive Security Console Header & Segmented Tab Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Bhuj Manufacturing Facility &bull; Security Desks 01 & 02
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1C2E63] dark:text-blue-400" />
            <span>Gate Operations & Security Console</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time identity verification, sequential GP gate passes, and perimeter surveillance.
          </p>
        </div>

        {/* Console View Tabs: Dashboard (Default on Login) vs Direct Entry Form vs Fast Exit */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setConsoleTab('DASHBOARD')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              consoleTab === 'DASHBOARD'
                ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Operations Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setConsoleTab('DIRECT_ENTRY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              consoleTab === 'DIRECT_ENTRY'
                ? 'bg-[#1C2E63] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Spot Pass (Direct Entry)</span>
          </button>

          <button
            type="button"
            onClick={() => setConsoleTab('EXIT_SCANNER')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              consoleTab === 'EXIT_SCANNER'
                ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-rose-500" />
            <span>Fast Check-Out</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: OPERATIONS DASHBOARD (DEFAULT ON USER LOGIN) */}
      {consoleTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Active Inside */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Inside Plant
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeInside}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Visitors</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                Active inside facility floors
              </div>
            </div>

            {/* Card 2: Today's Passes */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Passes Today
                </span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1C2E63] dark:text-blue-400 font-mono">
                  {todayPassesCount}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Issued</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                Next: {nextPassId}
              </div>
            </div>

            {/* Card 3: Vehicles on Premises */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vehicles Inside
                </span>
                <Car className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {vehiclesInside}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Vehicles</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Commercial & logistics transport
              </div>
            </div>

            {/* Card 4: Pre-Registered Expected */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pre-Registered
                </span>
                <UserCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {preRegExpected}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Expected</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Scheduled arrival slots
              </div>
            </div>

            {/* Card 5: Safety Compliance */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  PPE Compliance
                </span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  100%
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  VERIFIED
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Helmets, Vests & Shoes Checked
              </div>
            </div>
          </div>

          {/* Quick Operations Action Bar */}
          <div className="bg-gradient-to-r from-[#1C2E63] via-[#152146] to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                  PERIMETER ACTIVE
                </span>
                <span className="text-xs text-slate-300 font-medium">Logged in: {currentUser.username} ({currentUser.role})</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Plant Visitor Security & Gate Access Hub
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Select an operation below to issue new physical badges, manage visitor arrivals, or log fast checkouts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConsoleTab('DIRECT_ENTRY')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Spot Pass (Direct Entry Form)</span>
              </button>

              <button
                type="button"
                onClick={() => setConsoleTab('EXIT_SCANNER')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-rose-400" />
                <span>Fast Check-Out</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Shift Report</span>
              </button>
            </div>
          </div>

          {/* Inline Fast Check-Out Tool on Dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Quick Gate Check-Out Station
                </h4>
                <p className="text-[11px] text-slate-500">
                  Enter or scan any Gate Pass ID to immediately log visitor checkout and release badge.
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickExit} className="flex gap-2 max-w-sm w-full">
              <input
                type="text"
                value={quickExitInput}
                onChange={e => setQuickExitInput(e.target.value)}
                placeholder="e.g. GP261014-001"
                className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-[#1C2E63] bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition"
              >
                Check-Out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: DIRECT SPOT PASS ENTRY FORM (OPENED ONLY WHEN CLICKED) */}
      {consoleTab === 'DIRECT_ENTRY' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setConsoleTab('DASHBOARD')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Operations Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">Next Sequential ID:</span>
              <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                {nextPassId}
              </span>
            </div>
          </div>

          {/* Main Grid: Entry Form (Left 8 cols) & Live Badge (Right 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Gate Pass Entry Form */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1C2E63] to-[#2A5BB5] px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Visitor Gate Pass Entry</h3>
                <p className="text-[11px] text-slate-300">Mandatory fields enforced by Admin Master</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-300 block font-semibold uppercase tracking-wider">Pass Sequence</span>
              <span className="text-xs font-mono font-bold bg-white/20 text-emerald-300 px-2.5 py-0.5 rounded border border-white/30">
                {nextPassId}
              </span>
            </div>
          </div>

          <form onSubmit={handleCreatePass} className="p-6 space-y-6 text-xs">
            {/* Section 1: Identification */}
            <div>
              <h4 className="text-xs font-bold text-[#1C2E63] dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300 inline-flex items-center justify-center text-[10px] mr-2 font-bold">1</span>
                Visitor Information & Identification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {!isFieldDisabled('visitorName') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Full Legal Name {isFieldMandatory('visitorName') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldMandatory('visitorName')}
                      value={visitorName}
                      onChange={e => setVisitorName(e.target.value)}
                      placeholder="e.g. Anand K. Verma"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {!isFieldDisabled('visitorPhone') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Phone Number {isFieldMandatory('visitorPhone') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      required={isFieldMandatory('visitorPhone')}
                      value={visitorPhone}
                      onChange={e => setVisitorPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {!isFieldDisabled('company') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Visitor Company {isFieldMandatory('company') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldMandatory('company')}
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Jindal Stainless / L&T"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {!isFieldDisabled('idType') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ID Proof Type {isFieldMandatory('idType') && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={idType}
                      onChange={e => setIdType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Passport">Passport</option>
                      <option value="Company ID">Vendor Company ID Card</option>
                    </select>
                  </div>
                )}

                {!isFieldDisabled('idNumber') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ID Card Number {isFieldMandatory('idNumber') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldMandatory('idNumber')}
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder="XXXX-XXXX-9912"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {!isFieldDisabled('category') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Visitor Category {isFieldMandatory('category') && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    >
                      <option value="Vendor / Supplier">Vendor / Supplier</option>
                      <option value="Customer / Client">Customer / Inspection Agency</option>
                      <option value="Transporter Driver">Transporter / Inward Driver</option>
                      <option value="Machinery Contractor">Machinery Contractor</option>
                      <option value="Official Auditor">Statutory Auditor</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Host & Routing */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-[#1C2E63] dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300 inline-flex items-center justify-center text-[10px] mr-2 font-bold">2</span>
                Venus Host Employee & Destination Zone
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {!isFieldDisabled('hostName') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Internal Host Employee {isFieldMandatory('hostName') && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={hostName}
                      onChange={e => setHostName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    >
                      <option value="Er. Jayesh Patel">Er. Jayesh Patel (Seamless Pipes)</option>
                      <option value="Dr. K. S. Varma">Dr. K. S. Varma (QA / NDT Lab)</option>
                      <option value="Priya Sharma">Priya Sharma (HR & Admin)</option>
                      <option value="Sanjay Joshi">Sanjay Joshi (Logistics & Yard)</option>
                      <option value="Shubham Kakde">Shubham Kakde (IT Admin)</option>
                    </select>
                  </div>
                )}

                {!isFieldDisabled('purpose') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Purpose of Visit {isFieldMandatory('purpose') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={isFieldMandatory('purpose')}
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      placeholder="Mill Roll Inspection / Material Supply"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    />
                  </div>
                )}

                {!isFieldDisabled('accessZone') && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Permitted Zone {isFieldMandatory('accessZone') && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={accessZone}
                      onChange={e => setAccessZone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1C2E63] dark:focus:ring-blue-500"
                    >
                      <option value="Admin & Board Room">Admin & Conference Block Only</option>
                      <option value="Seamless Pipes Mill Floor">Seamless Pipes Mill Floor</option>
                      <option value="Welded Tubes Mill Floor">Welded Tubes Mill Floor</option>
                      <option value="NDT & Hydro Testing Lab">NDT & Hydro Testing Lab</option>
                      <option value="Heavy Yard & Loading Bay">Heavy Yard & Loading Bay</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden File Inputs for High-Res Gate Photo Uploads */}
            <input
              type="file"
              ref={visitorFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => handlePhotoFileUpload(e, setPhotoUrl, 'Visitor Portrait')}
            />
            <input
              type="file"
              ref={vehicleFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => handlePhotoFileUpload(e, setVehiclePhotoUrl, 'Vehicle & Plate Photo')}
            />
            <input
              type="file"
              ref={assetsFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => handlePhotoFileUpload(e, setAssetsPhotoUrl, 'Material Challan Photo')}
            />

            {/* Section 3: Safety Screening, Vehicle & Photo */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-[#1C2E63] dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300 inline-flex items-center justify-center text-[10px] mr-2 font-bold">3</span>
                  Security Screening, Vehicle & Photo
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  Direct camera & file upload enabled
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. VISITOR PHOTO UPLOAD & WEBCAM */}
                {!isFieldDisabled('photo') && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                          Visitor Portrait {isFieldMandatory('photo') && <span className="text-red-500">*</span>}
                        </label>
                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ url: photoUrl, title: `Visitor: ${visitorName}` })}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Zoom</span>
                          </button>
                        )}
                      </div>

                      {/* Photo Thumbnail */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0 relative">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-6 h-6 text-slate-400 m-auto mt-4" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Live Identity Capture</p>
                          <p>PNG / JPG up to 5MB</p>
                          {photoUrl && <p className="text-emerald-600 font-bold">Photo Attached &bull; Ready</p>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => visitorFileInputRef.current?.click()}
                        className="px-2 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Upload className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenLiveCamera()}
                        className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition shadow-xs"
                        title="Capture Visitor Portrait via Browser Camera API"
                      >
                        <Camera className="w-3 h-3 text-white" />
                        <span>Capture Photo</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. VEHICLE PLATE & VEHICLE PHOTO UPLOAD */}
                {!isFieldDisabled('vehicleNo') && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                          Vehicle Plate # {isFieldMandatory('vehicleNo') && <span className="text-red-500">*</span>}
                        </label>
                        {vehiclePhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ url: vehiclePhotoUrl, title: `Vehicle: ${vehicleNo}` })}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Plate Zoom</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required={isFieldMandatory('vehicleNo')}
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value)}
                        placeholder="GJ 12 AB 9988"
                        className="w-full mb-2 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono uppercase outline-none focus:ring-1 focus:ring-[#1C2E63]"
                      />

                      {/* Vehicle Photo Thumbnail */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0 relative">
                          {vehiclePhotoUrl ? (
                            <img src={vehiclePhotoUrl} alt="Vehicle" className="w-full h-full object-cover" />
                          ) : (
                            <Car className="w-5 h-5 text-slate-400 m-auto mt-2" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {vehiclePhotoUrl ? (
                            <span className="text-emerald-600 font-bold block">Vehicle Photo Attached</span>
                          ) : (
                            <span className="text-slate-400 block">No vehicle photo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => vehicleFileInputRef.current?.click()}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Car className="w-3 h-3 text-amber-500" />
                        <span>Upload Vehicle Photo</span>
                      </button>
                      {vehiclePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setVehiclePhotoUrl('')}
                          className="px-2 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-[10px] font-bold border border-rose-200 dark:border-rose-800"
                          title="Remove vehicle photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. ASSETS & CHALLAN PHOTO UPLOAD */}
                {!isFieldDisabled('assets') && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                          Material / Assets Carried {isFieldMandatory('assets') && <span className="text-red-500">*</span>}
                        </label>
                        {assetsPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ url: assetsPhotoUrl, title: `Assets: ${assets}` })}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Challan</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required={isFieldMandatory('assets')}
                        value={assets}
                        onChange={e => setAssets(e.target.value)}
                        placeholder="Dell Laptop #SN-9981 / NDT Gauge"
                        className="w-full mb-2 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#1C2E63]"
                      />

                      {/* Assets Photo Thumbnail */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0 relative">
                          {assetsPhotoUrl ? (
                            <img src={assetsPhotoUrl} alt="Challan" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400 m-auto mt-2" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {assetsPhotoUrl ? (
                            <span className="text-emerald-600 font-bold block">Challan Attached</span>
                          ) : (
                            <span className="text-slate-400 block">Optional doc photo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => assetsFileInputRef.current?.click()}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <FileText className="w-3 h-3 text-emerald-500" />
                        <span>Upload Challan Photo</span>
                      </button>
                      {assetsPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setAssetsPhotoUrl('')}
                          className="px-2 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-[10px] font-bold border border-rose-200 dark:border-rose-800"
                          title="Remove challan photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* DYNAMIC CUSTOM FIELDS SECTION (Automatically synced from Admin Custom Fields Master) */}
              {fields.filter(f => f.isCustom && f.state !== 'DISABLED').length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dynamic Custom Fields (Admin Configured):</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {fields.filter(f => f.isCustom && f.state !== 'DISABLED').map(cf => (
                      <div key={cf.id} className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {cf.label} {cf.state === 'MANDATORY' && <span className="text-red-500">*</span>}
                        </label>

                        {cf.fieldType === 'select' ? (
                          <select
                            value={customValues[cf.id] || cf.defaultValue || ''}
                            onChange={e => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 outline-none"
                          >
                            <option value="">-- Select Option --</option>
                            {(cf.options || ['Standard', 'Special', 'Restricted']).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : cf.fieldType === 'checkbox' ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer mt-1 text-xs">
                            <input
                              type="checkbox"
                              checked={Boolean(customValues[cf.id])}
                              onChange={e => setCustomValues({ ...customValues, [cf.id]: e.target.checked })}
                              className="w-4 h-4 rounded text-[#1C2E63]"
                            />
                            <span>{cf.placeholder || 'Yes / Acknowledged'}</span>
                          </label>
                        ) : (
                          <input
                            type={cf.fieldType === 'number' ? 'number' : cf.fieldType === 'date' ? 'date' : 'text'}
                            value={customValues[cf.id] || ''}
                            onChange={e => setCustomValues({ ...customValues, [cf.id]: e.target.value })}
                            placeholder={cf.placeholder || `Enter ${cf.label}...`}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPE Safety Checkboxes */}
              <div className="mt-4 flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Safety Gear (PPE) Verified:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ppeHelmet}
                    onChange={e => setPpeHelmet(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1C2E63]"
                  />
                  <span>Safety Helmet</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ppeVest}
                    onChange={e => setPpeVest(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1C2E63]"
                  />
                  <span>Hi-Vis Reflective Vest</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ppeShoes}
                    onChange={e => setPpeShoes(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1C2E63]"
                  />
                  <span>Steel-Toe Safety Shoes</span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#1C2E63] dark:text-blue-400" />
                <span>Verified by Security Officer: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentUser.username}</strong></span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#1C2E63] hover:bg-[#152146] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition"
              >
                <span>ISSUE GATE PASS & BADGE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right 4 Cols: Real-time Badge Preview & Fast Exit Checkout */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Badge Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Real-time Badge Card
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                LIVE PREVIEW
              </span>
            </div>

            {/* Badge Card Mockup */}
            <div className="rounded-xl border-2 border-[#1C2E63] overflow-hidden bg-white text-slate-900 shadow-md">
              <div 
                className="p-3 text-center text-white"
                style={{ backgroundColor: logoConfig.primaryColor || '#1C2E63' }}
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-200">
                  {logoConfig.companyName}
                </div>
                <div className="text-xs font-extrabold text-amber-300 tracking-wider">
                  OFFICIAL VISITOR PASS
                </div>
                <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                  {nextPassId}
                </div>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <img
                  src={photoUrl}
                  alt="Visitor"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 mb-2 shadow-sm"
                />
                <div className="font-extrabold text-slate-900 text-sm">{visitorName}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">{company}</div>

                <div className="w-full mt-3 grid grid-cols-2 gap-2 text-left bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">HOST:</span>
                    <span className="font-bold text-slate-800 truncate block">{hostName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">ZONE:</span>
                    <span className="font-bold text-slate-800 truncate block">{accessZone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">DATE:</span>
                    <span className="font-mono text-slate-700">{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">SECURITY:</span>
                    <span className="text-emerald-700 font-bold font-mono">{currentUser.username}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-100">
                  <canvas ref={qrCanvasRef} className="rounded" />
                  <div className="text-right">
                    <div className="w-20 h-4 barcode-lines" />
                    <span className="text-[8px] font-mono text-slate-400 uppercase">SYS-AUTH-PASS</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-center py-1.5 text-[8px] text-slate-300 font-mono tracking-wider">
                SURRENDER BADGE AT MAIN EXIT
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const dummy: VenusGatePass = {
                  passId: nextPassId,
                  dateKey,
                  seqNumber: 99,
                  name: visitorName,
                  phone: visitorPhone,
                  company,
                  idType,
                  idNumber,
                  category,
                  hostName,
                  purpose,
                  accessZone,
                  vehicle: vehicleNo,
                  assets,
                  guardUser: currentUser.username,
                  checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                  status: 'INSIDE',
                  photo: photoUrl,
                  ppe_helmet: ppeHelmet,
                  ppe_vest: ppeVest,
                  ppe_shoes: ppeShoes,
                  createdAt: new Date().toISOString()
                };
                onOpenPrintBadge(dummy);
              }}
              className="w-full mt-4 py-2 bg-slate-900 hover:bg-[#1C2E63] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Preview Badge</span>
            </button>
          </div>

          {/* Fast Exit Checkout Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#1C2E63] dark:text-blue-400" />
              <span>Fast Check-Out Scanner</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Scan pass barcode or type Pass ID to log departure and surrender.
            </p>
            <form onSubmit={handleQuickExit} className="flex gap-2">
              <input
                type="text"
                value={quickExitInput}
                onChange={e => setQuickExitInput(e.target.value)}
                placeholder="e.g. GP141026-001"
                className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-[#1C2E63] bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
              >
                Check-Out
              </button>
            </form>
          </div>

        </div>

      </div>
        </div>
      )}

      {/* VIEW 3: FAST CHECK-OUT SCANNER STATION */}
      {consoleTab === 'EXIT_SCANNER' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setConsoleTab('DASHBOARD')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Operations Dashboard</span>
            </button>

            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <QrCode className="w-4 h-4" /> Fast Departure Gate Terminal
            </span>
          </div>

          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Visitor Badge Departure & Surrender
              </h3>
              <p className="text-xs text-slate-500">
                Type the visitor's Pass ID or scan barcode token to log physical exit from Venus Bhuj Plant premises.
              </p>
            </div>

            <form onSubmit={handleQuickExit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ENTER GATE PASS NUMBER:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={quickExitInput}
                  onChange={e => setQuickExitInput(e.target.value)}
                  placeholder="e.g. GP261014-001 or GP141026-001"
                  className="w-full text-sm font-mono uppercase px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#1C2E63] bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-900/20"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRM EXIT & SURRENDER PASS</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase">
                Currently Inside ({activeInside} visitors):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {passes.filter(p => p.status === 'INSIDE').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No visitors currently inside.</p>
                ) : (
                  passes.filter(p => p.status === 'INSIDE').map(p => (
                    <div key={p.passId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.passId}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const res = vmsEngine.checkOutGatePass(p.passId);
                          if (res.success) {
                            showAlert(res.message, 'success');
                            setPasses(vmsEngine.getPasses());
                          }
                        }}
                        className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Check-Out
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live In-Campus Visitors Register (Rendered on Operations Dashboard) */}
      {consoleTab === 'DASHBOARD' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Controls Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>In-Campus Visitor Logs (Live Gate Register)</span>
            </h3>
            <p className="text-xs text-slate-500">Live personnel inside plant premises synced with Guard & HR desks.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter Name, ID, Company..."
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg outline-none w-full sm:w-52 focus:ring-1 focus:ring-[#1C2E63] bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            {/* View Switcher: Cards vs Table */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="Card View (Optimized for Mobile)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
                title="Table View (Full Data Ledger)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Open Visitor Shift Report Modal */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-3 py-1.5 bg-[#1C2E63] hover:bg-[#152146] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Generate clean Visitor Shift Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visitor Report</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#1C2E63] dark:text-blue-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {/* Card View (Super clean on mobile screens) */}
        {viewMode === 'cards' ? (
          <div className="p-3 sm:p-5">
            {filteredPasses.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No visitor passes match your search criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredPasses.map(p => (
                  <div 
                    key={p.passId}
                    className="bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#1C2E63] dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {p.passId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {p.aiRiskScore && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              p.aiRiskScore === 'HIGH' 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              Risk: {p.aiRiskScore}
                            </span>
                          )}
                          {p.status === 'INSIDE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>INSIDE</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                              OUT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visitor Core Info */}
                      <div className="flex items-start gap-3">
                        <img 
                          src={p.photo} 
                          alt="" 
                          onClick={() => setPreviewPhoto({ url: p.photo, title: `Visitor Portrait: ${p.name}` })}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-300 cursor-pointer hover:opacity-85 shrink-0 shadow-xs" 
                          title="Click to view full portrait"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {p.name}
                          </h4>
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {p.company}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.phone}
                          </div>
                        </div>
                      </div>

                      {/* Detail Metrics Grid */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Host Employee</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{p.hostName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Access Zone</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{p.accessZone}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Check-In Time</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{p.checkIn}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Departure</span>
                          <span className="font-mono text-slate-500">{p.checkOut || 'Active In-Plant'}</span>
                        </div>
                      </div>

                      {/* Photo Inspection Buttons (if photos exist) */}
                      {(p.vehiclePhoto || p.assetsPhoto) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {p.vehiclePhoto && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto({ url: p.vehiclePhoto!, title: `Vehicle Photo: ${p.vehicle}` })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold"
                            >
                              <Car className="w-3 h-3" />
                              <span>Vehicle: {p.vehicle}</span>
                            </button>
                          )}
                          {p.assetsPhoto && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto({ url: p.assetsPhoto!, title: `Challan / Assets Photo: ${p.assets}` })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-semibold"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Challan / Asset</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions of Card */}
                    <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenPrintBadge(p)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Badge</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenLiveCamera(p.passId, p.name)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg transition"
                          title="Capture/Update Photo via Browser Camera API (MySQL Sync)"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>

                      {p.status === 'INSIDE' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res = vmsEngine.checkOutGatePass(p.passId);
                            if (res.success) showAlert(res.message, 'success');
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          Check-Out Exit
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Exited &bull; Closed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Visitor Details</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Host Employee</th>
                  <th className="py-3 px-4">AI Safety Score</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No visitor records found.
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map(p => (
                    <tr key={p.passId} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#1C2E63] dark:text-blue-400 whitespace-nowrap">
                        {p.passId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={p.photo} 
                            alt="" 
                            onClick={() => setPreviewPhoto({ url: p.photo, title: `Visitor Portrait: ${p.name}` })}
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 cursor-pointer hover:opacity-80" 
                            title="Click to zoom portrait"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">{p.phone}</span>
                              {p.vehiclePhoto && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto({ url: p.vehiclePhoto!, title: `Vehicle Photo: ${p.vehicle}` })}
                                  className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold"
                                  title="View vehicle photo"
                                >
                                  <Car className="w-2.5 h-2.5" />
                                  <span>Vehicle</span>
                                </button>
                              )}
                              {p.assetsPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto({ url: p.assetsPhoto!, title: `Challan / Asset Photo: ${p.assets}` })}
                                  className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] font-bold"
                                  title="View material challan photo"
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>Challan</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{p.company}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{p.hostName}</td>
                      <td className="py-3 px-4">
                        {p.aiRiskScore && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.aiRiskScore === 'HIGH' 
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                              : p.aiRiskScore === 'MEDIUM'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {p.aiRiskScore}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{p.checkIn}</td>
                      <td className="py-3 px-4">
                        {p.status === 'INSIDE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            INSIDE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            CHECKED OUT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenLiveCamera(p.passId, p.name)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Capture/Update Photo via Browser Camera API (MySQL Sync)"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                        <button
                          onClick={() => onOpenPrintBadge(p)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Print Physical Badge"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {p.status === 'INSIDE' ? (
                          <button
                            onClick={() => {
                              const res = vmsEngine.checkOutGatePass(p.passId);
                              if (res.success) showAlert(res.message, 'success');
                            }}
                            className="px-2 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-300 rounded text-[10px] font-bold border border-red-200 dark:border-red-800"
                          >
                            Check-Out
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">{p.checkOut || 'OUT'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Official Gate Pass Shift Report Modal */}
      <GatePassReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onOpenBadge={onOpenPrintBadge}
      />

      {/* High-Resolution Photo Zoom Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-[#1C2E63] text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">{previewPhoto.title}</span>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="text-white hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950">
              <img 
                src={previewPhoto.url} 
                alt="Enlarged inspection" 
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-1.5 bg-[#1C2E63] text-white rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Browser Camera API Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraPhotoCaptured}
        passId={cameraTargetPass?.passId}
        visitorName={cameraTargetPass?.name || (visitorName.trim() || 'Visitor Portrait')}
        title={cameraTargetPass ? `Security Camera &bull; Update Photo for Pass #${cameraTargetPass.passId}` : 'Security Gate Webcam &bull; Capture Visitor Portrait'}
        description="Browser Camera API &bull; Direct MySQL visitor_photos Store"
      />
    </div>
  );
};
