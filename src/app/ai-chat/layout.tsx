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
    
    // 🔥 CRITICAL: 캐시 버스트 체크
    const REQUIRED_VERSION = 'v7.0-FALLBACK-REMOVED';
    const currentVersion = sessionStorage.getItem('cache-bust-version');
    
    if (currentVersion !== REQUIRED_VERSION) {
      console.log('🔄 캐시 버전 불일치 - 강제 리로드');
      sessionStorage.setItem('cache-bust-version', REQUIRED_VERSION);
      window.location.reload();
      return;
    }
    
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
