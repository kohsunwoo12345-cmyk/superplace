"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { Toaster } from "@/components/ui/toaster";
import PageTransition from "@/components/PageTransition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }

    // 학생은 대시보드만 접근 가능
    if (status === "authenticated" && session?.user?.role === "STUDENT") {
      const allowedPaths = ["/dashboard", "/dashboard/settings"];
      const isAllowed = allowedPaths.some(path => pathname === path);
      
      if (!isAllowed) {
        router.push("/dashboard");
      }
    }
  }, [status, session, pathname, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      {/* 모바일에서는 pt-16으로 헤더 공간 확보, 데스크톱에서는 pl-64로 사이드바 공간 확보 */}
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <DashboardHeader user={session.user} />
        {/* 반응형 패딩: 모바일(px-4), 태블릿(px-6), 데스크톱(px-8) */}
        <main className="py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
