'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        const role = userData.role?.toUpperCase();
        const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';
        setIsAdmin(isAdminRole);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // 클라이언트 사이드에서만 렌더링
  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const NavLink = ({ href, icon, text, onClick }: { href: string; icon: string; text: string; onClick?: () => void }) => (
    <a
      href={href}
      onClick={(e) => {
        closeMobileMenu();
        onClick?.();
      }}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors touch-target"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm md:text-base font-medium">{text}</span>
    </a>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 반응형 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="responsive-container">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* 로고 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label="메뉴 열기"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                SuperPlace
              </h1>
            </div>

            {/* 사용자 정보 - 데스크톱 */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 max-w-[200px] truncate">
                  {user?.email || 'Loading...'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors touch-target"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">로그아웃</span>
              </button>
            </div>

            {/* 사용자 정보 - 모바일 */}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label="로그아웃"
              >
                <LogOut className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - 데스크톱 */}
        <aside className="hidden lg:block w-64 xl:w-72 bg-white shadow-lg min-h-[calc(100vh-5rem)] sticky top-20">
          <nav className="p-4 space-y-1">
            <NavLink href="/dashboard" icon="📊" text="대시보드" />

            {/* Admin Menu Section */}
            {isAdmin && (
              <div className="pt-4">
                <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  관리자 메뉴
                </div>
                <div className="space-y-1">
                  <NavLink href="/dashboard/admin/users" icon="👥" text="사용자 관리" />
                  <NavLink href="/dashboard/admin/academies" icon="🎓" text="학원 관리" />
                  <NavLink href="/dashboard/admin/ai-bots" icon="🤖" text="AI 봇 관리" />
                  <NavLink href="/dashboard/admin/inquiries" icon="📝" text="문의 관리" />
                  <NavLink href="/dashboard/admin/system" icon="⚙️" text="시스템 설정" />
                </div>
                <div className="my-4 border-t border-gray-200"></div>
              </div>
            )}

            {/* General Menu */}
            <div className="space-y-1">
              <NavLink href="/dashboard/students" icon="👨‍🎓" text="학생 관리" />
              <NavLink href="/dashboard/teachers" icon="👨‍🏫" text="선생님 관리" />
              <NavLink href="/dashboard/classes" icon="📚" text="수업 관리" />
              <NavLink href="/dashboard/teacher-attendance" icon="📋" text="출석 관리" />
              <NavLink href="/dashboard/ai-chat" icon="🤖" text="AI 챗봇" />
              <NavLink href="/dashboard/analytics" icon="📈" text="통계 분석" />
              <NavLink href="/dashboard/settings" icon="⚙️" text="설정" />
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar - 슬라이드 메뉴 */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeMobileMenu}
          />
          
          {/* Sidebar */}
          <aside
            className={`absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl transition-transform duration-300 transform ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 hover:bg-gray-100 rounded-lg touch-target"
                aria-label="메뉴 닫기"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="p-4 space-y-1">
              <NavLink href="/dashboard" icon="📊" text="대시보드" />

              {/* Admin Menu Section */}
              {isAdmin && (
                <div className="pt-4">
                  <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    관리자 메뉴
                  </div>
                  <div className="space-y-1">
                    <NavLink href="/dashboard/admin/users" icon="👥" text="사용자 관리" />
                    <NavLink href="/dashboard/admin/academies" icon="🎓" text="학원 관리" />
                    <NavLink href="/dashboard/admin/ai-bots" icon="🤖" text="AI 봇 관리" />
                    <NavLink href="/dashboard/admin/inquiries" icon="📝" text="문의 관리" />
                    <NavLink href="/dashboard/admin/system" icon="⚙️" text="시스템 설정" />
                  </div>
                  <div className="my-4 border-t border-gray-200"></div>
                </div>
              )}

              {/* General Menu */}
              <div className="space-y-1">
                <NavLink href="/dashboard/students" icon="👨‍🎓" text="학생 관리" />
                <NavLink href="/dashboard/teachers" icon="👨‍🏫" text="선생님 관리" />
                <NavLink href="/dashboard/classes" icon="📚" text="수업 관리" />
                <NavLink href="/dashboard/teacher-attendance" icon="📋" text="출석 관리" />
                <NavLink href="/dashboard/ai-chat" icon="🤖" text="AI 챗봇" />
                <NavLink href="/dashboard/analytics" icon="📈" text="통계 분석" />
                <NavLink href="/dashboard/settings" icon="⚙️" text="설정" />
              </div>
            </nav>
          </aside>
        </div>

        {/* Main Content - 반응형 패딩 */}
        <main className="flex-1 responsive-padding min-h-[calc(100vh-5rem)]">
          <div className="responsive-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
