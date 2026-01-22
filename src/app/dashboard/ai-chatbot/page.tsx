'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatbotPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 응답을 받는데 실패했습니다.');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-purple-600" />
            AI 챗봇
          </h1>
          <p className="text-muted-foreground mt-1">
            Google Gemini AI와 대화하세요
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Google Gemini Pro
        </Badge>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                AI 어시스턴트
              </CardTitle>
              <CardDescription className="mt-1">
                궁금한 것을 무엇이든 물어보세요
              </CardDescription>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                대화 초기화
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-16 w-16 text-purple-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    대화를 시작하세요
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    학습 관련 질문, 과제 도움, 일반 지식 등 무엇이든 물어보세요.
                    AI가 친절하게 답변해드립니다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 w-full max-w-2xl">
                    {[
                      '수학 문제를 풀어주세요',
                      '영어 작문을 도와주세요',
                      '과학 개념을 설명해주세요',
                      '역사 사건을 알려주세요',
                    ].map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start h-auto py-3 px-4 hover:bg-purple-50"
                        onClick={() => setInput(suggestion)}
                      >
                        <span className="text-sm">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-100'
                            : 'bg-purple-100'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-4 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block p-4 rounded-lg bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600">
                              AI가 답변을 생성하고 있습니다...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="self-end bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Shift + Enter로 줄바꿈, Enter로 전송
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💡 사용 팁</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            구체적인 질문을 하면 더 정확한 답변을 받을 수 있습니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">🔒 개인정보</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            대화 내용은 세션 동안만 유지되며 저장되지 않습니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">⚡ 빠른 응답</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Google Gemini Pro를 사용하여 빠르고 정확하게 답변합니다.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
