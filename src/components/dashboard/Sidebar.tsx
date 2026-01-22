"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

// 역할별 네비게이션 정의
const navigationByRole = {
  SUPER_ADMIN: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "사용자 관리", href: "/dashboard/admin/users", icon: Users },
    { name: "학원 관리", href: "/dashboard/academies", icon: Building2 },
    { name: "요금제 관리", href: "/dashboard/plans", icon: CreditCard },
    { name: "AI 챗봇", href: "/dashboard/ai-chatbot", icon: Bot },
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
    { name: "AI 챗봇", href: "/dashboard/ai-chatbot", icon: Bot },
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
    { name: "AI 챗봇", href: "/dashboard/ai-chatbot", icon: Bot },
    { name: "출석 체크", href: "/dashboard/attendance", icon: Calendar },
    { name: "성적 입력", href: "/dashboard/grades", icon: BarChart3 },
    { name: "내 설정", href: "/dashboard/settings", icon: Settings },
  ],
  STUDENT: [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI 챗봇", href: "/dashboard/ai-chatbot", icon: Bot },
  ],
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // 사용자 역할에 따른 네비게이션 선택
  const userRole = session?.user?.role || "STUDENT";
  const navigation = navigationByRole[userRole as keyof typeof navigationByRole] || navigationByRole.STUDENT;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 hidden" id="mobile-sidebar-backdrop" />

      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold">SUPER PLACE</span>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">
                {userRole === "SUPER_ADMIN" && "시스템 관리자"}
                {userRole === "DIRECTOR" && "학원장"}
                {userRole === "TEACHER" && "선생님"}
                {userRole === "STUDENT" && "학생"}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-white" : "text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 border-t p-4 space-y-3">
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
            >
              <Home className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500" />
              홈으로 나가기
            </Link>
            <div className="text-xs text-gray-500 px-3">
              © 2024 SUPER PLACE
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
