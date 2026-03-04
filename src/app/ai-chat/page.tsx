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
  MoreVertical,
  Home,
  ArrowLeft,
  Printer,
  Volume2
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
  enableProblemGeneration?: number;
  voiceEnabled?: number | boolean;
  voiceName?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  
  // UI 상태
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log('👤 localStorage user 확인:', storedUser ? '존재' : '없음');
    
    if (!storedUser) {
      console.warn('❌ 로그인되지 않음 - /login으로 리다이렉트');
      router.push("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    console.log('👤 사용자 정보:', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      academyId: userData.academyId,
      name: userData.name
    });
    console.log('🆔 user.id 확인:', userData.id, '(타입:', typeof userData.id, ')');
    setUser(userData);
    
    // 관리자 체크
    const isAdmin = userData.email === 'admin@superplace.co.kr' || 
                    userData.role === 'ADMIN' || 
                    userData.role === 'SUPER_ADMIN';
    
    console.log('🔍 관리자 체크:', {
      isAdmin,
      emailMatch: userData.email === 'admin@superplace.co.kr',
      roleMatch: userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN',
      actualEmail: userData.email,
      actualRole: userData.role
    });
    
    if (isAdmin) {
      // 관리자는 모든 봇 조회
      console.log('🔑 관리자 계정 - 모든 봇 조회');
      fetchAllBots();
    } else if (userData.academyId) {
      // 일반 사용자는 할당된 봇만 조회
      console.log(`👥 일반 사용자 (academyId: ${userData.academyId}) - 할당된 봇 조회`);
      fetchBots(userData.academyId);
    } else if (userData.role === 'DIRECTOR') {
      // 학원장인 경우 academyId를 API로 조회
      console.log('🏫 학원장 계정 - academyId 조회 시도');
      fetchDirectorAcademyId(userData.id);
    } else {
      console.warn("⚠️ academyId가 없습니다. AI 봇을 사용할 수 없습니다.");
      console.warn("⚠️ 사용자 정보:", userData);
      alert("학원 정보가 없습니다. 관리자에게 문의하세요.");
    }

    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  // user가 로드된 후 세션 로드 (봇 로드 후 실행) - 페이지 재방문 시에도 로드
  useEffect(() => {
    const userId = user?.id || user?.email;
    console.log('🔍 세션 로드 useEffect 실행:', {
      userId: userId,
      botsLength: bots.length,
      chatSessionsLength: chatSessions.length
    });
    
    if (userId && bots.length > 0) {
      console.log(`🔄 봇 로드 완료 (${bots.length}개) - 세션 로드 시작`);
      console.log(`🆔 userId:`, userId);
      loadChatSessions();
    } else {
      console.log('⚠️ 세션 로드 조건 미충족:', {
        hasUserId: !!userId,
        hasBots: bots.length > 0
      });
    }
  }, [user?.id, user?.email, bots.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const fetchAllBots = async () => {
    try {
      console.log('🔍 관리자 - 모든 봇 조회');
      console.log('📡 API 요청:', '/api/admin/ai-bots');
      
      const response = await fetch('/api/admin/ai-bots');
      console.log('📡 API 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 API 응답 데이터:', data);
        console.log('📦 봇 개수:', data.bots?.length);
        
        const activeBots = (data.bots || []).filter((bot: AIBot) => bot.isActive);
        console.log(`✅ 활성 봇 ${activeBots.length}개 발견`);
        console.log('✅ 활성 봇 목록:', activeBots.map(b => ({ 
          id: b.id, 
          name: b.name, 
          isActive: b.isActive,
          enableProblemGeneration: b.enableProblemGeneration 
        })));
        
        if (activeBots.length > 0) {
          console.log('✅ setBots 호출:', activeBots.length, '개');
          setBots(activeBots);
          if (!selectedBot) {
            console.log('✅ 첫 번째 봇 선택:', activeBots[0].name);
            console.log('🎯 선택된 봇 enableProblemGeneration:', activeBots[0].enableProblemGeneration);
            setSelectedBot(activeBots[0]);
          }
        } else {
          console.warn('⚠️ 활성 봇이 없습니다');
          setBots([]);
          setSelectedBot(null);
        }
      } else {
        console.error('❌ 봇 조회 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ 에러 응답:', errorText);
        setBots([]);
      }
    } catch (error) {
      console.error('❌ AI 봇 목록 로드 실패:', error);
      console.error('❌ 에러 스택:', (error as Error).stack);
      setBots([]);
    }
  };

  const fetchDirectorAcademyId = async (userId: string) => {
    try {
      console.log(`🏫 학원장(${userId})의 학원 ID 조회 중...`);
      
      // User 테이블에서 academyId 조회
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const academyId = data.user?.academyId;
        
        if (academyId) {
          console.log(`✅ 학원 ID 발견: ${academyId}`);
          // localStorage에 academyId 저장
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.academyId = academyId;
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
          }
          // 봇 조회
          fetchBots(academyId);
        } else {
          console.warn("⚠️ 학원 ID를 찾을 수 없습니다");
          alert("학원 정보가 없습니다. 관리자에게 문의하세요.");
        }
      } else {
        console.error("❌ 사용자 정보 조회 실패:", response.status);
        alert("학원 정보 조회 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("❌ 학원 ID 조회 실패:", error);
      alert("학원 정보 조회 중 오류가 발생했습니다.");
    }
  };

  const fetchBots = async (academyId: string) => {
    try {
      console.log(`🔍 학원(${academyId})의 할당된 봇 조회`);
      
      const response = await fetch(`/api/user/academy-bots?academyId=${academyId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 할당된 봇 ${data.count}개 발견`);
        
        if (data.bots && data.bots.length > 0) {
          setBots(data.bots);
          if (!selectedBot) {
            setSelectedBot(data.bots[0]);
          }
        } else {
          console.warn("⚠️ 할당된 봇이 없습니다");
          setBots([]);
          setSelectedBot(null);
        }
      } else {
        console.error("❌ 봇 조회 실패:", response.status);
        setBots([]);
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
      setBots([]);
    }
  };

  const loadChatSessions = async () => {
    // user.id 또는 user.email을 userId로 사용
    // 일관성을 위해 userId를 결정하는 로직
    let userId = user?.id || user?.email;
    
    // userId를 localStorage에 캐시 (일관성 유지)
    if (userId && user) {
      const cachedUserId = localStorage.getItem('chatUserId');
      if (!cachedUserId) {
        localStorage.setItem('chatUserId', userId);
        console.log('💾 userId 캐시 저장:', userId);
      } else if (cachedUserId !== userId) {
        // 기존 캐시와 다르면 기존 것을 우선 사용 (일관성)
        console.log('⚠️ userId 불일치 감지:', { cached: cachedUserId, current: userId });
        console.log('📌 기존 캐시된 userId 사용:', cachedUserId);
        userId = cachedUserId;
      }
    }
    
    if (!userId) {
      console.warn('⚠️ userId가 없어서 세션을 로드할 수 없습니다');
      console.warn('⚠️ user 객체:', user);
      return;
    }
    
    try {
      console.log(`📂 사용자(${userId})의 채팅 세션 로드 중...`);
      console.log(`📂 현재 상태: bots.length=${bots.length}, currentSessionId=${currentSessionId}`);
      
      const response = await fetch(`/api/chat-sessions?userId=${encodeURIComponent(userId)}`);
      console.log(`📡 세션 API 응답: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 세션 API 데이터:`, data);
        
        const sessions = (data.sessions || []).map((s: any) => ({
          ...s,
          timestamp: new Date(s.updatedAt),
        }));
        
        console.log(`✅ ${sessions.length}개 세션 로드됨`);
        console.log(`📋 세션 목록:`, sessions.map(s => ({ id: s.id, title: s.title, botId: s.botId })));
        
        setChatSessions(sessions);
        
        // 마지막 세션 자동 로드
        if (sessions.length > 0 && !currentSessionId) {
          const lastSession = sessions[0]; // 가장 최근 세션
          console.log(`🔄 마지막 세션 자동 로드: ${lastSession.id} (${lastSession.title})`);
          console.log(`🔄 세션 상세:`, lastSession);
          
          await loadSession(lastSession.id);
          
          // 해당 세션의 봇 선택
          if (lastSession.botId && bots.length > 0) {
            const bot = bots.find(b => b.id === lastSession.botId);
            console.log(`🔍 봇 검색: botId=${lastSession.botId}, 찾은 봇:`, bot);
            
            if (bot) {
              console.log(`🤖 세션의 봇 선택: ${bot.name}`);
              setSelectedBot(bot);
            } else {
              console.warn(`⚠️ 세션의 봇을 찾을 수 없음: ${lastSession.botId}`);
            }
          } else {
            console.warn(`⚠️ 봇 목록이 비어있거나 botId가 없음: bots.length=${bots.length}, botId=${lastSession.botId}`);
          }
        } else {
          console.log(`ℹ️ 세션 자동 로드 건너뛰기: sessions.length=${sessions.length}, currentSessionId=${currentSessionId}`);
        }
      } else {
        console.error(`❌ 세션 로드 실패: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`❌ 에러 응답:`, errorText);
      }
    } catch (error) {
      console.error("❌ 세션 로드 실패:", error);
      console.error("❌ 에러 스택:", (error as Error).stack);
    }
  };

  const saveChatSession = async (session: ChatSession) => {
    // 캐시된 userId 사용 (일관성 보장)
    let userId = localStorage.getItem('chatUserId') || user?.id || user?.email;
    const academyId = user?.academyId || 'default-academy';
    
    // 캐시가 없으면 현재 userId를 캐시
    if (userId && !localStorage.getItem('chatUserId')) {
      localStorage.setItem('chatUserId', userId);
      console.log('💾 세션 저장 시 userId 캐시:', userId);
    }
    
    if (!userId || !academyId) {
      console.warn('⚠️ userId 또는 academyId가 없어 세션을 저장할 수 없습니다', { userId, academyId });
      return;
    }
    
    try {
      console.log(`💾 세션 저장 시작:`, session);
      
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          userId: userId,
          academyId: academyId,
          botId: session.botId,
          title: session.title,
          lastMessage: session.lastMessage,
        }),
      });
      
      if (response.ok) {
        console.log(`✅ 세션 저장 성공: ${session.id}`);
        
        // 로컬 상태 즉시 업데이트
        const existingIndex = chatSessions.findIndex(s => s.id === session.id);
        if (existingIndex >= 0) {
          // 기존 세션 업데이트 (맨 위로 이동)
          const updatedSessions = [
            { ...session, timestamp: new Date() },
            ...chatSessions.filter(s => s.id !== session.id)
          ];
          setChatSessions(updatedSessions);
          console.log('🔄 기존 세션 업데이트 및 맨 위로 이동');
        } else {
          // 새 세션 추가 (맨 위에)
          setChatSessions([{ ...session, timestamp: new Date() }, ...chatSessions]);
          console.log('✨ 새 세션 추가됨');
        }
      } else {
        console.error(`❌ 세션 저장 실패: ${response.status}`);
      }
    } catch (error) {
      console.error("세션 저장 실패:", error);
    }
  };

  const createNewChat = async () => {
    if (!selectedBot) return;
    
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: "새로운 대화",
      lastMessage: "",
      timestamp: new Date(),
      botId: selectedBot.id,
    };
    
    await saveChatSession(newSession);
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "DELETE",
      });
      
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updatedSessions);
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("세션 삭제 실패:", error);
    }
  };

  const loadSession = async (sessionId: string) => {
    console.log(`📖 세션 로드 시작: ${sessionId}`);
    setCurrentSessionId(sessionId);
    
    // 세션의 봇 찾기 및 선택
    const session = chatSessions.find(s => s.id === sessionId);
    if (session && session.botId) {
      const bot = bots.find(b => b.id === session.botId);
      if (bot) {
        console.log(`🤖 세션의 봇 선택: ${bot.name}`);
        setSelectedBot(bot);
      } else {
        console.warn(`⚠️ 세션의 봇을 찾을 수 없음: ${session.botId}`);
      }
    }
    
    try {
      // 캐시된 userId 사용 (일관성 보장)
      const userId = localStorage.getItem('chatUserId') || user?.id || user?.email;
      const url = `/api/chat-messages?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`;
      console.log(`📡 메시지 조회 요청: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 메시지 조회 응답: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 메시지 데이터:`, data);
        
        const msgs = (data.messages || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.createdAt),
        }));
        
        console.log(`✅ ${msgs.length}개 메시지 로드됨`);
        setMessages(msgs);
      } else {
        const errorData = await response.json();
        console.error(`❌ 메시지 로드 실패: ${response.status}`, errorData);
        
        if (response.status === 403) {
          alert("이 세션에 접근할 권한이 없습니다.");
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("❌ 메시지 로드 오류:", error);
    }
  };

  const saveMessage = async (sessionId: string, message: Message) => {
    // 캐시된 userId 사용 (일관성 보장)
    const userId = localStorage.getItem('chatUserId') || user?.id || user?.email;
    
    if (!userId) {
      console.warn('⚠️ userId가 없어 메시지를 저장할 수 없습니다');
      return;
    }
    
    try {
      await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: message.id,
          sessionId: sessionId,
          userId: userId,
          role: message.role,
          content: message.content,
          imageUrl: message.imageUrl,
          audioUrl: message.audioUrl,
        }),
      });
    } catch (error) {
      console.error("메시지 저장 실패:", error);
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
      await saveChatSession(newSession);
      setCurrentSessionId(sessionId);
    }

    // 사용자 메시지 저장
    await saveMessage(sessionId, userMessage);

    try {
      console.log('📤 AI 챗봇 API 호출 시작');
      console.log('📦 요청 데이터:', {
        message: input.trim().substring(0, 50) + '...',
        botId: selectedBot.id,
        botName: selectedBot.name,
        historyLength: messages.length,
        userId: user?.id,
        sessionId: sessionId,
      });
      
      const requestBody = {
        message: input.trim(),
        botId: selectedBot.id,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        userId: user?.id,
        sessionId: sessionId,
      };
      
      console.log('📡 API 호출: POST /api/ai-chat');
      
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API 응답 성공:', {
          success: data.success,
          responseLength: data.response?.length,
          responsePreview: data.response?.substring(0, 100)
        });
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || "응답을 생성할 수 없습니다.",
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        // AI 응답 저장
        await saveMessage(sessionId, assistantMessage);
        
        // 세션의 lastMessage 업데이트
        const currentSession = chatSessions.find(s => s.id === sessionId);
        const updatedSession: ChatSession = {
          id: sessionId,
          title: currentSession?.title || userMessage.content.substring(0, 30),
          lastMessage: assistantMessage.content.substring(0, 100),
          timestamp: new Date(),
          botId: selectedBot.id,
        };
        await saveChatSession(updatedSession);
        console.log('✅ 세션 업데이트 완료:', sessionId);
      } else {
        const errorData = await response.json();
        console.error('❌ API 응답 오류:', {
          status: response.status,
          errorData: errorData,
        });
        throw new Error(errorData.message || "AI 응답 실패");
      }
    } catch (error: any) {
      console.error('❌ AI 채팅 오류:', error);
      console.error('❌ 에러 타입:', error.constructor.name);
      console.error('❌ 에러 메시지:', error.message);
      console.error('❌ 에러 스택:', error.stack);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `죄송합니다. 오류가 발생했습니다: ${error.message || "다시 시도해주세요."}`,
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

  const playTTS = async (text: string, messageId: string) => {
    try {
      // Check if voice is enabled (handle 1, "1", true)
      const voiceFlag = selectedBot?.voiceEnabled;
      const isVoiceEnabled = voiceFlag === 1 || voiceFlag === "1" || voiceFlag === true || Number(voiceFlag) === 1;
      
      console.log('🔊 TTS Check:', { 
        bot: selectedBot?.name,
        voiceEnabled: selectedBot?.voiceEnabled, 
        type: typeof selectedBot?.voiceEnabled,
        isVoiceEnabled,
        voiceName: selectedBot?.voiceName
      });
      
      if (!selectedBot || !isVoiceEnabled) {
        console.log('🔇 TTS not enabled for this bot');
        alert('이 AI 봇은 음성 출력 기능이 활성화되지 않았습니다.');
        return;
      }

      console.log('🔊 Playing TTS for message:', messageId);
      
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceName: selectedBot.voiceName || 'ko-KR-Wavenet-A',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS API failed');
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 audio to blob and play
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log('✅ TTS playback started');
      
    } catch (error) {
      console.error('❌ TTS playback error:', error);
      alert('음성 재생에 실패했습니다.');
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handlePrintProblems = async () => {
    // enableProblemGeneration 체크 (1, "1", true 모두 허용)
    const enableFlag = selectedBot?.enableProblemGeneration;
    const isProblemGenerationEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;
    
    console.log('📝 Problem Generation Check:', {
      bot: selectedBot?.name,
      enableProblemGeneration: selectedBot?.enableProblemGeneration,
      type: typeof selectedBot?.enableProblemGeneration,
      isProblemGenerationEnabled
    });
    
    if (!isProblemGenerationEnabled) {
      alert('이 AI 봇은 문제 출제 기능이 활성화되지 않았습니다.\n\n봇 설정에서 "📝 유사문제 출제 기능"을 활성화해주세요.');
      console.error('❌ enableProblemGeneration:', selectedBot?.enableProblemGeneration, typeof selectedBot?.enableProblemGeneration);
      return;
    }

    if (messages.length === 0) {
      alert('출력할 문제가 없습니다. 먼저 AI와 대화를 나눠보세요.');
      return;
    }

    console.log('🖨️ 문제지 출력 시작...');
    console.log('📝 전체 메시지 개수:', messages.length);

    // Extract problems from AI assistant messages
    // 정확한 문제만 추출: 명시적으로 번호가 매겨진 문제만 추출
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    console.log('🤖 AI 응답 메시지 개수:', assistantMessages.length);

    const extractedProblems: { number: number; content: string; hasAnswer: boolean; type: 'multiple' | 'descriptive' }[] = [];

    assistantMessages.forEach((msg, index) => {
      const content = msg.content;
      
      // 1. 먼저 번호가 있는 문제 형식인지 확인 (1. 또는 1) 또는 **1.** 형태)
      const numberedProblemRegex = /(?:^|\n)(?:\*\*)?(\d+)[\.\)]\s*(?:\*\*)?(.+?)(?=(?:\n(?:\*\*)?(?:\d+)[\.\)]|\n\n|$))/gs;
      const matches = [...content.matchAll(numberedProblemRegex)];
      
      if (matches.length > 0) {
        // 번호가 매겨진 문제들만 추출
        matches.forEach((match) => {
          const problemNumber = match[1];
          let problemContent = match[2].trim();
          
          // "문제:", "[문제]" 등의 레이블 제거
          problemContent = problemContent.replace(/^(?:\[문제\]|\*\*문제\*\*|문제:)\s*/i, '');
          
          // 풀이, 답, 해설 등이 포함되어 있으면 그 부분 제거
          let hasAnswer = false;
          const answerKeywords = [
            '\n풀이:', '\n답:', '\n해설:', '\n정답:', 
            '\n[풀이]', '\n[답]', '\n[해설]', '\n[정답]',
            '\n**풀이**', '\n**답**', '\n**해설**', '\n**정답**'
          ];
          
          for (const keyword of answerKeywords) {
            if (problemContent.includes(keyword)) {
              hasAnswer = true;
              const parts = problemContent.split(keyword);
              problemContent = parts[0].trim();
              break;
            }
          }
          
          // 문제만 추출 (설명, 도입부 제외)
          // "다음을 계산하시오", "다음 문제를 풀어보세요" 같은 순수한 문제 형식만 허용
          const isPureProbl = 
            /계산하시오|구하시오|풀이하시오|풀어보세요|답하시오|풀어라|구하세요|계산하세요|구해보세요/.test(problemContent) ||
            problemContent.includes('=') ||
            problemContent.includes('?');
          
          // 객관식 문제인지 판단 (①, ②, ③, ④, ⑤ 또는 1), 2), 3), 4), 5) 형태의 선택지 포함)
          const isMultipleChoice = /[①②③④⑤]|[\(（]?[1-5][\)）]\s*[^\d]/.test(problemContent);
          
          // 순수 문제 형식이고, 길이가 적당하면 추가 (너무 길면 설명이 섞인 것)
          if (isPureProbl && problemContent.length > 5 && problemContent.length < 800) {
            extractedProblems.push({
              number: parseInt(problemNumber),
              content: problemContent,
              hasAnswer: hasAnswer,
              type: isMultipleChoice ? 'multiple' : 'descriptive'
            });
          }
        });
      }
    });

    console.log('📋 추출된 문제 개수:', extractedProblems.length);
    console.log('📋 문제 상세:', extractedProblems.map(p => ({ 
      number: p.number, 
      type: p.type,
      length: p.content.length, 
      hasAnswer: p.hasAnswer,
      preview: p.content.substring(0, 50) + '...'
    })));

    if (extractedProblems.length === 0) {
      alert('출력할 문제를 찾을 수 없습니다.\n\nAI에게 "수학 문제 3개 출제해줘" 같은 요청을 먼저 해보세요.');
      return;
    }

    // 문제를 객관식과 서술형으로 분리
    const multipleChoiceProblems = extractedProblems.filter(p => p.type === 'multiple');
    const descriptiveProblems = extractedProblems.filter(p => p.type === 'descriptive');

    // 각 섹션별로 1번부터 번호 재정렬
    multipleChoiceProblems.forEach((p, index) => {
      p.number = index + 1;
    });
    descriptiveProblems.forEach((p, index) => {
      p.number = index + 1;
    });

    console.log('📝 객관식 문제:', multipleChoiceProblems.length, '개');
    console.log('📝 서술형 문제:', descriptiveProblems.length, '개');

    const problems = extractedProblems;

    // Get academy name
    let academyName = '학원';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        academyName = data.academyName || academyName;
      }
    } catch (error) {
      console.error('Failed to fetch academy name:', error);
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>문제지 - ${academyName}</title>
        <style>
          @media print {
            @page { 
              margin: 1.5cm 1cm;
              size: A4 portrait;
            }
            .no-print { display: none !important; }
            .editable-name { border: none !important; }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            max-width: 21cm;
            margin: 0 auto;
            padding: 1.5cm 1cm;
            background: white;
            color: #000;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
          }
          .academy-name {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #1a1a1a;
          }
          .worksheet-title {
            font-size: 16px;
            color: #555;
            margin-top: 5px;
          }
          .editable-name {
            display: inline-block;
            min-width: 200px;
            padding: 4px 8px;
            border: 2px dashed #3b82f6;
            border-radius: 4px;
            background: #eff6ff;
            cursor: text;
          }
          .editable-name:focus {
            outline: none;
            border-color: #2563eb;
            background: #dbeafe;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            margin: 20px 0 15px 0;
            padding: 8px 10px;
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
          }
          .student-info {
            margin-bottom: 20px;
            font-size: 13px;
            display: flex;
            gap: 20px;
          }
          .student-info-line {
            display: flex;
            align-items: center;
            flex: 1;
          }
          .student-info-label {
            font-weight: 600;
            margin-right: 8px;
          }
          .student-info-input {
            flex: 1;
            border-bottom: 1px solid #000;
            min-height: 18px;
          }
          .problems-container {
            column-count: 2;
            column-gap: 20px;
            column-rule: 1px solid #e5e7eb;
          }
          .problem {
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .problem-number {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #1a1a1a;
          }
          .problem-content {
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            margin-bottom: 10px;
          }
          .answer-space {
            margin-top: 12px;
            min-height: 40px;
          }
          .answer-line {
            border-bottom: 1px solid #ccc;
            height: 24px;
            margin-bottom: 4px;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="academy-name">${academyName}</div>
          <div class="worksheet-title">학습 문제지</div>
        </div>

        <div class="student-info">
          <div class="student-info-line">
            <span class="student-info-label">이름:</span>
            <span class="student-info-input"></span>
          </div>
          <div class="student-info-line">
            <span class="student-info-label">날짜:</span>
            <span class="student-info-input">${new Date().toLocaleDateString('ko-KR')}</span>
          </div>
        </div>

        ${multipleChoiceProblems.length > 0 ? `
        <div class="section-title">객관식 문제</div>
        <div class="problems-container">
        ${multipleChoiceProblems.map((p, index) => `
          <div class="problem">
            <div class="problem-number">${p.number}. </div>
            <div class="problem-content">${p.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
        </div>
        ${multipleChoiceProblems.length > 7 ? '<div class="page-break"></div>' : ''}
        ` : ''}

        ${descriptiveProblems.length > 0 ? `
        ${multipleChoiceProblems.length > 5 ? '<div class="page-break"></div>' : ''}
        <div class="section-title">서술형 문제</div>
        <div class="problems-container">
        ${descriptiveProblems.map((p, index) => `
          <div class="problem">
            <div class="problem-number">${p.number}. </div>
            <div class="problem-content">${p.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="answer-space">
              <div class="answer-line"></div>
              <div class="answer-line"></div>
            </div>
          </div>
        `).join('')}
        </div>
        ` : ''}

        <div class="no-print" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 15px 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <button onclick="window.print()" style="padding: 10px 25px; font-size: 14px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
            인쇄
          </button>
          <button onclick="window.close()" style="padding: 10px 25px; font-size: 14px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
            닫기
          </button>
        </div>
        
        <script>
          // Auto print on load (optional)
          // window.onload = function() { setTimeout(() => window.print(), 500); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    console.log(`📷 이미지 업로드: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // 이미지를 base64로 변환
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      
      // 입력창에 이미지 업로드 메시지 설정
      setInput("이 이미지에 대해 설명해주세요.");
      
      // 파일 입력 초기화
      if (e.target) {
        e.target.value = '';
      }
      
      console.log(`✅ 이미지 base64 변환 완료 (길이: ${base64Image.length})`);
      
      // 이미지와 함께 메시지 전송
      await handleSendWithImage(base64Image);
    };
    
    reader.onerror = (error) => {
      console.error("❌ 이미지 읽기 실패:", error);
      alert("이미지를 읽는 중 오류가 발생했습니다.");
    };
    
    reader.readAsDataURL(file);
  };

  const handleSendWithImage = async (imageUrl: string) => {
    if (!selectedBot) {
      alert("봇을 먼저 선택해주세요.");
      return;
    }

    const messageText = input.trim() || "이 이미지에 대해 설명해주세요.";
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      imageUrl: imageUrl,
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
        title: "이미지 분석",
        lastMessage: messageText,
        timestamp: new Date(),
        botId: selectedBot.id,
      };
      await saveChatSession(newSession);
      setCurrentSessionId(sessionId);
    }

    // 사용자 메시지 저장 (이미지 URL 포함)
    await saveMessage(sessionId, userMessage);

    try {
      console.log('📤 이미지 포함 AI 챗봇 API 호출');
      console.log('📦 요청 데이터:', {
        message: messageText.substring(0, 50) + '...',
        botId: selectedBot.id,
        hasImage: true,
        imageLength: imageUrl.length,
      });
      
      const requestBody = {
        message: messageText,
        botId: selectedBot.id,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        userId: user?.id,
        sessionId: sessionId,
        imageUrl: imageUrl, // ✅ 이미지 URL 포함
      };
      
      console.log('📡 API 호출: POST /api/ai-chat (이미지 포함)');
      
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API 응답 성공:', {
          success: data.success,
          responseLength: data.response?.length,
          responsePreview: data.response?.substring(0, 100)
        });
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || "응답을 생성할 수 없습니다.",
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        // AI 응답 저장
        await saveMessage(sessionId, assistantMessage);
        
        // 세션의 lastMessage 업데이트
        const currentSession = chatSessions.find(s => s.id === sessionId);
        const updatedSession: ChatSession = {
          id: sessionId,
          title: currentSession?.title || userMessage.content.substring(0, 30),
          lastMessage: assistantMessage.content.substring(0, 100),
          timestamp: new Date(),
          botId: selectedBot.id,
        };
        await saveChatSession(updatedSession);
        console.log('✅ 세션 업데이트 완료:', sessionId);
      } else {
        const errorData = await response.json();
        console.error('❌ API 응답 오류:', {
          status: response.status,
          errorData: errorData,
        });
        throw new Error(errorData.message || "AI 응답 실패");
      }
    } catch (error: any) {
      console.error('❌ AI 채팅 오류:', error);
      console.error('❌ 에러 메시지:', error.message);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `죄송합니다. 이미지 분석 중 오류가 발생했습니다: ${error.message || "다시 시도해주세요."}`,
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* 왼쪽 사이드바 */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50 h-full ${
          isMobile && sidebarOpen ? "absolute z-50 shadow-2xl" : ""
        }`}
      >
        {/* 사이드바 헤더 - 고정 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">AI 챗봇</h2>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* 대시보드로 나가기 버튼 */}
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 나가기
          </Button>
          
          {/* 새 대화 버튼 */}
          <Button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 대화
          </Button>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 - 나의 봇부터 채팅 기록까지 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 나의 봇 */}
          <div className="px-3 py-3 border-b border-gray-200 bg-white">
            <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              나의 봇
            </h3>
            <div className="space-y-1">
              {bots.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">할당된 봇이 없습니다</p>
              ) : (
                bots.map((bot) => (
                  <button
                    key={bot.id}
                    onClick={() => {
                      console.log(`🤖 봇 선택: ${bot.name} (${bot.id})`);
                      console.log('📊 봇 기능 상태:', {
                        enableProblemGeneration: bot.enableProblemGeneration,
                        enableProblemGenerationType: typeof bot.enableProblemGeneration,
                        voiceEnabled: bot.voiceEnabled,
                        voiceEnabledType: typeof bot.voiceEnabled,
                        voiceName: bot.voiceName
                      });
                      setSelectedBot(bot);
                      // 새로운 채팅 시작
                      createNewChat();
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      selectedBot?.id === bot.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{bot.profileIcon || "🤖"}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium truncate">{bot.name}</div>
                      {bot.description && (
                        <div className="text-xs opacity-80 truncate">{bot.description}</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-b-2 border-gray-300 mx-3"></div>

          {/* 검색 창 */}
          <div className="px-3 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="대화 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg 
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 채팅 기록 */}
          <div className="px-3 py-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              최근 대화 {searchQuery && `(${chatSessions.filter(s => 
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              ).length}개)`}
            </h3>
            <div className="space-y-1">
              {chatSessions.filter(s => 
                !searchQuery || 
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  {searchQuery ? "검색 결과가 없습니다" : "대화 기록이 없습니다"}
                </p>
              ) : (
                chatSessions
                  .filter(s => 
                    !searchQuery || 
                    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      currentSessionId === session.id
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      loadSession(session.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {session.lastMessage || "대화 없음"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 대화를 삭제하시겠습니까?')) {
                          deleteSession(session.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
            >
              <Menu className="w-5 h-5" />
            </button>
            {selectedBot && (
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedBot.profileIcon || "🤖"}</div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedBot.name}</h2>
                  <p className="text-xs text-gray-600">{selectedBot.description || "AI 어시스턴트"}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* 유사문제 출제 기능이 활성화된 경우에만 버튼 표시 */}
            {selectedBot && messages.length > 0 && (() => {
              const enableFlag = selectedBot.enableProblemGeneration;
              const isProblemEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;
              return isProblemEnabled && (
                <Button
                  onClick={handlePrintProblems}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-medium"
                  title="문제지를 출력합니다"
                >
                  <Printer className="w-4 h-4" />
                  문제지 출력
                </Button>
              );
            })()}
            <span className="text-xs text-gray-500">안녕하세요, {user?.name}님</span>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {bots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚫</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  사용 가능한 AI 봇이 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  관리자가 AI 봇을 할당하지 않았거나 사용 기간이 만료되었습니다.
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="mt-4"
                >
                  대시보드로 돌아가기
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{selectedBot?.profileIcon || "🤖"}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedBot?.name}에게 무엇이든 물어보세요
                </h3>
                <p className="text-gray-600">{selectedBot?.description}</p>
                
                {/* Feature Status Badges */}
                <div className="flex gap-2 justify-center mt-4">
                  {(() => {
                    const enableFlag = selectedBot?.enableProblemGeneration;
                    const isProblemEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;
                    return isProblemEnabled && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📝 문제 출제 가능
                      </span>
                    );
                  })()}
                  {(() => {
                    const voiceFlag = selectedBot?.voiceEnabled;
                    const isVoiceEnabled = voiceFlag === 1 || voiceFlag === "1" || voiceFlag === true || Number(voiceFlag) === 1;
                    return isVoiceEnabled && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🔊 음성 출력 지원
                      </span>
                    );
                  })()}
                </div>
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
                    {message.role === "assistant" && (() => {
                      const voiceFlag = selectedBot?.voiceEnabled;
                      const isVoiceEnabled = voiceFlag === 1 || voiceFlag === "1" || voiceFlag === true || Number(voiceFlag) === 1;
                      return isVoiceEnabled && (
                        <button
                          onClick={() => playTTS(message.content, message.id)}
                          className="ml-2 p-2 rounded-full hover:bg-gray-200 transition-colors"
                          title="음성으로 듣기"
                        >
                          <Volume2 className="w-4 h-4 text-gray-600" />
                        </button>
                      );
                    })()}
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
            {bots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  AI 봇이 할당되지 않아 채팅을 사용할 수 없습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2 bg-gray-100 rounded-3xl p-2">
                  {/* 이미지 업로드 버튼 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    disabled={loading || !selectedBot}
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
                    disabled={loading || !selectedBot}
                  />

                  {/* 음성 입력 버튼 */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                        : "hover:bg-gray-200"
                    }`}
                    disabled={loading || !selectedBot}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* 전송 버튼 */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading || !selectedBot}
                    className={`p-2 rounded-full transition-colors ${
                      input.trim() && !loading && selectedBot
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
