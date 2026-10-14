import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  UserCheck, Shield, Calendar, Clock, Building2, Phone, Mail, 
  CreditCard, Car, Package, Camera, Upload, Sparkles, CheckCircle2, 
  AlertTriangle, Copy, Printer, Download, Eye, ArrowRight, RefreshCw,
  Search, Users, ExternalLink, QrCode, FileSpreadsheet, Database
} from 'lucide-react';
import { vmsEngine } from '../../services/vmsEngine';
import { VenusGatePass, FieldConfigItem, UserMasterItem } from '../../types';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface VisitorPreRegistrationProps {
  onOpenPrintBadge?: (pass: VenusGatePass) => void;
  onNavigateToSecurity?: () => void;
}

export const VisitorPreRegistration: React.FC<VisitorPreRegistrationProps> = ({
  onOpenPrintBadge,
  onNavigateToSecurity
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'roster'>('form');
  
  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [company, setCompany] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [category, setCategory] = useState('Vendor / Supplier');
  const [hostName, setHostName] = useState('Er. Jayesh Patel');
  const [purpose, setPurpose] = useState('');
  const [accessZone, setAccessZone] = useState('Seamless Pipes Mill Floor');
  const [expectedDate, setExpectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedTime, setExpectedTime] = useState('10:00 AM');
  const [vehicleNo, setVehicleNo] = useState('');
  const [assets, setAssets] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Browser Camera API Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTargetPass, setCameraTargetPass] = useState<{ passId: string; name: string } | null>(null);

  // Confirmation Modal State
  const [submittedPass, setSubmittedPass] = useState<VenusGatePass | null>(null);
  const [confirmationQrUrl, setConfirmationQrUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);


  // Roster Search & Filter
  const [rosterSearch, setRosterSearch] = useState('');
  const [alertFeedback, setAlertFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Live preview ID
  const [previewId, setPreviewId] = useState<string>('');

  const [passes, setPasses] = useState<VenusGatePass[]>(vmsEngine.getPasses());
  const [fields, setFields] = useState<FieldConfigItem[]>(vmsEngine.getFields());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview ID and subscribe to changes
  useEffect(() => {
    const updatePreview = () => {
      setPreviewId(vmsEngine.peekNextGatePassId());
      setPasses(vmsEngine.getPasses());
      setFields(vmsEngine.getFields());
    };
    updatePreview();

    const unsubscribe = vmsEngine.subscribe(updatePreview);
    return () => {
      unsubscribe();
    };
  }, []);

  // Generate QR code when a pass is submitted
  useEffect(() => {
    if (submittedPass) {
      const qrData = JSON.stringify({
        passId: submittedPass.passId,
        name: submittedPass.name,
        company: submittedPass.company,
        host: submittedPass.hostName,
        date: submittedPass.expectedDate || submittedPass.dateKey,
        zone: submittedPass.accessZone,
        type: 'PRE_REGISTERED_VISITOR_PASS'
      });
      QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#1C2E63', light: '#ffffff' } })
        .then(url => setConfirmationQrUrl(url))
        .catch(err => console.error('QR Gen error', err));
    }
  }, [submittedPass]);

  const showAlert = (text: string, type: 'success' | 'error' | 'info') => {
    setAlertFeedback({ text, type });
    setTimeout(() => setAlertFeedback(null), 5000);
  };

  const handleCopyPassId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
        showAlert('Visitor photo uploaded successfully.', 'info');
      };
      reader.readAsDataURL(file);
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
      // Directly persist photo to MySQL database
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
      // Set in registration form state
      setPhotoUrl(capturedDataUrl);
      showAlert('Visitor profile photo captured via Browser Camera API! Stored directly to MySQL backend upon registration.', 'success');
    }
  };


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!visitorName.trim()) {
      showAlert('Full Legal Name is required.', 'error');
      return;
    }
    if (!visitorPhone.trim()) {
      showAlert('Phone number is required.', 'error');
      return;
    }
    if (!company.trim()) {
      showAlert('Company / Vendor organization is required.', 'error');
      return;
    }
    if (!purpose.trim()) {
      showAlert('Purpose of visit is required.', 'error');
      return;
    }

    // Dynamic field check from Admin configuration
    for (const fc of fields) {
      if (fc.state === 'MANDATORY') {
        if (fc.id === 'idNumber' && !idNumber.trim()) {
          showAlert(`'${fc.label}' is mandatory according to system compliance.`, 'error');
          return;
        }
        if (fc.isCustom && (!customValues[fc.id] || String(customValues[fc.id]).trim() === '')) {
          showAlert(`Custom field '${fc.label}' is mandatory.`, 'error');
          return;
        }
      }
    }

    // Auto-generate Gate Pass ID using MySQL counter table via vmsEngine.generateGatePassId()
    const newPrePass = vmsEngine.preRegisterVisitor({
      name: visitorName.trim(),
      phone: visitorPhone.trim(),
      email: visitorEmail.trim() || undefined,
      company: company.trim(),
      idType,
      idNumber: idNumber.trim() || 'N/A',
      category,
      hostName,
      purpose: purpose.trim(),
      accessZone,
      expectedDate,
      expectedTime,
      vehicle: vehicleNo.trim() || 'None',
      assets: assets.trim() || 'None',
      photo: photoUrl || undefined,
      customValues: Object.keys(customValues).length > 0 ? customValues : undefined
    });

    // Set submitted pass to trigger confirmation popup
    setSubmittedPass(newPrePass);
    showAlert(`Pre-Registration complete! Auto-generated Gate Pass ID: ${newPrePass.passId}`, 'success');

    // Reset form fields
    setVisitorName('');
    setVisitorPhone('');
    setVisitorEmail('');
    setCompany('');
    setIdNumber('');
    setPurpose('');
    setVehicleNo('');
    setAssets('');
    setPhotoUrl('');
    setCustomValues({});
  };

  const handleExpressCheckIn = (passId: string) => {
    const res = vmsEngine.checkInPreRegisteredPass(passId);
    if (res.success) {
      showAlert(res.message, 'success');
      if (res.pass && onOpenPrintBadge) {
        onOpenPrintBadge(res.pass);
      }
    } else {
      showAlert(res.message, 'error');
    }
  };

  // Pre-registered list
  const scheduledPasses = passes.filter(p => 
    p.status === 'SCHEDULED' || p.isPreRegistered || p.checkIn === 'Pre-Registered'
  ).filter(p => 
    p.passId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    p.company.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    p.hostName.toLowerCase().includes(rosterSearch.toLowerCase())
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
            &times;
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#1C2E63] via-[#244288] to-[#1C2E63] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
              <UserCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Pre-Arrival Clearance
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  MySQL daily_pass_counters Engine
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                Visitor Pre-Registration Portal
              </h2>
              <p className="text-xs text-slate-200 mt-1 max-w-xl">
                Pre-book expected guests, vendors, auditors, and contractors for expedited touchless check-in at Security Gates 01 &amp; 02.
              </p>
            </div>
          </div>

          {/* Live Auto-ID Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 flex flex-col items-end shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Next Auto-Generated Pass ID
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-mono font-black text-emerald-300 bg-black/30 px-2.5 py-1 rounded-lg border border-emerald-400/40">
                {previewId || 'GP261014-001'}
              </span>
            </div>
            <span className="text-[9px] text-slate-300 mt-1 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Atomic sequence via MySQL counter
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/15 text-xs font-bold">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'form'
                ? 'bg-white text-[#1C2E63] shadow-md font-extrabold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>New Pre-Registration</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-white text-[#1C2E63] shadow-md font-extrabold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Scheduled Visitors Roster</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {scheduledPasses.length}
            </span>
          </button>
        </div>
      </div>

      {/* View 1: Pre-Registration Form */}
      {activeTab === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Visitor & Host Form Sections */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* SECTION 1: Personal Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-[#1C2E63] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Visitor Identity &amp; Organization
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Full Legal Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand K. Verma"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Mobile Phone Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Email Address <span className="text-slate-400 font-normal">(For e-Pass delivery)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="visitor@company.com"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Company / Organization <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Larsen & Toubro / Jindal Power"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Government ID Type
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    >
                      <option>Aadhaar Card</option>
                      <option>PAN Card</option>
                      <option>Driving License</option>
                      <option>Passport</option>
                      <option>Company ID Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      ID Card Number / Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4421-8890-1234"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Visitor Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    >
                      <option>Vendor / Supplier</option>
                      <option>Customer / Client</option>
                      <option>Transporter Driver</option>
                      <option>Machinery Contractor</option>
                      <option>Official Auditor / Inspector</option>
                      <option>Interview Candidate</option>
                      <option>Executive VIP Guest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Visit & Routing */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-[#1C2E63] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Internal Host &amp; Schedule Clearance
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Internal Host Employee <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    >
                      <option>Er. Jayesh Patel (Seamless Mill Head)</option>
                      <option>Dr. K. S. Varma (Chief Metallurgist)</option>
                      <option>Priya Sharma (HR Operations)</option>
                      <option>Sanjay Joshi (Quality Assurance)</option>
                      <option>Shubham Kakde (IT & Systems)</option>
                      <option>Rajesh Mehta (Supply Chain & Yard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Clearance Access Zone
                    </label>
                    <select
                      value={accessZone}
                      onChange={(e) => setAccessZone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    >
                      <option>Seamless Pipes Mill Floor</option>
                      <option>Welded Tubes Mill Floor</option>
                      <option>NDT & Hydro Testing Lab</option>
                      <option>Admin & Board Room</option>
                      <option>Heavy Yard & Loading Bay</option>
                      <option>Stores & Warehouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Expected Date of Visit <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Expected Arrival Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={expectedTime}
                      onChange={(e) => setExpectedTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Purpose of Visit <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="State explicit reason for visit (e.g. Hydraulic valve inspection, vendor meeting, ISO audit)"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Vehicle & Material Assets */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-[#1C2E63] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Vehicle Registration &amp; Assets Carried
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Vehicle Registration Plate Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GJ 12 AB 9988 (or leave empty if on foot)"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Material / Tools / Laptops Carried
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dell Latitude Laptop #SN-8821, Fluke Multimeter"
                      value={assets}
                      onChange={(e) => setAssets(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#1C2E63] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Dynamic Admin Custom Fields (if configured) */}
              {fields.filter(f => f.isCustom).length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-[#1C2E63] text-white flex items-center justify-center text-xs font-bold">4</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Facility &amp; Enterprise Compliance Custom Fields
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {fields.filter(f => f.isCustom).map(fc => (
                      <div key={fc.id}>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          {fc.label} {fc.state === 'MANDATORY' && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        {fc.fieldType === 'select' && fc.options ? (
                          <select
                            value={customValues[fc.id] || ''}
                            onChange={(e) => setCustomValues({ ...customValues, [fc.id]: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
                          >
                            <option value="">Select option...</option>
                            {fc.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : fc.fieldType === 'textarea' ? (
                          <textarea
                            rows={2}
                            value={customValues[fc.id] || ''}
                            onChange={(e) => setCustomValues({ ...customValues, [fc.id]: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
                          />
                        ) : (
                          <input
                            type={fc.fieldType === 'number' ? 'number' : fc.fieldType === 'date' ? 'date' : 'text'}
                            value={customValues[fc.id] || ''}
                            onChange={(e) => setCustomValues({ ...customValues, [fc.id]: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right 4 Cols: Live Auto-ID Summary, Photo & Submit Card */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Photo & Snapshot Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#1C2E63] dark:text-blue-400" />
                    <span>Visitor Portrait Photo</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-36 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 relative group shadow-inner">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Visitor Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block">No Portrait Photo</span>
                      </div>
                    )}
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 text-[10px]"
                        title="Remove Photo"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 w-full">
                    <button
                      type="button"
                      onClick={() => handleOpenLiveCamera()}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Capture Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submission Logic & MySQL Counter Info Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Pre-Registration Protocol
                  </span>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Auto-Generated ID:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {previewId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Format Standard:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        GP&lt;YYMMDD&gt;-&lt;SEQ&gt;
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Counter Sequence:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        MySQL daily_pass_counters
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Submitting this form executes the <code className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">generateGatePassId()</code> service function to reserve the next serial ID in the MySQL counter table and creates a pre-authorized visitor pass.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Submit &amp; Generate Gate Pass</span>
                </button>
              </div>

            </div>

          </div>
        </form>
      )}

      {/* View 2: Scheduled Visitors Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1C2E63] dark:text-blue-400" />
                <span>Scheduled Pre-Registered Visitors ({scheduledPasses.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Guests with pre-generated gate pass IDs ready for immediate biometric check-in at gate
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Pass ID, Name, Company..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-[#1C2E63]"
              />
            </div>
          </div>

          {scheduledPasses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <UserCheck className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-semibold">No pre-registered visitors found</p>
              <p className="text-xs text-slate-500">Use the 'New Pre-Registration' tab to pre-register expected visitors.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledPasses.map(pass => (
                <div
                  key={pass.passId}
                  className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-[#1C2E63] dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {pass.passId}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        pass.status === 'INSIDE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {pass.status === 'INSIDE' ? 'Inside Campus' : 'Scheduled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                        {pass.photo ? (
                          <img src={pass.photo} alt={pass.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-sm">
                            {pass.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {pass.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{pass.company}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pass.phone}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Host:</span>
                        <strong className="text-slate-900 dark:text-slate-200">{pass.hostName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Expected Date:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{pass.expectedDate || pass.dateKey}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Access Zone:</span>
                        <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">{pass.accessZone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {pass.status !== 'INSIDE' ? (
                      <button
                        onClick={() => handleExpressCheckIn(pass.passId)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Express Check-In</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPrintBadge && onOpenPrintBadge(pass)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#1C2E63] hover:bg-[#152146] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print Badge</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenLiveCamera(pass.passId, pass.name)}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      title="Capture/Update Photo via Browser Camera API (MySQL Sync)"
                    >
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </button>

                    <button
                      onClick={() => {
                        setSubmittedPass(pass);
                      }}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      title="View Pass Slip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {submittedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4 animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Pre-Registration Confirmed</h3>
                  <span className="text-[10px] text-slate-500">Auto-generated via MySQL Counter</span>
                </div>
              </div>
              <button
                onClick={() => setSubmittedPass(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Pass Slip Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Official Pass ID
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-mono font-black text-[#1C2E63] dark:text-emerald-400">
                      {submittedPass.passId}
                    </span>
                    <button
                      onClick={() => handleCopyPassId(submittedPass.passId)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title="Copy Pass ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copiedId && <span className="text-[10px] text-emerald-600 font-bold block">Copied!</span>}
                </div>

                {confirmationQrUrl && (
                  <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-xs border border-slate-200 shrink-0">
                    <img src={confirmationQrUrl} alt="Gate Pass QR" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="text-xs pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Visitor Name:</span>
                  <strong className="text-slate-900 dark:text-white">{submittedPass.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Organization:</span>
                  <span>{submittedPass.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Internal Host:</span>
                  <strong className="text-slate-900 dark:text-white">{submittedPass.hostName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Expected Date:</span>
                  <span>{submittedPass.expectedDate || submittedPass.dateKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Access Zone:</span>
                  <span className="font-semibold">{submittedPass.accessZone}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (onOpenPrintBadge) onOpenPrintBadge(submittedPass);
                  setSubmittedPass(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1C2E63] hover:bg-[#152146] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Pass Slip</span>
              </button>

              <button
                onClick={() => {
                  setSubmittedPass(null);
                  setActiveTab('roster');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>View in Roster</span>
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
        visitorName={cameraTargetPass?.name || (visitorName.trim() || 'Pre-Registered Visitor')}
        title={cameraTargetPass ? `Capture Live Photo for Pass #${cameraTargetPass.passId}` : 'Capture Visitor Portrait'}
        description="Browser Camera API &bull; Direct MySQL visitor_photos Store"
      />
    </div>
  );
};

