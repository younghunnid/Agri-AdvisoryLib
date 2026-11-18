ALTER TABLE marketplace_listings ADD COLUMN farm_name TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Limited Stock', 'Sold Out'));
ALTER TABLE marketplace_listings ADD COLUMN seller_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN phone_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE marketplace_listings ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE marketplace_listings ADD COLUMN is_fictional_seller INTEGER NOT NULL DEFAULT 1;
ALTER TABLE marketplace_listings ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

UPDATE marketplace_listings SET category = 'Livestock' WHERE category = 'Cattle, goats, and pigs';
UPDATE marketplace_listings SET category = 'Agricultural supplies' WHERE category = 'Other agricultural products';
