"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Plus, Menu, Settings, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function GeminiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: API 연동 (Gemini API)
    // 임시로 더미 응답
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "안녕하세요! Gemini AI입니다. 무엇을 도와드릴까요?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar for chat history */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 z-30 w-64 h-full bg-gray-50 border-r border-gray-200 transition-transform duration-300`}
      >
        <div className="p-4 space-y-4">
          <Button onClick={newChat} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            새 대화
          </Button>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <History className="w-4 h-4" />
              최근 대화
            </h3>
            <div className="text-sm text-gray-500">
              대화 내역이 없습니다
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Gemini Chat</h1>
                <p className="text-xs text-gray-500">AI 대화 어시스턴트</p>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">안녕하세요!</h2>
              <p className="text-gray-600 mb-8">무엇을 도와드릴까요?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setInput("학습 계획을 세워주세요")}
                >
                  <p className="text-sm font-medium">📚 학습 계획</p>
                  <p className="text-xs text-gray-500 mt-1">효과적인 학습 방법을 알려드립니다</p>
                </Card>
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setInput("숙제를 도와주세요")}
                >
                  <p className="text-sm font-medium">✏️ 숙제 도움</p>
                  <p className="text-xs text-gray-500 mt-1">과제와 숙제를 함께 풀어봐요</p>
                </Card>
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setInput("공부 팁을 알려주세요")}
                >
                  <p className="text-sm font-medium">💡 학습 팁</p>
                  <p className="text-xs text-gray-500 mt-1">효율적인 공부 방법을 배워보세요</p>
                </Card>
                <Card
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setInput("질문이 있어요")}
                >
                  <p className="text-sm font-medium">❓ 질문하기</p>
                  <p className="text-xs text-gray-500 mt-1">궁금한 것을 자유롭게 물어보세요</p>
                </Card>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {message.timestamp.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="w-full bg-transparent resize-none outline-none text-sm max-h-32"
                  rows={1}
                  style={{
                    height: "auto",
                    minHeight: "24px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Gemini는 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
