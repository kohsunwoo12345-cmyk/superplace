"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AlimtalkTemplatesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      console.error('Auth error:', err);
    }
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">오류 발생</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">알림톡 템플릿</h1>
      <p className="text-gray-600 mb-6">템플릿 관리 페이지입니다.</p>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p>사용자 ID: {user.id}</p>
        <p>이름: {user.name}</p>
      </div>
      
      <div className="mt-6">
        <a 
          href="/dashboard/kakao-alimtalk/templates/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          템플릿 등록하기
        </a>
      </div>
    </div>
  );
}
