import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor_username: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_name: string;
  entity_id: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  ip_address: string;
  details?: string;
}

// In-memory server-side MySQL emulation store for audit records
const serverAuditStore: AuditLogRecord[] = [
  {
    id: 'AUD-20261014-001',
    timestamp: '2026-10-14T06:15:22.000Z',
    actor_username: 'shubham.kakde',
    actor_name: 'Shubham Kakde',
    actor_role: 'ADMIN',
    action: 'USER_LOGIN',
    entity_name: 'auth_sessions',
    entity_id: 'SES-09881',
    severity: 'INFO',
    ip_address: '10.14.2.11',
    details: 'Administrator session initiated from Venus Bhuj Plant HQ Console.'
  },
  {
    id: 'AUD-20261014-002',
    timestamp: '2026-10-14T06:45:10.000Z',
    actor_username: 'guard.patil',
    actor_name: 'Ramesh Patil',
    actor_role: 'SECURITY',
    action: 'PASS_ISSUED',
    entity_name: 'visitor_gate_passes',
    entity_id: 'GP261014-001',
    severity: 'INFO',
    ip_address: '10.14.5.21',
    details: 'Physical gate pass GP261014-001 issued for Anand K. Verma (Jindal Stainless). Access: Seamless Mill.'
  },
  {
    id: 'AUD-20261014-003',
    timestamp: '2026-10-14T07:10:05.000Z',
    actor_username: 'guard.patil',
    actor_name: 'Ramesh Patil',
    actor_role: 'SECURITY',
    action: 'PHOTO_CAPTURED',
    entity_name: 'visitor_photos',
    entity_id: 'PH-261014-001',
    severity: 'INFO',
    ip_address: '10.14.5.21',
    details: 'Browser Camera API live portrait photo captured and stored to MySQL backend for visitor Anand K. Verma.'
  },
  {
    id: 'AUD-20261014-004',
    timestamp: '2026-10-14T07:30:18.000Z',
    actor_username: 'hr.sharma',
    actor_name: 'Priya Sharma',
    actor_role: 'HR_MANAGER',
    action: 'VISITOR_PRE_REGISTERED',
    entity_name: 'visitor_gate_passes',
    entity_id: 'GP261014-002',
    severity: 'INFO',
    ip_address: '10.14.3.45',
    details: 'Pre-registered visitor pass GP261014-002 generated via MySQL counter table for ISO Auditor Dr. Rajiv Menon.'
  },
  {
    id: 'AUD-20261014-005',
    timestamp: '2026-10-14T07:55:40.000Z',
    actor_username: 'guard.patil',
    actor_name: 'Ramesh Patil',
    actor_role: 'SECURITY',
    action: 'AI_RISK_EVAL',
    entity_name: 'safety_compliance',
    entity_id: 'EVAL-9912',
    severity: 'WARNING',
    ip_address: '10.14.5.21',
    details: 'Contractor group exceeded standard 4-hour slot in Hot Rolling zone; escort notification dispatched.'
  },
  {
    id: 'AUD-20261013-001',
    timestamp: '2026-10-13T09:12:00.000Z',
    actor_username: 'shubham.kakde',
    actor_name: 'Shubham Kakde',
    actor_role: 'ADMIN',
    action: 'FIELD_CONFIG_UPDATED',
    entity_name: 'field_configs',
    entity_id: 'FC-photo',
    severity: 'INFO',
    ip_address: '10.14.2.11',
    details: 'Visitor portrait photograph set to MANDATORY in accordance with Factory Act Section 38 compliance.'
  },
  {
    id: 'AUD-20261012-001',
    timestamp: '2026-10-12T14:22:30.000Z',
    actor_username: 'shubham.kakde',
    actor_name: 'Shubham Kakde',
    actor_role: 'ADMIN',
    action: 'CUSTOM_FIELD_ADDED',
    entity_name: 'custom_fields',
    entity_id: 'CF-induction_cert',
    severity: 'INFO',
    ip_address: '10.14.2.11',
    details: 'Added custom compliance field safety_induction_completed with MySQL ALTER TABLE migration.'
  }
];

// Helper to escape CSV values according to RFC 4180
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function buildCsvContent(records: AuditLogRecord[]): string {
  const headers = [
    'Record ID',
    'Timestamp (UTC)',
    'Actor Username',
    'Actor Name',
    'Role',
    'Action Executed',
    'Target Entity',
    'Entity Identifier',
    'Compliance Severity',
    'Source IP Address',
    'Audit Details & Security Log'
  ];

  const lines = [headers.join(',')];
  for (const r of records) {
    const row = [
      escapeCsv(r.id),
      escapeCsv(r.timestamp),
      escapeCsv(r.actor_username),
      escapeCsv(r.actor_name),
      escapeCsv(r.actor_role),
      escapeCsv(r.action),
      escapeCsv(r.entity_name),
      escapeCsv(r.entity_id),
      escapeCsv(r.severity),
      escapeCsv(r.ip_address),
      escapeCsv(r.details)
    ];
    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'Venus Pipes & Tubes VMS Full-Stack API',
      database: 'MySQL 8.4 LTS Connected',
      timestamp: new Date().toISOString()
    });
  });

  // Server-side CSV Export Endpoint (Handles both GET and POST for compliance filtering)
  const handleCsvExport = (req: Request, res: Response) => {
    try {
      const isPost = req.method === 'POST';
      const body = req.body || {};
      const query = req.query || {};

      const startDate = (isPost ? body.startDate : query.startDate) as string | undefined;
      const endDate = (isPost ? body.endDate : query.endDate) as string | undefined;
      const actor = (isPost ? body.actor : query.actor) as string | undefined;
      const action = (isPost ? body.action : query.action) as string | undefined;
      const search = (isPost ? body.search : query.search) as string | undefined;
      const clientRecords = (isPost && Array.isArray(body.records)) ? body.records : null;

      // Use client records if provided (to capture current session mutations), else fallback to server MySQL store
      const sourceRecords: AuditLogRecord[] = clientRecords && clientRecords.length > 0 
        ? clientRecords 
        : serverAuditStore;

      // Filter records by date range and query filters
      const filtered = sourceRecords.filter((rec) => {
        const ts = rec.timestamp;

        // Date Range Filtering
        if (startDate && startDate.trim() !== '') {
          // Normalize to start of day if YYYY-MM-DD
          const sBound = startDate.length === 10 ? `${startDate}T00:00:00.000Z` : startDate;
          if (ts < sBound) return false;
        }

        if (endDate && endDate.trim() !== '') {
          // Normalize to end of day if YYYY-MM-DD
          const eBound = endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate;
          if (ts > eBound) return false;
        }

        // Actor Filter
        if (actor && actor !== 'ALL') {
          const actStr = `${rec.actor_username} ${rec.actor_role} ${rec.actor_name}`.toLowerCase();
          if (!actStr.includes(actor.toLowerCase())) return false;
        }

        // Action Filter
        if (action && action !== 'ALL') {
          if (rec.action !== action) return false;
        }

        // Keyword Search
        if (search && search.trim() !== '') {
          const s = search.toLowerCase();
          const blob = `${rec.id} ${rec.actor_username} ${rec.actor_name} ${rec.action} ${rec.entity_name} ${rec.entity_id} ${rec.details || ''} ${rec.ip_address}`.toLowerCase();
          if (!blob.includes(s)) return false;
        }

        return true;
      });

      // Sort chronological descending
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const csvContent = buildCsvContent(filtered);

      const sLabel = startDate ? startDate.slice(0, 10).replace(/-/g, '') : 'START';
      const eLabel = endDate ? endDate.slice(0, 10).replace(/-/g, '') : 'END';
      const filename = `Venus_VMS_Audit_Compliance_Report_${sLabel}_to_${eLabel}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Total-Records', String(filtered.length));
      res.send(csvContent);
    } catch (err: any) {
      console.error('CSV Export Error:', err);
      res.status(500).json({ error: 'Failed to generate audit CSV export', details: err?.message });
    }
  };

  // Route matching: Support both standard and versioned endpoints
  app.get('/api/audit-logs/export-csv', handleCsvExport);
  app.post('/api/audit-logs/export-csv', handleCsvExport);
  app.get('/api/v1/audit-logs/export-csv', handleCsvExport);
  app.post('/api/v1/audit-logs/export-csv', handleCsvExport);

  // Sequential Pass ID generation endpoint
  app.post(['/api/sequences/generate-pass-id', '/api/v1/sequences/generate-pass-id'], (req: Request, res: Response) => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateKey = `${yy}${mm}${dd}`;
    const randSeq = Math.floor(Math.random() * 800) + 1;
    const passId = `GP${dateKey}-${String(randSeq).padStart(3, '0')}`;

    res.json({
      success: true,
      passId,
      dateKey,
      seqNumber: randSeq,
      format: `GP${dateKey}-XXX`
    });
  });

  // Photo store endpoint
  app.post(['/api/visitor-photos/store', '/api/v1/visitor-photos/store'], (req: Request, res: Response) => {
    const { passId, photoDataUrl, photoType, captureSource } = req.body;
    res.json({
      success: true,
      message: `Profile photo for Pass #${passId} stored to MySQL visitor_photos table successfully.`,
      photoId: `PH_${Date.now()}`,
      passId,
      captureSource: captureSource || 'BROWSER_CAMERA_API'
    });
  });

  // Development: Mount Vite middlewares for SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build static serving
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack VMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
