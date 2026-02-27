# Landing Pages 테이블 컬럼 확인 가이드

## Cloudflare D1 Console에서 실행할 SQL

### 1. 테이블 구조 확인
```sql
PRAGMA table_info(landing_pages);
```

이 명령어로 다음 정보를 확인하세요:
- **cid**: 컬럼 순서
- **name**: 컬럼 이름
- **type**: 데이터 타입
- **notnull**: NOT NULL 제약 (1 = NOT NULL, 0 = NULL 허용)
- **dflt_value**: 기본값
- **pk**: Primary Key 여부

### 2. NOT NULL 컬럼 확인
```sql
SELECT name, type, "notnull", dflt_value 
FROM pragma_table_info('landing_pages') 
WHERE "notnull" = 1;
```

## 필요한 정보

아래 정보를 확인하여 알려주세요:

1. **NOT NULL 제약이 있는 컬럼 목록**
2. **각 컬럼의 기본값 (dflt_value)**
3. **데이터 타입 (INTEGER, TEXT 등)**

이 정보를 바탕으로 API INSERT 쿼리를 수정하겠습니다.

## 현재 오류 원인

`D1_ERROR: NOT NULL constraint failed: landing_pages.template_type`

- `template_type` 컬럼이 NOT NULL인데 INSERT 시 값을 제공하지 않음
- 기본값도 없거나 작동하지 않음

## 해결 방법

INSERT 쿼리에 모든 NOT NULL 컬럼의 값을 명시적으로 추가해야 합니다.
