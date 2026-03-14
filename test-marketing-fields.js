console.log("🛍️ 마케팅 필드 확인 테스트\n");

// 최근 제품 확인
const response = await fetch("https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=false");
const data = await response.json();

console.log(`총 ${data.products.length}개 제품\n`);

// 마케팅 필드가 있는 제품 찾기
const productsWithMarketing = data.products.filter(p => 
  p.originalPrice || p.discountType !== 'none' || p.badges || p.promotionType !== 'none'
);

console.log(`마케팅 필드가 있는 제품: ${productsWithMarketing.length}개\n`);

// 최근 제품 3개 상세 확인
console.log("📦 최근 제품 3개 마케팅 필드:");
data.products.slice(0, 3).forEach((p, idx) => {
  console.log(`\n[${idx + 1}] ${p.name}`);
  console.log(`  - 원가: ${p.originalPrice || 'N/A'}`);
  console.log(`  - 할인 타입: ${p.discountType || 'none'}`);
  console.log(`  - 할인 값: ${p.discountValue || 0}`);
  console.log(`  - 프로모션: ${p.promotionType || 'none'}`);
  console.log(`  - 프로모션 설명: ${p.promotionDescription || 'N/A'}`);
  console.log(`  - 배지: ${p.badges || 'N/A'}`);
  console.log(`  - 타임딜: ${p.isTimeDeal}`);
  console.log(`  - 재고: ${p.stockQuantity}`);
  console.log(`  - 최대 구매: ${p.maxPurchasePerUser}`);
});

console.log("\n✅ 테스트 완료!");
