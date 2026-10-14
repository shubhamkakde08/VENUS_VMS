# VISITFLOW — Enterprise Visitor Management System
## System Architecture & Specification

### 1. High-Level Architecture Overview

VISITFLOW is structured as a decoupled, multi-tier enterprise platform:
1. **Frontend Tier (Web & Mobile PWA)**
   - Built with React 19, TypeScript, Tailwind CSS v4, Lucide Icons, and Motion.
   - Responsive layout adapting from mobile gate scanners (touch-first) to dual-monitor receptionist and security supervisor stations.
   - PWA support with Web App Manifest, offline error boundaries, and HTML5 WebRTC camera barcode/QR scanner.
2. **API & Service Tier (Python FastAPI)**
   - High-throughput asynchronous RESTful API with Pydantic v2 data validation and OpenAPI 3.1 documentation.
   - JWT-based authentication with bcrypt password hashing, token revocation, and role-based access control (RBAC) middleware.
   - Cryptographic QR token generation with HMAC SHA-256 signatures, single-use nonce validation, and expiration timestamps.
3. **Persistence Tier (MySQL 8.4 LTS)**
   - ACID-compliant relational storage engine utilizing InnoDB, foreign key constraints, `utf8mb4` character collation, and UTC timezone recording.
   - Normalized schema separating Visitor master entities from specific Visit transactions.
   - Comprehensive audit logging trigger / middleware recording actor ID, action, resource, IP address, and payload diffs.

```
+-----------------------------------------------------------------------------------+
|                           VISITFLOW Client Interfaces                             |
|  [Admin Web Portal]  [Receptionist Kiosk]  [Host Portal]  [Security Mobile PWA]   |
+-----------------------------------------------------------------------------------+
                                       | HTTPS (REST / JSON)
                                       v
+-----------------------------------------------------------------------------------+
|                        FastAPI Application Gateway                                 |
|  - Rate Limiter & CORS     - JWT Authentication       - RBAC Authorization        |
|  - Audit Log Middleware    - Exception Handler        - Request Validation        |
+-----------------------------------------------------------------------------------+
           |                     |                      |                   |
           v                     v                      v                   v
     [Auth Service]     [Visitor Engine]       [Gate Operations]     [Reports Service]
     - Login / Reset    - Pre-Registration     - QR Scanner Engine   - Aggregations
     - Role Check       - Approval Workflow    - Check-In / Out      - CSV / PDF Export
           |                     |                      |                   |
           +---------------------+----------------------+-------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                     SQLAlchemy 2.0 ORM & Alembic Migrations                       |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                     MySQL 8.4 LTS Database (InnoDB Engine)                        |
|  - 28+ Normalized Tables   - Foreign Keys & Cascades  - Compound Query Indexes   |
+-----------------------------------------------------------------------------------+
```

### 2. Security Boundaries & Zero-Trust Verification

- **Never Trust Client Status**: Status transitions (`Pending` -> `Approved` -> `Checked In` -> `Checked Out`) are strictly validated on the server. Client interfaces cannot arbitrarily mutate visit state without satisfying approval conditions.
- **Idempotent Gate Transactions**: QR code scans at entry and exit gates are processed using database transactions with row-level locking (`SELECT ... FOR UPDATE`) to prevent concurrent double-entry vulnerabilities.
- **Cryptographic Visitor Pass Tokens**: Visitor QR codes contain an encrypted payload string containing `pass_id`, `visit_id`, `issue_time`, `expiry_time`, and an HMAC-SHA256 signature calculated with a server-side secret.
- **Masked Sensitive Data**: Personal Government IDs (Aadhaar, Passport, National ID) are masked at rest and only exposed partially (e.g. `XXXX-XXXX-1234`) according to regulatory compliance (GDPR, DPDP).
- **Immutable Audit Trail**: Audit log entries are write-only. Regular users and company admins cannot delete or modify historical logs.
