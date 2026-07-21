-- RentEase development seed data
-- Run schema.sql first. These records are fictional and for local development only.
--
-- Every sample account uses the same pre-generated bcrypt hash. Its plaintext is
-- intentionally not published because Phase 1 has no authentication workflow.
-- In Phase 2, replace these hashes through the secure password creation/reset flow.

USE rentease_db;

START TRANSACTION;

INSERT INTO users
  (id, full_name, email, phone, password_hash, role, account_status)
VALUES
  (1, 'Ayesha Khan', 'admin@rentease.test', '+92-300-0000001', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'active'),
  (2, 'Ali Raza', 'ali.owner@rentease.test', '+92-300-0000002', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'owner', 'active'),
  (3, 'Sara Ahmed', 'sara.owner@rentease.test', '+92-300-0000003', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'owner', 'active'),
  (4, 'Hamza Malik', 'hamza.tenant@rentease.test', '+92-300-0000004', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'tenant', 'active'),
  (5, 'Maham Noor', 'maham.tenant@rentease.test', '+92-300-0000005', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'tenant', 'active'),
  (6, 'Usman Tariq', 'usman.tenant@rentease.test', '+92-300-0000006', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'tenant', 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone = VALUES(phone),
  role = VALUES(role),
  account_status = VALUES(account_status);

INSERT INTO properties
  (
    id,
    owner_id,
    title,
    description,
    property_type,
    property_category,
    monthly_rent,
    security_deposit,
    city,
    area,
    address,
    bedrooms,
    bathrooms,
    property_size,
    size_unit,
    furnished_status,
    parking_available,
    availability_status,
    approval_status,
    main_image
  )
VALUES
  (
    1,
    2,
    'Modern Two-Bed Apartment',
    'A bright apartment with a practical layout, secure entrance, and convenient access to local services.',
    'apartment',
    'residential',
    85000.00,
    170000.00,
    'Islamabad',
    'F-11',
    'Street 14, F-11, Islamabad',
    2,
    2.0,
    1250.00,
    'sq_ft',
    'semi_furnished',
    TRUE,
    'available',
    'approved',
    NULL
  ),
  (
    2,
    2,
    'Family House with Garden',
    'A spacious family home with a private garden, covered parking, and comfortable living areas.',
    'house',
    'residential',
    165000.00,
    330000.00,
    'Rawalpindi',
    'Bahria Town Phase 7',
    'Tulip Block, Bahria Town Phase 7, Rawalpindi',
    4,
    4.5,
    10.00,
    'marla',
    'unfurnished',
    TRUE,
    'available',
    'approved',
    NULL
  ),
  (
    3,
    3,
    'Furnished Studio Near University',
    'A compact furnished studio suited to a student or young professional seeking a central location.',
    'apartment',
    'residential',
    48000.00,
    96000.00,
    'Lahore',
    'Johar Town',
    'Block H, Johar Town, Lahore',
    1,
    1.0,
    620.00,
    'sq_ft',
    'furnished',
    FALSE,
    'available',
    'approved',
    NULL
  ),
  (
    4,
    3,
    'Ground-Floor Family Portion',
    'An independent ground-floor portion with separate access and a quiet residential setting.',
    'portion',
    'residential',
    72000.00,
    144000.00,
    'Karachi',
    'Gulshan-e-Iqbal',
    'Block 13-D, Gulshan-e-Iqbal, Karachi',
    3,
    3.0,
    1800.00,
    'sq_ft',
    'unfurnished',
    TRUE,
    'available',
    'pending',
    NULL
  ),
  (
    5,
    2,
    'Flexible Office Suite',
    'A well-positioned office suite with reception space and flexible rooms for a growing team.',
    'office',
    'commercial',
    130000.00,
    260000.00,
    'Islamabad',
    'Blue Area',
    'Jinnah Avenue, Blue Area, Islamabad',
    0,
    2.0,
    1500.00,
    'sq_ft',
    'semi_furnished',
    TRUE,
    'available',
    'approved',
    NULL
  )
ON DUPLICATE KEY UPDATE
  owner_id = VALUES(owner_id),
  title = VALUES(title),
  description = VALUES(description),
  monthly_rent = VALUES(monthly_rent),
  security_deposit = VALUES(security_deposit),
  availability_status = VALUES(availability_status),
  approval_status = VALUES(approval_status);

COMMIT;
