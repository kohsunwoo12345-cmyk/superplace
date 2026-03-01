"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface KakaoChannel {
  id: string;
  searchId: string;
  channelName: string;
  solapiChannelId: string;
}

interface TemplateButton {
  name: string;
  type: 'WL' | 'AL' | 'BK' | 'MD' | 'BC' | 'BT' | 'AC';
  url?: string;
  schemeIos?: string;
  schemeAndroid?: string;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [selectedChannel, setSelectedChannel] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [content, setContent] = useState('');
  const [extra, setExtra] = useState('');
  const [messageType, setMessageType] = useState<'BA' | 'EX' | 'AD' | 'MI'>('BA');
  const [emphasizeType, setEmphasizeType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST'>('NONE');
  const [securityFlag, setSecurityFlag] = useState(false);
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const [inspectorComment, setInspectorComment] = useState('');
  const [variables, setVariables] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchChannels();
  }, [user, authLoading]);

  // Extract variables from content
  useEffect(() => {
    const regex = /#\{([^}]+)\}/g;
    const matches = content.matchAll(regex);
    const found = Array.from(matches, m => m[1]);
    setVariables([...new Set(found)]);
  }, [content]);

  const fetchChannels = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
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

  const addButton = () => {
    if (buttons.length >= 5) {
      alert('버튼은 최대 5개까지만 추가할 수 있습니다.');
      return;
    }
    setButtons([...buttons, { name: '', type: 'WL', url: '' }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: keyof TemplateButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel) {
      alert('채널을 선택해주세요.');
      return;
    }

    if (!templateName || !content) {
      alert('템플릿 이름과 내용은 필수입니다.');
      return;
    }

    const channel = channels.find(ch => ch.id === selectedChannel);
    if (!channel) {
      alert('선택한 채널을 찾을 수 없습니다.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const templateData = {
        userId: user?.id,
        channelId: channel.id,
        solapiChannelId: channel.solapiChannelId,
        templateCode: templateCode || `TPL_${Date.now()}`,
        templateName,
        content,
        extra: extra || undefined,
        messageType,
        emphasizeType: emphasizeType === 'NONE' ? undefined : emphasizeType,
        securityFlag,
        buttons: buttons.length > 0 ? buttons : undefined,
        inspectorComment: inspectorComment || undefined,
        variables: variables.length > 0 ? variables : undefined
      };

      console.log('📤 Submitting template:', templateData);

      const response = await fetch('/api/kakao/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ 템플릿이 등록되었습니다! 카카오 검수가 완료되면 사용할 수 있습니다.');
        setTimeout(() => {
          router.push('/dashboard/kakao-alimtalk/templates');
        }, 2000);
      } else {
        setError(data.error || '템플릿 등록에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to create template:', err);
      setError('템플릿 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <Link href="/dashboard/kakao-alimtalk/templates">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            템플릿 목록으로
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">알림톡 템플릿 등록</h1>
        <p className="text-gray-600">
          새로운 알림톡 템플릿을 등록합니다. 등록 후 카카오 검수가 진행됩니다.
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>채널과 템플릿 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="channel">카카오 채널 *</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
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
              {channels.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  등록된 채널이 없습니다. <Link href="/dashboard/kakao-channel/register" className="underline">채널을 먼저 등록하세요</Link>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="templateName">템플릿 이름 *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="예: 회원가입 환영"
                maxLength={50}
              />
              <p className="text-sm text-gray-500 mt-1">수신자에게 공개되지 않습니다. 추후 변경 가능!</p>
            </div>

            <div>
              <Label htmlFor="templateCode">템플릿 코드 (선택)</Label>
              <Input
                id="templateCode"
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                placeholder="입력하지 않으면 자동 생성됩니다"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>템플릿 유형</CardTitle>
            <CardDescription>메시지 유형과 강조 유형을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>메시지 유형</Label>
              <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BA">기본형 (Basic)</SelectItem>
                  <SelectItem value="EX">부가정보형 (Extra)</SelectItem>
                  <SelectItem value="AD">채널추가형 (Ad)</SelectItem>
                  <SelectItem value="MI">복합형 (Mixed)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {messageType === 'BA' && '고객에게 반드시 전달되어야 하는 정보'}
                {messageType === 'EX' && '고정적인 부가 정보 안내가 필요한 경우'}
                {messageType === 'AD' && '카카오톡 채널 추가가 포함된 경우'}
                {messageType === 'MI' && '부가정보형과 채널추가형을 동시에 사용'}
              </p>
            </div>

            <div>
              <Label>강조 유형</Label>
              <Select value={emphasizeType} onValueChange={(v: any) => setEmphasizeType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">없음</SelectItem>
                  <SelectItem value="TEXT">강조표기형</SelectItem>
                  <SelectItem value="IMAGE">이미지형</SelectItem>
                  <SelectItem value="ITEM_LIST">아이템리스트형</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="security"
                checked={securityFlag}
                onCheckedChange={(checked) => setSecurityFlag(checked as boolean)}
              />
              <Label htmlFor="security" className="cursor-pointer">
                보안 템플릿 사용 (비밀번호, 인증번호 등 민감 정보 포함 시)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>템플릿 내용</CardTitle>
            <CardDescription>알림톡 본문 내용을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={'예:\n#{학생이름}님의 성과 리포트가 준비되었습니다.\n\n아래 링크에서 확인하세요!\n#{리포트URL}'}
                rows={10}
                maxLength={1000}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>변수 형식: #{'{'} 변수명 {'}'} (예: #{'{'} 학생이름 {'}'})</span>
                <span>{content.length} / 1,000자</span>
              </div>
            </div>

            {variables.length > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>사용 중인 변수:</strong> {variables.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {(messageType === 'EX' || messageType === 'MI') && (
              <div>
                <Label htmlFor="extra">부가 정보 (선택)</Label>
                <Textarea
                  id="extra"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="예: 고객센터 운영시간: 오전 9시 ~ 오후 5시"
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">변수 사용 불가, 최대 1,000자</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림톡 버튼 (선택)</CardTitle>
            <CardDescription>최대 5개까지 추가할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {buttons.map((button, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">버튼 {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>버튼명</Label>
                    <Input
                      value={button.name}
                      onChange={(e) => updateButton(index, 'name', e.target.value)}
                      placeholder="예: 리포트 보기"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <Label>버튼 타입</Label>
                    <Select 
                      value={button.type} 
                      onValueChange={(v) => updateButton(index, 'type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WL">웹링크 (WL)</SelectItem>
                        <SelectItem value="AL">앱링크 (AL)</SelectItem>
                        <SelectItem value="BK">봇키워드 (BK)</SelectItem>
                        <SelectItem value="MD">메시지전달 (MD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {button.type === 'WL' && (
                  <div>
                    <Label>웹 URL</Label>
                    <Input
                      value={button.url || ''}
                      onChange={(e) => updateButton(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {button.type === 'AL' && (
                  <>
                    <div>
                      <Label>iOS 스킴</Label>
                      <Input
                        value={button.schemeIos || ''}
                        onChange={(e) => updateButton(index, 'schemeIos', e.target.value)}
                        placeholder="myapp://"
                      />
                    </div>
                    <div>
                      <Label>Android 스킴</Label>
                      <Input
                        value={button.schemeAndroid || ''}
                        onChange={(e) => updateButton(index, 'schemeAndroid', e.target.value)}
                        placeholder="myapp://"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}

            {buttons.length < 5 && (
              <Button type="button" variant="outline" onClick={addButton} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                버튼 추가
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>검수자 참고 의견 (선택)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inspectorComment}
              onChange={(e) => setInspectorComment(e.target.value)}
              placeholder="예: 솔라피 알림 수신에 동의한 신규 가입 회원에게만 발송하는 안내메시지"
              rows={3}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              카카오측 검수자가 참고할 의견입니다. 수신자에게 보이지 않습니다. ({inspectorComment.length}/500)
            </p>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            <strong>반드시 확인해주세요:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>정확한 수신대상 및 수신사유를 검수자가 확인하기 어려운 경우</li>
              <li>불특정 다수에게 발송될 수 있는 홍보 및 광고성 문구 포함</li>
              <li>혜택 제공을 조건으로 개인정보 등록 등 특정 행위를 유도</li>
              <li>앱 설치를 유도하는 문구 포함</li>
            </ul>
            <p className="mt-2">위 항목에 해당하는 경우 템플릿이 반려될 수 있습니다.</p>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/kakao-alimtalk/templates')}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={submitting || channels.length === 0}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '등록 완료 후 즉시 검수요청'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
