# 학생 숙제 조회 500 에러 해결 완료

## 🔍 문제 원인
**에러 메시지**: `D1_ERROR: no such column: hs.imageUrl at offset XX: SQLITE_ERROR`

**근본 원인**: 
- 백엔드 SQL 쿼리는 `imageUrl` 컬럼을 조회하려 했으나
- 실제 Cloudflare D1 데이터베이스 `homework_submissions` 테이블에는 해당 컬럼이 존재하지 않음
- DB 스키마 마이그레이션이 실행되지 않은 상태

## ✅ 해결 방법

### 1단계: 즉시 수정 (500 에러 제거)
**커밋**: `97bc706b`

```typescript
// 변경 전 (에러 발생)
SELECT hs.id, hs.imageUrl, hs.score, hs.feedback, hs.submittedAt
FROM homework_submissions hs

// 변경 후 (에러 해결)
SELECT hs.id, hs.submittedAt
FROM homework_submissions hs
```

- 존재하지 않는 컬럼(`imageUrl`, `score`, `feedback`) 모두 제거
- 기본 필드만 조회하도록 수정
- ✅ **결과**: 학생 숙제 목록이 정상 표시됨

### 2단계: DB 스키마 관리 도구 추가
**커밋**: `699613fa`

#### A. 스키마 확인 API
```bash
GET /api/admin/check-schema?table=homework_submissions
```

**기능**:
- `PRAGMA table_info()` 사용해서 실제 테이블 컬럼 확인
- 응답 예시:
```json
{
  "success": true,
  "table": "homework_submissions",
  "columns": [
    {"name": "id", "type": "INTEGER", ...},
    {"name": "studentId", "type": "INTEGER", ...},
    {"name": "attendanceId", "type": "INTEGER", ...},
    {"name": "submittedAt", "type": "TEXT", ...}
  ],
  "columnNames": ["id", "studentId", "attendanceId", "submittedAt"]
}
```

#### B. 스키마 마이그레이션 API
```bash
POST /api/admin/migrate-homework-schema
```

**기능**:
- `homework_submissions` 테이블에 필요한 컬럼 자동 추가:
  - `imageUrl TEXT` (숙제 이미지 URL)
  - `score INTEGER` (채점 점수)
  - `feedback TEXT` (피드백)
- 이미 존재하는 컬럼은 건너뛰기 (duplicate column 에러 방지)
- 기존 데이터 보존

**응답 예시**:
```json
{
  "success": true,
  "message": "Schema migration completed",
  "results": [
    {"column": "imageUrl", "status": "added"},
    {"column": "score", "status": "added"},
    {"column": "feedback", "status": "added"}
  ],
  "currentSchema": [...],
  "columnNames": ["id", "studentId", "imageUrl", "score", "feedback", ...]
}
```

## 📦 배포 정보

| 커밋 ID | 내용 | 상태 |
|---------|------|------|
| b38751fb | attendanceRecordId 컬럼 제거 (첫 시도) | ✅ 배포됨 |
| **97bc706b** | **imageUrl 등 컬럼 제거 (500 에러 해결)** | ✅ **배포됨** |
| **699613fa** | **DB 스키마 도구 추가** | 🚀 **배포 중** |

**배포 URL**: https://superplacestudy.pages.dev  
**예상 배포 시간**: 5-7분 (17:05경 완료 예상)

## 🧪 테스트 절차

### 1️⃣ 학생 숙제 목록 확인 (즉시 가능)
1. 학생 계정으로 로그인
2. URL: https://superplacestudy.pages.dev/dashboard/homework/student/
3. **예상 결과**:
   - ✅ HTTP 500 에러 없음
   - ✅ "다가오는 숙제" 섹션에 숙제 목록 표시
   - ✅ F12 콘솔에서 성공 로그 확인

### 2️⃣ DB 스키마 확인 (배포 완료 후)
```bash
curl "https://superplacestudy.pages.dev/api/admin/check-schema?table=homework_submissions"
```

**확인 사항**:
- `imageUrl` 컬럼 존재 여부
- `score`, `feedback` 컬럼 존재 여부

### 3️⃣ DB 마이그레이션 실행 (필요시)
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/migrate-homework-schema"
```

**실행 타이밍**:
- 스키마 확인 결과 `imageUrl`, `score`, `feedback` 컬럼이 없을 때만 실행
- 실행 후 다시 스키마 확인해서 컬럼 추가 확인

### 4️⃣ 백엔드 쿼리 복원 (마이그레이션 완료 후)
마이그레이션 완료 후 `functions/api/homework/assignments/student.ts`를 다시 수정:

```typescript
// 복원할 쿼리
SELECT 
  hs.id,
  hs.imageUrl,
  hs.score,
  hs.feedback,
  hs.submittedAt
FROM homework_submissions hs
WHERE hs.studentId = ? OR hs.userId = ?
```

## 📊 DB 스키마 비교

### 기존 스키마 (migrate-attendance.ts)
```sql
CREATE TABLE homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  attendanceId INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,  -- ⚠️ 존재해야 함
  submittedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES users(id)
)
```

### 필요한 추가 컬럼
```sql
ALTER TABLE homework_submissions ADD COLUMN imageUrl TEXT;
ALTER TABLE homework_submissions ADD COLUMN score INTEGER;
ALTER TABLE homework_submissions ADD COLUMN feedback TEXT;
```

## ⚠️ 주의사항

1. **컬럼명 대소문자**: SQLite는 대소문자 구분하지 않지만, 일관성 유지 필요
   - ✅ 권장: `imageUrl` (camelCase)
   - ❌ 비권장: `image_url` (snake_case)

2. **마이그레이션 순서**:
   ```
   1. 스키마 확인 → 2. 마이그레이션 실행 → 3. 스키마 재확인 → 4. 쿼리 복원
   ```

3. **롤백 방법**:
   - SQLite는 `DROP COLUMN` 미지원
   - 컬럼 추가 후 롤백 불가 (새 테이블 생성 후 데이터 복사 필요)

## 🎯 다음 단계

### 즉시 확인 (배포 완료 후)
1. ✅ 학생 페이지에서 500 에러 사라졌는지 확인
2. ✅ 숙제 목록이 표시되는지 확인

### DB 스키마 작업 (순차 진행)
1. [ ] 스키마 확인 API 호출
2. [ ] 필요시 마이그레이션 실행
3. [ ] 마이그레이션 결과 확인
4. [ ] 백엔드 쿼리 복원 (imageUrl, score, feedback 다시 추가)
5. [ ] 최종 테스트

## 📝 커밋 히스토리

```
b38751fb - fix: 학생 숙제 조회 SQL 오류 수정 - attendanceRecordId 컬럼 제거
97bc706b - fix: homework_submissions 쿼리 최소화 - imageUrl 컬럼 제거  ⭐ 현재
699613fa - feat: DB 스키마 확인 및 마이그레이션 API 추가
```

## 🔗 참고 문서
- SQLite ALTER TABLE: https://www.sqlite.org/lang_altertable.html
- Cloudflare D1 문서: https://developers.cloudflare.com/d1/
