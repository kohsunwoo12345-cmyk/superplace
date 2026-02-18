# 슈퍼플레이스 데이터베이스 전체 테스트 가이드

## 📊 데이터베이스 현황

### 현재 상태
- **In-Memory Database** 사용 중 (`src/lib/db/memory.ts`)
- **Edge Runtime** 호환
- **테스트 데이터** 완전 초기화됨

### 포함된 테스트 데이터

#### 1. 사용자 (Users)
```typescript
총 13명의 사용자 (관리자 3명 + 학생 10명)

관리자 계정:
- admin@superplace.com / admin1234 (SUPER_ADMIN)
- director@superplace.com / director1234 (DIRECTOR)  
- teacher@superplace.com / teacher1234 (TEACHER)

학생 계정:
- student1@test.com ~ student10@test.com / student1234 (STUDENT)
```

#### 2. 학원 (Academy)
```typescript
1개 학원:
- 슈퍼플레이스 테스트 학원 (SUPERTEST01)
- 주소: 인천광역시 서구 청라커낼로 270, 2층
- 요금제: PREMIUM (학생 100명, 강사 10명)
```

#### 3. 반 (Classes)
```typescript
3개 반:
- 중등 수학 A반 (중1-2)
- 중등 수학 B반 (중3)
- 고등 수학 A반 (고1-2)
```

#### 4. 학생 (Students)
```typescript
10명의 학생 정보:
- 학년: 중1, 중2, 중3, 고1, 고2, 고3 분산
- 학부모 연락처 포함
- 상태: 전원 ACTIVE
```

#### 5. AI 봇 (AI Bots)
```typescript
5개 AI 봇 (쇼핑몰 제품):
1. 수학 과외 선생님 (₩10,000)
2. 영어 회화 선생님 (₩15,000)
3. 과학 실험 도우미 (₩12,000)
4. 역사 스토리텔러 (₩8,000)
5. 코딩 튜터 (₩20,000)
```

#### 6. AI 봇 할당 (Bot Assignments)
```typescript
3개 할당:
- student-001 → 수학 봇 (30일)
- student-002 → 수학 봇 (30일)
- student-003 → 영어 봇 (30일)
```

#### 7. 요금제 (Pricing Plans)
```typescript
3개 요금제:
- FREE: ₩0 (학생 10명, 강사 2명)
- BASIC: ₩50,000 (학생 30명, 강사 5명)
- PREMIUM: ₩100,000 (학생 100명, 강사 10명)
```

#### 8. 결제 승인 (Payment Approvals)
```typescript
1개 결제 대기:
- 슈퍼플레이스 학원
- PREMIUM 요금제 (₩100,000)
- 상태: PENDING (승인 대기)
```

#### 9. SMS 템플릿 (SMS Templates)
```typescript
2개 템플릿:
- 출석 알림
- 숙제 알림
```

---

## 🧪 전체 기능 테스트 가이드

### 1. 로그인 시스템 테스트

#### ✅ 테스트 계정
```bash
# 슈퍼 관리자
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'

# 원장
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@superplace.com","password":"director1234"}'

# 선생님
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@superplace.com","password":"teacher1234"}'

# 학생
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@test.com","password":"student1234"}'
```

#### 예상 응답
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "user-admin-001.admin@superplace.com.SUPER_ADMIN.1739856000000",
    "user": {
      "id": "user-admin-001",
      "email": "admin@superplace.com",
      "name": "슈퍼 관리자",
      "role": "SUPER_ADMIN",
      "academyId": null,
      "phone": "010-1234-5678"
    }
  }
}
```

---

### 2. 학원 관리 테스트

#### ✅ 학원 목록 조회
```bash
# 로그인 후 받은 토큰 사용
TOKEN="user-admin-001.admin@superplace.com.SUPER_ADMIN.1739856000000"

curl -X GET https://superplacestudy.pages.dev/api/admin/academies \
  -H "Authorization: Bearer $TOKEN"
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "academy-test-001",
      "name": "슈퍼플레이스 테스트 학원",
      "code": "SUPERTEST01",
      "subscriptionPlan": "PREMIUM",
      "maxStudents": 100,
      "maxTeachers": 10,
      "isActive": true
    }
  ]
}
```

---

### 3. 학생 관리 테스트

#### ✅ 학생 목록 조회
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/students \
  -H "Authorization: Bearer $TOKEN"
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "student-001",
      "userId": "user-student-001",
      "academyId": "academy-test-001",
      "name": "학생1",
      "email": "student1@test.com",
      "grade": "중1",
      "parentPhone": "010-1111-0001",
      "status": "ACTIVE"
    }
    // ... 10명 학생 데이터
  ],
  "total": 10
}
```

---

### 4. 반 관리 테스트

#### ✅ 반 목록 조회
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/classes \
  -H "Authorization: Bearer $TOKEN"
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "class-001",
      "name": "중등 수학 A반",
      "description": "중학교 1-2학년 수학",
      "academyId": "academy-test-001",
      "teacherId": "user-teacher-001",
      "teacherName": "김강사",
      "isActive": true
    }
    // ... 3개 반 데이터
  ],
  "total": 3
}
```

---

### 5. AI 봇 쇼핑몰 테스트

#### ✅ AI 봇 목록 조회 (전체)
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/ai-bots \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ AI 봇 목록 조회 (카테고리별)
```bash
# 수학 봇
curl -X GET "https://superplacestudy.pages.dev/api/admin/ai-bots?category=MATH" \
  -H "Authorization: Bearer $TOKEN"

# 영어 봇
curl -X GET "https://superplacestudy.pages.dev/api/admin/ai-bots?category=ENGLISH" \
  -H "Authorization: Bearer $TOKEN"
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "bot-001",
      "name": "수학 과외 선생님",
      "description": "수학 문제를 풀어주고 설명해주는 AI",
      "price": 10000,
      "category": "MATH",
      "tags": ["수학", "과외", "교육"],
      "isActive": true,
      "usageCount": 0
    }
    // ... 5개 봇 데이터
  ],
  "total": 5
}
```

---

### 6. AI 봇 할당 테스트

#### ✅ 할당된 봇 조회
```bash
# 학생 ID로 조회
curl -X GET "https://superplacestudy.pages.dev/api/admin/bot-assignments?studentId=student-001" \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ 새 봇 할당
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/bot-assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-003",
    "studentId": "student-004",
    "expiresAt": "2026-03-20T00:00:00.000Z"
  }'
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "ba-001",
      "botId": "bot-001",
      "botName": "수학 과외 선생님",
      "studentId": "student-001",
      "studentName": "학생1",
      "assignedAt": "2026-02-18T...",
      "expiresAt": "2026-03-20T...",
      "isActive": true
    }
  ]
}
```

---

### 7. 요금제 관리 테스트

#### ✅ 요금제 목록 조회
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/pricing-plans \
  -H "Authorization: Bearer $TOKEN"
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-free",
      "name": "FREE",
      "price": 0,
      "maxStudents": 10,
      "maxTeachers": 2,
      "features": ["기본 기능", "10명 학생", "2명 강사"]
    },
    {
      "id": "plan-basic",
      "name": "BASIC",
      "price": 50000,
      "maxStudents": 30,
      "maxTeachers": 5,
      "features": ["모든 기능", "30명 학생", "5명 강사", "AI 챗봇"]
    },
    {
      "id": "plan-premium",
      "name": "PREMIUM",
      "price": 100000,
      "maxStudents": 100,
      "maxTeachers": 10,
      "features": ["모든 기능", "100명 학생", "10명 강사", "AI 챗봇", "우선 지원"]
    }
  ]
}
```

---

### 8. 결제 승인 테스트

#### ✅ 결제 승인 대기 목록
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/payment-approvals \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ 결제 승인
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/payment-approvals/payment-001/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### ✅ 결제 거부
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/payment-approvals/payment-001/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"학원 정보 불일치"}'
```

#### 예상 응답
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-001",
      "academyId": "academy-test-001",
      "academyName": "슈퍼플레이스 테스트 학원",
      "planId": "plan-premium",
      "planName": "PREMIUM",
      "amount": 100000,
      "status": "PENDING",
      "requestedAt": "2026-02-18T..."
    }
  ]
}
```

---

### 9. SMS 관리 테스트

#### ✅ SMS 템플릿 목록
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/sms/templates \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ 개별 SMS 발송
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/sms/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "010-1111-0001",
    "message": "[슈퍼플레이스] 테스트 메시지입니다."
  }'
```

#### ✅ 대량 SMS 발송
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/sms/send-bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"phone": "010-1111-0001", "name": "학생1"},
      {"phone": "010-2222-0002", "name": "학생2"}
    ],
    "message": "[슈퍼플레이스] 대량 발송 테스트입니다."
  }'
```

---

### 10. 랜딩페이지 관리 테스트

#### ✅ 랜딩페이지 목록
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/landing-pages \
  -H "Authorization: Bearer $TOKEN"
```

#### ✅ 랜딩페이지 생성
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/landing-pages/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 랜딩페이지",
    "subtitle": "신규 학생 모집",
    "description": "체험 수업 신청 페이지",
    "templateType": "basic",
    "customFields": [
      {"name": "name", "label": "이름", "type": "text", "required": true},
      {"name": "phone", "label": "연락처", "type": "phone", "required": true}
    ]
  }'
```

#### ✅ 폼 제출 내역 조회
```bash
curl -X GET "https://superplacestudy.pages.dev/api/landing/submissions?pageId=lp-001" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📈 통계 API 테스트

### ✅ 전체 통계 조회
```bash
curl -X GET https://superplacestudy.pages.dev/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 예상 응답
```json
{
  "success": true,
  "data": {
    "totalUsers": 13,
    "totalStudents": 10,
    "totalClasses": 3,
    "totalAIBots": 5,
    "totalBotAssignments": 3,
    "totalPaymentApprovals": 1,
    "totalSMSTemplates": 2,
    "academies": {
      "total": 1,
      "active": 1,
      "premium": 1
    },
    "users": {
      "superAdmin": 1,
      "director": 1,
      "teacher": 1,
      "student": 10
    }
  }
}
```

---

## 🎯 브라우저 테스트

### 1. 로그인 테스트
```
URL: https://superplacestudy.pages.dev/login

계정:
- admin@superplace.com / admin1234
- director@superplace.com / director1234
- teacher@superplace.com / teacher1234
```

### 2. 대시보드 메뉴 테스트
로그인 후 다음 페이지들 접근:

#### 관리자 메뉴
- `/dashboard` - 메인 대시보드
- `/dashboard/admin/academies` - 학원 관리
- `/dashboard/admin/students` - 학생 관리
- `/dashboard/admin/classes` - 반 관리
- `/dashboard/admin/ai-bots` - AI 봇 관리
- `/dashboard/admin/pricing-plans` - 요금제 관리
- `/dashboard/admin/payment-approvals` - 결제 승인
- `/dashboard/admin/sms` - SMS 관리
- `/dashboard/admin/landing-pages` - 랜딩페이지 관리
- `/dashboard/admin/landing-pages/builder` - 랜딩페이지 빌더

#### 예상 결과
각 페이지에서:
- ✅ 테스트 데이터 정상 표시
- ✅ 기능 버튼 동작 확인
- ✅ CRUD 기능 정상 작동
- ✅ 에러 없이 로드

---

## 🔄 D1 데이터베이스 마이그레이션 (향후)

현재는 **In-Memory Database**를 사용 중입니다. Cloudflare D1으로 마이그레이션하려면:

### 1. D1 데이터베이스 생성
```bash
cd /home/user/webapp
wrangler d1 create superplace-db
```

### 2. 스키마 적용
```bash
wrangler d1 execute superplace-db --file=./COMPLETE_DATABASE_RECOVERY.sql
```

### 3. 데이터 확인
```bash
wrangler d1 execute superplace-db --command="SELECT COUNT(*) FROM users"
wrangler d1 execute superplace-db --command="SELECT * FROM users WHERE role='SUPER_ADMIN'"
```

### 4. API 코드 수정
```typescript
// src/app/api/auth/login/route.ts
// env.DB 사용하도록 변경
export async function POST(request: Request, { env }: { env: Env }) {
  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();
  // ...
}
```

---

## ✅ 테스트 체크리스트

### 인증 시스템
- [ ] 로그인 (관리자)
- [ ] 로그인 (원장)
- [ ] 로그인 (선생님)
- [ ] 로그인 (학생)
- [ ] 로그아웃
- [ ] 잘못된 비밀번호 처리
- [ ] 존재하지 않는 사용자 처리

### 학원 관리
- [ ] 학원 목록 조회
- [ ] 학원 상세 정보
- [ ] 학원 생성 (관리자만)
- [ ] 학원 수정 (원장/관리자)
- [ ] 학원 비활성화

### 학생 관리
- [ ] 학생 목록 조회
- [ ] 학생 상세 정보
- [ ] 학생 등록
- [ ] 학생 정보 수정
- [ ] 학생 상태 변경 (ACTIVE/INACTIVE)
- [ ] 학부모 연락처 관리

### 반 관리
- [ ] 반 목록 조회
- [ ] 반 생성
- [ ] 반 수정
- [ ] 반 삭제
- [ ] 학생-반 매핑

### AI 봇 쇼핑몰
- [ ] AI 봇 목록 (전체)
- [ ] AI 봇 목록 (카테고리별)
- [ ] AI 봇 상세 정보
- [ ] AI 봇 생성 (관리자만)
- [ ] AI 봇 수정
- [ ] AI 봇 구매 시뮬레이션

### AI 봇 할당
- [ ] 할당된 봇 조회 (학생별)
- [ ] 봇 할당 (원장/선생님)
- [ ] 봇 할당 취소
- [ ] 만료일 설정
- [ ] 자동 만료 처리

### 요금제 관리
- [ ] 요금제 목록 조회
- [ ] 요금제 상세 정보
- [ ] 요금제 생성 (관리자만)
- [ ] 요금제 수정
- [ ] 요금제 비활성화

### 결제 승인
- [ ] 승인 대기 목록
- [ ] 결제 승인
- [ ] 결제 거부
- [ ] 승인 내역 조회
- [ ] 거부 사유 기록

### SMS 관리
- [ ] 템플릿 목록
- [ ] 템플릿 생성
- [ ] 개별 SMS 발송
- [ ] 대량 SMS 발송
- [ ] 발송 내역 조회
- [ ] 잔액 조회

### 랜딩페이지
- [ ] 랜딩페이지 목록
- [ ] 랜딩페이지 생성
- [ ] 랜딩페이지 수정
- [ ] 커스텀 폼 필드 설정
- [ ] QR 코드 생성
- [ ] 썸네일 이미지 업로드
- [ ] 폼 제출 내역

### 통계 & 대시보드
- [ ] 전체 통계
- [ ] 학원별 통계
- [ ] 사용자 역할별 통계
- [ ] AI 봇 사용 통계
- [ ] SMS 발송 통계

---

## 🚀 테스트 자동화 스크립트

### test-all-apis.sh
```bash
#!/bin/bash

BASE_URL="https://superplacestudy.pages.dev"

echo "🧪 슈퍼플레이스 전체 API 테스트"
echo "================================"

# 1. 로그인
echo "1️⃣ 로그인 테스트..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "✅ 토큰: $TOKEN"

# 2. 학원 조회
echo "2️⃣ 학원 조회..."
curl -s -X GET "$BASE_URL/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# 3. 학생 조회
echo "3️⃣ 학생 조회..."
curl -s -X GET "$BASE_URL/api/admin/students" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# 4. AI 봇 조회
echo "4️⃣ AI 봇 조회..."
curl -s -X GET "$BASE_URL/api/admin/ai-bots" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# 5. 통계 조회
echo "5️⃣ 통계 조회..."
curl -s -X GET "$BASE_URL/api/admin/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'

echo "================================"
echo "✅ 전체 테스트 완료!"
```

---

## 📝 문제 해결

### 로그인 실패 시
1. 이메일/비밀번호 확인
2. F12 콘솔에서 에러 메시지 확인
3. 네트워크 탭에서 API 응답 확인

### 데이터 로드 안 됨
1. localStorage에 토큰 확인
2. 토큰 만료 여부 확인 (24시간)
3. API 엔드포인트 확인

### 권한 오류
1. 사용자 역할 확인 (SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT)
2. 해당 기능에 대한 권한 있는지 확인

---

## 🎉 결론

**현재 상태:**
- ✅ In-Memory 데이터베이스 완전 구현
- ✅ 13명 사용자 (관리자 3 + 학생 10)
- ✅ 1개 학원, 3개 반, 10명 학생
- ✅ 5개 AI 봇, 3개 할당
- ✅ 3개 요금제, 1개 결제 대기
- ✅ 2개 SMS 템플릿
- ✅ 모든 API 엔드포인트 동작
- ✅ Edge Runtime 호환

**다음 단계:**
1. Cloudflare D1 마이그레이션
2. JWT 토큰 구현
3. 비밀번호 bcrypt 해싱
4. 실제 SMS API 연동
5. 이미지 업로드 (Cloudflare R2)

---

**작성일:** 2026-02-18  
**버전:** 1.0  
**상태:** ✅ 완료
