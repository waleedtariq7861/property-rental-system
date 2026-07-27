-- RentEase Phase 2, Day 1 migration
-- Run once against an existing Phase 1 database before seed.sql.

USE rentease_db;

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_phase2_day1_properties//

CREATE PROCEDURE migrate_phase2_day1_properties()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = 'properties'
      AND constraint_name = 'chk_properties_monthly_rent'
      AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE properties DROP CHECK chk_properties_monthly_rent;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND column_name = 'monthly_rent'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND column_name = 'price'
  ) THEN
    ALTER TABLE properties
      CHANGE COLUMN monthly_rent price DECIMAL(12, 2) UNSIGNED NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND column_name = 'main_image'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE properties
      CHANGE COLUMN main_image image_url VARCHAR(500) NULL;
  END IF;

  ALTER TABLE properties
    MODIFY COLUMN property_type ENUM(
      'apartment',
      'house',
      'villa',
      'office',
      'studio',
      'portion',
      'room',
      'shop'
    ) NOT NULL;

  IF EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND index_name = 'idx_properties_monthly_rent'
  ) THEN
    ALTER TABLE properties DROP INDEX idx_properties_monthly_rent;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND index_name = 'idx_properties_price'
  ) THEN
    ALTER TABLE properties ADD INDEX idx_properties_price (price);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = DATABASE()
      AND table_name = 'properties'
      AND constraint_name = 'chk_properties_price'
      AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT chk_properties_price CHECK (price > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND index_name = 'idx_properties_available_newest'
  ) THEN
    ALTER TABLE properties
      ADD INDEX idx_properties_available_newest (
        approval_status,
        availability_status,
        created_at
      );
  END IF;
END//

CALL migrate_phase2_day1_properties()//
DROP PROCEDURE migrate_phase2_day1_properties//

DELIMITER ;
