// 기존 제품 수정 테스트
const productId = "product_1773524647110_qo1v2buu6"; // 이전에 생성한 제품

// 1. 제품 정보 확인
console.log("1️⃣ 기존 제품 확인...");
const checkResponse = await fetch(`https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=false`);
const checkData = await checkResponse.json();
const product = checkData.products.find(p => p.id === productId);

if (product) {
  console.log("✅ 제품 발견:", {
    id: product.id,
    name: product.name,
    originalPrice: product.originalPrice,
    discountType: product.discountType,
    discountValue: product.discountValue,
    badges: product.badges,
    stockQuantity: product.stockQuantity,
  });
} else {
  console.log("❌ 제품을 찾을 수 없습니다");
  process.exit(1);
}

// 2. 마케팅 필드 수정
console.log("\n2️⃣ 마케팅 필드 수정...");
const updateData = {
  ...product,
  // 할인 정보 수정
  originalPrice: 120000,
  discountType: "percentage",
  discountValue: 60, // 60% 할인
  // 프로모션 수정
  promotionType: "2plus1",
  promotionDescription: "2개 구매 시 1개 무료 증정!",
  promotionStartDate: "2026-03-14",
  promotionEndDate: "2026-04-14",
  // 배지 수정
  badges: "BEST,HOT,한정판",
  isTimeDeal: 1,
  // 재고 수정
  stockQuantity: 50,
  maxPurchasePerUser: 3,
};

const updateResponse = await fetch(`https://superplacestudy.pages.dev/api/admin/store-products/${productId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const updateResult = await updateResponse.json();
console.log("수정 결과:", updateResponse.ok ? "✅ 성공" : "❌ 실패");
console.log("응답:", updateResult);

// 3. 수정 확인
console.log("\n3️⃣ 수정 내용 확인...");
const verifyResponse = await fetch(`https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=false`);
const verifyData = await verifyResponse.json();
const updatedProduct = verifyData.products.find(p => p.id === productId);

if (updatedProduct) {
  console.log("✅ 수정된 제품:", {
    id: updatedProduct.id,
    name: updatedProduct.name,
    originalPrice: updatedProduct.originalPrice,
    discountType: updatedProduct.discountType,
    discountValue: updatedProduct.discountValue,
    promotionType: updatedProduct.promotionType,
    promotionDescription: updatedProduct.promotionDescription,
    badges: updatedProduct.badges,
    isTimeDeal: updatedProduct.isTimeDeal,
    stockQuantity: updatedProduct.stockQuantity,
    maxPurchasePerUser: updatedProduct.maxPurchasePerUser,
  });
  
  // 할인 계산 확인
  const discountedPrice = updatedProduct.originalPrice * (1 - updatedProduct.discountValue / 100);
  console.log("\n💰 할인 계산:");
  console.log(`원가: ${updatedProduct.originalPrice?.toLocaleString()}원`);
  console.log(`할인율: ${updatedProduct.discountValue}%`);
  console.log(`최종 가격: ${discountedPrice.toLocaleString()}원`);
}

console.log("\n✅ 테스트 완료!");
