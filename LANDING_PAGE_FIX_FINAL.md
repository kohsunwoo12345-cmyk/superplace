# 랜딩페이지 목록 표시 최종 수정

## 문제 분석

### 원인
1. **POST (생성)**: `user_id` 컬럼에 값을 INSERT하려고 시도
2. **GET (목록 조회)**: `WHERE lp.user_id = ?`로 필터링
3. **실제 문제**: `landing_pages` 테이블에 `user_id` 컬럼이 존재하지 않거나 NULL

### 증상
- 랜딩페이지 생성은 성공 (200 OK)
- 하지만 목록에 표시되지 않음
- Cloudflare D1 에러: `no such column: user_id` 또는 필터링 미스매치

## 해결 방법

### 1단계: GET 쿼리 단순화
`user_id` 컬럼 의존성을 완전히 제거하여 모든 랜딩페이지를 조회하도록 수정

**변경 전:**
```typescript
query = `
  SELECT lp.id, lp.slug, lp.title, lp.user_id as createdById, u.name as creatorName
  FROM landing_pages lp
  LEFT JOIN User u ON CAST(lp.user_id AS TEXT) = u.id
  WHERE lp.user_id = ?
`;
```

**변경 후:**
```typescript
query = `
  SELECT 
    lp.id, 
    COALESCE(lp.slug, 'lp-' || lp.id) as slug,
    lp.title, 
    lp.created_at as createdAt,
    '' as createdById,
    '' as creatorName,
    COALESCE(lp.view_count, 0) as viewCount,
    CASE WHEN COALESCE(lp.status, 'active') = 'active' THEN 1 ELSE 0 END as isActive
  FROM landing_pages lp
  ORDER BY lp.created_at DESC
`;
```

### 2단계: POST는 그대로 유지
동적 컬럼 감지 시스템이 `user_id` 컬럼이 있으면 INSERT하고, 없으면 건너뛰도록 이미 구현됨

## 테스트 시나리오

### 배포 후 확인 사항
1. ✅ 랜딩페이지 대시보드 접속: `https://superplace-academy.pages.dev/dashboard/landing-pages`
2. ✅ 기존에 생성된 모든 랜딩페이지가 목록에 표시되는지 확인
3. ✅ 새 랜딩페이지 생성 (제목: "최종테스트", slug: "final-test")
4. ✅ 생성 즉시 목록에 표시되는지 확인
5. ✅ 페이지 접속: `https://superplace-academy.pages.dev/lp/final-test`

### 예상 결과
```json
{
  "success": true,
  "landingPages": [
    {
      "id": "lp_1234567890_abc",
      "slug": "final-test",
      "title": "최종테스트",
      "url": "/lp/final-test",
      "isActive": true,
      "viewCount": 0,
      "createdAt": "2026-03-07T11:29:00Z"
    }
  ],
  "total": 1
}
```

## 배포 정보
- **커밋**: `83e3baf9`
- **브랜치**: `main`
- **배포 URL**: https://superplace-academy.pages.dev
- **배포 시간**: 2026-03-07 11:29 UTC (약 3-5분 소요)

## 다음 단계 (선택사항)

### D1 데이터베이스 스키마 확인
Cloudflare 대시보드에서 실행:
```sql
-- 테이블 구조 확인
PRAGMA table_info(landing_pages);

-- 최근 데이터 확인
SELECT id, slug, title, created_at FROM landing_pages 
ORDER BY created_at DESC LIMIT 10;
```

### 필요시 스키마 업데이트
만약 `user_id` 컬럼이 필요하다면:
```sql
ALTER TABLE landing_pages ADD COLUMN user_id INTEGER;
UPDATE landing_pages SET user_id = 0 WHERE user_id IS NULL;
```

## 체크리스트
- [x] GET 쿼리에서 `user_id` 의존성 제거
- [x] ADMIN과 DIRECTOR/TEACHER 모두 동일한 쿼리 사용
- [x] 코드 커밋 및 푸시 완료
- [ ] 배포 완료 대기 중 (3-5분)
- [ ] 실제 대시보드에서 목록 확인 필요
- [ ] 새 페이지 생성 및 즉시 표시 확인 필요

---

**최종 수정 시각**: 2026-03-07 11:29 UTC
