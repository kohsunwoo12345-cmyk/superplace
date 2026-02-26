# AI 쇼핑몰 전체 시스템 구현 완료

## 📋 개요

AI 쇼핑몰의 리뷰, 문의, 찜하기 시스템과 전체 구매 플로우를 구현했습니다.

**구현일**: 2026-02-26  
**커밋 해시**: `ff3c0fc`  
**Repository**: https://github.com/kohsunwoo12345-cmyk/superplace

---

## ✅ 구현 완료 항목

### 1. 리뷰 시스템 ⭐⭐⭐⭐⭐

#### DB 테이블
- **ProductReviews**: 제품 리뷰 저장
  - 평점 (1-5), 제목, 내용, 이미지
  - 구매 인증 (`isVerifiedPurchase`)
  - 도움됨 카운트 (`helpfulCount`)
- **ReviewHelpful**: 도움됨 중복 방지

#### API
```
GET    /api/store/reviews?productId=xxx          # 리뷰 목록 조회
POST   /api/store/reviews                         # 리뷰 작성
DELETE /api/store/reviews?id=xxx                  # 리뷰 삭제
```

#### 주요 기능
- ✅ 평점 평균 및 통계 (5점, 4점, 3점, 2점, 1점 분포)
- ✅ 구매 인증 배지 (BotPurchaseRequest 확인)
- ✅ 중복 리뷰 방지 (1제품 1리뷰)
- ✅ 페이지네이션 지원
- ✅ 자신의 리뷰만 삭제 가능

---

### 2. 문의 시스템 💬

#### DB 테이블
- **ProductInquiries**: 제품 문의 저장
  - 문의 유형 (일반, 배송, 결제, 제품, 기타)
  - 비밀글 여부 (`isSecret`)
  - 답변 상태 (pending, answered, closed)
  - 관리자 답변 정보

#### API
```
GET    /api/store/inquiries?productId=xxx         # 문의 목록 조회
POST   /api/store/inquiries                       # 문의 작성
PUT    /api/store/inquiries                       # 답변 작성 (관리자)
DELETE /api/store/inquiries?id=xxx                # 문의 삭제
```

#### 주요 기능
- ✅ 비밀글 지원 (작성자와 관리자만 열람)
- ✅ 5가지 문의 유형 분류
- ✅ 관리자 답변 시스템
- ✅ 문의 상태 관리 (대기/답변완료/종료)
- ✅ 페이지네이션 지원

---

### 3. 찜하기 시스템 ❤️

#### DB 테이블
- **Wishlist**: 위시리스트 저장
  - userId + productId UNIQUE 제약

#### API
```
GET    /api/store/wishlist                        # 위시리스트 조회
POST   /api/store/wishlist                        # 찜하기 추가
DELETE /api/store/wishlist?productId=xxx          # 찜하기 제거
```

#### 주요 기능
- ✅ 중복 방지 (1제품 1찜)
- ✅ 제품 정보 JOIN 조회
- ✅ 찜한 날짜 기록

---

### 4. 장바구니 시스템 🛒

#### DB 테이블
- **ShoppingCart**: 장바구니 저장
  - 수량 (`quantity`)
  - 학생 수 (`studentCount`)

#### 상태
- ✅ DB 테이블 생성 완료
- ⏸️ API 구현 대기 (필요 시 추가 가능)

---

### 5. 최근 본 상품 🕒

#### DB 테이블
- **RecentlyViewed**: 최근 조회 기록
  - userId + productId UNIQUE 제약
  - 조회 시간 (`viewedAt`)

#### 상태
- ✅ DB 테이블 생성 완료
- ⏸️ API 구현 대기 (필요 시 추가 가능)

---

## 🔄 전체 구매 플로우

### Step 1: 제품 등록 (관리자)
```
POST /api/admin/store-products
{
  "name": "영어 내신 클리닉 마스터 봇",
  "category": "academy_operation",
  "pricePerStudent": 5000,
  "botId": "bot_xxx",
  ...
}
```

**필수 사항:**
- `pricePerStudent > 0` (0이면 구매 불가)
- `botId`: 실제 존재하는 봇 ID
- `isActive = 1`

---

### Step 2: 제품 확인 (사용자)

#### 메인 쇼핑몰
```
https://superplacestudy.pages.dev/store
```
- 제품 목록 표시
- "자세히보기" 버튼 클릭

#### 상세 페이지
```
https://superplacestudy.pages.dev/store/[productId]
```
- 제품 상세 정보
- 리뷰 확인
- 문의 확인
- 하단 "구매하기" 버튼

---

### Step 3: 구매 신청 (사용자)

#### 구매 다이얼로그
- 학생 수 입력 (예: 10명)
- 개월 수 입력 (예: 1개월)
- 총 금액 계산: 10 × 1 × 5,000 = 50,000원
- 입금 은행: 국민은행
- 입금자명: 홍길동
- 입금 증빙 첨부 (선택)

#### API 호출
```
POST /api/bot-purchase-requests/create
Authorization: Bearer <token>
{
  "productId": "product_xxx",
  "productName": "영어 내신 클리닉 마스터 봇",
  "studentCount": 10,
  "months": 1,
  "pricePerStudent": 5000,
  "totalPrice": 50000,
  "depositBank": "국민은행",
  "depositorName": "홍길동",
  "attachmentUrl": "",
  "requestMessage": ""
}
```

#### 결과
- **BotPurchaseRequest** 레코드 생성
  - `status = 'PENDING'`
  - `userId`, `academyId` 자동 설정
- 사용자에게 "구매 신청이 완료되었습니다" 알림

---

### Step 4: 승인 대기

사용자는 관리자 승인을 기다립니다.

---

### Step 5: 관리자 승인

#### 승인 페이지
```
https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
```

#### 승인 API
```
POST /api/admin/bot-purchase-requests/approve
Authorization: Bearer <admin_token>
{
  "requestId": "bpr_xxx"
}
```

#### 승인 처리 (자동)

##### 1. BotPurchaseRequest 업데이트
```sql
UPDATE BotPurchaseRequest 
SET status = 'APPROVED',
    approvedBy = <admin_id>,
    approvedAt = <now>
WHERE id = <requestId>
```

##### 2. AcademyBotSubscription 생성/업데이트

**신규 구독**
```sql
INSERT INTO AcademyBotSubscription (
  id, academyId, productId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots,
  subscriptionStart, subscriptionEnd
) VALUES (
  'sub_xxx', 
  <academyId>, 
  <productId>, 
  <productName>,
  10,  -- studentCount
  0,   -- 아직 사용 안함
  10,  -- studentCount
  NOW(),
  NOW() + 1 MONTH
)
```

**기존 구독 업데이트**
```sql
UPDATE AcademyBotSubscription 
SET totalStudentSlots = totalStudentSlots + 10,
    remainingStudentSlots = remainingStudentSlots + 10,
    subscriptionEnd = subscriptionEnd + 1 MONTH
WHERE academyId = <academyId> 
  AND productId = <productId>
```

---

### Step 6: 봇 할당 확인 (사용자)

#### 대시보드
```
https://superplacestudy.pages.dev/dashboard
```

**확인 사항:**
- [x] 구매한 봇이 목록에 표시되는가?
- [x] 봇 아이콘, 이름이 정확한가?
- [x] 학생 슬롯이 표시되는가? (예: 0/10)

#### 봇 상세 페이지
```
https://superplacestudy.pages.dev/bots/[botId]
```

**확인 사항:**
- [x] 봇 정보가 표시되는가?
- [x] 대화할 수 있는가?
- [x] 학생 목록이 있는가?

---

### Step 7: 학생 등록 테스트

#### 학생 등록
```
POST /api/students/register
Authorization: Bearer <token>
{
  "name": "김학생",
  "studentCode": "2024001",
  "phone": "01012345678",
  ...
}
```

#### 슬롯 차감 (자동)
```sql
UPDATE AcademyBotSubscription 
SET usedStudentSlots = usedStudentSlots + 1,
    remainingStudentSlots = remainingStudentSlots - 1
WHERE academyId = <academyId> 
  AND productId = <productId>
```

#### 확인
- 대시보드에서 슬롯 변경 확인: `1/10`
- 10명 등록 후 `10/10`
- 11번째 등록 시도 → **"슬롯 초과" 오류**

---

## 📊 테스트 체크리스트

### 기본 설정 ⚙️
- [ ] 1. 제품이 StoreProducts 테이블에 등록되어 있음
- [ ] 2. 제품의 `pricePerStudent > 0`
- [ ] 3. 제품의 `botId`가 유효한 봇 ID

### 구매 프로세스 💰
- [ ] 4. 사용자가 상세 페이지에서 '구매하기' 클릭
- [ ] 5. 구매 다이얼로그에서 학생 수, 개월 수 입력
- [ ] 6. 입금 정보 입력 후 '구매 신청' 버튼 클릭
- [ ] 7. BotPurchaseRequest 레코드 생성 (status=PENDING)

### 승인 프로세스 ✅
- [ ] 8. 관리자가 승인 페이지에서 요청 확인
- [ ] 9. '승인' 버튼 클릭
- [ ] 10. BotPurchaseRequest.status → APPROVED
- [ ] 11. AcademyBotSubscription 생성/업데이트

### 봇 할당 🤖
- [ ] 12. 학원장 대시보드에 봇이 표시됨
- [ ] 13. 봇 상세 페이지 접근 가능
- [ ] 14. 봇과 대화 가능
- [ ] 15. 학생 등록 시 슬롯 차감

---

## 🔧 주요 API 정리

### 제품 관리
```
GET    /api/admin/store-products?activeOnly=true  # 제품 목록
POST   /api/admin/store-products                  # 제품 생성
PUT    /api/admin/store-products                  # 제품 수정
DELETE /api/admin/store-products?id=xxx           # 제품 삭제
```

### 구매 관리
```
POST   /api/bot-purchase-requests/create          # 구매 신청
GET    /api/bot-purchase-requests                 # 내 신청 목록
```

### 관리자 승인
```
GET    /api/admin/bot-purchase-requests/list      # 전체 신청 목록
POST   /api/admin/bot-purchase-requests/approve   # 승인
POST   /api/admin/bot-purchase-requests/reject    # 거절
```

### 리뷰 & 문의
```
GET    /api/store/reviews?productId=xxx           # 리뷰 조회
POST   /api/store/reviews                         # 리뷰 작성
GET    /api/store/inquiries?productId=xxx         # 문의 조회
POST   /api/store/inquiries                       # 문의 작성
PUT    /api/store/inquiries                       # 답변 (관리자)
```

### 찜하기
```
GET    /api/store/wishlist                        # 위시리스트 조회
POST   /api/store/wishlist                        # 찜하기 추가
DELETE /api/store/wishlist?productId=xxx          # 찜하기 제거
```

---

## 🗂️ 데이터베이스 테이블

### 쇼핑몰 관련
1. **StoreProducts** - 제품 정보
2. **ProductReviews** - 리뷰
3. **ReviewHelpful** - 리뷰 도움됨
4. **ProductInquiries** - 문의
5. **ShoppingCart** - 장바구니
6. **Wishlist** - 찜하기
7. **RecentlyViewed** - 최근 본 상품

### 구매 & 구독
8. **BotPurchaseRequest** - 구매 신청
9. **AcademyBotSubscription** - 학원 구독 정보

---

## 📝 수동 테스트 가이드

### 1단계: 제품 확인
```
1. https://superplacestudy.pages.dev/store 접속
2. 제품 목록이 표시되는지 확인
3. "자세히보기" 버튼이 있는지 확인
```

### 2단계: 상세 페이지
```
1. 제품 클릭하여 상세 페이지 이동
2. 이미지 슬라이더 작동 확인
3. 탭 메뉴 (상품상세/리뷰/문의) 확인
4. 하단 "구매하기" 버튼 확인
```

### 3단계: 구매 신청
```
1. "구매하기" 버튼 클릭
2. 학생 수 입력 (예: 10명)
3. 개월 수 입력 (예: 1개월)
4. 총 금액 자동 계산 확인
5. 입금 은행, 입금자명 입력
6. "구매 신청" 버튼 클릭
7. "구매 신청이 완료되었습니다" 알림 확인
```

### 4단계: 승인 (관리자)
```
1. https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals 접속
2. PENDING 상태의 신청 확인
3. "승인" 버튼 클릭
4. 상태가 APPROVED로 변경되었는지 확인
```

### 5단계: 봇 확인 (사용자)
```
1. https://superplacestudy.pages.dev/dashboard 접속
2. 구매한 봇이 목록에 있는지 확인
3. 슬롯 정보 (0/10) 표시 확인
4. 봇 클릭하여 상세 페이지 이동
5. 봇과 대화 가능한지 확인
```

### 6단계: 학생 등록
```
1. 학생 등록 페이지로 이동
2. 학생 정보 입력 후 등록
3. 슬롯이 1/10으로 변경되었는지 확인
4. 10명 등록 후 10/10 확인
5. 11번째 등록 시도 → 오류 확인
```

---

## 🚀 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Commit**: `ff3c0fc`
- **Live Site**: https://superplacestudy.pages.dev
- **메인 쇼핑몰**: https://superplacestudy.pages.dev/store
- **관리자 승인**: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals

---

## 📦 생성된 파일

1. `migrations/003_store_features.sql` - DB 스키마
2. `functions/api/admin/run-store-features-migration.ts` - 마이그레이션
3. `functions/api/store/reviews.ts` - 리뷰 API
4. `functions/api/store/inquiries.ts` - 문의 API
5. `functions/api/store/wishlist.ts` - 찜하기 API
6. `test_full_purchase_flow.sh` - 테스트 스크립트
7. `STORE_FEATURES_COMPLETE.md` - 이 문서

---

## ✅ 구현 상태

| 기능 | 상태 | 비고 |
|------|------|------|
| 리뷰 시스템 | ✅ 완료 | 평점, 구매인증, 도움됨 |
| 문의 시스템 | ✅ 완료 | 비밀글, 관리자 답변 |
| 찜하기 | ✅ 완료 | API 완성 |
| 장바구니 | ⚠️ DB만 | API 필요 시 추가 |
| 최근 본 상품 | ⚠️ DB만 | API 필요 시 추가 |
| 구매 신청 | ✅ 완료 | BotPurchaseRequest |
| 관리자 승인 | ✅ 완료 | 자동 구독 생성 |
| 봇 할당 | ✅ 완료 | AcademyBotSubscription |
| 슬롯 관리 | ✅ 완료 | 학생 등록 시 차감 |

---

## 🎯 다음 단계 (선택사항)

### Frontend UI 개선
- [ ] 리뷰 작성 UI 추가
- [ ] 문의 작성 UI 추가
- [ ] 찜하기 버튼 추가
- [ ] 장바구니 페이지
- [ ] 최근 본 상품 위젯

### Backend 기능 확장
- [ ] 리뷰 이미지 업로드
- [ ] 문의 알림 시스템
- [ ] 장바구니 API 구현
- [ ] 최근 본 상품 API 구현
- [ ] 구매 완료 알림 (이메일/SMS)

---

**구현 완료일**: 2026-02-26  
**작성자**: Claude AI  
**상태**: ✅ 모든 핵심 기능 구현 완료
