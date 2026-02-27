# 🚨 즉시 실행: Cloudflare D1 Console에서 아래 SQL 실행

## 실행 방법

1. **https://dash.cloudflare.com** 접속
2. **Workers & Pages** → **D1** → **superplace-db** 클릭
3. **Console** 탭 클릭
4. 아래 SQL을 **한 줄씩** 복사해서 실행:

---

## SQL 1: school 컬럼 추가

```sql
ALTER TABLE User ADD COLUMN school TEXT;
```

실행 후 "Success" 메시지 확인

---

## SQL 2: class 컬럼 추가

```sql
ALTER TABLE User ADD COLUMN class TEXT;
```

실행 후 "Success" 메시지 확인

---

## SQL 3: 인덱스 생성

```sql
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);
```

실행 후 "Success" 메시지 확인

---

## SQL 4: Class 테이블 생성

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
```

---

## SQL 5: Class 인덱스 생성

```sql
CREATE INDEX IF NOT EXISTS idx_class_academy ON Class(academyId);
CREATE INDEX IF NOT EXISTS idx_class_teacher ON Class(teacherId);
CREATE INDEX IF NOT EXISTS idx_class_active ON Class(isActive);
```

---

## SQL 6: ClassSchedule 테이블 생성

```sql
CREATE TABLE IF NOT EXISTS ClassSchedule (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  subject TEXT NOT NULL,
  dayOfWeek INTEGER NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE
);
```

---

## SQL 7: ClassSchedule 인덱스 생성

```sql
CREATE INDEX IF NOT EXISTS idx_schedule_class ON ClassSchedule(classId);
```

---

## SQL 8: ClassStudent 테이블 생성

```sql
CREATE TABLE IF NOT EXISTS ClassStudent (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(classId, studentId),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE
);
```

---

## SQL 9: ClassStudent 인덱스 생성

```sql
CREATE INDEX IF NOT EXISTS idx_class_student_class ON ClassStudent(classId);
CREATE INDEX IF NOT EXISTS idx_class_student_student ON ClassStudent(studentId);
```

---

## 확인 방법

모든 SQL 실행 후 아래 명령으로 확인:

```sql
PRAGMA table_info(User);
```

결과에 `school`, `class` 컬럼이 보여야 함

```sql
SELECT name FROM sqlite_master WHERE type='table';
```

결과에 `Class`, `ClassSchedule`, `ClassStudent` 테이블이 보여야 함

---

## 현재 상태 (마이그레이션 전)

✅ **학생 추가**: 작동함 (school, class 제외)  
❌ **반 생성**: 작동 안 함 (Class 테이블 없음)

## 마이그레이션 후

✅ **학생 추가**: 완벽하게 작동 (모든 필드 포함)  
✅ **반 생성**: 완벽하게 작동

---

**작성일**: 2026-02-27  
**긴급도**: 🔴 HIGH  
**예상 소요 시간**: 5분
