-- ==============================================================================
-- VENUS PIPES AND TUBES LIMITED — SEED DATA
-- Database: MySQL 8.0+ / 8.4 LTS
-- ==============================================================================

USE venus_vms_db;

-- 1. SEED USER MASTER (USERNAME: firstname.lastname)
INSERT INTO user_master (username, first_name, last_name, emp_code, department, role, password_hash, status)
VALUES
('shubham.kakde', 'Shubham', 'Kakde', 'VPT-1001', 'IT & Systems', 'ADMIN', '$2b$12$e8Y5t1R1N50M6f.mO5s9aenwB1z9T8f8i9sF.nK0h/L1s3t0yQ0lq', 'ACTIVE'),
('guard.patil', 'Ramesh', 'Patil', 'VPT-3021', 'Security Operations', 'SECURITY', '$2b$12$e8Y5t1R1N50M6f.mO5s9aenwB1z9T8f8i9sF.nK0h/L1s3t0yQ0lq', 'ACTIVE'),
('hr.sharma', 'Priya', 'Sharma', 'VPT-2015', 'Human Resources', 'HR', '$2b$12$e8Y5t1R1N50M6f.mO5s9aenwB1z9T8f8i9sF.nK0h/L1s3t0yQ0lq', 'ACTIVE'),
('jayesh.patel', 'Jayesh', 'Patel', 'VPT-1040', 'Seamless Pipes Mill', 'HOST', '$2b$12$e8Y5t1R1N50M6f.mO5s9aenwB1z9T8f8i9sF.nK0h/L1s3t0yQ0lq', 'ACTIVE')
ON DUPLICATE KEY UPDATE username=username;

-- 2. SEED DYNAMIC FIELD CONFIGS
INSERT INTO gatepass_field_configs (field_id, label_name, section_name, field_state)
VALUES
('visitorName', 'Full Legal Name', 'Personal', 'MANDATORY'),
('visitorPhone', 'Phone Number', 'Personal', 'MANDATORY'),
('company', 'Visitor Company / Vendor', 'Personal', 'MANDATORY'),
('idType', 'Government ID Type', 'Personal', 'MANDATORY'),
('idNumber', 'ID Card Reference Number', 'Personal', 'MANDATORY'),
('category', 'Visitor Category', 'Personal', 'OPTIONAL'),
('hostName', 'Internal Host Employee', 'Host Route', 'MANDATORY'),
('purpose', 'Purpose of Visit', 'Host Route', 'MANDATORY'),
('accessZone', 'Clearance Zone Access', 'Host Route', 'OPTIONAL'),
('vehicleNo', 'Vehicle Registration Number', 'Security', 'OPTIONAL'),
('assets', 'Material / Assets Carried', 'Security', 'OPTIONAL'),
('photo', 'Webcam Portrait Photo', 'Security', 'MANDATORY')
ON DUPLICATE KEY UPDATE label_name=VALUES(label_name);

-- 3. SEED DAILY PASS COUNTER (e.g. for today 141026, starting at 4)
INSERT INTO daily_pass_counters (date_key, last_seq)
VALUES
('141026', 4)
ON DUPLICATE KEY UPDATE last_seq=VALUES(last_seq);

-- 4. SEED SAMPLE GATE PASSES (GP141026-001, GP141026-002, etc.)
INSERT INTO gate_passes (
    pass_id, date_key, seq_number, visitor_name, phone_number, company_name, 
    govt_id_type, govt_id_number, visitor_category, photo_url, host_employee_name, 
    purpose_of_visit, access_zone, entry_gate, vehicle_plate_no, material_assets_carried, 
    ppe_helmet, ppe_vest, ppe_shoes, status, check_in_time, check_out_time, created_by_username
) VALUES
(
    'GP141026-001', '141026', 1, 'Vikram Rathore', '+91 98201 55432', 'Tata Advanced Materials',
    'Aadhaar Card', '8821-9921-4412', 'Vendor / Supplier', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'Er. Jayesh Patel', 'Mill Roll Calibration', 'Seamless Pipes Mill Floor', 'Gate 01 Admin',
    'GJ 12 AB 9988', 'Tool Calibration Kit #TC-991', TRUE, TRUE, TRUE, 'INSIDE', '2026-10-14 08:30:00', NULL, 'guard.patil'
),
(
    'GP141026-002', '141026', 2, 'Ananya Deshmukh', '+91 98112 33445', 'TUV Rheinland India',
    'PAN Card', 'ABCDE1234F', 'Official Auditor', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'Dr. K. S. Varma', 'ISO 9001 Plant Audit', 'NDT & Hydro Testing Lab', 'Gate 01 Admin',
    'GJ 01 Q 5541', 'NDT Ultrasonic Gauge & iPad', TRUE, TRUE, FALSE, 'INSIDE', '2026-10-14 09:15:00', NULL, 'guard.patil'
),
(
    'GP141026-003', '141026', 3, 'Gurpreet Singh', '+91 97200 44551', 'Punjab Logistics Fleet',
    'Driving License', 'PB-08-2022-9988', 'Transporter Driver', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'Sanjay Joshi', 'SS 304 Raw Pipe Coil Delivery', 'Heavy Yard & Loading Bay', 'Gate 02 Logistics',
    'PB 08 CX 1290', 'Delivery Challan #DC-8812', TRUE, TRUE, FALSE, 'INSIDE', '2026-10-14 09:45:00', NULL, 'guard.patil'
),
(
    'GP141026-004', '141026', 4, 'Amitabh Sen', '+91 99001 22334', 'Siemens Automation Ltd',
    'Passport', 'Z6621980', 'Machinery Contractor', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
    'Er. Jayesh Patel', 'PLC Drive Maintenance', 'Seamless Pipes Mill Floor', 'Gate 01 Admin',
    NULL, 'Fluke Multimeter', TRUE, TRUE, TRUE, 'CHECKED_OUT', '2026-10-14 07:30:00', '2026-10-14 10:30:00', 'guard.patil'
)
ON DUPLICATE KEY UPDATE pass_id=pass_id;

-- 5. SEED ROLE PERMISSIONS MATRIX
INSERT INTO role_permissions_matrix (perm_id, name, can_security, can_hr, can_admin)
VALUES
('perm_create', 'Create Visitor Gate Pass', TRUE, TRUE, TRUE),
('perm_checkout', 'Exit Check-Out Scanner', TRUE, FALSE, TRUE),
('perm_approve', 'Approve Contractor Pre-Passes', FALSE, TRUE, TRUE),
('perm_field_cfg', 'Configure Form Mandatory Fields', FALSE, FALSE, TRUE),
('perm_user_mstr', 'Manage User Master (Add/Edit Users)', FALSE, FALSE, TRUE),
('perm_export', 'Export Pass CSV Reports', TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
