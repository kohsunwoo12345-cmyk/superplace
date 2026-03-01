"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, Send, Eye, Edit, 
  Copy, FileText, AlertCircle, Filter, Search 
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

interface AlimtalkTemplate {
  id: string;
  channelId: string;
  channelName?: string;
  templateCode: string;
  templateName: string;
  content: string;
  messageType: string;
  emphasizeType: string;
  variables: string;
  status: string;
  inspectionStatus: string;
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
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete modal
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null
  });
  const [deleting, setDeleting] = useState(false);
  
  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<AlimtalkTemplate | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, authLoading, filterChannel]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch channels
      try {
        const channelsRes = await fetch(`/api/kakao/channels?userId=${user.id}`);
        const channelsData = await channelsRes.json();
        if (channelsData.success) {
          setChannels(channelsData.channels || []);
        }
      } catch (err) {
        console.error('Failed to fetch channels:', err);
        // Continue even if channels fail
      }

      // Fetch templates
      let url = `/api/kakao/templates?userId=${user.id}`;
      if (filterChannel) {
        url += `&channelId=${filterChannel}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Ensure all templates have valid data
        const validTemplates = (data.templates || []).map((t: any) => ({
          ...t,
          variables: t.variables || '[]',
          channelName: t.channelName || '알 수 없는 채널',
          messageType: t.messageType || 'BA',
          emphasizeType: t.emphasizeType || 'NONE',
          inspectionStatus: t.inspectionStatus || 'PENDING'
        }));
        setTemplates(validTemplates);
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}&userId=${user?.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('템플릿이 삭제되었습니다.');
        setDeleteDialog({ open: false, templateId: null });
        fetchData();
      } else {
        setError(data.error || '템플릿 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete:', err);
      setError('템플릿 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (template: AlimtalkTemplate) => {
    try {
      const newTemplate = {
        userId: user?.id,
        channelId: template.channelId,
        templateName: `${template.templateName} (복사본)`,
        templateCode: `${template.templateCode}_COPY_${Date.now()}`,
        content: template.content,
        messageType: template.messageType,
        emphasizeType: template.emphasizeType
      };

      const response = await fetch('/api/kakao/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('템플릿이 복사되었습니다.');
        fetchData();
      } else {
        setError(data.error || '템플릿 복사에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to duplicate:', err);
      setError('템플릿 복사 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (inspectionStatus: string) => {
    const statusConfig: any = {
      'APPROVED': { 
        icon: CheckCircle, 
        label: '승인', 
        class: 'bg-green-100 text-green-800 border-green-200' 
      },
      'PENDING': { 
        icon: Clock, 
        label: '검수 중', 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      'REJECTED': { 
        icon: XCircle, 
        label: '반려', 
        class: 'bg-red-100 text-red-800 border-red-200' 
      }
    };

    const config = statusConfig[inspectionStatus] || { 
      icon: AlertCircle, 
      label: inspectionStatus, 
      class: 'bg-gray-100 text-gray-800 border-gray-200' 
    };
    
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.class} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMessageTypeBadge = (messageType: string) => {
    const types: any = {
      'BA': { label: '기본형', class: 'bg-blue-100 text-blue-800' },
      'EX': { label: '부가정보형', class: 'bg-purple-100 text-purple-800' },
      'AD': { label: '채널추가형', class: 'bg-orange-100 text-orange-800' },
      'MI': { label: '복합형', class: 'bg-indigo-100 text-indigo-800' }
    };
    const config = types[messageType] || { label: messageType, class: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.class}>{config.label}</Badge>;
  };

  const parseVariables = (variables: string): string[] => {
    try {
      if (!variables || variables === '') return [];
      const parsed = JSON.parse(variables);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (filterStatus && template.inspectionStatus !== filterStatus) return false;
    if (searchQuery && !template.templateName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              알림톡 템플릿
            </h1>
            <p className="text-gray-600">
              템플릿을 등록하고 관리하세요
            </p>
          </div>
          <Link href="/dashboard/kakao-alimtalk/templates/create">
            <Button size="lg" className="shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              새 템플릿 등록
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">채널</label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 채널" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.channelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">상태</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="APPROVED">승인</SelectItem>
                  <SelectItem value="PENDING">검수 중</SelectItem>
                  <SelectItem value="REJECTED">반려</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="템플릿 이름으로 검색..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">템플릿이 없습니다</h3>
              <p className="text-gray-600 mb-6">새로운 알림톡 템플릿을 등록해보세요</p>
              <Link href="/dashboard/kakao-alimtalk/templates/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  템플릿 등록하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-xl transition-shadow border-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-1">
                      {template.templateName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(template.inspectionStatus)}
                      {getMessageTypeBadge(template.messageType)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {template.channelName || '알 수 없는 채널'}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">
                    {template.content}
                  </p>
                </div>

                {parseVariables(template.variables).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {parseVariables(template.variables).map((v: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{'{'}{ v}{'}'}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    미리보기
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, templateId: template.id })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {template.inspectionStatus === 'APPROVED' && (
                  <Link href={`/dashboard/kakao-alimtalk/send?templateId=${template.id}`}>
                    <Button className="w-full" size="sm">
                      <Send className="mr-2 h-3 w-3" />
                      이 템플릿으로 발송
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, templateId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, templateId: null })}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.templateId && handleDelete(deleteDialog.templateId)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.templateName}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">채널:</span>
                  <span className="ml-2 font-medium">{previewTemplate.channelName}</span>
                </div>
                <div>
                  <span className="text-gray-500">상태:</span>
                  <span className="ml-2">{getStatusBadge(previewTemplate.inspectionStatus)}</span>
                </div>
                <div>
                  <span className="text-gray-500">메시지 유형:</span>
                  <span className="ml-2">{getMessageTypeBadge(previewTemplate.messageType)}</span>
                </div>
                <div>
                  <span className="text-gray-500">템플릿 코드:</span>
                  <span className="ml-2 font-mono text-xs">{previewTemplate.templateCode}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">템플릿 내용</label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm">{previewTemplate.content}</pre>
                </div>
              </div>

              {parseVariables(previewTemplate.variables).length > 0 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">변수</label>
                  <div className="flex flex-wrap gap-2">
                    {parseVariables(previewTemplate.variables).map((v: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        #{'{'}{ v}{'}'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
