"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIBot {
  id: string;
  name: string;
  description?: string;
  profileIcon: string;
  profileImage?: string;
  systemPrompt: string;
  welcomeMessage?: string;
  starterMessage1?: string;
  starterMessage2?: string;
  starterMessage3?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  topP: number;
  isActive: boolean;
}

export default function AIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bots, setBots] = useState<AIBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<AIBot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [botsLoading, setBotsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    fetchBots();
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedBot && messages.length === 0) {
      // 선택된 봇의 환영 메시지 표시
      const welcomeMsg = selectedBot.welcomeMessage || `안녕하세요! ${selectedBot.name}입니다. 무엇을 도와드릴까요?`;
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMsg,
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedBot]);

  const fetchBots = async () => {
    try {
      setBotsLoading(true);
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        const activeBots = (data.bots || []).filter((bot: AIBot) => bot.isActive);
        setBots(activeBots);
        
        // 첫 번째 활성 봇 자동 선택
        if (activeBots.length > 0) {
          setSelectedBot(activeBots[0]);
        }
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
    } finally {
      setBotsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBotSelect = (bot: AIBot) => {
    setSelectedBot(bot);
    setMessages([]); // 메시지 초기화
  };

  const handleStarterMessage = (message: string) => {
    setInput(message);
    setTimeout(() => handleSend(message), 100);
  };

  const saveChatLog = async (userMessage: string, aiResponse: string) => {
    try {
      if (!user?.id || !selectedBot) return;
      
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // AI 대화 로그 저장 (추후 구현 가능)
      await fetch("/api/ai/save-chat-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: logId,
          userId: user.id,
          botId: selectedBot.id,
          botName: selectedBot.name,
          message: userMessage,
          response: aiResponse,
          model: selectedBot.model,
        }),
      });
    } catch (error) {
      console.error("채팅 로그 저장 실패:", error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !selectedBot) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Gemini API 호출
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          systemPrompt: selectedBot.systemPrompt,
          model: selectedBot.model,
          temperature: selectedBot.temperature,
          maxTokens: selectedBot.maxTokens,
          topK: selectedBot.topK,
          topP: selectedBot.topP,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "응답을 생성할 수 없습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // 채팅 로그 저장
        await saveChatLog(textToSend, assistantMessage.content);
      } else {
        const errorData = await response.json();
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `오류가 발생했습니다: ${errorData.error || "알 수 없는 오류"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetConversation = () => {
    setMessages([]);
  };

  if (botsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">AI 봇 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="text-center p-12">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">사용 가능한 AI 봇이 없습니다</h2>
          <p className="text-gray-600 mb-6">
            관리자에게 문의하여 AI 봇을 활성화하세요.
          </p>
          {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? (
            <Button onClick={() => router.push("/dashboard/admin/ai-bots/create")}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 봇 만들기
            </Button>
          ) : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI 챗봇
          </h1>
          <p className="text-gray-600">AI와 대화하며 학습을 도움받으세요</p>
        </div>
        <Button
          variant="outline"
          onClick={resetConversation}
          disabled={messages.length === 0}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          대화 초기화
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100%-7rem)]">
        {/* 왼쪽: 봇 선택 사이드바 */}
        <div className="lg:col-span-1 space-y-3 overflow-y-auto max-h-full">
          <h3 className="font-semibold text-gray-700 mb-3">AI 봇 선택</h3>
          {bots.map((bot) => (
            <Card
              key={bot.id}
              className={`cursor-pointer transition-all ${
                selectedBot?.id === bot.id
                  ? "border-2 border-purple-500 bg-purple-50 shadow-md"
                  : "border hover:border-purple-300 hover:shadow"
              }`}
              onClick={() => handleBotSelect(bot)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {bot.profileImage ? (
                    <img 
                      src={bot.profileImage} 
                      alt={bot.name}
                      className="w-10 h-10 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="text-xl sm:text-2xl sm:text-3xl">{bot.profileIcon}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{bot.name}</h4>
                    {bot.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {bot.description}
                      </p>
                    )}
                  </div>
                  {selectedBot?.id === bot.id && (
                    <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 오른쪽: 채팅 영역 */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                {selectedBot?.profileImage ? (
                  <img 
                    src={selectedBot.profileImage} 
                    alt={selectedBot.name}
                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                  />
                ) : (
                  <div className="text-4xl">{selectedBot?.profileIcon}</div>
                )}
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {selectedBot?.name}
                    <span className="text-xs font-normal text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {selectedBot?.model}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {selectedBot?.description || "AI 어시스턴트"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
              {messages.map((message, idx) => (
                <div key={message.id}>
                  <div
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      selectedBot?.profileImage ? (
                        <img 
                          src={selectedBot.profileImage} 
                          alt={selectedBot.name}
                          className="w-8 h-8 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="text-xl sm:text-2xl sm:text-3xl flex-shrink-0">
                          {selectedBot?.profileIcon}
                        </div>
                      )
                    )}

                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* 스타터 메시지 버튼 (환영 메시지 다음) */}
                  {message.id === "welcome" && idx === 0 && (
                    <div className="ml-12 mt-3 space-y-2">
                      {selectedBot?.starterMessage1 && (
                        <button
                          onClick={() => handleStarterMessage(selectedBot.starterMessage1!)}
                          className="block text-left text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition w-full"
                          disabled={loading}
                        >
                          💬 {selectedBot.starterMessage1}
                        </button>
                      )}
                      {selectedBot?.starterMessage2 && (
                        <button
                          onClick={() => handleStarterMessage(selectedBot.starterMessage2!)}
                          className="block text-left text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition w-full"
                          disabled={loading}
                        >
                          💬 {selectedBot.starterMessage2}
                        </button>
                      )}
                      {selectedBot?.starterMessage3 && (
                        <button
                          onClick={() => handleStarterMessage(selectedBot.starterMessage3!)}
                          className="block text-left text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition w-full"
                          disabled={loading}
                        >
                          💬 {selectedBot.starterMessage3}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  {selectedBot?.profileImage ? (
                    <img 
                      src={selectedBot.profileImage} 
                      alt={selectedBot.name}
                      className="w-8 h-8 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="text-xl sm:text-2xl sm:text-3xl flex-shrink-0">
                      {selectedBot?.profileIcon}
                    </div>
                  )}
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Shift + Enter로 줄바꿈, Enter로 전송
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
