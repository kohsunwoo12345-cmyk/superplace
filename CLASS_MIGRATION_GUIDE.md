# Class 테이블 마이그레이션 가이드

## 📅 작성 일자
2026-02-27

## 🎯 목적
수업(Class) 데이터를 메모리 기반에서 데이터베이스 기반으로 전환하여 데이터 영속성 확보

## 🚀 마이그레이션 단계

### 1단계: 데이터베이스 백업 (필수)
```bash
# 현재 데이터베이스 백업
wrangler d1 export superplace-db --output backup_before_class_migration.sql
```

### 2단계: 테이블 생성
```bash
# 로컬 환경에서 테스트
wrangler d1 execute superplace-db --local --file=migrations/create_class_tables.sql

# 프로덕션 환경에 적용
wrangler d1 execute superplace-db --remote --file=migrations/create_class_tables.sql
```

### 3단계: 테이블 확인
```bash
# 테이블이 생성되었는지 확인
wrangler d1 execute superplace-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Class%'"
```

예상 결과:
```
Class
ClassSchedule
ClassStudent
```

### 4단계: 인덱스 확인
```bash
# 인덱스 확인
wrangler d1 execute superplace-db --remote --command="SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_class%'"
```

예상 결과:
```
idx_class_academy
idx_class_teacher
idx_class_active
idx_schedule_class
idx_class_student_class
idx_class_student_student
```

## 📊 생성된 테이블 구조

### Class 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | Primary Key |
| name | TEXT | 반 이름 (예: 초등 3학년 A반) |
| grade | TEXT | 학년 |
| description | TEXT | 설명 |
| color | TEXT | 색상 코드 |
| capacity | INTEGER | 정원 (기본값: 20) |
| isActive | INTEGER | 활성 상태 (1=활성, 0=비활성) |
| academyId | TEXT | 소속 학원 ID |
| teacherId | TEXT | 담당 선생님 ID |
| createdAt | TEXT | 생성 일시 |
| updatedAt | TEXT | 수정 일시 |

### ClassSchedule 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | Primary Key |
| classId | TEXT | 반 ID (Foreign Key) |
| subject | TEXT | 과목명 |
| dayOfWeek | INTEGER | 요일 (0=일요일, 6=토요일) |
| startTime | TEXT | 시작 시간 (HH:MM) |
| endTime | TEXT | 종료 시간 (HH:MM) |
| createdAt | TEXT | 생성 일시 |

### ClassStudent 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | Primary Key |
| classId | TEXT | 반 ID (Foreign Key) |
| studentId | TEXT | 학생 ID (Foreign Key) |
| enrolledAt | TEXT | 등록 일시 |

**제약 조건**:
- `UNIQUE(classId, studentId)`: 같은 학생이 같은 반에 중복 등록 불가
- `ON DELETE CASCADE`: 반 삭제 시 관련 스케줄과 학생 관계도 자동 삭제

## ✅ 변경 사항

### API 변경 (`functions/api/classes/index.js`)

#### 이전 (메모리 기반)
```javascript
const CLASSES_BY_ACADEMY = new Map(); // 메모리 저장
```

#### 변경 후 (DB 기반)
```javascript
// DB 쿼리
const classesResult = await DB.prepare(`
  SELECT * FROM Class WHERE academyId = ?
`).bind(academyId).all();
```

### 주요 개선사항
1. ✅ **영속성**: 데이터가 데이터베이스에 영구 저장
2. ✅ **관계형**: 학생, 스케줄과의 관계 정의
3. ✅ **트랜잭션**: 데이터 일관성 보장
4. ✅ **CASCADE**: 연관 데이터 자동 삭제
5. ✅ **인덱스**: 빠른 조회 성능

## 🧪 테스트 방법

### 1. 반 생성 테스트
```bash
# UI에서: /dashboard/classes → "반 추가" 클릭
# 반 정보 입력 후 저장
# 페이지 새로고침 → 반이 계속 표시되는지 확인 ✅
```

### 2. 데이터 확인
```bash
# 데이터베이스에서 직접 확인
wrangler d1 execute superplace-db --remote --command="SELECT * FROM Class LIMIT 5"
```

### 3. 반 삭제 테스트
```bash
# UI에서 반 삭제
# 연관된 스케줄도 함께 삭제되는지 확인
wrangler d1 execute superplace-db --remote --command="SELECT COUNT(*) FROM ClassSchedule WHERE classId = '[삭제한반ID]'"
# 결과: 0 (CASCADE로 자동 삭제됨)
```

## ⚠️ 주의사항

### 기존 데이터
- **메모리에 있던 데이터는 손실됨** (마이그레이션 불가능)
- 새로 생성되는 데이터부터 DB에 저장됨
- 기존 사용자는 반을 다시 생성해야 함

### 롤백 방법
```bash
# 테이블 삭제 (롤백 시)
wrangler d1 execute superplace-db --remote --command="DROP TABLE IF EXISTS ClassStudent"
wrangler d1 execute superplace-db --remote --command="DROP TABLE IF EXISTS ClassSchedule"
wrangler d1 execute superplace-db --remote --command="DROP TABLE IF EXISTS Class"

# 이전 API 파일 복구
git checkout HEAD~1 functions/api/classes/index.js
```

## 📝 마이그레이션 체크리스트
- [ ] 데이터베이스 백업 완료
- [ ] 로컬 환경에서 테스트
- [ ] 테이블 생성 (프로덕션)
- [ ] 인덱스 확인
- [ ] API 배포
- [ ] 반 생성 테스트
- [ ] 반 조회 테스트
- [ ] 반 수정 테스트
- [ ] 반 삭제 테스트
- [ ] CASCADE 동작 확인
- [ ] 사용자 공지

## 🎯 예상 결과
- ✅ 반 데이터가 영구 저장됨
- ✅ 서버 재시작해도 데이터 유지
- ✅ 학생-반 관계 관리 가능
- ✅ 스케줄 자동 관리

## 📞 문제 발생 시
1. 백업 파일 확인
2. 롤백 실행
3. 로그 확인: Cloudflare Dashboard → Workers & Pages → Logs

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27  
**소요 시간**: 5-10분
