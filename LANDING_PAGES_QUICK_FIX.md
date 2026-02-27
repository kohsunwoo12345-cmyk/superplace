# Landing Pages 간단 수정 가이드 (권장)

## 가장 간단한 방법

테이블을 새로 만드는 것이 가장 안전합니다.

---

## 1단계: 기존 테이블 삭제 (데이터가 없거나 백업 완료 시)

```sql
DROP TABLE IF EXISTS landing_pages;
```

---

## 2단계: 새 테이블 생성 (한 번에 복사하여 실행)

```sql
CREATE TABLE landing_pages (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, subtitle TEXT, description TEXT, templateType TEXT DEFAULT 'basic', templateHtml TEXT, inputData TEXT DEFAULT '[]', ogTitle TEXT, ogDescription TEXT, thumbnail TEXT, folderId TEXT, showQrCode INTEGER DEFAULT 1, qrCodePosition TEXT DEFAULT 'bottom', qrCodeUrl TEXT, pixelScripts TEXT DEFAULT '[]', studentId TEXT, viewCount INTEGER DEFAULT 0, isActive INTEGER DEFAULT 1, createdById TEXT, createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')));
```

---

## 3단계: 인덱스 생성 (한 번에 복사하여 실행)

```sql
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

```sql
CREATE INDEX idx_landing_pages_folder ON landing_pages(folderId);
```

```sql
CREATE INDEX idx_landing_pages_student ON landing_pages(studentId);
```

```sql
CREATE INDEX idx_landing_pages_active ON landing_pages(isActive);
```

---

## 4단계: 폴더 테이블 생성 (한 번에 복사하여 실행)

```sql
CREATE TABLE IF NOT EXISTS landing_page_folders (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, icon TEXT DEFAULT '📁', color TEXT DEFAULT '#3b82f6', pagesCount INTEGER DEFAULT 0, isActive INTEGER DEFAULT 1, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')));
```

---

## 5단계: 기본 폴더 추가 (한 번에 복사하여 실행)

```sql
INSERT INTO landing_page_folders (id, name, description) VALUES ('folder-default', '기본 폴더', '기본 랜딩페이지 폴더'), ('folder-promotion', '프로모션', '프로모션용 랜딩페이지'), ('folder-event', '이벤트', '이벤트용 랜딩페이지');
```

---

## 6단계: 제출 테이블 생성 (한 번에 복사하여 실행)

```sql
CREATE TABLE IF NOT EXISTS landing_page_submissions (id TEXT PRIMARY KEY, landingPageId TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, message TEXT, additionalData TEXT, submittedAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (landingPageId) REFERENCES landing_pages(id) ON DELETE CASCADE);
```

---

## 7단계: 제출 테이블 인덱스 (한 번에 복사하여 실행)

```sql
CREATE INDEX idx_landing_page_submissions_page ON landing_page_submissions(landingPageId);
```

---

## ✅ 완료 확인

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'landing%';
```

**예상 결과**: 
- landing_pages
- landing_page_folders  
- landing_page_submissions

---

## 🎯 테스트

1. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create 접속
2. 랜딩페이지 생성 테스트
3. 폴더 선택 및 저장 확인

완료! 🎉
