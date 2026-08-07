-- ============================================================
-- Payroll System — MySQL schema
-- คณะแพทยศาสตร์ มหาวิทยาลัยธรรมศาสตร์
-- ใช้ได้ทั้งกับ docker-entrypoint-initdb.d และรันซ้ำจาก backend (IF NOT EXISTS)
-- ============================================================

CREATE DATABASE IF NOT EXISTS payroll
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE payroll;

-- ---- บุคลากร (master data — ปกติดึงจาก PMIS) ----
CREATE TABLE IF NOT EXISTS employees (
  emp_code    INT UNSIGNED NOT NULL,
  id_card     VARCHAR(13)  NOT NULL,
  prefix      VARCHAR(30)  DEFAULT NULL,
  first_name  VARCHAR(100) DEFAULT NULL,
  last_name   VARCHAR(100) DEFAULT NULL,
  position    VARCHAR(150) DEFAULT NULL,
  department  VARCHAR(150) DEFAULT NULL,
  bank_name   VARCHAR(100) DEFAULT NULL,
  acc_num     VARCHAR(50)  DEFAULT NULL,
  profile_img VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (emp_code),
  KEY idx_employees_id_card (id_card)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- บัญชีผู้ใช้ระบบ + สิทธิ์ (ข้อ 5) ----
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('superadmin','treasury','source','user') NOT NULL DEFAULT 'user',
  emp_code      INT UNSIGNED DEFAULT NULL,
  name          VARCHAR(150) DEFAULT NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- ประเภทรายได้ / รายการหัก / หน่วยงาน ----
CREATE TABLE IF NOT EXISTS income_types (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deduction_types (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- ชุดข้อมูลที่นำเข้า (batch) ----
CREATE TABLE IF NOT EXISTS batches (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category     ENUM('income','deduction','budget','bank') NOT NULL,
  type_id      INT UNSIGNED DEFAULT NULL,
  type_name    VARCHAR(255) DEFAULT NULL,
  month        CHAR(7)      NOT NULL,               -- YYYY-MM
  department   VARCHAR(150) DEFAULT NULL,
  status       ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  file_name    VARCHAR(255) DEFAULT NULL,
  uploaded_by  VARCHAR(100) DEFAULT NULL,
  uploaded_at  TIMESTAMP    NULL DEFAULT NULL,
  confirmed_by VARCHAR(100) DEFAULT NULL,
  confirmed_at TIMESTAMP    NULL DEFAULT NULL,
  note         VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_batches_filter (category, month, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- รายการย่อยในแต่ละชุด ----
CREATE TABLE IF NOT EXISTS records (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id  INT UNSIGNED NOT NULL,
  id_card   VARCHAR(13)  NOT NULL,
  emp_code  INT UNSIGNED DEFAULT NULL,
  fullname  VARCHAR(200) DEFAULT NULL,
  position  VARCHAR(150) DEFAULT NULL,
  amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax       DECIMAL(12,2) NOT NULL DEFAULT 0,
  net       DECIMAL(12,2) NOT NULL DEFAULT 0,
  bank_name VARCHAR(100) DEFAULT NULL,
  acc_num   VARCHAR(50)  DEFAULT NULL,
  status    ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (id),
  KEY idx_records_batch (batch_id),
  KEY idx_records_idcard (id_card),
  CONSTRAINT fk_records_batch FOREIGN KEY (batch_id)
    REFERENCES batches (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
