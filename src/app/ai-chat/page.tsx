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
  Volume2,
  VolumeX
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
        console.log('✅ 활성 봇 목록:', activeBots.map(b => ({ id: b.id, name: b.name, isActive: b.isActive })));
        
        if (activeBots.length > 0) {
          console.log('✅ setBots 호출:', activeBots.length, '개');
          setBots(activeBots);
          if (!selectedBot) {
            console.log('✅ 첫 번째 봇 선택:', activeBots[0].name);
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

  const fetchBots = async (academyId: string) => {
    try {
      console.log(`🔍 학원(${academyId})의 할당된 봇 조회`);
      
      const response = await fetch(`/api/user/ai-bots?academyId=${academyId}`);
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
    // 🔥 현재 로그인한 사용자의 ID를 직접 사용 (캐시 사용 X)
    const userId = user?.id || user?.email;
    
    if (!userId) {
      console.warn('⚠️ userId가 없어서 세션을 로드할 수 없습니다');
      console.warn('⚠️ user 객체:', user);
      return;
    }
    
    console.log('🔑 현재 사용자 ID:', userId);
    
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
    // 🔥 현재 로그인한 사용자의 ID를 직접 사용 (캐시 사용 X)
    const userId = user?.id || user?.email;
    const academyId = user?.academyId || 'default-academy';
    
    if (!userId || !academyId) {
      console.warn('⚠️ userId 또는 academyId가 없어 세션을 저장할 수 없습니다', { userId, academyId });
      return;
    }
    
    console.log('🔑 세션 저장 - 현재 사용자 ID:', userId);
    
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
        
        // AI 응답을 음성으로 재생
        speakText(assistantMessage.content);
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

  // Text-to-Speech: AI 응답을 음성으로 재생
  const speakText = (text: string) => {
    // 이미 말하고 있으면 중지
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // 브라우저가 Speech Synthesis API를 지원하는지 확인
    if (!('speechSynthesis' in window)) {
      console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 한국어로 설정
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0; // 속도
    utterance.pitch = 1.0; // 음높이
    utterance.volume = 1.0; // 볼륨

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('🔊 음성 재생 시작');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('🔇 음성 재생 종료');
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      console.error('음성 재생 오류:', event);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text: 음성을 텍스트로 변환
  const startVoiceRecognition = () => {
    // 브라우저가 Speech Recognition API를 지원하는지 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      console.log('🎤 음성 인식 시작');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('✅ 인식된 텍스트:', transcript);
      
      // 인식된 텍스트를 입력창에 추가
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error);
      setIsRecording(false);
      
      if (event.error === 'no-speech') {
        alert('음성이 감지되지 않았습니다. 다시 시도해주세요.');
      } else if (event.error === 'not-allowed') {
        alert('마이크 권한을 허용해주세요.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('🔇 음성 인식 종료');
    };

    recognition.start();
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
        
        // AI 응답을 음성으로 재생
        speakText(assistantMessage.content);
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
        } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden ${
          isMobile && sidebarOpen ? "absolute z-50 h-full shadow-2xl" : ""
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200 space-y-3">
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

        {/* 나의 봇 */}
        <div className="px-3 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            나의 봇
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {bots.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">할당된 봇이 없습니다</p>
            ) : (
              bots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    console.log(`🤖 봇 선택: ${bot.name} (${bot.id})`);
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
        <div className="px-3 py-3 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto px-3 py-3">
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
          <div className="flex items-center gap-2">
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
                    <div className="flex items-start gap-2">
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
                      {/* AI 메시지에 음성 재생 버튼 추가 */}
                      {message.role === "assistant" && (
                        <button
                          onClick={() => speakText(message.content)}
                          className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                          title={isSpeaking ? "음성 중지" : "음성으로 듣기"}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      )}
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
            {bots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  AI 봇이 할당되지 않아 채팅을 사용할 수 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* 이미지 미리보기 */}
                {imagePreview && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={cancelImagePreview}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="이미지 제거"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          📷 이미지가 첨부되었습니다
                        </p>
                        <p className="text-xs text-gray-500">
                          메시지를 입력하고 전송 버튼을 눌러주세요. 메시지 없이 전송하면 "이 이미지에 대해 설명해주세요"로 전송됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                    onClick={startVoiceRecognition}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                        : "hover:bg-gray-200"
                    }`}
                    disabled={loading || !selectedBot}
                    title="음성으로 입력하기"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* 전송 버튼 */}
                  <button
                    onClick={() => {
                      if (imagePreview) {
                        sendWithPreviewedImage();
                      } else {
                        handleSend();
                      }
                    }}
                    disabled={(!input.trim() && !imagePreview) || loading || !selectedBot}
                    className={`p-2 rounded-full transition-colors ${
                      (input.trim() || imagePreview) && !loading && selectedBot
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    title={imagePreview ? "이미지와 함께 전송" : "메시지 전송"}
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
