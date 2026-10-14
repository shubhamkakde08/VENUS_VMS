# VISITFLOW — Role-Based Access Control (RBAC) Matrix

### 1. Default System Roles

| Role Code | Role Name | Primary Responsibility |
|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Cross-tenant configuration, system settings, global audit, maintenance |
| `COMPANY_ADMIN` | Company Administrator | Tenant masters, departments, employees, approval policies, reports |
| `RECEPTIONIST` | Receptionist | Walk-in visitor creation, queue management, badge printing, host lookup |
| `SECURITY_GUARD` | Security Guard | QR pass scanning, gate check-in/out, vehicle/material logging, overstay alerts |
| `EMPLOYEE_HOST` | Employee / Host | Pre-register guests, approve/reject direct invites, track arrival, confirm departure |
| `DEPT_HEAD` | Department Head | Level-2 approval for high-risk categories, department visitor history & reports |
| `FACILITY_MGR` | Facility Manager | Multi-building capacity management, gate configuration, evacuation muster |
| `AUDITOR` | Auditor / Read-only | Read-only inspection of visitor registers, compliance reports, and audit logs |

### 2. Functional Permission Grid

| Module & Permission | Super Admin | Company Admin | Receptionist | Security Guard | Employee Host | Dept Head | Facility Mgr | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Authentication & Profile** |
| `auth:login` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `auth:reset_password` | Yes | Yes | Self | Self | Self | Self | Self | Self |
| `user:manage` | Yes | Yes | No | No | No | No | No | No |
| **Masters Management** |
| `masters:company:crud` | Yes | Read | No | No | No | No | No | Read |
| `masters:location:crud` | Yes | Yes | Read | Read | Read | Read | Yes | Read |
| `masters:department:crud`| Yes | Yes | Read | Read | Read | Read | Read | Read |
| `masters:employee:crud`  | Yes | Yes | Read | Read | Read | Read | Read | Read |
| `masters:gates:crud`     | Yes | Yes | Read | Read | No | No | Yes | Read |
| `masters:categories`     | Yes | Yes | Read | Read | Read | Read | Read | Read |
| **Visitor Pre-Registration** |
| `visitor:preregister`    | Yes | Yes | Yes | No | Yes (Self) | Yes | No | No |
| `visitor:walkin_create`  | Yes | Yes | Yes | Yes (Emergency)| No | No | No | No |
| `visitor:reschedule`     | Yes | Yes | Yes | No | Yes (Own) | Yes (Dept) | No | No |
| `visitor:cancel`         | Yes | Yes | Yes | No | Yes (Own) | Yes (Dept) | No | No |
| **Approval Workflow** |
| `approval:level1_host`   | Yes | Yes | No | No | Yes (Assigned)| Yes | No | No |
| `approval:level2_dept`   | Yes | Yes | No | No | No | Yes (Dept) | No | No |
| `approval:security_override` | Yes | Yes | No | Yes (Audit Logged) | No | No | Yes | No |
| **Gate Operations** |
| `gate:qr_scan`           | Yes | Yes | Yes | Yes | No | No | Yes | No |
| `gate:check_in`          | Yes | Yes | Yes | Yes | No | No | No | No |
| `gate:check_out`         | Yes | Yes | Yes | Yes | No | No | No | No |
| `gate:vehicle_pass`      | Yes | Yes | Yes | Yes | No | No | Yes | No |
| `gate:material_pass`     | Yes | Yes | Yes | Yes | No | No | Yes | No |
| **Reporting & Audit** |
| `report:daily_register`  | Yes | Yes | Yes | Yes | Own | Dept | Yes | Yes |
| `report:export_csv_pdf`  | Yes | Yes | Read | No | No | Dept | Yes | Yes |
| `audit:view_trail`       | Yes | Yes | No | No | No | No | No | Yes |
| `settings:manage`        | Yes | Yes | No | No | No | No | Yes (Gates) | No |
