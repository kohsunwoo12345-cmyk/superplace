"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Loader2, Menu, X, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export default function AIBotChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const botId = searchParams.get("botId");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 인증 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 봇 정보 및 대화 이력 로드
  useEffect(() => {
    if (status === "authenticated" && botId) {
      loadBotInfo();
      loadConversation();
    }
  }, [status, botId]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadBotInfo = async () => {
    try {
      // 봇 정보 조회 (실제 API 엔드포인트로 교체 필요)
      // 임시로 botId를 사용
      setBotInfo({
        botId,
        name: botId,
        icon: "🤖",
      });
    } catch (error) {
      console.error("봇 정보 로드 오류:", error);
    }
  };

  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/bot/conversation?botId=${botId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversation?.messages) {
          setMessages(data.conversation.messages);
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
      // AI 응답 생성 (실제 AI API 호출로 교체 필요)
      // 임시 응답
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const assistantMessage: Message = {
        role: "assistant",
        content: `안녕하세요! ${botInfo?.name || "AI 봇"}입니다. "${userMessage.content}"에 대한 답변입니다.`,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // 대화 저장
      await saveConversation(finalMessages);
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!botId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>봇을 선택해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 토글 버튼 (모바일) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
          <span className="text-3xl">{botInfo?.icon || "🤖"}</span>
          <div>
            <h1 className="text-xl font-bold">{botInfo?.name || "AI 봇"}</h1>
            <p className="text-sm text-gray-500">온라인</p>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>새 대화를 시작하세요</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === "user" ? "text-blue-100" : "text-gray-400"
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm rounded-lg px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              size="icon"
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
