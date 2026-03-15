'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, X, LogOut, User, Bell, Search, Home, BookOpen, 
  Users, Calendar, MessageCircle, BarChart2, Settings,
  GraduationCap, Award, FileText, Clock, ExternalLink,
  DollarSign, CreditCard, Presentation, ClipboardList, Sparkles, Bot,
  ShoppingCart, Zap, Shield, Layout, MessageSquare, Download, Database, UserPlus, CheckCircle, Phone, Brain
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';

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
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 현재 활성 메뉴 판별
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // 포인트 조회
        fetchUserPoints(userData.id);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // 사용자 포인트 조회
  const fetchUserPoints = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/points', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User points loaded:', data.points);
        setUserPoints(data.points || 0);
      } else {
        console.error('❌ Failed to fetch user points:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching user points:', error);
    }
  };

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
    const roleUpper = role.toUpperCase();
    console.log('🎯 ModernLayout - role:', role);
    console.log('🎯 ModernLayout - roleUpper:', roleUpper);
    console.log('🎯 ModernLayout - Is Admin?', roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN');
    
    // 관리자 메뉴 (ADMIN, SUPER_ADMIN) - 관리자 전용 + 일반 메뉴
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
      console.log('✅ ModernLayout - Loading ADMIN menu (29 items)');
      return [
        { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
        // 관리자 전용 메뉴
        { id: 'admin-users', href: '/dashboard/admin/users', icon: Users, text: '사용자 관리' },
        { id: 'admin-academies', href: '/dashboard/admin/academies', icon: GraduationCap, text: '학원 관리' },
        { id: 'admin-export', href: '/dashboard/admin/export-by-plan', icon: Download, text: '회원 DB 추출' },
        { id: 'admin-director-limitations', href: '/dashboard/admin/director-limitations', icon: Shield, text: '학원장 제한 설정' },
        { id: 'admin-notifications', href: '/dashboard/admin/notifications', icon: Bell, text: '알림 관리' },
        { id: 'admin-sms', href: '/dashboard/message-dashboard', icon: MessageCircle, text: '문자 발송' },
        { id: 'admin-sender-number-approval', href: '/dashboard/admin/sender-number-approval', icon: Phone, text: '발신번호 승인' },
        { id: 'admin-kakao-channel', href: '/dashboard/kakao-channel', icon: MessageCircle, text: '카카오 채널' },
        { id: 'admin-point-approvals', href: '/dashboard/admin/point-approvals', icon: CreditCard, text: '포인트 충전 승인' },
        { id: 'admin-revenue', href: '/dashboard/admin/revenue', icon: DollarSign, text: '매출 관리' },
        { id: 'admin-pricing', href: '/dashboard/admin/pricing', icon: CreditCard, text: '요금제 관리' },
        { id: 'admin-seminars', href: '/dashboard/admin/seminars', icon: Presentation, text: '교육 세미나' },
        { id: 'admin-logs', href: '/dashboard/admin/logs', icon: ClipboardList, text: '상세 기록' },
        { id: 'admin-ai-bots', href: '/dashboard/admin/ai-bots', icon: MessageCircle, text: 'AI 봇 생성' },
        { id: 'admin-homework-grading', href: '/dashboard/admin/homework-grading-config', icon: Brain, text: '숙제 검사 AI' },
        { id: 'admin-bot-management', href: '/dashboard/admin/bot-management', icon: Bot, text: '통합 AI 봇 관리' },
        { id: 'admin-bot-assign', href: '/dashboard/admin/ai-bots/assign', icon: UserPlus, text: 'AI 봇 할당하기' },
        { id: 'admin-store', href: '/dashboard/admin/store-management', icon: ShoppingCart, text: 'AI쇼핑몰 제품 추가' },
        { id: 'admin-bot-shop-approvals', href: '/dashboard/admin/bot-shop-approvals', icon: CheckCircle, text: '쇼핑몰 승인 관리' },
        { id: 'admin-landing-pages', href: '/dashboard/admin/landing-pages', icon: Layout, text: '랜딩페이지' },
        { id: 'admin-ppt-create', href: '/dashboard/ppt-create', icon: Presentation, text: 'PPT 제작' },
        { id: 'admin-inquiries', href: '/dashboard/admin/inquiries', icon: FileText, text: '문의 관리' },
        { id: 'admin-system', href: '/dashboard/admin/system', icon: Settings, text: '시스템 설정' },
        // 일반 메뉴
        { id: 'students', href: '/dashboard/students', icon: Users, text: '학생 관리' },
        { id: 'teachers', href: '/dashboard/teacher-management', icon: GraduationCap, text: '교사 관리' },
        { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '수업 관리' },
        { id: 'attendance', href: '/dashboard/attendance-statistics', icon: Clock, text: '출석 관리' },
        { id: 'homework', href: '/dashboard/homework/teacher', icon: FileText, text: '숙제 관리' },
        { id: 'homework-results', href: '/dashboard/homework/results', icon: Award, text: '숙제 검사 결과' },
        { id: 'ai-chat', href: '/ai-chat', icon: MessageCircle, text: 'AI 챗봇' },
        { id: 'gemini-chat', href: '/dashboard/gemini-chat', icon: Sparkles, text: 'Gemini 채팅' },
        { id: 'analytics', href: '/dashboard/analytics', icon: BarChart2, text: '통계 분석' },
        { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
      ];
    }
    
    console.log('🔄 ModernLayout - Checking role-based menu...');
    switch (roleUpper) {
      case 'DIRECTOR':
        console.log('✅ ModernLayout - Loading DIRECTOR menu');
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
          { id: 'seminars', href: '/dashboard/seminars', icon: Presentation, text: '무료 세미나 보기' },
          { id: 'students', href: '/dashboard/students', icon: Users, text: '학생 관리' },
          { id: 'teachers', href: '/dashboard/teacher-management', icon: GraduationCap, text: '교사 관리' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '수업 관리' },
          { id: 'attendance', href: '/dashboard/attendance-statistics', icon: Clock, text: '출석 현황' },
          { id: 'homework', href: '/dashboard/homework/teacher', icon: FileText, text: '숙제 관리' },
          { id: 'homework-results', href: '/dashboard/homework/results', icon: Award, text: '숙제 검사 결과' },
          { id: 'landing-pages', href: '/dashboard/admin/landing-pages', icon: Layout, text: '랜딩페이지' },
          { id: 'kakao-channel', href: '/dashboard/kakao-channel', icon: MessageCircle, text: '카카오 채널' },
          { id: 'point-charge', href: '/dashboard/point-charge', icon: CreditCard, text: '포인트 충전' },
          { id: 'ai-bots', href: '/dashboard/admin/ai-bots/assign', icon: Bot, text: 'AI 봇 할당' },
          { id: 'sms', href: '/dashboard/message-dashboard', icon: MessageSquare, text: '문자 발송' },
          { id: 'analytics', href: '/dashboard/analytics', icon: BarChart2, text: '통계' },
          { id: 'ai-chat', href: '/ai-chat', icon: MessageCircle, text: 'AI 도우미' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      case 'TEACHER':
        console.log('✅ ModernLayout - Loading TEACHER menu');
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
          { id: 'students', href: '/dashboard/students', icon: Users, text: '내 학생들' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '수업' },
          { id: 'attendance', href: '/dashboard/attendance-statistics', icon: Clock, text: '출석 체크' },
          { id: 'homework', href: '/dashboard/homework/teacher', icon: FileText, text: '숙제 관리' },
          { id: 'homework-results', href: '/dashboard/homework/results', icon: Award, text: '숙제 검사 결과' },
          { id: 'ai-chat', href: '/ai-chat', icon: MessageCircle, text: 'AI 도우미' },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      case 'STUDENT':
        console.log('✅ ModernLayout - Loading STUDENT menu');
        return [
          { id: 'home', href: '/dashboard', icon: Home, text: '대시보드' },
          { id: 'attendance-verify', href: '/attendance-verify', icon: Clock, text: '출석하기' },
          { id: 'homework-submit', href: '/homework-check', icon: FileText, text: '숙제 제출' },
          { id: 'homework', href: '/dashboard/homework/student', icon: Award, text: '오늘의 숙제' },
          { id: 'attendance-record', href: '/dashboard/attendance-statistics', icon: Calendar, text: '출석 기록' },
          { id: 'classes', href: '/dashboard/classes', icon: BookOpen, text: '내 수업' },
          { id: 'ai-chat', href: '/ai-chat', icon: MessageCircle, text: 'AI 튜터', badge: 1 },
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
      default:
        console.log('⚠️ ModernLayout - Unknown role, loading default menu');
        return [
          { id: 'settings', href: '/dashboard/settings', icon: Settings, text: '설정' },
        ];
    }
  };

  const menuItems = getMenuItems();
  console.log('📋 ModernLayout - Total menu items:', menuItems.length);
  console.log('📋 ModernLayout - Menu items:', menuItems.map(m => m.text).join(', '));

  // 역할별 배경 그라데이션
  const getRoleGradient = () => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
      return 'from-red-600 to-orange-600';
    }
    switch (roleUpper) {
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
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
      return '시스템 관리자';
    }
    switch (roleUpper) {
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
            {/* Left: Logo, Mobile Menu, Quick Actions */}
            <div className="flex items-center gap-3 flex-1">
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
                <img 
                  src="/logo-suplace.png" 
                  alt="SUPLACE Study" 
                  className="h-10 w-10 object-contain"
                />
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-gray-900">SUPLACE Study</h1>
                  <p className="text-xs text-gray-500">{getRoleText()} 대시보드</p>
                </div>
              </div>

              {/* AI 쇼핑몰 & 홈페이지 버튼 (왼쪽) */}
              <div className="flex items-center gap-2 ml-4">
                {/* AI 쇼핑몰 버튼 - 관리자/학원장만 */}
                {(role.toUpperCase() === 'ADMIN' || 
                  role.toUpperCase() === 'SUPER_ADMIN' || 
                  role.toUpperCase() === 'DIRECTOR') && (
                  <a
                    href="/store"
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-semibold">AI 쇼핑몰</span>
                    <Zap className="w-3 h-3 animate-bounce" />
                  </a>
                )}

                {/* Homepage Button - 학원장, 선생님, 관리자만 */}
                {(role.toUpperCase() === 'ADMIN' || 
                  role.toUpperCase() === 'SUPER_ADMIN' || 
                  role.toUpperCase() === 'DIRECTOR' || 
                  role.toUpperCase() === 'TEACHER') && (
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">홈페이지</span>
                  </a>
                )}
              </div>

              {/* Search Bar (넓게 확장) */}
              <div className="flex items-center flex-1 max-w-2xl mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="학생, 교사, 수업 검색..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right: Notifications & User Menu */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden lg:block text-right">
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
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-gray-600 group-hover:text-blue-600'
                    }`} />
                    <span className={`font-medium ${
                      isActive(item.href)
                        ? 'text-white'
                        : 'group-hover:text-blue-900'
                    }`}>{item.text}</span>
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
                <span className="font-semibold text-blue-600">{userPoints.toLocaleString()} P</span>
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
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                      <span className={`font-medium ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'group-hover:text-blue-900'
                      }`}>{item.text}</span>
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
