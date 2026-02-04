'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAdmin(userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN');
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">SuperPlace</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email || 'Loading...'}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            <a
              href="/dashboard"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              📊 대시보드
            </a>
            
            {/* Admin Menu Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    관리자 메뉴
                  </div>
                </div>
                <a
                  href="/dashboard/admin/users"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                >
                  👥 사용자 관리
                </a>
                <a
                  href="/dashboard/admin/academies"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                >
                  🎓 학원 관리
                </a>
                <a
                  href="/dashboard/admin/ai-bots"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                >
                  🤖 AI 봇 관리
                </a>
                <a
                  href="/dashboard/admin/inquiries"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                >
                  📝 문의 관리
                </a>
                <a
                  href="/dashboard/admin/system"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                >
                  ⚙️ 시스템 설정
                </a>
                <div className="pt-2 pb-2">
                  <div className="border-t border-gray-200"></div>
                </div>
              </>
            )}

            {/* General Menu */}
            <a
              href="/dashboard/students"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              👨‍🎓 학생 관리
            </a>
            <a
              href="/dashboard/teachers"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              👨‍🏫 선생님 관리
            </a>
            <a
              href="/dashboard/classes"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              📚 수업 관리
            </a>
            <a
              href="/dashboard/ai-chat"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              🤖 AI 챗봇
            </a>
            <a
              href="/dashboard/analytics"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              📈 통계 분석
            </a>
            <a
              href="/dashboard/settings"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
            >
              ⚙️ 설정
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
