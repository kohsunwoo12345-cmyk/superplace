-- Landing Pages 테이블 확인 및 수정
-- 실행 전에 현재 테이블 구조를 확인하세요: PRAGMA table_info(landing_pages);

-- Step 1: 기존 테이블 백업
CREATE TABLE IF NOT EXISTS landing_pages_backup AS SELECT * FROM landing_pages;

-- Step 2: 새로운 테이블 생성 (모든 필드 포함)
CREATE TABLE IF NOT EXISTS landing_pages_new (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT DEFAULT 'basic',
  templateHtml TEXT,
  inputData TEXT DEFAULT '[]',
  ogTitle TEXT,
  ogDescription TEXT,
  thumbnail TEXT,
  folderId TEXT,
  showQrCode INTEGER DEFAULT 1,
  qrCodePosition TEXT DEFAULT 'bottom',
  qrCodeUrl TEXT,
  pixelScripts TEXT DEFAULT '[]',
  studentId TEXT,
  viewCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdById TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Step 3: 기존 데이터 복사 (존재하는 컬럼만)
INSERT INTO landing_pages_new (
  id, slug, title, subtitle, description, templateType, templateHtml,
  inputData, ogTitle, ogDescription, thumbnail, folderId,
  showQrCode, qrCodePosition, qrCodeUrl, pixelScripts, studentId,
  viewCount, isActive, createdById, createdAt, updatedAt
)
SELECT 
  COALESCE(id, 'lp_' || CAST(rowid AS TEXT)),
  COALESCE(slug, 'slug_' || CAST(rowid AS TEXT)),
  COALESCE(title, 'Untitled'),
  subtitle,
  description,
  COALESCE(templateType, 'basic'),
  templateHtml,
  COALESCE(inputData, '[]'),
  ogTitle,
  ogDescription,
  thumbnail,
  folderId,
  COALESCE(showQrCode, 1),
  COALESCE(qrCodePosition, 'bottom'),
  qrCodeUrl,
  COALESCE(pixelScripts, '[]'),
  studentId,
  COALESCE(viewCount, 0),
  COALESCE(isActive, 1),
  createdById,
  COALESCE(createdAt, datetime('now')),
  COALESCE(updatedAt, datetime('now'))
FROM landing_pages;

-- Step 4: 기존 테이블 삭제
DROP TABLE landing_pages;

-- Step 5: 새 테이블 이름 변경
ALTER TABLE landing_pages_new RENAME TO landing_pages;

-- Step 6: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_folder ON landing_pages(folderId);
CREATE INDEX IF NOT EXISTS idx_landing_pages_student ON landing_pages(studentId);
CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON landing_pages(isActive);

-- 완료 확인
SELECT 'Migration completed successfully. Total rows:' || COUNT(*) FROM landing_pages;
