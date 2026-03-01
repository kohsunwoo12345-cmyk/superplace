"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

interface KakaoChannel {
  id: string;
  channelName: string;
  searchId: string;
  solapiChannelId: string;
  status: string;
}

interface AlimtalkTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  variables: string | null;
  status: string;
  inspectionStatus: string;
  buttons: string | null;
}

interface RecipientData {
  phone: string;
  [key: string]: any; // 변수들
}

const KAKAO_COST = 15; // 15 포인트/건

export default function KakaoSendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('templateId');
  
  const { user, loading: authLoading } = useKakaoAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 채널 및 템플릿
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);

  // 수신자 데이터
  const [recipients, setRecipients] = useState<RecipientData[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [excelColumns, setExcelColumns] = useState<string[]>([]);

  // 미리보기
  const [previewMessage, setPreviewMessage] = useState("");

  // 에러 및 성공
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchChannelsAndTemplates();
  }, [user, authLoading]);

  useEffect(() => {
    if (templateId) {
      setSelectedTemplate(templateId);
    }
  }, [templateId]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        extractVariables(template.content);
        updatePreview(template.content, {});
      }
    }
  }, [selectedTemplate, templates]);

  const fetchChannelsAndTemplates = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 채널 목록
      const channelsRes = await fetch(`/api/kakao/channels?userId=${user.id}`);
      const channelsData = await channelsRes.json();

      if (channelsData.success) {
        const activeChannels = channelsData.channels.filter(
          (c: KakaoChannel) => c.status === 'ACTIVE'
        );
        setChannels(activeChannels);
        
        if (activeChannels.length > 0) {
          setSelectedChannel(activeChannels[0].id);
          
          // 첫 번째 채널의 템플릿 목록
          await fetchTemplatesForChannel(activeChannels[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesForChannel = async (channelId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `/api/kakao/templates?userId=${user.id}&channelId=${channelId}`
      );
      const data = await response.json();

      if (data.success) {
        // 승인된 템플릿만 표시
        const approvedTemplates = data.templates.filter(
          (t: AlimtalkTemplate) => t.inspectionStatus === 'APPROVED'
        );
        setTemplates(approvedTemplates);

        // templateId가 URL 파라미터로 있으면 자동 선택
        if (templateId && approvedTemplates.find((t: AlimtalkTemplate) => t.id === templateId)) {
          setSelectedTemplate(templateId);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const extractVariables = (content: string) => {
    const regex = /#{([^}]+)}/g;
    const matches = [...content.matchAll(regex)];
    const vars = matches.map(m => m[1].trim());
    setTemplateVariables([...new Set(vars)]); // 중복 제거
  };

  const handleChannelChange = async (channelId: string) => {
    setSelectedChannel(channelId);
    setSelectedTemplate("");
    setTemplates([]);
    await fetchTemplatesForChannel(channelId);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          setError('엑셀 파일에 데이터가 없습니다.');
          return;
        }

        // 첫 번째 행에서 컬럼 추출
        const columns = Object.keys(jsonData[0]);
        setExcelColumns(columns);

        // 데이터 저장 (전화번호 필수)
        const recipientsData = jsonData.map((row: any) => ({
          phone: row['전화번호'] || row['휴대폰'] || row['phone'] || '',
          ...row
        }));

        setRecipients(recipientsData);

        // 자동 매핑 (컬럼 이름이 변수명과 같으면 자동으로 매핑)
        const autoMapping: { [key: string]: string } = {};
        templateVariables.forEach(varName => {
          const matchingColumn = columns.find(col => 
            col.toLowerCase() === varName.toLowerCase() ||
            col.includes(varName) ||
            varName.includes(col)
          );
          if (matchingColumn) {
            autoMapping[varName] = matchingColumn;
          }
        });
        setColumnMapping(autoMapping);

      } catch (err: any) {
        console.error('Excel parsing error:', err);
        setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (variable: string, column: string) => {
    setColumnMapping({
      ...columnMapping,
      [variable]: column
    });
  };

  const updatePreview = (content: string, sampleData: { [key: string]: string }) => {
    let preview = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`#{${key}}`, 'g'), value);
    });
    setPreviewMessage(preview);
  };

  useEffect(() => {
    if (selectedTemplate && recipients.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        // 첫 번째 수신자 데이터로 미리보기 생성
        const sampleData: { [key: string]: string } = {};
        templateVariables.forEach(varName => {
          const column = columnMapping[varName];
          if (column && recipients[0][column]) {
            sampleData[varName] = String(recipients[0][column]);
          }
        });
        updatePreview(template.content, sampleData);
      }
    }
  }, [selectedTemplate, recipients, columnMapping, templateVariables]);

  const validateData = (): string | null => {
    if (!selectedChannel) return '카카오 채널을 선택해주세요.';
    if (!selectedTemplate) return '템플릿을 선택해주세요.';
    if (recipients.length === 0) return '엑셀 파일을 업로드해주세요.';

    // 전화번호 검증
    const invalidPhones = recipients.filter(r => !r.phone || !/^01[0-9]{8,9}$/.test(r.phone.replace(/-/g, '')));
    if (invalidPhones.length > 0) {
      return `유효하지 않은 전화번호가 ${invalidPhones.length}개 있습니다.`;
    }

    // 변수 매핑 검증
    const unmappedVars = templateVariables.filter(v => !columnMapping[v]);
    if (unmappedVars.length > 0) {
      return `매핑되지 않은 변수가 있습니다: ${unmappedVars.join(', ')}`;
    }

    return null;
  };

  const handleSend = async () => {
    const validationError = validateData();
    if (validationError) {
      setError(validationError);
      return;
    }

    const totalCost = recipients.length * KAKAO_COST;
    if (!confirm(`${recipients.length}명에게 알림톡을 전송합니다. (${totalCost} 포인트)\n계속하시겠습니까?`)) {
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const channel = channels.find(c => c.id === selectedChannel);
      const template = templates.find(t => t.id === selectedTemplate);

      if (!channel || !template) {
        throw new Error('채널 또는 템플릿을 찾을 수 없습니다.');
      }

      // 메시지 생성
      const messages = recipients.map(recipient => {
        let content = template.content;
        
        // 변수 치환
        templateVariables.forEach(varName => {
          const column = columnMapping[varName];
          if (column && recipient[column]) {
            content = content.replace(new RegExp(`#{${varName}}`, 'g'), String(recipient[column]));
          }
        });

        return {
          to: recipient.phone.replace(/-/g, ''),
          content: content,
          buttons: template.buttons ? JSON.parse(template.buttons) : undefined
        };
      });

      // Solapi API 호출
      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          channelId: selectedChannel,
          solapiChannelId: channel.solapiChannelId,
          templateCode: template.templateCode,
          messages: messages
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`알림톡 전송이 완료되었습니다. (성공: ${data.successCount}건, 실패: ${data.failCount}건)`);
        
        // 초기화
        setRecipients([]);
        setExcelFile(null);
        setColumnMapping({});
      } else {
        setError(data.error || '알림톡 전송에 실패했습니다.');
      }

    } catch (err: any) {
      console.error('Send error:', err);
      setError('알림톡 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalCost = recipients.length * KAKAO_COST;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">알림톡 전송</h1>
            <p className="text-gray-500 mt-2">
              엑셀 파일을 업로드하여 대량 알림톡을 전송하세요
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 1. 채널 및 템플릿 선택 */}
        <Card>
          <CardHeader>
            <CardTitle>1. 채널 및 템플릿 선택</CardTitle>
            <CardDescription>발송할 카카오 채널과 템플릿을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>카카오 채널</Label>
              <Select value={selectedChannel} onValueChange={handleChannelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="채널을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.channelName} (@{channel.searchId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>알림톡 템플릿</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="템플릿을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.templateName}
                      <Badge variant="outline" className="ml-2">{template.templateCode}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templateVariables.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">템플릿 변수</p>
                <div className="flex flex-wrap gap-2">
                  {templateVariables.map(varName => (
                    <Badge key={varName} variant="secondary">
                      #{varName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 엑셀 파일 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle>2. 수신자 엑셀 업로드</CardTitle>
            <CardDescription>
              전화번호와 변수 데이터가 포함된 엑셀 파일을 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-upload">엑셀 파일 (.xlsx, .xls)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="flex-1"
                />
                {excelFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExcelFile(null);
                      setRecipients([]);
                      setColumnMapping({});
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {recipients.length > 0 && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-900">
                      {recipients.length}명의 수신자 데이터 로드 완료
                    </p>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    예상 비용: {totalCost} 포인트
                  </p>
                </div>

                {/* 변수 매핑 */}
                {templateVariables.length > 0 && (
                  <div className="space-y-3">
                    <Label>변수 매핑</Label>
                    {templateVariables.map(varName => (
                      <div key={varName} className="grid grid-cols-2 gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{varName}</Badge>
                        </div>
                        <Select
                          value={columnMapping[varName] || ""}
                          onValueChange={(val) => handleMappingChange(varName, val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="엑셀 컬럼 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {excelColumns.map(col => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. 미리보기 */}
        {previewMessage && (
          <Card>
            <CardHeader>
              <CardTitle>3. 메시지 미리보기</CardTitle>
              <CardDescription>첫 번째 수신자 데이터로 생성된 미리보기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {previewMessage}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. 전송 버튼 */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSend}
              disabled={sending || recipients.length === 0}
              className="w-full"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  {recipients.length}명에게 알림톡 전송 ({totalCost} 포인트)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
