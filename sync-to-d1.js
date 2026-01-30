#!/usr/bin/env node

/**
 * D1 동기화 스크립트
 * 
 * 사용법:
 *   node sync-to-d1.js
 */

const https = require('https');

const API_BASE = 'https://superplace-study.vercel.app';

console.log('🚀 D1 동기화 스크립트 시작...\n');

// 1. D1 연결 테스트
console.log('1️⃣ D1 연결 테스트...');
https.get(`${API_BASE}/api/test-d1-connection`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ D1 연결 성공!\n');
        
        // 2. D1 사용자 확인
        console.log('2️⃣ D1 사용자 확인...');
        https.get(`${API_BASE}/api/check-d1-users`, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            try {
              const result2 = JSON.parse(data2);
              console.log(`📊 D1 사용자: ${result2.summary?.totalUsers || 0}명\n`);
              
              if (result2.summary?.totalUsers === 0) {
                console.log('⚠️  D1이 비어있습니다.');
                console.log('💡 해결: 관리자 페이지에서 동기화하세요:');
                console.log('   https://superplace-study.vercel.app/dashboard/admin/users\n');
              } else {
                console.log('✅ D1에 사용자가 있습니다!');
                console.log('   사용자 목록:', result2.users?.slice(0, 3).map(u => u.email).join(', '));
              }
            } catch (e) {
              console.error('❌ 오류:', e.message);
            }
          });
        });
      } else {
        console.error('❌ D1 연결 실패:', result.error);
      }
    } catch (e) {
      console.error('❌ 파싱 오류:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('❌ 네트워크 오류:', e.message);
});
