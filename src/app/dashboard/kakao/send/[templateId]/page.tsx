'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, Send, AlertCircle } from 'lucide-react';
import KakaoTemplatePreview from '@/components/kakao/KakaoTemplatePreview';
import Link from 'next/link';

export default function SendAlimtalkPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 발송 폼
  const [phoneNumber, setPhoneNumber] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [variableKeys, setVariableKeys] = useState<string[]>([]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kakao/templates?templateId=${templateId}`);
      const data = await response.json();

      if (data.success) {
        if (data.data.status !== 'APPROVED') {
          setError('검수 완료된 템플릿만 발송할 수 있습니다.');
        } else {
          setTemplate(data.data);
          // 템플릿 내용에서 변수 추출
          extractVariables(data.data.content);
        }
      } else {
        setError(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content: string) => {
    // #{변수명} 형식의 변수 추출
    const regex = /#\{([^}]+)\}/g;
    const keys: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!keys.includes(match[1])) {
        keys.push(match[1]);
      }
    }

    setVariableKeys(keys);
    
    // 초기 변수 객체 생성
    const initialVars: Record<string, string> = {};
    keys.forEach(key => {
      initialVars[key] = '';
    });
    setVariables(initialVars);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 전화번호 검증
    if (!phoneNumber) {
      setError('받는 사람 전화번호를 입력해주세요.');
      return;
    }

    // 변수 검증
    for (const key of variableKeys) {
      if (!variables[key] || variables[key].trim() === '') {
        setError(`변수 "${key}"의 값을 입력해주세요.`);
        return;
      }
    }

    try {
      setSending(true);
      
      const response = await fetch('/api/kakao/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          to: phoneNumber.replace(/-/g, ''), // 하이픈 제거
          variables,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('알림톡이 발송되었습니다!');
        // 폼 초기화
        setPhoneNumber('');
        const resetVars: Record<string, string> = {};
        variableKeys.forEach(key => {
          resetVars[key] = '';
        });
        setVariables(resetVars);
      } else {
        setError(data.error || '알림톡 발송에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 미리보기용 템플릿 데이터 생성 (변수 치환)
  const getPreviewTemplate = () => {
    if (!template) return null;

    let previewContent = template.content;
    
    // 변수 치환
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        previewContent = previewContent.replace(
          new RegExp(`#\\{${key}\\}`, 'g'),
          value
        );
      }
    });

    return {
      ...template,
      content: previewContent,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/dashboard/kakao/templates">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/kakao/templates">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 발송 폼 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>알림톡 발송</CardTitle>
              <CardDescription>
                템플릿: <strong>{template?.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertDescription>
                    <strong>주의:</strong> 템플릿 내용은 변경할 수 없습니다. 변수 값만 입력하여 발송됩니다.
                  </AlertDescription>
                </Alert>

                {/* 받는 사람 */}
                <div>
                  <Label htmlFor="phoneNumber">받는 사람 전화번호 *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01012345678 (하이픈 없이)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    하이픈(-) 없이 숫자만 입력해주세요.
                  </p>
                </div>

                {/* 변수 입력 */}
                {variableKeys.length > 0 && (
                  <div className="space-y-3">
                    <Label>변수 값 입력</Label>
                    {variableKeys.map((key) => (
                      <div key={key}>
                        <Label htmlFor={key} className="text-sm text-gray-600">
                          #{`{${key}}`}
                        </Label>
                        <Input
                          id={key}
                          value={variables[key]}
                          onChange={(e) => handleVariableChange(key, e.target.value)}
                          placeholder={`${key} 값 입력`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {variableKeys.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      이 템플릿에는 변수가 없습니다. 그대로 발송됩니다.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      알림톡 발송
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 원본 템플릿 정보 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>원본 템플릿 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {template?.content}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 미리보기 */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>발송 미리보기</CardTitle>
              <CardDescription>
                변수가 치환된 실제 발송 내용입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getPreviewTemplate() && (
                <KakaoTemplatePreview template={getPreviewTemplate()!} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
