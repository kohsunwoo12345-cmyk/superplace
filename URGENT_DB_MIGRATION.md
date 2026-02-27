# 🚨 즉시 실행 필요: 데이터베이스 마이그레이션

## 현재 상황
- ❌ 학생 추가 불가: `class` 컬럼 누락
- ❌ 반 생성 불가: `Class` 테이블 누락

## 해결 방법 (2분 소요)

### Cloudflare Dashboard 사용 (가장 쉬움)

1. **https://dash.cloudflare.com** 접속
2. **Workers & Pages** → **D1** → **superplace-db** 클릭
3. **Console** 탭 클릭
4. 아래 SQL을 **복사**해서 **붙여넣기**

```sql
-- 1단계: User 테이블에 class 컬럼 추가
ALTER TABLE User ADD COLUMN class TEXT;
CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);

-- 2단계: Class 테이블 생성
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

5. **Execute** 버튼 클릭
6. ✅ 완료!

---

## 또는 Wrangler CLI 사용

```bash
cd /home/user/webapp

# 전체 마이그레이션 한 번에 실행
wrangler d1 execute superplace-db --remote --command "
ALTER TABLE User ADD COLUMN class TEXT;
CREATE INDEX IF NOT EXISTS idx_user_class ON User(class);

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

---

## 마이그레이션 후 테스트

### 1. 학생 추가 테스트
- https://superplacestudy.pages.dev/dashboard/students/add
- 모든 필드 입력 후 저장
- ✅ "학생 추가 성공!" 메시지 확인

### 2. 반 생성 테스트
- https://superplacestudy.pages.dev/dashboard/classes
- "새 반 만들기" → 정보 입력 → 저장
- ✅ "반이 생성되었습니다!" 메시지 확인

---

## 문제 해결

### "column already exists" 오류
→ 무시해도 됩니다. 이미 컬럼이 있다는 의미입니다.

### "table already exists" 오류
→ 무시해도 됩니다. `CREATE TABLE IF NOT EXISTS`를 사용했습니다.

### "Requests without any query" 오류
→ SQL 파일을 업로드하지 말고, **텍스트를 복사해서 붙여넣기**하세요.

---

**작성일**: 2026-02-27  
**긴급도**: 🔴 CRITICAL  
**예상 소요 시간**: 2분
