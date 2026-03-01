"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Plus, Trash2, CheckCircle, XCircle, RefreshCw, 
  MessageSquare, ExternalLink, AlertCircle, FileText, Send,
  Upload, Calendar, Clock
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface KakaoChannel {
  id: string;
  channelName: string;
  searchId: string;
  phoneNumber: string;
  categoryCode: string;
  mainCategory: string;
  middleCategory: string;
  subCategory: string;
  solapiChannelId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  templateName: string;
  templateCode: string;
  content: string;
  variables: string;
  inspectionStatus: string;
}

interface Recipient {
  phoneNumber: string;
  variables: { [key: string]: string };
}

export default function KakaoChannelListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; channelId: string | null }>({
    open: false,
    channelId: null
  });
  const [deleting, setDeleting] = useState(false);

  // Send Alimtalk Dialog
  const [sendDialog, setSendDialog] = useState<{ open: boolean; channel: KakaoChannel | null }>({
    open: false,
    channel: null
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendType, setSendType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Excel upload
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [phoneNumberColumn, setPhoneNumberColumn] = useState('');
  const [variableMapping, setVariableMapping] = useState<{ [key: string]: string }>({});
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchChannels();
  }, [user, authLoading]);

  const fetchChannels = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/kakao/channels?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setChannels(data.channels || []);
      } else {
        setError(data.error || '채널 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setError('채널 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!user?.id) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/kakao/channels?channelId=${channelId}&userId=${user.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.success) {
        setSuccess('채널이 삭제되었습니다.');
        setDeleteDialog({ open: false, channelId: null });
        fetchChannels();
      } else {
        setError(data.error || '채널 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to delete channel:', err);
      setError('채널 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncChannels = async () => {
    if (!user?.id) return;

    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/kakao/sync-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ ${data.syncedCount}개의 채널이 동기화되었습니다!`);
        await fetchChannels();
      } else {
        setError(data.error || '채널 동기화에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to sync channels:', err);
      setError('채널 동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const openSendDialog = async (channel: KakaoChannel) => {
    setSendDialog({ open: true, channel });
    
    // Fetch templates for this channel
    try {
      const response = await fetch(`/api/kakao/templates?userId=${user?.id}&channelId=${channel.id}`);
      const data = await response.json();
      
      if (data.success) {
        const approvedTemplates = (data.templates || []).filter(
          (t: Template) => t.inspectionStatus === 'APPROVED'
        );
        setTemplates(approvedTemplates);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setError('엑셀 파일이 비어있습니다.');
        return;
      }

      setExcelData(jsonData);
      const columns = Object.keys(jsonData[0] as any);
      setExcelColumns(columns);

      // Auto-detect phone number column
      const phoneCol = columns.find(col => 
        col.includes('전화') || col.includes('휴대폰') || col.includes('phone') || 
        col.includes('번호') || col.toLowerCase().includes('mobile')
      );
      if (phoneCol) {
        setPhoneNumberColumn(phoneCol);
      }
    } catch (err: any) {
      console.error('Failed to parse Excel:', err);
      setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const parseVariables = (variables: string): string[] => {
    try {
      if (!variables) return [];
      const parsed = JSON.parse(variables);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const generateRecipients = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template || !phoneNumberColumn) return;

    const vars = parseVariables(template.variables);
    const newRecipients: Recipient[] = [];

    excelData.forEach(row => {
      const phoneNumber = String((row as any)[phoneNumberColumn] || '').replace(/[^0-9]/g, '');
      if (!phoneNumber || phoneNumber.length < 10) return;

      const variables: { [key: string]: string } = {};
      vars.forEach(varName => {
        const colName = variableMapping[varName];
        if (colName && (row as any)[colName]) {
          variables[varName] = String((row as any)[colName]);
        }
      });

      newRecipients.push({ phoneNumber, variables });
    });

    setRecipients(newRecipients);
  };

  useEffect(() => {
    if (selectedTemplate && phoneNumberColumn && excelData.length > 0) {
      generateRecipients();
    }
  }, [selectedTemplate, phoneNumberColumn, variableMapping, excelData]);

  const handleSend = async () => {
    if (!sendDialog.channel || !selectedTemplate || recipients.length === 0) {
      alert('채널, 템플릿, 수신자를 모두 확인해주세요.');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const totalCost = recipients.length * 15;
    
    let confirmMsg = `${recipients.length}명에게 알림톡을 발송하시겠습니까?\n\n예상 비용: ${totalCost} 포인트`;
    
    if (sendType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        alert('예약 날짜와 시간을 선택해주세요.');
        return;
      }
      confirmMsg += `\n예약 시간: ${scheduledDate} ${scheduledTime}`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          channelId: sendDialog.channel.id,
          channelName: sendDialog.channel.channelName,
          solapiChannelId: sendDialog.channel.solapiChannelId,
          templateId: selectedTemplate,
          templateName: template.templateName,
          templateCode: template.templateCode,
          recipients: recipients.map(r => ({
            to: r.phoneNumber,
            variables: r.variables
          })),
          sendType,
          scheduledAt: sendType === 'scheduled' ? `${scheduledDate}T${scheduledTime}:00` : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          sendType === 'immediate' 
            ? `✅ 발송 완료!\n성공: ${data.successCount}건\n실패: ${data.failCount}건`
            : `✅ 예약 완료!\n${scheduledDate} ${scheduledTime}에 ${recipients.length}건 발송 예약되었습니다.`
        );
        setSendDialog({ open: false, channel: null });
        // Reset state
        setSelectedTemplate('');
        setExcelFile(null);
        setRecipients([]);
        setExcelData([]);
      } else {
        setError(data.error || '발송에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to send:', err);
      setError('발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const downloadSampleExcel = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    const vars = template ? parseVariables(template.variables) : [];
    
    const sampleData: any = { '전화번호': '01012345678' };
    vars.forEach(v => {
      sampleData[v] = `${v} 값`;
    });

    const ws = XLSX.utils.json_to_sheet([sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "수신자목록");
    XLSX.writeFile(wb, "알림톡_발송_샘플.xlsx");
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      'ACTIVE': {
        icon: CheckCircle,
        label: '활성',
        class: 'bg-green-100 text-green-800 border-green-200'
      },
      'INACTIVE': {
        icon: XCircle,
        label: '비활성',
        class: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      'PENDING': {
        icon: AlertCircle,
        label: '대기 중',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    };

    const cfg = config[status] || config.ACTIVE;
    const Icon = cfg.icon;

    return (
      <Badge className={`${cfg.class} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

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
              <MessageSquare className="h-8 w-8 text-blue-600" />
              카카오 채널 관리
            </h1>
            <p className="text-gray-600">
              알림톡 발송에 사용할 카카오 비즈니스 채널을 관리하세요
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSyncChannels}
              disabled={syncing}
              className="shadow-sm"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solapi 채널 동기화
                </>
              )}
            </Button>
            <Link href="/dashboard/kakao-channel/register">
              <Button size="lg" className="shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                채널 등록
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800 whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                전체 채널
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{channels.length}</div>
              <p className="text-xs text-gray-500 mt-1">개</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                활성 채널
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {channels.filter(c => c.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">개</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                사용 가능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {channels.filter(c => c.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">개 채널로 발송 가능</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Channels List */}
      {channels.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 채널이 없습니다</h3>
              <p className="text-gray-600 mb-6">
                알림톡을 발송하려면 먼저 카카오 비즈니스 채널을 등록해야 합니다
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/kakao-channel/register">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    채널 등록하기
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSyncChannels}
                  disabled={syncing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solapi에서 불러오기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-xl transition-shadow border-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold shadow-md">
                        {channel.channelName[0]}
                      </div>
                      <span className="line-clamp-1">{channel.channelName}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="font-mono">@{channel.searchId}</span>
                    </div>
                    {getStatusBadge(channel.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">전화번호</span>
                    <span className="font-medium">{channel.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">카테고리</span>
                    <span className="font-medium text-xs">{channel.subCategory || '미설정'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Solapi ID</span>
                    <span className="font-mono text-xs">{channel.solapiChannelId.substring(0, 12)}...</span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  {/* 알림톡 발송 버튼 */}
                  {channel.status === 'ACTIVE' && (
                    <Button 
                      onClick={() => openSendDialog(channel)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="sm"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      알림톡 발송하기
                    </Button>
                  )}
                  
                  <Link href={`/dashboard/kakao-alimtalk/templates?channelId=${channel.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      템플릿 관리
                    </Button>
                  </Link>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://center-pf.kakao.com/`, '_blank')}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      카카오 센터
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, channelId: channel.id })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, channelId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>채널 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 채널을 삭제하시겠습니까? 
              <br />
              <span className="text-red-600 font-semibold">연결된 템플릿도 사용할 수 없게 됩니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, channelId: null })}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.channelId && handleDeleteChannel(deleteDialog.channelId)}
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

      {/* Send Alimtalk Dialog */}
      <Dialog 
        open={sendDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setSendDialog({ open: false, channel: null });
            setSelectedTemplate('');
            setExcelFile(null);
            setRecipients([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              알림톡 발송 - {sendDialog.channel?.channelName}
            </DialogTitle>
            <DialogDescription>
              템플릿을 선택하고 엑셀 파일을 업로드하여 대량 발송하세요
            </DialogDescription>
          </DialogHeader>

          <Tabs value={sendType} onValueChange={(v) => setSendType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="immediate" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                즉시 발송
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                예약 발송
              </TabsTrigger>
            </TabsList>

            <TabsContent value="immediate" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Template Selection */}
                <div>
                  <Label>템플릿 선택 *</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.templateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {templates.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      승인된 템플릿이 없습니다. 
                      <Link href="/dashboard/kakao-alimtalk/templates/create" className="underline ml-1">
                        템플릿을 먼저 등록하세요
                      </Link>
                    </p>
                  )}
                </div>

                {/* Excel Upload */}
                {selectedTemplate && (
                  <>
                    <div>
                      <Label>엑셀 파일 업로드 *</Label>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadSampleExcel}
                          size="sm"
                          className="mb-2"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          샘플 파일 다운로드
                        </Button>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {excelFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ {excelFile.name} ({excelData.length}개 행)
                        </p>
                      )}
                    </div>

                    {/* Variable Mapping */}
                    {excelColumns.length > 0 && (
                      <div className="space-y-3">
                        <Label>변수 매핑</Label>
                        
                        <div>
                          <Label className="text-xs">전화번호 컬럼</Label>
                          <Select value={phoneNumberColumn} onValueChange={setPhoneNumberColumn}>
                            <SelectTrigger>
                              <SelectValue placeholder="전화번호 컬럼 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelColumns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {parseVariables(templates.find(t => t.id === selectedTemplate)?.variables || '[]').map(varName => (
                          <div key={varName}>
                            <Label className="text-xs">#{'{'}{ varName}{'}'} 변수</Label>
                            <Select 
                              value={variableMapping[varName] || ''} 
                              onValueChange={(value) => setVariableMapping(prev => ({ ...prev, [varName]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="엑셀 컬럼 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {excelColumns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recipients Summary */}
                    {recipients.length > 0 && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          ✅ {recipients.length}명의 수신자가 준비되었습니다.
                          <br />
                          예상 비용: {recipients.length * 15} 포인트
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Template Selection */}
                <div>
                  <Label>템플릿 선택 *</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.templateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>예약 날짜 *</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>예약 시간 *</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                {scheduledDate && scheduledTime && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      📅 예약 시간: {scheduledDate} {scheduledTime}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Excel Upload - Same as immediate */}
                {selectedTemplate && (
                  <>
                    <div>
                      <Label>엑셀 파일 업로드 *</Label>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadSampleExcel}
                          size="sm"
                          className="mb-2"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          샘플 파일 다운로드
                        </Button>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {excelFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ {excelFile.name} ({excelData.length}개 행)
                        </p>
                      )}
                    </div>

                    {/* Variable Mapping */}
                    {excelColumns.length > 0 && (
                      <div className="space-y-3">
                        <Label>변수 매핑</Label>
                        
                        <div>
                          <Label className="text-xs">전화번호 컬럼</Label>
                          <Select value={phoneNumberColumn} onValueChange={setPhoneNumberColumn}>
                            <SelectTrigger>
                              <SelectValue placeholder="전화번호 컬럼 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelColumns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {parseVariables(templates.find(t => t.id === selectedTemplate)?.variables || '[]').map(varName => (
                          <div key={varName}>
                            <Label className="text-xs">#{'{'}{ varName}{'}'} 변수</Label>
                            <Select 
                              value={variableMapping[varName] || ''} 
                              onValueChange={(value) => setVariableMapping(prev => ({ ...prev, [varName]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="엑셀 컬럼 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {excelColumns.map(col => (
                                  <SelectItem key={col} value={col}>{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recipients Summary */}
                    {recipients.length > 0 && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          ✅ {recipients.length}명의 수신자가 준비되었습니다.
                          <br />
                          예상 비용: {recipients.length * 15} 포인트
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialog({ open: false, channel: null })}
              disabled={sending}
            >
              취소
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !selectedTemplate || recipients.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sendType === 'immediate' ? '발송 중...' : '예약 중...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {sendType === 'immediate' ? `${recipients.length}명에게 발송` : `${recipients.length}명 예약 발송`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
