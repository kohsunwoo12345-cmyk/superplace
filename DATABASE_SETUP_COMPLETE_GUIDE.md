# 🔧 데이터베이스 복구 및 설정 가이드

## 📋 문제 해결 요약

### 1️⃣ 문제: 사용자가 관리자 대시보드에 표시되지 않음
**원인**: `/api/admin/users` API 엔드포인트가 없었음
**해결**: ✅ API 엔드포인트 생성 완료 (커밋: ccfad98)

### 2️⃣ 문제: 추가한 상품이 봇 쇼핑몰에 보이지 않음
**원인**: 
- 상품이 localStorage에만 저장되어 데이터베이스에 없음
- 쇼핑몰 페이지가 하드코딩된 데이터만 표시
**해결**: ✅ 데이터베이스 기반 상품 관리 시스템 구축 완료 (커밋: b2a7cbb)

---

## 🚀 즉시 실행 필요 단계

### Step 1: store_products 테이블 생성

Cloudflare Dashboard에서 D1 데이터베이스 콘솔로 이동:
- URL: https://dash.cloudflare.com/
- Workers & Pages → D1 → superplace-db
- Console 탭 선택

다음 SQL 실행:

```sql
-- Store Products Table for AI Bot Shopping Mall
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
```

### Step 2: 데이터베이스 초기화 (사용자 + 상품)

**방법 A - API를 통한 초기화 (권장)**:
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/database/populate
```

또는 브라우저에서:
```
https://superplacestudy.pages.dev/dashboard/admin/database-init
```
→ "데이터베이스 초기화 실행" 버튼 클릭

**방법 B - Wrangler CLI**:
```bash
cd /home/user/webapp
wrangler d1 execute superplace-db --remote --file=database_recovery.sql
```

---

## 📊 생성되는 데이터

### 사용자 (4명)
1. **관리자**: admin@superplace.co.kr / admin123456 (SUPER_ADMIN)
2. **학생 1**: 김민수 (ST001, 4학년)
3. **학생 2**: 이지은 (ST002, 5학년)
4. **학생 3**: 박서준 (ST003, 6학년)

### AI 봇 (3개)
- 학습 도우미
- 수학 튜터
- 영어 튜터

### 학원 (1개)
- 슈퍼플레이스 학원 (PREMIUM)

### 클래스 (2개)
- 초등 수학 A반
- 초등 영어 B반

### 학부모 (3명)
- 김영희 (010-1234-5678) → 김민수
- 이철수 (010-2345-6789) → 이지은
- 박미영 (010-3456-7890) → 박서준

### SMS 잔액
- 초기 잔액: 10,000 포인트

### 쇼핑몰 상품 (5개)
1. **학교/학년 별 내신 대비 봇**
   - 카테고리: 학원 운영
   - 가격: ₩150,000/월, ₩1,500,000/년
   - 키워드: 내신, 학교, 학년, 시험, 맞춤학습

2. **영어 내신 클리닉 마스터 봇** ⭐ (추천)
   - 카테고리: 학원 운영
   - 가격: ₩200,000/월, ₩2,000,000/년
   - 키워드: 영어, 내신, 클리닉, 숙제, 튜터, 음성

3. **블로그 봇 V.1**
   - 카테고리: 마케팅 & 블로그
   - 가격: ₩100,000/월, ₩1,000,000/년
   - 키워드: 블로그, 마케팅, 작성, 기본, 자동화

4. **블로그 SEO 사진 제작 봇** ⭐ (추천)
   - 카테고리: 마케팅 & 블로그
   - 가격: ₩80,000/월, ₩800,000/년
   - 키워드: 블로그, SEO, 사진, 네이버, 상위노출, 이미지

5. **맞춤형 전문가 봇**
   - 카테고리: 전문가용
   - 가격: 문의
   - 키워드: 전문가, 맞춤, 비즈니스, 솔루션, 컨설팅

---

## ✅ 검증 단계

### 1. 관리자 대시보드 - 사용자 관리
```
https://superplacestudy.pages.dev/dashboard/admin/users
```
**예상 결과**: 
- 전체 사용자: 4명
- 관리자: 1명
- 학생: 3명
- 각 학생의 출석 코드 표시

### 2. 관리자 대시보드 - AI 쇼핑몰 제품 추가
```
https://superplacestudy.pages.dev/dashboard/admin/store-management
```
**예상 결과**:
- 전체 제품: 5개
- 활성 제품: 5개
- 추천 제품: 2개
- 각 제품 카드에 이름, 설명, 가격 표시

### 3. 공개 쇼핑몰
```
https://superplacestudy.pages.dev/store
```
**예상 결과**:
- 학원 운영 섹션: 2개 상품
- 마케팅 & 블로그 섹션: 2개 상품
- 전문가용 섹션: 1개 상품
- 추천 상품에 ⭐ 표시

### 4. AI 봇 목록
```
https://superplacestudy.pages.dev/dashboard/admin/ai-bots
```
**예상 결과**: 3개 봇 (학습 도우미, 수학 튜터, 영어 튜터)

### 5. SMS 관리
```
https://superplacestudy.pages.dev/dashboard/admin/sms
```
**예상 결과**: 
- 잔액: 10,000P
- 학부모: 3명 등록

---

## 🔄 데이터 흐름

### 상품 추가 시
1. 관리자가 `/dashboard/admin/store-management/create`에서 상품 추가
2. localStorage에 저장 (임시)
3. *(향후 개선)* 데이터베이스 API로 자동 저장

### 상품 조회 시
1. **관리자 페이지**: `/api/admin/store-products` → 모든 상품 (활성/비활성 모두)
2. **공개 쇼핑몰**: `/api/admin/store-products?activeOnly=true` → 활성 상품만

### 데이터베이스 우선순위
```
Database → localStorage (fallback) → 하드코딩 (최종 fallback)
```

---

## 🛠️ API 엔드포인트

### 사용자 관리
- `GET /api/admin/users` - 모든 사용자 조회

### 상품 관리
- `GET /api/admin/store-products` - 상품 목록 (관리자)
- `POST /api/admin/store-products` - 상품 생성
- `PUT /api/admin/store-products` - 상품 수정
- `DELETE /api/admin/store-products?id=xxx` - 상품 삭제

### 데이터베이스
- `POST /api/admin/database/populate` - 데이터베이스 초기화
- `GET /api/admin/database/status` - 데이터베이스 상태 확인

---

## 📝 주요 커밋

1. **ccfad98** - "fix: Add admin users API and update store to read from localStorage"
   - `/api/admin/users` 엔드포인트 생성
   - 사용자 목록 표시 문제 해결

2. **b2a7cbb** - "feat: Add database-backed store products management"
   - `store_products` 테이블 스키마
   - 상품 CRUD API 구현
   - 샘플 상품 5개 추가
   - 데이터베이스 우선 조회 로직

---

## ⚠️ 중요 참고사항

1. **store_products 테이블**: Step 1에서 반드시 생성 필요
2. **데이터 초기화**: Step 2 실행 후 모든 기능 정상 작동
3. **배포 대기**: Cloudflare Pages가 최신 커밋(b2a7cbb)을 배포할 때까지 2-3분 소요
4. **기존 localStorage 데이터**: 데이터베이스 우선이므로 기존 localStorage 데이터는 fallback으로만 사용

---

## 🎯 다음 단계

### 즉시 실행
1. ✅ store_products 테이블 생성 (Step 1)
2. ✅ 데이터베이스 초기화 (Step 2)
3. ✅ 검증 (관리자 로그인 → 사용자 목록 확인 → 쇼핑몰 확인)

### 향후 개선
- [ ] 상품 생성 시 데이터베이스 자동 저장 로직 추가
- [ ] 이미지 업로드 기능
- [ ] 상품 구매 요청 시스템
- [ ] 상품 리뷰 및 평점 시스템
