'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, AlertCircle, CheckCircle, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Template {
  templateId: string;
  name: string;
  content: string;
  buttons?: any[];
  status: string;
}

export default function KakaoAlimtalkPage() {
  const searchParams = useSearchParams();
  const pfIdParam = searchParams?.get('pfId');
  
  const [pfId, setPfId] = useState(pfIdParam || '');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (pfId) {
      fetchTemplates();
    }
  }, [pfId]);

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.templateId === selectedTemplate);
      if (template) {
        // 템플릿 내용에서 변수 추출 (예: #{변수명})
        const variablePattern = /#{(\w+)}/g;
        const matches = template.content.matchAll(variablePattern);
        const newVariables: Record<string, string> = {};
        for (const match of matches) {
          newVariables[match[1]] = '';
        }
        setVariables(newVariables);
      }
    }
  }, [selectedTemplate, templates]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(`/api/kakao/templates/list?pfId=${pfId}`);
      const data = await response.json();
      if (data.success) {
        // 승인된 템플릿만 필터링
        const approved = data.templates.filter((t: Template) => t.status === 'APPROVED');
        setTemplates(approved);
      } else {
        setMessage({ type: 'error', text: data.error || '템플릿을 불러오는데 실패했습니다' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '템플릿을 불러오는데 실패했습니다' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSend = async () => {
    if (!pfId || !selectedTemplate || !recipientPhone) {
      setMessage({ type: 'error', text: '모든 필수 항목을 입력해주세요' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/kakao/send-alimtalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pfId,
          templateId: selectedTemplate,
          to: recipientPhone,
          variables,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '알림톡이 성공적으로 전송되었습니다!' });
        setRecipientPhone('');
        setVariables({});
        setSelectedTemplate('');
      } else {
        setMessage({ type: 'error', text: data.error || '전송에 실패했습니다' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '전송 중 오류가 발생했습니다' });
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.templateId === selectedTemplate);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/kakao-channel">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            채널 목록으로
          </Button>
        </Link>
        <Link href="/dashboard/kakao-business-guide" target="_blank">
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            가이드 보기
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>카카오 알림톡 전송</CardTitle>
          <CardDescription>
            등록된 템플릿을 사용하여 알림톡을 전송합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="pfId">채널 pfId</Label>
            <Input
              id="pfId"
              value={pfId}
              onChange={(e) => setPfId(e.target.value)}
              placeholder="pfId를 입력하세요"
              onBlur={fetchTemplates}
            />
            <p className="text-sm text-gray-500">
              채널 목록에서 확인한 pfId를 입력하세요
            </p>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">템플릿 로딩 중...</p>
            </div>
          ) : templates.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="template">템플릿 선택</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="템플릿을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.templateId} value={template.templateId}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateData && (
                <div className="space-y-2">
                  <Label>템플릿 미리보기</Label>
                  <div className="p-4 bg-gray-50 rounded-md border text-sm whitespace-pre-wrap">
                    {selectedTemplateData.content}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">수신자 전화번호</Label>
                <Input
                  id="phone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="01012345678"
                />
              </div>

              {Object.keys(variables).length > 0 && (
                <div className="space-y-4">
                  <Label>템플릿 변수</Label>
                  {Object.keys(variables).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`var-${key}`} className="text-sm">
                        #{key}
                      </Label>
                      <Input
                        id={`var-${key}`}
                        value={variables[key]}
                        onChange={(e) =>
                          setVariables({ ...variables, [key]: e.target.value })
                        }
                        placeholder={`${key} 값을 입력하세요`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={loading || !selectedTemplate || !recipientPhone}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    알림톡 전송
                  </>
                )}
              </Button>
            </>
          ) : pfId ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                승인된 템플릿이 없습니다. 카카오 비즈니스 센터에서 템플릿을 등록하고 승인받아주세요.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
