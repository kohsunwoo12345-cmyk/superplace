// 로컬 API 코드 직접 테스트
const users = [
  {
    id: 1,
    email: "admin@superplace.com",
    password: "admin1234",
    name: "관리자",
    role: "SUPER_ADMIN",
    academy_id: 1,
  },
];

const email = "admin@superplace.com";
const password = "admin1234";

console.log('🔍 Looking for user:', email);

const user = users.find(
  (u) => u.email === email && u.password === password
);

if (user) {
  console.log('✅ User found:', user);
  
  const token = `${user.id}.${user.email}.${user.role}.${Date.now()}`;
  console.log('🎫 Token generated:', token);
  
  const response = {
    success: true,
    message: "로그인 성공",
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        academy_id: user.academy_id,
      },
    },
  };
  
  console.log('📦 Response:', JSON.stringify(response, null, 2));
} else {
  console.log('❌ User not found');
}
