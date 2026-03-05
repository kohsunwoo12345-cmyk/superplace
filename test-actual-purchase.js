#!/usr/bin/env node

const BASE_URL = 'https://superplacestudy.pages.dev';

console.log('\n🛒 Testing Actual Purchase Flow\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test data
const purchaseData = {
  productId: 'test-product-001',
  productName: 'Test AI Bot Product',
  studentCount: 10,
  months: 3,
  pricePerStudent: 10000,
  totalPrice: 300000,
  email: 'test@example.com',
  name: '테스트 구매자',
  academyName: '테스트 학원',
  phoneNumber: '010-1234-5678',
  requestMessage: 'Test purchase request'
};

console.log('📦 Purchase Data:');
console.log(JSON.stringify(purchaseData, null, 2));
console.log('\n');

// Test without token (external user)
console.log('🧪 Test 1: External User Purchase (No Token)\n');
console.log(`POST ${BASE_URL}/api/bot-purchase-requests/create`);
console.log('Headers: Content-Type: application/json');
console.log('Body:', JSON.stringify(purchaseData, null, 2));
console.log('\n');

// Test with token
console.log('🧪 Test 2: Authenticated User Purchase (With Token)\n');
console.log(`POST ${BASE_URL}/api/bot-purchase-requests/create`);
console.log('Headers:');
console.log('  Content-Type: application/json');
console.log('  Authorization: Bearer USER_ID|user@example.com|USER|academy-id');
console.log('Body:', JSON.stringify(purchaseData, null, 2));
console.log('\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('🔍 Manual Testing Steps:\n');
console.log('1. Open Chrome DevTools (F12)');
console.log('2. Go to https://superplacestudy.pages.dev/store');
console.log('3. Click "구매하기" on any product');
console.log('4. Fill in the form');
console.log('5. Open Network tab in DevTools');
console.log('6. Click "구매 요청" button');
console.log('7. Check the network request to /api/bot-purchase-requests/create');
console.log('8. Look at the Response tab for error details\n');

console.log('📋 Common Errors:\n');
console.log('❌ "Missing required fields"');
console.log('   → Check: productId, productName, studentCount, months, pricePerStudent\n');

console.log('❌ "Student count and months must be at least 1"');
console.log('   → Check: studentCount >= 1, months >= 1\n');

console.log('❌ "Failed to create request"');
console.log('   → Database error - check Cloudflare D1 logs\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('🔗 URLs:\n');
console.log('Store: https://superplacestudy.pages.dev/store');
console.log('Purchase Page: https://superplacestudy.pages.dev/store/purchase?id=PRODUCT_ID');
console.log('Cloudflare Logs: https://dash.cloudflare.com → Workers & Pages → superplacestudy → Logs');
console.log('\n');

console.log('✅ Test guide ready. Now manually test on the website and check DevTools.\n');
