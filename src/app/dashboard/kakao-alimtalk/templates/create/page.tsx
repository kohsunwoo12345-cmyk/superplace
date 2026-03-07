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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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

        {/* 메시지 유형 (4개 모두 표시) */}
        <Card>
          <CardHeader>
            <CardTitle>4. 메시지 유형</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  messageType === 'BA' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setMessageType('BA')}
              >
                <div className="font-semibold">BA - 기본형</div>
                <div className="text-sm text-gray-600">일반 알림톡</div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  messageType === 'EX' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setMessageType('EX')}
              >
                <div className="font-semibold">EX - 부가정보형</div>
                <div className="text-sm text-gray-600">강조 표시 추가</div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  messageType === 'AD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setMessageType('AD')}
              >
                <div className="font-semibold">AD - 광고추가형</div>
                <div className="text-sm text-gray-600">광고 문구 포함</div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  messageType === 'MI' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setMessageType('MI')}
              >
                <div className="font-semibold">MI - 복합형</div>
                <div className="text-sm text-gray-600">여러 정보 포함</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 강조 유형 (3개 모두 표시) */}
        <Card>
          <CardHeader>
            <CardTitle>5. 강조 유형</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  emphasizeType === 'NONE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setEmphasizeType('NONE')}
              >
                <div className="font-semibold">NONE</div>
                <div className="text-sm text-gray-600">강조 없음</div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  emphasizeType === 'TEXT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setEmphasizeType('TEXT')}
              >
                <div className="font-semibold">TEXT</div>
                <div className="text-sm text-gray-600">텍스트 강조</div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  emphasizeType === 'IMAGE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setEmphasizeType('IMAGE')}
              >
                <div className="font-semibold">IMAGE</div>
                <div className="text-sm text-gray-600">이미지 강조</div>
              </div>
            </div>

            {emphasizeType !== 'NONE' && (
              <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>강조 제목</Label>
                  <Input
                    value={emphasizeTitle}
                    onChange={e => setEmphasizeTitle(e.target.value)}
                    placeholder="강조 제목 (최대 23자)"
                    maxLength={23}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>강조 부제목</Label>
                  <Input
                    value={emphasizeSubtitle}
                    onChange={e => setEmphasizeSubtitle(e.target.value)}
                    placeholder="강조 부제목"
                    className="mt-1"
                  />
                </div>
                {emphasizeType === 'IMAGE' && (
                  <div>
                    <Label>이미지 URL</Label>
                    <Input
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>6. 버튼 (선택사항)</span>
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
                      {btn.type === 'AL' && (
                        <>
                          <div>
                            <Label>iOS 스킴</Label>
                            <Input
                              value={btn.linkIos || ''}
                              onChange={e => updateButton(index, 'linkIos', e.target.value)}
                              placeholder="myapp://"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Android 스킴</Label>
                            <Input
                              value={btn.linkAnd || ''}
                              onChange={e => updateButton(index, 'linkAnd', e.target.value)}
                              placeholder="myapp://"
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}
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

        {/* 보안 템플릿 */}
        <Card>
          <CardHeader>
            <CardTitle>7. 보안 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="security"
                checked={securityFlag}
                onCheckedChange={(checked) => setSecurityFlag(!!checked)}
              />
              <label htmlFor="security" className="text-sm cursor-pointer">
                보안 템플릿으로 등록 (OTP, 인증번호 등)
              </label>
            </div>
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
  );
}
