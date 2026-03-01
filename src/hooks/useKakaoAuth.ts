"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  academyId?: string;
  academyName?: string;
  academyCode?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom authentication hook for Kakao pages
 * Uses localStorage token instead of NextAuth
 */
export function useKakaoAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Check localStorage for user data
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userStr || !token) {
        setAuthState({ user: null, loading: false, error: null });
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      setAuthState({ user, loading: false, error: null });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({ user: null, loading: false, error: 'Authentication failed' });
      router.push('/login');
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    logout,
  };
}
