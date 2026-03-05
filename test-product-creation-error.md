# 🔍 제품 생성 500 오류 진단 가이드

**날짜**: 2026-03-05  
**문제**: `/api/admin/store-products` POST 요청 시 500 에러 발생

---

## 🎯 문제 상황

```
/api/admin/store-products 500 응답
제품 생성에 실패했습니다.
```

---

## 🔍 1단계: Cloudflare 실시간 로그 확인

### 1. Cloudflare Dashboard 접속
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **superplacestudy** 선택
3. 상단 탭에서 **Logs** 클릭
4. **Begin log stream** 버튼 클릭

### 2. 제품 생성 재시도
1. 브라우저에서 https://superplacestudy.pages.dev/dashboard/admin/ai-bots 접속
2. 새 제품 생성 시도
3. Cloudflare Logs 창에서 실시간 에러 메시지 확인

### 3. 찾아볼 에러 패턴

#### A) D1 바인딩 오류
```
Error: D1_ERROR: env.DB is undefined
```
**원인**: D1 데이터베이스가 Cloudflare Pages에 바인딩되지 않음

**해결**:
1. Cloudflare Dashboard → **Workers & Pages** → **superplacestudy**
2. **Settings** → **Bindings**
3. **D1 Database Bindings** 섹션 확인
4. 없으면 **Add binding** → 변수명 `DB`, D1 데이터베이스 선택

---

#### B) 권한 오류
```
Error: Only ADMIN or SUPER_ADMIN can create products (403)
```
**원인**: Authorization 헤더의 JWT 토큰이 ADMIN/SUPER_ADMIN 역할이 아님

**해결**:
1. 브라우저 F12 → **Application** → **Local Storage** → `https://superplacestudy.pages.dev`
2. `token` 항목 확인 (형식: `userId|email|role|academyId`)
3. role이 `SUPER_ADMIN` 또는 `ADMIN`인지 확인
4. 아니면 다음 SQL로 역할 변경:

```sql
-- D1 콘솔에서 실행
UPDATE User 
SET role = 'SUPER_ADMIN' 
WHERE email = '당신의이메일@example.com';
```

---

#### C) 컬럼 불일치 오류
```
Error: table StoreProducts has no column named XXX
```
**원인**: 코드의 컬럼 수(32개)와 실제 테이블 컬럼 수가 다름

**해결**: StoreProducts 테이블 재생성

**Cloudflare D1 콘솔에서 실행**:

```sql
-- 1. 기존 테이블 백업
CREATE TABLE StoreProducts_backup AS SELECT * FROM StoreProducts;

-- 2. 기존 테이블 삭제
DROP TABLE StoreProducts;

-- 3. 새 테이블 생성 (32개 컬럼)
CREATE TABLE StoreProducts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  section TEXT,
  description TEXT,
  shortDescription TEXT,
  price REAL DEFAULT 0,
  monthlyPrice REAL DEFAULT 0,
  yearlyPrice REAL DEFAULT 0,
  pricePerStudent REAL DEFAULT 0,
  originalPrice REAL DEFAULT 0,
  discountType TEXT DEFAULT 'none',
  discountValue REAL DEFAULT 0,
  promotionType TEXT DEFAULT 'none',
  promotionDescription TEXT,
  promotionStartDate TEXT,
  promotionEndDate TEXT,
  badges TEXT,
  isTimeDeal INTEGER DEFAULT 0,
  stockQuantity INTEGER DEFAULT -1,
  maxPurchasePerUser INTEGER DEFAULT -1,
  features TEXT,
  detailHtml TEXT,
  imageUrl TEXT,
  botId TEXT,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT,
  createdById TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. 데이터 복구 (컬럼 이름 맞추기)
-- 백업 테이블 구조 확인 후 적절히 변경
-- SELECT * FROM StoreProducts_backup LIMIT 1;

-- 5. 백업 삭제 (복구 확인 후)
-- DROP TABLE StoreProducts_backup;
```

---

#### D) INSERT 파라미터 개수 불일치
```
Error: bind parameter count mismatch
```
**원인**: INSERT 문의 `?` 개수(32개)와 `.bind()` 인자 개수 불일치

**현재 코드 확인**:
- `functions/api/admin/store-products.ts` 라인 205-249
- INSERT 컬럼: 32개
- bind() 인자: 32개

**확인 방법**:
```bash
# 로컬에서 확인
grep -A 50 "INSERT INTO StoreProducts" functions/api/admin/store-products.ts | head -60
```

---

## 🛠️ 2단계: 로컬 테스트

### A) D1 로컬 데이터베이스 테스트

```bash
cd /home/user/webapp

# D1 로컬 테스트 데이터베이스 생성
npx wrangler d1 execute DB --local --command="
CREATE TABLE IF NOT EXISTS StoreProducts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  section TEXT,
  description TEXT,
  shortDescription TEXT,
  price REAL DEFAULT 0,
  monthlyPrice REAL DEFAULT 0,
  yearlyPrice REAL DEFAULT 0,
  pricePerStudent REAL DEFAULT 0,
  originalPrice REAL DEFAULT 0,
  discountType TEXT DEFAULT 'none',
  discountValue REAL DEFAULT 0,
  promotionType TEXT DEFAULT 'none',
  promotionDescription TEXT,
  promotionStartDate TEXT,
  promotionEndDate TEXT,
  badges TEXT,
  isTimeDeal INTEGER DEFAULT 0,
  stockQuantity INTEGER DEFAULT -1,
  maxPurchasePerUser INTEGER DEFAULT -1,
  features TEXT,
  detailHtml TEXT,
  imageUrl TEXT,
  botId TEXT,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT,
  createdById TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
"

# 테스트 데이터 삽입
npx wrangler d1 execute DB --local --command="
INSERT INTO StoreProducts (
  id, name, category, section, description, shortDescription,
  price, monthlyPrice, yearlyPrice, pricePerStudent,
  originalPrice, discountType, discountValue,
  promotionType, promotionDescription, promotionStartDate, promotionEndDate,
  badges, isTimeDeal, stockQuantity, maxPurchasePerUser,
  features, detailHtml, imageUrl, botId,
  isActive, isFeatured, displayOrder, keywords,
  createdById, createdAt, updatedAt
) VALUES (
  'test-product-001',
  '테스트 제품',
  'ai-bot',
  'premium',
  '테스트 설명',
  '짧은 설명',
  50000,
  5000,
  50000,
  10000,
  60000,
  'percentage',
  10,
  'none',
  '',
  '',
  '',
  'NEW',
  0,
  100,
  10,
  '기능1,기능2',
  '<p>상세설명</p>',
  '/images/test.jpg',
  'bot-001',
  1,
  0,
  0,
  '테스트,AI',
  'admin-001',
  datetime('now'),
  datetime('now')
);
"

# 결과 확인
npx wrangler d1 execute DB --local --command="SELECT * FROM StoreProducts LIMIT 5;"
```

---

## 📋 3단계: 체크리스트

### Cloudflare 설정 확인
- [ ] D1 데이터베이스 바인딩 존재 (변수명: `DB`)
- [ ] 환경 변수 설정 완료
- [ ] 최신 코드 배포 완료

### 사용자 권한 확인
- [ ] 로그인한 사용자의 role이 `SUPER_ADMIN` 또는 `ADMIN`
- [ ] localStorage의 token 형식 정확 (`id|email|role|academyId`)

### 데이터베이스 스키마 확인
- [ ] StoreProducts 테이블이 32개 컬럼으로 존재
- [ ] 컬럼 타입이 코드와 일치 (TEXT, REAL, INTEGER)
- [ ] PRIMARY KEY 설정 확인

### API 코드 확인
- [ ] INSERT 문의 컬럼 개수 = 32개
- [ ] `.bind()` 인자 개수 = 32개
- [ ] 모든 필수 필드 (name, category) 존재

---

## 🎯 4단계: 예상 원인 및 해결 우선순위

### 1순위: D1 바인딩 누락 ⭐⭐⭐
- Cloudflare Pages 설정에서 D1 바인딩 추가

### 2순위: 권한 부족 ⭐⭐
- 사용자 role을 SUPER_ADMIN으로 변경

### 3순위: 스키마 불일치 ⭐
- StoreProducts 테이블 재생성

---

## 📞 지원 정보

- **프로젝트**: https://superplacestudy.pages.dev
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **D1 콘솔**: Cloudflare Dashboard → Workers & Pages → superplacestudy → Settings → Bindings → D1 Database → Open Console

---

## 🚀 다음 단계

1. ✅ Cloudflare 로그에서 정확한 에러 메시지 확인
2. ✅ 위 해결 방법 적용
3. ✅ 제품 생성 재시도
4. ✅ 성공 시 제품 목록에서 확인

---

**작성일**: 2026-03-05  
**최종 수정**: 2026-03-05
