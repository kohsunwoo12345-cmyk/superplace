# 클래스 디버그 도구 사용 가이드

## 🚀 배포 정보
- **커밋**: `b9d40b8`
- **배포 URL**: https://superplacestudy.pages.dev
- **디버그 페이지**: https://superplacestudy.pages.dev/dashboard/debug-classes
- **배포 시간**: 약 2-3분 소요

## 🔍 디버그 페이지 사용 방법

### Step 1: 디버그 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/debug-classes
```

### Step 2: "전체 새로고침" 버튼 클릭
페이지 상단의 **"전체 새로고침"** 버튼을 클릭하면:
1. 사용자 정보 로드
2. 클래스 API 테스트
3. 전체 DB 클래스 조회

### Step 3: 결과 확인

#### 1️⃣ 사용자 정보 섹션
**확인 사항**:
- ✅ **academyId**: 초록색 배지 = 정상, 빨간색 배지 = NULL (문제!)
- ✅ **academy_id**: 대체 필드 확인
- ✅ **역할**: ADMIN, DIRECTOR 등

**예시**:
```
이메일: admin@school.com
역할: ADMIN
academyId: 1 ✅
academy_id: NULL
```

#### 2️⃣ API 응답 섹션
**확인 사항**:
- ✅ HTTP 상태: 200 = 정상
- ✅ 클래스 개수: 0개 = 문제, 1개 이상 = 정상
- ✅ 조회된 클래스 목록

**정상 케이스**:
```
HTTP 상태: 200 OK ✅
성공: ✓
클래스 개수: 3개

조회된 클래스:
- 중1 수학반 (academy_id: 1)
- 중2 영어반 (academy_id: 1)
- 중3 과학반 (academy_id: 1)
```

**문제 케이스**:
```
HTTP 상태: 200 OK ✅
성공: ✓
클래스 개수: 0개 ⚠️

⚠️ 조회된 클래스가 없습니다
사용자의 academyId와 일치하는 클래스가 없습니다.
```

#### 3️⃣ 전체 DB 클래스 섹션
**확인 사항**:
- 모든 클래스의 academy_id 확인
- 초록색 배경 = 사용자 academyId와 매칭
- 회색 배경 = 다른 학원의 클래스

**분석 예시**:

**시나리오 A: 매칭됨** (정상)
```
사용자 academyId: 1

전체 DB 클래스:
┌─────────────────────────────┐
│ 중1 수학반        ✓ 매칭됨 │
│ academy_id: 1              │
└─────────────────────────────┘
```

**시나리오 B: 불일치** (문제!)
```
사용자 academyId: 1

전체 DB 클래스:
┌─────────────────────────────┐
│ 중1 수학반                  │
│ academy_id: 10  ← 불일치!  │
└─────────────────────────────┘
```

#### 4️⃣ 진단 결과 섹션
자동으로 문제를 분석하고 원인을 표시합니다.

**문제 케이스 예시**:
```
⚠️ 문제 원인:
• 사용자의 academyId: 1
• 생성된 클래스의 academy_id와 불일치할 가능성
• 또는 User 테이블에 academyId가 설정되지 않음
```

## 📊 문제 진단 시나리오

### 시나리오 1: academyId가 NULL
**증상**:
```
사용자 정보:
academyId: ❌ NULL
academy_id: ❌ NULL
```

**원인**: User 테이블에 academyId가 설정되지 않음

**해결 방법**:
```sql
-- Wrangler CLI 사용
wrangler d1 execute DB --command "UPDATE User SET academyId = 1 WHERE email = 'admin@school.com'"

-- 또는 users 테이블
wrangler d1 execute DB --command "UPDATE users SET academy_id = 1 WHERE email = 'admin@school.com'"
```

### 시나리오 2: academy_id 불일치
**증상**:
```
사용자 academyId: 1
조회된 클래스: 0개

전체 DB 클래스:
- 중1 수학반 (academy_id: 10) ← 불일치!
```

**원인**: 클래스 생성 시 잘못된 academyId가 전달됨

**해결 방법 1** - 클래스의 academy_id 수정:
```sql
UPDATE classes SET academy_id = 1 WHERE id = 123;
```

**해결 방법 2** - 사용자의 academyId 수정:
```sql
UPDATE User SET academyId = 10 WHERE email = 'admin@school.com';
```

### 시나리오 3: 클래스가 아예 없음
**증상**:
```
전체 DB 클래스: 총 0개
```

**원인**: 클래스가 생성되지 않음

**해결 방법**:
1. 클래스 추가 페이지로 이동
2. 새 클래스 생성
3. 생성 성공 메시지 확인
4. 디버그 페이지에서 다시 확인

## 🛠️ 문제 해결 절차

### 절차 1: 디버그 페이지에서 데이터 수집
```
1. https://superplacestudy.pages.dev/dashboard/debug-classes 접속
2. "전체 새로고침" 버튼 클릭
3. 스크린샷 캡처:
   - 1️⃣ 사용자 정보
   - 2️⃣ API 응답
   - 3️⃣ 전체 DB 클래스
   - 4️⃣ 진단 결과
```

### 절차 2: 문제 식별
```
Q1: 사용자의 academyId가 있나요?
    ├─ YES → Q2로
    └─ NO → 시나리오 1 참조

Q2: API에서 클래스가 조회되나요?
    ├─ YES → 정상! (문제 없음)
    └─ NO → Q3로

Q3: 전체 DB에 클래스가 있나요?
    ├─ YES → 시나리오 2 (academy_id 불일치)
    └─ NO → 시나리오 3 (클래스 미생성)
```

### 절차 3: 문제 해결
위 시나리오별 해결 방법 참조

### 절차 4: 확인
```
1. 디버그 페이지에서 "전체 새로고침"
2. 2️⃣ API 응답에서 "클래스 개수" 확인
3. 정상: 1개 이상 → 해결 완료!
4. 여전히 0개 → 절차 1부터 다시
```

## 🎯 실제 테스트 예시

### 테스트 1: 학원장 계정으로 로그인
```
1. https://superplacestudy.pages.dev/login
2. 학원장 계정으로 로그인
3. https://superplacestudy.pages.dev/dashboard/debug-classes 접속
```

### 테스트 2: 클래스 추가
```
1. /dashboard/classes/add 에서 클래스 생성
2. 생성 완료 후 즉시 디버그 페이지로 이동
3. "전체 새로고침" 클릭
4. 3️⃣ 전체 DB 클래스에서 방금 생성한 클래스 확인
```

### 테스트 3: 매칭 여부 확인
```
새로 생성한 클래스의 배경색 확인:
- 초록색 = ✅ 매칭됨 (정상)
- 회색 = ❌ 다른 학원 (문제!)
```

## 📸 스크린샷 가이드

### 정상 케이스
```
사용자 정보:
  academyId: 1 [초록 배지]

API 응답:
  클래스 개수: 3개 [초록 표시]
  
전체 DB:
  [초록 배경] 중1 수학반 - academy_id: 1 ✓ 매칭됨
  [초록 배경] 중2 영어반 - academy_id: 1 ✓ 매칭됨
  [초록 배경] 중3 과학반 - academy_id: 1 ✓ 매칭됨

진단 결과:
  ✅ 정상 작동 중
```

### 문제 케이스
```
사용자 정보:
  academyId: 1 [초록 배지]

API 응답:
  클래스 개수: 0개 [노란 경고]
  
전체 DB:
  [회색 배경] 중1 수학반 - academy_id: 10
  [회색 배경] 중2 영어반 - academy_id: 10

진단 결과:
  ⚠️ 문제 원인:
  사용자 academyId (1) != 클래스 academy_id (10)
```

## 🔗 관련 페이지

- **디버그 페이지**: `/dashboard/debug-classes`
- **클래스 목록**: `/dashboard/classes`
- **클래스 추가**: `/dashboard/classes/add`

## 💡 Tip

### 브라우저 콘솔도 함께 확인하세요
```
F12 → Console 탭

디버그 페이지는 다음 로그도 출력합니다:
- 👤 User from localStorage
- 📡 API Response
- 📊 All classes in DB
```

### Cloudflare Workers 로그
```
추가 정보가 필요하면:
Cloudflare Dashboard → Workers & Pages → superplace → Logs

디버그 API 로그:
- 🔍 DEBUG: Get all classes API called
- 🔍 DEBUG: Found X total classes in database
- 🔍 DEBUG: First 3 classes: [...]
```

## 🆘 여전히 문제가 있나요?

다음 정보를 함께 제공해주세요:

1. **디버그 페이지 스크린샷** (전체)
2. **사용자 이메일**
3. **역할** (ADMIN, DIRECTOR 등)
4. **브라우저 콘솔 로그**
5. **Cloudflare Workers 로그** (선택)

---

**업데이트 일시**: 2026-02-22
**커밋 해시**: b9d40b8
**배포 상태**: ✅ 완료 (2-3분 후 반영)
**디버그 페이지 URL**: https://superplacestudy.pages.dev/dashboard/debug-classes
