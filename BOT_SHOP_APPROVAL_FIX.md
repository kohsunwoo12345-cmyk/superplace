# 🛒 AI 쇼핑몰 구매 승인 시스템 수정 보고서

**작성일**: 2026-03-04  
**작업 완료**: ✅  
**배포 상태**: 준비 완료

---

## 📋 문제점

1. **승인 페이지 접근 불가**: 관리자가 승인 페이지에 접근할 수 있는 메뉴가 사이드바에 없음
2. **데이터베이스 스키마 불일치**: 구매 폼에서 입력한 정보(이메일, 이름, 학원명, 연락처)가 DB에 저장되지 않음
3. **불필요한 필드**: 입금 은행, 예금주명 등 불필요한 필드 존재
4. **승인 페이지에 데이터 미표시**: 구매 신청 후 승인 페이지에 정보가 표시되지 않음

---

## ✅ 수정 내역

### 1. 데이터베이스 스키마 수정

#### 파일: `functions/api/bot-purchase-requests/create.ts`

**변경 전 (문제)**:
```typescript
CREATE TABLE IF NOT EXISTS BotPurchaseRequest (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  // ...
  depositBank TEXT,          // ❌ 불필요
  depositorName TEXT,        // ❌ 불필요
  attachmentUrl TEXT,        // ❌ 불필요
  // ❌ email, name, requestAcademyName, phoneNumber 없음!
```

**변경 후 (수정)**:
```typescript
CREATE TABLE IF NOT EXISTS BotPurchaseRequest (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  studentCount INTEGER NOT NULL,
  months INTEGER NOT NULL,
  pricePerStudent INTEGER NOT NULL,
  totalPrice INTEGER NOT NULL,
  email TEXT,                    // ✅ 추가
  name TEXT,                     // ✅ 추가
  requestAcademyName TEXT,       // ✅ 추가
  phoneNumber TEXT,              // ✅ 추가
  requestMessage TEXT,
  status TEXT DEFAULT 'PENDING',
  approvedBy TEXT,
  approvedAt TEXT,
  rejectionReason TEXT,
  subscriptionStartDate TEXT,
  subscriptionEndDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

#### INSERT 문 수정
```typescript
// ✅ 올바른 컬럼명 사용
INSERT INTO BotPurchaseRequest (
  id, productId, productName, userId, academyId,
  studentCount, months, pricePerStudent, totalPrice,
  email, name, requestAcademyName, phoneNumber, requestMessage,
  status, createdAt, updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
```

---

### 2. API 쿼리 수정

#### 파일: `functions/api/admin/bot-purchase-requests/list.ts`

**변경 전**:
```sql
bpr.academyName as requestAcademyName,  -- ❌ 존재하지 않는 컬럼
```

**변경 후**:
```sql
bpr.requestAcademyName,  -- ✅ 올바른 컬럼명
```

---

### 3. 구매 폼 확인

#### 파일: `src/app/store/purchase/page.tsx`

**현재 상태**: ✅ 이미 올바르게 구현됨
```typescript
// ✅ 필수 필드만 포함
const purchaseData = {
  productId: product.id,
  productName: product.name,
  studentCount,
  months,
  pricePerStudent: product.pricePerStudent || product.monthlyPrice || 0,
  totalPrice: calculateTotal(),
  email,              // ✅
  name,               // ✅
  academyName,        // ✅ → requestAcademyName으로 저장
  phoneNumber,        // ✅
  requestMessage,
};
```

**폼 필드**:
- ✅ 이메일 (필수)
- ✅ 이름 (필수)
- ✅ 학원 이름 (필수)
- ✅ 연락처 (필수)
- ✅ 요청사항 (선택)
- ❌ 입금 은행 (제거됨)
- ❌ 예금주명 (제거됨)

---

### 4. 관리자 사이드바 메뉴

#### 파일: `src/components/layouts/ModernLayout.tsx`

**현재 상태**: ✅ 이미 추가되어 있음

93~94번 줄:
```typescript
{ id: 'admin-store', href: '/dashboard/admin/store-management', icon: ShoppingCart, text: 'AI쇼핑몰 제품 추가' },
{ id: 'admin-bot-shop-approvals', href: '/dashboard/admin/bot-shop-approvals', icon: CheckCircle, text: '쇼핑몰 승인 관리' },
```

**메뉴 위치**: "AI쇼핑몰 제품 추가" 바로 아래

---

### 5. 승인 페이지 필드 표시

#### 파일: `src/app/dashboard/admin/bot-shop-approvals/page.tsx`

**현재 상태**: ✅ 모든 필드가 올바르게 표시됨

**테이블 컬럼**:
- ✅ 상태 (PENDING, APPROVED, REJECTED)
- ✅ 제품명
- ✅ 신청자 정보 (이름, 이메일, 연락처)
- ✅ 학원 이름 (`requestAcademyName`)
- ✅ 학생 수
- ✅ 기간 (개월)
- ✅ 총 금액
- ✅ 신청일
- ✅ 작업 (상세 버튼)

**상세 모달**:
- ✅ 제품 정보 (제품명, 학생 수, 기간, 월 단가, 총 금액)
- ✅ 신청자 정보 (이름, 이메일, 학원 이름, 연락처)
- ✅ 요청사항
- ✅ 거절 사유 (거절된 경우)
- ✅ 승인/거절 버튼 (PENDING 상태인 경우)

---

## 🧪 테스트 가이드

### 1단계: 쇼핑몰에서 구매 신청

**URL**: https://superplacestudy.pages.dev/store

1. 로그인 (학원장 또는 일반 사용자 계정)
2. AI 봇 제품 선택
3. "구매하기" 클릭
4. 구매 정보 입력:
   - 학생 수: 예) 20명
   - 이용 기간: 예) 12개월
   - **이메일**: test@example.com (필수)
   - **이름**: 홍길동 (필수)
   - **학원 이름**: 테스트 학원 (필수)
   - **연락처**: 010-1234-5678 (필수)
   - 요청사항: 빠른 처리 부탁드립니다 (선택)
5. "구매 신청하기" 버튼 클릭
6. 성공 메시지 확인

---

### 2단계: 관리자 승인 페이지 접근

**URL**: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals

1. 관리자 계정으로 로그인
2. 왼쪽 사이드바에서 **"쇼핑몰 승인 관리"** 메뉴 확인
3. 클릭하여 승인 페이지 이동

---

### 3단계: 구매 신청 확인

**예상 결과**:

#### 통계 카드
- 전체: 1개 (또는 기존 + 1)
- 대기중: 1개 (신규 신청)
- 승인됨: 0개
- 거절됨: 0개
- 총 매출: ₩0

#### 구매 신청 테이블
| 상태 | 제품 | 신청자 정보 | 학원 | 학생 수 | 기간 | 총 금액 | 신청일 |
|------|------|------------|------|---------|------|---------|--------|
| 🟡 대기중 | [제품명] | 홍길동<br>test@example.com<br>010-1234-5678 | 테스트 학원 | 20명 | 12개월 | ₩240,000 | 2026-03-04 |

---

### 4단계: 상세 정보 확인

1. "상세" 버튼 클릭
2. 모달 팝업 확인:

```
📦 제품 정보
- 제품명: [봇 이름]
- 학생 수: 20명
- 이용 기간: 12개월
- 월 단가: ₩1,000
- 총 금액: ₩240,000

👤 신청자 정보
- 이름: 홍길동
- 이메일: test@example.com
- 학원 이름: 테스트 학원
- 연락처: 010-1234-5678

📝 요청사항
빠른 처리 부탁드립니다
```

---

### 5단계: 승인 처리

1. 학생 수 확인 또는 수정 (예: 20명 → 18명으로 변경 가능)
2. "승인" 버튼 클릭
3. 확인 다이얼로그: "18명으로 승인하시겠습니까?"
4. "확인" 클릭
5. 성공 메시지: "✅ 승인되었습니다!"
6. 페이지 새로고침 → 상태가 "승인됨"으로 변경 확인

---

### 6단계: D1 데이터베이스 확인 (선택)

**Cloudflare 대시보드** → **D1 Database**

```sql
SELECT 
  id,
  productName,
  email,
  name,
  requestAcademyName,
  phoneNumber,
  studentCount,
  months,
  totalPrice,
  status,
  createdAt
FROM BotPurchaseRequest
ORDER BY createdAt DESC
LIMIT 10;
```

**예상 결과**:
```
| id | productName | email | name | requestAcademyName | phoneNumber | studentCount | months | totalPrice | status | createdAt |
|----|-------------|-------|------|--------------------|-------------|--------------|--------|------------|--------|-----------|
| bpr_xxx | AI 수학 봇 | test@example.com | 홍길동 | 테스트 학원 | 010-1234-5678 | 20 | 12 | 240000 | APPROVED | 2026-03-04... |
```

---

## 🔍 문제 해결 체크리스트

### ✅ 문제 1: 승인 페이지에 신청이 표시되지 않음

**원인**: 
- DB 스키마에 `email`, `name`, `requestAcademyName`, `phoneNumber` 컬럼이 없어서 INSERT 실패

**해결**:
- ✅ 테이블 스키마에 누락된 컬럼 추가
- ✅ INSERT 문에서 올바른 컬럼명 사용

---

### ✅ 문제 2: 승인 페이지에 입력한 정보가 표시되지 않음

**원인**:
- SELECT 쿼리에서 `bpr.academyName as requestAcademyName` → 존재하지 않는 컬럼 참조

**해결**:
- ✅ `bpr.requestAcademyName`으로 수정

---

### ✅ 문제 3: 관리자가 승인 페이지에 접근할 수 없음

**원인**:
- 사이드바 메뉴에 링크가 없음

**해결**:
- ✅ 이미 추가되어 있음 (93~94번 줄)

---

### ✅ 문제 4: 불필요한 입금 정보 필드

**원인**:
- 이전 버전에서 입금 확인 방식 사용

**해결**:
- ✅ 구매 폼에서 제거됨 (이메일, 이름, 학원명, 연락처만)

---

## 🚀 배포 정보

### GitHub
- **저장소**: https://github.com/kohsunwoo12345-cmyk/superplace
- **브랜치**: main
- **커밋 예정**: ✅

### Cloudflare Pages
- **프로젝트**: superplacestudy
- **라이브 URL**: https://superplacestudy.pages.dev
- **쇼핑몰**: https://superplacestudy.pages.dev/store
- **승인 관리**: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals

---

## 📊 변경 파일 목록

1. ✅ `functions/api/bot-purchase-requests/create.ts` - 테이블 스키마 및 INSERT 수정
2. ✅ `functions/api/admin/bot-purchase-requests/list.ts` - SELECT 쿼리 수정
3. ✅ `src/components/layouts/ModernLayout.tsx` - 사이드바 메뉴 (이미 존재)
4. ✅ `src/app/dashboard/admin/bot-shop-approvals/page.tsx` - 승인 페이지 (이미 올바름)
5. ✅ `src/app/store/purchase/page.tsx` - 구매 폼 (이미 올바름)

---

## 🎯 요약

### 수정 완료 ✅
1. **DB 스키마**: email, name, requestAcademyName, phoneNumber 컬럼 추가
2. **API 쿼리**: 올바른 컬럼명 사용
3. **구매 폼**: 필수 필드만 유지 (이메일, 이름, 학원명, 연락처)
4. **승인 페이지**: 모든 정보 올바르게 표시
5. **사이드바 메뉴**: "쇼핑몰 승인 관리" 메뉴 존재 확인

### 테스트 필요 🧪
1. 실제 구매 신청
2. 승인 페이지에서 정보 확인
3. 승인/거절 처리

### 예상 결과 ✅
- 구매 신청 시 모든 입력 정보가 DB에 저장됨
- 승인 페이지에서 모든 필드가 올바르게 표시됨
- 관리자가 사이드바에서 승인 페이지에 접근 가능
- 승인/거절 처리가 정상 작동

---

**작업 완료일**: 2026-03-04  
**보고서 작성자**: GenSpark AI Developer
