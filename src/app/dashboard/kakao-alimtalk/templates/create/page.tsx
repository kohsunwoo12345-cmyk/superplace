"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Channel {
  id: string;
  channelName: string;
  solapiChannelId: string;
}

interface CategoryGroup {
  groupCode: string;
  groupName: string;
  categories: { code: string; name: string; }[];
}

interface ButtonType {
  type: string;
  name: string;
  description: string;
  requiresUrl: boolean;
  urlFields: string[];
}

interface TemplateButton {
  ordering: number;
  type: string;
  name: string;
  linkMo?: string;
  linkPc?: string;
  linkIos?: string;
  linkAnd?: string;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data from APIs
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [buttonTypes, setButtonTypes] = useState<ButtonType[]>([]);

  // Form fields
  const [selectedChannel, setSelectedChannel] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [content, setContent] = useState('');
  
  // Category
  const [selectedGroupCode, setSelectedGroupCode] = useState('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('');
  
  // Message Types (모두 표시)
  const [messageType, setMessageType] = useState<'BA' | 'EX' | 'AD' | 'MI'>('BA');
  
  // Emphasize Types (모두 표시)
  const [emphasizeType, setEmphasizeType] = useState<'NONE' | 'TEXT' | 'IMAGE'>('NONE');
  const [emphasizeTitle, setEmphasizeTitle] = useState('');
  const [emphasizeSubtitle, setEmphasizeSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Security
  const [securityFlag, setSecurityFlag] = useState(false);
  
  // Buttons
  const [buttons, setButtons] = useState<TemplateButton[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    Promise.all([
      fetchChannels(userData.id),
      fetchCategories(),
      fetchButtonTypes()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchChannels = async (userId: string) => {
    try {
      const response = await fetch(`/api/kakao/channels?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/kakao/categories');
      const data = await response.json();
      if (data.success) {
        setCategoryGroups(data.categoryGroups || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchButtonTypes = async () => {
    try {
      const response = await fetch('/api/kakao/button-types');
      const data = await response.json();
      if (data.success) {
        setButtonTypes(data.buttonTypes || []);
      }
    } catch (err) {
      console.error('Failed to fetch button types:', err);
    }
  };

  const addButton = () => {
    if (buttons.length >= 5) {
      alert('버튼은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    setButtons([...buttons, {
      ordering: buttons.length + 1,
      type: 'WL',
      name: '',
      linkMo: '',
      linkPc: ''
    }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: string, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel || !templateCode || !templateName || !content || !selectedCategoryCode) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const channel = channels.find(c => c.id === selectedChannel);
      if (!channel) {
        setError('채널 정보를 찾을 수 없습니다.');
        return;
      }

      // Prepare extra field for emphasize
      let extra: any = null;
      if (emphasizeType === 'TEXT') {
        extra = {
          title: emphasizeTitle,
          description: emphasizeSubtitle
        };
      } else if (emphasizeType === 'IMAGE') {
        extra = {
          title: emphasizeTitle,
          description: emphasizeSubtitle,
          imageUrl: imageUrl
        };
      }

      const payload = {
        userId: user.id,
        channelId: selectedChannel,
        pfId: channel.solapiChannelId,
        templateCode: templateCode,
        templateName: templateName,
        content: content,
        categoryCode: selectedCategoryCode,
        messageType: messageType,
        emphasizeType: emphasizeType,
        extra: extra,
        buttons: buttons.filter(btn => btn.name.trim()),
        securityFlag: securityFlag
      };

      console.log('📤 템플릿 등록 요청:', payload);

      const response = await fetch('/api/kakao/templates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ ${data.message}`);
        alert(`템플릿이 등록되었습니다!\n\n템플릿 코드: ${templateCode}\n상태: ${data.template?.status || 'REG'}\n\n카카오 검수 승인 후 사용 가능합니다.`);
        setTimeout(() => router.push('/dashboard/kakao-alimtalk/templates'), 2000);
      } else {
        setError(`템플릿 등록 실패: ${data.error}\n${data.details || ''}`);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError('템플릿 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected button type info
  const getButtonTypeInfo = (type: string) => {
    return buttonTypes.find(bt => bt.type === type);
  };

  // Get categories for selected group
  const getCategories = () => {
    if (!selectedGroupCode) return [];
    const group = categoryGroups.find(g => g.groupCode === selectedGroupCode);
    return group?.categories || [];
  };

  // 변수를 실제 값으로 치환하는 함수
  const replaceVariables = (text: string) => {
    return text
      .replace(/#{학부모이름}/g, '김영희')
      .replace(/#{학생이름}/g, '김민수')
      .replace(/#{과목}/g, '수학')
      .replace(/#{제출시간}/g, '오후 3:00')
      .replace(/#{날짜}/g, '3월 8일')
      .replace(/#{시간}/g, '오후 5:00')
      .replace(/#{준비물}/g, '교재, 필기구')
      .replace(/#{이름}/g, '김민수')
      .replace(/#{리포트URL}/g, 'https://superplace.com/report')
      .replace(/#\{([^}]+)\}/g, '[$1]'); // 나머지 변수는 [변수명] 형태로
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </Button>
        <h1 className="text-3xl font-bold">알림톡 템플릿 등록</h1>
        <p className="text-gray-600 mt-2">
          Solapi를 통해 카카오 알림톡 템플릿을 등록합니다.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 입력 폼 */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 채널 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>1. 카카오 채널 선택 *</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="채널을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.channelName} ({ch.solapiChannelId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>2. 기본 정보 *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateCode">템플릿 코드 *</Label>
                  <Input
                    id="templateCode"
                    placeholder="예: TEST_001, ATTENDANCE_01"
                    value={templateCode}
                    onChange={e => setTemplateCode(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    영문 대문자, 숫자, 언더스코어(_)만 사용 가능 (Solapi 템플릿 ID로 자동 사용됨)
                  </p>
                </div>

                <div>
                  <Label htmlFor="templateName">템플릿 이름 *</Label>
                  <Input
                    id="templateName"
                    placeholder="예: 출석 안내 템플릿"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="content">템플릿 내용 *</Label>
                  <Textarea
                    id="content"
                    placeholder={"안녕하세요, #{이름}님!\n\n오늘의 출석 안내입니다.\n상세 내용: #{리포트URL}"}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={8}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    변수는 #&#123;변수명&#125; 형식으로 입력 (예: #&#123;이름&#125;, #&#123;리포트URL&#125;)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 카테고리 */}
            <Card>
              <CardHeader>
                <CardTitle>3. 카테고리 *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>카테고리 그룹 *</Label>
                  <Select value={selectedGroupCode} onValueChange={(val) => {
                    setSelectedGroupCode(val);
                    setSelectedCategoryCode(''); // Reset category
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="카테고리 그룹 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryGroups.map(group => (
                        <SelectItem key={group.groupCode} value={group.groupCode}>
                          {group.groupName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGroupCode && (
                  <div>
                    <Label>카테고리 *</Label>
                    <Select value={selectedCategoryCode} onValueChange={setSelectedCategoryCode}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategories().map(cat => (
                          <SelectItem key={cat.code} value={cat.code}>
                            {cat.name} ({cat.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 버튼 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>4. 버튼 (선택사항)</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addButton}
                    disabled={buttons.length >= 5}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    버튼 추가
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buttons.map((btn, index) => {
                  const btnTypeInfo = getButtonTypeInfo(btn.type);
                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">버튼 {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>버튼 타입</Label>
                          <Select
                            value={btn.type}
                            onValueChange={val => updateButton(index, 'type', val)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {buttonTypes.map(bt => (
                                <SelectItem key={bt.type} value={bt.type}>
                                  {bt.name} ({bt.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {btnTypeInfo?.description}
                          </p>
                        </div>

                        <div>
                          <Label>버튼 이름</Label>
                          <Input
                            value={btn.name}
                            onChange={e => updateButton(index, 'name', e.target.value)}
                            placeholder="버튼 이름"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {btnTypeInfo?.requiresUrl && (
                        <div className="space-y-2">
                          <div>
                            <Label>모바일 링크</Label>
                            <Input
                              value={btn.linkMo || ''}
                              onChange={e => updateButton(index, 'linkMo', e.target.value)}
                              placeholder="https://..."
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>PC 링크</Label>
                            <Input
                              value={btn.linkPc || ''}
                              onChange={e => updateButton(index, 'linkPc', e.target.value)}
                              placeholder="https://..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {buttons.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    버튼을 추가하려면 "버튼 추가" 버튼을 클릭하세요.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={submitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '템플릿 등록'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* 오른쪽: 카카오톡 미리보기 */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>📱 카카오톡 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* 카카오톡 미리보기 */}
              <div className="bg-[#BACEE0] rounded-b-lg overflow-hidden" style={{ fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif" }}>
                {/* 상태 표시줄 */}
                <div className="flex justify-between items-center px-5 py-2 text-xs font-medium text-gray-800">
                  <span>15:00</span>
                  <div className="flex gap-1.5 items-center">
                    <span>📶</span>
                    <span>📡</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* 헤더 */}
                <div className="flex items-center justify-between px-3 py-2 mb-2">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-700 px-2">
                      ‹
                    </button>
                    <div className="flex items-center gap-1">
                      <h1 className="font-semibold text-gray-800 text-lg">
                        {selectedChannelData?.channelName || '채널명'}
                      </h1>
                      <span className="bg-[#d1d5da] text-white text-[9px] px-1 py-0.5 rounded-sm font-bold">ch</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-700 px-2">
                    <span>🔍</span>
                    <span>☰</span>
                  </div>
                </div>

                {/* 채팅 영역 */}
                <div className="px-4 pb-4 max-h-[600px] overflow-y-auto">
                  {/* 날짜 구분선 */}
                  <div className="flex justify-center my-2">
                    <div className="bg-black/10 text-white text-xs px-4 py-1.5 rounded-full font-medium">
                      2026년 3월 8일 일요일
                    </div>
                  </div>

                  {/* 알림톡 메시지 */}
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {selectedChannelData?.channelName?.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs text-gray-600 font-medium">
                        {selectedChannelData?.channelName || '채널명'}
                      </span>
                      <div className="flex items-end gap-1">
                        <div className="bg-white rounded-lg max-w-[280px] shadow-sm">
                          {/* 알림톡 본문 */}
                          <div className="p-3.5 text-[0.9rem] leading-snug">
                            {templateName && (
                              <div className="font-bold text-base mb-2">
                                {templateName}
                              </div>
                            )}
                            {content ? (
                              <div className="text-gray-800 whitespace-pre-wrap">
                                {replaceVariables(content)}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic">
                                템플릿 내용을 입력하세요...
                              </div>
                            )}
                          </div>
                          
                          {/* 알림톡 버튼 */}
                          {buttons.length > 0 && (
                            <div className="border-t border-gray-200 bg-gray-50 rounded-b-lg overflow-hidden">
                              {buttons.map((btn, idx) => (
                                <div key={idx}>
                                  {idx > 0 && <div className="h-[1px] bg-gray-200 w-full"></div>}
                                  <button className="py-3 text-sm font-medium text-gray-700 w-full hover:bg-gray-100">
                                    {btn.name || `버튼 ${idx + 1}`}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[0.7rem] text-gray-600 mb-0.5 whitespace-nowrap">오후 3:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 입력창 */}
                <div className="p-2 pb-6 bg-[#f5f5f5]">
                  <div className="flex items-center justify-center p-2">
                    <span className="text-sm text-gray-400">채팅이 불가능한 채널입니다.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
