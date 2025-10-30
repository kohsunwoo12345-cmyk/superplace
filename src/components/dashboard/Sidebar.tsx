"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  MapPin,
  Instagram,
  Youtube,
  Zap,
  ShoppingBag,
  CreditCard,
  Settings,
  Users,
  FileText,
} from "lucide-react";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "네이버 블로그", href: "/dashboard/naver-blog", icon: MessageSquare },
  { name: "네이버 플레이스", href: "/dashboard/naver-place", icon: MapPin },
  { name: "인스타그램", href: "/dashboard/instagram", icon: Instagram },
  { name: "유튜브", href: "/dashboard/youtube", icon: Youtube },
  { name: "틱톡", href: "/dashboard/tiktok", icon: Zap },
  { name: "당근마켓", href: "/dashboard/karrot", icon: ShoppingBag },
  { name: "분석", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "리포트", href: "/dashboard/reports", icon: FileText },
  { name: "구독 관리", href: "/dashboard/subscription", icon: CreditCard },
  { name: "설정", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 hidden" id="mobile-sidebar-backdrop" />

      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold">SUPER PLACE</span>
          </div>

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
          <div className="flex-shrink-0 border-t p-4">
            <div className="text-xs text-gray-500">
              © 2024 SUPER PLACE
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
