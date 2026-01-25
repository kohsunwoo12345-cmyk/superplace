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
  Trash2,
  Bot,
  Sparkles,
  Pin,
  Moon,
  Sun,
  Settings,
  Image as ImageIcon,
  Mic,
  Volume2,
  ChevronLeft
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
  isPinned?: boolean;
}

interface BotGroup {
  botId: string;
  botName: string;
  botIcon: string;
  conversations: Conversation[];
}

interface AssignedBot {
  botId: string;
  name: string;
  icon: string;
  description: string;
  isAssigned?: boolean;
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // 모바일 기본값: 닫힘
  const [conversations, setConversations] = useState<BotGroup[]>([]);
  const [assignedBots, setAssignedBots] = useState<AssignedBot[]>([]);
  const [currentBot, setCurrentBot] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 다크 모드 초기화
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // 다크 모드 토글
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 인증 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 대화 목록 및 할당받은 봇 로드
  useEffect(() => {
    if (status === "authenticated") {
      loadConversations();
    }
  }, [status]);

  // 봇이 선택되지 않았고 할당받은 봇이 있으면 첫 번째 봇 자동 선택
  useEffect(() => {
    if (status === "authenticated" && !botId && assignedBots.length > 0) {
      router.push(`/ai-chat?botId=${encodeURIComponent(assignedBots[0].botId)}`);
    }
  }, [status, botId, assignedBots, router]);

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

  // 데스크탑 사이즈 감지 (사이드바 자동 열기)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md 브레이크포인트
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // 초기 실행
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadConversations = async () => {
    try {
      // 대화 내역 로드
      const convResponse = await fetch("/api/user/conversations", {
        credentials: "include",
      });

      if (convResponse.ok) {
        const data = await convResponse.json();
        setConversations(data.conversations || []);
      }

      // 모든 사용 가능한 봇 로드 (할당 여부 포함)
      const botsResponse = await fetch("/api/bot/available", {
        credentials: "include",
      });

      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        setAssignedBots(botsData.bots || []);
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

  const handleBotClick = async (bot: AssignedBot) => {
    try {
      // 1. 봇 자동 할당 (이미 할당되어 있으면 스킵)
      const assignResponse = await fetch("/api/bot/auto-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          botId: bot.botId,
        }),
      });

      if (!assignResponse.ok) {
        console.error("봇 할당 실패");
        return;
      }

      const assignData = await assignResponse.json();
      console.log(assignData.message);

      // 2. 새 채팅 시작 (conversationId 없이 botId만)
      router.push(`/ai-chat?botId=${encodeURIComponent(bot.botId)}`);
      
      // 3. 메시지 초기화 (새 채팅)
      setMessages([]);
      
      // 4. 대화 목록 새로고침
      await loadConversations();
      
      // 5. 모바일에서 사이드바 닫기
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error("봇 클릭 처리 오류:", error);
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
      // AI 응답 생성
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
          referenceFiles: currentBot?.referenceFiles,
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
        
        await saveConversation(finalMessages);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
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

  const togglePin = (convId: string) => {
    setPinnedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(convId)) {
        newSet.delete(convId);
      } else {
        newSet.add(convId);
      }
      localStorage.setItem("pinnedConversations", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // 로컬 스토리지에서 고정된 대화 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("pinnedConversations");
    if (saved) {
      setPinnedConversations(new Set(JSON.parse(saved)));
    }
  }, []);

  const filteredConversations = conversations.map(group => ({
    ...group,
    conversations: group.conversations.filter(conv =>
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.conversations.length > 0);

  const sortedConversations = filteredConversations.map(group => ({
    ...group,
    conversations: [
      ...group.conversations.filter(c => pinnedConversations.has(c.id)).sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ),
      ...group.conversations.filter(c => !pinnedConversations.has(c.id)).sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ),
    ],
  }));

  if (status === "loading") {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} overflow-hidden`}>
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 왼쪽 사이드바 - 모바일 최적화 */}
      <div
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          fixed md:relative inset-y-0 left-0 z-40
          w-full max-w-[85vw] sm:max-w-[320px] md:w-80
          transition-transform duration-300 ease-in-out
          ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}
          md:border-r flex flex-col
          shadow-2xl md:shadow-none
          ${sidebarOpen ? "" : "md:w-0"}
        `}
      >
        {(sidebarOpen || window.innerWidth >= 768) && (
          <>
            {/* 사이드바 헤더 */}
            <div className={`p-3 md:p-4 border-b ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className={`text-base md:text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
                  AI 채팅
                </h2>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    title={darkMode ? "라이트 모드" : "다크 모드"}
                    className="h-8 w-8 md:h-10 md:w-10"
                  >
                    {darkMode ? <Sun className="w-4 md:w-5 h-4 md:h-5" /> : <Moon className="w-4 md:w-5 h-4 md:h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden h-8 w-8"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="대화 검색..."
                  className={`pl-10 text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50"}`}
                />
              </div>
            </div>

            {/* 할당받은 봇 목록 */}
            {assignedBots.length > 0 && (
              <div className={`p-2 md:p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-xs md:text-sm font-semibold mb-2 px-2 md:px-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  🤖 사용 가능한 봇
                </h3>
                <div className="space-y-1">
                  {assignedBots.map((bot) => (
                    <button
                      key={bot.botId}
                      onClick={() => handleBotClick(bot)}
                      className={`w-full text-left px-2 md:px-3 py-2 rounded-lg flex items-center gap-2 md:gap-3 transition-colors relative ${
                        botId === bot.botId
                          ? darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-50 text-blue-900"
                          : darkMode ? "hover:bg-gray-700" : "hover:bg-white"
                      }`}
                    >
                      <span className="text-xl md:text-2xl flex-shrink-0">{bot.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm md:text-base font-medium truncate">{bot.name}</p>
                          {bot.isAssigned && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {bot.description}
                        </p>
                      </div>
                      {!bot.isAssigned && (
                        <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          클릭하여 시작
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 대화 목록 구분선 */}
            {sortedConversations.length > 0 && assignedBots.length > 0 && (
              <div className={`px-3 md:px-4 py-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`flex items-center gap-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  <div className={`flex-1 h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                  <span className="text-xs font-medium">대화 내역</span>
                  <div className={`flex-1 h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                </div>
              </div>
            )}

            {/* 대화 목록 */}
            <div className="flex-1 overflow-y-auto p-2">
              {sortedConversations.length === 0 && assignedBots.length === 0 ? (
                <div className={`text-center py-8 md:py-10 px-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <MessageSquare className={`w-10 md:w-12 h-10 md:h-12 mx-auto mb-2 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                  <p className="text-xs md:text-sm">할당받은 봇이 없습니다</p>
                  <p className="text-xs mt-2">관리자에게 문의하세요</p>
                </div>
              ) : sortedConversations.length === 0 ? (
                <div className={`text-center py-8 md:py-10 px-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <MessageSquare className={`w-10 md:w-12 h-10 md:h-12 mx-auto mb-2 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                  <p className="text-xs md:text-sm">아직 대화 내역이 없습니다</p>
                  <p className="text-xs mt-2">위의 봇을 선택하여 대화를 시작하세요</p>
                </div>
              ) : (
                sortedConversations.map((group) => (
                  <div key={group.botId} className="mb-3 md:mb-4">
                    <div className={`flex items-center gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <MessageSquare className="w-3 md:w-4 h-3 md:h-4" />
                      <span>{group.botName}</span>
                      <span className={`ml-auto text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {group.conversations.length}
                      </span>
                    </div>

                    {group.conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          router.push(`/ai-chat?botId=${conv.botId}&conversationId=${conv.id}`);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-2 md:px-3 py-2 rounded-lg mb-1 group transition-colors ${
                          conversationId === conv.id
                            ? darkMode ? "bg-gray-700 shadow-sm" : "bg-white shadow-sm"
                            : darkMode ? "hover:bg-gray-700" : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 md:gap-2">
                              {pinnedConversations.has(conv.id) && (
                                <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                              <p className={`text-xs md:text-sm font-medium truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                                {conv.lastMessage || "새 대화"}
                              </p>
                            </div>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {conv.messageCount}개 · {new Date(conv.lastMessageAt).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePin(conv.id);
                              }}
                              className={`p-1 rounded text-xs ${pinnedConversations.has(conv.id) ? "text-blue-500" : darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
                            >
                              <Pin className="w-3 md:w-4 h-3 md:h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className={`p-1 rounded text-xs ${darkMode ? "hover:bg-red-900" : "hover:bg-red-50"}`}
                            >
                              <Trash2 className="w-3 md:w-4 h-3 md:h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* 사이드바 푸터 */}
            <div className={`p-2 md:p-3 border-t ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="w-full text-xs md:text-sm h-9 md:h-10"
                size="sm"
              >
                대시보드로 돌아가기
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 헤더 - 모바일 최적화 */}
        <div className={`h-14 md:h-16 border-b ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} flex items-center px-3 md:px-4 gap-2 md:gap-3 sticky top-0 z-20`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {currentBot ? (
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <span className="text-xl md:text-2xl flex-shrink-0">{currentBot.icon}</span>
              <div className="min-w-0 flex-1">
                <h1 className={`text-sm md:text-base font-semibold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {currentBot.name}
                </h1>
                <p className={`text-xs truncate hidden sm:block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {currentBot.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={newChat}
                className="flex-shrink-0 h-8 md:h-9 px-2 md:px-3 hidden sm:flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">새 채팅</span>
              </Button>
            </div>
          ) : assignedBots.length > 0 ? (
            <div className={`flex items-center gap-2 flex-1 text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              <Bot className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
              <span className="truncate">AI 봇을 선택해주세요</span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 flex-1 text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              <Bot className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
              <span className="truncate">할당받은 AI 봇이 없습니다</span>
            </div>
          )}
        </div>

        {/* 메시지 영역 - 모바일 최적화 */}
        <div className="flex-1 overflow-y-auto">
          {!botId || !currentBot ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center max-w-md w-full">
                <Sparkles className={`w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                <h2 className={`text-lg md:text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {assignedBots.length > 0 ? "AI 봇을 선택해주세요" : "할당받은 AI 봇이 없습니다"}
                </h2>
                <p className={`text-sm md:text-base mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {assignedBots.length > 0 
                    ? "봇을 클릭하여 대화를 시작하세요" 
                    : "관리자나 학원장에게 봇 할당을 요청하세요"}
                </p>
                {assignedBots.length > 0 && (
                  <Button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden mb-4 flex items-center gap-2 mx-auto"
                  >
                    <Menu className="w-4 h-4" />
                    봇 목록 보기
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  대시보드로 돌아가기
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-8 md:py-12 px-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl md:text-3xl">{currentBot?.icon || "🤖"}</span>
                  </div>
                  <h3 className={`text-lg md:text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {currentBot?.name}와 대화를 시작하세요
                  </h3>
                  <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {currentBot?.description}
                  </p>
                  
                  {/* 스타터 메시지 - 모바일 최적화 */}
                  {currentBot?.starterMessages && Array.isArray(currentBot.starterMessages) && currentBot.starterMessages.length > 0 && (
                    <div className="max-w-2xl mx-auto mt-6 md:mt-8">
                      <p className={`text-xs md:text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        💡 제안된 질문
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                        {currentBot.starterMessages.map((msg: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setInput(msg)}
                            className={`p-3 md:p-4 rounded-xl text-left transition-all ${
                              darkMode 
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-100 active:bg-gray-600" 
                                : "bg-white hover:bg-gray-50 text-gray-900 shadow-sm active:bg-gray-100"
                            }`}
                          >
                            <p className="text-xs md:text-sm">{msg}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 봇 기능 아이콘 - 모바일 최적화 */}
                  {(currentBot?.enableImageInput || currentBot?.enableVoiceInput || currentBot?.enableVoiceOutput) && (
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-6">
                      {currentBot.enableImageInput && (
                        <div className={`flex items-center gap-1 md:gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <ImageIcon className="w-4 h-4" />
                          <span>이미지</span>
                        </div>
                      )}
                      {currentBot.enableVoiceInput && (
                        <div className={`flex items-center gap-1 md:gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Mic className="w-4 h-4" />
                          <span>음성 입력</span>
                        </div>
                      )}
                      {currentBot.enableVoiceOutput && (
                        <div className={`flex items-center gap-1 md:gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Volume2 className="w-4 h-4" />
                          <span>음성 출력</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* 메시지 목록 - 모바일 최적화 */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 md:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm md:text-base">{currentBot?.icon || "🤖"}</span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : darkMode ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1 md:mt-2 ${
                      message.role === "user" ? "text-blue-100" : darkMode ? "text-gray-500" : "text-gray-500"
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs md:text-sm font-semibold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm md:text-base">{currentBot?.icon || "🤖"}</span>
                  </div>
                  <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                    <Loader2 className={`w-4 md:w-5 h-4 md:h-5 animate-spin ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력 영역 - 모바일 최적화 */}
        {botId && currentBot && (
          <div className={`border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} p-3 md:p-4 safe-area-inset-bottom`}>
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`${currentBot?.name || "AI"}에게 메시지...`}
                  disabled={loading}
                  className={`flex-1 text-sm md:text-base h-10 md:h-12 rounded-xl ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"} focus:border-blue-500`}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex-shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 md:w-5 h-4 md:h-5" />
                  )}
                </Button>
              </div>
              <p className={`text-xs mt-2 text-center hidden sm:block ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Enter로 전송 • Shift + Enter로 줄바꿈
              </p>
            </form>
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
