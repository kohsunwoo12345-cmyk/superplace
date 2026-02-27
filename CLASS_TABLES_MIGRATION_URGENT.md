# 긴급: 반(Class) 테이블 마이그레이션 가이드

## 🚨 문제
**에러 메시지**: `반 생성 실패: D1_ERROR: no such table: Class: SQLITE_ERROR`

**원인**: 데이터베이스에 `Class`, `ClassSchedule`, `ClassStudent` 테이블이 존재하지 않음

## ✅ 해결 방법

### 🔥 방법 1: Wrangler CLI로 마이그레이션 (권장)

```bash
# 프로젝트 디렉토리로 이동
cd /home/user/webapp

# Class 테이블 마이그레이션 실행
wrangler d1 execute superplace-db --file=migrations/add_class_tables.sql --remote

# 성공 확인
# "✅ Successfully executed SQL" 메시지가 나오면 성공
```

### 🌐 방법 2: Cloudflare Dashboard에서 수동 실행

1. https://dash.cloudflare.com 접속
2. Workers & Pages → D1 → `superplace-db` 선택
3. Console 탭 클릭
4. 다음 SQL 복사해서 실행:

```sql
-- Class (수업/반) 테이블 생성
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_academy ON Class(academyId);
CREATE INDEX IF NOT EXISTS idx_class_teacher ON Class(teacherId);
CREATE INDEX IF NOT EXISTS idx_class_active ON Class(isActive);

-- ClassSchedule (수업 시간표) 테이블
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedule_class ON ClassSchedule(classId);

-- ClassStudent (수업-학생 연결) 테이블
CREATE TABLE IF NOT EXISTS ClassStudent (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  enrolledAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(classId, studentId)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_student_class ON ClassStudent(classId);
CREATE INDEX IF NOT EXISTS idx_class_student_student ON ClassStudent(studentId);
```

5. "Execute" 버튼 클릭

## 📊 생성되는 테이블

### 1. Class 테이블
```
id          TEXT    (Primary Key)
name        TEXT    반 이름
grade       TEXT    학년
description TEXT    설명
color       TEXT    색상
capacity    INTEGER 정원 (기본: 20)
isActive    INTEGER 활성 상태 (1: 활성, 0: 비활성)
academyId   TEXT    학원 ID
teacherId   TEXT    선생님 ID
createdAt   TEXT    생성일시
updatedAt   TEXT    수정일시
```

### 2. ClassSchedule 테이블
```
id          TEXT    (Primary Key)
classId     TEXT    반 ID (FK)
subject     TEXT    과목명
dayOfWeek   INTEGER 요일 (0: 일요일 ~ 6: 토요일)
startTime   TEXT    시작 시간 (HH:MM)
endTime     TEXT    종료 시간 (HH:MM)
createdAt   TEXT    생성일시
```

### 3. ClassStudent 테이블
```
id          TEXT    (Primary Key)
classId     TEXT    반 ID (FK)
studentId   TEXT    학생 ID (FK)
enrolledAt  TEXT    등록일시
```

## 🧪 마이그레이션 후 테스트

### 1. 반 생성 테스트
```
1. /dashboard/classes 페이지 접속
2. "반 추가" 버튼 클릭
3. 반 정보 입력:
   - 반 이름: 수학 A반
   - 학년: 중2
   - 설명: 중등 수학 기초반
   - 색상: 파란색
4. 학생 선택 (옵션)
5. "반 생성" 버튼 클릭

결과: ✅ "반이 생성되었습니다!" 메시지
```

### 2. 반 목록 확인
```
1. /dashboard/classes 페이지에서 확인
2. 생성한 반이 목록에 표시되는지 확인
3. 학생 수, 스케줄 등 정보 확인
```

## 📝 마이그레이션 파일 위치
- `/migrations/add_class_tables.sql`

## ⚠️ 중요 참고사항

### 마이그레이션 전 (현재)
- ❌ 반 생성 불가
- ❌ 반 목록 조회 불가
- ❌ 학생 반 배정 불가

### 마이그레이션 후
- ✅ 반 생성 가능
- ✅ 반 목록 조회 가능
- ✅ 학생 반 배정 가능
- ✅ 스케줄 관리 가능

## 🔍 마이그레이션 확인 방법

### CLI로 확인
```bash
# Class 테이블 구조 확인
wrangler d1 execute superplace-db --command="PRAGMA table_info(Class);" --remote

# ClassSchedule 테이블 확인
wrangler d1 execute superplace-db --command="PRAGMA table_info(ClassSchedule);" --remote

# ClassStudent 테이블 확인
wrangler d1 execute superplace-db --command="PRAGMA table_info(ClassStudent);" --remote
```

### 테이블 존재 확인
```sql
SELECT name FROM sqlite_master 
WHERE type='table' AND name IN ('Class', 'ClassSchedule', 'ClassStudent');
```

결과에 3개 테이블이 모두 나오면 성공입니다.

## 🎯 추가 정보

### 테이블 관계
```
Class (반)
  ↓
  ├── ClassSchedule (시간표) - 1:N 관계
  └── ClassStudent (학생 연결) - N:M 관계
        ↓
        User (학생)
```

### 기능 제약사항
- 한 반에 여러 학생 배정 가능
- 한 학생은 여러 반에 소속 가능
- 각 반마다 여러 시간표 설정 가능
- 학생당 반 배정 최대 3개 (UI 제한)

## 📦 관련 파일
- API: `/functions/api/classes/index.js`
- 마이그레이션: `/migrations/add_class_tables.sql`
- 프론트엔드: `/src/app/dashboard/classes/add/page.tsx`

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27  
**우선순위**: 🔥 긴급 - 반 생성 불가
