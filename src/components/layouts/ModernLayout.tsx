'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, X, LogOut, User, Bell, Search, Home, BookOpen, 
  Users, Calendar, MessageCircle, BarChart2, Settings,
  GraduationCap, Award, FileText, Clock
} from 'lucide-react';

interface MenuItem {
  id: string;
  href: string;
  icon: any;
  text: string;
  badge?: number;
}

interface ModernLayoutProps {
  children: React.ReactNode;
  role: string;
}

export default function ModernLayout({ children, role }: ModernLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // 역할별 메뉴 정의
  const getMenuItems = (): MenuItem[] => {
    switch (role.toUpperCase()) {
      case 'DIRECTOR':
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '홈' },
          { id: 'students', href: '/dashboard/students', icon: Users, text: '학생 관리' },
          { id: 'teachers', href: '/dashboard/teachers', icon: GraduationCap, text: '선생님 관리' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '수업 관리' },
          { id: 'attendance', href: '/dashboard/teacher-attendance', icon: Clock, text: '출석 현황' },
          { id: 'analytics', href: '/dashboard/analytics', icon: BarChart2, text: '통계' },
          { id: 'ai-chat', href: '/dashboard/ai-chat', icon: MessageCircle, text: 'AI 도우미' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      case 'TEACHER':
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '홈' },
          { id: 'students', href: '/dashboard/students', icon: Users, text: '내 학생들' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '수업' },
          { id: 'attendance', href: '/dashboard/teacher-attendance', icon: Clock, text: '출석 체크' },
          { id: 'homework', href: '/homework-check', icon: FileText, text: '숙제 확인' },
          { id: 'ai-chat', href: '/dashboard/ai-chat', icon: MessageCircle, text: 'AI 도우미' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      case 'STUDENT':
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '홈' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '내 수업' },
          { id: 'homework', href: '/homework-check', icon: FileText, text: '숙제 제출' },
          { id: 'attendance', href: '/dashboard/teacher-attendance', icon: Clock, text: '출석 기록' },
          { id: 'ai-chat', href: '/dashboard/ai-chat', icon: MessageCircle, text: 'AI 튜터', badge: 1 },
          { id: 'achievements', href: '/dashboard/achievements', icon: Award, text: '성취도' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      default:
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '홈' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
    }
  };

  const menuItems = getMenuItems();

  // 역할별 배경 그라데이션
  const getRoleGradient = () => {
    switch (role.toUpperCase()) {
      case 'DIRECTOR':
        return 'from-indigo-600 to-purple-600';
      case 'TEACHER':
        return 'from-blue-600 to-cyan-600';
      case 'STUDENT':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  // 역할별 텍스트
  const getRoleText = () => {
    switch (role.toUpperCase()) {
      case 'DIRECTOR':
        return '학원장';
      case 'TEACHER':
        return '선생님';
      case 'STUDENT':
        return '학생';
      default:
        return '사용자';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">SUPLACE Study</h1>
                  <p className="text-xs text-gray-500">{getRoleText()} 대시보드</p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Search className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">검색...</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Loading...'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                  {user?.name?.[0] || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium group-hover:text-blue-900">{item.text}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* User Info Card */}
          <div className="p-4 m-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center text-white font-bold shadow-lg`}>
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{getRoleText()}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>포인트</span>
                <span className="font-semibold text-blue-600">0 P</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={`absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl transition-transform duration-300 transform ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center text-white font-bold shadow-lg`}>
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600">{getRoleText()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      <span className="font-medium group-hover:text-blue-900">{item.text}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
