# 긴급 데이터베이스 마이그레이션 가이드

## 🚨 문제
**에러 메시지**: `D1_ERROR: table User has no column named school: SQLITE_ERROR`

**원인**: User 테이블에 `school` 컬럼이 존재하지 않음

## ✅ 해결 방법

### Option 1: Wrangler CLI로 마이그레이션 실행 (권장)

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 2. school 컬럼 추가 마이그레이션 실행
wrangler d1 execute superplace-db --file=migrations/add_school_column.sql --remote

# 3. 성공 확인
# "✅ Successfully executed SQL" 메시지가 나오면 성공
```

### Option 2: Cloudflare Dashboard에서 수동 실행

1. https://dash.cloudflare.com 접속
2. Workers & Pages → D1 → `superplace-db` 선택
3. Console 탭 클릭
4. 다음 SQL 실행:

```sql
ALTER TABLE User ADD COLUMN school TEXT;
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
```

5. "Execute" 버튼 클릭

## 📝 마이그레이션 파일

**파일 위치**: `/migrations/add_school_column.sql`

```sql
-- Add school column to User table if not exists
ALTER TABLE User ADD COLUMN school TEXT;

-- Add index for school column for faster queries
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);
```

## ⚠️ 임시 조치 (긴급)

마이그레이션을 실행하기 전까지 **학생 추가는 정상 작동**하지만 **school 필드는 저장되지 않습니다**.

- ✅ 이름, 이메일, 비밀번호: 저장됨
- ✅ 학년, 소속반: 저장됨
- ✅ 연락처, 학부모 연락처: 저장됨
- ❌ 학교: 저장되지 않음 (마이그레이션 후 저장됨)

## 🔍 마이그레이션 확인

### 마이그레이션이 성공했는지 확인하는 방법

```bash
# Wrangler CLI로 테이블 구조 확인
wrangler d1 execute superplace-db --command="PRAGMA table_info(User);" --remote
```

출력 결과에 `school TEXT` 컬럼이 있으면 성공입니다.

### 또는 SQL로 직접 확인

```sql
SELECT name, type FROM pragma_table_info('User') WHERE name = 'school';
```

결과가 있으면 성공, 없으면 아직 마이그레이션이 안 된 것입니다.

## 📊 마이그레이션 전후 비교

### 마이그레이션 전
```
User 테이블:
- id
- email
- name
- password
- phone
- parentPhone
- grade
- class
- academyId
- ... (기타 필드)
❌ school (없음)
```

### 마이그레이션 후
```
User 테이블:
- id
- email
- name
- password
- phone
- parentPhone
- grade
- class
✅ school (추가됨)
- academyId
- ... (기타 필드)
```

## 🎯 마이그레이션 후 확인 사항

1. **학생 추가 테스트**
   ```
   이름: 테스트학생
   비밀번호: test1234
   학교: 서울중학교 ← 이제 저장됨
   학년: 중2
   소속반: A반
   ```

2. **학생 상세 페이지 확인**
   - 소속 학교: "서울중학교" (이전: "미등록")
   - 학년: "중2"
   - 소속 반: "A반"

## ⚠️ 주의사항

- 마이그레이션은 **되돌릴 수 없습니다**
- 기존 데이터에는 영향 없음 (school 필드만 NULL로 추가됨)
- 마이그레이션 실행 전 백업 권장 (선택사항)
- 프로덕션 환경에서는 테스트 후 실행 권장

## 🔗 관련 파일

- `/migrations/add_school_column.sql` - 마이그레이션 SQL 파일
- `/functions/api/students/create.js` - 학생 추가 API (임시로 school 제외)
- `/cloudflare-worker/schema.sql` - 전체 스키마 (school 포함)

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27  
**우선순위**: 🔥 긴급
