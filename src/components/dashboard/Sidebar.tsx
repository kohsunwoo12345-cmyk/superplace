"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  BarChart3,
  LayoutDashboard,
  Home,
  Settings,
  Users,
  Building2,
  CreditCard,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Bot,
  UserCheck,
  ClipboardList,
  TrendingUp,
  MessageSquare,
  Sparkles,
  LogOut,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// 역할별 네비게이션 정의
const navigationByRole = {
  SUPER_ADMIN: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "사용자 관리", href: "/dashboard/admin/users", icon: Users },
    { name: "학원 관리", href: "/dashboard/academies", icon: Building2 },
    { name: "요금제 관리", href: "/dashboard/plans", icon: CreditCard },
    { name: "AI 봇 관리", href: "/dashboard/admin/ai-bots-management", icon: Bot },
    { name: "AI 봇 할당", href: "/dashboard/admin/bot-assignment", icon: UserPlus },
    { name: "AI 봇", href: "/dashboard/ai-gems", icon: Sparkles },
    { name: "꾸메땅 AI 봇", href: "/dashboard/ai-bot-ggumettang", icon: BookOpen },
    { name: "문의 관리", href: "/dashboard/contacts", icon: MessageSquare },
    { name: "전체 통계", href: "/dashboard/stats", icon: TrendingUp },
    { name: "시스템 설정", href: "/dashboard/settings", icon: Settings },
  ],
  DIRECTOR: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "사용자 관리", href: "/dashboard/manage-users", icon: Users },
    { name: "선생님 관리", href: "/dashboard/teachers", icon: UserCheck },
    { name: "학생 관리", href: "/dashboard/students", icon: Users },
    { name: "수업 관리", href: "/dashboard/classes", icon: GraduationCap },
    { name: "학습 자료", href: "/dashboard/materials", icon: BookOpen },
    { name: "과제 관리", href: "/dashboard/assignments", icon: ClipboardList },
    { name: "출석 관리", href: "/dashboard/attendance", icon: Calendar },
    { name: "성적 관리", href: "/dashboard/grades", icon: BarChart3 },
    { name: "학원 통계", href: "/dashboard/analytics", icon: TrendingUp },
    { name: "문의 관리", href: "/dashboard/contacts", icon: MessageSquare },
    { name: "학원 설정", href: "/dashboard/academy-settings", icon: Building2 },
    { name: "내 설정", href: "/dashboard/settings", icon: Settings },
  ],
  TEACHER: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "학생 목록", href: "/dashboard/students", icon: Users },
    { name: "학습 자료", href: "/dashboard/materials", icon: BookOpen },
    { name: "과제 관리", href: "/dashboard/assignments", icon: ClipboardList },
    { name: "출석 체크", href: "/dashboard/attendance", icon: Calendar },
    { name: "성적 입력", href: "/dashboard/grades", icon: BarChart3 },
    { name: "내 설정", href: "/dashboard/settings", icon: Settings },
  ],
  STUDENT: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  ],
};

// 사이드바 콘텐츠 컴포넌트
function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [assignedBots, setAssignedBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role || "STUDENT";
  const baseNavigation = navigationByRole[userRole as keyof typeof navigationByRole] || navigationByRole.STUDENT;

  // 할당된 AI 봇 가져오기
  useEffect(() => {
    const fetchAssignedBots = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      if (userRole === "SUPER_ADMIN") {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/assigned-bots`);
        if (response.ok) {
          const data = await response.json();
          setAssignedBots(data.bots || []);
        }
      } catch (error) {
        console.error("Failed to fetch assigned bots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedBots();
  }, [session, userRole]);

  // AI 봇 메뉴 추가
  const botMenuItems = assignedBots.map((bot) => ({
    name: bot.name,
    href: `/dashboard/ai-gems/${bot.id}`,
    icon: Sparkles,
  }));

  // 봇 메뉴를 대시보드 다음에 삽입
  const navigation = [...baseNavigation];
  if (botMenuItems.length > 0 && userRole !== "SUPER_ADMIN") {
    navigation.splice(1, 0, ...botMenuItems);
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      SUPER_ADMIN: { text: "관리자", color: "bg-red-100 text-red-800" },
      DIRECTOR: { text: "학원장", color: "bg-blue-100 text-blue-800" },
      TEACHER: { text: "선생님", color: "bg-green-100 text-green-800" },
      STUDENT: { text: "학생", color: "bg-purple-100 text-purple-800" },
    };
    return badges[role] || badges.STUDENT;
  };

  const badge = getRoleBadge(userRole);

  return (
    <div className="flex flex-col h-full">
      {/* 로고 */}
      <div className="flex h-16 shrink-0 items-center px-4 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SUPER PLACE
          </span>
        </Link>
      </div>

      {/* 사용자 정보 */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {session?.user?.name?.[0] || "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name}
            </p>
            <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${badge.color}`}>
              {badge.text}
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className={cn("mr-3 h-5 w-5 flex-shrink-0")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 버튼들 */}
      <div className="p-4 border-t space-y-2">
        <Link
          href="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          onClick={onLinkClick}
        >
          <Home className="mr-3 h-5 w-5" />
          <span>홈으로</span>
        </Link>
        <button
          onClick={() => {
            onLinkClick?.();
            signOut({ callbackUrl: "/auth/signin" });
          }}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>로그아웃</span>
        </button>
        <p className="text-xs text-gray-500 text-center pt-2">
          © 2024 SUPER PLACE
        </p>
      </div>
    </div>
  );
}

// 메인 사이드바 컴포넌트
export default function DashboardSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 모바일 햄버거 버튼 (lg 미만에서만 표시) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-16 flex items-center px-4">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onLinkClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="ml-4 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SUPER PLACE
          </span>
        </div>
      </div>

      {/* 데스크톱 사이드바 (lg 이상에서만 표시) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
