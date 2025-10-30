"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function DashboardHeader({ user }: { user: User }) {
  return (
    <header className="bg-white border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search bar or breadcrumbs could go here */}
          <div className="flex-1" />

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative flex items-center gap-3 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {user.name || "사용자"}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Dropdown menu (simplified - in production, use a proper dropdown component) */}
              <div className="hidden absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                <a
                  href="/dashboard/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </a>
                <a
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2" />
                  프로필
                </a>
                <hr className="my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
