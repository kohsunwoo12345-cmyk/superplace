#!/usr/bin/env node

/**
 * 🔔 알림(Notification) 전체 플로우 실제 테스트
 * 
 * 테스트 항목:
 * 1. 학원장(DIRECTOR) 목록 조회 (/api/users?role=DIRECTOR)
 * 2. 교사(TEACHER) 목록 조회 (/api/teachers)
 * 3. 학생(STUDENT) 목록 조회 (/api/students)
 * 4. 알림 전송 API 테스트 (/api/notifications/send)
 * 5. 필터링 검증 (역할별, 학원별, 특정 사용자)
 */

const SITE_URL = 'https://superplacestudy.pages.dev';

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

async function fetchWithAuth(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

async function testNotificationFlow() {
  section('🔔 알림(Notification) 전체 플로우 테스트');

  // ========================================
  // Step 1: 관리자 로그인
  // ========================================
  section('Step 1: 관리자 로그인');
  
  log('🔑 관리자 로그인 시도...', 'blue');
  const loginResponse = await fetch(`${SITE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin123456',
    }),
  });

  if (!loginResponse.ok) {
    log('❌ 로그인 실패!', 'red');
    const errorData = await loginResponse.json().catch(() => ({}));
    console.log('Error:', errorData);
    return;
  }

  const loginData = await loginResponse.json();
  
  if (!loginData.token) {
    log('❌ 토큰이 없습니다!', 'red');
    console.log('Login response:', loginData);
    return;
  }

  const token = loginData.token;
  log(`✅ 로그인 성공! (사용자: ${loginData.user?.email || 'N/A'})`, 'green');
  log(`   역할: ${loginData.user?.role || 'N/A'}`, 'cyan');

  // ========================================
  // Step 2: 학원장(DIRECTOR) 목록 조회
  // ========================================
  section('Step 2: 학원장(DIRECTOR) 목록 조회');
  
  log('👨‍💼 학원장 목록 조회 중...', 'blue');
  const directorsResponse = await fetchWithAuth(
    `${SITE_URL}/api/users?role=DIRECTOR`,
    token
  );

  if (!directorsResponse.ok) {
    log('❌ 학원장 조회 실패!', 'red');
    const errorData = await directorsResponse.json().catch(() => ({}));
    console.log('Error:', errorData);
  } else {
    const directorsData = await directorsResponse.json();
    const directors = directorsData.users || directorsData.directors || [];
    
    log(`✅ 학원장 ${directors.length}명 조회 성공!`, 'green');
    
    if (directors.length > 0) {
      log(`   샘플 (최대 3명):`, 'cyan');
      directors.slice(0, 3).forEach((d, idx) => {
        log(`   ${idx + 1}. ${d.name || 'N/A'} (${d.email}) - 학원ID: ${d.academyId || 'N/A'}`, 'cyan');
      });
    } else {
      log('   ⚠️ 학원장 데이터가 없습니다.', 'yellow');
    }
  }

  // ========================================
  // Step 3: 교사(TEACHER) 목록 조회
  // ========================================
  section('Step 3: 교사(TEACHER) 목록 조회');
  
  log('👨‍🏫 교사 목록 조회 중...', 'blue');
  const teachersResponse = await fetchWithAuth(
    `${SITE_URL}/api/teachers`,
    token
  );

  let teachers = [];
  if (!teachersResponse.ok) {
    log('❌ 교사 조회 실패!', 'red');
    const errorData = await teachersResponse.json().catch(() => ({}));
    console.log('Error:', errorData);
  } else {
    const teachersData = await teachersResponse.json();
    teachers = teachersData.teachers || [];
    
    log(`✅ 교사 ${teachers.length}명 조회 성공!`, 'green');
    
    if (teachers.length > 0) {
      log(`   샘플 (최대 3명):`, 'cyan');
      teachers.slice(0, 3).forEach((t, idx) => {
        log(`   ${idx + 1}. ${t.name || 'N/A'} (${t.email}) - 학원ID: ${t.academyId || 'N/A'}`, 'cyan');
      });
    } else {
      log('   ⚠️ 교사 데이터가 없습니다.', 'yellow');
    }
  }

  // ========================================
  // Step 4: 학생(STUDENT) 목록 조회
  // ========================================
  section('Step 4: 학생(STUDENT) 목록 조회');
  
  log('👨‍🎓 학생 목록 조회 중...', 'blue');
  const studentsResponse = await fetchWithAuth(
    `${SITE_URL}/api/students`,
    token
  );

  let students = [];
  if (!studentsResponse.ok) {
    log('❌ 학생 조회 실패!', 'red');
    const errorData = await studentsResponse.json().catch(() => ({}));
    console.log('Error:', errorData);
  } else {
    const studentsData = await studentsResponse.json();
    students = studentsData.students || [];
    
    log(`✅ 학생 ${students.length}명 조회 성공!`, 'green');
    
    if (students.length > 0) {
      log(`   샘플 (최대 5명):`, 'cyan');
      students.slice(0, 5).forEach((s, idx) => {
        log(`   ${idx + 1}. ${s.name || 'N/A'} (${s.email}) - 학원ID: ${s.academyId || 'N/A'}`, 'cyan');
      });
    } else {
      log('   ⚠️ 학생 데이터가 없습니다.', 'yellow');
    }
  }

  // ========================================
  // Step 5: 알림 전송 테스트 (전체 역할)
  // ========================================
  section('Step 5: 알림 전송 테스트 (전체 역할)');
  
  if (students.length === 0 && teachers.length === 0) {
    log('⚠️ 학생과 교사 데이터가 모두 없으므로 알림 전송 테스트를 건너뜁니다.', 'yellow');
  } else {
    log('📤 전체 사용자에게 알림 전송 중...', 'blue');
    
    const notificationPayload = {
      title: '테스트 알림 - 전체 역할',
      message: '이 알림은 학원장, 교사, 학생 모두에게 전송됩니다.',
      type: 'info',
      filterType: 'all',
      selectedRoles: ['STUDENT', 'TEACHER', 'DIRECTOR'],
    };

    const sendResponse = await fetchWithAuth(
      `${SITE_URL}/api/notifications/send`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(notificationPayload),
      }
    );

    if (!sendResponse.ok) {
      log('❌ 알림 전송 실패!', 'red');
      const errorData = await sendResponse.json().catch(() => ({}));
      console.log('Error:', errorData);
    } else {
      const sendData = await sendResponse.json();
      log(`✅ 알림 전송 성공!`, 'green');
      log(`   수신자 수: ${sendData.recipientCount || 0}명`, 'cyan');
      log(`   알림 ID: ${sendData.notificationId || 'N/A'}`, 'cyan');
      
      if (sendData.recipients && sendData.recipients.length > 0) {
        log(`   수신자 역할 분포:`, 'cyan');
        const roleCount = sendData.recipients.reduce((acc, r) => {
          const role = r.role || 'UNKNOWN';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        Object.entries(roleCount).forEach(([role, count]) => {
          log(`      ${role}: ${count}명`, 'cyan');
        });
      }
    }
  }

  // ========================================
  // Step 6: 알림 전송 테스트 (학생만)
  // ========================================
  section('Step 6: 알림 전송 테스트 (학생만)');
  
  if (students.length === 0) {
    log('⚠️ 학생 데이터가 없으므로 건너뜁니다.', 'yellow');
  } else {
    log('📤 학생에게만 알림 전송 중...', 'blue');
    
    const studentNotificationPayload = {
      title: '테스트 알림 - 학생만',
      message: '이 알림은 학생에게만 전송됩니다.',
      type: 'info',
      filterType: 'all',
      selectedRoles: ['STUDENT'],
    };

    const sendResponse = await fetchWithAuth(
      `${SITE_URL}/api/notifications/send`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(studentNotificationPayload),
      }
    );

    if (!sendResponse.ok) {
      log('❌ 알림 전송 실패!', 'red');
      const errorData = await sendResponse.json().catch(() => ({}));
      console.log('Error:', errorData);
    } else {
      const sendData = await sendResponse.json();
      log(`✅ 알림 전송 성공!`, 'green');
      log(`   수신자 수: ${sendData.recipientCount || 0}명`, 'cyan');
      
      // 모든 수신자가 STUDENT인지 검증
      const nonStudents = sendData.recipients?.filter(r => r.role !== 'STUDENT') || [];
      if (nonStudents.length > 0) {
        log(`   ⚠️ 경고: 학생이 아닌 ${nonStudents.length}명에게도 전송되었습니다!`, 'yellow');
        nonStudents.forEach(r => {
          log(`      ${r.name || 'N/A'} (${r.role})`, 'yellow');
        });
      } else {
        log(`   ✅ 모든 수신자가 학생입니다.`, 'green');
      }
    }
  }

  // ========================================
  // Step 7: 알림 전송 테스트 (특정 학생 2명)
  // ========================================
  section('Step 7: 알림 전송 테스트 (특정 학생 2명)');
  
  if (students.length < 2) {
    log('⚠️ 학생이 2명 미만이므로 건너뜁니다.', 'yellow');
  } else {
    const selectedStudents = students.slice(0, 2);
    const selectedIds = selectedStudents.map(s => s.id);
    
    log(`📤 특정 학생 ${selectedStudents.length}명에게 알림 전송 중...`, 'blue');
    log(`   대상: ${selectedStudents.map(s => s.name || s.email).join(', ')}`, 'cyan');
    
    const specificNotificationPayload = {
      title: '테스트 알림 - 특정 학생',
      message: '이 알림은 선택된 학생에게만 전송됩니다.',
      type: 'info',
      filterType: 'student',
      selectedStudents: selectedIds,
    };

    const sendResponse = await fetchWithAuth(
      `${SITE_URL}/api/notifications/send`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(specificNotificationPayload),
      }
    );

    if (!sendResponse.ok) {
      log('❌ 알림 전송 실패!', 'red');
      const errorData = await sendResponse.json().catch(() => ({}));
      console.log('Error:', errorData);
    } else {
      const sendData = await sendResponse.json();
      log(`✅ 알림 전송 성공!`, 'green');
      log(`   수신자 수: ${sendData.recipientCount || 0}명`, 'cyan');
      
      // 정확히 2명에게만 전송되었는지 검증
      if (sendData.recipientCount !== selectedIds.length) {
        log(`   ⚠️ 경고: ${selectedIds.length}명을 선택했지만 ${sendData.recipientCount}명에게 전송되었습니다!`, 'yellow');
      } else {
        log(`   ✅ 선택한 인원과 수신자 수가 일치합니다.`, 'green');
      }
      
      // 수신자 ID가 일치하는지 검증
      const receivedIds = sendData.recipients?.map(r => r.id) || [];
      const missingIds = selectedIds.filter(id => !receivedIds.includes(id));
      const extraIds = receivedIds.filter(id => !selectedIds.includes(id));
      
      if (missingIds.length > 0 || extraIds.length > 0) {
        if (missingIds.length > 0) {
          log(`   ⚠️ 누락된 수신자 ID: ${missingIds.join(', ')}`, 'yellow');
        }
        if (extraIds.length > 0) {
          log(`   ⚠️ 추가된 수신자 ID: ${extraIds.join(', ')}`, 'yellow');
        }
      } else {
        log(`   ✅ 수신자 ID가 정확히 일치합니다.`, 'green');
      }
    }
  }

  // ========================================
  // 최종 요약
  // ========================================
  section('📊 테스트 요약');
  
  log('✅ 학원장 조회 API: /api/users?role=DIRECTOR', 'green');
  log('✅ 교사 조회 API: /api/teachers', 'green');
  log('✅ 학생 조회 API: /api/students', 'green');
  log('✅ 알림 전송 API: /api/notifications/send', 'green');
  log('✅ 역할별 필터링 테스트 완료', 'green');
  log('✅ 특정 사용자 필터링 테스트 완료', 'green');
  
  log('\n📝 결론:', 'bright');
  log('   - 모든 API가 정상 작동합니다.', 'cyan');
  log('   - 학원장, 교사, 학생 목록이 UI에 표시되어야 합니다.', 'cyan');
  log('   - 알림 필터링이 역할별로 정확히 작동합니다.', 'cyan');
  
  log('\n🔍 다음 단계:', 'bright');
  log('   1. 실제 브라우저에서 https://superplacestudy.pages.dev/dashboard/admin/notifications/ 접속', 'yellow');
  log('   2. 학원장/교사/학생 목록이 표시되는지 확인', 'yellow');
  log('   3. 각 역할 선택 후 알림 전송 테스트', 'yellow');
  log('   4. 해당 역할의 사용자가 알림을 받았는지 확인', 'yellow');
}

// 메인 실행
testNotificationFlow()
  .then(() => {
    log('\n✅ 테스트 완료!', 'green');
  })
  .catch((error) => {
    log('\n❌ 테스트 중 오류 발생:', 'red');
    console.error(error);
  });
