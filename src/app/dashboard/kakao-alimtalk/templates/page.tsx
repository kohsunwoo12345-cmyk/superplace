"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, Send, Eye } from 'lucide-react';
import Link from 'next/link';

interface AlimtalkTemplate {
  id: string;
  userId: string;
  channelId: string;
  solapiChannelId: string;
  solapiTemplateId: string;
  templateCode: string;
  templateName: string;
  content: string;
  categoryCode: string;
  messageType: string;
  emphasizeType: string;
  buttons: string;
  quickReplies: string;
  variables: string;
  status: string;
  inspectionStatus: string;
  approvedAt: string;
  rejectedReason: string;
  createdAt: string;
  updatedAt: string;
}

export default function AlimtalkTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const channelId = searchParams.get('channelId');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    fetchTemplates();
  }, [session, status, channelId]);

  const fetchTemplates = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      let url = `/api/kakao/templates?userId=${session.user.id}`;
      if (channelId) {
        url += `&channelId=${channelId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || '템플릿 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError('템플릿 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInspection = async (templateId: string) => {
    if (!session?.user?.id) return;

    if (!confirm('검수를 요청하시겠습니까? 검수 승인까지 최대 3영업일이 소요됩니다.')) {
      return;
    }

    try {
      setActioningId(templateId);

      const response = await fetch('/api/kakao/templates/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, userId: session.user.id }),
      });
      const data = await response.json();

      if (data.success) {
        alert('검수 요청이 완료되었습니다.');
        fetchTemplates(); // 목록 새로고침
      } else {
        alert(data.error || '검수 요청에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to request inspection:', err);
      alert('검수 요청 중 오류가 발생했습니다.');
    } finally {
      setActioningId(null);
    }
  };

  const handleCancelInspection = async (templateId: string) => {
    if (!session?.user?.id) return;

    if (!confirm('검수 요청을 취소하시겠습니까?')) {
      return;
    }

    try {
      setActioningId(templateId);

      const response = await fetch(
        `/api/kakao/templates/inspection?templateId=${templateId}&userId=${session.user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        alert('검수 요청이 취소되었습니다.');
        fetchTemplates();
      } else {
        alert(data.error || '검수 취소에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to cancel inspection:', err);
      alert('검수 취소 중 오류가 발생했습니다.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!session?.user?.id) return;

    if (!confirm('정말 이 템플릿을 삭제하시겠습니까? 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setActioningId(templateId);

      const response = await fetch(
        `/api/kakao/templates?templateId=${templateId}&userId=${session.user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
      } else {
        alert(data.error || '템플릿 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인됨
          </Badge>
        );
      case 'INSPECTING':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            검수중
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            반려됨
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3 text-gray-600">템플릿 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">알림톡 템플릿 관리</h1>
          <p className="text-gray-600">
            알림톡 발송에 사용할 템플릿을 생성하고 검수를 요청하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kakao-channel">
            <Button variant="outline">채널 관리</Button>
          </Link>
          <Link href={`/dashboard/kakao-alimtalk/templates/create${channelId ? `?channelId=${channelId}` : ''}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 템플릿 생성
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 템플릿이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                알림톡 템플릿을 생성하고 검수를 받으면 고객에게 알림톡을 발송할 수 있습니다.
              </p>
              <Link href={`/dashboard/kakao-alimtalk/templates/create${channelId ? `?channelId=${channelId}` : ''}`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  첫 번째 템플릿 생성하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const variables = template.variables ? JSON.parse(template.variables) : [];
            const buttons = template.buttons ? JSON.parse(template.buttons) : [];

            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{template.templateName}</CardTitle>
                        {getStatusBadge(template.status)}
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {template.templateCode || 'Code: Pending'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 템플릿 내용 */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">템플릿 내용</h4>
                      <div className="bg-gray-50 p-4 rounded-lg border text-sm whitespace-pre-wrap">
                        {template.content}
                      </div>
                      
                      {variables.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-gray-600 mb-1">변수:</h5>
                          <div className="flex flex-wrap gap-1">
                            {variables.map((v: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                #{{{v}}}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {buttons.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-gray-600 mb-1">버튼:</h5>
                          <div className="space-y-1">
                            {buttons.map((btn: any, idx: number) => (
                              <div key={idx} className="text-xs bg-white border rounded px-2 py-1">
                                {btn.buttonName} ({btn.buttonType})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 템플릿 정보 */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">템플릿 정보</h4>
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">메시지 유형</dt>
                            <dd className="font-medium">{template.messageType || 'BA'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">강조 유형</dt>
                            <dd className="font-medium">{template.emphasizeType || 'NONE'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">등록일</dt>
                            <dd className="font-medium">
                              {new Date(template.createdAt).toLocaleDateString('ko-KR')}
                            </dd>
                          </div>
                          {template.approvedAt && (
                            <div>
                              <dt className="text-gray-500">승인일</dt>
                              <dd className="font-medium">
                                {new Date(template.approvedAt).toLocaleDateString('ko-KR')}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {template.status === 'REJECTED' && template.rejectedReason && (
                        <Alert className="border-red-500 bg-red-50">
                          <AlertDescription className="text-red-800 text-sm">
                            <strong>반려 사유:</strong> {template.rejectedReason}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* 액션 버튼 */}
                      <div className="flex flex-wrap gap-2">
                        {template.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleRequestInspection(template.id)}
                            disabled={actioningId === template.id}
                          >
                            {actioningId === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                검수 요청
                              </>
                            )}
                          </Button>
                        )}

                        {template.status === 'INSPECTING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInspection(template.id)}
                            disabled={actioningId === template.id}
                          >
                            {actioningId === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '검수 취소'
                            )}
                          </Button>
                        )}

                        {template.status === 'APPROVED' && (
                          <Link href={`/dashboard/kakao-alimtalk/send?templateId=${template.id}`}>
                            <Button size="sm">
                              <Send className="mr-2 h-4 w-4" />
                              발송하기
                            </Button>
                          </Link>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={actioningId === template.id}
                        >
                          {actioningId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 안내 정보 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">💡 템플릿 검수 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. 템플릿 생성:</strong> 발송할 메시지 내용을 작성하고 변수(#{'{변수명}'}), 버튼 등을 추가합니다.
          </div>
          <div>
            <strong>2. 검수 요청:</strong> 생성한 템플릿을 카카오에 검수 요청합니다.
          </div>
          <div>
            <strong>3. 검수 대기:</strong> 최대 3영업일 소요됩니다. 승인 또는 반려됩니다.
          </div>
          <div>
            <strong>4. 알림톡 발송:</strong> 승인된 템플릿으로만 알림톡을 발송할 수 있습니다.
          </div>
          <div className="pt-2 border-t">
            <p className="text-gray-600">
              ⚠️ 반려된 경우 반려 사유를 확인하고 템플릿을 수정하여 다시 검수 요청하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
