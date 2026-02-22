'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [logs, setLogs] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    // 페이지 로드 시 localStorage 상태 확인
    addLog('=== 페이지 로드 ===');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    addLog(`Token: ${token ? '존재함' : '없음'}`);
    addLog(`User: ${userStr ? '존재함' : '없음'}`);
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUserInfo(userData);
        addLog(`User Data: ${JSON.stringify(userData, null, 2)}`);
      } catch (e: any) {
        addLog(`User Parse Error: ${e.message}`);
      }
    }
  }, []);

  const handleLogin = async () => {
    setLogs([]);
    addLog('=== 로그인 시작 ===');
    addLog(`Email: ${email}`);
    addLog(`Password: ${password.replace(/./g, '*')}`);

    try {
      addLog('API 호출 중...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      addLog(`Response Status: ${response.status}`);
      const data = await response.json();
      addLog(`Response Data: ${JSON.stringify(data, null, 2)}`);

      if (!response.ok || !data.success) {
        addLog(`❌ 로그인 실패: ${data.message}`);
        return;
      }

      addLog('✅ 로그인 성공!');
      addLog(`Token: ${data.token}`);
      addLog(`User: ${JSON.stringify(data.user, null, 2)}`);

      // localStorage에 저장
      addLog('localStorage에 저장 중...');
      localStorage.setItem('token', data.token);
      
      const userDataToStore = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        academy_id: data.user.academyId,
        academyName: data.user.academyName,
        academyCode: data.user.academyCode,
        studentCode: data.user.studentCode,
        className: data.user.className,
      };
      
      localStorage.setItem('user', JSON.stringify(userDataToStore));
      addLog('✅ localStorage 저장 완료');

      // 저장된 데이터 확인
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      addLog(`저장된 Token: ${savedToken}`);
      addLog(`저장된 User: ${savedUser}`);

      setUserInfo(userDataToStore);

      // 3초 후 대시보드로 이동
      addLog('3초 후 대시보드로 이동합니다...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      addLog(`💥 오류 발생: ${err.message}`);
      addLog(`Stack: ${err.stack}`);
    }
  };

  const handleCheckStorage = () => {
    addLog('=== localStorage 확인 ===');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    addLog(`Token: ${token || '없음'}`);
    addLog(`User: ${userStr || '없음'}`);
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        addLog(`Parsed User: ${JSON.stringify(userData, null, 2)}`);
      } catch (e: any) {
        addLog(`Parse Error: ${e.message}`);
      }
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserInfo(null);
    addLog('✅ localStorage 초기화 완료');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">로그인 디버그 페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 로그인 폼 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">로그인 테스트</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="이메일 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="비밀번호 입력"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  로그인 테스트
                </button>
                
                <button
                  onClick={handleCheckStorage}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  localStorage 확인
                </button>
                
                <button
                  onClick={handleClearStorage}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  localStorage 초기화
                </button>

                <button
                  onClick={handleGoToDashboard}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  대시보드로 이동
                </button>
              </div>
            </div>

            {/* 현재 사용자 정보 */}
            {userInfo && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold mb-2">현재 사용자 정보</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* 로그 출력 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">실행 로그</h2>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-md h-[600px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">로그가 없습니다. 로그인을 시도하세요.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 whitespace-pre-wrap break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 테스트 계정 정보 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4">테스트 계정 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>학원장:</strong>
              <div>이메일: director@test.com</div>
              <div>비밀번호: director123</div>
            </div>
            <div>
              <strong>교사:</strong>
              <div>이메일: teacher@test.com</div>
              <div>비밀번호: teacher123</div>
            </div>
            <div>
              <strong>학생:</strong>
              <div>이메일: student@test.com</div>
              <div>비밀번호: student123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
