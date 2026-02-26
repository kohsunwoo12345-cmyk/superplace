-- Add rating and reviewCount columns to StoreProduct table
-- This allows products to display star ratings automatically

ALTER TABLE StoreProduct ADD COLUMN rating REAL DEFAULT 0.0;
ALTER TABLE StoreProduct ADD COLUMN reviewCount INTEGER DEFAULT 0;

-- Update existing products with default rating
UPDATE StoreProduct SET rating = 4.5, reviewCount = 0 WHERE rating IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_store_product_rating ON StoreProduct(rating);

-- Sample update queries for setting ratings:
-- UPDATE StoreProduct SET rating = 4.8, reviewCount = 127 WHERE id = 'product-id-1';
-- UPDATE StoreProduct SET rating = 4.2, reviewCount = 45 WHERE id = 'product-id-2';

-- Query to find top-rated products:
-- SELECT id, name, rating, reviewCount FROM StoreProduct WHERE active = 1 ORDER BY rating DESC, reviewCount DESC LIMIT 10;
