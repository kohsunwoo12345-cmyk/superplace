-- 리뷰 시스템 마이그레이션
-- 생성일: 2026-02-26

-- 제품 리뷰 테이블
CREATE TABLE IF NOT EXISTS ProductReviews (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT,
  userId TEXT NOT NULL,
  userName TEXT,
  userEmail TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT,  -- JSON array of image URLs
  isVerifiedPurchase INTEGER DEFAULT 0,
  helpfulCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES StoreProducts(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON ProductReviews(productId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON ProductReviews(userId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON ProductReviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON ProductReviews(createdAt DESC);

-- 리뷰 도움됨 테이블 (중복 방지)
CREATE TABLE IF NOT EXISTS ReviewHelpful (
  id TEXT PRIMARY KEY,
  reviewId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewId, userId),
  FOREIGN KEY (reviewId) REFERENCES ProductReviews(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON ReviewHelpful(reviewId);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON ReviewHelpful(userId);

-- 제품 문의 테이블
CREATE TABLE IF NOT EXISTS ProductInquiries (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT,
  userId TEXT NOT NULL,
  userName TEXT,
  userEmail TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'shipping', 'payment', 'product', 'etc')),
  isSecret INTEGER DEFAULT 0,
  question TEXT NOT NULL,
  answer TEXT,
  answeredBy TEXT,
  answeredByEmail TEXT,
  answeredAt TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES StoreProducts(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_product_inquiries_product ON ProductInquiries(productId);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_user ON ProductInquiries(userId);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_status ON ProductInquiries(status);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_created ON ProductInquiries(createdAt DESC);

-- 장바구니 테이블
CREATE TABLE IF NOT EXISTS ShoppingCart (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  studentCount INTEGER DEFAULT 1,
  addedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, productId),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (productId) REFERENCES StoreProducts(id)
);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON ShoppingCart(userId);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product ON ShoppingCart(productId);

-- 찜하기 테이블
CREATE TABLE IF NOT EXISTS Wishlist (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  addedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, productId),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (productId) REFERENCES StoreProducts(id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON Wishlist(userId);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON Wishlist(productId);

-- 최근 본 상품 테이블
CREATE TABLE IF NOT EXISTS RecentlyViewed (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  viewedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, productId),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (productId) REFERENCES StoreProducts(id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON RecentlyViewed(userId);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed ON RecentlyViewed(viewedAt DESC);
