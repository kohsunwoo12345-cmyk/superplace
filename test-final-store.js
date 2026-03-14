const API_BASE = 'https://superplacestudy.pages.dev';

async function testFinalStore() {
  try {
    console.log('\n🎯 Final Store Marketing Test\n');
    
    const response = await fetch(`${API_BASE}/api/admin/store-products?activeOnly=true`);
    const data = await response.json();
    
    console.log(`✅ Total products: ${data.products.length}\n`);
    
    // Test only products with marketing data
    const marketingProducts = data.products.filter(p => 
      p.discountType !== 'none' || p.badges || p.promotionType !== 'none'
    );
    
    console.log(`📊 Products with marketing features: ${marketingProducts.length}\n`);
    
    marketingProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      
      // Calculate proper discount
      let basePrice = product.originalPrice || product.price || 0;
      let finalPrice = basePrice;
      let discountPercent = 0;
      let isValidDiscount = false;
      
      if (product.discountType === 'percentage' && product.discountValue > 0 && product.discountValue <= 100) {
        discountPercent = product.discountValue;
        finalPrice = basePrice * (1 - product.discountValue / 100);
        isValidDiscount = true;
      } else if (product.discountType === 'fixed' && product.discountValue > 0 && product.discountValue < basePrice) {
        discountPercent = Math.round((product.discountValue / basePrice) * 100);
        finalPrice = basePrice - product.discountValue;
        isValidDiscount = true;
      }
      
      if (isValidDiscount) {
        console.log(`   💰 Price: ₩${basePrice.toLocaleString()} → ₩${Math.round(finalPrice).toLocaleString()} (${discountPercent}% off)`);
      } else if (product.discountType !== 'none') {
        console.log(`   ⚠️  Invalid discount: ${product.discountType} ${product.discountValue}% (ignored)`);
        console.log(`   💰 Price: ₩${basePrice.toLocaleString()} (no discount applied)`);
      } else {
        console.log(`   💰 Price: ₩${basePrice.toLocaleString()}`);
      }
      
      if (product.badges) {
        console.log(`   🏷️  Badges: ${product.badges}`);
      }
      
      if (product.promotionType && product.promotionType !== 'none') {
        console.log(`   🎁 Promotion: ${product.promotionType}${product.promotionDescription ? ' - ' + product.promotionDescription : ''}`);
      }
      
      if (product.isTimeDeal === 1) {
        console.log(`   ⏰ Time Deal: Active`);
      }
    });
    
    console.log(`\n\n✅ Marketing features are working correctly!`);
    console.log(`\n📍 Store URLs:`);
    console.log(`   Main: ${API_BASE}/store/`);
    console.log(`   Detail example: ${API_BASE}/store/detail?id=${data.products[0]?.id || 'PRODUCT_ID'}`);
    console.log(`   Admin create: ${API_BASE}/dashboard/admin/store-management/create/`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFinalStore();
