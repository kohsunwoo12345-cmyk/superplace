"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, Send, Eye, Edit } from 'lucide-react';
import Link from 'next/link';

interface AlimtalkTemplate {
  id: string;
  userId: string;
  channelId: string;
  channelName?: string;
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

interface KakaoChannel {
  id: string;
  channelName: string;
  searchId: string;
  solapiChannelId: string;
}

export default function AlimtalkTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useKakaoAuth();
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  // 템플릿 생성/수정 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AlimtalkTemplate | null>(null);
  const [formData, setFormData] = useState({
    channelId: '',
    templateName: '',
    content: '',
    categoryCode: '999999',
  });
  const [creating, setCreating] = useState(false);

  const channelId = searchParams.get('channelId');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, authLoading, channelId]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch channels
      const channelsRes = await fetch(`/api/kakao/channels?userId=${user.id}`);
      const channelsData = await channelsRes.json();
      if (channelsData.success) {
        setChannels(channelsData.channels || []);
        if (channelsData.channels.length > 0 && !formData.channelId) {
          setFormData(prev => ({ ...prev, channelId: channelId || channelsData.channels[0].id }));
        }
      }

      // Fetch templates
      let url = `/api/kakao/templates?userId=${user.id}`;
      if (channelId) {
        url += `&channelId=${channelId}`;
      }

      const templatesRes = await fetch(url);
      const templatesData = await templatesRes.json();

      if (templatesData.success) {
        setTemplates(templatesData.templates || []);
      } else {
        setError(templatesData.error || '템플릿 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user?.id || !formData.channelId || !formData.templateName || !formData.content) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setCreating(true);

      const selectedChannel = channels.find(c => c.id === formData.channelId);
      if (!selectedChannel) {
        alert('선택한 채널을 찾을 수 없습니다.');
        return;
      }

      const response = await fetch('/api/kakao/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          channelId: formData.channelId,
          solapiChannelId: selectedChannel.solapiChannelId,
          templateName: formData.templateName,
          content: formData.content,
          categoryCode: formData.categoryCode,
          messageType: 'BA',
          emphasizeType: 'NONE',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('템플릿이 생성되었습니다!');
        setIsModalOpen(false);
        setFormData({
          channelId: formData.channelId,
          templateName: '',
          content: '',
          categoryCode: '999999',
        });
        fetchData();
      } else {
        alert(data.error || '템플릿 생성에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to create template:', err);
      alert('템플릿 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user?.id) return;

    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setActioningId(templateId);

      const response = await fetch(
        `/api/kakao/templates?templateId=${templateId}&userId=${user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
        alert('템플릿이 삭제되었습니다.');
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

  const extractVariables = (content: string): string[] => {
    const regex = /#\{([^}]+)\}/g;
    const matches = [...content.matchAll(regex)];
    return matches.map(match => match[1]);
  };

  const renderPreview = (content: string) => {
    const variables = extractVariables(content);
    let previewContent = content;
    
    variables.forEach(varName => {
      previewContent = previewContent.replace(
        new RegExp(`#\\{${varName}\\}`, 'g'),
        `[${varName}]`
      );
    });

    return previewContent;
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
      case 'DRAFT':
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

  if (authLoading || loading) {
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
            알림톡 발송에 사용할 템플릿을 생성하고 관리하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kakao-channel">
            <Button variant="outline">채널 관리</Button>
          </Link>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 템플릿 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 알림톡 템플릿 생성</DialogTitle>
                <DialogDescription>
                  변수는 #{"{"}변수명{"}"} 형식으로 입력하세요. 예: #{"{"}이름{"}"}, #{"{"}날짜{"}"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6">
                {/* 왼쪽: 템플릿 입력 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="channel">채널 선택 *</Label>
                    <select
                      id="channel"
                      className="w-full p-2 border rounded-md"
                      value={formData.channelId}
                      onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                    >
                      <option value="">채널 선택</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.channelName} (@{channel.searchId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="templateName">템플릿 이름 *</Label>
                    <Input
                      id="templateName"
                      placeholder="예: 수업 안내"
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">메시지 내용 *</Label>
                    <Textarea
                      id="content"
                      placeholder={`예:\n안녕하세요 #{이름}님,\n#{날짜} #{시간}에 수업이 있습니다.\n많은 참여 부탁드립니다.`}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.content.length} / 1000자
                    </p>
                  </div>

                  <div>
                    <Label>감지된 변수</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extractVariables(formData.content).map((varName, index) => (
                        <Badge key={index} variant="secondary">
                          {varName}
                        </Badge>
                      ))}
                      {extractVariables(formData.content).length === 0 && (
                        <span className="text-sm text-gray-500">변수가 없습니다</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 미리보기 */}
                <div>
                  <Label>카카오톡 미리보기</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-gradient-to-b from-yellow-50 to-white min-h-[400px]">
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">K</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {channels.find(c => c.id === formData.channelId)?.channelName || '채널명'}
                          </div>
                          <div className="text-xs text-gray-500">알림톡</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {formData.templateName && (
                          <div className="font-bold text-sm text-gray-800 mb-2">
                            {formData.templateName}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {formData.content ? renderPreview(formData.content) : '메시지 내용을 입력하세요...'}
                        </div>
                      </div>

                      {formData.content && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="text-xs text-gray-400">
                            {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <AlertDescription className="text-xs">
                      💡 <strong>팁:</strong> 실제 발송 시 변수 값이 자동으로 치환됩니다.<br />
                      예: #{"{"}이름{"}"} → 홍길동
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      channelId: formData.channelId,
                      templateName: '',
                      content: '',
                      categoryCode: '999999',
                    });
                  }}
                >
                  취소
                </Button>
                <Button onClick={handleCreateTemplate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    '템플릿 생성'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <Send className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 템플릿이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                알림톡 발송을 위한 첫 번째 템플릿을 생성하세요.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 템플릿 생성하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{template.templateName}</CardTitle>
                    <CardDescription className="text-xs font-mono">
                      {template.templateCode || 'N/A'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(template.status || template.inspectionStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <div className="whitespace-pre-wrap line-clamp-4">
                      {template.content}
                    </div>
                  </div>

                  {template.variables && (
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(template.variables).map((varName: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {varName}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    생성일: {new Date(template.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // TODO: 미리보기 모달
                      alert('미리보기 기능 준비 중');
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    미리보기
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={actioningId === template.id}
                  >
                    {actioningId === template.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">💡 템플릿 작성 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. 변수 사용:</strong> #{"{"}변수명{"}"} 형식으로 입력하세요. 예: #{"{"}이름{"}"}, #{"{"}날짜{"}"}
          </div>
          <div>
            <strong>2. 문자 수 제한:</strong> 최대 1,000자까지 입력 가능합니다.
          </div>
          <div>
            <strong>3. 승인 절차:</strong> 템플릿은 카카오 검수 후 발송 가능합니다. (현재는 자동 승인)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
