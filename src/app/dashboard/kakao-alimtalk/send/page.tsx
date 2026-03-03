"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Upload, FileSpreadsheet, Send, Eye, Download, AlertCircle, 
  Clock, Calendar as CalendarIcon, MessageSquare, Users, Zap
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KakaoChannel {
  id: string;
  searchId: string;
  channelName: string;
  solapiChannelId: string;
}

interface AlimtalkTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  variables: string;
  status: string;
  inspectionStatus: string;
}

interface ExcelRow {
  [key: string]: any;
}

interface MappedRecipient {
  phoneNumber: string;
  variables: { [key: string]: string };
  preview: string;
}

export default function SendAlimtalkUnifiedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Excel data
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  
  // Variable mapping
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [variableMapping, setVariableMapping] = useState<{ [key: string]: string }>({});
  const [phoneNumberColumn, setPhoneNumberColumn] = useState('');
  
  // Recipients
  const [recipients, setRecipients] = useState<MappedRecipient[]>([]);
  
  // Scheduling
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledHour, setScheduledHour] = useState('09');
  const [scheduledMinute, setScheduledMinute] = useState('00');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchChannels();
    
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channelId');
    if (channelId) {
      setSelectedChannel(channelId);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedChannel) {
      fetchTemplates(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setCustomMessage(template.content);
        if (template.variables) {
          try {
            const vars = JSON.parse(template.variables);
            setTemplateVariables(vars);
            
            const mapping: { [key: string]: string } = {};
            vars.forEach((v: string) => {
              mapping[v] = '';
            });
            setVariableMapping(mapping);
          } catch (e) {
            setTemplateVariables([]);
          }
        }
      }
    }
  }, [selectedTemplate, templates]);

  useEffect(() => {
    if (excelData.length > 0 && phoneNumberColumn && Object.keys(variableMapping).length > 0) {
      generateRecipients();
    }
  }, [excelData, phoneNumberColumn, variableMapping, customMessage]);

  const fetchChannels = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/kakao/channels?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setChannels(data.channels || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setError('채널 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (channelId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/kakao/templates?userId=${user.id}&channelId=${channelId}`);
      const data = await response.json();

      if (data.success) {
        const approvedTemplates = (data.templates || []).filter(
          (t: AlimtalkTemplate) => t.inspectionStatus === 'APPROVED' || t.status === 'ACTIVE'
        );
        setTemplates(approvedTemplates);
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

      if (jsonData.length === 0) {
        setError('엑셀 파일이 비어있습니다.');
        return;
      }

      setExcelData(jsonData);
      
      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);

      const phoneCol = columns.find(col => 
        col.includes('전화') || col.includes('휴대폰') || col.includes('phone') || 
        col.includes('번호') || col.toLowerCase().includes('mobile')
      );
      if (phoneCol) {
        setPhoneNumberColumn(phoneCol);
      }

      if (templateVariables.length > 0) {
        const autoMapping: { [key: string]: string } = {};
        templateVariables.forEach(varName => {
          const matchingCol = columns.find(col => 
            col.includes(varName) || varName.includes(col)
          );
          if (matchingCol) {
            autoMapping[varName] = matchingCol;
          }
        });
        setVariableMapping(prev => ({ ...prev, ...autoMapping }));
      }

    } catch (err: any) {
      console.error('Failed to parse Excel:', err);
      setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const generateRecipients = () => {
    if (!customMessage) return;

    const newRecipients: MappedRecipient[] = [];

    excelData.forEach((row, index) => {
      const phoneNumber = String(row[phoneNumberColumn] || '').replace(/[^0-9]/g, '');
      
      if (!phoneNumber || phoneNumber.length < 10) {
        console.warn(`Row ${index + 1}: Invalid phone number`);
        return;
      }

      const variables: { [key: string]: string } = {};
      Object.keys(variableMapping).forEach(varName => {
        const colName = variableMapping[varName];
        if (colName && row[colName]) {
          variables[varName] = String(row[colName]);
        }
      });

      let preview = customMessage;
      Object.keys(variables).forEach(varName => {
        preview = preview.replace(new RegExp(`#\\{${varName}\\}`, 'g'), variables[varName]);
      });

      newRecipients.push({
        phoneNumber,
        variables,
        preview
      });
    });

    setRecipients(newRecipients);
  };

  const handleSend = async () => {
    if (!selectedChannel || !selectedTemplate) {
      alert('채널과 템플릿을 선택해주세요.');
      return;
    }

    if (recipients.length === 0) {
      alert('발송할 수신자가 없습니다.');
      return;
    }
    
    if (sendMode === 'scheduled') {
      if (!scheduledDate) {
        alert('발송 날짜를 선택해주세요.');
        return;
      }
      
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(parseInt(scheduledHour), parseInt(scheduledMinute), 0, 0);
      
      if (scheduledDateTime <= new Date()) {
        alert('미래 시간을 선택해주세요.');
        return;
      }
    }

    const totalCost = recipients.length * 15;
    
    const confirmMessage = sendMode === 'immediate' 
      ? `${recipients.length}명에게 즉시 알림톡을 발송하시겠습니까?\n\n예상 비용: ${totalCost} 포인트`
      : `${recipients.length}명에게 ${format(scheduledDate!, 'yyyy년 M월 d일', { locale: ko })} ${scheduledHour}:${scheduledMinute}에 알림톡을 예약하시겠습니까?\n\n예상 비용: ${totalCost} 포인트`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      const channel = channels.find(c => c.id === selectedChannel);
      const template = templates.find(t => t.id === selectedTemplate);
      
      let scheduledDateTime;
      if (sendMode === 'scheduled' && scheduledDate) {
        scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(parseInt(scheduledHour), parseInt(scheduledMinute), 0, 0);
      }

      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          channelId: selectedChannel,
          channelName: channel?.channelName,
          solapiChannelId: channel?.solapiChannelId,
          templateId: selectedTemplate,
          templateName: template?.templateName,
          templateCode: template?.templateCode,
          sendMode,
          scheduledAt: scheduledDateTime?.toISOString(),
          recipients: recipients.map(r => ({
            to: r.phoneNumber,
            variables: r.variables
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        if (sendMode === 'immediate') {
          setSuccess(`✅ 발송 완료!\n성공: ${data.successCount}건\n실패: ${data.failCount}건`);
        } else {
          const scheduledTime = new Date(scheduledDate!);
          scheduledTime.setHours(parseInt(scheduledHour), parseInt(scheduledMinute), 0, 0);
          setSuccess(`✅ 예약 완료!\n${format(scheduledTime, 'yyyy년 M월 d일 HH:mm', { locale: ko })}에 ${recipients.length}건의 알림톡이 발송됩니다.`);
        }
        
        setTimeout(() => {
          setExcelFile(null);
          setExcelData([]);
          setRecipients([]);
          setSelectedTemplate('');
          setSendMode('immediate');
          setScheduledDate(undefined);
        }, 3000);
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
    const sampleData = [
      { 
        '학생이름': '홍길동',
        '전화번호': '01012345678',
        '리포트URL': 'https://example.com/report/1'
      },
      { 
        '학생이름': '김철수',
        '전화번호': '01087654321',
        '리포트URL': 'https://example.com/report/2'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "수신자목록");
    XLSX.writeFile(wb, "알림톡_발송_샘플.xlsx");
  };

  const insertVariable = (varName: string) => {
    const textarea = messageTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = customMessage;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const variableText = `#{${varName}}`;

    const newText = before + variableText + after;
    setCustomMessage(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-400 to-orange-400 opacity-20 animate-pulse"></div>
          <div className="relative bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20">
            <Loader2 className="w-16 h-16 animate-spin text-yellow-600 mx-auto mb-6" />
            <div className="space-y-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                데이터 로딩 중
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 container mx-auto p-8 max-w-7xl">
        {/* Premium Header */}
        <Card className="border-0 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 text-white overflow-hidden relative transform hover:scale-[1.01] transition-all duration-500 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10 pb-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl ring-2 ring-white/30 transform hover:rotate-6 transition-transform duration-300">
                    <Send className="h-10 w-10 drop-shadow-lg" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight drop-shadow-lg">카카오 알림톡 대량 발송</h1>
                    <p className="text-white/95 mt-2 text-xl font-medium drop-shadow">간편하게 메시지를 작성하고 엑셀로 한번에 발송하세요</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

      {error && (
        <Alert className="mb-6 border-0 bg-gradient-to-r from-red-500 to-rose-600 shadow-xl">
          <div className="flex items-start gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <AlertDescription className="text-white font-semibold whitespace-pre-line">{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-0 bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl">
          <div className="flex items-start gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <Send className="h-5 w-5" />
            </div>
            <AlertDescription className="text-white font-semibold whitespace-pre-line">{success}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Unified Form */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-yellow-100 via-amber-50 to-orange-100 border-b border-yellow-200">
              <CardTitle className="text-2xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-black flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-yellow-600" />
                알림톡 작성 및 발송
              </CardTitle>
              <CardDescription className="text-base">모든 정보를 입력하고 발송하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              {/* Channel & Template Selection */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-bold">카카오 채널</Label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="mt-2 py-6 border-2 border-yellow-200 focus:border-yellow-500 rounded-xl">
                      <SelectValue placeholder="채널을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(channel => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.channelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedChannel && (
                  <div>
                    <Label className="text-base font-bold">알림톡 템플릿</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="mt-2 py-6 border-2 border-yellow-200 focus:border-yellow-500 rounded-xl">
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
                      <p className="text-sm text-amber-600 mt-2">
                        승인된 템플릿이 없습니다. <Link href="/dashboard/kakao-alimtalk/templates/create" className="underline font-bold">템플릿을 등록하세요</Link>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Message Editor */}
              {selectedTemplate && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-bold">메시지 내용</Label>
                      <Badge className="bg-yellow-500 text-white">
                        {customMessage.length}자
                      </Badge>
                    </div>
                    
                    {/* Variable Buttons */}
                    {templateVariables.length > 0 && (
                      <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                        <Label className="text-sm font-bold text-blue-900 mb-2 block">치환문자 (클릭하여 삽입)</Label>
                        <div className="flex flex-wrap gap-2">
                          {templateVariables.map(v => (
                            <Button
                              key={v}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => insertVariable(v)}
                              className="bg-white hover:bg-blue-100 border-2 border-blue-300 text-blue-700 font-bold rounded-lg transition-all duration-200 hover:scale-105"
                            >
                              #{'{'}{ v}{'}'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Textarea
                      ref={messageTextareaRef}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={15}
                      className="resize-none border-3 border-yellow-200 focus:border-yellow-500 rounded-2xl p-6 text-base font-medium leading-relaxed"
                      placeholder="메시지를 입력하세요..."
                    />
                  </div>

                  {/* Excel Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-bold">엑셀 파일 업로드</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadSampleExcel}
                        size="sm"
                        className="bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 text-yellow-700 font-bold"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        샘플 다운로드
                      </Button>
                    </div>

                    <div className="border-3 border-dashed border-yellow-300 rounded-2xl p-8 text-center bg-gradient-to-br from-yellow-50 to-amber-50 hover:border-yellow-400 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label htmlFor="excel-upload" className="cursor-pointer">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <FileSpreadsheet className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-base text-gray-800 mb-1 font-bold">
                          {excelFile ? excelFile.name : '엑셀 파일을 선택하세요'}
                        </p>
                        <p className="text-sm text-gray-600">
                          .xlsx, .xls 파일만 지원
                        </p>
                      </label>
                    </div>

                    {excelData.length > 0 && (
                      <Alert className="mt-4 bg-green-50 border-2 border-green-300">
                        <AlertDescription className="text-green-800 font-bold">
                          ✅ {excelData.length}개의 행을 읽었습니다.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Variable Mapping */}
                  {excelData.length > 0 && templateVariables.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                      <Label className="text-base font-bold text-purple-900 mb-4 block">변수 매핑</Label>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">전화번호 컬럼</Label>
                          <Select value={phoneNumberColumn} onValueChange={setPhoneNumberColumn}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="전화번호가 있는 컬럼" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelColumns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {templateVariables.map(varName => (
                          <div key={varName}>
                            <Label className="text-sm font-semibold">#{'{'}{ varName}{'}'} 변수</Label>
                            <Select 
                              value={variableMapping[varName] || ''} 
                              onValueChange={(value) => setVariableMapping(prev => ({ ...prev, [varName]: value }))}
                            >
                              <SelectTrigger className="mt-1">
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

                      {recipients.length > 0 && (
                        <Alert className="mt-4 bg-green-50 border-2 border-green-300">
                          <AlertDescription className="text-green-800 font-bold">
                            ✅ {recipients.length}명의 수신자가 준비되었습니다.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Send Mode */}
                  {recipients.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
                      <Label className="text-base font-bold text-orange-900 mb-4 block">발송 방식</Label>
                      
                      <RadioGroup value={sendMode} onValueChange={(v: any) => setSendMode(v)}>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
                          <RadioGroupItem value="immediate" id="immediate" />
                          <Label htmlFor="immediate" className="flex items-center cursor-pointer font-bold">
                            <Zap className="mr-2 h-5 w-5 text-yellow-600" />
                            즉시 발송
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors mt-3">
                          <RadioGroupItem value="scheduled" id="scheduled" />
                          <Label htmlFor="scheduled" className="flex items-center cursor-pointer font-bold">
                            <Clock className="mr-2 h-5 w-5 text-orange-600" />
                            예약 발송
                          </Label>
                        </div>
                      </RadioGroup>
                      
                      {sendMode === 'scheduled' && (
                        <div className="space-y-3 pt-4 mt-4 border-t-2 border-orange-200">
                          <div>
                            <Label className="font-semibold">발송 날짜</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal mt-1"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {scheduledDate ? format(scheduledDate, 'yyyy년 M월 d일', { locale: ko }) : '날짜 선택'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={scheduledDate}
                                  onSelect={setScheduledDate}
                                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="font-semibold">시</Label>
                              <Select value={scheduledHour} onValueChange={setScheduledHour}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}시
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="font-semibold">분</Label>
                              <Select value={scheduledMinute} onValueChange={setScheduledMinute}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['00', '10', '20', '30', '40', '50'].map(m => (
                                    <SelectItem key={m} value={m}>{m}분</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary & Send */}
        <div className="space-y-8">
          {recipients.length > 0 && (
            <>
              {/* Summary Card */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-xl font-black">
                    <Users className="w-6 h-6" />
                    발송 요약
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="flex justify-between p-4 bg-white/15 backdrop-blur-md rounded-xl">
                    <span className="font-semibold">수신자 수:</span>
                    <span className="font-black text-xl">{recipients.length}명</span>
                  </div>
                  <div className="flex justify-between p-4 bg-white/15 backdrop-blur-md rounded-xl">
                    <span className="font-semibold">메시지당 비용:</span>
                    <span className="font-bold">15P</span>
                  </div>
                  <div className="flex justify-between p-5 bg-white/25 backdrop-blur-md rounded-xl border-2 border-white/30">
                    <span className="font-black text-lg">총 비용:</span>
                    <span className="font-black text-3xl">{recipients.length * 15}P</span>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-yellow-100 to-amber-100 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg font-black text-yellow-700">
                    <Eye className="w-5 h-5" />
                    미리보기
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5">
                    <div className="text-xs text-gray-600 mb-3 font-bold">
                      수신: {recipients[0].phoneNumber}
                    </div>
                    <div className="text-sm whitespace-pre-wrap font-medium text-gray-800">
                      {recipients[0].preview}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-8 text-xl font-black bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 hover:from-yellow-700 hover:via-amber-700 hover:to-orange-700 shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 rounded-2xl"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-3 h-7 w-7 animate-spin" />
                    {sendMode === 'immediate' ? '발송 중...' : '예약 중...'}
                  </>
                ) : (
                  <>
                    {sendMode === 'immediate' ? (
                      <><Send className="mr-3 h-7 w-7" />{recipients.length}명에게 즉시 발송</>
                    ) : (
                      <><Clock className="mr-3 h-7 w-7" />{recipients.length}명에게 예약 발송</>
                    )}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
