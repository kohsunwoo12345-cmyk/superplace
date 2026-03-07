'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KakaoTemplateForm from '@/components/kakao/KakaoTemplateForm';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<any>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateId) {
      Promise.all([fetchTemplate(), fetchCategories()]);
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}`);
      const data = await response.json();

      if (data.success) {
        setTemplate(data.data);
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    }
  };

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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, ...templateData }),
      });

      const data = await response.json();

      if (data.success) {
        alert('템플릿이 수정되었습니다!\n수정 후 다시 검수를 요청해주세요.');
        router.push('/dashboard/kakao/templates');
      } else {
        throw new Error(data.error || '템플릿 수정 실패');
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

  if (error || !template) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error || '템플릿을 찾을 수 없습니다.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <KakaoTemplateForm
        initialTemplate={template}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="edit"
      />
    </div>
  );
}
