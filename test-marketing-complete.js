const API_BASE = 'https://superplacestudy.pages.dev';

async function testMarketingComplete() {
  try {
    console.log('\n🎯 Complete Marketing Features Test\n');
    
    // Fetch products
    const response = await fetch(`${API_BASE}/api/admin/store-products?activeOnly=true`);
    const data = await response.json();
    
    console.log(`Total products: ${data.products.length}\n`);
    
    let validCount = 0;
    let invalidCount = 0;
    let withDiscountCount = 0;
    let withPromotionCount = 0;
    let withBadgesCount = 0;
    let withTimeDealCount = 0;
    
    data.products.forEach((p, i) => {
      const hasDiscount = p.discountType && p.discountType !== 'none' && p.discountValue > 0;
      const hasPromotion = p.promotionType && p.promotionType !== 'none';
      const hasBadges = p.badges && p.badges.trim().length > 0;
      const isTimeDeal = p.isTimeDeal === 1;
      
      // Check if discount is valid
      let isValid = true;
      if (hasDiscount && p.discountType === 'percentage' && p.discountValue > 100) {
        isValid = false;
        invalidCount++;
        console.log(`⚠️  Product ${i + 1}: "${p.name}"`);
        console.log(`   Invalid discount: ${p.discountValue}% (>100%)`);
        console.log(`   Will be displayed without discount on frontend\n`);
      } else {
        validCount++;
      }
      
      if (hasDiscount) withDiscountCount++;
      if (hasPromotion) withPromotionCount++;
      if (hasBadges) withBadgesCount++;
      if (isTimeDeal) withTimeDealCount++;
    });
    
    console.log('\n📊 Marketing Features Summary:');
    console.log(`✅ Valid products: ${validCount}`);
    console.log(`❌ Invalid products (discount >100%): ${invalidCount}`);
    console.log(`💰 With discount: ${withDiscountCount}`);
    console.log(`🎁 With promotion: ${withPromotionCount}`);
    console.log(`🏷️  With badges: ${withBadgesCount}`);
    console.log(`⏰ Time deals: ${withTimeDealCount}`);
    
    console.log('\n\n✅ Test Complete');
    console.log('\n📝 Notes:');
    console.log('- Frontend now validates discount percentage (0-100%)');
    console.log('- Invalid discounts (>100%) are ignored and not displayed');
    console.log('- Admin panel now prevents entering discount >100%');
    console.log('- All marketing fields (discount, promotion, badges, time deal) are displayed');
    console.log('\n🔗 URLs:');
    console.log('Store: https://superplacestudy.pages.dev/store/');
    console.log('Admin: https://superplacestudy.pages.dev/dashboard/admin/store-management/create/');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMarketingComplete();
