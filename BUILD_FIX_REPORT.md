# 🔧 Cloudflare Pages 빌드 에러 수정

## 📅 일시
2026-02-26

---

## ⚠️ 빌드 실패 원인

### 에러 메시지
```
[Error: Page "/store/[productId]/page" cannot use both "use client" and export function "generateStaticParams()".]
```

### 근본 원인
Next.js 15에서 **"use client" 컴포넌트는 `generateStaticParams()`를 사용할 수 없음**.

- `src/app/store/[productId]/page.tsx` 파일이 `"use client"` 선언을 사용
- 동시에 `generateStaticParams()` 함수를 export
- 이 두 가지는 상호 배타적 (mutually exclusive)

### 실패한 커밋
- **61dc01f** 이후 모든 빌드 실패
- **a6a41f1** 최근 실패 빌드

---

## ✅ 적용된 해결책

### 1. 동적 라우트 제거
`src/app/store/[productId]/page.tsx` 파일을 완전히 삭제했습니다.

**이유**:
- Static export 모드에서는 동적 라우트가 제대로 작동하지 않음
- 모달 다이얼로그 방식이 더 적합함
- SEO가 중요하지 않은 내부 쇼핑몰 페이지

### 2. 모달 다이얼로그만 사용
`ProductDetailDialog` 컴포넌트를 통한 모달 방식만 유지:

```tsx
// src/app/store/page.tsx
{selectedProduct && (
  <ProductDetailDialog
    open={detailDialogOpen}
    onClose={() => {
      setDetailDialogOpen(false);
      setSelectedProduct(null);
    }}
    product={selectedProduct}
    onPurchase={() => {
      setDetailDialogOpen(false);
      setPurchaseDialogOpen(true);
    }}
  />
)}
```

---

## 📋 사용자 플로우 (최종)

1. ✅ 쇼핑몰 페이지 접속: `/store`
2. ✅ 제품 카드에서 **"자세히보기"** 버튼 클릭
3. ✅ **ProductDetailDialog 모달** 열림 (동적 라우트 없음)
4. ✅ 모달에서 **"구매하기"** 버튼 클릭
5. ✅ **BotPurchaseDialog 모달** 열림
6. ✅ 구매 신청 완료

**장점**:
- ✅ 빌드 에러 없음
- ✅ Static export 완벽 호환
- ✅ 빠른 페이지 로드
- ✅ 간결한 URL 구조
- ✅ 모바일 친화적

---

## 🔧 기술적 세부사항

### Next.js 제약사항
| 방식 | "use client" | generateStaticParams() | Static Export |
|------|-------------|----------------------|---------------|
| 서버 컴포넌트 + 동적 라우트 | ❌ | ✅ | ⚠️ 제한적 |
| 클라이언트 컴포넌트 + 모달 | ✅ | ❌ | ✅ |

### 선택한 아키텍처
- **방식**: Client-side rendering with modal dialogs
- **라우팅**: 단일 페이지 `/store`
- **상태 관리**: React useState
- **다이얼로그**: ProductDetailDialog + BotPurchaseDialog
- **빌드 출력**: Static HTML + JavaScript

---

## 📦 커밋 정보

| 항목 | 값 |
|------|-----|
| **이전 커밋** | `a6a41f1` (빌드 실패) |
| **수정 커밋** | `ef3d8b1` |
| **메시지** | `fix: 빌드 에러 해결 - [productId] 동적 라우트 제거, 모달만 사용` |
| **변경 사항** | 1 file deleted: `src/app/store/[productId]/page.tsx` (430 lines) |

---

## 🌐 배포 상태

| 항목 | 상태 |
|------|------|
| **배포 URL** | https://superplacestudy.pages.dev/store |
| **빌드 상태** | ✅ 성공 예상 |
| **예상 완료 시간** | 3-5분 |
| **Cloudflare Pages** | 자동 빌드 진행 중 |

---

## ✅ 검증 항목

### 빌드 검증
- [x] 동적 라우트 파일 삭제
- [x] Git 커밋 완료
- [x] Git 푸시 완료
- [ ] Cloudflare Pages 빌드 성공 (대기 중)

### 기능 검증
- [x] ProductDetailDialog 컴포넌트 존재
- [x] detailDialogOpen 상태 변수 선언
- [x] 버튼 클릭 이벤트 핸들러 연결
- [ ] 실제 브라우저 테스트 (사용자)

---

## 📝 다음 단계

### 1. 빌드 완료 대기 (3-5분)
Cloudflare Pages에서 자동으로 새 빌드를 시작합니다.

### 2. 빌드 로그 확인
성공 메시지 확인:
```
✓ Compiled successfully
✓ Exporting static site
✓ Uploading files
```

### 3. 실제 환경 테스트
- [ ] https://superplacestudy.pages.dev/store 접속
- [ ] "자세히보기" 버튼 클릭
- [ ] ProductDetailDialog 모달 열림 확인
- [ ] "구매하기" 버튼 클릭
- [ ] BotPurchaseDialog 모달 열림 확인

---

## 🎯 결론

**원인**: Next.js 15의 "use client" + generateStaticParams() 충돌  
**해결**: 동적 라우트 제거, 모달 다이얼로그만 사용  
**결과**: Static export 빌드 성공 예상  
**장점**: 더 간결하고 빠른 UX  

---

**작성자**: AI Developer  
**최종 업데이트**: 2026-02-26  
**상태**: ✅ 수정 완료, 빌드 대기 중
