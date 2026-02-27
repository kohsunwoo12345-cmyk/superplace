# Cloudflare D1 Console SQL 실행 가이드

## 접속 방법
1. https://dash.cloudflare.com 접속
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. **D1** 탭 클릭
4. **superplace-db** 데이터베이스 클릭
5. **Console** 탭 클릭

---

## ⚠️ 중요: 실행 방법

**한 번에 하나의 SQL만 실행하세요!**

각 SQL을 복사 → Console에 붙여넣기 → Execute 버튼 클릭

---

## SQL 1 - school 컬럼 추가

```sql
ALTER TABLE User ADD COLUMN school TEXT
```

**실행 후**: "Query executed successfully" 또는 "Success" 메시지 확인

---

## SQL 2 - class 컬럼 추가

```sql
ALTER TABLE User ADD COLUMN class TEXT
```

**실행 후**: "Query executed successfully" 또는 "Success" 메시지 확인

---

## SQL 3 - school 인덱스 생성

```sql
CREATE INDEX idx_user_school ON User(school)
```

**실행 후**: "Query executed successfully" 메시지 확인

---

## SQL 4 - class 인덱스 생성

```sql
CREATE INDEX idx_user_class ON User(class)
```

**실행 후**: "Query executed successfully" 메시지 확인

---

## SQL 5 - Class 테이블 생성

```sql
CREATE TABLE Class (id TEXT PRIMARY KEY, name TEXT NOT NULL, grade TEXT, description TEXT, color TEXT, capacity INTEGER DEFAULT 20, isActive INTEGER DEFAULT 1, academyId TEXT NOT NULL, teacherId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))
```

**실행 후**: "Query executed successfully" 메시지 확인

---

## SQL 6 - Class 인덱스 생성 (1)

```sql
CREATE INDEX idx_class_academy ON Class(academyId)
```

---

## SQL 7 - Class 인덱스 생성 (2)

```sql
CREATE INDEX idx_class_teacher ON Class(teacherId)
```

---

## SQL 8 - Class 인덱스 생성 (3)

```sql
CREATE INDEX idx_class_active ON Class(isActive)
```

---

## SQL 9 - ClassSchedule 테이블 생성

```sql
CREATE TABLE ClassSchedule (id TEXT PRIMARY KEY, classId TEXT NOT NULL, subject TEXT NOT NULL, dayOfWeek INTEGER NOT NULL, startTime TEXT NOT NULL, endTime TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE)
```

---

## SQL 10 - ClassSchedule 인덱스 생성

```sql
CREATE INDEX idx_schedule_class ON ClassSchedule(classId)
```

---

## SQL 11 - ClassStudent 테이블 생성

```sql
CREATE TABLE ClassStudent (id TEXT PRIMARY KEY, classId TEXT NOT NULL, studentId TEXT NOT NULL, enrolledAt TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(classId, studentId), FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE, FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE)
```

---

## SQL 12 - ClassStudent 인덱스 생성 (1)

```sql
CREATE INDEX idx_class_student_class ON ClassStudent(classId)
```

---

## SQL 13 - ClassStudent 인덱스 생성 (2)

```sql
CREATE INDEX idx_class_student_student ON ClassStudent(studentId)
```

---

## 확인 SQL

모든 SQL 실행 후 아래 명령으로 확인:

```sql
PRAGMA table_info(User)
```

결과에서 `school`, `class` 컬럼이 보여야 합니다.

```sql
SELECT name FROM sqlite_master WHERE type='table'
```

결과에서 `Class`, `ClassSchedule`, `ClassStudent` 테이블이 보여야 합니다.

---

## 오류 발생 시

### "duplicate column name: school" 또는 "duplicate column name: class"
→ **해결**: 이미 컬럼이 있습니다. 다음 SQL로 넘어가세요.

### "index already exists"
→ **해결**: 이미 인덱스가 있습니다. 다음 SQL로 넘어가세요.

### "table Class already exists"
→ **해결**: 이미 테이블이 있습니다. 다음 SQL로 넘어가세요.

---

**작성일**: 2026-02-27  
**총 실행 시간**: 약 5분
