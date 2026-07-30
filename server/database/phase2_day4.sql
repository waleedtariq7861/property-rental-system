-- RentEase Phase 2, Day 4 migration
-- Run once against an existing Phase 2 Day 3 database.

USE rentease_db;

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_phase2_day4_properties//

CREATE PROCEDURE migrate_phase2_day4_properties()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'properties'
      AND column_name = 'contact_number'
  ) THEN
    ALTER TABLE properties
      ADD COLUMN contact_number VARCHAR(25) NULL AFTER image_url;
  END IF;
END//

CALL migrate_phase2_day4_properties()//
DROP PROCEDURE migrate_phase2_day4_properties//

DELIMITER ;
