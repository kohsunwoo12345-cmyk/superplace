"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Send, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Recipient {
  name: string;
  phone: string;
  landingPageUrl?: string;
}

interface Template {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  solapiTemplateId: string;
  variables?: string;
}

interface Channel {
  id: string;
  channelName: string;
  solapiChannelId: string;
}

export default function SendAlimtalkPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [channels, setChannels] = useState<Channel[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLandingPage, setSelectedLandingPage] = useState('');
  
  // Recipients
  const [inputMode, setInputMode] = useState<'manual' | 'excel'>('manual');
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: '', phone: '' }]);
  
  // Preview
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchChannels(userData.id);
    fetchLandingPages(userData.id);
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchTemplates(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedTemplate) {
      updatePreview();
    }
  }, [selectedTemplate, recipients, selectedLandingPage]);

  const fetchChannels = async (userId: string) => {
    try {
      const response = await fetch(`/api/kakao/channels?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (channelId: string) => {
    try {
      const response = await fetch(`/api/kakao/templates?userId=${user.id}&channelId=${channelId}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchLandingPages = async (userId: string) => {
    try {
      const response = await fetch(`/api/landing/list?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setLandingPages(data.landingPages || []);
      }
    } catch (err) {
      console.error('Failed to fetch landing pages:', err);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: '', phone: '' }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Map excel data to recipients
        const mappedRecipients: Recipient[] = jsonData.map((row: any) => ({
          name: row['이름'] || row['name'] || row['Name'] || '',
          phone: String(row['전화번호'] || row['phone'] || row['Phone'] || row['휴대폰'] || '').replace(/[^0-9]/g, '')
        })).filter(r => r.name && r.phone);

        setRecipients(mappedRecipients);
        alert(`${mappedRecipients.length}명의 수신자를 불러왔습니다.`);
      } catch (err) {
        console.error('Excel parsing error:', err);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updatePreview = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template || recipients.length === 0) {
      setPreviewMessage('');
      return;
    }

    // Get first recipient for preview
    const recipient = recipients[0];
    let message = template.content;

    // Replace variables
    if (recipient.name) {
      message = message.replace(/#{이름}/g, recipient.name)
                        .replace(/#{학생이름}/g, recipient.name)
                        .replace(/#{이름}/g, recipient.name);
    }

    // Add landing page URL if selected
    if (selectedLandingPage) {
      const landingPage = landingPages.find(lp => lp.id === selectedLandingPage);
      if (landingPage) {
        const uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${recipient.name}&ref=${Date.now()}`;
        message = message.replace(/#{URL}/g, uniqueUrl)
                        .replace(/#{리포트URL}/g, uniqueUrl)
                        .replace(/#{링크}/g, uniqueUrl);
      }
    }

    setPreviewMessage(message);
  };

  const handleSend = async () => {
    if (!selectedChannel || !selectedTemplate) {
      alert('채널과 템플릿을 선택해주세요.');
      return;
    }

    const validRecipients = recipients.filter(r => r.name && r.phone);
    if (validRecipients.length === 0) {
      alert('최소 1명의 수신자를 입력해주세요.');
      return;
    }

    const channel = channels.find(c => c.id === selectedChannel);
    const template = templates.find(t => t.id === selectedTemplate);
    
    if (!channel || !template) {
      alert('채널 또는 템플릿 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      // Prepare recipients with landing page URLs
      const preparedRecipients = validRecipients.map((recipient, index) => {
        let landingPageUrl = '';
        
        if (selectedLandingPage) {
          const landingPage = landingPages.find(lp => lp.id === selectedLandingPage);
          if (landingPage) {
            landingPageUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${encodeURIComponent(recipient.name)}&phone=${recipient.phone}&ref=${Date.now()}_${index}`;
          }
        }

        return {
          name: recipient.name,
          phoneNumber: recipient.phone,
          landingPageUrl: landingPageUrl
        };
      });

      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          channelId: channel.id,
          solapiChannelId: channel.solapiChannelId,
          templateCode: template.solapiTemplateId,
          recipients: preparedRecipients,
          sendMode: 'immediate'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ ${preparedRecipients.length}건의 알림톡이 발송되었습니다!`);
        setRecipients([{ name: '', phone: '' }]);
        setSelectedTemplate('');
      } else {
        setError(data.error || '발송에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setError('발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">알림톡 발송</h1>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-500">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-500">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>발송 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>채널 선택 *</Label>
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

              <div>
                <Label>랜딩페이지 (선택)</Label>
                <Select value={selectedLandingPage} onValueChange={setSelectedLandingPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="랜딩페이지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">선택 안 함</SelectItem>
                    {landingPages.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  선택 시 각 학생마다 고유한 URL이 생성됩니다
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>수신자 입력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={inputMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setInputMode('manual')}
                  className="flex-1"
                >
                  직접 입력
                </Button>
                <Button
                  variant={inputMode === 'excel' ? 'default' : 'outline'}
                  onClick={() => setInputMode('excel')}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  엑셀 업로드
                </Button>
              </div>

              {inputMode === 'manual' ? (
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="이름"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="전화번호 (01012345678)"
                        value={recipient.phone}
                        onChange={(e) => updateRecipient(index, 'phone', e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1"
                      />
                      {recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addRecipient} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    수신자 추가
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600">
                        엑셀 파일을 선택하세요 (이름, 전화번호 컬럼 필요)
                      </p>
                    </div>
                  </label>
                  {recipients.length > 1 && (
                    <Alert className="mt-4 bg-green-50 border-green-500">
                      <AlertDescription className="text-green-800">
                        ✅ {recipients.length}명의 수신자를 불러왔습니다
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSend}
            disabled={sending || !selectedChannel || !selectedTemplate || recipients.filter(r => r.name && r.phone).length === 0}
            className="w-full"
            size="lg"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {recipients.filter(r => r.name && r.phone).length}명에게 발송
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {previewMessage ? (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {previewMessage}
                    </p>
                  </div>
                  {selectedLandingPage && (
                    <div className="mt-3 text-xs text-gray-600">
                      💡 각 수신자마다 고유한 랜딩페이지 URL이 생성됩니다
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  채널, 템플릿, 수신자를 입력하면<br />미리보기가 표시됩니다
                </div>
              )}
            </CardContent>
          </Card>

          {recipients.filter(r => r.name && r.phone).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>수신자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recipients.filter(r => r.name && r.phone).map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{recipient.name}</span>
                        <span className="text-sm text-gray-600 ml-2">{recipient.phone}</span>
                      </div>
                      {selectedLandingPage && (
                        <span className="text-xs text-blue-600">🔗 개인 URL</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
