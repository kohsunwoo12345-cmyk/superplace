'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ModernLayout from '@/components/layouts/ModernLayout';

// 인증 없이 접근 가능한 경로 목록
const PUBLIC_PATHS = [
  '/dashboard/classes',
  // 필요시 다른 공개 경로 추가
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    
    // 현재 경로가 공개 경로인지 확인
    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        console.log('🔍 DashboardLayout - User Data:', userData);
        console.log('🔍 DashboardLayout - User Role:', userData.role);
        setIsChecking(false);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setIsChecking(false);
        if (!isPublicPath) {
          router.push('/login');
        }
      }
    } else {
      // 공개 경로가 아니고 로그인하지 않은 경우 리다이렉트
      if (!isPublicPath) {
        router.push('/login');
      }
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (!mounted || isChecking) {
    return null;
  }

  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));

  // 공개 경로가 아니고 사용자가 없으면 null 반환 (리다이렉트 진행 중)
  if (!isPublicPath && !user) {
    return null;
  }

  // 모든 사용자는 Modern Layout 사용 (관리자 포함)
  // 로그인하지 않은 경우 'GUEST' 역할로 처리
  return <ModernLayout role={user?.role || 'GUEST'}>{children}</ModernLayout>;
}
