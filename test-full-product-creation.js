// 완전한 제품 생성 테스트 - 모든 필드 포함

console.log("🚀 완전한 제품 생성 테스트 시작...\n");

// 실제 이미지 대신 작은 base64 이미지 사용 (테스트용)
const smallImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const fullProductData = {
  name: "🎓 완전 테스트 - AI 영어 학습 봇 (All Fields)",
  category: "AI_BOT",
  section: "academy_bots",
  description: "모든 필드가 포함된 완전한 테스트 제품입니다. 이것은 긴 설명 텍스트입니다.".repeat(10),
  shortDescription: "완전한 기능을 갖춘 AI 영어 학습 봇",
  
  // 가격
  price: 60000,
  monthlyPrice: 60000,
  yearlyPrice: 600000,
  pricePerStudent: 50000,
  
  // 마케팅 필드
  originalPrice: 100000,
  discountType: "percentage",
  discountValue: 40,
  promotionType: "1plus1",
  promotionDescription: "1개 구매 시 1개 무료!",
  promotionStartDate: "2026-03-14",
  promotionEndDate: "2026-04-14",
  badges: "NEW,HOT,BEST,추천",
  isTimeDeal: 1,
  stockQuantity: 200,
  maxPurchasePerUser: 10,
  
  // 기능
  features: "24시간 AI 학습 도우미\n실시간 발음 교정\n맞춤형 학습 계획\n진도 추적 및 리포트",
  
  // HTML 상세 설명
  detailHtml: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #2563eb; text-align: center;">🎓 AI 영어 학습 봇</h1>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
        <h2>✨ 혁신적인 AI 기반 영어 학습</h2>
        <p style="font-size: 18px; line-height: 1.8;">
          최첨단 AI 기술로 여러분의 영어 실력을 한 단계 업그레이드하세요!
        </p>
      </div>
      
      <h2 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">📚 주요 기능</h2>
      <ul style="font-size: 16px; line-height: 2;">
        <li><strong>실시간 발음 교정:</strong> AI가 여러분의 발음을 분석하고 즉시 피드백을 제공합니다.</li>
        <li><strong>맞춤형 학습 계획:</strong> 개인의 수준과 목표에 맞는 커리큘럼을 자동으로 생성합니다.</li>
        <li><strong>24시간 학습 지원:</strong> 언제 어디서나 AI 튜터와 함께 학습할 수 있습니다.</li>
        <li><strong>진도 추적:</strong> 상세한 학습 리포트로 성장을 확인하세요.</li>
      </ul>
      
      <h2 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">🎯 이런 분들께 추천합니다</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h3>🏫 학생</h3>
          <p>내신 및 수능 영어 대비</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h3>💼 직장인</h3>
          <p>비즈니스 영어 실력 향상</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h3>🌍 여행자</h3>
          <p>여행 영어 회화 학습</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <h3>📖 자기개발</h3>
          <p>영어 실력을 키우고 싶은 모든 분</p>
        </div>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
        <h3 style="color: #92400e; margin-top: 0;">⚠️ 특별 이벤트!</h3>
        <p style="color: #78350f; font-size: 16px;">
          지금 구매하시면 <strong>1+1 이벤트</strong>로 한 개를 더 드립니다!<br>
          기간: 2026년 3월 14일 ~ 4월 14일
        </p>
      </div>
      
      <h2 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">💰 가격 안내</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #3b82f6; color: white;">
            <th style="padding: 15px; text-align: left;">플랜</th>
            <th style="padding: 15px; text-align: right;">가격</th>
            <th style="padding: 15px; text-align: right;">할인</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f9fafb;">
            <td style="padding: 15px;">월간 플랜</td>
            <td style="padding: 15px; text-align: right;">60,000원</td>
            <td style="padding: 15px; text-align: right; color: #dc2626; font-weight: bold;">40% 할인</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 15px;">연간 플랜</td>
            <td style="padding: 15px; text-align: right;">600,000원</td>
            <td style="padding: 15px; text-align: right; color: #dc2626; font-weight: bold;">2개월 무료</td>
          </tr>
        </tbody>
      </table>
      
      <div style="background: #3b82f6; color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
        <h2 style="margin-top: 0;">🎁 지금 바로 시작하세요!</h2>
        <p style="font-size: 18px;">영어 실력 향상의 첫 걸음을 내딛으세요.</p>
      </div>
    </div>
  `,
  
  // 이미지 (작은 테스트 이미지)
  imageUrl: smallImageBase64,
  
  // 봇 ID
  botId: "",
  
  // 상태
  isActive: 1,
  isFeatured: 1,
  displayOrder: 1,
  
  // 키워드
  keywords: "영어,학습,AI,교육,회화,발음,문법",
  
  // 채팅 제한
  dailyChatLimit: 50,
};

console.log("📝 생성할 제품 정보:");
console.log("- 이름:", fullProductData.name);
console.log("- 카테고리:", fullProductData.category);
console.log("- 가격:", fullProductData.price.toLocaleString() + "원");
console.log("- 원가:", fullProductData.originalPrice.toLocaleString() + "원");
console.log("- 할인:", fullProductData.discountValue + "%");
console.log("- 프로모션:", fullProductData.promotionType);
console.log("- 배지:", fullProductData.badges);
console.log("- 재고:", fullProductData.stockQuantity);
console.log("- HTML 길이:", fullProductData.detailHtml.length, "bytes");
console.log("- 이미지 길이:", fullProductData.imageUrl.length, "bytes");
console.log("- 설명 길이:", fullProductData.description.length, "bytes");

console.log("\n📤 제품 생성 중...");

const response = await fetch("https://superplacestudy.pages.dev/api/admin/store-products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(fullProductData),
});

const responseText = await response.text();
console.log("\n📥 응답 상태:", response.status, response.statusText);

let result;
try {
  result = JSON.parse(responseText);
  console.log("📋 응답 내용:", result);
} catch (e) {
  console.log("❌ JSON 파싱 실패. 원본 응답:");
  console.log(responseText.substring(0, 500));
}

if (response.ok && result && result.success) {
  console.log("\n✅ 제품 생성 성공!");
  console.log("🆔 제품 ID:", result.productId);
  
  // 생성된 제품 확인
  console.log("\n🔍 생성된 제품 확인 중...");
  const checkResponse = await fetch("https://superplacestudy.pages.dev/api/admin/store-products?activeOnly=false");
  const checkData = await checkResponse.json();
  
  const createdProduct = checkData.products.find(p => p.id === result.productId);
  if (createdProduct) {
    console.log("\n✅ 제품 확인 완료:");
    console.log("- ID:", createdProduct.id);
    console.log("- 이름:", createdProduct.name);
    console.log("- 가격:", createdProduct.price);
    console.log("- 원가:", createdProduct.originalPrice);
    console.log("- 할인 타입:", createdProduct.discountType);
    console.log("- 할인 값:", createdProduct.discountValue);
    console.log("- 프로모션:", createdProduct.promotionType);
    console.log("- 프로모션 설명:", createdProduct.promotionDescription);
    console.log("- 배지:", createdProduct.badges);
    console.log("- 타임딜:", createdProduct.isTimeDeal);
    console.log("- 재고:", createdProduct.stockQuantity);
    console.log("- 최대 구매:", createdProduct.maxPurchasePerUser);
    console.log("- HTML 있음:", createdProduct.detailHtml ? "✅" : "❌");
    console.log("- 이미지 있음:", createdProduct.imageUrl ? "✅" : "❌");
    console.log("- Featured:", createdProduct.isFeatured);
    console.log("- Active:", createdProduct.isActive);
  } else {
    console.log("❌ 생성된 제품을 찾을 수 없습니다.");
  }
  
} else {
  console.log("\n❌ 제품 생성 실패!");
  if (result && result.error) {
    console.log("오류:", result.error);
    console.log("메시지:", result.message);
  }
}

console.log("\n✅ 테스트 완료!");
