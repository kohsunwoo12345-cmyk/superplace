"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Send, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Recipient {
  name: string;
  phone: string;
}

interface Template {
  id: string;
  templateCode: string;
  templateName: string;
  content: string;
  solapiTemplateId: string;
}

interface Channel {
  id: string;
  channelName: string;
  solapiChannelId: string;
}

export default function SendAlimtalkPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLandingPage, setSelectedLandingPage] = useState('');
  
  const [inputMode, setInputMode] = useState<'students' | 'manual' | 'excel'>('students');
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: '', phone: '' }]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchData(userData.id);
    
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channelId');
    if (channelId) {
      setSelectedChannel(channelId);
    }
  }, [router]);

  useEffect(() => {
    if (selectedChannel) {
      fetchTemplates(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, recipients, selectedLandingPage, selectedStudents, inputMode, students, templates, landingPages]);

  const fetchData = async (userId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      // Fetch channels
      const channelsRes = await fetch(`/api/kakao/channels?userId=${userId}`);
      const channelsData = await channelsRes.json();
      if (channelsData.success) {
        setChannels(channelsData.channels || []);
      }
      
      // Fetch landing pages
      const landingRes = await fetch(`/api/landing/list?userId=${userId}`);
      const landingData = await landingRes.json();
      if (landingData.success) {
        setLandingPages(landingData.landingPages || []);
      }
      
      // Fetch students
      const studentsRes = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        const validStudents = (studentsData.students || []).filter((s: any) => 
          s.status === 'ACTIVE' && s.phoneNumber
        );
        setStudents(validStudents);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
    if (!template) {
      setPreviewMessage('');
      return;
    }

    let recipient: any;
    
    if (inputMode === 'students' && selectedStudents.length > 0) {
      const student = students.find(s => s.id === selectedStudents[0]);
      if (student) {
        recipient = { name: student.name, phone: student.phoneNumber };
      }
    } else if (recipients.length > 0 && recipients[0].name) {
      recipient = recipients[0];
    }

    if (!recipient) {
      setPreviewMessage('');
      return;
    }

    let message = template.content;
    message = message.replace(/#{name}/g, recipient.name)
                    .replace(/#{이름}/g, recipient.name)
                    .replace(/#{학생이름}/g, recipient.name);

    if (selectedLandingPage) {
      const landingPage = landingPages.find(lp => lp.id === selectedLandingPage);
      if (landingPage) {
        const uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${recipient.name}`;
        message = message.replace(/#{url}/g, uniqueUrl)
                        .replace(/#{URL}/g, uniqueUrl)
                        .replace(/#{리포트URL}/g, uniqueUrl);
      }
    }

    setPreviewMessage(message);
  };

  const handleSend = async () => {
    if (!selectedChannel || !selectedTemplate) {
      alert('채널과 템플릿을 선택해주세요.');
      return;
    }

    if (!selectedLandingPage) {
      alert('랜딩페이지를 선택해주세요.');
      return;
    }

    let validRecipients: any[] = [];
    
    if (inputMode === 'students') {
      validRecipients = students
        .filter(s => selectedStudents.includes(s.id))
        .map(student => ({
          name: student.name,
          phoneNumber: student.phoneNumber.replace(/[^0-9]/g, '')
        }));
    } else {
      validRecipients = recipients
        .filter(r => r.name && r.phone)
        .map(r => ({
          name: r.name,
          phoneNumber: r.phone.replace(/[^0-9]/g, '')
        }));
    }

    if (validRecipients.length === 0) {
      alert('최소 1명의 수신자를 선택해주세요.');
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

      const landingPage = landingPages.find(lp => lp.id === selectedLandingPage);
      
      const preparedRecipients = validRecipients.map((recipient, index) => {
        const uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${encodeURIComponent(recipient.name)}&phone=${recipient.phoneNumber}&ref=${Date.now()}_${index}`;
        
        return {
          name: recipient.name,
          phoneNumber: recipient.phoneNumber,
          landingPageUrl: uniqueUrl
        };
      });

      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          channelId: channel.id,
          solapiChannelId: channel.solapiChannelId,
          templateCode: template.solapiTemplateId || template.templateCode,
          recipients: preparedRecipients,
          sendMode: 'immediate'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ ${preparedRecipients.length}건의 알림톡이 발송되었습니다!`);
        setRecipients([{ name: '', phone: '' }]);
        setSelectedStudents([]);
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

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3">로딩 중...</span>
        </div>
      </div>
    );
  }

  const recipientCount = inputMode === 'students' 
    ? selectedStudents.length 
    : recipients.filter(r => r.name && r.phone).length;

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
                <Label>랜딩페이지 *</Label>
                <Select value={selectedLandingPage} onValueChange={setSelectedLandingPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="랜딩페이지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {landingPages.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  각 학생마다 고유한 URL이 생성됩니다
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>수신자 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={inputMode === 'students' ? 'default' : 'outline'}
                  onClick={() => setInputMode('students')}
                  className="flex-1"
                >
                  학생 선택
                </Button>
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
                  엑셀
                </Button>
              </div>

              {inputMode === 'students' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-2">
                    등록된 학생 ({students.length}명)
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{student.phoneNumber}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedStudents.length > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      ✅ {selectedStudents.length}명 선택됨
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'manual' && (
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
                        placeholder="전화번호"
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
              )}

              {inputMode === 'excel' && (
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
                        엑셀 파일 선택 (이름, 전화번호)
                      </p>
                    </div>
                  </label>
                  {recipients.length > 1 && (
                    <Alert className="mt-4 bg-green-50 border-green-500">
                      <AlertDescription className="text-green-800">
                        ✅ {recipients.length}명
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSend}
            disabled={sending || !selectedChannel || !selectedTemplate || !selectedLandingPage || recipientCount === 0}
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
                {recipientCount}명에게 발송
              </>
            )}
          </Button>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              {previewMessage ? (
                <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-200">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap text-gray-800">
                      {previewMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  설정을 완료하면 미리보기가 표시됩니다
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
