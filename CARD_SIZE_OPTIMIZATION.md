# 제품 카드 크기 최적화 및 다중 표시 기능

## 📅 구현 일자
2026-02-27

## 🎯 목표
사용자가 한 번에 더 많은 제품을 볼 수 있도록 제품 카드 크기를 줄이고, 한 페이지에 3개의 제품이 표시되도록 개선

## ✅ 구현 내역

### 1. 제품 카드 크기 축소
- **이미지 비율**: `pt-[75%]` → `pt-[65%]` (높이 감소)
- **패딩**: `p-6` → `p-4` (여백 축소)
- **제목 크기**: `text-xl` → `text-base`
- **가격 크기**: `text-3xl` → `text-xl`
- **버튼 패딩**: `py-4` → `py-2.5`
- **버튼 텍스트**: `text-base` → `text-sm`
- **설명 텍스트**: `text-sm mb-6` → `text-xs mb-4`
- **별점 아이콘**: `w-4 h-4` → `w-3.5 h-3.5`
- **별점 텍스트**: `text-sm` → `text-xs`
- **모서리**: `rounded-2xl` → `rounded-xl` (더 부드러운 디자인)

### 2. 슬라이더 레이아웃 변경
**이전**: 한 번에 1개 제품만 표시
```tsx
{section.products.map((product) => (
  <div key={product.id} className="w-full flex-shrink-0 px-2">
    <ProductCard product={product} />
  </div>
))}
```

**변경 후**: 한 번에 3개 제품 표시 (그리드 레이아웃)
```tsx
{Array.from({ length: Math.ceil(section.products.length / 3) }).map((_, pageIdx) => (
  <div key={pageIdx} className="w-full flex-shrink-0">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
      {section.products.slice(pageIdx * 3, pageIdx * 3 + 3).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </div>
))}
```

### 3. 슬라이더 네비게이션 로직 개선
**이전**: 제품 개수만큼 슬라이드
```tsx
const moveSlider = (sectionId: string, direction: 'left' | 'right') => {
  // ...
  if (direction === 'left') {
    newPos = currentPos === 0 ? section.products.length - 1 : currentPos - 1;
  } else {
    newPos = (currentPos + 1) % section.products.length;
  }
};
```

**변경 후**: 페이지 단위로 슬라이드 (3개씩)
```tsx
const moveSlider = (sectionId: string, direction: 'left' | 'right') => {
  const itemsPerPage = 3;
  const maxPos = Math.max(0, Math.ceil(section.products.length / itemsPerPage) - 1);
  
  if (direction === 'left') {
    newPos = currentPos === 0 ? maxPos : currentPos - 1;
  } else {
    newPos = currentPos >= maxPos ? 0 : currentPos + 1;
  }
};
```

### 4. 자동 슬라이드 조건 변경
**이전**: 제품이 2개 이상이면 자동 슬라이드
```tsx
if (section.products.length > 1) {
  // 자동 슬라이드 시작
}
```

**변경 후**: 제품이 4개 이상(페이지가 2개 이상)일 때만 자동 슬라이드
```tsx
if (section.products.length > 3) {
  const maxPos = Math.ceil(section.products.length / 3) - 1;
  // 자동 슬라이드 시작
}
```

### 5. 점 표시 및 화살표 조건
**이전**: 제품이 2개 이상이면 표시
```tsx
{section.products.length > 1 && (
  <div className="flex justify-center gap-2 mt-6">
    {section.products.map((_, idx) => ( /* ... */ ))}
  </div>
)}
```

**변경 후**: 제품이 4개 이상일 때만 표시
```tsx
{section.products.length > 3 && (
  <div className="flex justify-center gap-2 mt-6">
    {Array.from({ length: Math.ceil(section.products.length / 3) }).map((_, idx) => ( /* ... */ ))}
  </div>
)}
```

## 📱 반응형 디자인
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
```
- **모바일 (< 768px)**: 1열 (1개씩 표시)
- **태블릿 (768px ~ 1024px)**: 2열 (2개씩 표시)
- **데스크톱 (> 1024px)**: 3열 (3개씩 표시)

## 🎨 개선 효과

### 이전
- 한 번에 1개 제품만 보임
- 큰 카드로 스크롤이 많이 필요
- 제품 비교가 어려움
- 네비게이션이 너무 민감

### 변경 후
- 한 번에 3개 제품 표시
- 작고 깔끔한 카드 디자인
- 제품 비교가 쉬움
- 페이지 단위 네비게이션으로 UX 개선
- 더 빠른 제품 탐색

## 📊 페이지 성능
- **로딩 시간**: 10.48초
- **제품 수**: 5개
- **콘솔 에러**: 없음
- **상태**: ✅ 정상 작동

## 🔗 배포 정보
- **커밋**: `fc0e3a7`
- **브랜치**: `main`
- **배포 URL**: https://superplacestudy.pages.dev/store

## 📝 사용자 흐름
1. `/store` 접속
2. 한 페이지에 최대 3개 제품 확인
3. 카테고리 필터로 원하는 분류 선택
4. 화살표 또는 점을 클릭하여 다음 페이지 이동
5. 5초마다 자동으로 다음 페이지로 전환 (4개 이상일 때)
6. 제품 카드 클릭 → `/store/detail?id={productId}`

## 🎯 향후 개선 사항
- [ ] 모바일에서 2개씩 표시 옵션 추가
- [ ] 사용자 설정으로 표시 개수 변경 가능
- [ ] 무한 스크롤 옵션 추가
- [ ] 제품 필터링 고도화 (가격대, 별점 등)

## 📌 기술 스택
- Next.js 15
- React 18
- TypeScript
- TailwindCSS
- Cloudflare Pages

---

**작성자**: AI Assistant  
**마지막 업데이트**: 2026-02-27
