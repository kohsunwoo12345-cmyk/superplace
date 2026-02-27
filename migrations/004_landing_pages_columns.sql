-- Landing Pages 테이블 수정
-- 2026-02-27: subtitle 컬럼 및 누락된 컬럼들 추가

-- 1. subtitle 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN subtitle TEXT;

-- 2. description 컬럼 추가 (없을 경우)  
ALTER TABLE landing_pages ADD COLUMN description TEXT;

-- 3. templateType 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN templateType TEXT DEFAULT 'basic';

-- 4. templateHtml 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN templateHtml TEXT;

-- 5. inputData 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN inputData TEXT DEFAULT '[]';

-- 6. ogTitle 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN ogTitle TEXT;

-- 7. ogDescription 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN ogDescription TEXT;

-- 8. thumbnail 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN thumbnail TEXT;

-- 9. folderId 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN folderId TEXT;

-- 10. showQrCode 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN showQrCode INTEGER DEFAULT 1;

-- 11. qrCodePosition 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN qrCodePosition TEXT DEFAULT 'bottom';

-- 12. qrCodeUrl 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN qrCodeUrl TEXT;

-- 13. pixelScripts 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN pixelScripts TEXT DEFAULT '[]';

-- 14. studentId 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN studentId TEXT;

-- 15. viewCount 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN viewCount INTEGER DEFAULT 0;

-- 16. isActive 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN isActive INTEGER DEFAULT 1;

-- 17. createdById 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN createdById TEXT;

-- 18. createdAt 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN createdAt TEXT DEFAULT (datetime('now'));

-- 19. updatedAt 컬럼 추가 (없을 경우)
ALTER TABLE landing_pages ADD COLUMN updatedAt TEXT DEFAULT (datetime('now'));

-- 완료 메시지
SELECT 'Landing pages table migration completed successfully' AS message;
