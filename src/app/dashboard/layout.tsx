'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, X, LogOut, User, LayoutDashboard, Users, GraduationCap,
  BookOpen, ClipboardCheck, Bot, BarChart3, Settings, 
  School, MessageSquare, Wrench, UserCog, GripVertical
} from 'lucide-react';

interface MenuItem {
  id: string;
  href: string;
  icon: string;
  text: string;
  adminOnly?: boolean;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', href: '/dashboard', icon: 'LayoutDashboard', text: '대시보드' },
  { id: 'admin-users', href: '/dashboard/admin/users', icon: 'UserCog', text: '사용자 관리', adminOnly: true },
  { id: 'admin-academies', href: '/dashboard/admin/academies', icon: 'School', text: '학원 관리', adminOnly: true },
  { id: 'admin-ai-bots', href: '/dashboard/admin/ai-bots', icon: 'Bot', text: 'AI 봇 관리', adminOnly: true },
  { id: 'admin-inquiries', href: '/dashboard/admin/inquiries', icon: 'MessageSquare', text: '문의 관리', adminOnly: true },
  { id: 'admin-system', href: '/dashboard/admin/system', icon: 'Wrench', text: '시스템 설정', adminOnly: true },
  { id: 'students', href: '/dashboard/students', icon: 'Users', text: '학생 관리' },
  { id: 'teachers', href: '/dashboard/teachers', icon: 'GraduationCap', text: '선생님 관리' },
  { id: 'classes', href: '/dashboard/classes', icon: 'BookOpen', text: '수업 관리' },
  { id: 'attendance', href: '/dashboard/teacher-attendance', icon: 'ClipboardCheck', text: '출석 관리' },
  { id: 'ai-chat', href: '/dashboard/ai-chat', icon: 'Bot', text: 'AI 챗봇' },
  { id: 'analytics', href: '/dashboard/analytics', icon: 'BarChart3', text: '통계 분석' },
  { id: 'settings', href: '/dashboard/settings', icon: 'Settings', text: '설정' },
];

const iconMap: { [key: string]: any } = {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  Bot, BarChart3, Settings, School, MessageSquare, Wrench, UserCog
};

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);

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

    // Load saved menu order
    const savedOrder = localStorage.getItem('menuOrder');
    if (savedOrder) {
      try {
        setMenuItems(JSON.parse(savedOrder));
      } catch (error) {
        console.error('Failed to parse menu order:', error);
      }
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, item: MenuItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: MenuItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...menuItems];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setMenuItems(newItems);
    localStorage.setItem('menuOrder', JSON.stringify(newItems));
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

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

  const NavLink = ({ item, draggable = false }: { item: MenuItem; draggable?: boolean }) => {
    const IconComponent = iconMap[item.icon];
    
    return (
      <a
        href={item.href}
        draggable={draggable}
        onDragStart={(e) => draggable && handleDragStart(e, item)}
        onDragOver={(e) => draggable && handleDragOver(e)}
        onDrop={(e) => draggable && handleDrop(e, item)}
        onDragEnd={handleDragEnd}
        onClick={closeMobileMenu}
        className={`flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors touch-target group ${
          draggable ? 'cursor-move' : ''
        }`}
      >
        {draggable && (
          <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
        )}
        {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
        <span className="text-sm font-medium truncate">{item.text}</span>
      </a>
    );
  };

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);
  const adminItems = visibleMenuItems.filter(item => item.adminOnly);
  const generalItems = visibleMenuItems.filter(item => !item.adminOnly);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 반응형 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="responsive-container">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* 로고 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label="메뉴 열기"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                SUPLACE Study
              </h1>
            </div>

            {/* 사용자 정보 - 데스크톱 */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
                <User className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs text-gray-600 max-w-[150px] truncate">
                  {user?.email || 'Loading...'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors touch-target text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
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
                <LogOut className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - 데스크톱 (축소됨) */}
        <aside className="hidden lg:block w-52 bg-white shadow-lg min-h-[calc(100vh-4rem)] sticky top-14">
          <nav className="p-3 space-y-0.5">
            {/* Admin Menu Section */}
            {isAdmin && adminItems.length > 0 && (
              <div className="pb-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  관리자
                </div>
                <div className="space-y-0.5">
                  {adminItems.map(item => (
                    <NavLink key={item.id} item={item} draggable={true} />
                  ))}
                </div>
                <div className="my-2 border-t border-gray-200"></div>
              </div>
            )}

            {/* General Menu */}
            <div className="space-y-0.5">
              {generalItems.map(item => (
                <NavLink key={item.id} item={item} draggable={true} />
              ))}
            </div>
          </nav>
          
          {/* 드래그 가이드 */}
          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              <span>드래그하여 순서 변경</span>
            </div>
          </div>
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
            className={`absolute top-0 left-0 w-72 max-w-[85vw] h-full bg-white shadow-2xl transition-transform duration-300 transform ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } overflow-y-auto`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 truncate max-w-[180px]">
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
            <nav className="p-3 space-y-0.5">
              {/* Admin Menu Section */}
              {isAdmin && adminItems.length > 0 && (
                <div className="pb-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    관리자
                  </div>
                  <div className="space-y-0.5">
                    {adminItems.map(item => (
                      <NavLink key={item.id} item={item} draggable={false} />
                    ))}
                  </div>
                  <div className="my-2 border-t border-gray-200"></div>
                </div>
              )}

              {/* General Menu */}
              <div className="space-y-0.5">
                {generalItems.map(item => (
                  <NavLink key={item.id} item={item} draggable={false} />
                ))}
              </div>
            </nav>
          </aside>
        </div>

        {/* Main Content - 반응형 패딩 */}
        <main className="flex-1 responsive-padding min-h-[calc(100vh-4rem)]">
          <div className="responsive-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
