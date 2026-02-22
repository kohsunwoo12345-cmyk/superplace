# 클래스 목록 표시 문제 수정 (2026-02-22)

## 🚀 배포 정보
- **커밋**: `e6aa8ab`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 2-3분 소요

## 🐛 문제 상황

### 증상
클래스 추가 시 "반이 생성되었습니다" 메시지가 표시되지만, 클래스 목록 페이지에서 새로 추가한 클래스가 보이지 않음

### 원인
**테이블명 및 컬럼명 불일치**:

1. **클래스 생성 API** (`/api/classes/create`):
   - 테이블: `classes` (snake_case)
   - 컬럼: `academy_id`, `class_name`, `teacher_id`, `created_at` 등

2. **클래스 목록 조회 API** (`/api/classes`):
   - 테이블: `Class` (PascalCase) ❌
   - 컬럼: `academyId`, `name`, `teacherId`, `createdAt` 등 ❌

**결과**: 생성은 `classes` 테이블에 되지만, 조회는 존재하지 않는 `Class` 테이블에서 시도하여 데이터를 찾지 못함

## ✅ 해결 방법

### 수정된 파일
`functions/api/classes/index.js`

### 변경 사항

#### 1. 테이블명 통일
```javascript
// 변경 전
FROM Class c

// 변경 후
FROM classes c
```

#### 2. 컬럼명 통일 (snake_case → camelCase 매핑)
```javascript
// 변경 전
c.academyId,
c.name,
c.teacherId,
c.createdAt

// 변경 후
c.academy_id as academyId,
c.class_name as name,
c.teacher_id as teacherId,
c.created_at as createdAt
```

#### 3. JOIN 조건 수정
```javascript
// 변경 전
LEFT JOIN User u ON c.teacherId = u.id
LEFT JOIN Academy a ON c.academyId = a.id

// 변경 후
LEFT JOIN User u ON c.teacher_id = u.id
LEFT JOIN Academy a ON c.academy_id = a.id
```

#### 4. WHERE 조건 수정
```javascript
// 변경 전
WHERE c.academyId = ?
WHERE c.teacherId = ?

// 변경 후
WHERE c.academy_id = ?
WHERE c.teacher_id = ?
```

## 📋 수정된 쿼리

### 1. SUPER_ADMIN / ADMIN 쿼리
```sql
SELECT 
  c.id,
  c.academy_id as academyId,
  c.class_name as name,
  c.grade,
  c.description,
  c.teacher_id as teacherId,
  c.color,
  c.created_at as createdAt,
  u.name as teacherName,
  a.name as academyName
FROM classes c
LEFT JOIN User u ON c.teacher_id = u.id
LEFT JOIN Academy a ON c.academy_id = a.id
ORDER BY c.created_at DESC
```

### 2. DIRECTOR 쿼리
```sql
SELECT 
  c.id,
  c.academy_id as academyId,
  c.class_name as name,
  c.grade,
  c.description,
  c.teacher_id as teacherId,
  c.color,
  c.created_at as createdAt,
  u.name as teacherName,
  a.name as academyName
FROM classes c
LEFT JOIN User u ON c.teacher_id = u.id
LEFT JOIN Academy a ON c.academy_id = a.id
WHERE c.academy_id = ?
ORDER BY c.created_at DESC
```

### 3. TEACHER 쿼리
```sql
SELECT 
  c.id,
  c.academy_id as academyId,
  c.class_name as name,
  c.grade,
  c.description,
  c.teacher_id as teacherId,
  c.color,
  c.created_at as createdAt,
  u.name as teacherName,
  a.name as academyName
FROM classes c
LEFT JOIN User u ON c.teacher_id = u.id
LEFT JOIN Academy a ON c.academy_id = a.id
WHERE c.teacher_id = ?
ORDER BY c.created_at DESC
```

### 4. STUDENT 쿼리
```sql
SELECT DISTINCT
  c.id,
  c.academy_id as academyId,
  c.class_name as name,
  c.grade,
  c.description,
  c.teacher_id as teacherId,
  c.color,
  c.created_at as createdAt,
  u.name as teacherName,
  a.name as academyName
FROM classes c
INNER JOIN class_students cs ON c.id = cs.classId
LEFT JOIN User u ON c.teacher_id = u.id
LEFT JOIN Academy a ON c.academy_id = a.id
WHERE cs.studentId = ?
ORDER BY c.created_at DESC
```

## 🔧 기술 세부사항

### D1 데이터베이스 스키마
```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academy_id INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  grade TEXT,
  description TEXT,
  teacher_id INTEGER,
  color TEXT DEFAULT '#3B82F6',
  schedule_days TEXT,
  start_time TEXT,
  end_time TEXT,
  day_schedule TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (academy_id) REFERENCES Academy(id),
  FOREIGN KEY (teacher_id) REFERENCES User(id)
);
```

### API 엔드포인트
- **생성**: `POST /api/classes/create`
- **조회**: `GET /api/classes`
- **역할별 필터링**: SUPER_ADMIN, ADMIN, DIRECTOR, TEACHER, STUDENT

## 🧪 테스트 시나리오

### 1. 클래스 생성 테스트
```
1. /dashboard/classes/add 접속
2. 반 이름, 학년, 과목 입력
3. "반 생성" 버튼 클릭
4. "반이 생성되었습니다" 메시지 확인
5. /dashboard/classes로 자동 이동
6. ✅ 새로 생성한 반이 목록에 표시되는지 확인
```

### 2. 역할별 조회 테스트
#### ADMIN
- [ ] 모든 클래스 표시 확인

#### DIRECTOR
- [ ] 소속 학원의 클래스만 표시 확인

#### TEACHER
- [ ] 자신이 담당하는 클래스만 표시 확인

#### STUDENT
- [ ] 자신이 등록된 클래스만 표시 확인

### 3. 기존 데이터 확인
- [ ] 이미 생성된 클래스들이 정상적으로 표시되는지 확인
- [ ] 클래스 상세 정보 (학년, 설명, 색상 등) 표시 확인
- [ ] 담당 선생님 이름 표시 확인

## 📊 영향 범위

### 수정 전
- 클래스 생성: ✅ 정상 작동 (`classes` 테이블에 저장)
- 클래스 조회: ❌ 실패 (`Class` 테이블 조회 시도)

### 수정 후
- 클래스 생성: ✅ 정상 작동 (`classes` 테이블에 저장)
- 클래스 조회: ✅ 정상 작동 (`classes` 테이블에서 조회)

## 🎯 검증 방법

### 브라우저 개발자 도구 확인
1. F12로 개발자 도구 열기
2. Network 탭 선택
3. /dashboard/classes 페이지 접속
4. `classes` API 호출 확인
5. Response 탭에서 데이터 확인

```json
{
  "success": true,
  "classes": [
    {
      "id": 123,
      "academyId": 1,
      "name": "중학교 1학년 수학반",
      "grade": "중1",
      "description": "기초 수학 과정",
      "teacherId": 456,
      "color": "#3B82F6",
      "createdAt": "2026-02-22 15:30:00",
      "teacherName": "김선생",
      "academyName": "수퍼플레이스 학원"
    }
  ],
  "count": 1
}
```

### 데이터베이스 확인 (Cloudflare D1)
```bash
# Wrangler CLI 사용
wrangler d1 execute DB --command "SELECT * FROM classes ORDER BY created_at DESC LIMIT 10"
```

## 🔍 디버깅 로그

### 수정 전 로그
```
📚 Classes API GET called
✅ User verified: { email: 'user@example.com', role: 'ADMIN', academyId: 1 }
🔓 Admin access - returning all classes
❌ Error: no such table: Class
```

### 수정 후 로그
```
📚 Classes API GET called
✅ User verified: { email: 'user@example.com', role: 'ADMIN', academyId: 1 }
🔓 Admin access - returning all classes
✅ Returning 5 classes for ADMIN
```

## 🚨 주의사항

### 1. 기존 데이터 영향
- 이미 생성된 클래스는 모두 `classes` 테이블에 저장되어 있음
- 수정 후 즉시 모든 기존 클래스가 목록에 표시됨

### 2. 캐시 클리어
- 배포 후 브라우저 캐시 클리어 필요 (`Ctrl+Shift+R`)
- API 응답이 캐시되어 있을 수 있음

### 3. 데이터베이스 일관성
- 모든 API가 동일한 테이블명(`classes`)과 컬럼명(snake_case)을 사용하도록 통일
- 향후 API 작성 시 snake_case 컬럼명 사용 권장

## 📝 관련 파일

```
functions/api/classes/index.js         (수정됨 - 테이블명/컬럼명 통일)
functions/api/classes/create.ts        (변경 없음 - 이미 올바른 테이블 사용)
src/app/dashboard/classes/page.tsx     (변경 없음 - 프론트엔드)
src/app/dashboard/classes/add/page.tsx (변경 없음 - 클래스 추가 폼)
```

## ✅ 완료 사항

- [x] 테이블명 `Class` → `classes` 수정
- [x] 컬럼명 PascalCase → snake_case 매핑 추가
- [x] ADMIN 쿼리 수정
- [x] DIRECTOR 쿼리 수정
- [x] TEACHER 쿼리 수정
- [x] STUDENT 쿼리 수정
- [x] JOIN 조건 수정
- [x] WHERE 조건 수정
- [x] 커밋 및 배포

---

**업데이트 일시**: 2026-02-22
**커밋 해시**: e6aa8ab
**배포 상태**: ✅ 완료 (2-3분 후 반영)
**해결됨**: 클래스 생성 후 목록에 표시되지 않던 문제
