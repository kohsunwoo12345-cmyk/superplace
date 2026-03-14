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
import { Loader2, Plus, Trash2, Send, Upload, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Recipient {
  name: string;
  phone: string;
  landingPageUrl?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
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
  const [students, setStudents] = useState<any[]>([]); // Add students list
  
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLandingPage, setSelectedLandingPage] = useState('');
  
  // Recipients
  const [inputMode, setInputMode] = useState<'manual' | 'excel' | 'students'>('manual');
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: '', phone: '' }]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]); // Selected student IDs
  
  // Preview
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      fetchChannels(userData.id);
      fetchLandingPages(userData.id);
      fetchStudents(userData.id);
      
      // Check for channelId in URL
      const params = new URLSearchParams(window.location.search);
      const channelId = params.get('channelId');
      if (channelId) {
        setSelectedChannel(channelId);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchStudents = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        console.warn('Students API failed, using empty list');
        setStudents([]);
        return;
      }
      const data = await response.json();
      console.log('📋 Students data received:', data);
      if (data.success) {
        // Map phone to phoneNumber for consistency
        const mappedStudents = (data.students || []).map((s: any) => ({
          ...s,
          phoneNumber: s.phoneNumber || s.phone // Support both field names
        }));
        
        // Filter active students with valid phone numbers
        const validStudents = mappedStudents.filter((s: any) => 
          (!s.status || s.status === 'ACTIVE') && s.phoneNumber
        );
        console.log(`✅ Loaded ${validStudents.length} students`);
        setStudents(validStudents);
      } else {
        console.warn('⚠️ Students API returned unsuccessful:', data);
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchTemplates(selectedChannel);
    }
  }, [selectedChannel]);

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, recipients, selectedLandingPage, selectedStudents, inputMode, students, templates]);

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
        const userTemplates = data.templates || [];
        
        // Use only user templates (removed default templates)
        setTemplates(userTemplates);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const fetchLandingPages = async (userId: string) => {
    try {
      const response = await fetch(`/api/landing/list?userId=${userId}`);
      if (!response.ok) {
        console.warn('Landing pages API failed, using empty list');
        setLandingPages([]);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setLandingPages(data.landingPages || []);
      }
    } catch (err) {
      console.error('Failed to fetch landing pages:', err);
      setLandingPages([]);
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Map excel data - 학생 이메일, 학부모 이름, 학부모 전화번호
        const excelRecipients = jsonData.map((row: any) => ({
          studentEmail: row['학생이메일'] || row['studentEmail'] || row['이메일'] || row['email'] || '',
          parentName: row['학부모이름'] || row['parentName'] || row['이름'] || row['name'] || '',
          parentPhone: String(row['학부모연락처'] || row['parentPhone'] || row['전화번호'] || row['phone'] || row['휴대폰'] || '').replace(/[^0-9]/g, '')
        })).filter(r => r.studentEmail && r.parentPhone);

        if (excelRecipients.length === 0) {
          alert('엑셀 파일에서 학생 이메일과 학부모 연락처를 찾을 수 없습니다.\n\n필수 컬럼:\n- 학생이메일 (또는 studentEmail, 이메일, email)\n- 학부모연락처 (또는 parentPhone, 전화번호, phone)\n- 학부모이름 (또는 parentName, 이름, name)');
          return;
        }

        // API를 통해 학생 정보 및 최신 랜딩페이지 URL 가져오기
        setLoading(true);
        setError('엑셀 데이터를 처리하는 중...');

        const response = await fetch('/api/kakao/bulk-prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: excelRecipients,
            academyId: user.academyId
          })
        });

        const result = await response.json();

        if (!result.success) {
          alert('데이터 처리 실패: ' + result.error);
          setLoading(false);
          setError('');
          return;
        }

        // 성공적으로 매칭된 수신자만 설정
        const readyRecipients = result.recipients.filter((r: any) => r.status === 'READY');
        
        const mappedRecipients: Recipient[] = readyRecipients.map((r: any) => ({
          name: r.parentName,
          phone: r.parentPhone,
          landingPageUrl: r.landingPageUrl,
          studentId: r.studentId,
          studentName: r.studentName,
          studentEmail: r.studentEmail
        }));

        setRecipients(mappedRecipients);
        setLoading(false);
        setError('');

        // 결과 요약
        const { stats } = result;
        let message = `✅ 총 ${stats.total}명 중 ${stats.ready}명 처리 완료\n\n`;
        
        if (stats.notFound > 0) {
          message += `⚠️ 학생을 찾을 수 없음: ${stats.notFound}명\n`;
        }
        if (stats.noReport > 0) {
          message += `⚠️ 리포트가 없음: ${stats.noReport}명\n`;
        }
        if (stats.missingInfo > 0) {
          message += `⚠️ 정보 누락: ${stats.missingInfo}명\n`;
        }
        if (stats.error > 0) {
          message += `❌ 오류 발생: ${stats.error}명\n`;
        }

        message += `\n각 학생의 최신 랜딩페이지 URL이 자동으로 설정되었습니다.`;
        
        alert(message);

      } catch (err) {
        console.error('Excel parsing error:', err);
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        setLoading(false);
        setError('');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 실제 학생 데이터 가져오기
      const response = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const studentList = data.students || [];
        
        if (studentList.length > 0) {
          // 실제 학생 데이터로 템플릿 생성
          const template = studentList.map((student: any) => ({
            '학생이메일': student.email || '',
            '학부모이름': '', // 빈 칸으로 남김
            '학부모연락처': '', // 빈 칸으로 남김
          }));
          
          const worksheet = XLSX.utils.json_to_sheet(template);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
          XLSX.writeFile(workbook, '알림톡발송_템플릿.xlsx');
          
          alert(`✅ ${studentList.length}명의 학생 데이터로 템플릿이 생성되었습니다.`);
        } else {
          // 학생이 없으면 샘플 템플릿 제공
          const template = [
            { '학생이메일': 'student1@example.com', '학부모이름': '', '학부모연락처': '' },
            { '학생이메일': 'student2@example.com', '학부모이름': '', '학부모연락처': '' },
          ];
          
          const worksheet = XLSX.utils.json_to_sheet(template);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
          XLSX.writeFile(workbook, '알림톡발송_템플릿.xlsx');
          
          alert('ℹ️ 등록된 학생이 없어 샘플 템플릿을 제공합니다.');
        }
      } else {
        throw new Error('학생 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
      
      // 오류 시 샘플 템플릿 제공
      const template = [
        { '학생이메일': 'student1@example.com', '학부모이름': '', '학부모연락처': '' },
        { '학생이메일': 'student2@example.com', '학부모이름': '', '학부모연락처': '' },
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(template);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
      XLSX.writeFile(workbook, '알림톡발송_템플릿.xlsx');
      
      alert('⚠️ 학생 데이터 로딩 실패. 샘플 템플릿을 제공합니다.');
    }
  };

  const updatePreview = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      setPreviewMessage('');
      return;
    }

    // Get first recipient for preview
    let recipient: any;
    let studentId: string | undefined;
    
    if (inputMode === 'students' && selectedStudents.length > 0) {
      const student = students.find(s => s.id === selectedStudents[0]);
      if (student) {
        recipient = { name: student.name, phone: student.phoneNumber };
        studentId = student.id;
      }
    } else if (recipients.length > 0 && recipients[0].name && recipients[0].phone) {
      recipient = recipients[0];
    }

    // Even without a recipient, show template content
    let message = template.content;
    
    // If we have a recipient, replace variables
    if (recipient && recipient.name) {

      // Replace #{name} variable with recipient name
      message = message.replace(/#{name}/g, recipient.name)
                      .replace(/#{이름}/g, recipient.name)
                      .replace(/#{학생이름}/g, recipient.name);
    } else {
      // No recipient - show placeholder
      message = message.replace(/#{name}/g, '[수신자 이름]')
                      .replace(/#{이름}/g, '[수신자 이름]')
                      .replace(/#{학생이름}/g, '[학생 이름]');
    }

    // Replace #{url} variable with landing page URL
    if (selectedLandingPage) {
      const landingPage = landingPages.find(lp => lp.id === selectedLandingPage);
      if (landingPage) {
        // Generate URL based on whether it's a student or manual entry
        let uniqueUrl;
        if (studentId) {
          uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?studentId=${studentId}&ref=preview`;
        } else if (recipient && recipient.name) {
          uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${encodeURIComponent(recipient.name)}&ref=preview`;
        } else {
          uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?ref=preview`;
        }
        
        message = message.replace(/#{url}/g, uniqueUrl)
                        .replace(/#{URL}/g, uniqueUrl)
                        .replace(/#{리포트URL}/g, uniqueUrl)
                        .replace(/#{링크}/g, uniqueUrl);
      }
    } else {
      // No landing page selected - show placeholder for URL variables
      message = message.replace(/#{url}/g, '[랜딩페이지 URL]')
                      .replace(/#{URL}/g, '[랜딩페이지 URL]')
                      .replace(/#{리포트URL}/g, '[랜딩페이지 URL]')
                      .replace(/#{링크}/g, '[랜딩페이지 URL]');
    }

    setPreviewMessage(message);
  };

  const handleSend = async () => {
    if (!selectedChannel || !selectedTemplate) {
      alert('채널과 템플릿을 선택해주세요.');
      return;
    }

    // 랜딩페이지는 선택 사항이므로 체크 제거

    // Get recipients based on input mode
    let validRecipients: any[] = [];
    
    if (inputMode === 'students') {
      // Use selected students from DB
      validRecipients = students
        .filter(s => selectedStudents.includes(s.id))
        .map(student => ({
          name: student.name,
          phoneNumber: student.phoneNumber.replace(/[^0-9]/g, ''),
          studentId: student.id
        }));
    } else {
      // Use manually entered or excel uploaded recipients
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

      // Prepare recipients with landing page URLs
      const landingPage = selectedLandingPage ? landingPages.find(lp => lp.id === selectedLandingPage) : null;
      
      const preparedRecipients = validRecipients.map((recipient, index) => {
        // Generate unique URL for each recipient with student ID if available
        let uniqueUrl = undefined;
        if (landingPage) {
          if (recipient.studentId) {
            // Use student ID for DB students
            uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?studentId=${recipient.studentId}&ref=${Date.now()}_${index}`;
          } else {
            // Use name and phone for manually entered recipients
            uniqueUrl = `https://superplacestudy.pages.dev/landing/${landingPage.id}?student=${encodeURIComponent(recipient.name)}&phone=${recipient.phoneNumber}&ref=${Date.now()}_${index}`;
          }
        }
        
        return {
          name: recipient.name,
          phoneNumber: recipient.phoneNumber,
          studentId: recipient.studentId,
          landingPageUrl: uniqueUrl
        };
      });

      console.log('📤 Sending to recipients:', preparedRecipients);

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
                <Select value={selectedLandingPage || "none"} onValueChange={(val) => setSelectedLandingPage(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="랜딩페이지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안 함</SelectItem>
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
                  <Upload className="mr-2 h-4 w-4" />
                  엑셀
                </Button>
              </div>

              {inputMode === 'students' ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-2">
                    DB에서 등록된 학생을 선택하세요 ({students.length}명)
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
              ) : inputMode === 'manual' ? (
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
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        엑셀 파일을 선택하세요
                      </p>
                      <p className="text-xs text-gray-500">
                        필수 컬럼: <span className="font-semibold">학생이메일</span>, <span className="font-semibold">학부모이름</span>, <span className="font-semibold">학부모연락처</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 각 학생의 최신 랜딩페이지 URL이 자동으로 설정됩니다
                      </p>
                    </div>
                  </label>
                  
                  {/* 템플릿 다운로드 버튼 */}
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full mt-3"
                    type="button"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    엑셀 템플릿 다운로드
                  </Button>
                  
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
            disabled={
              sending || 
              !selectedChannel || 
              !selectedTemplate || 
              (inputMode === 'students' ? selectedStudents.length === 0 : recipients.filter(r => r.name && r.phone).length === 0)
            }
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
                {inputMode === 'students' 
                  ? `${selectedStudents.length}명에게 발송` 
                  : `${recipients.filter(r => r.name && r.phone).length}명에게 발송`
                }
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

          {(inputMode === 'students' ? selectedStudents.length > 0 : recipients.filter(r => r.name && r.phone).length > 0) && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>수신자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inputMode === 'students' ? (
                    selectedStudents.map((studentId) => {
                      const student = students.find(s => s.id === studentId);
                      if (!student) return null;
                      return (
                        <div key={studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-gray-600 ml-2">{student.phoneNumber}</span>
                          </div>
                          {selectedLandingPage && (
                            <span className="text-xs text-blue-600">🔗 개인 URL</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    recipients.filter(r => r.name && r.phone).map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-sm text-gray-600 ml-2">{recipient.phone}</span>
                        </div>
                        {selectedLandingPage && (
                          <span className="text-xs text-blue-600">🔗 개인 URL</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
