'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, Edit, Send } from 'lucide-react';
import KakaoTemplatePreview from '@/components/kakao/KakaoTemplatePreview';
import Link from 'next/link';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}`);
      const data = await response.json();

      if (data.success) {
        setTemplate(data.data);
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'bg-yellow-500', text: '대기' },
      INSPECTING: { color: 'bg-blue-500', text: '검수중' },
      APPROVED: { color: 'bg-green-500', text: '승인' },
      REJECTED: { color: 'bg-red-500', text: '반려' },
    };
    const badge = badges[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={badge.color}>{badge.text}</Badge>;
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
        <Link href="/dashboard/kakao/templates">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/kakao/templates">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 템플릿 정보 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(template.status)}
                    <Badge variant="outline">
                      {template.messageType === 'BA' && '기본형'}
                      {template.messageType === 'EX' && '부가정보형'}
                      {template.messageType === 'AD' && '광고추가형'}
                      {template.messageType === 'MI' && '복합형'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {template.status === 'APPROVED' && (
                    <Link href={`/dashboard/kakao/send/${templateId}`}>
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        발송
                      </Button>
                    </Link>
                  )}
                  {(template.status === 'PENDING' || template.status === 'REJECTED') && (
                    <Link href={`/dashboard/kakao/templates/${templateId}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">템플릿 ID</h3>
                <p className="text-sm text-gray-600 font-mono">{template.templateId}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">템플릿 내용</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.content}</p>
              </div>

              {template.extra && (
                <div>
                  <h3 className="font-semibold mb-2">부가정보</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.extra}</p>
                </div>
              )}

              {template.buttons && template.buttons.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">버튼 ({template.buttons.length}개)</h3>
                  <div className="space-y-2">
                    {template.buttons.map((button: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="font-medium">{button.buttonName}</div>
                        <div className="text-gray-600">타입: {button.buttonType}</div>
                        {button.linkMo && (
                          <div className="text-gray-600 text-xs truncate">
                            모바일: {button.linkMo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {template.status === 'REJECTED' && template.rejectionReason && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>반려 사유:</strong><br />
                    {template.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                <div>생성일: {new Date(template.createdAt).toLocaleString()}</div>
                <div>수정일: {new Date(template.updatedAt).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 미리보기 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <KakaoTemplatePreview template={template} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
