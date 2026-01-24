'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, ArrowLeft, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

interface Gem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  systemPrompt: string;
  source?: 'database' | 'default';
}

export default function GemChatPage() {
  const params = useParams();
  const router = useRouter();
  const gemId = params.gemId as string;
  
  const [gem, setGem] = useState<Gem | null>(null);
  const [loadingGem, setLoadingGem] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API에서 봇 정보 가져오기
  useEffect(() => {
    const fetchGem = async () => {
      try {
        setLoadingGem(true);
        console.log('🔍 봇 정보 로딩 중:', gemId);
        
        const response = await fetch('/api/ai-bots', {
          credentials: 'include', // 쿠키 포함하여 세션 전달
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 API 응답 상태:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 응답 오류:', response.status, errorText);
          throw new Error('봇 정보를 불러오는데 실패했습니다');
        }
        
        const data = await response.json();
        console.log('📦 받은 봇 개수:', data.bots?.length || 0);
        
        const foundGem = data.bots.find((bot: Gem) => bot.id === gemId);
        
        console.log('✅ 봇 찾기 결과:', foundGem ? foundGem.name : '없음');
        
        if (!foundGem) {
          console.error('❌ 봇을 찾을 수 없음:', gemId);
          console.log('사용 가능한 봇 ID:', data.bots.map((b: Gem) => b.id));
          router.push('/dashboard/ai-gems');
          return;
        }
        
        setGem(foundGem);
      } catch (error) {
        console.error('❌ 봇 로딩 오류:', error);
        router.push('/dashboard/ai-gems');
      } finally {
        setLoadingGem(false);
      }
    };
    
    fetchGem();
  }, [gemId, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 이미지 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || !gem) return;

    const userMessage: Message = {
      role: 'user',
      content: input || '이미지 분석 요청',
      timestamp: new Date(),
      image: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 꾸메땅 봇이고 이미지가 있는 경우 전용 API 사용
      if (gem.id === 'ggumettang' && selectedImage) {
        const formData = new FormData();
        formData.append('message', input || '이 숙제 사진을 분석해주세요. 꾸메땅 로직에 따라 기호와 해석이 올바른지 검사해주세요.');
        formData.append('image', selectedImage);
        formData.append('history', JSON.stringify(messages.map(m => ({
          role: m.role,
          content: m.content
        }))));

        const response = await fetch('/api/ai-bot/ggumettang', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('AI 응답을 받는데 실패했습니다.');
        }

        const data = await response.json();

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // 일반 AI 봇
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
      }
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
      removeImage();
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

  // 로딩 중
  if (loadingGem) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 봇을 찾지 못함
  if (!gem) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/ai-gems')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">AI 봇 목록</span>
          <span className="sm:hidden">뒤로</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl sm:text-5xl">{gem.icon}</div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{gem.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{gem.description}</p>
          </div>
        </div>
        <Badge variant="outline" className={`bg-gradient-to-r ${gem.bgGradient} text-xs sm:text-sm`}>
          {gem.nameEn}
        </Badge>
      </div>

      <Card className="shadow-lg">
        <CardHeader className={`border-b bg-gradient-to-r ${gem.bgGradient}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{gem.name}와 대화하기</span>
                <span className="sm:hidden">대화하기</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                전문적인 조언과 도움을 받으세요
              </CardDescription>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                대화 초기화
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col h-[500px] sm:h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">{gem.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {gem.name}와 대화를 시작하세요
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mb-6">
                    {gem.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl px-4 sm:px-0">
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
                      className={`flex gap-2 sm:gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-100'
                            : `bg-${gem.color}-100`
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        ) : (
                          <span className="text-base sm:text-lg">{gem.icon}</span>
                        )}
                      </div>
                      <div
                        className={`flex-1 max-w-[85%] sm:max-w-[80%] ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.image && (
                            <img
                              src={message.image}
                              alt="업로드된 이미지"
                              className="mb-3 rounded-lg max-w-full h-auto"
                            />
                          )}
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
            <div className="border-t bg-gray-50">
              {/* 이미지 미리보기 (꾸메땅 봇만) */}
              {gem.id === 'ggumettang' && imagePreview && (
                <div className="px-4 pt-3 pb-0">
                  <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-lg">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="미리보기"
                        className="h-16 w-16 object-cover rounded border-2 border-blue-300"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        이미지가 선택되었습니다
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selectedImage?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 sm:p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  {/* 이미지 업로드 버튼 (꾸메땅 봇만) */}
                  {gem.id === 'ggumettang' && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex-shrink-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={gem.id === 'ggumettang' ? '숙제 사진을 업로드하거나 질문을 입력하세요...' : `${gem.name}에게 메시지를 입력하세요...`}
                    className="flex-1 min-h-[50px] sm:min-h-[60px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base"
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
                    disabled={(gem.id === 'ggumettang' ? (!input.trim() && !selectedImage) : !input.trim()) || isLoading}
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
                  {gem.id === 'ggumettang' 
                    ? '사진을 업로드하거나 Shift + Enter로 줄바꿈, Enter로 전송'
                    : 'Shift + Enter로 줄바꿈, Enter로 전송'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSuggestions(gemId: string): string[] {
  const suggestions: Record<string, string[]> = {
    'ggumettang': [
      '주요소와 종요소의 차이를 설명해주세요',
      '세모(△) 구문은 언제 사용하나요?',
      '비이커 비유가 무엇인가요?',
      '샌드위치 수식을 설명해주세요',
    ],
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
