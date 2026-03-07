'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import KakaoTemplatePreview, { KakaoButton, QuickReply, KakaoTemplateData } from '@/components/kakao/KakaoTemplatePreview';

interface TemplateFormProps {
  initialTemplate?: any;
  categories: Array<{ code: string; name: string }>;
  onSubmit: (template: any) => Promise<void>;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

const KakaoTemplateForm: React.FC<TemplateFormProps> = ({
  initialTemplate,
  categories,
  onSubmit,
  onCancel,
  mode,
}) => {
  const [template, setTemplate] = useState<KakaoTemplateData>({
    name: initialTemplate?.name || '',
    content: initialTemplate?.content || '',
    messageType: initialTemplate?.messageType || 'BA',
    emphasizeType: initialTemplate?.emphasizeType || 'NONE',
    emphasizeTitle: initialTemplate?.emphasizeTitle || '',
    emphasizeSubTitle: initialTemplate?.emphasizeSubTitle || '',
    header: initialTemplate?.header || '',
    extra: initialTemplate?.extra || '',
    buttons: initialTemplate?.buttons || [],
    quickReplies: initialTemplate?.quickReplies || [],
    imageUrl: initialTemplate?.imageUrl || '',
  });

  const [channelId, setChannelId] = useState(initialTemplate?.channelId || '');
  const [categoryCode, setCategoryCode] = useState(initialTemplate?.categoryCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddButton = () => {
    if (template.buttons && template.buttons.length >= 5) {
      setError('버튼은 최대 5개까지만 추가할 수 있습니다.');
      return;
    }
    setTemplate({
      ...template,
      buttons: [
        ...(template.buttons || []),
        { buttonName: '', buttonType: 'WL', linkMo: '', linkPc: '' },
      ],
    });
  };

  const handleRemoveButton = (index: number) => {
    const newButtons = template.buttons?.filter((_, i) => i !== index);
    setTemplate({ ...template, buttons: newButtons });
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    const newButtons = [...(template.buttons || [])];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setTemplate({ ...template, buttons: newButtons });
  };

  const handleAddQuickReply = () => {
    if (template.quickReplies && template.quickReplies.length >= 10) {
      setError('바로연결은 최대 10개까지만 추가할 수 있습니다.');
      return;
    }
    setTemplate({
      ...template,
      quickReplies: [
        ...(template.quickReplies || []),
        { name: '', linkType: 'WL', linkMo: '', linkPc: '' },
      ],
    });
  };

  const handleRemoveQuickReply = (index: number) => {
    const newQuickReplies = template.quickReplies?.filter((_, i) => i !== index);
    setTemplate({ ...template, quickReplies: newQuickReplies });
  };

  const handleQuickReplyChange = (index: number, field: string, value: string) => {
    const newQuickReplies = [...(template.quickReplies || [])];
    newQuickReplies[index] = { ...newQuickReplies[index], [field]: value };
    setTemplate({ ...template, quickReplies: newQuickReplies });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 검증
      if (!template.name || !template.content || !channelId || !categoryCode) {
        throw new Error('필수 항목을 모두 입력해주세요.');
      }

      const templateData: any = {
        name: template.name,
        content: template.content,
        channelId,
        categoryCode,
        messageType: template.messageType,
        emphasizeType: template.emphasizeType,
      };

      // 선택 항목 추가
      if (template.emphasizeType === 'TEXT') {
        if (template.emphasizeTitle) templateData.emphasizeTitle = template.emphasizeTitle;
        if (template.emphasizeSubTitle) templateData.emphasizeSubTitle = template.emphasizeSubTitle;
      }

      if (template.emphasizeType === 'ITEM_LIST' && template.header) {
        templateData.header = template.header;
      }

      if (template.messageType === 'EX' && template.extra) {
        templateData.extra = template.extra;
      }

      if (template.buttons && template.buttons.length > 0) {
        templateData.buttons = template.buttons;
      }

      if (template.quickReplies && template.quickReplies.length > 0) {
        templateData.quickReplies = template.quickReplies;
      }

      await onSubmit(templateData);
      setSuccess(mode === 'create' ? '템플릿이 생성되었습니다!' : '템플릿이 수정되었습니다!');
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 폼 영역 */}
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{mode === 'create' ? '템플릿 생성' : '템플릿 수정'}</CardTitle>
              <CardDescription>
                카카오 알림톡 템플릿을 {mode === 'create' ? '생성' : '수정'}합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* 기본 정보 */}
              <div>
                <Label htmlFor="name">템플릿 이름 *</Label>
                <Input
                  id="name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="등록할 템플릿 이름 (중복 불가)"
                  required
                />
              </div>

              <div>
                <Label htmlFor="channelId">채널 ID (pfId) *</Label>
                <Input
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="@채널ID"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoryCode">카테고리 *</Label>
                <Select value={categoryCode} onValueChange={setCategoryCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.code} value={cat.code}>
                        {cat.name} ({cat.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">템플릿 내용 *</Label>
                <Textarea
                  id="content"
                  value={template.content}
                  onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                  placeholder="등록할 템플릿 내용"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  변수는 #&#123;변수명&#125; 형식으로 입력합니다.
                </p>
              </div>

              {/* 메시지 유형 */}
              <div>
                <Label htmlFor="messageType">메시지 유형</Label>
                <Select
                  value={template.messageType}
                  onValueChange={(value: any) => setTemplate({ ...template, messageType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BA">기본형 (BA)</SelectItem>
                    <SelectItem value="EX">부가정보형 (EX)</SelectItem>
                    <SelectItem value="AD">광고추가형 (AD)</SelectItem>
                    <SelectItem value="MI">복합형 (MI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 강조 유형 */}
              <div>
                <Label htmlFor="emphasizeType">강조 유형</Label>
                <Select
                  value={template.emphasizeType}
                  onValueChange={(value: any) => setTemplate({ ...template, emphasizeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">선택안함</SelectItem>
                    <SelectItem value="TEXT">강조표기형</SelectItem>
                    <SelectItem value="IMAGE">이미지형</SelectItem>
                    <SelectItem value="ITEM_LIST">아이템리스트형</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 강조표기형 필드 */}
              {template.emphasizeType === 'TEXT' && (
                <>
                  <div>
                    <Label htmlFor="emphasizeTitle">강조 제목</Label>
                    <Input
                      id="emphasizeTitle"
                      value={template.emphasizeTitle}
                      onChange={(e) => setTemplate({ ...template, emphasizeTitle: e.target.value })}
                      placeholder="강조 제목"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emphasizeSubTitle">강조 부제목</Label>
                    <Input
                      id="emphasizeSubTitle"
                      value={template.emphasizeSubTitle}
                      onChange={(e) => setTemplate({ ...template, emphasizeSubTitle: e.target.value })}
                      placeholder="강조 부제목"
                    />
                  </div>
                </>
              )}

              {/* 아이템리스트형 헤더 */}
              {template.emphasizeType === 'ITEM_LIST' && (
                <div>
                  <Label htmlFor="header">헤더</Label>
                  <Input
                    id="header"
                    value={template.header}
                    onChange={(e) => setTemplate({ ...template, header: e.target.value })}
                    placeholder="헤더 (최대 16자)"
                    maxLength={16}
                  />
                </div>
              )}

              {/* 부가정보 */}
              {template.messageType === 'EX' && (
                <div>
                  <Label htmlFor="extra">부가정보</Label>
                  <Textarea
                    id="extra"
                    value={template.extra}
                    onChange={(e) => setTemplate({ ...template, extra: e.target.value })}
                    placeholder="부가정보 (변수 포함 불가, 최대 500자)"
                    rows={3}
                    maxLength={500}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 버튼 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>버튼 설정</CardTitle>
              <CardDescription>최대 5개까지 추가 가능</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.buttons?.map((button, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>버튼 {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveButton(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>버튼 이름</Label>
                    <Input
                      value={button.buttonName}
                      onChange={(e) => handleButtonChange(index, 'buttonName', e.target.value)}
                      placeholder="버튼 이름"
                    />
                  </div>

                  <div>
                    <Label>버튼 타입</Label>
                    <Select
                      value={button.buttonType}
                      onValueChange={(value) => handleButtonChange(index, 'buttonType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WL">웹링크 (WL)</SelectItem>
                        <SelectItem value="AL">앱링크 (AL)</SelectItem>
                        <SelectItem value="DS">배송조회 (DS)</SelectItem>
                        <SelectItem value="BK">봇키워드 (BK)</SelectItem>
                        <SelectItem value="MD">메시지전달 (MD)</SelectItem>
                        <SelectItem value="BC">상담톡전환 (BC)</SelectItem>
                        <SelectItem value="BT">봇전환 (BT)</SelectItem>
                        <SelectItem value="AC">채널추가 (AC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(button.buttonType === 'WL' || button.buttonType === 'AL') && (
                    <>
                      <div>
                        <Label>모바일 링크</Label>
                        <Input
                          value={button.linkMo}
                          onChange={(e) => handleButtonChange(index, 'linkMo', e.target.value)}
                          placeholder="https://m.example.com"
                        />
                      </div>
                      <div>
                        <Label>PC 링크</Label>
                        <Input
                          value={button.linkPc}
                          onChange={(e) => handleButtonChange(index, 'linkPc', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddButton}
                className="w-full"
                disabled={(template.buttons?.length || 0) >= 5}
              >
                <Plus className="w-4 h-4 mr-2" />
                버튼 추가
              </Button>
            </CardContent>
          </Card>

          {/* 바로연결 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>바로연결 설정</CardTitle>
              <CardDescription>최대 10개까지 추가 가능</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.quickReplies?.map((reply, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>바로연결 {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuickReply(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>바로연결 이름</Label>
                    <Input
                      value={reply.name}
                      onChange={(e) => handleQuickReplyChange(index, 'name', e.target.value)}
                      placeholder="바로연결 이름"
                    />
                  </div>

                  <div>
                    <Label>링크 타입</Label>
                    <Select
                      value={reply.linkType}
                      onValueChange={(value) => handleQuickReplyChange(index, 'linkType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WL">웹링크 (WL)</SelectItem>
                        <SelectItem value="AL">앱링크 (AL)</SelectItem>
                        <SelectItem value="BK">봇키워드 (BK)</SelectItem>
                        <SelectItem value="BT">봇전환 (BT)</SelectItem>
                        <SelectItem value="BC">상담톡전환 (BC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(reply.linkType === 'WL' || reply.linkType === 'AL') && (
                    <>
                      <div>
                        <Label>모바일 링크</Label>
                        <Input
                          value={reply.linkMo}
                          onChange={(e) => handleQuickReplyChange(index, 'linkMo', e.target.value)}
                          placeholder="https://m.example.com"
                        />
                      </div>
                      <div>
                        <Label>PC 링크</Label>
                        <Input
                          value={reply.linkPc}
                          onChange={(e) => handleQuickReplyChange(index, 'linkPc', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuickReply}
                className="w-full"
                disabled={(template.quickReplies?.length || 0) >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                바로연결 추가
              </Button>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '처리 중...' : mode === 'create' ? '템플릿 생성' : '템플릿 수정'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 미리보기 영역 */}
      <div className="lg:sticky lg:top-4 h-fit">
        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <CardDescription>실제 카카오톡에 표시될 모습입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <KakaoTemplatePreview template={template} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KakaoTemplateForm;
