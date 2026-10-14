# VISITFLOW — Enterprise Visitor Management System (VMS)

VISITFLOW is a production-grade enterprise visitor management, gate security, and approval workflow platform built for corporate headquarters, manufacturing plants, multi-tenant commercial towers, and research campuses.

---

## System Architecture

```text
visitflow/
├── frontend/               # React 19 + TypeScript + Tailwind CSS v4 + Motion
│   ├── public/manifest.json# PWA Manifest configuration
│   ├── src/
│   │   ├── components/     # Enterprise SAP Fiori inspired UI components
│   │   ├── services/       # In-memory reactive state engine matching MySQL schemas
│   │   └── types/          # Strict TypeScript definitions for all 28+ entities
├── backend/                # Python FastAPI + SQLAlchemy 2.0 Async REST API
│   ├── app/
│   │   ├── core/           # Security, HMAC-SHA256 tokens, JWT, configuration
│   │   ├── models/         # SQLAlchemy ORM models for all 28 tables
│   │   ├── schemas/        # Pydantic v2 validation schemas
│   │   └── main.py         # FastAPI application entrypoint
│   ├── Dockerfile          # Container configuration for backend deployment
│   └── requirements.txt    # Python dependencies
├── database/
│   ├── schema.sql          # Complete MySQL 8.4 LTS DDL with InnoDB & Foreign Keys
│   └── seed.sql            # Enterprise seed data with 8 roles & initial visits
├── docs/
│   ├── architecture.md     # Multi-tier system architecture
│   ├── er-diagram.md       # Mermaid ER diagram and entity inventory
│   ├── api-specification.md# OpenAPI REST specification
│   └── rbac-matrix.md      # Role-Based Access Control matrix
├── docker-compose.yml      # Orchestrates MySQL 8.4 LTS + FastAPI Backend
└── PROJECT_STATUS.md       # Phased implementation progress
```

---

## Quick Start (Docker Full-Stack)

To spin up the authoritative MySQL 8.4 LTS database container and FastAPI backend:

```bash
docker compose up --build -d
```

- **FastAPI OpenAPI Swagger UI**: `http://localhost:8000/docs`
- **FastAPI ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`
- **MySQL 8.4 Port**: `localhost:3306` (Database: `visitflow_db`, User: `visitflow_app`)

---

## 8 Enterprise Roles (Pre-Configured Personas)

Use the Role Switcher in the top header to evaluate permissions across all modules:

1. **Super Administrator** (`superadmin@visitflow.io`): Cross-tenant control & system settings
2. **Company Administrator** (`admin@acmecorp.com`): Master records & company policies
3. **Receptionist** (`reception@acmecorp.com`): Walk-in registration, arrival queue & badge printing
4. **Security Guard** (`security@acmecorp.com`): Mobile/touch QR camera scanner, check-in/out, material inspection
5. **Employee / Host** (`alex.turner@acmecorp.com`): Pre-register visitors & host-level approvals
6. **Department Head** (`sarah.chen@acmecorp.com`): Confidential & high-risk Level-2 approvals
7. **Facility Manager** (`marcus.vance@acmecorp.com`): Perimeter gates & emergency evacuation muster
8. **Auditor / Read-Only** (`auditor@acmecorp.com`): Statutory visitor registers & immutable audit trail
