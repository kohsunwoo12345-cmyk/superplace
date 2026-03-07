'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KakaoTemplateForm from '@/components/kakao/KakaoTemplateForm';
import { RefreshCw } from 'lucide-react';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/kakao/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || '카테고리를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (templateData: any) => {
    try {
      const response = await fetch('/api/kakao/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        alert('템플릿이 생성되었습니다!\n대기 상태에서 검수를 요청해주세요.');
        router.push('/dashboard/kakao/templates');
      } else {
        throw new Error(data.error || '템플릿 생성 실패');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/kakao/templates');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={fetchCategories}
            className="mt-4 text-blue-500 underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <KakaoTemplateForm
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="create"
      />
    </div>
  );
}
