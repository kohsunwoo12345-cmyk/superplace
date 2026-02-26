# 🔧 빌드 에러 수정 완료

**날짜**: 2026-02-26  
**커밋**: dd72c57

---

## 🐛 문제

Next.js 15에서 `useSearchParams()` 사용 시 빌드 에러 발생:

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/store/detail"
```

---

## ✅ 해결 방법

### 1️⃣ 상품 상세 페이지 수정

**파일**: `/src/app/store/detail/page.tsx`

```tsx
import { Suspense } from 'react';

// 기존 컴포넌트를 별도 함수로 분리
function ProductDetailPageContent() {
  const searchParams = useSearchParams();
  // ... 나머지 로직
}

// Suspense로 감싸서 export
export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    }>
      <ProductDetailPageContent />
    </Suspense>
  );
}
```

### 2️⃣ 구매 페이지 수정

**파일**: `/src/app/store/purchase/page.tsx`

동일한 방식으로 `Suspense` boundary 추가

---

## 📊 변경 내용

- **수정된 파일**: 2개
  - `/src/app/store/detail/page.tsx`
  - `/src/app/store/purchase/page.tsx`

- **변경 사항**:
  - `Suspense` import 추가
  - 기존 컴포넌트를 `*Content()` 함수로 분리
  - `Suspense`로 감싸서 export
  - 로딩 fallback UI 추가

---

## 🚀 배포 상태

- **커밋 해시**: dd72c57
- **메시지**: `fix: useSearchParams를 Suspense로 감싸서 Next.js 15 빌드 에러 수정`
- **Push**: ✅ 완료
- **배포**: 🔄 진행 중 (약 3~5분 소요)

---

## 🧪 테스트 체크리스트

배포 완료 후 확인:

- [ ] `/store` 페이지 정상 로드
- [ ] "자세히 보기" 버튼 클릭
- [ ] `/store/detail?id=xxx` 페이지 정상 표시
- [ ] "구매하기" 버튼 클릭
- [ ] `/store/purchase?id=xxx` 페이지 정상 표시
- [ ] 빌드 로그에 에러 없음

---

## 📝 원인 설명

Next.js 15에서는 static generation 시 `useSearchParams()`를 사용하는 컴포넌트를 자동으로 pre-render하려고 시도합니다. 하지만 search params는 런타임에만 사용 가능하므로, `Suspense` boundary로 감싸서 클라이언트 사이드에서만 렌더링되도록 해야 합니다.

**참고**: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

---

**수정 완료!** 🎉

이제 빌드가 성공적으로 완료되고 배포될 것입니다.
