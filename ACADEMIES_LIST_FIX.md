# 🏢 학원장 목록 표시 - 완전 해결

## 📋 문제

**증상:**
- https://superplacestudy.pages.dev/dashboard/admin/academies 에서 학원이 안 보임
- 또는 Mock 데이터만 표시됨

**요구사항:**
- 실제 데이터베이스의 모든 학원 표시
- 학원장 정보 함께 표시
- 다른 데이터베이스는 건들지 않음

---

## ✅ 해결 완료

### 1. API 엔드포인트 생성

**파일:** `functions/api/admin/academies.ts`

**기능:**
- GET /api/admin/academies
- Academy 테이블에서 모든 학원 조회
- User 테이블과 JOIN하여 학원장 정보 가져오기
- 학생/선생님 수 계산

**SQL 쿼리:**
```sql
SELECT 
  a.id,
  a.name,
  a.address,
  a.phone,
  a.email,
  a.isActive,
  a.createdAt,
  u.name as directorName,
  u.email as directorEmail,
  u.phoneNumber as directorPhone,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'STUDENT') as studentCount,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'TEACHER') as teacherCount,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'DIRECTOR') as directorCount
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
ORDER BY a.createdAt DESC
```

### 2. 프론트엔드 수정

**파일:** `src/app/dashboard/admin/academies/page.tsx`

**변경사항:**
- Mock 데이터 완전 제거
- 실제 API 호출만 사용
- 상세 로깅 추가
- 에러 처리 강화

### 3. 패키지 추가

```bash
npm install xlsx react-hot-toast
```

---

## 🎯 배포 정보

### GitHub
- **Repository:** https://github.com/kohsunwoo12345-cmyk/superplace
- **최신 커밋:** `e72d7cf` - 학원장 목록 API 추가
- **브랜치:** `main`

### Cloudflare Pages
- **Live URL:** https://superplacestudy.pages.dev
- **배포 시간:** 약 5~10분
- **자동 배포:** 진행 중

---

## 📊 테스트 방법

### 1단계: 배포 완료 대기 (5~10분)
```
Cloudflare Dashboard → Pages → superplacestudy
→ Latest Deployment 상태 확인
→ "Success" 표시 확인
```

### 2단계: 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/admin/academies
로그인: admin@superplace.com / admin1234
```

### 3단계: Console 로그 확인 (F12)
```javascript
기대 로그:
📡 Fetching academies from API...
📊 API Response status: 200 true
✅ 학원 목록 로드 완료: {success: true, academies: [...], total: N}
📊 학원 개수: N
📋 학원 목록: [...]
```

### 4단계: UI 확인
- 통계 카드 (전체 학원, 활성 학원, 전체 학생, 전체 선생님)
- 학원 목록 카드
- 각 학원의 학원장 이름 표시
- 학생 수, 선생님 수 표시

---

## 🔍 디버깅

### Console 로그 확인

**정상 케이스:**
```javascript
📡 Fetching academies from API...
📊 API Response status: 200 true
✅ 학원 목록 로드 완료: {
  success: true,
  academies: [
    {
      id: "1",
      name: "슈퍼플레이스 학원",
      directorName: "김학원",
      studentCount: 10,
      teacherCount: 3
    },
    ...
  ],
  total: 5
}
📊 학원 개수: 5
```

**401 에러:**
```javascript
❌ 학원 목록 로드 실패: 401 {error: "Unauthorized"}
```
**해결:** 로그아웃 후 재로그인

**빈 배열:**
```javascript
✅ 학원 목록 로드 완료: {success: true, academies: [], total: 0}
📊 학원 개수: 0
```
**원인:** Academy 테이블에 데이터 없음

---

## 📋 데이터베이스 확인

### Cloudflare D1 Console

**학원 조회:**
```sql
SELECT 
  id,
  name,
  address,
  directorId
FROM Academy;
```

**학원장 조회:**
```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  a.name as academyName
FROM User u
LEFT JOIN Academy a ON u.academyId = a.id
WHERE u.role = 'DIRECTOR';
```

**학원별 통계:**
```sql
SELECT 
  a.name as academy,
  COUNT(CASE WHEN u.role = 'STUDENT' THEN 1 END) as students,
  COUNT(CASE WHEN u.role = 'TEACHER' THEN 1 END) as teachers,
  COUNT(CASE WHEN u.role = 'DIRECTOR' THEN 1 END) as directors
FROM Academy a
LEFT JOIN User u ON u.academyId = a.id
GROUP BY a.id, a.name;
```

---

## 🎨 표시되는 정보

### 통계 카드 (상단)
- **전체 학원:** N개
- **활성 학원:** N개
- **전체 학생:** N명
- **전체 선생님:** N명
- **평균 학생 수:** N명/학원

### 학원 카드 (목록)
각 학원별로 표시:
- 🏢 학원 이름
- 👤 학원장: 이름
- 📍 주소
- 📞 전화번호
- 📧 이메일
- 👥 학생 수
- 👨‍🏫 선생님 수
- 📅 등록일
- 🟢 활성화 상태

---

## 🚨 문제 해결

### 문제 1: 학원이 안 보임 (total: 0)

**원인:** Academy 테이블에 데이터 없음

**확인:**
```sql
SELECT COUNT(*) as count FROM Academy;
```

**해결:** 학원 데이터가 있는지 확인. 없다면 다른 페이지에서 학원 생성 필요.

---

### 문제 2: 학원장 이름이 "학원장 미지정"

**원인:** Academy.directorId가 NULL이거나 해당 User가 없음

**확인:**
```sql
SELECT 
  a.id,
  a.name,
  a.directorId,
  u.name as directorName
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id;
```

**해결:** directorId를 올바른 User ID로 업데이트

```sql
-- 학원장 찾기
SELECT id, name FROM User WHERE role = 'DIRECTOR';

-- Academy 업데이트
UPDATE Academy 
SET directorId = '[User ID]'
WHERE id = '[Academy ID]';
```

---

### 문제 3: 학생/선생님 수가 0

**원인:** User 테이블에 해당 학원의 학생/선생님 없음

**확인:**
```sql
SELECT 
  academyId,
  role,
  COUNT(*) as count
FROM User
WHERE role IN ('STUDENT', 'TEACHER')
GROUP BY academyId, role;
```

**해결:** 학생/선생님이 없다면 정상. 있어야 한다면 academyId 확인.

---

### 문제 4: 401 Unauthorized

**원인:** 토큰 만료 또는 없음

**해결:**
```javascript
// Console에서 실행
localStorage.clear();
// 로그아웃 → 재로그인
```

---

## 🎯 최종 확인

### ✅ 성공 기준

1. **페이지 로드:**
   - https://superplacestudy.pages.dev/dashboard/admin/academies
   - 로딩 후 학원 목록 표시

2. **Console 로그:**
   ```
   ✅ 학원 목록 로드 완료
   📊 학원 개수: N (N > 0)
   ```

3. **UI 표시:**
   - 통계 카드에 숫자 표시
   - 학원 카드 목록
   - 학원장 이름 표시
   - 학생/선생님 수 표시

4. **검색 기능:**
   - 검색창에 학원 이름 입력
   - 필터링된 결과 표시

---

## 📦 변경된 파일

1. **functions/api/admin/academies.ts** (신규)
   - Academy 조회 API
   - 2,849 bytes

2. **src/app/dashboard/admin/academies/page.tsx** (수정)
   - Mock 데이터 제거
   - 로깅 추가
   - +105, -33 lines

3. **package.json** (업데이트)
   - xlsx 추가
   - react-hot-toast 추가

---

## 🔧 API 명세

### GET /api/admin/academies

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "academies": [
    {
      "id": "1",
      "name": "슈퍼플레이스 학원",
      "address": "서울시 강남구...",
      "phone": "02-1234-5678",
      "email": "contact@academy.com",
      "directorName": "김학원",
      "directorEmail": "director@academy.com",
      "directorPhone": "010-1234-5678",
      "studentCount": 10,
      "teacherCount": 3,
      "directorCount": 1,
      "isActive": true,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 1
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Response (500):**
```json
{
  "success": false,
  "error": "Failed to fetch academies",
  "message": "..."
}
```

---

## 💡 추가 기능 (향후 가능)

- 학원 생성 버튼
- 학원 수정 버튼
- 학원 삭제 기능
- 학원 상세 페이지 링크
- 엑셀 다운로드
- 학원별 필터링
- 정렬 기능

---

**작성:** Claude (AI Coding Agent)  
**작성일:** 2026-02-18  
**커밋:** e72d7cf  
**상태:** ✅ 완료
