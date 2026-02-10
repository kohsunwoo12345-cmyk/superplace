'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AIChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 로그인 체크
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  // 완전히 독립적인 레이아웃 - 부모 레이아웃 무시
  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">
      {children}
    </div>
  );
}
