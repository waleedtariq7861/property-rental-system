-- RentEase development seed data
-- Run schema.sql first. These records are fictional and for local development only.
--
-- Every sample account uses the same non-production bcrypt placeholder hash.
-- No plaintext password or private credential is stored in this file. These
-- records are display fixtures, not login credentials. To create a test admin,
-- register normally so bcrypt hashes the chosen password, then promote that
-- local account with the safe SQL procedure documented in README.md.

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
    price,
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
    image_url,
    created_at
  )
VALUES
  (
    1,
    2,
    'Contemporary Apartment in F-11',
    'A bright two-bedroom apartment with a practical open-plan layout, secure entrance, reserved parking, and easy access to neighborhood shops.',
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
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP - INTERVAL 2 DAY
  ),
  (
    2,
    2,
    'Family House with Private Garden',
    'A spacious family home with a landscaped garden, covered parking, generous living areas, and a quiet location near schools.',
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
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP - INTERVAL 4 DAY
  ),
  (
    3,
    3,
    'Luxury Villa in DHA Phase 6',
    'A refined villa with spacious bedrooms, elegant reception areas, a private lawn, and secure parking in a sought-after neighborhood.',
    'villa',
    'residential',
    325000.00,
    650000.00,
    'Lahore',
    'DHA Phase 6',
    'Block C, DHA Phase 6, Lahore',
    5,
    5.5,
    1.00,
    'kanal',
    'semi_furnished',
    TRUE,
    'available',
    'approved',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP - INTERVAL 1 DAY
  ),
  (
    4,
    3,
    'Executive Office in Clifton',
    'A polished office suite with a reception area, meeting room, flexible team space, backup power, and convenient building access.',
    'office',
    'commercial',
    185000.00,
    370000.00,
    'Karachi',
    'Clifton',
    'Block 5, Clifton, Karachi',
    0,
    2.0,
    1600.00,
    'sq_ft',
    'semi_furnished',
    TRUE,
    'available',
    'approved',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP - INTERVAL 3 DAY
  ),
  (
    5,
    2,
    'Furnished Studio near Gulberg',
    'A thoughtfully furnished studio for a student or professional, with natural light, built-in storage, and quick access to central Lahore.',
    'studio',
    'residential',
    52000.00,
    104000.00,
    'Lahore',
    'Gulberg III',
    'Main Boulevard, Gulberg III, Lahore',
    1,
    1.0,
    580.00,
    'sq_ft',
    'furnished',
    FALSE,
    'available',
    'approved',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    CURRENT_TIMESTAMP
  )
ON DUPLICATE KEY UPDATE
  owner_id = VALUES(owner_id),
  title = VALUES(title),
  description = VALUES(description),
  property_type = VALUES(property_type),
  property_category = VALUES(property_category),
  price = VALUES(price),
  security_deposit = VALUES(security_deposit),
  city = VALUES(city),
  area = VALUES(area),
  address = VALUES(address),
  bedrooms = VALUES(bedrooms),
  bathrooms = VALUES(bathrooms),
  property_size = VALUES(property_size),
  size_unit = VALUES(size_unit),
  furnished_status = VALUES(furnished_status),
  parking_available = VALUES(parking_available),
  availability_status = VALUES(availability_status),
  approval_status = VALUES(approval_status),
  image_url = VALUES(image_url),
  created_at = VALUES(created_at);

COMMIT;
