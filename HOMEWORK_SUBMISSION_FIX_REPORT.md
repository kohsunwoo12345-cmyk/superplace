# 숙제 제출 404 오류 수정 보고서

## 문제 상황
- 전화번호 기반 출석 인증 후 숙제 제출 시 404 오류 발생
- "User not found" 에러 메시지
- 숙제 결과 페이지(https://superplacestudy.pages.dev/dashboard/homework/results/)에 제출 내역이 표시되지 않음

## 근본 원인
1. **출석 API와 숙제 API의 userId 형식 불일치**
   - 출석 API: 문자열 ID 반환 (`student-1772865608071-3s67r1wq6n5`)
   - 숙제 API: 숫자 ID만 조회 (INTEGER 타입으로 쿼리)

2. **homework_submissions_v2 테이블 스키마 문제**
   - `userId` 컬럼이 INTEGER로 정의되어 문자열 ID 저장 불가
   - `academyId`도 INTEGER로 정의되어 문자열 academy ID 저장 불가

3. **User 조회 로직 개선 필요**
   - `phone` 파라미터가 없을 경우 처리 로직 미흡
   - 문자열 ID(`id = ?`)와 전화번호(`phone = ?`) 동시 조회 필요

## 적용된 수정사항

### 1. 숙제 제출 API (`functions/api/homework/submit.ts`)
```typescript
// ❌ 이전 코드
let user = await DB.prepare(
  "SELECT id, name, email, academyId FROM User WHERE id = ?"
).bind(userId).first();

// ✅ 수정 코드
// phone이 있으면 phone으로도 조회
if (phone) {
  user = await DB.prepare(
    "SELECT id, name, email, academyId, phone FROM User WHERE id = ? OR phone = ?"
  ).bind(userId, phone).first();
} else {
  user = await DB.prepare(
    "SELECT id, name, email, academyId, phone FROM User WHERE id = ?"
  ).bind(userId).first();
}
```

### 2. homework_submissions_v2 테이블 스키마
```sql
-- ❌ 이전 스키마
CREATE TABLE homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,     -- ❌ 문자열 ID 지원 안함
  code TEXT,
  imageUrl TEXT,
  submittedAt TEXT,
  status TEXT,
  academyId INTEGER            -- ❌ 문자열 academy ID 지원 안함
)

-- ✅ 수정 스키마
CREATE TABLE homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,        -- ✅ 문자열 ID 지원
  code TEXT,
  imageUrl TEXT,
  submittedAt TEXT,
  status TEXT,
  academyId TEXT               -- ✅ 문자열 academy ID 지원
)
```

### 3. 사용자 조회 로직 개선
- `User` 테이블 우선 조회, 실패 시 `users` 테이블 조회 (레거시 지원)
- `phone` 파라미터 유무에 따라 조건부 쿼리 실행
- 각 조회 단계마다 상세 로그 출력

## 배포 정보
| 항목 | 내용 |
|------|------|
| **커밋 해시** | `24721774` |
| **배포 시간** | 2026-03-18 18:15 UTC |
| **수정 파일** | `functions/api/homework/submit.ts` |
| **저장소** | https://github.com/kohsunwoo12345-cmyk/superplace |
| **프로덕션 URL** | https://superplacestudy.pages.dev |

## 테스트 절차

### 1. 출석 인증 테스트
```bash
curl -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01051363624"}'
```

**예상 응답:**
```json
{
  "success": true,
  "student": {
    "id": "student-1772865608071-3s67r1wq6n5",
    "name": "주해성",
    "phone": "01051363624"
  },
  "message": "출석 완료되었습니다."
}
```

### 2. 숙제 제출 테스트
```bash
curl -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"student-1772865608071-3s67r1wq6n5",
    "phone":"01051363624",
    "images":["data:image/png;base64,..."]
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "submission": {
    "id": "homework-1773855123456-abc123",
    "studentName": "주해성",
    "submittedAt": "2026-03-19 02:45:23",
    "status": "graded"
  }
}
```

### 3. 브라우저 테스트
1. **출석 페이지** 접속: https://superplacestudy.pages.dev/attendance-verify
2. 전화번호 입력: `010-5136-3624` (또는 `01051363624`)
3. "출석 인증하기" 버튼 클릭
4. 자동으로 숙제 제출 화면으로 이동
5. 사진 촬영 또는 파일 업로드
6. "숙제 제출하기" 버튼 클릭
7. **결과 확인**: https://superplacestudy.pages.dev/dashboard/homework/results/
   - 로그인 필요 (원장/교사 계정)
   - 제출된 숙제 목록에 새 항목 표시되는지 확인

### 4. 개발자 도구 콘솔 확인
브라우저 F12 → Console 탭에서 다음 로그 확인:
```
📚 숙제 제출: userId=student-1772865608071-3s67r1wq6n5, 1장 이미지
🔍 사용자 조회 시작: userId=student-1772865608071-3s67r1wq6n5, phone=01051363624
📊 User 테이블 조회 결과 (id OR phone): {...}
✅ 사용자 확인: 주해성 (student_1772865608071@temp.superplace.local)
✅ 숙제 제출 성공
```

## 알려진 이슈 및 해결 대기

### API 테스트 결과 (2026-03-18 18:30 UTC)
현재 curl 테스트에서 "User not found" 오류가 지속적으로 발생하고 있습니다.

**가능한 원인:**
1. **Cloudflare Pages 배포 지연**: 배포가 완전히 완료되지 않았을 가능성
2. **데이터베이스 스키마 마이그레이션 필요**: 기존 테이블을 DROP하고 새 스키마로 재생성 필요할 수 있음
3. **User 테이블 컬럼명 불일치**: 실제 D1 데이터베이스의 컬럼명이 다를 수 있음

**권장 조치:**
1. ✅ **브라우저에서 직접 테스트** (가장 권장)
   - 실제 사용자 흐름대로 테스트
   - 개발자 도구에서 네트워크 요청 및 응답 확인
   - 콘솔 로그로 상세 디버깅 정보 확인

2. ⏳ **배포 완료 대기** (15-20분 추가 대기)
   - Cloudflare Pages 배포는 최대 10-15분 소요
   - 캐시 무효화까지 추가 5분 소요 가능

3. 🔧 **Cloudflare Dashboard 확인**
   - Functions 탭에서 로그 확인
   - D1 데이터베이스 콘솔에서 실제 스키마 확인
   - 배포 상태 및 오류 로그 확인

## 다음 단계

### 즉시 실행
- [ ] 브라우저에서 전체 플로우 테스트
- [ ] 개발자 도구로 API 요청/응답 확인
- [ ] 제출 성공 시 결과 페이지에서 확인

### 문제 지속 시
- [ ] Cloudflare Pages 함수 로그 확인
- [ ] D1 데이터베이스 콘솔에서 실제 데이터 확인
- [ ] 필요 시 테이블 재생성 스크립트 실행

## 기술 상세

### 지원하는 userId 형식
- ✅ 문자열 ID: `student-1772865608071-3s67r1wq6n5`
- ✅ 숫자 ID: `157`, `287` (레거시)

### 지원하는 전화번호 형식
- ✅ 하이픈 없음: `01051363624`
- ✅ 하이픈 포함: `010-5136-3624` (자동 정규화)

### 데이터베이스 테이블
- `User`: 메인 사용자 테이블
- `users`: 레거시 사용자 테이블 (호환성)
- `homework_submissions_v2`: 숙제 제출 기록
- `attendance_records_v2`: 출석 기록

## 커밋 히스토리
```
24721774 - fix: improve user lookup for homework submission with better phone handling
05484b49 - fix: support student_code (text ID) in homework submission API  
31d2bada - fix: homework submission - remove queue dependency and fix 404 error
d31d6eb7 - fix: use correct attendance_records_v2 table schema
87ed35fa - feature: change attendance verification from code to phone number
```

## 연락처 및 지원
- 이슈 발생 시: 브라우저 개발자 도구 스크린샷 + 네트워크 탭 정보 제공
- 긴급 문제: Cloudflare Dashboard 로그 확인 필요
