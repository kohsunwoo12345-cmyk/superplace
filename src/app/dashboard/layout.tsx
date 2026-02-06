'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/layouts/ModernLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  if (!mounted) {
    return null;
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // 모든 사용자는 Modern Layout 사용 (관리자 포함)
  return <ModernLayout role={user.role}>{children}</ModernLayout>;
}
