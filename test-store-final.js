console.log("🛒 쇼핑몰 제품 확인 테스트\n");

// 1. 제품 목록 가져오기
console.log("1️⃣ 제품 목록 가져오기...");
const response = await fetch("https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=true");
const data = await response.json();

console.log(`✅ 총 ${data.products.length}개 제품 로드됨\n`);

// 2. HTML과 이미지가 있는 제품 확인
const productsWithHTML = data.products.filter(p => p.detailHtml && p.detailHtml.length > 0);
const productsWithImage = data.products.filter(p => p.imageUrl && p.imageUrl.length > 0);

console.log("📊 제품 통계:");
console.log(`- HTML이 있는 제품: ${productsWithHTML.length}/${data.products.length}`);
console.log(`- 이미지가 있는 제품: ${productsWithImage.length}/${data.products.length}`);
console.log("");

// 3. 샘플 제품 상세 정보
if (data.products.length > 0) {
  const sampleProduct = data.products[0];
  console.log("📦 샘플 제품 (첫 번째):");
  console.log(`- ID: ${sampleProduct.id}`);
  console.log(`- 이름: ${sampleProduct.name}`);
  console.log(`- 카테고리: ${sampleProduct.category}`);
  console.log(`- 가격: ${sampleProduct.price}`);
  console.log(`- 원가: ${sampleProduct.originalPrice || 'N/A'}`);
  console.log(`- 할인: ${sampleProduct.discountType || 'none'} - ${sampleProduct.discountValue || 0}`);
  console.log(`- 프로모션: ${sampleProduct.promotionType || 'none'}`);
  console.log(`- 배지: ${sampleProduct.badges || 'N/A'}`);
  console.log(`- HTML 길이: ${sampleProduct.detailHtml ? sampleProduct.detailHtml.length : 0} bytes`);
  console.log(`- 이미지 길이: ${sampleProduct.imageUrl ? sampleProduct.imageUrl.length : 0} bytes`);
  console.log(`- Active: ${sampleProduct.isActive}`);
  console.log(`- Featured: ${sampleProduct.isFeatured}`);
  console.log("");
  
  // 4. 쇼핑몰 URL 생성
  console.log("🔗 쇼핑몰 URL:");
  console.log(`메인: https://superplacestudy.pages.dev/store/`);
  console.log(`상세: https://superplacestudy.pages.dev/store/detail?id=${sampleProduct.id}`);
}

console.log("\n✅ 테스트 완료!");
console.log("\n💡 확인 사항:");
console.log("1. 쇼핑몰 메인 페이지에서 제품 카드가 표시되는지 확인");
console.log("2. 제품 상세 페이지에서 이미지가 표시되는지 확인");
console.log("3. '상세정보' 탭에서 HTML이 제대로 렌더링되는지 확인");
console.log("4. 마케팅 필드(배지, 할인, 프로모션)가 표시되는지 확인");
