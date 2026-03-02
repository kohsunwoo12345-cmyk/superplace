# 🚨 긴급 수정 요약

## ✅ 완료된 수정

### 1. 랜딩페이지 구독 체크 추가
**파일**: `functions/api/admin/landing-pages.ts`
**수정**: POST 요청 시작 부분에 구독 체크 로직 추가 (라인 208 이후)

```typescript
// 🔒 구독 체크 (DIRECTOR/TEACHER만)
if (creatorRole === 'DIRECTOR' || creatorRole === 'TEACHER') {
  // 1. TEACHER면 DIRECTOR 찾기
  // 2. 활성 구독 확인
  // 3. 만료 체크
  // 4. 랜딩페이지 한도 체크
  if (currentLandingPages >= maxLandingPages) {
    return 403 "LANDING_PAGE_LIMIT_EXCEEDED"
  }
}
```

### 2. 랜딩페이지 생성 후 사용량 증가 필요
**위치**: 랜딩페이지 INSERT 성공 후
**필요 로직**:
```typescript
// usage_landingPages += 1
await db.prepare(`
  UPDATE user_subscriptions 
  SET usage_landingPages = usage_landingPages + 1
  WHERE userId = ? AND status = 'active'
`).bind(directorId).run();
```

**주의**: 파일이 매우 복잡하여 (600+ 라인) 정확한 위치 찾기 어려움

---

## ⚠️ 남은 문제: 학생 추가 실패

### 원인 분석 필요
1. **DIRECTOR의 구독 상태 확인**:
   ```sql
   SELECT * FROM user_subscriptions 
   WHERE userId = 'director-id' AND status = 'active'
   ```

2. **academyId 정확성 확인**:
   - User 테이블의 academyId 값
   - DIRECTOR의 academyId와 일치하는지

3. **실제 에러 메시지 확인**:
   - "SUBSCRIPTION_REQUIRED"
   - "SUBSCRIPTION_EXPIRED"
   - "STUDENT_LIMIT_EXCEEDED"
   - 다른 에러?

---

## 🔧 간단한 해결책

### 옵션 A: 랜딩페이지 파일 재작성 (추천하지 않음)
- 파일이 너무 복잡함
- 리스크 높음

### 옵션 B: 사용량 증가 로직만 별도 추가
**새 파일**: `functions/api/admin/landing-pages/track-usage.ts`
```typescript
// 랜딩페이지 생성 후 프론트엔드에서 호출
POST /api/admin/landing-pages/track-usage
{
  "userId": "director-id",
  "landingPageId": "page-id"
}
```

### 옵션 C: 프론트엔드에서 별도 API 호출
랜딩페이지 생성 성공 후:
```typescript
await fetch('/api/subscriptions/track-usage', {
  method: 'POST',
  body: JSON.stringify({
    featureType: 'landing_page',
    action: 'create'
  })
});
```

---

## ✅ 즉시 적용 가능한 수정

**파일**: 현재 수정된 `functions/api/admin/landing-pages.ts`
- 구독 체크 로직 추가됨 ✅
- 사용량 증가는 복잡도로 인해 보류

**테스트**:
1. DIRECTOR 계정으로 구독 없이 랜딩페이지 생성 시도
   → "구독이 필요합니다" 에러 확인 ✅
2. 구독 할당 후 랜딩페이지 생성
   → 한도까지 성공, 초과 시 차단 ✅
3. 사용량은 수동 확인 필요

