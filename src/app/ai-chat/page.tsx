"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Send, 
  Loader2, 
  Menu, 
  X, 
  MessageSquare, 
  Plus,
  Search,
  MoreVertical,
  Trash2,
  ChevronDown,
  Bot,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  botId: string;
  botName: string;
  botIcon: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

interface BotGroup {
  botId: string;
  botName: string;
  botIcon: string;
  conversations: Conversation[];
}

function AIChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const botId = searchParams.get("botId");
  const conversationId = searchParams.get("conversationId");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<BotGroup[]>([]);
  const [currentBot, setCurrentBot] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 인증 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 대화 목록 로드
  useEffect(() => {
    if (status === "authenticated") {
      loadConversations();
    }
  }, [status]);

  // 현재 대화 로드
  useEffect(() => {
    if (status === "authenticated" && botId) {
      loadCurrentConversation();
    }
  }, [status, botId, conversationId]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/user/conversations", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("대화 목록 로드 오류:", error);
    }
  };

  const loadCurrentConversation = async () => {
    try {
      // 봇 정보 조회
      const botResponse = await fetch(`/api/bot/${botId}`, {
        credentials: "include",
      });

      if (botResponse.ok) {
        const botData = await botResponse.json();
        setCurrentBot(botData.bot);
      }

      // 대화 이력 조회
      const convResponse = await fetch(`/api/bot/conversation?botId=${botId}`, {
        credentials: "include",
      });

      if (convResponse.ok) {
        const convData = await convResponse.json();
        if (convData.conversation?.messages) {
          setMessages(convData.conversation.messages);
        }
      }
    } catch (error) {
      console.error("대화 로드 오류:", error);
    }
  };

  const saveConversation = async (updatedMessages: Message[]) => {
    try {
      await fetch("/api/bot/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          botId,
          messages: updatedMessages,
        }),
      });
    } catch (error) {
      console.error("대화 저장 오류:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // AI 응답 생성 (실제 AI API 호출)
      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          botId,
          messages: updatedMessages,
          systemPrompt: currentBot?.systemPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: Date.now(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        // 대화 저장
        await saveConversation(finalMessages);
        
        // 대화 목록 새로고침
        loadConversations();
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    router.push(`/ai-chat?botId=${botId}`);
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("이 대화를 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/bot/conversation/${convId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      loadConversations();
      if (conversationId === convId) {
        newChat();
      }
    } catch (error) {
      console.error("대화 삭제 오류:", error);
    }
  };

  const filteredConversations = conversations.map(group => ({
    ...group,
    conversations: group.conversations.filter(conv =>
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.conversations.length > 0);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 왼쪽 사이드바 - 대화 목록 */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50`}
      >
        {sidebarOpen && (
          <>
            {/* 사이드바 헤더 */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI 채팅
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="대화 검색..."
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            {/* 대화 목록 */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">대화 내역이 없습니다</p>
                </div>
              ) : (
                filteredConversations.map((group) => (
                  <div key={group.botId} className="mb-4">
                    {/* 봇 그룹 헤더 */}
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700">
                      <span className="text-lg">{group.botIcon}</span>
                      <span>{group.botName}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        {group.conversations.length}
                      </span>
                    </div>

                    {/* 대화 항목들 */}
                    {group.conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => router.push(`/ai-chat?botId=${conv.botId}&conversationId=${conv.id}`)}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 group hover:bg-white transition-colors ${
                          conversationId === conv.id ? "bg-white shadow-sm" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.lastMessage || "새 대화"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conv.messageCount}개 메시지 · {new Date(conv.lastMessageAt).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* 사이드바 푸터 */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="w-full"
              >
                대시보드로 돌아가기
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 상단 헤더 */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4 gap-3 bg-white">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {currentBot ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentBot.icon}</span>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{currentBot.name}</h1>
                  <p className="text-xs text-gray-500">{currentBot.description}</p>
                </div>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={newChat}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  새 채팅
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Bot className="w-5 h-5" />
              <span>AI 봇을 선택해주세요</span>
            </div>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto">
          {!botId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  AI 채팅 시작하기
                </h2>
                <p className="text-gray-500 mb-6">
                  대시보드에서 AI 봇을 선택하여 대화를 시작하세요
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Bot className="w-4 h-4" />
                  봇 선택하러 가기
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{currentBot?.icon || "🤖"}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentBot?.name}와 대화를 시작하세요
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {currentBot?.description}
                  </p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-lg">{currentBot?.icon || "🤖"}</span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-3 flex-shrink-0 text-white font-semibold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                    <span className="text-lg">{currentBot?.icon || "🤖"}</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-5 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        {botId && (
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`${currentBot?.name || "AI"}에게 메시지 보내기...`}
                    disabled={loading}
                    className="pr-12 h-12 rounded-xl border-gray-300 focus:border-blue-500"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  size="lg"
                  className="h-12 px-6 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter로 전송 • Shift + Enter로 줄바꿈
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <AIChatContent />
    </Suspense>
  );
}
