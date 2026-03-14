console.log('\n📊 Frontend Display Logic Test\n');

const products = [
  { name: 'ㅇㅁㄴㄴㅇㅁ', originalPrice: 213, price: 231123, discountType: 'percentage', discountValue: 231 },
  { name: 'ㅇㅁㄴ', originalPrice: 1221, price: 122112, discountType: 'percentage', discountValue: 122 },
  { name: '🎁 AI 수학 학습 봇', originalPrice: 100000, price: 50000, discountType: 'percentage', discountValue: 50 },
];

products.forEach(p => {
  console.log(`\n--- ${p.name} ---`);
  console.log(`DB Data: originalPrice=${p.originalPrice}, price=${p.price}, discount=${p.discountValue}%`);
  
  // Frontend logic (new code)
  let basePrice = p.originalPrice || p.price;
  let finalPrice = basePrice;
  let displayDiscount = 0;
  
  if (p.discountType === 'percentage' && p.discountValue > 0 && p.discountValue <= 100) {
    finalPrice = basePrice * (1 - p.discountValue / 100);
    displayDiscount = Math.round(p.discountValue);
  } else if (p.discountType === 'percentage' && p.discountValue > 100) {
    // Invalid discount - will NOT be displayed
    displayDiscount = 0;
    console.log('⚠️  Invalid discount (>100%) - will be ignored in frontend');
  }
  
  console.log(`Frontend Display:`);
  console.log(`  Base Price: ₩${basePrice.toLocaleString()}`);
  console.log(`  Discount Badge: ${displayDiscount > 0 ? displayDiscount + '%' : 'Not shown'}`);
  console.log(`  Final Price: ₩${Math.round(finalPrice).toLocaleString()}`);
  console.log(`  Status: ${displayDiscount > 0 ? '✅ Valid' : '❌ Invalid (discount ignored)'}`);
});

console.log('\n\n📝 Summary:');
console.log('- Products with discount >100% will show NO discount badge');
console.log('- Final price will be calculated from originalPrice without discount');
console.log('- Data needs to be corrected in admin panel');
console.log('\n');
