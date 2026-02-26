-- Create ProductViewLog table
-- This table tracks which users view which products in the store

CREATE TABLE IF NOT EXISTS ProductViewLog (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userEmail TEXT,
  userName TEXT,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (productId) REFERENCES StoreProduct(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_view_log_user ON ProductViewLog(userId);
CREATE INDEX IF NOT EXISTS idx_product_view_log_product ON ProductViewLog(productId);
CREATE INDEX IF NOT EXISTS idx_product_view_log_created ON ProductViewLog(createdAt);
CREATE INDEX IF NOT EXISTS idx_product_view_log_user_product ON ProductViewLog(userId, productId);

-- Sample query to get top viewed products
-- SELECT productName, COUNT(*) as viewCount 
-- FROM ProductViewLog 
-- GROUP BY productId, productName 
-- ORDER BY viewCount DESC 
-- LIMIT 10;

-- Sample query to get user's view history
-- SELECT p.name, pvl.createdAt 
-- FROM ProductViewLog pvl
-- JOIN StoreProduct p ON p.id = pvl.productId
-- WHERE pvl.userId = ?
-- ORDER BY pvl.createdAt DESC;
