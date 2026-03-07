# 랜딩페이지 목록 표시 문제 해결 가이드

## 현재 상황
- ✅ 랜딩페이지 **생성은 성공** (데이터베이스에 저장됨)
- ❌ 생성된 페이지가 **목록에 표시되지 않음**

## 배포 완료 후 확인 단계

### 1단계: Cloudflare Pages 로그 확인
배포 완료 후 (약 5분 후), 대시보드에서 랜딩페이지 목록 접속:
```
https://superplace-academy.pages.dev/dashboard/admin/landing-pages
```

그리고 Cloudflare 대시보드에서 실시간 로그 확인:
1. Workers & Pages → superplace-academy → Logs
2. 다음 로그 메시지 찾기:
   - `🔍 Total records in landing_pages table:` → 총 레코드 수
   - `🔍 Recent 5 rows:` → 최근 5개 데이터
   - `📊 Found landing pages:` → 필터 후 결과 수

### 2단계: 로그 분석

#### 시나리오 A: 총 레코드 수가 0
```
🔍 Total records in landing_pages table: 0
```
**원인**: 데이터가 실제로 저장되지 않았거나 다른 테이블에 저장됨
**해결**: D1 콘솔에서 직접 확인
```sql
SELECT * FROM landing_pages LIMIT 10;
```

#### 시나리오 B: 데이터는 있지만 필터 후 0개
```
🔍 Total records in landing_pages table: 5
🔍 Recent 5 rows: [{"id":"lp_123","title":"테스트",...}]
📊 Found landing pages: 0
⚠️ No results returned from filtered query!
```
**원인**: `created_at` 컬럼이 NULL이거나 형식 문제
**해결**: ORDER BY 절 제거 또는 다른 컬럼으로 정렬

#### 시나리오 C: 필터 후 데이터 있음
```
🔍 Total records in landing_pages table: 5
📊 Found landing pages: 5
📊 First result sample: {"id":"lp_123","slug":"test","title":"테스트"}
```
**결과**: API는 정상, 프론트엔드 문제
**해결**: 브라우저 캐시 삭제 (`Ctrl+Shift+R`)

### 3단계: 문제별 해결 방법

#### 문제 1: `created_at` 컬럼 문제
GET 쿼리에서 ORDER BY 제거:

```typescript
// 현재
ORDER BY lp.created_at DESC

// 변경 후
ORDER BY lp.ROWID DESC
```

#### 문제 2: 빈 결과 (컬럼 이름 불일치)
테이블 구조 확인 후 컬럼명 매칭:

```sql
PRAGMA table_info(landing_pages);
```

Common column name mappings:
- `created_at` → `createdAt` or `date_created`
- `view_count` → `viewCount` or `views`
- `is_active` → `isActive` or `status`

### 4단계: 최종 수정 (필요시)

현재 배포된 코드 (커밋 `f5023f26`):
- GET 쿼리에서 필터 제거 (모든 페이지 표시)
- `created_at` ORDER BY 사용
- 상세 디버그 로그 추가

다음 배포에 포함할 수정 사항:
```typescript
// functions/api/admin/landing-pages.ts
query = `
  SELECT 
    lp.id, 
    COALESCE(lp.slug, 'lp-' || lp.id) as slug,
    lp.title,
    COALESCE(lp.created_at, datetime('now')) as createdAt,
    '' as createdById,
    '' as creatorName,
    COALESCE(lp.view_count, 0) as viewCount,
    CASE WHEN COALESCE(lp.status, 'active') = 'active' THEN 1 ELSE 0 END as isActive
  FROM landing_pages lp
  ORDER BY lp.ROWID DESC  -- changed from created_at
`;
```

## 테스트 체크리스트

### 배포 후 5-10분 뒤:
- [ ] Cloudflare 로그에서 총 레코드 수 확인
- [ ] 최근 5개 ROW 데이터 확인
- [ ] 필터 후 결과 수 확인
- [ ] 프론트엔드 대시보드 새로고침 (`Ctrl+Shift+R`)
- [ ] 목록에 데이터 표시 확인
- [ ] 새 랜딩페이지 생성 → 즉시 목록에 표시 확인

### 결과 보고 양식:
```
배포 버전: f5023f26
테스트 시각: 2026-03-07 11:XX UTC

1. 총 레코드 수: ___
2. 최근 5개 ROW: [표시됨/안됨]
3. 필터 후 결과: ___개
4. 프론트엔드 표시: [정상/문제]
5. 새 페이지 생성: [성공/실패]
6. 목록 즉시 반영: [정상/문제]
```

---

## 배포 정보
- **커밋**: `f5023f26`
- **브랜치**: `main`
- **배포 URL**: https://superplace-academy.pages.dev
- **예상 완료**: 2026-03-07 11:45 UTC

## 다음 단계
로그 결과를 보고해주시면 정확한 원인을 파악하고 최종 수정하겠습니다.
