"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Home,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export default function DashboardHeader({ user }: { user: User }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // 관리자 및 학원장만 AI 쇼핑몰 버튼 표시
  const showStoreButton = user.role && ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user.role.toUpperCase());

  return (
    <header className="bg-white border-b sticky top-0 z-40 lg:static">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 빈 공간 (모바일에서는 중앙 정렬을 위해) */}
          <div className="flex-1 lg:flex-none" />

          {/* Right section - 반응형 간격 조정 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* AI 쇼핑몰 버튼 - 관리자/학원장만 표시 */}
            {showStoreButton && (
              <Link href="/store">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 animate-pulse" />
                  <span className="hidden sm:inline font-semibold">AI 쇼핑몰</span>
                  <Sparkles className="h-3 w-3 hidden md:inline animate-bounce" />
                </Button>
              </Link>
            )}
            
            {/* Home Button - 태블릿 이상에서만 텍스트 표시 */}
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">홈으로</span>
              </Button>
            </Link>

            {/* Notifications - 모바일에서도 아이콘만 표시 */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* User menu - 반응형 */}
            <div className="relative flex items-center gap-2 sm:gap-3 border-l pl-2 sm:pl-4">
              {/* 사용자 정보는 데스크톱에서만 표시 */}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-700">
                  {user.name || "사용자"}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-full hover:bg-gray-100"
                >
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                </button>
              </div>

              {/* Dropdown menu - 반응형 위치 */}
              {dropdownOpen && (
                <>
                  {/* 오버레이 (모바일) */}
                  <div 
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  {/* 드롭다운 메뉴 */}
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    {/* 모바일에서는 사용자 정보 표시 */}
                    <div className="lg:hidden px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-700">
                        {user.name || "사용자"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <a
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      설정
                    </a>
                    <a
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      프로필
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
