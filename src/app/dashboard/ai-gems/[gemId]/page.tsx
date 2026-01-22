'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getGemById } from '@/lib/gems/data';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GemChatPage() {
  const params = useParams();
  const router = useRouter();
  const gemId = params.gemId as string;
  const gem = getGemById(gemId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gem) {
      router.push('/dashboard/ai-gems');
    }
  }, [gem, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !gem) return;

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
          gemId: gem.id,
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

  if (!gem) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/ai-gems')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          AI 봇 목록
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{gem.icon}</div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{gem.name}</h1>
            <p className="text-muted-foreground">{gem.description}</p>
          </div>
        </div>
        <Badge variant="outline" className={`bg-gradient-to-r ${gem.bgGradient}`}>
          {gem.nameEn}
        </Badge>
      </div>

      <Card className="shadow-lg">
        <CardHeader className={`border-b bg-gradient-to-r ${gem.bgGradient}`}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {gem.name}와 대화하기
              </CardTitle>
              <CardDescription className="mt-1">
                전문적인 조언과 도움을 받으세요
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
                  <div className="text-6xl mb-4">{gem.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {gem.name}와 대화를 시작하세요
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mb-6">
                    {gem.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {getSuggestions(gem.id).map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start h-auto py-3 px-4 hover:bg-gray-50"
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
                            : `bg-${gem.color}-100`
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <span className="text-lg">{gem.icon}</span>
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
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${gem.color}-100 flex items-center justify-center`}>
                        <span className="text-lg">{gem.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="inline-block p-4 rounded-lg bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600">
                              {gem.name}가 답변을 생성하고 있습니다...
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
                  placeholder={`${gem.name}에게 메시지를 입력하세요...`}
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
                  className={`self-end bg-${gem.color}-600 hover:bg-${gem.color}-700`}
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
    </div>
  );
}

function getSuggestions(gemId: string): string[] {
  const suggestions: Record<string, string[]> = {
    'study-helper': [
      '이차방정식의 근의 공식을 설명해주세요',
      '광합성 과정을 쉽게 설명해주세요',
      '삼각함수의 기본 개념을 알려주세요',
      '역사 연대를 외우는 팁을 주세요',
    ],
    'writing-coach': [
      '이 문장의 문법을 확인해주세요',
      '더 매력적인 도입부를 쓰고 싶어요',
      '논리적인 글 구조를 알려주세요',
      '표현력을 향상시키는 방법은?',
    ],
    'math-tutor': [
      '이 문제를 단계별로 풀어주세요',
      '미적분의 기본 개념을 설명해주세요',
      '확률과 통계 문제를 도와주세요',
      '기하학 증명을 도와주세요',
    ],
    'english-partner': [
      'Let\'s practice daily conversation',
      'Help me write a business email',
      'Correct my grammar please',
      'Teach me useful expressions',
    ],
    'science-lab': [
      '뉴턴의 운동법칙을 실험으로 설명해주세요',
      '화학 반응식을 쉽게 이해하고 싶어요',
      '생물 세포의 구조를 알려주세요',
      '물리 실험 설계를 도와주세요',
    ],
    'creative-maker': [
      '새로운 아이디어가 필요해요',
      '창의적인 프로젝트를 기획하고 싶어요',
      '다양한 관점으로 문제를 보고 싶어요',
      '브레인스토밍을 도와주세요',
    ],
    'career-counselor': [
      '내 강점을 찾고 싶어요',
      '진로를 어떻게 탐색해야 할까요?',
      '학습 계획을 세우고 싶어요',
      '대학 전공 선택을 고민 중이에요',
    ],
    'mental-coach': [
      '시험 스트레스를 관리하고 싶어요',
      '학습 동기를 높이는 방법은?',
      '긍정적인 마인드셋을 갖고 싶어요',
      '시간 관리 팁을 알려주세요',
    ],
  };

  return suggestions[gemId] || [
    '안녕하세요! 도움이 필요해요',
    '궁금한 것이 있어요',
    '조언을 구하고 싶어요',
    '함께 고민해주세요',
  ];
}
