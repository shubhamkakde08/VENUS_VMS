# VISITFLOW — REST API Specification

### Base URL: `/api/v1`

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`. Responses adhere to standard JSON schemas with HTTP 200/201 on success, and HTTP 400/401/403/404/422 on failure.

---

### 1. Authentication & Session API (`/auth`)

- `POST /auth/login`
  - **Request**: `{ "username": "admin@company.com", "password": "SecurePassword123!" }`
  - **Response 200**: `{ "access_token": "...", "token_type": "bearer", "expires_in": 28800, "user": { ... } }`
- `POST /auth/logout`
  - Invalidates current session/token.
- `POST /auth/refresh`
  - Generates refreshed session token.
- `GET /auth/me`
  - Returns authenticated user profile, assigned roles, and permission list.

---

### 2. Master Management APIs (`/masters`)

- `GET /masters/companies`, `POST /masters/companies`, `PUT /masters/companies/{id}`
- `GET /masters/locations`, `POST /masters/locations`, `PUT /masters/locations/{id}`
- `GET /masters/buildings`, `POST /masters/buildings`
- `GET /masters/floors`, `POST /masters/floors`
- `GET /masters/gates`, `POST /masters/gates`
- `GET /masters/departments`, `POST /masters/departments`
- `GET /masters/employees`, `POST /masters/employees`
- `GET /masters/visitor-categories`
- `GET /masters/visit-purposes`
- `GET /masters/system-settings`, `PUT /masters/system-settings/{key}`

---

### 3. Visitor Pre-Registration & Appointments (`/visits`)

- `POST /visits/pre-register`
  - Creates visitor profile & appointment in `PENDING_APPROVAL` status.
  - Generates auto visitor code (`V-2026-XXXX`).
- `POST /visits/walk-in`
  - Creates walk-in appointment, optionally fast-tracked with host approval.
- `GET /visits`
  - Query params: `status`, `from_date`, `to_date`, `host_id`, `department_id`, `location_id`, `page`, `page_size`.
- `GET /visits/{id}`
  - Detailed view including approvals, passes, vehicles, and materials.
- `PUT /visits/{id}/reschedule`
  - Update date/time; resets pass validity.
- `PUT /visits/{id}/cancel`
  - Cancel visit; revokes existing pass.

---

### 4. Approval Workflow API (`/approvals`)

- `GET /approvals/pending`
  - Returns visits requiring approval by the authenticated user's role/department.
- `POST /approvals/{visit_id}/action`
  - **Request**: `{ "action": "APPROVE" | "REJECT", "comments": "Approved for 2nd floor conference room" }`
  - **Action**: State transition trigger. If final approval, automatically issues cryptographic Visitor Pass.

---

### 5. Pass & QR Gate Operations API (`/gate`)

- `GET /gate/pass/{pass_token}`
  - Verifies QR token, checks revocation, expiration, and current status.
- `POST /gate/check-in`
  - **Request**: `{ "pass_token": "...", "gate_id": 1, "idempotency_key": "uuid-v4", "vehicle_reg": "KA01AB1234", "notes": "" }`
  - Validates pass, checks if already inside (duplicate entry prevention), logs gate transaction with timestamp, marks visit `CHECKED_IN`.
- `POST /gate/check-out`
  - **Request**: `{ "pass_token": "...", "gate_id": 2, "idempotency_key": "uuid-v4" }`
  - Marks visit `CHECKED_OUT`, validates material gate passes (returnable items check), closes vehicle pass.
- `GET /gate/active-visitors`
  - Returns all visitors currently inside the premises with arrival timestamps and overstay alerts.

---

### 6. Analytics, Dashboards & Reports (`/reports`, `/dashboard`)

- `GET /dashboard/kpis`
  - Returns real-time metrics: `today_total`, `currently_inside`, `pending_approvals`, `overdue_count`, `rejected_count`.
- `GET /dashboard/hourly-footfall`
  - Aggregate visits grouped by check-in hour for chart plotting.
- `GET /reports/visitors`
  - Multi-faceted report with pagination, sorting, and CSV export streaming (`Accept: text/csv`).
- `GET /reports/audit-logs`
  - Immutable audit trail query with actor, entity, date range, and IP filter.
