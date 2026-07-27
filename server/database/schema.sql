-- RentEase Phase 1 database foundation
-- Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS rentease_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rentease_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(25) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('tenant', 'owner', 'admin') NOT NULL DEFAULT 'tenant',
  account_status ENUM('pending', 'active', 'suspended', 'deactivated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  property_type ENUM(
    'apartment',
    'house',
    'villa',
    'office',
    'studio',
    'portion',
    'room',
    'shop'
  ) NOT NULL,
  property_category ENUM('residential', 'commercial') NOT NULL DEFAULT 'residential',
  price DECIMAL(12, 2) UNSIGNED NOT NULL,
  security_deposit DECIMAL(12, 2) UNSIGNED NOT NULL DEFAULT 0.00,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL,
  bedrooms SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  bathrooms DECIMAL(3, 1) UNSIGNED NOT NULL DEFAULT 0.0,
  property_size DECIMAL(10, 2) UNSIGNED NULL,
  size_unit ENUM('sq_ft', 'sq_m', 'marla', 'kanal') NOT NULL DEFAULT 'sq_ft',
  furnished_status ENUM('unfurnished', 'semi_furnished', 'furnished') NOT NULL DEFAULT 'unfurnished',
  parking_available BOOLEAN NOT NULL DEFAULT FALSE,
  availability_status ENUM('available', 'rented', 'unavailable') NOT NULL DEFAULT 'available',
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_properties_owner (owner_id),
  KEY idx_properties_location (city, area),
  KEY idx_properties_discovery (approval_status, availability_status, property_category),
  KEY idx_properties_available_newest (approval_status, availability_status, created_at),
  KEY idx_properties_price (price),
  CONSTRAINT fk_properties_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_properties_price CHECK (price > 0),
  CONSTRAINT chk_properties_bathrooms CHECK (bathrooms >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS property_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(180) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_property_images_order (property_id, sort_order),
  KEY idx_property_images_property_main (property_id, is_main),
  CONSTRAINT fk_property_images_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_tenant_property (tenant_id, property_id),
  KEY idx_favorites_property (property_id),
  CONSTRAINT fk_favorites_tenant
    FOREIGN KEY (tenant_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  move_in_date DATE NULL,
  message VARCHAR(1000) NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  owner_response VARCHAR(1000) NULL,
  responded_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_property_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rental_requests_active (tenant_id, active_property_id),
  KEY idx_rental_requests_property_status (property_id, status),
  KEY idx_rental_requests_tenant_status (tenant_id, status),
  CONSTRAINT fk_rental_requests_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_rental_requests_tenant
    FOREIGN KEY (tenant_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

DELIMITER //

CREATE TRIGGER trg_rental_requests_before_insert
BEFORE INSERT ON rental_requests
FOR EACH ROW
BEGIN
  IF NEW.status IN ('pending', 'approved') THEN
    SET NEW.active_property_id = NEW.property_id;
  ELSE
    SET NEW.active_property_id = NULL;
  END IF;
END//

CREATE TRIGGER trg_rental_requests_before_update
BEFORE UPDATE ON rental_requests
FOR EACH ROW
BEGIN
  IF NEW.status IN ('pending', 'approved') THEN
    SET NEW.active_property_id = NEW.property_id;
  ELSE
    SET NEW.active_property_id = NULL;
  END IF;
END//

DELIMITER ;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(25) NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'in_progress', 'resolved', 'spam') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_messages_status_created (status, created_at),
  KEY idx_contact_messages_user (user_id),
  CONSTRAINT fk_contact_messages_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;
