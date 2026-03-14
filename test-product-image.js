console.log("🖼️ 제품 이미지 테스트\n");

// 1. 최근 제품 확인
console.log("1️⃣ 최근 제품 이미지 상태 확인...");
const response = await fetch("https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=false");
const data = await response.json();

console.log(`✅ 총 ${data.products.length}개 제품\n`);

// 이미지 상태별 분류
const withImage = data.products.filter(p => p.imageUrl && p.imageUrl.length > 100);
const withSmallImage = data.products.filter(p => p.imageUrl && p.imageUrl.length > 0 && p.imageUrl.length <= 100);
const noImage = data.products.filter(p => !p.imageUrl || p.imageUrl.length === 0);

console.log("📊 이미지 상태:");
console.log(`- 이미지 있음 (>100 bytes): ${withImage.length}`);
console.log(`- 작은 이미지 (<=100 bytes): ${withSmallImage.length}`);
console.log(`- 이미지 없음: ${noImage.length}\n`);

// 최근 제품 3개 상세 확인
console.log("📦 최근 제품 3개 상세:");
data.products.slice(0, 3).forEach((p, idx) => {
  console.log(`\n[${idx + 1}] ${p.name}`);
  console.log(`  - ID: ${p.id}`);
  console.log(`  - 이미지 URL 길이: ${p.imageUrl ? p.imageUrl.length : 0} bytes`);
  if (p.imageUrl) {
    const preview = p.imageUrl.substring(0, 100);
    console.log(`  - 이미지 시작: ${preview}...`);
    
    // Base64 체크
    if (p.imageUrl.startsWith('data:image/')) {
      console.log(`  - 타입: Base64 이미지`);
    } else if (p.imageUrl.startsWith('http')) {
      console.log(`  - 타입: 외부 URL`);
    } else {
      console.log(`  - 타입: 알 수 없음`);
    }
  } else {
    console.log(`  - 이미지: 없음`);
  }
});

console.log("\n✅ 테스트 완료!");
