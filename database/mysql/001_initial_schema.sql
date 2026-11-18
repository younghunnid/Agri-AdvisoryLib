-- Team 8: Inclusive Agricultural e-Advisory Platform (Agri-Advisory Liberia)
-- Isolated MySQL 8 / MariaDB compatible schema (utf8mb4, InnoDB, Foreign Keys)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL UNIQUE,
  email VARCHAR(160) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS farmer_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  county VARCHAR(60) NOT NULL,
  preferred_language VARCHAR(16) NOT NULL DEFAULT 'en',
  crops_of_interest JSON NOT NULL,
  farm_notes TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expert_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  specialty VARCHAR(140) NOT NULL,
  county VARCHAR(60) NOT NULL,
  bio TEXT NULL,
  approval_status ENUM('pending', 'approved', 'suspended') NOT NULL DEFAULT 'pending',
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL,
  CONSTRAINT fk_ep_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ep_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS language_preferences (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  language_code VARCHAR(16) NOT NULL DEFAULT 'en',
  tts_enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crops (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  local_names VARCHAR(160) NOT NULL DEFAULT '',
  summary VARCHAR(500) NOT NULL,
  season_note VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guide_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agricultural_guides (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  crop_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  content_markdown MEDIUMTEXT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  language_code VARCHAR(16) NOT NULL DEFAULT 'en',
  source_attribution VARCHAR(255) NOT NULL,
  is_sample_demo TINYINT(1) NOT NULL DEFAULT 1,
  is_pest_disease TINYINT(1) NOT NULL DEFAULT 0,
  review_status ENUM('draft', 'pending_review', 'approved', 'changes_requested') NOT NULL DEFAULT 'pending_review',
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  reviewed_by_name VARCHAR(120) NULL,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  last_reviewed_at DATE NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  offline_available TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guides_public (is_published, review_status, crop_id, category_id),
  CONSTRAINT fk_ag_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ag_cat FOREIGN KEY (category_id) REFERENCES guide_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ag_rev_user FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ag_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guide_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guide_id BIGINT UNSIGNED NOT NULL,
  language_code VARCHAR(16) NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  content_markdown MEDIUMTEXT NOT NULL,
  translation_status ENUM('draft', 'reviewed', 'rejected') NOT NULL DEFAULT 'draft',
  reviewed_by VARCHAR(120) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_guide_lang (guide_id, language_code),
  CONSTRAINT fk_gt_guide FOREIGN KEY (guide_id) REFERENCES agricultural_guides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guide_reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guide_id BIGINT UNSIGNED NOT NULL,
  reviewer_id BIGINT UNSIGNED NULL,
  decision ENUM('approved', 'changes_requested', 'unpublished') NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gr_guide FOREIGN KEY (guide_id) REFERENCES agricultural_guides(id) ON DELETE CASCADE,
  CONSTRAINT fk_gr_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS advisory_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  farmer_id BIGINT UNSIGNED NOT NULL,
  crop_id BIGINT UNSIGNED NULL,
  topic VARCHAR(80) NOT NULL,
  county VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Submitted', 'Assigned', 'Awaiting Clarification', 'Answered', 'Closed') NOT NULL DEFAULT 'Submitted',
  assigned_expert_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_aq_farmer (farmer_id, status),
  INDEX idx_aq_expert (assigned_expert_id, status),
  CONSTRAINT fk_aq_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aq_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
  CONSTRAINT fk_aq_expert FOREIGN KEY (assigned_expert_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS advisory_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  sender_role ENUM('farmer', 'expert', 'admin') NOT NULL,
  message_text TEXT NOT NULL,
  is_official_expert_advice TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_am_question FOREIGN KEY (question_id) REFERENCES advisory_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_am_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expert_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  expert_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ea_question FOREIGN KEY (question_id) REFERENCES advisory_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_expert FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_admin FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_advice (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  source_type ENUM('ai_advisor', 'guide', 'expert') NOT NULL,
  title VARCHAR(180) NOT NULL,
  crop_name VARCHAR(80) NOT NULL DEFAULT '',
  content_text MEDIUMTEXT NOT NULL,
  metadata_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  contact_info VARCHAR(140) NOT NULL DEFAULT '',
  county VARCHAR(60) NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status ENUM('new', 'reviewed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rate_key VARCHAR(96) NOT NULL,
  action_type VARCHAR(48) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_lookup (rate_key, action_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(40) NOT NULL DEFAULT 'system',
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(60) NOT NULL,
  target_id VARCHAR(64) NOT NULL DEFAULT '',
  details_json JSON NOT NULL,
  ip_hash VARCHAR(64) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
