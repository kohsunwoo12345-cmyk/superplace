# Foreign Key 제약 조건 확인 가이드

## Cloudflare D1 Console에서 실행할 SQL

### 1. landing_pages 테이블의 FK 확인
```sql
PRAGMA foreign_key_list(landing_pages);
```

### 2. users 테이블에 실제 학생 데이터 확인
```sql
SELECT id, name, role FROM users WHERE role = 'STUDENT' LIMIT 5;
```

### 3. landing_page_folders 테이블 데이터 확인
```sql
SELECT id, name FROM landing_page_folders LIMIT 5;
```

### 4. FK 제약 조건 활성화 여부 확인
```sql
PRAGMA foreign_keys;
```

결과를 알려주세요!
