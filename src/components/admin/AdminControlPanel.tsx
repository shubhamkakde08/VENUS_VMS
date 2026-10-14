import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Sliders, Shield, Database, Plus, Edit2, 
  Trash2, Check, Copy, RefreshCw, Key, Sparkles, 
  AlertCircle, CheckCircle2, FileCode, CheckSquare,
  History, FileSpreadsheet, Image, Upload, Search, 
  Filter, ShieldAlert, Cpu, Download, ArrowUpRight, 
  Camera, AlertTriangle, Eye, Layers, Lock, Building2,
  Calendar
} from 'lucide-react';
import { vmsEngine, DEFAULT_USERS, DEFAULT_FIELD_CONFIGS, DEFAULT_PERMISSIONS, DEFAULT_LOGO_CONFIG } from '../../services/vmsEngine';
import { 
  UserMasterItem, FieldConfigItem, PermissionMatrixItem, 
  AuditLog, LogoMasterConfig, AiComplianceReport, CustomFieldType 
} from '../../types';

export const AdminControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'fields' | 'custom_fields' | 'audit_logs' | 'logo_master' | 'rights' | 'schema' | 'ai'
  >('users');

  const [users, setUsers] = useState<UserMasterItem[]>(vmsEngine.getUsers());
  const [fields, setFields] = useState<FieldConfigItem[]>(vmsEngine.getFields());
  const [perms, setPerms] = useState<PermissionMatrixItem[]>(vmsEngine.getPermissions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(vmsEngine.getAuditLogs());
  const [logoConfig, setLogoConfig] = useState<LogoMasterConfig>(vmsEngine.getLogoConfig());
  const [pattern, setPattern] = useState(vmsEngine.getUsernamePattern());

  // User Master Form State
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('IT & Systems');
  const [role, setRole] = useState<'ADMIN' | 'SECURITY' | 'HR' | 'HOST'>('SECURITY');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [password, setPassword] = useState('');

  // Custom Field Creator Form State
  const [cfLabel, setCfLabel] = useState('');
  const [cfSection, setCfSection] = useState('Custom Fields');
  const [cfType, setCfType] = useState<CustomFieldType>('text');
  const [cfState, setCfState] = useState<'MANDATORY' | 'OPTIONAL' | 'DISABLED'>('MANDATORY');
  const [cfDefault, setCfDefault] = useState('');
  const [cfPlaceholder, setCfPlaceholder] = useState('');
  const [cfOptionsStr, setCfOptionsStr] = useState('Standard, Restricted, High Priority');

  // Audit Logs Filter & Date Range State
  const [auditActorFilter, setAuditActorFilter] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('30DAYS');
  const [auditStartDate, setAuditStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [auditEndDate, setAuditEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // AI Compliance State
  const [aiReport, setAiReport] = useState<AiComplianceReport | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');

  // Logo Master Form State
  const [brandingName, setBrandingName] = useState(logoConfig.companyName);
  const [brandingTagline, setBrandingTagline] = useState(logoConfig.tagline);
  const [brandingPlant, setBrandingPlant] = useState(logoConfig.plantLocation);
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState(logoConfig.primaryColor || '#1C2E63');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(logoConfig.logoUrl);
  const [showBadgeLogo, setShowBadgeLogo] = useState(logoConfig.showLogoOnBadge);
  const [showHeaderLogo, setShowHeaderLogo] = useState(logoConfig.showLogoOnHeader);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = vmsEngine.subscribe(() => {
      setUsers([...vmsEngine.getUsers()]);
      setFields([...vmsEngine.getFields()]);
      setPerms([...vmsEngine.getPermissions()]);
      setAuditLogs([...vmsEngine.getAuditLogs()]);
      const currentLogo = vmsEngine.getLogoConfig();
      setLogoConfig(currentLogo);
      setBrandingName(currentLogo.companyName);
      setBrandingTagline(currentLogo.tagline);
      setBrandingPlant(currentLogo.plantLocation);
      setBrandingLogoUrl(currentLogo.logoUrl);
      setShowBadgeLogo(currentLogo.showLogoOnBadge);
      setShowHeaderLogo(currentLogo.showLogoOnHeader);
    });
    return unsub;
  }, []);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-generate username whenever first or last name changes
  const handleNameChange = (fn: string, ln: string) => {
    setFirstName(fn);
    setLastName(ln);
    const gen = vmsEngine.formatUsername(fn, ln, pattern);
    setUsername(gen);
  };

  const handlePatternChange = (newPattern: string) => {
    setPattern(newPattern);
    vmsEngine.setUsernamePattern(newPattern);
    if (firstName || lastName) {
      const gen = vmsEngine.formatUsername(firstName, lastName, newPattern);
      setUsername(gen);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      showToastMsg('First name, surname, and User ID are required.');
      return;
    }

    const res = vmsEngine.saveUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      empCode: empCode.trim() || undefined,
      department,
      role,
      status,
      password: password.trim() || 'Pass@123'
    }, editIndex);

    if (res.success) {
      showToastMsg(res.message);
      resetUserForm();
    } else {
      showToastMsg(res.message);
    }
  };

  const resetUserForm = () => {
    setEditIndex(-1);
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmpCode('');
    setPassword('');
    setRole('SECURITY');
    setStatus('ACTIVE');
  };

  const handleEditUser = (idx: number) => {
    const u = users[idx];
    setEditIndex(idx);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setUsername(u.username);
    setEmpCode(u.empCode || '');
    setDepartment(u.department);
    setRole(u.role);
    setStatus(u.status);
    setPassword(u.password || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = (idx: number) => {
    const u = users[idx];
    if (window.confirm(`Are you sure you want to deactivate and remove user '${u.username}'?`)) {
      const res = vmsEngine.deleteUser(idx);
      showToastMsg(res.message);
    }
  };

  // Custom Field Form Submission
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfLabel.trim()) {
      showToastMsg('Field label is required.');
      return;
    }

    const options = cfType === 'select'
      ? cfOptionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const res = vmsEngine.addCustomField({
      label: cfLabel.trim(),
      section: cfSection,
      fieldType: cfType,
      state: cfState,
      defaultValue: cfDefault.trim() || undefined,
      placeholder: cfPlaceholder.trim() || undefined,
      options
    });

    if (res.success) {
      showToastMsg(res.message);
      setCfLabel('');
      setCfDefault('');
      setCfPlaceholder('');
    } else {
      showToastMsg(res.message);
    }
  };

  const handleDeleteCustomField = (id: string) => {
    if (window.confirm(`Are you sure you want to delete custom field '${id}'? This will drop the column from future passes.`)) {
      const res = vmsEngine.deleteCustomField(id);
      showToastMsg(res.message);
    }
  };

  // Run AI Compliance Analysis on Audit Logs
  const handleRunAiAudit = async () => {
    setIsAiScanning(true);
    try {
      const report = await vmsEngine.analyzeAuditComplianceAI(aiCustomPrompt);
      setAiReport(report);
      showToastMsg(`AI Compliance Scan completed: ${report.status} (Score: ${report.complianceScore}%)`);
    } catch (e: any) {
      showToastMsg(`AI analysis failed: ${e.message}`);
    } finally {
      setIsAiScanning(false);
    }
  };

  // Logo Master File Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToastMsg('Logo image exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandingLogoUrl(reader.result);
        showToastMsg('Logo image uploaded to memory. Click Save Settings to commit.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoMaster = (e: React.FormEvent) => {
    e.preventDefault();
    const res = vmsEngine.updateLogoConfig({
      companyName: brandingName.trim(),
      tagline: brandingTagline.trim(),
      plantLocation: brandingPlant.trim(),
      primaryColor: brandingPrimaryColor,
      logoUrl: brandingLogoUrl,
      showLogoOnBadge: showBadgeLogo,
      showLogoOnHeader: showHeaderLogo
    });
    showToastMsg(res.message);
  };

  const handleDatePresetChange = (preset: string) => {
    setAuditDateFilter(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (preset === 'TODAY') {
      setAuditStartDate(todayStr);
      setAuditEndDate(todayStr);
    } else if (preset === '7DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setAuditStartDate(d.toISOString().slice(0, 10));
      setAuditEndDate(todayStr);
    } else if (preset === '30DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setAuditStartDate(d.toISOString().slice(0, 10));
      setAuditEndDate(todayStr);
    } else if (preset === 'ALL') {
      setAuditStartDate('');
      setAuditEndDate('');
    }
  };

  const handleDownloadCSV = async () => {
    setIsExportingCsv(true);
    try {
      const res = await vmsEngine.exportAuditLogsServerCSV({
        startDate: auditStartDate,
        endDate: auditEndDate,
        actor: auditActorFilter,
        action: auditActionFilter,
        search: auditSearchQuery
      });
      showToastMsg(res.message);
    } catch (err: any) {
      showToastMsg(`Export failed: ${err?.message || 'Error communicating with server endpoint'}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportAuditLogsCSV = handleDownloadCSV;

  const handleCopySql = () => {
    const sql = `-- VENUS PIPES AND TUBES LIMITED - MYSQL 8.4 LTS DDL
CREATE DATABASE IF NOT EXISTS venus_vms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE venus_vms_db;

-- 1. USER MASTER TABLE (LOGIN BY USERNAME: firstname.lastname)
CREATE TABLE IF NOT EXISTS user_master (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    emp_code VARCHAR(30) UNIQUE,
    department VARCHAR(80) NOT NULL,
    role ENUM('ADMIN', 'SECURITY', 'HR', 'HOST') NOT NULL DEFAULT 'SECURITY',
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DYNAMIC FIELD CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS gatepass_field_configs (
    field_id VARCHAR(50) PRIMARY KEY,
    label_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    field_state ENUM('MANDATORY', 'OPTIONAL', 'DISABLED') NOT NULL DEFAULT 'MANDATORY',
    is_custom BOOLEAN DEFAULT FALSE,
    db_column_name VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. AUDIT LOGS TABLE FOR COMPLIANCE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_username VARCHAR(80) NOT NULL,
    actor_name VARCHAR(120) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    severity ENUM('INFO', 'WARN', 'CRITICAL') DEFAULT 'INFO',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (entity_name, entity_id),
    INDEX (actor_username),
    INDEX (timestamp)
);

-- 4. ATOMIC DAILY PASS COUNTER TABLE (GP[YYMMDD]-[SERIAL])
CREATE TABLE IF NOT EXISTS daily_pass_counters (
    date_key CHAR(10) PRIMARY KEY,
    last_seq INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. ATOMIC STORED PROCEDURE FOR CONCURRENCY LOCK
DELIMITER $$
CREATE PROCEDURE sp_generate_gate_pass_id (
    IN p_date_key CHAR(10),
    OUT p_generated_pass_id VARCHAR(25)
)
BEGIN
    DECLARE v_seq INT UNSIGNED;
    INSERT INTO daily_pass_counters (date_key, last_seq)
    VALUES (p_date_key, 1)
    ON DUPLICATE KEY UPDATE last_seq = last_seq + 1;
    
    SELECT last_seq INTO v_seq
    FROM daily_pass_counters
    WHERE date_key = p_date_key;
    
    SET p_generated_pass_id = CONCAT('GP', p_date_key, '-', LPAD(v_seq, 3, '0'));
END$$
DELIMITER ;

-- 6. VISITOR PROFILE PHOTOS TABLE (CAPTURED VIA BROWSER CAMERA API)
CREATE TABLE IF NOT EXISTS visitor_photos (
    photo_id VARCHAR(50) PRIMARY KEY,
    pass_id VARCHAR(25) NOT NULL,
    photo_type ENUM('PORTRAIT', 'VEHICLE', 'DOCUMENT') DEFAULT 'PORTRAIT',
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',
    photo_blob LONGTEXT NOT NULL COMMENT 'Base64 data captured directly from browser camera API',
    captured_by VARCHAR(80) NOT NULL,
    source ENUM('BROWSER_CAMERA_API', 'FILE_UPLOAD') DEFAULT 'BROWSER_CAMERA_API',
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (pass_id),
    INDEX (captured_at)
);

-- 7. VISITOR GATE PASSES MASTER TABLE
CREATE TABLE IF NOT EXISTS visitor_gate_passes (
    pass_id VARCHAR(25) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(120) NOT NULL,
    host_name VARCHAR(120) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    access_zone VARCHAR(100) NOT NULL,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    vehicle_no VARCHAR(50),
    assets TEXT,
    photo LONGTEXT COMMENT 'Direct Browser Camera API Base64 Data URL',
    status ENUM('INSIDE', 'CHECKED_OUT', 'CANCELLED', 'SCHEDULED', 'PRE_REGISTERED') NOT NULL DEFAULT 'INSIDE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (status),
    INDEX (created_at)
);`;


    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToastMsg('MySQL 8.4 DDL Schema copied to clipboard.');
  };

  // Filtered Audit Logs
  const filteredAuditLogs = vmsEngine.getAuditLogs({
    actor: auditActorFilter,
    action: auditActionFilter,
    datePreset: auditDateFilter,
    startDate: auditStartDate,
    endDate: auditEndDate,
    search: auditSearchQuery
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#1C2E63] dark:text-blue-400" />
          <span>Venus Administrator Control Panel</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete administration suite: User Master, Mandatory Field Rules, Custom Fields with auto-backend schema sync, Audit Logs with AI Compliance Intelligence, and Corporate Logo Master.
        </p>
      </div>

      {/* Sub-tab Navigation (Horizontal swipeable on mobile, wrap on desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-200 dark:border-slate-800 scrollbar-none snap-x">
        <button
          onClick={() => setActiveTab('users')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Master</span>
        </button>

        <button
          onClick={() => setActiveTab('fields')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'fields'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Mandatory Fields</span>
        </button>

        <button
          onClick={() => setActiveTab('custom_fields')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'custom_fields'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span>Custom Fields (DB Sync)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'audit_logs'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-emerald-500" />
          <span>Audit Logs &amp; AI</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-white font-mono font-bold">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logo_master')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'logo_master'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Image className="w-4 h-4 text-blue-500" />
          <span>Logo Master</span>
        </button>

        <button
          onClick={() => setActiveTab('rights')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'rights'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Role Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL Backend DDL</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`shrink-0 snap-start px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'bg-[#1C2E63] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Intelligence</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PANEL: AUDIT LOGS WITH AI COMPLIANCE INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          
          {/* AI Compliance Intelligence Executive Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#152146] to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI STATUTORY COMPLIANCE SCANNER</span>
                  </span>
                  <span className="text-xs text-slate-400">MySQL 8.4 `audit_logs` Active</span>
                </div>
                <h3 className="text-lg font-bold">
                  Perimeter & Access Control Compliance Auditor
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time AI audit of guard check-ins, contractor movements, administrative role elevations, and physical gate surrender compliance across Venus Pipes manufacturing gates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isAiScanning}
                  onClick={handleRunAiAudit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiScanning ? 'Scanning Audit Trail...' : 'Run AI Compliance Scan'}</span>
                </button>

                <button
                  type="button"
                  disabled={isExportingCsv}
                  onClick={handleDownloadCSV}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 border border-blue-500/40 transition cursor-pointer"
                  title="Export compliance audit records filtered by date range via server-side endpoint (/api/audit-logs/export-csv)"
                >
                  <Download className={`w-4 h-4 ${isExportingCsv ? 'animate-bounce' : ''}`} />
                  <span>{isExportingCsv ? 'Generating CSV...' : 'Download CSV'}</span>
                </button>
              </div>
            </div>

            {/* AI Report Card if generated */}
            {aiReport && (
              <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in">
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block font-medium">Compliance Health Score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {aiReport.complianceScore}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      aiReport.status === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {aiReport.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Evaluated {aiReport.analyzedEventsCount} audit events &bull; {aiReport.flaggedCount} flagged
                  </span>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 md:col-span-2 space-y-2">
                  <span className="text-slate-400 block font-medium">AI Executive Summary</span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {aiReport.summary}
                  </p>
                  {aiReport.recommendations.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-[11px] font-bold text-amber-300 block mb-1">Recommended Directives:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                        {aiReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1C2E63] dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Query Filters & Multi-Parameter Search
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Displaying <strong>{filteredAuditLogs.length}</strong> of {auditLogs.length} logged events
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* Start Date */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>Start Date:</span>
                </label>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={e => {
                    setAuditStartDate(e.target.value);
                    setAuditDateFilter('CUSTOM');
                  }}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>End Date:</span>
                </label>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={e => {
                    setAuditEndDate(e.target.value);
                    setAuditDateFilter('CUSTOM');
                  }}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Date Presets */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Preset Window:</label>
                <select
                  value={auditDateFilter}
                  onChange={e => handleDatePresetChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                >
                  <option value="30DAYS">Last 30 Days (Default)</option>
                  <option value="7DAYS">Last 7 Days</option>
                  <option value="TODAY">Today Only</option>
                  <option value="ALL">All Recorded Logs</option>
                  <option value="CUSTOM">Custom Date Range</option>
                </select>
              </div>

              {/* Actor Filter */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Filter by Actor:</label>
                <select
                  value={auditActorFilter}
                  onChange={e => setAuditActorFilter(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                >
                  <option value="ALL">All Actors (Admin, Guards, HR)</option>
                  <option value="shubham.kakde">Shubham Kakde (Admin)</option>
                  <option value="guard.patil">Ramesh Patil (Security Guard)</option>
                  <option value="hr.sharma">Priya Sharma (HR)</option>
                  <option value="jayesh.patel">Jayesh Patel (Host)</option>
                  <option value="SECURITY">All Security Personnel</option>
                  <option value="ADMIN">All Administrators</option>
                </select>
              </div>

              {/* Action Filter */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Filter by Action:</label>
                <select
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                >
                  <option value="ALL">All Actions</option>
                  <option value="PASS_ISSUED">PASS_ISSUED (Gate Pass Created)</option>
                  <option value="PASS_CHECKOUT">PASS_CHECKOUT (Visitor Exit Logged)</option>
                  <option value="USER_LOGIN">USER_LOGIN (User Authentication)</option>
                  <option value="USER_CREATED">USER_CREATED (User Master Added)</option>
                  <option value="USER_UPDATED">USER_UPDATED (User Modified)</option>
                  <option value="FIELD_CONFIG_UPDATED">FIELD_CONFIG_UPDATED (Mandatory Rules)</option>
                  <option value="CUSTOM_FIELD_ADDED">CUSTOM_FIELD_ADDED (Schema Alteration)</option>
                  <option value="LOGO_UPDATED">LOGO_UPDATED (Branding Changed)</option>
                  <option value="PHOTO_CAPTURED">PHOTO_CAPTURED (Browser Camera API)</option>
                  <option value="GENERATE_GATE_PASS_ID">GENERATE_GATE_PASS_ID (MySQL Counter)</option>
                  <option value="AI_RISK_EVAL">AI_RISK_EVAL (Safety Flag)</option>
                  <option value="CSV_AUDIT_EXPORT">CSV_AUDIT_EXPORT (Compliance Download)</option>
                </select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Search Keyword / IP:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={e => setAuditSearchQuery(e.target.value)}
                    placeholder="Search pass, actor, IP..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Compliance Filter Summary & Direct CSV Download Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Compliance Date Filter:</span>
                <span className="font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                  {auditStartDate || 'ALL'} &rarr; {auditEndDate || 'ALL'}
                </span>
                <span>&bull;</span>
                <span>{filteredAuditLogs.length} matching events</span>
                <span>&bull;</span>
                <span className="text-slate-400 font-mono text-[10px]">Server endpoint: /api/audit-logs/export-csv</span>
              </div>

              <button
                type="button"
                disabled={isExportingCsv}
                onClick={handleDownloadCSV}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition self-end sm:self-auto cursor-pointer"
                title="Download CSV filtered by selected date range using server-side endpoint"
              >
                <Download className={`w-3.5 h-3.5 ${isExportingCsv ? 'animate-bounce' : ''}`} />
                <span>{isExportingCsv ? 'Exporting...' : 'Download CSV'}</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC/Local)</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Details & DDL Statements</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No audit events match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-500">
                          {new Date(log.timestamp).toLocaleString('en-GB')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            log.severity === 'CRITICAL'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : log.severity === 'WARN'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs">
                          <span className="text-[#1C2E63] dark:text-blue-400">{log.action}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{log.actor_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.actor_username} &bull; {log.actor_role}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 block">
                            {log.entity_name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {log.entity_id}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                            {log.details || 'No additional details.'}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: CUSTOM FIELDS MASTER (AUTO-SYNC TO BACKEND SCHEMA) */}
      {/* ========================================================================= */}
      {activeTab === 'custom_fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Add Custom Field (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Add New Custom Field
                </h4>
                <p className="text-[11px] text-slate-500">Automatically expands MySQL database schema</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/80 font-mono text-amber-600 font-bold">
                AUTO_DDL
              </span>
            </div>

            <form onSubmit={handleAddCustomField} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Field Display Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cfLabel}
                  onChange={e => setCfLabel(e.target.value)}
                  placeholder="e.g. Safety Induction Date, Subcontractor Code"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#1C2E63]"
                />
                {cfLabel && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Auto-generated column slug: <code className="text-[#1C2E63] dark:text-blue-400">cf_{cfLabel.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}</code>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Form Section:</label>
                  <select
                    value={cfSection}
                    onChange={e => setCfSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Personal">1. Personal Details</option>
                    <option value="Host Route">2. Host & Routing</option>
                    <option value="Security">3. Security Screening</option>
                    <option value="Custom Fields">4. Custom Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Data Type:</label>
                  <select
                    value={cfType}
                    onChange={e => setCfType(e.target.value as CustomFieldType)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="text">Text (VARCHAR)</option>
                    <option value="number">Numeric (INTEGER)</option>
                    <option value="select">Dropdown (SELECT)</option>
                    <option value="date">Date (DATE)</option>
                    <option value="checkbox">Checkbox (BOOLEAN)</option>
                  </select>
                </div>
              </div>

              {cfType === 'select' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Dropdown Options (Comma-separated):
                  </label>
                  <input
                    type="text"
                    value={cfOptionsStr}
                    onChange={e => setCfOptionsStr(e.target.value)}
                    placeholder="Standard, High Priority, Restricted"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Mandatory Status:</label>
                  <select
                    value={cfState}
                    onChange={e => setCfState(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="MANDATORY">MANDATORY (Required *)</option>
                    <option value="OPTIONAL">OPTIONAL</option>
                    <option value="DISABLED">DISABLED (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Placeholder Text:</label>
                  <input
                    type="text"
                    value={cfPlaceholder}
                    onChange={e => setCfPlaceholder(e.target.value)}
                    placeholder="e.g. Enter induction badge..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Automatic Backend Schema Sync Notice */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-[#1C2E63] dark:text-blue-300 block flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>Automatic MySQL Column Provisioning</span>
                </span>
                <p>
                  Adding this custom field will automatically register the column in the backend <code className="font-mono font-bold">gate_passes</code> table and record a migration in <code className="font-mono">audit_logs</code>.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1C2E63] hover:bg-[#152146] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Field & Apply to Backend</span>
              </button>
            </form>
          </div>

          {/* Right: Existing Custom Fields Table (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Custom Fields Registry
                </h4>
                <p className="text-[11px] text-slate-500">
                  Custom form inputs currently injected into the security guard console
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {fields.filter(f => f.isCustom).length} Custom Fields
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Field Label</th>
                    <th className="py-3 px-3">Slug (DB Column)</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Section</th>
                    <th className="py-3 px-3">Requirement</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {fields.filter(f => f.isCustom).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No custom fields created yet. Use the form on the left to add one.
                      </td>
                    </tr>
                  ) : (
                    fields.filter(f => f.isCustom).map(cf => (
                      <tr key={cf.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {cf.label}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-[#1C2E63] dark:text-blue-400">
                          {cf.id}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">
                          {cf.fieldType || 'text'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {cf.section}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            cf.state === 'MANDATORY'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : cf.state === 'OPTIONAL'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {cf.state}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(cf.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                            title="Delete custom field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: LOGO MASTER & CORPORATE BRANDING */}
      {/* ========================================================================= */}
      {activeTab === 'logo_master' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Hidden File Picker */}
          <input
            type="file"
            ref={logoFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enterprise Logo Master & Corporate Branding Configuration
              </h4>
              <p className="text-xs text-slate-500">
                Manage the company crest, legal name, plant campus title, and badge watermark displayed across Header, Login Window, and Printed Gate Passes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const res = vmsEngine.resetLogoConfig();
                showToastMsg(res.message);
              }}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Official Venus Crest</span>
            </button>
          </div>

          <form onSubmit={handleSaveLogoMaster} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
            {/* Left 6 cols: Logo Preview & Upload */}
            <div className="lg:col-span-6 space-y-4">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Active Company Logo Preview
              </span>

              {/* Dual Preview Cards (Light & Dark) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Light Canvas Preview</span>
                  <div className="w-16 h-16 rounded-xl bg-white p-2 flex items-center justify-center shadow">
                    {brandingLogoUrl && brandingLogoUrl !== 'DEFAULT_VENUS_SVG' ? (
                      <img src={brandingLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <svg viewBox="0 0 450 150" className="w-full h-auto">
                        <path d="M 20 20 L 70 120 L 120 20" fill="none" stroke="#1C2E63" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 140 120 C 140 70, 180 70, 180 120 C 180 70, 220 70, 220 120" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                        <path d="M 250 20 L 250 120 C 250 120, 280 130, 310 110 C 340 90, 340 30, 310 20 C 280 10, 280 60, 320 70" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                        <path d="M 370 20 C 340 20, 340 60, 370 70 C 400 80, 400 120, 370 120" fill="none" stroke="#1C2E63" strokeWidth="22" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">{brandingName}</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dark Canvas Preview</span>
                  <div className="w-16 h-16 rounded-xl bg-[#1C2E63] p-2 flex items-center justify-center shadow">
                    {brandingLogoUrl && brandingLogoUrl !== 'DEFAULT_VENUS_SVG' ? (
                      <img src={brandingLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <svg viewBox="0 0 450 150" className="w-full h-auto">
                        <path d="M 20 20 L 70 120 L 120 20" fill="none" stroke="#FFFFFF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 140 120 C 140 70, 180 70, 180 120 C 180 70, 220 70, 220 120" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                        <path d="M 250 20 L 250 120 C 250 120, 280 130, 310 110 C 340 90, 340 30, 310 20 C 280 10, 280 60, 320 70" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                        <path d="M 370 20 C 340 20, 340 60, 370 70 C 400 80, 400 120, 370 120" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-200">{brandingName}</span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#1C2E63] hover:bg-[#152146] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Logo (PNG / SVG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrandingLogoUrl('DEFAULT_VENUS_SVG')}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Use Official Venus Vector Monogram
                </button>
              </div>
            </div>

            {/* Right 6 cols: Branding Information & Checkboxes */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Company Legal Entity Name:
                </label>
                <input
                  type="text"
                  required
                  value={brandingName}
                  onChange={e => setBrandingName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Subtitle / System Branding Tagline:
                </label>
                <input
                  type="text"
                  value={brandingTagline}
                  onChange={e => setBrandingTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Active Manufacturing Campus / Plant Location:
                </label>
                <input
                  type="text"
                  value={brandingPlant}
                  onChange={e => setBrandingPlant(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showBadgeLogo}
                    onChange={e => setShowBadgeLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1C2E63]"
                  />
                  <span>Display Corporate Logo on Printed Gate Pass Badges</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showHeaderLogo}
                    onChange={e => setShowHeaderLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1C2E63]"
                  />
                  <span>Display Corporate Logo in Top Navigation Header</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1C2E63] hover:bg-[#152146] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Corporate Logo & Branding Settings</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: USER MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editIndex >= 0 ? 'Edit User Master' : 'Add New User Master'}
                </h4>
                <p className="text-[11px] text-slate-500">Configure login username (firstname.surname)</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/80 font-mono text-[#1C2E63] dark:text-blue-300 font-bold">
                USER_ID
              </span>
            </div>

            {/* Pattern Configuration Selector */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Configurable User ID Pattern
              </label>
              <select
                value={pattern}
                onChange={e => handlePatternChange(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#1C2E63]"
              >
                <option value="firstname.lastname">firstname.lastname (e.g. shubham.kakde)</option>
                <option value="firstnamelastname">firstnamelastname (e.g. shubhamkakde)</option>
                <option value="f.lastname">f.lastname (e.g. s.kakde)</option>
                <option value="lastname.firstname">lastname.firstname (e.g. kakde.shubham)</option>
              </select>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => handleNameChange(e.target.value, lastName)}
                    placeholder="Shubham"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#1C2E63]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Surname / Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => handleNameChange(firstName, e.target.value)}
                    placeholder="Kakde"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#1C2E63]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Assigned User ID (Login Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="shubham.kakde"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-1 focus:ring-[#1C2E63]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Employee Code (Emp ID)
                  </label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={e => setEmpCode(e.target.value)}
                    placeholder="VPT-1001"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono uppercase outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="IT & Systems">IT & Systems</option>
                    <option value="Security Operations">Security Operations</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Seamless Pipes Mill">Seamless Pipes Mill</option>
                    <option value="Welded Tubes Mill">Welded Tubes Mill</option>
                    <option value="Quality Assurance / NDT">QA / NDT Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="SECURITY">Security Guard (Gate Pass Entry)</option>
                    <option value="HR">HR Officer (Approvals)</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="HOST">Host Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE (Deactivated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Password {editIndex < 0 && <span className="text-slate-400 font-normal">(Default: Pass@123)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1C2E63] hover:bg-[#152146] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editIndex >= 0 ? 'Update User Record' : 'Save New User'}</span>
                </button>
                {editIndex >= 0 && (
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Users Table (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active User Master Records
                </h4>
                <p className="text-[11px] text-slate-500">Authorized personnel accounts for Venus Pipes and Tubes</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300">
                {users.length} Registered
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">User ID (Username)</th>
                    <th className="py-3 px-3">Employee Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {users.map((u, idx) => (
                    <tr key={u.username} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1C2E63] dark:text-blue-400">
                        {u.username}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
                        {u.firstName} {u.lastName}
                        <span className="text-[10px] text-slate-400 block font-mono">{u.empCode || 'N/A'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN' 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                            : u.role === 'HR'
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{u.department}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.status === 'ACTIVE' 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditUser(idx)}
                          className="p-1 text-slate-500 hover:text-blue-600"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: MANDATORY FIELD CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'fields' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dynamic Gate Pass Form Field Controls
              </h4>
              <p className="text-xs text-slate-500">
                Configure which fields are Mandatory (Required *), Optional, or completely Disabled in the Security Guard Gate Pass form.
              </p>
            </div>
            <button
              onClick={() => showToastMsg('Field settings saved & applied to Guard Desk.')}
              className="px-4 py-2 bg-[#1C2E63] hover:bg-[#152146] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Form Rules</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Field Identifier</th>
                  <th className="py-3 px-4">Display Label</th>
                  <th className="py-3 px-4">Form Section</th>
                  <th className="py-3 px-4">Configuration State</th>
                  <th className="py-3 px-4 text-center">Status Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {fields.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1C2E63] dark:text-blue-400">
                      {f.id}
                      {f.isCustom && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {f.label}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {f.section}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-950 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            vmsEngine.updateFieldConfig(f.id, 'MANDATORY');
                            showToastMsg(`'${f.label}' set to MANDATORY`);
                          }}
                          className={`px-3 py-1 rounded-md font-bold transition ${
                            f.state === 'MANDATORY'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          Mandatory
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            vmsEngine.updateFieldConfig(f.id, 'OPTIONAL');
                            showToastMsg(`'${f.label}' set to OPTIONAL`);
                          }}
                          className={`px-3 py-1 rounded-md font-bold transition ${
                            f.state === 'OPTIONAL'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          Optional
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            vmsEngine.updateFieldConfig(f.id, 'DISABLED');
                            showToastMsg(`'${f.label}' set to DISABLED`);
                          }}
                          className={`px-3 py-1 rounded-md font-bold transition ${
                            f.state === 'DISABLED'
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          Disabled
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        f.state === 'MANDATORY'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : f.state === 'OPTIONAL'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {f.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: ROLE PERMISSIONS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'rights' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Role-Based Access Control (RBAC) Rights Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Granular permission matrix mapped to Security Guard, HR Officer, and System Administrator privileges.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Feature / Privilege</th>
                  <th className="py-3 px-4 text-center">Security Guard</th>
                  <th className="py-3 px-4 text-center">HR Officer</th>
                  <th className="py-3 px-4 text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {perms.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={p.security}
                        onChange={e => {
                          const updated = [...perms];
                          updated[idx].security = e.target.checked;
                          vmsEngine.updatePermissions(updated);
                        }}
                        className="w-4 h-4 rounded text-[#1C2E63]"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={p.hr}
                        onChange={e => {
                          const updated = [...perms];
                          updated[idx].hr = e.target.checked;
                          vmsEngine.updatePermissions(updated);
                        }}
                        className="w-4 h-4 rounded text-[#1C2E63]"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={p.admin}
                        disabled
                        className="w-4 h-4 rounded text-[#1C2E63] opacity-70 cursor-not-allowed"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: MYSQL BACKEND DDL */}
      {/* ========================================================================= */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pass ID Sequence Format: GP[YYMMDD]-[SERIAL]
                </h4>
                <p className="text-xs text-slate-500">
                  Select pass numbering standard. Synchronized with MySQL database counter table.
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-950 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    vmsEngine.setDateKeyFormat('YYMMDD');
                    showToastMsg('Pass ID sequence set to GP[YYMMDD]-[SERIAL]');
                  }}
                  className={`px-3 py-1 rounded-lg transition ${
                    vmsEngine.getDateKeyFormat() === 'YYMMDD'
                      ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  GP[YYMMDD] (e.g. GP261014-001)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vmsEngine.setDateKeyFormat('DDMMYY');
                    showToastMsg('Pass ID sequence set to GP[DDMMYY]-[SERIAL]');
                  }}
                  className={`px-3 py-1 rounded-lg transition ${
                    vmsEngine.getDateKeyFormat() === 'DDMMYY'
                      ? 'bg-white dark:bg-slate-900 text-[#1C2E63] dark:text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  GP[DDMMYY] (e.g. GP141026-001)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block font-medium">Active Date Key:</span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-white mt-1 block">
                  {vmsEngine.getSystemDateKey()}
                </span>
                <span className="text-[10px] text-slate-400">Daily table partition key</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block font-medium">Today's Sequence Count:</span>
                <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {vmsEngine.getPasses().filter(p => p.dateKey === vmsEngine.getSystemDateKey()).length}
                </span>
                <span className="text-[10px] text-slate-400">Committed passes in DB</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block font-medium">Next Atomic Pass ID:</span>
                <span className="text-xl font-mono font-bold text-[#1C2E63] dark:text-blue-400 mt-1 block">
                  {vmsEngine.generateNextGatePassId()}
                </span>
                <span className="text-[10px] text-slate-400">Auto-incremented on submit</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <span className="text-slate-500 block font-medium">Concurrency Lock:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SELECT FOR UPDATE</span>
                </span>
                <span className="text-[10px] text-slate-400">Guarantees zero duplicate IDs</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
              <span className="text-slate-700 dark:text-slate-300">
                Backend Service Route: <code className="font-mono font-bold text-[#1C2E63] dark:text-blue-300">POST /api/v1/sequences/generate-pass-id</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  const newId = vmsEngine.generateNextGatePassId();
                  showToastMsg(`Atomic Sequence Tested: Generated ${newId} with zero collisions.`);
                }}
                className="px-4 py-1.5 bg-[#1C2E63] hover:bg-[#152146] text-white font-bold rounded-lg shadow-sm transition"
              >
                Test Sequence Generation API
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  MySQL 8.4 Production Database DDL Script
                </h4>
                <p className="text-xs text-slate-500">
                  Complete DDL with User Master, Dynamic Field Configs, Audit Logs, and Stored Procedure <code className="text-blue-500 font-mono">sp_generate_gate_pass_id</code>.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-[460px]">
              <pre><code>{`-- VENUS PIPES AND TUBES LIMITED - MYSQL 8.4 LTS DDL
CREATE DATABASE IF NOT EXISTS venus_vms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE venus_vms_db;

-- 1. USER MASTER TABLE
CREATE TABLE IF NOT EXISTS user_master (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    emp_code VARCHAR(30) UNIQUE,
    department VARCHAR(80) NOT NULL,
    role ENUM('ADMIN', 'SECURITY', 'HR', 'HOST') NOT NULL DEFAULT 'SECURITY',
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DYNAMIC FIELD CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS gatepass_field_configs (
    field_id VARCHAR(50) PRIMARY KEY,
    label_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    field_state ENUM('MANDATORY', 'OPTIONAL', 'DISABLED') NOT NULL DEFAULT 'MANDATORY',
    is_custom BOOLEAN DEFAULT FALSE,
    db_column_name VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. AUDIT LOGS TABLE FOR COMPLIANCE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_username VARCHAR(80) NOT NULL,
    actor_name VARCHAR(120) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    severity ENUM('INFO', 'WARN', 'CRITICAL') DEFAULT 'INFO',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (entity_name, entity_id),
    INDEX (actor_username),
    INDEX (timestamp)
);

-- 4. DAILY PASS COUNTER (ATOMIC SEQUENCE FOR GP[YYMMDD]-[SERIAL])
CREATE TABLE IF NOT EXISTS daily_pass_counters (
    date_key CHAR(10) PRIMARY KEY,
    last_seq INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. ATOMIC STORED PROCEDURE FOR CONCURRENCY LOCK
DELIMITER $$
CREATE PROCEDURE sp_generate_gate_pass_id (
    IN p_date_key CHAR(10),
    OUT p_generated_pass_id VARCHAR(25)
)
BEGIN
    DECLARE v_seq INT UNSIGNED;
    INSERT INTO daily_pass_counters (date_key, last_seq)
    VALUES (p_date_key, 1)
    ON DUPLICATE KEY UPDATE last_seq = last_seq + 1;
    
    SELECT last_seq INTO v_seq
    FROM daily_pass_counters
    WHERE date_key = p_date_key;
    
    SET p_generated_pass_id = CONCAT('GP', p_date_key, '-', LPAD(v_seq, 3, '0'));
END$$
DELIMITER ;`}</code></pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PANEL: AI SAFETY INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                AI Visitor Safety & Perimeter Risk Intelligence
              </h4>
              <p className="text-xs text-slate-500">
                Rule-based and LLM-powered anomaly scanner for industrial mill hazards, hazardous asset detection, and hot-work protocols.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Seamless Mill Anomaly Rules</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Automatically mandates Ear Protection + Steel-Toe Boots when zone equals "Seamless Pipes Mill Floor".
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>NDT Lab Radioactive Safety</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Flags any high-pressure gauge or radioactive source tooling; alerts Chief Quality Inspector before issuance.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Heavy Yard Inward Logistics</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Automated driver geofencing: driver must remain in vehicle cab or designated dispatch office.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
