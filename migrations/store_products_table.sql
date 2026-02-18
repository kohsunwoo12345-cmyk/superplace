-- ============================================
-- Store Products Table for AI Bot Shopping Mall
-- ============================================

DROP TABLE IF EXISTS store_products;

CREATE TABLE store_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- academy_operation, marketing_blog, expert
  section TEXT, -- education, marketing, custom
  description TEXT NOT NULL,
  shortDescription TEXT,
  price INTEGER DEFAULT 0,
  monthlyPrice INTEGER,
  yearlyPrice INTEGER,
  features TEXT, -- JSON array
  detailHtml TEXT,
  imageUrl TEXT,
  botId TEXT, -- Optional link to ai_bots table
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_store_products_category ON store_products(category);
CREATE INDEX idx_store_products_active ON store_products(isActive);
CREATE INDEX idx_store_products_featured ON store_products(isFeatured);
CREATE INDEX idx_store_products_order ON store_products(displayOrder);
