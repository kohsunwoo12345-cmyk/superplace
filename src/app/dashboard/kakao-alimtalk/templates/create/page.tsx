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
import { Loader2, Plus, Trash2, ArrowLeft, Eye, Image as ImageIcon } from 'lucide-react';
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
  urlMobile?: string;
  urlPc?: string;
  schemeIos?: string;
  schemeAndroid?: string;
}

interface ItemHighlight {
  title: string;
  description: string;
}

interface Item {
  list: {
    title: string;
    description: string;
  }[];
  summary: {
    title: string;
    description: string;
  };
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [channels, setChannels] = useState<KakaoChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Basic fields
  const [selectedChannel, setSelectedChannel] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [content, setContent] = useState('');
  const [extra, setExtra] = useState('');
  
  // Message type
  const [messageType, setMessageType] = useState<'BA' | 'EX' | 'AD' | 'MI'>('BA');
  
  // Emphasize type
  const [emphasizeType, setEmphasizeType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST'>('NONE');
  const [emphasizeTitle, setEmphasizeTitle] = useState('');
  const [emphasizeSubtitle, setEmphasizeSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Item list (for ITEM_LIST type)
  const [itemHighlight, setItemHighlight] = useState<ItemHighlight>({ title: '', description: '' });
  const [items, setItems] = useState<Item>({
    list: [],
    summary: { title: '', description: '' }
  });
  
  // Security & Preview
  const [securityFlag, setSecurityFlag] = useState(false);
  const [headerContent, setHeaderContent] = useState(''); // 미리보기 메시지
  
  // Buttons
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  
  // Comments
  const [inspectorComment, setInspectorComment] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  
  // Variables
  const [variables, setVariables] = useState<string[]>([]);
  
  // Channel addition (for AD, MI types)
  const [channelAddButton, setChannelAddButton] = useState(false);

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

  const addItemListItem = () => {
    if (items.list.length >= 10) {
      alert('아이템은 최대 10개까지 추가할 수 있습니다.');
      return;
    }
    setItems({
      ...items,
      list: [...items.list, { title: '', description: '' }]
    });
  };

  const removeItemListItem = (index: number) => {
    setItems({
      ...items,
      list: items.list.filter((_, i) => i !== index)
    });
  };

  const updateItemListItem = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...items.list];
    updated[index] = { ...updated[index], [field]: value };
    setItems({ ...items, list: updated });
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

      const templateData: any = {
        userId: user?.id,
        channelId: channel.id,
        solapiChannelId: channel.solapiChannelId,
        templateCode: templateCode || `TPL_${Date.now()}`,
        templateName,
        content,
        messageType,
        securityFlag,
        categoryCode: categoryCode || undefined
      };

      // Extra info (for EX, MI types)
      if ((messageType === 'EX' || messageType === 'MI') && extra) {
        templateData.extra = extra;
      }

      // Emphasize
      if (emphasizeType !== 'NONE') {
        templateData.emphasizeType = emphasizeType;
        
        if (emphasizeType === 'TEXT') {
          templateData.emphasize = {
            title: emphasizeTitle,
            subtitle: emphasizeSubtitle
          };
        } else if (emphasizeType === 'IMAGE') {
          templateData.image = {
            imageUrl: imageUrl
          };
        } else if (emphasizeType === 'ITEM_LIST') {
          templateData.itemList = {
            header: itemHighlight,
            list: items.list,
            summary: items.summary
          };
        }
      }

      // Header (preview message)
      if (headerContent) {
        templateData.header = headerContent;
      }

      // Buttons
      if (buttons.length > 0) {
        templateData.buttons = buttons.filter(b => b.name && (b.url || b.schemeIos || b.schemeAndroid));
      }

      // Channel addition button (for AD, MI types)
      if ((messageType === 'AD' || messageType === 'MI') && channelAddButton) {
        templateData.channelAddButton = true;
      }

      // Comments
      if (inspectorComment) {
        templateData.inspectorComment = inspectorComment;
      }

      // Variables
      if (variables.length > 0) {
        templateData.variables = variables;
      }

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

  const getSelectedChannel = () => {
    return channels.find(ch => ch.id === selectedChannel);
  };

  // Kakao Talk Preview Component - 100% Accurate
  const KakaoPreview = () => {
    const channel = getSelectedChannel();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    return (
      <div className="sticky top-6">
        <div className="text-sm text-gray-600 mb-3 text-center font-medium">{dateStr}</div>
        
        {/* Kakao Talk Message Bubble - 실제 카카오톡 UI 재현 */}
        <div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200" 
          style={{ 
            maxWidth: '360px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {/* Header - 채널 정보 */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {channel?.channelName?.[0] || 'K'}
              </div>
              <div>
                <div className="font-semibold text-[15px] text-gray-900">{channel?.channelName || '채널명'}</div>
                <div className="text-[11px] text-gray-400 -mt-0.5">알림톡</div>
              </div>
            </div>
            <div className="text-[11px] text-gray-400 font-medium">{timeStr}</div>
          </div>

          {/* 광고 표기 (AD type) */}
          {messageType === 'AD' && (
            <div className="px-4 py-1.5 bg-orange-50 border-b border-orange-100 text-[11px] text-orange-600 font-medium">
              (광고)
            </div>
          )}

          {/* Preview message (header) */}
          {headerContent && (
            <div className="px-4 py-2.5 bg-yellow-50 border-b border-yellow-100 text-[13px] text-gray-700 leading-snug">
              {headerContent}
            </div>
          )}

          {/* Message Content */}
          <div className="px-4 py-4 bg-[#F8F9FA]">
            {/* Emphasize - IMAGE */}
            {emphasizeType === 'IMAGE' && imageUrl && (
              <div className="mb-3 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                <div className="aspect-[4/3] flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">이미지 영역</div>
                    <div className="text-[10px] text-gray-300 mt-1">800x600px 권장</div>
                  </div>
                </div>
              </div>
            )}

            {/* Emphasize - TEXT */}
            {emphasizeType === 'TEXT' && (emphasizeTitle || emphasizeSubtitle) && (
              <div className="mb-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                {emphasizeTitle && (
                  <div className="font-bold text-[16px] text-gray-900 mb-1.5 leading-tight">
                    {emphasizeTitle}
                  </div>
                )}
                {emphasizeSubtitle && (
                  <div className="text-[13px] text-gray-600 leading-relaxed">
                    {emphasizeSubtitle}
                  </div>
                )}
              </div>
            )}

            {/* Emphasize - ITEM_LIST */}
            {emphasizeType === 'ITEM_LIST' && (
              <div className="mb-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Item Highlight */}
                {(itemHighlight.title || itemHighlight.description) && (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    {itemHighlight.title && (
                      <div className="font-bold text-[14px] text-gray-900">{itemHighlight.title}</div>
                    )}
                    {itemHighlight.description && (
                      <div className="text-[12px] text-gray-600 mt-1">{itemHighlight.description}</div>
                    )}
                  </div>
                )}
                
                {/* Item List */}
                {items.list.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {items.list.map((item, i) => (
                      <div key={i} className="p-3.5 bg-white hover:bg-gray-50 transition-colors">
                        <div className="text-[13px] font-semibold text-gray-900 mb-1">
                          {item.title || `아이템 ${i + 1}`}
                        </div>
                        <div className="text-[12px] text-gray-600 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {(items.summary.title || items.summary.description) && (
                  <div className="p-3.5 bg-gray-50 border-t border-gray-200">
                    {items.summary.title && (
                      <div className="font-bold text-[13px] text-gray-900 mb-1">{items.summary.title}</div>
                    )}
                    {items.summary.description && (
                      <div className="text-[12px] text-gray-600">{items.summary.description}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Main Content - 실제 카카오톡 폰트 및 스타일 */}
            <div className="text-[14px] whitespace-pre-wrap leading-[1.6] text-gray-800 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {content || (
                <span className="text-gray-400 italic">
                  예시:
                  <br />#{'{'}학생이름{'}'}님의 성과 리포트가 준비되었습니다.
                  <br /><br />아래 링크에서 확인하세요!
                  <br />#{'{'}리포트URL{'}'}
                </span>
              )}
            </div>

            {/* Extra Info */}
            {(messageType === 'EX' || messageType === 'MI') && extra && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-[12px] text-gray-500 leading-relaxed bg-white px-4 py-3 rounded-xl shadow-sm">
                {extra}
              </div>
            )}

            {/* Buttons - 실제 카카오톡 버튼 스타일 */}
            {buttons.filter(b => b.name).length > 0 && (
              <div className="space-y-2 mt-3">
                {buttons.filter(b => b.name).map((button, i) => (
                  <button
                    key={i}
                    className="w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-[14px] font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-98"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {button.name}
                  </button>
                ))}
              </div>
            )}

            {/* Channel Add Button */}
            {(messageType === 'AD' || messageType === 'MI') && channelAddButton && (
              <div className="mt-3 p-3.5 bg-white rounded-xl border-2 border-yellow-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-gray-700 leading-tight flex-1 pr-3">
                    채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기
                  </div>
                  <button className="px-4 py-1.5 bg-yellow-400 text-white text-[12px] rounded-full font-bold hover:bg-yellow-500 transition-colors shadow-sm whitespace-nowrap">
                    추가
                  </button>
                </div>
              </div>
            )}

            {/* 수신거부 안내 (AD type) */}
            {messageType === 'AD' && (
              <div className="mt-3 text-[11px] text-gray-400 text-center leading-relaxed">
                무료 수신거부 080-000-0000
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            ℹ️ 미리보기는 실제 단말기와 차이가 있을 수 있습니다.
          </div>
        </div>

        {/* Variables Display */}
        {variables.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-[13px] font-bold mb-2.5 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              감지된 변수 ({variables.length}개)
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-white border-2 border-blue-300 text-blue-700 rounded-lg text-[12px] font-semibold shadow-sm"
                >
                  #{'{'}{ v}{'}'}
                </span>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
              💡 대량 발송 시 각 변수에 실제 값이 치환됩니다
            </div>
          </div>
        )}

        {/* Template Info Summary */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-[12px] font-bold text-gray-800 mb-2">템플릿 정보</div>
          <div className="text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">메시지 유형</span>
              <span className="font-semibold text-gray-800">
                {messageType === 'BA' && '기본형 (BA)'}
                {messageType === 'EX' && '부가정보형 (EX)'}
                {messageType === 'AD' && '채널추가형 (AD)'}
                {messageType === 'MI' && '복합형 (MI)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">강조 유형</span>
              <span className="font-semibold text-gray-800">
                {emphasizeType === 'NONE' && '없음'}
                {emphasizeType === 'TEXT' && '강조표기형'}
                {emphasizeType === 'IMAGE' && '이미지형'}
                {emphasizeType === 'ITEM_LIST' && '아이템리스트형'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">보안 템플릿</span>
              <span className="font-semibold text-gray-800">{securityFlag ? '✓ 예' : '아니오'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">버튼 개수</span>
              <span className="font-semibold text-gray-800">{buttons.filter(b => b.name).length}개</span>
            </div>
            {content && (
              <div className="flex justify-between">
                <span className="text-gray-500">내용 글자 수</span>
                <span className="font-semibold text-gray-800">{content.length} / 1,000</span>
              </div>
            )}
          </div>
        </div>
      </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
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
                  <p className="text-xs text-gray-500 mt-1">수신자에게 공개되지 않습니다</p>
                </div>

                <div>
                  <Label htmlFor="templateCode">템플릿 코드 (선택)</Label>
                  <Input
                    id="templateCode"
                    value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value)}
                    placeholder="자동 생성됩니다"
                  />
                </div>

                <div>
                  <Label htmlFor="categoryCode">카테고리 코드 (선택)</Label>
                  <Input
                    id="categoryCode"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    placeholder="예: 00200020001"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>템플릿 유형</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>메시지 유형</Label>
                  <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BA">기본형 (BA)</SelectItem>
                      <SelectItem value="EX">부가정보형 (EX)</SelectItem>
                      <SelectItem value="AD">채널추가형 (AD)</SelectItem>
                      <SelectItem value="MI">복합형 (MI)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="security" className="cursor-pointer text-sm">
                    보안 템플릿 (OTP, 비밀번호 등)
                  </Label>
                </div>

                {(messageType === 'AD' || messageType === 'MI') && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="channelAdd"
                      checked={channelAddButton}
                      onCheckedChange={(checked) => setChannelAddButton(checked as boolean)}
                    />
                    <Label htmlFor="channelAdd" className="cursor-pointer text-sm">
                      채널 추가 버튼 포함
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emphasize Fields */}
            {emphasizeType === 'TEXT' && (
              <Card>
                <CardHeader>
                  <CardTitle>강조 표기</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>타이틀</Label>
                    <Input
                      value={emphasizeTitle}
                      onChange={(e) => setEmphasizeTitle(e.target.value)}
                      placeholder="강조할 제목"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label>서브타이틀 (선택)</Label>
                    <Input
                      value={emphasizeSubtitle}
                      onChange={(e) => setEmphasizeSubtitle(e.target.value)}
                      placeholder="부제목"
                      maxLength={50}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {emphasizeType === 'IMAGE' && (
              <Card>
                <CardHeader>
                  <CardTitle>이미지 URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    권장 크기: 800x600px, 최대 500KB
                  </p>
                </CardContent>
              </Card>
            )}

            {emphasizeType === 'ITEM_LIST' && (
              <Card>
                <CardHeader>
                  <CardTitle>아이템 리스트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Highlight */}
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <Label className="text-xs">아이템 하이라이트</Label>
                    <Input
                      value={itemHighlight.title}
                      onChange={(e) => setItemHighlight({ ...itemHighlight, title: e.target.value })}
                      placeholder="하이라이트 제목"
                      maxLength={30}
                    />
                    <Input
                      value={itemHighlight.description}
                      onChange={(e) => setItemHighlight({ ...itemHighlight, description: e.target.value })}
                      placeholder="하이라이트 설명"
                      maxLength={60}
                    />
                  </div>

                  {/* Items */}
                  {items.list.map((item, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">아이템 {i + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemListItem(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={item.title}
                        onChange={(e) => updateItemListItem(i, 'title', e.target.value)}
                        placeholder="제목"
                        maxLength={30}
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateItemListItem(i, 'description', e.target.value)}
                        placeholder="설명"
                        maxLength={60}
                      />
                    </div>
                  ))}

                  {items.list.length < 10 && (
                    <Button type="button" variant="outline" onClick={addItemListItem} size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      아이템 추가
                    </Button>
                  )}

                  {/* Summary */}
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <Label className="text-xs">요약</Label>
                    <Input
                      value={items.summary.title}
                      onChange={(e) => setItems({ ...items, summary: { ...items.summary, title: e.target.value } })}
                      placeholder="요약 제목"
                      maxLength={30}
                    />
                    <Input
                      value={items.summary.description}
                      onChange={(e) => setItems({ ...items, summary: { ...items.summary, description: e.target.value } })}
                      placeholder="요약 설명"
                      maxLength={60}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>미리보기 메시지 (선택)</CardTitle>
                <CardDescription>채팅방 리스트에 노출되는 문구</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={headerContent}
                  onChange={(e) => setHeaderContent(e.target.value)}
                  placeholder="예: 홍길동님 솔라피 신규 회원가입을 환영합니다!"
                  maxLength={40}
                />
                <p className="text-xs text-gray-500 mt-1">최대 40자, 변수 사용 불가</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>템플릿 내용 *</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={'예:\n#{학생이름}님의 성과 리포트가 준비되었습니다.\n\n아래 링크에서 확인하세요!\n#{리포트URL}'}
                  rows={10}
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>변수: #{'{'} 변수명 {'}'}</span>
                  <span>{content.length}/1,000자</span>
                </div>
              </CardContent>
            </Card>

            {(messageType === 'EX' || messageType === 'MI') && (
              <Card>
                <CardHeader>
                  <CardTitle>부가 정보 (선택)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="예: 고객센터 운영시간: 오전 9시 ~ 오후 5시"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">변수 사용 불가</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>버튼 (선택)</CardTitle>
                <CardDescription>최대 5개</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {buttons.map((button, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">버튼 {i + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeButton(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={button.name}
                        onChange={(e) => updateButton(i, 'name', e.target.value)}
                        placeholder="버튼명"
                        maxLength={14}
                      />
                      <Select 
                        value={button.type} 
                        onValueChange={(v) => updateButton(i, 'type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WL">웹링크</SelectItem>
                          <SelectItem value="AL">앱링크</SelectItem>
                          <SelectItem value="BK">봇키워드</SelectItem>
                          <SelectItem value="MD">메시지전달</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {button.type === 'WL' && (
                      <Input
                        value={button.url || ''}
                        onChange={(e) => updateButton(i, 'url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    )}
                  </div>
                ))}
                {buttons.length < 5 && (
                  <Button type="button" variant="outline" onClick={addButton} size="sm">
                    <Plus className="mr-2 h-3 w-3" />
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
                  placeholder="예: 성과 리포트 발송 수신에 동의한 학생 학부모에게만 발송"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{inspectorComment.length}/500</p>
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>반려 사유:</strong> 정확한 수신대상/사유 불명확, 광고성 문구, 앱 설치 유도 등
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
                disabled={submitting || !selectedChannel || !content}
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

        {/* Right: Preview */}
        <div>
          <KakaoPreview />
        </div>
      </div>
    </div>
  );
}
