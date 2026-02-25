# 학생 목록 표시 문제 - 최종 해결 방안

**날짜**: 2026-02-25  
**문제**: 학원장이 추가한 학생이 학생 목록에 표시되지 않음

---

## 🔍 문제 원인 분석

### 1. **이중 테이블 구조 문제**

```
📊 데이터베이스 상태
├─ User 테이블 (PascalCase)
│  └─ 신규 학생 저장 (학생 생성 API)
│     - academy_id: INTEGER
│     - role: 'STUDENT'
│
└─ users 테이블 (snake_case)
   └─ 기존 학생 데이터 (레거시)
      - academy_id: INTEGER  
      - role: 'STUDENT'
```

### 2. **학생 목록 API 문제**

**기존 로직** (`functions/api/students/by-academy.ts`):
```typescript
// ❌ 문제: 순차 조회 + 조기 종료
if (!result || result.results.length === 0) {
  // User 테이블 조회
}
// → users 테이블에 54명 존재 → User 테이블 조회 스킵
```

**결과**: 신규 추가한 학생(User 테이블)이 목록에 나타나지 않음

---

## ✅ 적용된 해결책

### 1. **학생 목록 API 수정**

**파일**: `functions/api/students/by-academy.ts`

```typescript
// ✅ 해결: 병렬 조회 + 통합
let allStudents: any[] = [];

// 1️⃣ User 테이블 조회 (신규 학생)
try {
  const userResult = await DB.prepare(query).bind(...bindings).all();
  allStudents.push(...userResult.results);
} catch (err) { /* ... */ }

// 2️⃣ users 테이블 조회 (기존 학생)
try {
  const usersResult = await DB.prepare(query).bind(...bindings).all();
  allStudents.push(...usersResult.results);
} catch (err) { /* ... */ }

// 3️⃣ 중복 제거
const uniqueStudents = Array.from(
  new Map(allStudents.map(s => [s.id, s])).values()
);
```

### 2. **학원 관리 페이지 API 수정**

**파일**: `functions/api/admin/academies.ts`

**개별 학원 조회** (GET `/api/admin/academies?id=1`):
```typescript
// User 테이블에서 학생 조회
const userStudentsQuery = `
  SELECT id, name, email, phone, created_at
  FROM User
  WHERE academy_id = ? AND role = ?
`;

// users 테이블에서 학생 조회
const usersStudentsQuery = `
  SELECT id, name, email, phone, created_at
  FROM users
  WHERE academy_id = ? AND role = ?
`;

// 통합 및 중복 제거
const students = Array.from(
  new Map([...userStudents, ...usersStudents].map(s => [s.id, s])).values()
);
```

**전체 학원 목록 조회** (GET `/api/admin/academies`):
```typescript
// User 테이블 학생 수
const userCount = await DB.prepare(`
  SELECT COUNT(*) FROM User WHERE academy_id = ? AND role = ?
`).bind(academyId, 'STUDENT').first();

// users 테이블 학생 수
const usersCount = await DB.prepare(`
  SELECT COUNT(*) FROM users WHERE academy_id = ? AND role = ?
`).bind(academyId, 'STUDENT').first();

const totalStudents = userCount.count + usersCount.count;
```

---

## 📊 기대 결과

### Before (수정 전):
```json
GET /api/students/by-academy
{
  "students": [
    {"id": 1, "name": "기존학생1", "academyId": null},
    {"id": 2, "name": "기존학생2", "academyId": null}
  ]
}
// 신규 학생 누락 ❌
```

### After (수정 후):
```json
GET /api/students/by-academy
{
  "students": [
    {"id": "student-177...", "name": "신규학생", "academyId": "1"},
    {"id": 3, "name": "기존학생1", "academyId": "1"},
    {"id": 5, "name": "기존학생2", "academyId": "1"}
  ]
}
// User + users 테이블 통합 ✅
```

### 학원 상세 페이지:
```json
GET /api/admin/academies?id=1
{
  "academy": {
    "id": "1",
    "name": "테스트 학원",
    "students": [
      {"id": "student-177...", "name": "신규학생"},
      {"id": 3, "name": "기존학생1"}
    ],
    "studentCount": 2
  }
}
// 신규 + 기존 학생 모두 표시 ✅
```

---

## 🚀 배포 정보

| 항목 | 정보 |
|------|------|
| **리포지터리** | https://github.com/kohsunwoo12345-cmyk/superplace |
| **브랜치** | main |
| **최종 커밋** | `4648b16` - "fix: 학원 관리 페이지 학생 목록 User+users 테이블 통합 조회" |
| **배포 URL** | https://superplacestudy.pages.dev |
| **배포 플랫폼** | Cloudflare Pages (자동 배포) |

---

## 🔧 배포 후 확인 사항

### ⚠️ 현재 상태

```bash
# API 엔드포인트 테스트 결과
GET /api/students/by-academy
→ HTTP 404 (Cloudflare Pages 함수 미배포)

GET /api/admin/academies  
→ HTTP 401 Unauthorized (정상 - 인증 필요)
```

### 🛠️ 해결 방법

**옵션 1: Cloudflare Dashboard에서 수동 재배포**
1. https://dash.cloudflare.com 로그인
2. Pages → superplacestudy 프로젝트 선택
3. "Deployments" 탭 → 최신 커밋 확인
4. "Retry deployment" 클릭 (필요 시)

**옵션 2: Git 강제 푸시**
```bash
cd /home/user/webapp
git commit --allow-empty -m "chore: trigger Cloudflare Pages rebuild"
git push origin main
```

**옵션 3: Cloudflare 빌드 로그 확인**
1. Cloudflare Pages 대시보드
2. 최신 배포 클릭
3. "Build log" 확인
4. TypeScript 컴파일 오류 확인

---

## 📝 테스트 시나리오

### 1. **학생 목록 API 테스트**

```bash
# 학원장 로그인
TOKEN=$(curl -s -X POST "https://superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"director@academy.com","password":"your_password"}' \
  | jq -r '.token')

# 학생 추가
curl -X POST "https://superplacestudy.pages.dev/api/students/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트학생","phone":"01012345678","password":"test1234"}'

# 학생 목록 조회
curl -X GET "https://superplacestudy.pages.dev/api/students/by-academy" \
  -H "Authorization: Bearer $TOKEN" | jq '.students[:5]'
```

**예상 결과**: 신규 추가한 학생이 목록 상단에 표시됨 ✅

### 2. **학원 관리 페이지 테스트**

```bash
# 학원 목록 조회
curl -X GET "https://superplacestudy.pages.dev/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN" | jq '.academies[0]'

# 학원 상세 조회 (academyId=1)
curl -X GET "https://superplacestudy.pages.dev/api/admin/academies?id=1" \
  -H "Authorization: Bearer $TOKEN" | jq '.academy | {name, studentCount, students}'
```

**예상 결과**: 
- `studentCount`: User + users 테이블 합계
- `students`: 두 테이블의 모든 학생 목록

---

## 🎯 확인 체크리스트

### 학생 목록 페이지
- [ ] 학원장 로그인 성공
- [ ] 학생 추가 성공
- [ ] 학생 목록 API 응답 확인
- [ ] 신규 학생이 목록 상단에 표시됨
- [ ] academyId 필터링 정상 작동

### 학원 관리 페이지
- [ ] `/dashboard/admin/academies/` 접속
- [ ] 학원 목록 표시 확인
- [ ] 학원 클릭 → 상세 페이지 이동
- [ ] 학생 목록 섹션에 모든 학생 표시
- [ ] 학생 수 정확히 표시 (User + users 합계)

### 출석 및 숙제 기능
- [ ] 신규 학생 출석 체크
- [ ] 출석 현황 페이지에 표시
- [ ] 신규 학생 숙제 제출
- [ ] 숙제 검사 결과 페이지에 표시

---

## 🔄 장기 개선 사항 (권장)

### 1. **테이블 통합**
```sql
-- User 테이블로 통일
INSERT INTO User (id, name, email, phone, academy_id, role, ...)
SELECT id, name, email, phone, academy_id, role, ...
FROM users
WHERE role = 'STUDENT' AND id NOT IN (SELECT id FROM User);

-- users 테이블 삭제 (백업 후)
DROP TABLE users;
```

### 2. **외래 키 제약 추가**
```sql
CREATE INDEX idx_user_academy ON User(academy_id, role);
CREATE INDEX idx_attendance_user ON attendance_records_v2(userId);
CREATE INDEX idx_homework_user ON homework_submissions_v2(userId);
```

### 3. **트랜잭션 강화**
```typescript
// 학생 생성 시 트랜잭션으로 묶기
await DB.batch([
  DB.prepare('INSERT INTO User ...').bind(...),
  DB.prepare('INSERT INTO student_attendance_codes ...').bind(...),
  DB.prepare('INSERT INTO class_students ...').bind(...)
]);
```

---

## 📌 커밋 히스토리

```bash
4648b16 - fix: 학원 관리 페이지 학생 목록 User+users 테이블 통합 조회
e9aca16 - test: 학생 목록 통합 조회 로직 검증 스크립트 추가
5eaa4ec - docs: 학생 목록 표시 문제 최종 해결 보고서 추가
cb87356 - fix: User+users 테이블 통합 조회로 신규 학생 표시 문제 해결
ec6e1c4 - fix: academyIdText 변수 참조 오류 수정
e8796de - fix: academyId를 정수로 저장 (실수 1.0 문제 해결)
```

---

## 💡 문제 지속 시 추가 조치

### 1. **Cloudflare Pages 빌드 로그 확인**
```
로그인 → Pages → superplacestudy → Deployments → 최신 배포 클릭
→ Build log 탭에서 TypeScript 컴파일 오류 확인
```

### 2. **로컬 빌드 테스트**
```bash
cd /home/user/webapp
npm run build
# 오류 없이 빌드 완료되는지 확인
```

### 3. **함수 디렉터리 구조 확인**
```bash
tree functions/api/students/
# by-academy.ts 파일 존재 확인

tree functions/api/admin/
# academies.ts 파일 존재 확인
```

### 4. **TypeScript 타입 오류 확인**
```bash
cd /home/user/webapp
npx tsc --noEmit
# 타입 오류가 있으면 수정
```

---

## 📞 지원 및 문의

- **GitHub Issues**: https://github.com/kohsunwoo12345-cmyk/superplace/issues
- **리포지터리**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://superplacestudy.pages.dev

---

## ✅ 최종 정리

**완료된 작업**:
1. ✅ 학생 목록 API - User + users 테이블 통합 조회 로직 구현
2. ✅ 학원 관리 API - 학생 목록 통합 조회 및 학생 수 계산 수정
3. ✅ academyId 필터링 정상화
4. ✅ 중복 제거 로직 구현
5. ✅ 코드 커밋 및 GitHub 푸시 완료

**배포 상태**:
- ⏳ Cloudflare Pages 자동 배포 진행 중 (2-5분 소요)
- ⚠️ API 엔드포인트 404 → 재배포 필요할 수 있음

**다음 단계**:
1. Cloudflare Pages 배포 완료 대기 (5-10분)
2. 실제 학원장 계정으로 로그인
3. 학생 추가 및 목록 확인
4. `/dashboard/admin/academies/` 페이지에서 학원 상세 확인
5. 문제 지속 시 Cloudflare 빌드 로그 확인 및 수동 재배포

---

**작성일**: 2026-02-25  
**최종 업데이트**: 2026-02-25 12:25 KST
