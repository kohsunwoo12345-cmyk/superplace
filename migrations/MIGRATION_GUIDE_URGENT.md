# 🚨 긴급 데이터베이스 마이그레이션 가이드

## 현재 문제 상황

1. **학생 추가 실패**: `D1_ERROR: table User has no column named class: SQLITE_ERROR`
2. **반 생성 실패**: `D1_ERROR: no such table: Class: SQLITE_ERROR`
3. **SQL 실행 오류**: "Requests without any query are not supported"

## 원인

Cloudflare D1 데이터베이스에 다음 항목이 누락되어 있습니다:
- User 테이블의 `class` 컬럼
- `Class`, `ClassSchedule`, `ClassStudent` 테이블

## 해결 방법

### ⚠️ 중요: SQL 파일을 직접 업로드하지 마세요!

Cloudflare D1 Console은 빈 파일을 인식하지 못하므로 **SQL 문을 직접 복사해서 붙여넣기**해야 합니다.

---

## 📋 마이그레이션 1: User 테이블에 class 컬럼 추가

### Wrangler CLI 사용 (권장)

```bash
cd /home/user/webapp

# 1단계: class 컬럼 추가
wrangler d1 execute superplace-db --remote --command "ALTER TABLE User ADD COLUMN class TEXT;"

# 2단계: 인덱스 생성
wrangler d1 execute superplace-db --remote --command "CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);"
```

### Cloudflare Dashboard 사용

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com
   - Workers & Pages → D1 → `superplace-db` 선택

2. **Console 탭 클릭**

3. **아래 SQL을 복사해서 붙여넣기**

```sql
ALTER TABLE User ADD COLUMN class TEXT;
CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);
```

4. **Execute 버튼 클릭**

5. **성공 확인**: "Success" 메시지 표시

---

## 📋 마이그레이션 2: Class 테이블 생성

### Wrangler CLI 사용 (권장)

```bash
cd /home/user/webapp

# Class 테이블 생성
wrangler d1 execute superplace-db --remote --command "
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
"
```

### Cloudflare Dashboard 사용

1. **Console 탭에서 아래 SQL을 한 번에 복사해서 붙여넣기**

```sql
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

2. **Execute 버튼 클릭**

3. **성공 확인**: 모든 테이블과 인덱스가 생성되었다는 메시지 표시

---

## ✅ 마이그레이션 완료 확인

### Wrangler CLI로 확인

```bash
# User 테이블에 class 컬럼 확인
wrangler d1 execute superplace-db --remote --command "PRAGMA table_info(User);"

# Class 테이블 존재 확인
wrangler d1 execute superplace-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Dashboard에서 확인

Console에서 실행:

```sql
-- User 테이블 구조 확인
PRAGMA table_info(User);

-- 모든 테이블 목록 확인
SELECT name FROM sqlite_master WHERE type='table';
```

**예상 결과**:
- User 테이블에 `class` 컬럼이 보여야 함
- Class, ClassSchedule, ClassStudent 테이블이 목록에 나타나야 함

---

## 🧪 마이그레이션 후 테스트

### 1. 학생 추가 테스트

1. https://superplacestudy.pages.dev/dashboard/students/add 접속
2. 학생 정보 입력:
   - 이름: 테스트학생
   - 전화번호: 01012345678
   - 학교: 서울중학교
   - 학년: 중2
   - 소속반: A반
   - 학부모 연락처: 01087654321
3. "학생 추가" 버튼 클릭
4. ✅ 성공 메시지 확인

### 2. 반 생성 테스트

1. https://superplacestudy.pages.dev/dashboard/classes 접속
2. "새 반 만들기" 버튼 클릭
3. 반 정보 입력:
   - 반 이름: 수학A반
   - 학년: 중2
   - 설명: 2학년 수학 심화반
4. "반 생성" 버튼 클릭
5. ✅ 성공 메시지 확인

### 3. 학생 상세 정보 확인

1. 학생 목록에서 방금 추가한 학생 클릭
2. ✅ 다음 정보가 표시되는지 확인:
   - 학교: 서울중학교
   - 학년: 중2
   - 소속반: A반
   - 학부모 연락처: 01087654321

---

## 🔧 트러블슈팅

### "Requests without any query are not supported" 오류

**원인**: SQL 파일을 직접 업로드하려고 하면 발생

**해결**: Dashboard Console에서 SQL 문을 **직접 복사 & 붙여넣기**하세요.

### "column already exists" 오류

**원인**: class 컬럼이 이미 추가된 경우

**해결**: 이 오류는 무시해도 됩니다. 다음 마이그레이션으로 진행하세요.

### "table already exists" 오류

**원인**: Class 테이블이 이미 생성된 경우

**해결**: `CREATE TABLE IF NOT EXISTS`를 사용했으므로 무시해도 안전합니다.

---

## 📊 데이터베이스 상태 최종 확인

마이그레이션 완료 후 다음 명령으로 전체 스키마를 확인하세요:

```bash
wrangler d1 execute superplace-db --remote --command "
SELECT 
  name, 
  type 
FROM sqlite_master 
WHERE type IN ('table', 'index') 
ORDER BY type, name;
"
```

**예상 결과**: User, Class, ClassSchedule, ClassStudent 테이블과 모든 인덱스가 표시되어야 합니다.

---

## 📞 추가 지원

마이그레이션 중 문제가 발생하면:
1. 오류 메시지 전체를 복사
2. 실행한 SQL 문 확인
3. Cloudflare Dashboard의 D1 Console에서 확인

---

**작성일**: 2026-02-27  
**대상 데이터베이스**: superplace-db (Cloudflare D1)  
**긴급도**: 🔴 HIGH - 학생 추가 및 반 생성 기능 복구 필수
