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

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        console.log('🔍 DashboardLayout - User Data:', userData);
        console.log('🔍 DashboardLayout - User Role:', userData.role);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  if (!mounted) {
    return null;
  }

  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));

  // 공개 경로가 아니고 로그인하지 않은 경우에만 리다이렉트
  if (!isPublicPath && !user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // 모든 사용자는 Modern Layout 사용 (관리자 포함)
  // 로그인하지 않은 경우 'GUEST' 역할로 처리
  return <ModernLayout role={user?.role || 'GUEST'}>{children}</ModernLayout>;
}
