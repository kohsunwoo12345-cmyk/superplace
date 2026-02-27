# 🔍 랜딩페이지 생성 문제 최종 진단 및 해결

## 🎯 핵심 문제

**증상**: 랜딩페이지 생성 API는 성공 (HTTP 200), 하지만 생성된 페이지 접근 시 404

**원인**: INSERT와 SELECT가 서로 다른 테이블을 사용

## 📊 현재 상황 분석

### 1. INSERT (생성 API)
```typescript
// functions/api/admin/landing-pages.ts
INSERT INTO landing_pages (
  id, slug, title, subtitle, description,
  templateType, templateHtml, inputData,
  ogTitle, ogDescription, thumbnail,
  folderId, showQrCode, qrCodeUrl,
  views, submissions, isActive, createdBy
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```
- ✅ HTTP 200 성공
- ✅ id, slug 등 생성됨
- 사용 테이블: `landing_pages` (lowercase)

### 2. SELECT (뷰 엔드포인트)
```typescript
// functions/lp/[slug].ts  
SELECT * FROM landing_pages WHERE slug = ? AND isActive = 1
```
- ❌ 페이지 못 찾음 (404)
- 시도: landing_pages → LandingPage 둘 다
- 결과: 둘 다 실패

## 🔍 가능한 원인

### 가설 1: 컬럼명 불일치
- INSERT uses: `isActive` (camelCase)
- SELECT WHERE: `isActive = 1`
- SQLite는 컬럼명 대소문자 구분 안 함 → 이건 아님

### 가설 2: 타입 불일치
- `isActive` INTEGER로 저장
- WHERE `isActive = 1` 조건
- VALUES에 1 바인딩했으므로 문제없음

### 가설 3: INSERT가 실패했지만 성공 응답
```typescript
} catch (insertError: any) {
  console.error("❌ INSERT failed:", insertError.message);
  // INSERT 실패해도 계속 진행 (성공 응답 보냄)  ← 이게 문제!
}
```
**바로 이거다!** INSERT가 실제로 실패했지만 코드가 성공 응답을 보내고 있음!

## ✅ 최종 해결책

INSERT 실패 시 실제 오류를 throw하고, 성공 시에만 200 응답:

```typescript
try {
  await db.prepare(`INSERT INTO...`).bind(...).run();
  
  const result = await db.prepare(`SELECT id FROM landing_pages WHERE slug = ?`)
    .bind(slug)
    .first();
    
  if (!result) {
    throw new Error("INSERT succeeded but row not found!");
  }
  
  insertedId = result.id;
  
  return new Response(JSON.stringify({ success: true, ... }), { status: 200 });
  
} catch (insertError: any) {
  // 진짜 오류 반환!
  return new Response(
    JSON.stringify({
      error: insertError.message,
      details: "Landing page creation failed"
    }),
    { status: 500 }
  );
}
```

## 🛠️ 다음 단계

1. ✅ INSERT 실패 시 에러 throw하도록 수정
2. ✅ 성공 응답은 실제 성공 시에만
3. ✅ 디버깅 로그 강화
4. ✅ 재테스트

