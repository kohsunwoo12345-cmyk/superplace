"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileSpreadsheet, Send, Eye, Download, AlertCircle, Clock, Calendar as CalendarIcon } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function SendAlimtalkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
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
  const [previewMode, setPreviewMode] = useState(false);
  
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
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedChannel) {
      fetchTemplates(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template && template.variables) {
        try {
          const vars = JSON.parse(template.variables);
          setTemplateVariables(vars);
          
          // Initialize mapping
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
  }, [selectedTemplate, templates]);

  // Generate recipients when mapping is complete
  useEffect(() => {
    if (excelData.length > 0 && phoneNumberColumn && Object.keys(variableMapping).length > 0) {
      generateRecipients();
    }
  }, [excelData, phoneNumberColumn, variableMapping]);

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
        // Only show approved templates
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
      
      // Extract column names
      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);

      // Auto-detect phone number column
      const phoneCol = columns.find(col => 
        col.includes('전화') || col.includes('휴대폰') || col.includes('phone') || 
        col.includes('번호') || col.toLowerCase().includes('mobile')
      );
      if (phoneCol) {
        setPhoneNumberColumn(phoneCol);
      }

      // Auto-map variables if column names match
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
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const newRecipients: MappedRecipient[] = [];

    excelData.forEach((row, index) => {
      const phoneNumber = String(row[phoneNumberColumn] || '').replace(/[^0-9]/g, '');
      
      if (!phoneNumber || phoneNumber.length < 10) {
        console.warn(`Row ${index + 1}: Invalid phone number`);
        return;
      }

      // Map variables
      const variables: { [key: string]: string } = {};
      Object.keys(variableMapping).forEach(varName => {
        const colName = variableMapping[varName];
        if (colName && row[colName]) {
          variables[varName] = String(row[colName]);
        }
      });

      // Generate preview
      let preview = template.content;
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

    // Calculate cost (15 points per message)
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
        
        // Reset form after 3 seconds
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

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === selectedTemplate);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">알림톡 대량 발송</h1>
        <p className="text-gray-600">
          엑셀 파일을 업로드하여 여러 명에게 한 번에 알림톡을 발송할 수 있습니다.
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <AlertDescription className="text-green-800 whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Channel & Template */}
          <Card>
            <CardHeader>
              <CardTitle>1단계: 채널 및 템플릿 선택</CardTitle>
              <CardDescription>발송할 채널과 템플릿을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>카카오 채널</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
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
                  <Label>알림톡 템플릿</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.templateName} ({template.inspectionStatus})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {templates.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      승인된 템플릿이 없습니다. <Link href="/dashboard/kakao-alimtalk/templates/create" className="underline">템플릿을 등록하세요</Link>
                    </p>
                  )}
                </div>
              )}

              {selectedTemplate && (
                <Alert>
                  <AlertDescription>
                    <div className="text-sm">
                      <strong>템플릿 내용:</strong>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded">
                        {getSelectedTemplate()?.content}
                      </pre>
                    </div>
                    {templateVariables.length > 0 && (
                      <div className="mt-3">
                        <strong className="text-sm">필요한 변수:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {templateVariables.map(v => (
                            <span key={v} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              #{'{'}{ v}{'}'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Upload Excel */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>2단계: 엑셀 파일 업로드</CardTitle>
                <CardDescription>수신자 목록이 포함된 엑셀 파일을 업로드하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadSampleExcel}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    샘플 파일 다운로드
                  </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      {excelFile ? excelFile.name : '엑셀 파일을 선택하세요'}
                    </p>
                    <p className="text-xs text-gray-400">
                      .xlsx, .xls 파일만 지원
                    </p>
                  </label>
                </div>

                {excelData.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      ✅ {excelData.length}개의 행을 읽었습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Variable Mapping */}
          {excelData.length > 0 && templateVariables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3단계: 변수 매핑</CardTitle>
                <CardDescription>엑셀 컬럼을 템플릿 변수에 연결하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone number mapping */}
                <div>
                  <Label>전화번호 컬럼</Label>
                  <Select value={phoneNumberColumn} onValueChange={setPhoneNumberColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="전화번호가 있는 컬럼" />
                    </SelectTrigger>
                    <SelectContent>
                      {excelColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Variable mappings */}
                {templateVariables.map(varName => (
                  <div key={varName}>
                    <Label>#{'{'}{ varName}{'}'} 변수</Label>
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

                {recipients.length > 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      ✅ {recipients.length}명의 수신자가 준비되었습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Preview & Summary */}
        <div className="space-y-6">
          {recipients.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>발송 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">수신자 수:</span>
                    <span className="font-semibold">{recipients.length}명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">메시지당 비용:</span>
                    <span className="font-semibold">15 포인트</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">총 예상 비용:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {recipients.length * 15} 포인트
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>미리보기</CardTitle>
                  <CardDescription>첫 번째 수신자의 메시지</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">
                      수신: {recipients[0].phoneNumber}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {recipients[0].preview}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Options */}
              <Card>
                <CardHeader>
                  <CardTitle>발송 방식</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={sendMode} onValueChange={(v: any) => setSendMode(v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate" className="flex items-center cursor-pointer">
                        <Send className="mr-2 h-4 w-4" />
                        즉시 발송
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="flex items-center cursor-pointer">
                        <Clock className="mr-2 h-4 w-4" />
                        예약 발송
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {sendMode === 'scheduled' && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <Label>발송 날짜</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
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
                          <Label>시</Label>
                          <Select value={scheduledHour} onValueChange={setScheduledHour}>
                            <SelectTrigger>
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
                          <Label>분</Label>
                          <Select value={scheduledMinute} onValueChange={setScheduledMinute}>
                            <SelectTrigger>
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
                </CardContent>
              </Card>

              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {sendMode === 'immediate' ? '발송 중...' : '예약 중...'}
                  </>
                ) : (
                  <>
                    {sendMode === 'immediate' ? (
                      <><Send className="mr-2 h-4 w-4" />{recipients.length}명에게 즉시 발송</>
                    ) : (
                      <><Clock className="mr-2 h-4 w-4" />{recipients.length}명에게 예약 발송</>
                    )}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recipients Table (when preview mode) */}
      {previewMode && recipients.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>전체 수신자 목록</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>전화번호</TableHead>
                  {templateVariables.map(v => (
                    <TableHead key={v}>{v}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.slice(0, 100).map((recipient, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {recipient.phoneNumber}
                    </TableCell>
                    {templateVariables.map(v => (
                      <TableCell key={v} className="text-sm">
                        {recipient.variables[v] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {recipients.length > 100 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                * 처음 100명만 표시됩니다. 전체 {recipients.length}명에게 발송됩니다.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {recipients.length > 0 && !previewMode && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            전체 수신자 목록 보기
          </Button>
        </div>
      )}
    </div>
  );
}
