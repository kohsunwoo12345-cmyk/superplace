#!/usr/bin/env node
/**
 * 프리뷰 vs 프로덕션 완전 비교 스크립트
 */

const https = require('https');

const PREVIEW_URL = 'd8533809.superplacestudy.pages.dev';
const PRODUCTION_URL = 'superplacestudy.pages.dev';

function httpRequest(hostname, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      followRedirect: false,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function compareEndpoint(path, method = 'POST', data = {}) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing: ${method} ${path}`);
  console.log('='.repeat(80));
  
  try {
    const [preview, production] = await Promise.all([
      httpRequest(PREVIEW_URL, path, method, data),
      httpRequest(PRODUCTION_URL, path, method, data),
    ]);
    
    console.log(`\n📦 PREVIEW (${PREVIEW_URL})`);
    console.log(`   Status: ${preview.statusCode}`);
    if (preview.statusCode >= 300 && preview.statusCode < 400) {
      console.log(`   Redirect: ${preview.headers.location || 'N/A'}`);
    }
    console.log(`   Body: ${preview.body.slice(0, 150)}`);
    
    console.log(`\n🏭 PRODUCTION (${PRODUCTION_URL})`);
    console.log(`   Status: ${production.statusCode}`);
    if (production.statusCode >= 300 && production.statusCode < 400) {
      console.log(`   Redirect: ${production.headers.location || 'N/A'}`);
    }
    console.log(`   Body: ${production.body.slice(0, 150)}`);
    
    const match = preview.statusCode === production.statusCode;
    console.log(`\n${match ? '✅' : '❌'} Match: ${match ? 'IDENTICAL' : 'DIFFERENT'}`);
    
    return { path, match, preview, production };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { path, match: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 프리뷰 vs 프로덕션 완전 비교');
  console.log(`📍 Preview:    https://${PREVIEW_URL}`);
  console.log(`📍 Production: https://${PRODUCTION_URL}`);
  console.log(`⏰ Time:       ${new Date().toISOString()}`);
  
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', data: { email: 'test@test.com', password: 'test123' } },
    { path: '/api/auth/signup', method: 'POST', data: { email: 'new@test.com', password: 'test123' } },
    { path: '/api/login', method: 'POST', data: { email: 'test@test.com', password: 'test123' } },
    { path: '/', method: 'GET', data: null },
    { path: '/login', method: 'GET', data: null },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await compareEndpoint(endpoint.path, endpoint.method, endpoint.data);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  const matches = results.filter(r => r.match).length;
  const total = results.length;
  
  console.log(`\n🎯 Result: ${matches}/${total} endpoints match`);
  
  results.forEach(r => {
    console.log(`   ${r.match ? '✅' : '❌'} ${r.path}`);
  });
  
  const allMatch = matches === total;
  
  if (allMatch) {
    console.log('\n✅ 프리뷰와 프로덕션이 100% 동일합니다!');
  } else {
    console.log('\n❌ 프리뷰와 프로덕션이 다릅니다!');
    console.log('\n🔧 문제:');
    results.filter(r => !r.match).forEach(r => {
      console.log(`\n   ${r.path}:`);
      if (r.preview && r.production) {
        console.log(`      Preview:    ${r.preview.statusCode}`);
        console.log(`      Production: ${r.production.statusCode}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
