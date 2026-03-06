"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  channelName?: string;
  status: string;
  inspectionStatus: string;
  createdAt: string;
}

export default function AlimtalkTemplatesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      // Load templates
      fetchTemplates(userData.id);
    } catch (err: any) {
      setError(err.message);
      console.error('Auth error:', err);
    }
  }, []);

  const fetchTemplates = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kakao/templates?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        const userTemplates = data.templates || [];
        
        // Add default templates (5 pre-registered Solapi templates)
        const defaultTemplates: Template[] = [
          {
            id: 'default-1',
            templateCode: 'KA01TP230126085130773ZHclHN4i674',
            templateName: '기본 템플릿 1',
            content: '안녕하세요 #{이름}님, 기본 템플릿 1입니다.',
            channelName: '기본',
            status: 'ACTIVE',
            inspectionStatus: 'APPROVED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'default-2',
            templateCode: 'KA01TP221027002252645FPwAcO9SguY',
            templateName: '기본 템플릿 2',
            content: '안녕하세요 #{이름}님, 기본 템플릿 2입니다.',
            channelName: '기본',
            status: 'ACTIVE',
            inspectionStatus: 'APPROVED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'default-3',
            templateCode: 'KA01TP221025083117992xkz17KyvNbr',
            templateName: '기본 템플릿 3',
            content: '안녕하세요 #{이름}님, 기본 템플릿 3입니다.',
            channelName: '기본',
            status: 'ACTIVE',
            inspectionStatus: 'APPROVED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'default-4',
            templateCode: 'KA01TP240110072220677clp0DwzaW23',
            templateName: '기본 템플릿 4',
            content: '안녕하세요 #{이름}님, 기본 템플릿 4입니다.',
            channelName: '기본',
            status: 'ACTIVE',
            inspectionStatus: 'APPROVED',
            createdAt: new Date().toISOString()
          },
          {
            id: 'default-5',
            templateCode: 'KA01TP230131084504073zoRX27WkwHB',
            templateName: '기본 템플릿 5',
            content: '안녕하세요 #{이름}님, 기본 템플릿 5입니다.',
            channelName: '기본',
            status: 'ACTIVE',
            inspectionStatus: 'APPROVED',
            createdAt: new Date().toISOString()
          }
        ];
        
        // Combine default templates with user templates
        setTemplates([...defaultTemplates, ...userTemplates]);
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError('템플릿을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    // Prevent deleting default templates
    if (templateId.startsWith('default-')) {
      alert('기본 템플릿은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('이 템플릿을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}&userId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('템플릿이 삭제되었습니다.');
        fetchTemplates(user.id);
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">알림톡 템플릿</h1>
        <button
          onClick={() => router.push('/dashboard/kakao-alimtalk/templates/create')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + 새 템플릿 등록
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">템플릿 목록을 불러오는 중...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 템플릿이 없습니다</h3>
          <p className="mt-2 text-gray-500">새 템플릿을 등록하여 알림톡을 발송하세요.</p>
          <button
            onClick={() => router.push('/dashboard/kakao-alimtalk/templates/create')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            템플릿 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{template.templateName}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {template.templateCode}
                    </span>
                    {template.id.startsWith('default-') && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        기본 템플릿
                      </span>
                    )}
                    {template.inspectionStatus === 'PENDING' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        검수 대기
                      </span>
                    )}
                    {template.inspectionStatus === 'APPROVED' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        승인 완료
                      </span>
                    )}
                  </div>
                  {template.channelName && (
                    <p className="text-sm text-gray-500 mb-2">채널: {template.channelName}</p>
                  )}
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <p className="text-gray-700 whitespace-pre-wrap">{template.content}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    등록일: {new Date(template.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                {!template.id.startsWith('default-') && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-blue-600">
                  💡 Solapi 콘솔에서 템플릿 코드 "{template.templateCode}"로 등록 후 사용하세요.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
