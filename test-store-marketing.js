const API_BASE = 'https://superplacestudy.pages.dev';

async function testStoreMarketing() {
  try {
    console.log('\n📦 Testing Store Marketing Features\n');
    
    // 1. Fetch all products
    const response = await fetch(`${API_BASE}/api/admin/store-products?activeOnly=true`);
    const data = await response.json();
    
    console.log(`Total products: ${data.products.length}\n`);
    
    // 2. Check marketing fields
    data.products.forEach((product, index) => {
      console.log(`\n--- Product ${index + 1}: ${product.name} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Price: ${product.price}`);
      console.log(`Original Price: ${product.originalPrice || 'Not set'}`);
      console.log(`Discount Type: ${product.discountType || 'none'}`);
      console.log(`Discount Value: ${product.discountValue || 0}`);
      console.log(`Promotion Type: ${product.promotionType || 'none'}`);
      console.log(`Promotion Description: ${product.promotionDescription || 'N/A'}`);
      console.log(`Badges: ${product.badges || 'N/A'}`);
      console.log(`Is Time Deal: ${product.isTimeDeal === 1 ? 'Yes' : 'No'}`);
      console.log(`Stock: ${product.stockQuantity === -1 ? 'Unlimited' : product.stockQuantity}`);
      console.log(`Max Purchase: ${product.maxPurchasePerUser === -1 ? 'Unlimited' : product.maxPurchasePerUser}`);
      
      // Calculate discount
      let finalPrice = product.price;
      let discountAmount = 0;
      let discountPercent = 0;
      
      if (product.discountType === 'percentage' && product.discountValue > 0) {
        discountPercent = product.discountValue;
        discountAmount = (product.originalPrice || product.price) * (product.discountValue / 100);
        finalPrice = (product.originalPrice || product.price) - discountAmount;
      } else if (product.discountType === 'fixed' && product.discountValue > 0) {
        discountAmount = product.discountValue;
        discountPercent = ((product.discountValue / (product.originalPrice || product.price)) * 100).toFixed(1);
        finalPrice = (product.originalPrice || product.price) - product.discountValue;
      }
      
      console.log(`\n💰 Price Calculation:`);
      console.log(`  Original: ₩${(product.originalPrice || product.price).toLocaleString()}`);
      console.log(`  Discount: -₩${discountAmount.toLocaleString()} (${discountPercent}%)`);
      console.log(`  Final: ₩${finalPrice.toLocaleString()}`);
    });
    
    console.log('\n\n✅ Marketing test complete\n');
    console.log('Store URL: https://superplacestudy.pages.dev/store/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStoreMarketing();
