# Users 테이블 확인 가이드

## 문제
"선택한 학생이 존재하지 않습니다." 오류 발생

## 원인
실제로 DB의 users 테이블에 학생 데이터가 없을 가능성

## 확인 방법

### Cloudflare D1 Console에서 실행

```sql
-- 1. 모든 사용자 확인
SELECT id, name, email, role FROM users;

-- 2. 학생만 확인
SELECT id, name, email, role FROM users WHERE role = 'STUDENT';

-- 3. 사용자 수 확인
SELECT COUNT(*) as total FROM users;
SELECT COUNT(*) as students FROM users WHERE role = 'STUDENT';

-- 4. 테이블 구조 확인
PRAGMA table_info(users);
```

## 예상 결과

### 정상인 경우:
```
id | name | email | role
1  | 홍길동 | student1@test.com | STUDENT
2  | 김철수 | student2@test.com | STUDENT
```

### 비정상인 경우 (학생 없음):
```
(no rows)
```

## 해결 방법

학생이 없다면 테스트 학생 추가:

```sql
INSERT INTO users (name, email, password, role) 
VALUES ('테스트학생', 'test@student.com', 'hashed_password', 'STUDENT');
```

또는 프론트엔드 API가 잘못된 필터를 사용하고 있을 가능성 확인.
