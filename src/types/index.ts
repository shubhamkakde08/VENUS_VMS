export type AppRole = 'ADMIN' | 'SECURITY' | 'HR' | 'HOST';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'COMPANY_ADMIN' 
  | 'RECEPTIONIST' 
  | 'SECURITY_GUARD' 
  | 'EMPLOYEE_HOST' 
  | 'DEPT_HEAD' 
  | 'FACILITY_MGR' 
  | 'AUDITOR';

export type PassStatus = 'INSIDE' | 'CHECKED_OUT' | 'CANCELLED' | 'SCHEDULED' | 'PRE_REGISTERED';

export interface DailyPassCounterRecord {
  date_key: string;       // CHAR(10), format 'YYMMDD'
  last_seq: number;       // INT UNSIGNED NOT NULL DEFAULT 0
  updated_at: string;     // TIMESTAMP
}

export interface UserMasterItem {
  username: string; // e.g. shubham.kakde
  firstName: string;
  lastName: string;
  empCode?: string;
  department: string;
  role: AppRole;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'textarea';

export interface FieldConfigItem {
  id: string; // e.g. 'visitorName', 'vehicleNo', or 'cf_subcontractor_code'
  label: string;
  section: string; // 'visitor' | 'screening' | 'vehicle' | 'host' | 'assets' | 'custom'
  state: 'MANDATORY' | 'OPTIONAL' | 'DISABLED';
  fieldType?: CustomFieldType;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  isCustom?: boolean;
  dbColumnName?: string;
  createdAt?: string;
}

export interface PermissionMatrixItem {
  id: string;
  name: string;
  security: boolean;
  hr: boolean;
  admin: boolean;
}

export interface VenusGatePass {
  passId: string; // e.g. GP141026-001 or GP261014-001
  dateKey: string; // e.g. 141026
  seqNumber: number; // 1, 2, ...
  name: string;
  phone: string;
  company: string;
  idType: string;
  idNumber: string;
  category: string;
  hostName: string;
  purpose: string;
  accessZone: string;
  vehicle: string;
  assets: string;
  guardUser: string;
  checkIn: string;
  checkOut?: string;
  status: PassStatus;
  photo: string;
  vehiclePhoto?: string;
  assetsPhoto?: string;
  challanPhoto?: string;
  ppe_helmet: boolean;
  ppe_vest: boolean;
  ppe_shoes: boolean;
  email?: string;
  expectedDate?: string;
  expectedTime?: string;
  isPreRegistered?: boolean;
  aiRiskScore?: 'LOW' | 'MEDIUM' | 'HIGH';
  aiRiskAnalysis?: string;
  createdAt: string;
  customValues?: Record<string, string | number | boolean>;
}

export interface AuditLog {
  id: number;
  actor_username: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_name: string;
  entity_id: string;
  details?: string;
  timestamp: string;
  ip_address: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface LogoMasterConfig {
  companyName: string;
  tagline: string;
  plantLocation: string;
  logoUrl: string;
  badgeWatermarkUrl?: string;
  showLogoOnBadge: boolean;
  showLogoOnHeader: boolean;
  primaryColor: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AiComplianceFinding {
  logId: number;
  action: string;
  actor: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  timestamp: string;
}

export interface AiComplianceReport {
  status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK';
  complianceScore: number;
  analyzedEventsCount: number;
  flaggedCount: number;
  summary: string;
  flaggedFindings: AiComplianceFinding[];
  recommendations: string[];
  scannedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  is_read: boolean;
  pass_id?: string;
}

export interface VisitorPhotoRecord {
  photoId: string;
  passId: string;
  photoType: 'PORTRAIT' | 'VEHICLE' | 'DOCUMENT';
  photoBlob: string; // Base64 data URL from browser camera API
  capturedAt: string;
  capturedBy: string;
  source: 'BROWSER_CAMERA_API' | 'FILE_UPLOAD';
}

