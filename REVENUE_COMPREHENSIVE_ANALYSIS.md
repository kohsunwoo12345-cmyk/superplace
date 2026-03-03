# 매출 관리 페이지 정확성 문제 분석 및 해결방안

## 📊 현재 상황 분석

### 1. 문제점
- **매출 관리 페이지가 정확한 데이터를 표시하지 않음**
- **어느 학원에서 얼마나 결제했는지 확인할 수 없음**
- **실제 매출이 집계되지 않음**

### 2. 근본 원인

#### 현재 API 구조의 문제
```typescript
// functions/api/admin/revenue.ts - 기존 코드
// ❌ 문제: revenue_records 테이블만 조회
const totalResult = await DB.prepare(`
  SELECT SUM(r.amount) as total, COUNT(*) as count
  FROM revenue_records r  // ← 이 테이블은 비어있거나 샘플 데이터만 있음
  LEFT JOIN academy a ON r.academyId = a.id
  WHERE ${baseConditions.join(' AND ')}
`).bind(...baseParams).first();
```

#### 실제 매출 데이터가 있는 테이블
1. **PointChargeRequest** - 포인트 충전 매출 (APPROVED 상태)
2. **BotPurchaseRequest** - AI 봇 쇼핑몰 매출 (APPROVED 상태)
3. **subscription_requests** - 일반 구독 매출 (approved 상태)

### 3. 학원별 매출 집계 문제

#### 현재 코드
```typescript
// ❌ 문제: revenue_records만 조회하여 학원별 매출 통계 생성
const academyStatsResult = await DB.prepare(`
  SELECT 
    r.academyId,
    a.name as academyName,
    SUM(r.amount) as totalAmount,
    COUNT(*) as transactionCount
  FROM revenue_records r  // ← 실제 매출 데이터가 없음
  LEFT JOIN academy a ON r.academyId = a.id
  WHERE r.status = 'completed'
  GROUP BY r.academyId, a.name
  ORDER BY totalAmount DESC
  LIMIT 10
`).all();
```

## ✅ 해결 방안

### 1. 모든 매출 소스에서 데이터 통합 조회

#### A. 포인트 충전 매출
```sql
SELECT 
  u.academyId,
  a.name as academyName,
  SUM(pcr.totalPrice) as totalAmount,
  COUNT(*) as transactionCount,
  'POINT_CHARGE' as source
FROM PointChargeRequest pcr
LEFT JOIN User u ON pcr.userId = u.id
LEFT JOIN academy a ON u.academyId = a.id
WHERE pcr.status = 'APPROVED'
GROUP BY u.academyId, a.name
```

#### B. AI 봇 쇼핑몰 매출
```sql
SELECT 
  bpr.academyId,
  a.name as academyName,
  SUM(bpr.totalPrice) as totalAmount,
  COUNT(*) as transactionCount,
  'AI_SHOPPING' as source
FROM BotPurchaseRequest bpr
LEFT JOIN academy a ON bpr.academyId = a.id
WHERE bpr.status = 'APPROVED'
GROUP BY bpr.academyId, a.name
```

#### C. 일반 구독 매출
```sql
SELECT 
  u.academyId,
  a.name as academyName,
  SUM(sr.finalPrice) as totalAmount,
  COUNT(*) as transactionCount,
  'SUBSCRIPTION' as source
FROM subscription_requests sr
LEFT JOIN User u ON sr.userId = u.id
LEFT JOIN academy a ON u.academyId = a.id
WHERE sr.status = 'approved'
GROUP BY u.academyId, a.name
```

### 2. 학원별 매출 통합 집계

```typescript
// 1. 포인트 충전 학원별 집계
const pointByAcademy = await DB.prepare(`
  SELECT 
    u.academyId,
    a.name as academyName,
    SUM(pcr.totalPrice) as totalAmount,
    COUNT(*) as transactionCount
  FROM PointChargeRequest pcr
  LEFT JOIN User u ON pcr.userId = u.id
  LEFT JOIN academy a ON u.academyId = a.id
  WHERE pcr.status = 'APPROVED'
    ${academyId ? 'AND u.academyId = ?' : ''}
    ${startDate ? 'AND date(pcr.approvedAt) >= date(?)' : ''}
    ${endDate ? 'AND date(pcr.approvedAt) <= date(?)' : ''}
  GROUP BY u.academyId, a.name
`).bind(...params).all();

// 2. AI 쇼핑몰 학원별 집계
const botByAcademy = await DB.prepare(`
  SELECT 
    bpr.academyId,
    a.name as academyName,
    SUM(bpr.totalPrice) as totalAmount,
    COUNT(*) as transactionCount
  FROM BotPurchaseRequest bpr
  LEFT JOIN academy a ON bpr.academyId = a.id
  WHERE bpr.status = 'APPROVED'
    ${academyId ? 'AND bpr.academyId = ?' : ''}
    ${startDate ? 'AND date(bpr.approvedAt) >= date(?)' : ''}
    ${endDate ? 'AND date(bpr.approvedAt) <= date(?)' : ''}
  GROUP BY bpr.academyId, a.name
`).bind(...params).all();

// 3. 일반 구독 학원별 집계
const subscriptionByAcademy = await DB.prepare(`
  SELECT 
    u.academyId,
    a.name as academyName,
    SUM(sr.finalPrice) as totalAmount,
    COUNT(*) as transactionCount
  FROM subscription_requests sr
  LEFT JOIN User u ON sr.userId = u.id
  LEFT JOIN academy a ON u.academyId = a.id
  WHERE sr.status = 'approved'
    ${academyId ? 'AND u.academyId = ?' : ''}
    ${startDate ? 'AND date(sr.processedAt) >= date(?)' : ''}
    ${endDate ? 'AND date(sr.processedAt) <= date(?)' : ''}
  GROUP BY u.academyId, a.name
`).bind(...params).all();

// 4. 학원별로 통합
const academyMap = new Map();
[...pointByAcademy, ...botByAcademy, ...subscriptionByAcademy].forEach((item: any) => {
  if (!item.academyId) return;
  
  if (!academyMap.has(item.academyId)) {
    academyMap.set(item.academyId, {
      academyId: item.academyId,
      academyName: item.academyName,
      totalAmount: 0,
      transactionCount: 0,
      pointAmount: 0,
      botAmount: 0,
      subscriptionAmount: 0
    });
  }
  
  const data = academyMap.get(item.academyId);
  data.totalAmount += item.totalAmount || 0;
  data.transactionCount += item.transactionCount || 0;
  
  // 매출 유형별 분리
  if (item.source === 'POINT_CHARGE') {
    data.pointAmount += item.totalAmount || 0;
  } else if (item.source === 'AI_SHOPPING') {
    data.botAmount += item.totalAmount || 0;
  } else if (item.source === 'SUBSCRIPTION') {
    data.subscriptionAmount += item.totalAmount || 0;
  }
});

// 5. 정렬 후 반환
const academyStats = Array.from(academyMap.values())
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, 10);
```

### 3. 예상 결과

#### 학원별 매출 현황 (상위 10개)
```json
{
  "academyStats": [
    {
      "academyId": "academy-001",
      "academyName": "서울수학학원",
      "totalAmount": 15500000,
      "transactionCount": 45,
      "pointAmount": 3500000,
      "botAmount": 8000000,
      "subscriptionAmount": 4000000
    },
    {
      "academyId": "academy-002",
      "academyName": "부산영어학원",
      "totalAmount": 12300000,
      "transactionCount": 38,
      "pointAmount": 2800000,
      "botAmount": 6500000,
      "subscriptionAmount": 3000000
    }
  ]
}
```

## 🎯 구현 계획

### Phase 1: 학원별 매출 집계 정확화 ✅
- [ ] 포인트 충전 학원별 집계 쿼리 추가
- [ ] AI 쇼핑몰 학원별 집계 쿼리 추가
- [ ] 일반 구독 학원별 집계 쿼리 추가
- [ ] 학원별 통합 매출 맵 생성

### Phase 2: 전체 매출 통계 정확화 ✅
- [ ] revenue_records 테이블 의존성 제거
- [ ] 실제 매출 데이터 기반 통계 계산
- [ ] 월별/연별 트렌드 정확한 계산

### Phase 3: 거래 내역 상세화 ✅
- [ ] 학원별 거래 내역 상세 표시
- [ ] 매출 유형별 필터링 기능
- [ ] 거래 내역 엑셀 내보내기

## 📈 기대 효과

1. **정확한 매출 집계**: 모든 매출 소스를 통합하여 정확한 데이터 제공
2. **학원별 매출 가시성**: 각 학원의 결제 내역을 명확하게 파악
3. **매출 유형별 분석**: 포인트/AI봇/구독 각각의 매출 비중 파악
4. **데이터 기반 의사결정**: 정확한 데이터를 기반으로 전략 수립

## 🔧 테스트 시나리오

### 1. 학원별 매출 조회
```bash
# 전체 학원 매출 조회
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/revenue"

# 특정 학원 매출 조회
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/revenue?academyId=academy-001"

# 기간별 매출 조회
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/revenue?startDate=2026-01-01&endDate=2026-03-31"
```

### 2. 예상 응답
```json
{
  "success": true,
  "stats": {
    "totalRevenue": 50000000,
    "thisMonthRevenue": 8000000,
    "growth": 15.5,
    "transactionCount": 150,
    "pointRevenue": 10000000,
    "botRevenue": 25000000,
    "regularRevenue": 15000000
  },
  "academyStats": [
    {
      "academyId": "academy-001",
      "academyName": "서울수학학원",
      "totalAmount": 15500000,
      "transactionCount": 45,
      "pointAmount": 3500000,
      "botAmount": 8000000,
      "subscriptionAmount": 4000000
    }
  ],
  "transactions": [...],
  "monthlyTrend": [...]
}
```

## 📝 다음 단계

1. ✅ API 코드 수정 완료
2. ✅ 테스트 스크립트 실행
3. ✅ 커밋 및 배포
4. ⏳ 사용자 테스트 및 피드백
5. ⏳ 추가 요구사항 구현
