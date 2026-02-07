"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Plus, 
  Menu, 
  X,
  Sparkles,
  Bot,
  User,
  Trash2,
  Edit,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  botId: string;
}

interface AIBot {
  id: string;
  name: string;
  description?: string;
  profileIcon: string;
  profileImage?: string;
  systemPrompt: string;
  model: string;
  isActive: boolean;
}

export default function ModernAIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // 봇 관련
  const [bots, setBots] = useState<AIBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<AIBot | null>(null);
  
  // 채팅 관련
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 채팅 기록
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // UI 상태
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchBots();
    loadChatSessions();
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const fetchBots = async () => {
    try {
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        const activeBots = (data.bots || []).filter((bot: AIBot) => bot.isActive);
        setBots(activeBots);
        if (activeBots.length > 0 && !selectedBot) {
          setSelectedBot(activeBots[0]);
        }
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
    }
  };

  const loadChatSessions = () => {
    // localStorage에서 채팅 세션 불러오기
    const storedSessions = localStorage.getItem("chatSessions");
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      }));
      setChatSessions(sessions);
    }
  };

  const saveChatSessions = (sessions: ChatSession[]) => {
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
    setChatSessions(sessions);
  };

  const createNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: "새로운 대화",
      lastMessage: "",
      timestamp: new Date(),
      botId: selectedBot?.id || "",
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    saveChatSessions(updatedSessions);
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    saveChatSessions(updatedSessions);
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const loadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // localStorage에서 해당 세션의 메시지 불러오기
    const storedMessages = localStorage.getItem(`messages-${sessionId}`);
    if (storedMessages) {
      const msgs = JSON.parse(storedMessages).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(msgs);
    }
  };

  const saveMessages = (sessionId: string, msgs: Message[]) => {
    localStorage.setItem(`messages-${sessionId}`, JSON.stringify(msgs));
    
    // 세션 목록 업데이트
    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      const updatedSessions = chatSessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            lastMessage: lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? "..." : ""),
            timestamp: new Date(),
            title: msgs[0]?.content.substring(0, 30) || "새로운 대화",
          };
        }
        return s;
      });
      saveChatSessions(updatedSessions);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedBot) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // 현재 세션이 없으면 새로 생성
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: sessionId,
        title: userMessage.content.substring(0, 30),
        lastMessage: userMessage.content,
        timestamp: new Date(),
        botId: selectedBot.id,
      };
      const updatedSessions = [newSession, ...chatSessions];
      saveChatSessions(updatedSessions);
      setCurrentSessionId(sessionId);
    }

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          botId: selectedBot.id,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || "응답을 생성할 수 없습니다.",
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessages(sessionId, finalMessages);
      } else {
        throw new Error("AI 응답 실패");
      }
    } catch (error) {
      console.error("AI 채팅 오류:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // TODO: 음성을 텍스트로 변환하는 API 호출
        console.log("Audio recorded:", audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("녹음 시작 실패:", error);
      alert("마이크 권한을 허용해주세요.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지를 base64로 변환
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: "이미지를 업로드했습니다.",
        imageUrl: base64Image,
        timestamp: new Date(),
      };

      setMessages([...messages, userMessage]);
      // TODO: 이미지 분석 API 호출
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 왼쪽 사이드바 */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={createNewChat}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 대화
          </Button>
        </div>

        {/* 나의 봇 */}
        <div className="px-3 py-2 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">나의 봇</h3>
          <div className="space-y-1">
            {bots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedBot?.id === bot.id
                    ? "bg-blue-100 text-blue-900"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <span className="text-lg">{bot.profileIcon || "🤖"}</span>
                <span className="truncate">{bot.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-b border-gray-300 my-2"></div>

        {/* 채팅 기록 */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">최근 대화</h3>
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-gray-200"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.lastMessage}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {selectedBot && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedBot.profileIcon || "🤖"}</span>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedBot.name}</h2>
                  <p className="text-xs text-gray-500">{selectedBot.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{selectedBot?.profileIcon || "🤖"}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedBot?.name}에게 무엇이든 물어보세요
                </h3>
                <p className="text-gray-600">{selectedBot?.description}</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === "assistant" ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span>{selectedBot?.profileIcon || "🤖"}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-1 ${
                      message.role === "user" ? "flex justify-end" : ""
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Uploaded"
                          className="max-w-full rounded-lg mb-2"
                        />
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span>{selectedBot?.profileIcon || "🤖"}</span>
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-2 rounded-2xl bg-gray-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-gray-100 rounded-3xl p-2">
              {/* 이미지 업로드 버튼 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                disabled={loading}
              >
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* 텍스트 입력 */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-2 px-2"
                rows={1}
                disabled={loading}
              />

              {/* 음성 입력 버튼 */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "hover:bg-gray-200"
                }`}
                disabled={loading}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* 전송 버튼 */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-full transition-colors ${
                  input.trim() && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              AI가 실수를 할 수 있습니다. 중요한 정보는 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
