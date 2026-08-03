-- RentEase Phase 3, Day 1 migration
-- Adds the basic tenant rental-request module to an existing Phase 2 database.

USE rentease_db;

CREATE TABLE IF NOT EXISTS rental_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  message VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rental_requests_property_status (property_id, status),
  KEY idx_rental_requests_tenant_status (tenant_id, status),
  KEY idx_rental_requests_owner_status (owner_id, status),
  CONSTRAINT fk_rental_requests_property
    FOREIGN KEY (property_id) REFERENCES properties (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_rental_requests_tenant
    FOREIGN KEY (tenant_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_rental_requests_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS trg_rental_requests_before_insert;
DROP TRIGGER IF EXISTS trg_rental_requests_before_update;

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_phase3_day1_rental_requests//

CREATE PROCEDURE migrate_phase3_day1_rental_requests()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE rental_requests
      ADD COLUMN owner_id BIGINT UNSIGNED NULL AFTER tenant_id;
  END IF;

  UPDATE rental_requests rr
  INNER JOIN properties p ON p.id = rr.property_id
  SET rr.owner_id = p.owner_id
  WHERE rr.owner_id IS NULL OR rr.owner_id <> p.owner_id;

  IF EXISTS (
    SELECT 1
    FROM rental_requests
    WHERE owner_id IS NULL
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot migrate rental requests with missing properties.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND index_name = 'uq_rental_requests_active'
  ) THEN
    ALTER TABLE rental_requests DROP INDEX uq_rental_requests_active;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND column_name = 'move_in_date'
  ) THEN
    ALTER TABLE rental_requests DROP COLUMN move_in_date;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND column_name = 'owner_response'
  ) THEN
    ALTER TABLE rental_requests DROP COLUMN owner_response;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE rental_requests DROP COLUMN responded_at;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND column_name = 'active_property_id'
  ) THEN
    ALTER TABLE rental_requests DROP COLUMN active_property_id;
  END IF;

  ALTER TABLE rental_requests
    MODIFY COLUMN owner_id BIGINT UNSIGNED NOT NULL AFTER tenant_id,
    MODIFY COLUMN status ENUM(
      'pending',
      'approved',
      'rejected',
      'cancelled',
      'completed'
    ) NOT NULL DEFAULT 'pending' AFTER owner_id,
    MODIFY COLUMN message VARCHAR(1000) NULL AFTER status,
    MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER message,
    MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND index_name = 'idx_rental_requests_owner_status'
  ) THEN
    ALTER TABLE rental_requests
      ADD INDEX idx_rental_requests_owner_status (owner_id, status);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = 'rental_requests'
      AND constraint_name = 'fk_rental_requests_owner'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE rental_requests
      ADD CONSTRAINT fk_rental_requests_owner
      FOREIGN KEY (owner_id) REFERENCES users (id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END//

CALL migrate_phase3_day1_rental_requests()//
DROP PROCEDURE migrate_phase3_day1_rental_requests//

DELIMITER ;
