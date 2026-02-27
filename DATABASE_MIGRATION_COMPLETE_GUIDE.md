# 데이터베이스 마이그레이션 종합 가이드

## 📅 작성 일자
2026-02-27

## 🚨 발견된 문제들

### 1. 학생 추가 실패
**에러**: `D1_ERROR: table User has no column named school`
**원인**: User 테이블에 `school` 컬럼 없음

### 2. 반 생성 실패
**에러**: `D1_ERROR: no such table: Class`
**원인**: Class, ClassSchedule, ClassStudent 테이블 없음

## ✅ 필수 마이그레이션 목록

### 마이그레이션 1: school 컬럼 추가
**파일**: `/migrations/add_school_column.sql`
**영향**: 학생의 학교명 저장

```bash
wrangler d1 execute superplace-db --file=migrations/add_school_column.sql --remote
```

**SQL**:
```sql
ALTER TABLE User ADD COLUMN school TEXT;
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
```

### 마이그레이션 2: Class 테이블 생성
**파일**: `/migrations/add_class_tables.sql`
**영향**: 반 생성, 학생 배정, 스케줄 관리

```bash
wrangler d1 execute superplace-db --file=migrations/add_class_tables.sql --remote
```

**생성 테이블**:
- `Class` - 반 정보
- `ClassSchedule` - 수업 시간표
- `ClassStudent` - 학생-반 연결

## 📊 현재 상태 vs 마이그레이션 후

| 기능 | 현재 (마이그레이션 전) | 마이그레이션 후 |
|------|----------------------|----------------|
| 학생 추가 | ✅ 작동 (school 제외) | ✅ 완전 작동 |
| 학생 school 저장 | ❌ 불가 | ✅ 가능 |
| 반 생성 | ❌ 불가 | ✅ 가능 |
| 반 목록 조회 | ❌ 불가 | ✅ 가능 |
| 학생 반 배정 | ❌ 불가 | ✅ 가능 |
| 스케줄 관리 | ❌ 불가 | ✅ 가능 |

## 🔥 긴급 마이그레이션 실행 방법

### 방법 A: 한 번에 모두 실행 (권장)

```bash
cd /home/user/webapp

# 1. school 컬럼 추가
wrangler d1 execute superplace-db --file=migrations/add_school_column.sql --remote

# 2. Class 테이블 생성
wrangler d1 execute superplace-db --file=migrations/add_class_tables.sql --remote

# 완료!
```

### 방법 B: Cloudflare Dashboard에서 수동 실행

1. https://dash.cloudflare.com 접속
2. Workers & Pages → D1 → `superplace-db`
3. Console 탭에서 차례대로 실행:

#### Step 1: school 컬럼 추가
```sql
ALTER TABLE User ADD COLUMN school TEXT;
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
```

#### Step 2: Class 테이블 생성
```sql
-- Class 테이블
CREATE TABLE IF NOT EXISTS Class (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  description TEXT,
  color TEXT,
  capacity INTEGER DEFAULT 20,
  isActive INTEGER DEFAULT 1,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_class_academy ON Class(academyId);
CREATE INDEX IF NOT EXISTS idx_class_teacher ON Class(teacherId);
CREATE INDEX IF NOT EXISTS idx_class_active ON Class(isActive);

-- ClassSchedule 테이블
CREATE TABLE IF NOT EXISTS ClassSchedule (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  subject TEXT NOT NULL,
  dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 0 AND dayOfWeek <= 6),
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_class ON ClassSchedule(classId);

-- ClassStudent 테이블
CREATE TABLE IF NOT EXISTS ClassStudent (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(classId, studentId)
);

CREATE INDEX IF NOT EXISTS idx_class_student_class ON ClassStudent(classId);
CREATE INDEX IF NOT EXISTS idx_class_student_student ON ClassStudent(studentId);
```

## 🧪 마이그레이션 확인 방법

### 1. school 컬럼 확인
```bash
wrangler d1 execute superplace-db --command="PRAGMA table_info(User);" --remote | grep school
```

출력에 `school TEXT`가 있으면 성공

### 2. Class 테이블 확인
```bash
wrangler d1 execute superplace-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Class', 'ClassSchedule', 'ClassStudent');" --remote
```

3개 테이블이 모두 출력되면 성공

## 📝 상세 가이드 문서

1. **학생 추가 문제**: `/DATABASE_MIGRATION_URGENT.md`
2. **반 생성 문제**: `/CLASS_TABLES_MIGRATION_URGENT.md`
3. **전체 요약**: `/FINAL_STUDENT_FIX_REPORT.md`

## ⚠️ 중요 참고사항

### 기존 데이터 안전성
- ✅ 모든 마이그레이션은 기존 데이터에 영향 없음
- ✅ 새 컬럼/테이블만 추가됨
- ✅ 기존 학생, 사용자 데이터 보존됨
- ✅ 되돌리기 가능 (DROP TABLE/COLUMN으로 제거 가능)

### 마이그레이션 순서
**순서 상관없음** - 독립적인 마이그레이션
1. school 컬럼 추가 (User 테이블)
2. Class 테이블 생성 (새 테이블)

## 🎯 테스트 체크리스트

### 마이그레이션 전 테스트
- [x] 학생 추가 (school 제외) - ✅ 작동
- [ ] 학생 school 저장 - ❌ 불가
- [ ] 반 생성 - ❌ 불가

### 마이그레이션 후 테스트
- [ ] 학생 추가 (school 포함) - ✅ 작동 예상
- [ ] 학생 상세에서 school 표시 - ✅ 표시 예상
- [ ] 반 생성 - ✅ 작동 예상
- [ ] 반 목록 조회 - ✅ 조회 예상
- [ ] 학생 반 배정 - ✅ 배정 예상

## 💾 백업 (선택사항)

마이그레이션 전 백업 권장:

```bash
# D1 데이터베이스 백업 (Cloudflare Dashboard에서 수동)
# Workers & Pages → D1 → superplace-db → Export
```

## 📞 문제 발생 시

### 에러: "no such column: school"
→ school 컬럼 마이그레이션 필요

### 에러: "no such table: Class"
→ Class 테이블 마이그레이션 필요

### 에러: "column school already exists"
→ 이미 마이그레이션 완료됨, 무시 가능

## 🔗 관련 커밋
- `24e5245` - school 컬럼 누락 문제 해결
- `dd271d5` - Class 테이블 누락 문제 해결
- `f178eb9` - 최종 보고서

## 📦 배포 정보
- **최종 커밋**: `dd271d5`
- **리포지터리**: https://github.com/kohsunwoo12345-cmyk/superplace
- **상태**: ✅ 마이그레이션 파일 준비 완료

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27  
**우선순위**: 🔥 긴급 - 즉시 실행 필요
