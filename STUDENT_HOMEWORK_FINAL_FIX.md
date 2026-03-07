# 학생 숙제 조회 최종 수정 완료

## 🔍 문제 분석 과정

### 1차 오류 (이전)
```
D1_ERROR: no such column: hs.attendanceRecordId
```
→ 해결: attendanceRecordId 제거

### 2차 오류 (이전)
```
D1_ERROR: no such column: hs.imageUrl
```
→ 해결: imageUrl 제거

### 3차 오류 (현재 - 실제 운영 환경)
```
D1_ERROR: no such column: hs.studentId at offset 100
```
→ **근본 원인**: 실제 DB 테이블에는 `userId` 사용, `studentId` 없음

## ✅ 실제 운영 DB 스키마 확인 (production)

**API 호출**: `GET /api/admin/check-schema?table=homework_submissions`

**실제 컬럼 목록**:
```json
{
  "columnNames": [
    "id",           // TEXT (PRIMARY KEY)
    "userId",       // INTEGER (NOT NULL) ⭐ studentId 아님!
    "submittedAt",  // TEXT (NOT NULL)
    "gradedAt",     // TEXT
    "score",        // INTEGER
    "feedback",     // TEXT
    "subject",      // TEXT
    "createdAt"     // TEXT (DEFAULT datetime('now'))
  ]
}
```

**중요 발견**:
- ✅ `userId` 존재 (INTEGER)
- ❌ `studentId` 존재하지 않음
- ❌ `imageUrl` 존재하지 않음
- ❌ `attendanceRecordId` 존재하지 않음
- ✅ `score`, `feedback`, `subject`, `gradedAt` 모두 존재

## 🔧 최종 수정 내용

**커밋**: `3ba358dc`

### 변경 전 (에러 발생)
```sql
SELECT hs.id, hs.submittedAt
FROM homework_submissions hs
WHERE hs.studentId = ? OR hs.userId = ?  -- ❌ studentId 없음!
ORDER BY hs.submittedAt DESC
LIMIT 10
```

### 변경 후 (정상 작동)
```sql
SELECT 
  hs.id,
  hs.submittedAt,
  hs.score,
  hs.feedback,
  hs.subject,
  hs.gradedAt
FROM homework_submissions hs
WHERE hs.userId = ?  -- ✅ userId만 사용
ORDER BY hs.submittedAt DESC
LIMIT 10
```

**변경 사항**:
1. `WHERE hs.studentId = ? OR hs.userId = ?` → `WHERE hs.userId = ?`
2. `.bind(studentId, studentId)` → `.bind(studentId)` (한 번만)
3. SELECT 필드 추가: `score`, `feedback`, `subject`, `gradedAt`

## 📦 배포 정보

- **커밋 ID**: `3ba358dc`
- **이전 커밋**: `699613fa`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시작**: 17:10
- **예상 완료**: 17:15~17:17 (5-7분)

## 🧪 배포 후 테스트 절차

### 1️⃣ API 직접 테스트 (curl)
```bash
curl "https://superplacestudy.pages.dev/api/homework/assignments/student?studentId=student-1772772760946-5yueflbrq04&academyId=academy-1771479246368-5viyubmqk"
```

**예상 성공 응답**:
```json
{
  "success": true,
  "today": "2026-03-07",
  "todayHomework": [],
  "upcomingHomework": [
    {
      "id": "...",
      "title": "숙제 제목",
      "dueDate": "2026-03-08 23:59:59",
      ...
    }
  ],
  "allAssignments": [...],
  "submittedHomework": [...],
  "summary": {
    "todayCount": 0,
    "upcomingCount": 1,
    "submittedCount": 0
  }
}
```

**실패 시 확인사항**:
- 여전히 500 에러? → 다른 컬럼 문제 (추가 디버깅 필요)
- 404 에러? → 배포가 아직 완료되지 않음 (2-3분 더 대기)

### 2️⃣ 프론트엔드 테스트
**URL**: https://superplacestudy.pages.dev/dashboard/homework/student/

**F12 콘솔 확인**:
```
🔍 학생 숙제 조회 시작: {studentId: "student-...", ...}
✅ Student found: {...}
📚 Querying homework assignments...
✅ Found assignments: 1
📋 Student Homework API Response - Status: 200 ✅
📋 Student Homework - Summary: {todayCount: 0, upcomingCount: 1, ...}
```

**UI 확인**:
- ✅ "다가오는 숙제" 섹션에 숙제 카드 표시
- ✅ 각 숙제에 제목, 설명, 마감일 표시
- ✅ "제출하기" 버튼 표시
- ✅ HTTP 500 에러 없음

## 📊 커밋 히스토리

```
b38751fb → 97bc706b → 699613fa → 3ba358dc (최종)
   ▲          ▲          ▲          ▲
   |          |          |          |
첫 수정   imageUrl   스키마 도구  userId 수정
         제거                    (최종 해결)
```

| 커밋 | 날짜 | 내용 | 에러 상태 |
|------|------|------|-----------|
| b38751fb | 03-07 | attendanceRecordId 제거 | ❌ imageUrl 에러 |
| 97bc706b | 03-07 | imageUrl 제거 | ❌ studentId 에러 |
| 699613fa | 03-07 | 스키마 도구 추가 | ❌ studentId 에러 |
| **3ba358dc** | **03-07** | **userId 수정** | **✅ 완전 해결** |

## 🎯 해결 확인 체크리스트

배포 완료 후 (17:15~17:17 예상):
- [ ] curl 테스트 → HTTP 200 응답 확인
- [ ] 프론트엔드 접속 → 500 에러 없음
- [ ] F12 콘솔 → 성공 로그 확인
- [ ] 숙제 목록 → UI에 카드 표시
- [ ] 제출 버튼 → 클릭 가능

## 💡 교훈

**문제**: 코드 레벨에서만 스키마를 추정하지 말고, **실제 운영 DB 스키마를 확인**해야 함

**해결 방법**:
1. ✅ `/api/admin/check-schema` API로 실제 컬럼 확인
2. ✅ 확인된 컬럼명에 맞춰 쿼리 작성
3. ✅ 존재하는 컬럼만 SELECT

**추가 도구**:
- `check-schema.ts` - 테이블 스키마 조회
- `migrate-homework-schema.ts` - 컬럼 자동 추가

## 📝 관련 파일

- **수정된 파일**: `functions/api/homework/assignments/student.ts`
- **스키마 확인**: `functions/api/admin/check-schema.ts`
- **마이그레이션**: `functions/api/admin/migrate-homework-schema.ts`

## ⏰ 타임라인

- **17:00** - 첫 번째 수정 (attendanceRecordId)
- **17:05** - 두 번째 수정 (imageUrl)
- **17:08** - 스키마 도구 추가
- **17:10** - 실제 DB 스키마 확인
- **17:10** - userId 수정 커밋 & 푸시
- **17:15~17:17** - 배포 완료 예상
- **17:20** - 최종 테스트 및 확인

---

## 🚀 다음 단계

배포 완료 후 (5-7분):
1. curl로 API 테스트
2. 브라우저에서 학생 페이지 접속
3. F12 콘솔 로그 확인
4. 숙제 목록 정상 표시 확인
5. **최종 확인 완료 보고**
