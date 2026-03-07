'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Template {
  templateId: string;
  name: string;
  content: string;
  status: 'PENDING' | 'INSPECTING' | 'APPROVED' | 'REJECTED';
  messageType: string;
  emphasizeType: string;
  buttons?: any[];
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

const KakaoTemplateList: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, [selectedStatus]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await fetch(`/api/kakao/templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates || []);
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInspection = async (templateId: string) => {
    if (!confirm('검수를 요청하시겠습니까?')) return;

    try {
      const response = await fetch('/api/kakao/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, action: 'request' }),
      });

      const data = await response.json();

      if (data.success) {
        alert('검수 요청이 완료되었습니다.');
        fetchTemplates();
      } else {
        alert(data.error || '검수 요청 실패');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    }
  };

  const handleCancelInspection = async (templateId: string) => {
    if (!confirm('검수를 취소하시겠습니까?')) return;

    try {
      const response = await fetch('/api/kakao/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, action: 'cancel' }),
      });

      const data = await response.json();

      if (data.success) {
        alert('검수가 취소되었습니다.');
        fetchTemplates();
      } else {
        alert(data.error || '검수 취소 실패');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('템플릿이 삭제되었습니다.');
        fetchTemplates();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />대기</Badge>;
      case 'INSPECTING':
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1" />검수중</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />승인</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />반려</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      BA: '기본형',
      EX: '부가정보형',
      AD: '광고추가형',
      MI: '복합형',
    };
    return <Badge variant="outline">{types[type] || type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">카카오 알림톡 템플릿 관리</h1>
          <p className="text-gray-500 mt-1">솔라피를 통한 카카오 알림톡 템플릿을 관리합니다.</p>
        </div>
        <Link href="/dashboard/kakao/templates/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            템플릿 생성
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === '' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('')}
              size="sm"
            >
              전체
            </Button>
            <Button
              variant={selectedStatus === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('PENDING')}
              size="sm"
            >
              대기
            </Button>
            <Button
              variant={selectedStatus === 'INSPECTING' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('INSPECTING')}
              size="sm"
            >
              검수중
            </Button>
            <Button
              variant={selectedStatus === 'APPROVED' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('APPROVED')}
              size="sm"
            >
              승인
            </Button>
            <Button
              variant={selectedStatus === 'REJECTED' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('REJECTED')}
              size="sm"
            >
              반려
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 템플릿 목록 */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>등록된 템플릿이 없습니다.</p>
              <Link href="/dashboard/kakao/templates/create">
                <Button className="mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 템플릿 생성하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.templateId}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      {getStatusBadge(template.status)}
                      {getMessageTypeBadge(template.messageType)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.content}</p>
                    
                    {template.status === 'REJECTED' && template.rejectionReason && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertDescription>
                          <strong>반려 사유:</strong> {template.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>버튼: {template.buttons?.length || 0}개</span>
                      <span>•</span>
                      <span>생성: {new Date(template.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>수정: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {/* 대기 상태: 검수 요청 가능 */}
                    {template.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRequestInspection(template.templateId)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          검수 요청
                        </Button>
                        <Link href={`/dashboard/kakao/templates/${template.templateId}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </>
                    )}

                    {/* 검수중 상태: 검수 취소 가능 */}
                    {template.status === 'INSPECTING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInspection(template.templateId)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        검수 취소
                      </Button>
                    )}

                    {/* 승인 상태: 발송 가능 */}
                    {template.status === 'APPROVED' && (
                      <Link href={`/dashboard/kakao/send/${template.templateId}`}>
                        <Button size="sm" variant="default">
                          <Send className="w-4 h-4 mr-1" />
                          발송
                        </Button>
                      </Link>
                    )}

                    {/* 반려 상태: 수정 가능 */}
                    {template.status === 'REJECTED' && (
                      <Link href={`/dashboard/kakao/templates/${template.templateId}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                      </Link>
                    )}

                    {/* 미리보기 */}
                    <Link href={`/dashboard/kakao/templates/${template.templateId}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    {/* 삭제 */}
                    {template.status !== 'INSPECTING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.templateId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KakaoTemplateList;
