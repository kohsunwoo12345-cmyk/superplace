#!/usr/bin/env node
/**
 * Live Purchase Flow Test
 * Tests the complete flow: Product → Purchase → Approval → Bot Access
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

console.log('\n🧪 Live Purchase Flow Test\n');
console.log('=====================================\n');

console.log('📋 Test Steps:');
console.log('1️⃣  Admin adds a test product');
console.log('2️⃣  User submits a purchase request');
console.log('3️⃣  Admin approves the request');
console.log('4️⃣  User sees the bot in AI chat\n');

console.log('🔗 URLs to test:\n');
console.log('Step 1: Add Product');
console.log(`   ${BASE_URL}/dashboard/admin/store-management/create\n`);

console.log('Step 2: Submit Purchase');
console.log(`   ${BASE_URL}/store\n`);

console.log('Step 3: Approve Purchase');
console.log(`   ${BASE_URL}/dashboard/admin/bot-shop-approvals\n`);

console.log('Step 4: Check AI Chat');
console.log(`   ${BASE_URL}/ai-chat\n`);

console.log('🔍 Common Issues & Fixes:\n');

console.log('❌ Issue 1: Purchase request fails with 500 error');
console.log('   Cause: Missing required fields');
console.log('   Fix: Check browser console for exact error message\n');

console.log('❌ Issue 2: Approval fails with "Academy not found"');
console.log('   Cause: FOREIGN KEY constraint - academy does not exist');
console.log('   Fix: Create academy first in D1 console:\n');
console.log('   INSERT INTO Academy (id, name, owner_email) VALUES');
console.log("   ('test-academy-001', 'Test Academy', 'test@example.com');\n");

console.log('❌ Issue 3: Bot not visible in AI chat');
console.log('   Cause A: User missing academyId');
console.log('   Fix: UPDATE User SET academy_id = \'test-academy-001\' WHERE id = \'your-user-id\';\n');
console.log('   Cause B: Subscription not created or expired');
console.log('   Fix: Check AcademyBotSubscription table\n');

console.log('📊 SQL Verification Queries:\n');

console.log('-- Check if test academy exists:');
console.log("SELECT * FROM Academy WHERE id = 'test-academy-001';\n");

console.log('-- Check user academy assignment:');
console.log("SELECT id, email, academy_id FROM User WHERE email = 'test@example.com';\n");

console.log('-- Check purchase request:');
console.log('SELECT * FROM BotPurchaseRequest ORDER BY createdAt DESC LIMIT 1;\n');

console.log('-- Check subscription after approval:');
console.log('SELECT * FROM AcademyBotSubscription ORDER BY createdAt DESC LIMIT 1;\n');

console.log('-- Verify bot visibility (what user sees):');
console.log(`SELECT 
  u.email,
  u.academy_id,
  s.botId,
  s.subscriptionStartDate,
  s.subscriptionEndDate,
  s.isActive,
  b.name as botName
FROM User u
LEFT JOIN AcademyBotSubscription s ON u.academy_id = s.academyId
LEFT JOIN ai_bots b ON s.botId = b.id
WHERE u.email = 'test@example.com';\n`);

console.log('✅ Success Criteria:\n');
console.log('  ✓ Product creates without error');
console.log('  ✓ Purchase request status = PENDING');
console.log('  ✓ After approval, status = APPROVED');
console.log('  ✓ AcademyBotSubscription record exists');
console.log('  ✓ Bot appears in /ai-chat page\n');

console.log('🚀 Ready to test! Follow the steps above.\n');
console.log(`Timestamp: ${new Date().toISOString()}\n`);
