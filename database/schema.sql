-- ==============================================================================
-- VENUS PIPES AND TUBES LIMITED — ENTERPRISE GATE PASS VMS
-- Database: MySQL 8.0+ / 8.4 LTS (InnoDB Engine, utf8mb4)
-- Location: Bhuj Manufacturing Facility & Corporate Campuses
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS venus_vms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE venus_vms_db;

-- 1. USER MASTER TABLE (LOGIN BY USERNAME: firstname.lastname)
DROP TABLE IF EXISTS user_master;
CREATE TABLE user_master (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,       -- e.g. shubham.kakde, guard.patil, hr.sharma
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    emp_code VARCHAR(30) UNIQUE,
    department VARCHAR(80) NOT NULL,
    role ENUM('ADMIN', 'SECURITY', 'HR', 'HOST') NOT NULL DEFAULT 'SECURITY',
    password_hash VARCHAR(255) NOT NULL,        -- Bcrypt or SHA-256 hash
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_login (username, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DYNAMIC FORM FIELD CONFIGURATION TABLE (MANDATORY / OPTIONAL / DISABLED)
DROP TABLE IF EXISTS gatepass_field_configs;
CREATE TABLE gatepass_field_configs (
    field_id VARCHAR(50) PRIMARY KEY,          -- e.g. 'visitorName', 'vehicleNo', 'photo'
    label_name VARCHAR(100) NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    field_state ENUM('MANDATORY', 'OPTIONAL', 'DISABLED') NOT NULL DEFAULT 'MANDATORY',
    updated_by VARCHAR(80),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DAILY GATE PASS COUNTER FOR ATOMIC CONCURRENCY (GP<DDMMYY>-<SEQ>)
DROP TABLE IF EXISTS daily_pass_counters;
CREATE TABLE daily_pass_counters (
    date_key CHAR(6) PRIMARY KEY,              -- Format DDMMYY (e.g. '141026')
    last_seq INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VISITOR GATE PASS MAIN REGISTER
DROP TABLE IF EXISTS gate_passes;
CREATE TABLE gate_passes (
    pass_id VARCHAR(25) PRIMARY KEY,           -- e.g. 'GP141026-001'
    date_key CHAR(6) NOT NULL,                 -- '141026'
    seq_number INT UNSIGNED NOT NULL,          -- 1, 2, 3...
    
    -- Visitor Details
    visitor_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(25) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    govt_id_type VARCHAR(40),
    govt_id_number VARCHAR(80),
    visitor_category VARCHAR(60),
    photo_url LONGTEXT,
    
    -- Host and Routing
    host_employee_name VARCHAR(120) NOT NULL,
    purpose_of_visit VARCHAR(255) NOT NULL,
    access_zone VARCHAR(100),
    entry_gate VARCHAR(50) DEFAULT 'Gate 01 Admin',
    
    -- Assets & PPE
    vehicle_plate_no VARCHAR(40),
    material_assets_carried TEXT,
    ppe_helmet BOOLEAN DEFAULT TRUE,
    ppe_vest BOOLEAN DEFAULT TRUE,
    ppe_shoes BOOLEAN DEFAULT FALSE,
    
    -- Status & Audit Log
    status ENUM('INSIDE', 'CHECKED_OUT', 'CANCELLED') NOT NULL DEFAULT 'INSIDE',
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    created_by_username VARCHAR(80) NOT NULL,
    ai_risk_score VARCHAR(30) NULL,
    ai_risk_analysis TEXT NULL,
    
    FOREIGN KEY (created_by_username) REFERENCES user_master(username),
    INDEX (date_key),
    INDEX (status),
    INDEX (check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROLE PERMISSIONS MATRIX TABLE
DROP TABLE IF EXISTS role_permissions_matrix;
CREATE TABLE role_permissions_matrix (
    perm_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    can_security BOOLEAN NOT NULL DEFAULT FALSE,
    can_hr BOOLEAN NOT NULL DEFAULT FALSE,
    can_admin BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AUDIT TRAIL LOGS
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LOGO MASTER & ENTERPRISE BRANDING CONFIGURATION TABLE
DROP TABLE IF EXISTS logo_master;
CREATE TABLE logo_master (
    brand_id VARCHAR(50) PRIMARY KEY DEFAULT 'venus_main',
    company_name VARCHAR(255) NOT NULL DEFAULT 'Venus Pipes and Tubes Limited',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Enterprise Visitor Management System (VMS)',
    plant_location VARCHAR(255) NOT NULL DEFAULT 'Bhuj Manufacturing Facility, Kutch, Gujarat',
    logo_url LONGTEXT NOT NULL,
    badge_watermark_url LONGTEXT NULL,
    show_logo_on_badge BOOLEAN NOT NULL DEFAULT TRUE,
    show_logo_on_header BOOLEAN NOT NULL DEFAULT TRUE,
    primary_color VARCHAR(20) NOT NULL DEFAULT '#1C2E63',
    updated_by VARCHAR(80) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ATOMIC STORED PROCEDURE TO GENERATE NEXT SERIES PASS ID (GP<DDMMYY>-<3-digit SEQ>)
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_generate_gate_pass_id$$
CREATE PROCEDURE sp_generate_gate_pass_id (
    IN p_date_key CHAR(6),                     -- Pass current DDMMYY e.g. '141026'
    OUT p_generated_pass_id VARCHAR(25)
)
BEGIN
    DECLARE v_seq INT UNSIGNED;
    
    -- Atomic upsert daily sequence
    INSERT INTO daily_pass_counters (date_key, last_seq)
    VALUES (p_date_key, 1)
    ON DUPLICATE KEY UPDATE last_seq = last_seq + 1;
    
    SELECT last_seq INTO v_seq
    FROM daily_pass_counters
    WHERE date_key = p_date_key;
    
    -- Construct format: GP<DDMMYY>-<3-digit SEQ> e.g. GP141026-001
    SET p_generated_pass_id = CONCAT('GP', p_date_key, '-', LPAD(v_seq, 3, '0'));
END$$
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
