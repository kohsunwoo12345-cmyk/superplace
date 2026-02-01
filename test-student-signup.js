async function testStudentSignup() {
  const testData = {
    email: "teststudent2@example.com",
    password: "testpassword123",
    name: "테스트학생2",
    phone: "010-1234-5679",
    role: "STUDENT",
    academyCode: "WP2H3M37"
  };

  console.log('\n=== 학생 회원가입 테스트 ===\n');
  console.log('테스트 데이터:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3006/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('\n응답 상태:', response.status);
    
    const result = await response.json();
    console.log('응답 데이터:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('오류:', error.message);
  }
}

testStudentSignup();
