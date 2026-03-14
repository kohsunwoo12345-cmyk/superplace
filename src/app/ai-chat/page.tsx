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
  Volume2,
  CheckSquare,
  Square
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
  selectedForPrint?: boolean;
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
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  
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
    
    // 일단 기본 사용자 정보 설정
    setUser(userData);
    
    // 학원 정보 비동기 로드를 즉시 실행 함수로 처리
    (async () => {
      if (userData.academyId && !userData.academyName) {
        try {
          const response = await fetch(`/api/academies/${userData.academyId}`);
          if (response.ok) {
            const data = await response.json();
            userData.academyName = data.academy?.name || userData.name;
            console.log('🏫 Academy name loaded:', userData.academyName);
            // 학원 이름이 로드되면 사용자 정보 다시 업데이트
            setUser({...userData});
          }
        } catch (e) {
          console.log('⚠️ Could not load academy name, using user name');
          userData.academyName = userData.name;
          setUser({...userData});
        }
      }
    })();
    
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
    
    // Web Speech API 음성 목록 미리 로드
    if ('speechSynthesis' in window) {
      // 음성 목록을 로드하기 위해 getVoices 호출
      window.speechSynthesis.getVoices();
      // 일부 브라우저는 비동기적으로 로드하므로 이벤트 리스너 추가
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Available voices loaded:', voices.length);
        const koreanVoices = voices.filter(v => v.lang.startsWith('ko'));
        console.log('🇰🇷 Korean voices:', koreanVoices.map(v => v.name));
      };
    }
    
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
          // 🔒 각 봇에 대해 접근 권한 체크 (학생만)
          let accessibleBots = data.bots;
          if (user?.role === 'STUDENT') {
            console.log('🔐 학생 계정 - 봇 접근 권한 체크 중...');
            const accessChecks = await Promise.all(
              data.bots.map(async (bot: AIBot) => {
                try {
                  const checkResponse = await fetch(
                    `/api/user/bot-access-check?userId=${user.id}&botId=${bot.id}&academyId=${academyId}`
                  );
                  if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    return { bot, hasAccess: checkData.hasAccess, reason: checkData.reason };
                  }
                  return { bot, hasAccess: false, reason: 'API 오류' };
                } catch (err) {
                  console.error(`❌ 봇 ${bot.id} 접근 권한 체크 실패:`, err);
                  return { bot, hasAccess: false, reason: '접근 권한 확인 실패' };
                }
              })
            );
            
            accessibleBots = accessChecks
              .filter(check => check.hasAccess)
              .map(check => check.bot);
            
            const blockedBots = accessChecks.filter(check => !check.hasAccess);
            if (blockedBots.length > 0) {
              console.warn('🚫 접근 불가 봇:', blockedBots.map(b => `${b.bot.name} (${b.reason})`));
            }
            
            console.log(`✅ 접근 가능한 봇: ${accessibleBots.length}/${data.bots.length}`);
          }
          
          setBots(accessibleBots);
          if (!selectedBot && accessibleBots.length > 0) {
            setSelectedBot(accessibleBots[0]);
          } else if (accessibleBots.length === 0) {
            alert('사용 가능한 AI 봇이 없습니다. 구독 기간이 만료되었거나 할당 인원이 초과되었을 수 있습니다.');
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
    // 🔒 보안: 항상 현재 로그인한 user.id를 사용 (캐시 사용 안 함)
    const userId = user?.id || user?.email;
    
    if (!userId) {
      console.warn('⚠️ userId가 없어서 세션을 로드할 수 없습니다');
      console.warn('⚠️ user 객체:', user);
      return;
    }
    
    console.log('🔒 채팅 세션 로드: userId =', userId);
    
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
    // 🔒 보안: 항상 현재 로그인한 user.id를 사용 (캐시 사용 안 함)
    const userId = user?.id || user?.email;
    const academyId = user?.academyId || 'default-academy';
    
    if (!userId || !academyId) {
      console.warn('⚠️ userId 또는 academyId가 없어 세션을 저장할 수 없습니다', { userId, academyId });
      return;
    }
    
    console.log('🔒 세션 저장: userId =', userId, ', sessionId =', session.id);
    
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
      // 🔒 보안: 항상 현재 로그인한 user.id를 사용 (캐시 사용 안 함)
      const userId = user?.id || user?.email;
      const url = `/api/chat-messages?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`;
      console.log(`🔒 메시지 조회 요청: userId=${userId}, url=${url}`);
      
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
    // 🔒 보안: 항상 현재 로그인한 user.id를 사용 (캐시 사용 안 함)
    const userId = user?.id || user?.email;
    
    if (!userId) {
      console.warn('⚠️ userId가 없어 메시지를 저장할 수 없습니다');
      return;
    }
    
    console.log('🔒 메시지 저장: userId =', userId, ', sessionId =', sessionId);
    
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

    // 🔒 학생 계정: 메시지 전송 전 봇 접근 권한 재확인
    if (user?.role === 'STUDENT' && user?.academyId) {
      try {
        const checkResponse = await fetch(
          `/api/user/bot-access-check?userId=${user.id}&botId=${selectedBot.id}&academyId=${user.academyId}`
        );
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (!checkData.hasAccess) {
            alert(`이 봇을 더 이상 사용할 수 없습니다.\n\n사유: ${checkData.reason}`);
            // 봇 목록 새로고침
            fetchBots(user.academyId);
            return;
          }
        }
      } catch (err) {
        console.error('❌ 봇 접근 권한 재확인 실패:', err);
      }
    }

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
        // 🔥 권한 체크용 추가 정보
        userRole: user?.role,
        userAcademyId: user?.academyId,
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
      
      // Use Web Speech API (브라우저 내장 TTS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 한국어 음성 설정
        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
        
        if (koreanVoice) {
          utterance.voice = koreanVoice;
          console.log('✅ Using Korean voice:', koreanVoice.name);
        } else {
          console.log('⚠️ No Korean voice found, using default');
        }
        
        utterance.lang = 'ko-KR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log('🔊 TTS playback started');
        };
        
        utterance.onend = () => {
          console.log('✅ TTS playback finished');
        };
        
        utterance.onerror = (event) => {
          console.error('❌ TTS error:', event);
          alert('음성 재생 중 오류가 발생했습니다.');
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        alert('이 브라우저는 음성 출력을 지원하지 않습니다.');
      }
      
    } catch (error) {
      console.error('❌ TTS playback error:', error);
      alert('음성 재생에 실패했습니다.');
    }
  };


  // 체크박스 토글 - 선택 시 바로 문제 출력
  const toggleMessageSelection = async (messageId: string) => {
    console.log('✅ Message selected for immediate print:', messageId);
    
    // 선택된 메시지 찾기
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') {
      console.error('❌ Invalid message for problem generation');
      return;
    }
    
    // 선택 상태 업데이트
    const newSet = new Set<string>();
    newSet.add(messageId);
    setSelectedMessageIds(newSet);
    
    // enableProblemGeneration 체크
    const enableFlag = selectedBot?.enableProblemGeneration;
    const isProblemGenerationEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;
    
    if (!isProblemGenerationEnabled) {
      alert('이 AI 봇은 문제 출제 기능이 활성화되지 않았습니다.');
      return;
    }

    console.log('🖨️ Immediately generating PDF for selected message...');

    try {
      // 문제 추출
      const extractedProblems: Array<{
        number: number;
        content: string;
        answer: string;
        type: 'multiple' | 'descriptive';
      }> = [];

      let fullText = message.content;
      console.log('📄 Full text length:', fullText.length);
      
      // 개선된 문제 추출 패턴 - **숫자. 문제내용** 형식도 지원
      const problemPattern = /(?:^|\n)\*?\*?(\d+)\.\s*([^\n]+(?:\n(?!\*?\*?\d+\.)(?!정답|답\s*:).+)*)/g;
      const matches = [...fullText.matchAll(problemPattern)];

      console.log(`🔍 Found ${matches.length} problems with pattern matching`);

      if (matches.length > 0) {
        matches.forEach((match) => {
          const problemNumber = parseInt(match[1]);
          const problemContent = match[2].trim();
          
          // 선택지 포함 여부 확인
          const hasChoices = /[①②③④⑤]/.test(problemContent);
          
          extractedProblems.push({
            number: problemNumber,
            content: problemContent,
            answer: '', // 별도 정답 섹션에서 추출
            type: hasChoices ? 'multiple' : 'descriptive'
          });
        });
        
        console.log(`✅ Extracted ${extractedProblems.length} problems`);
      } else {
        // Fallback: 전체 텍스트를 문제로 처리
        console.log('⚠️ No pattern match, using full text');
        extractedProblems.push({
          number: 1,
          content: fullText,
          answer: '',
          type: 'descriptive'
        });
      }

      if (extractedProblems.length === 0) {
        alert('문제를 찾을 수 없습니다.');
        return;
      }

      console.log(`📝 Generating print view with ${extractedProblems.length} problems`);

      // 학원 이름 가져오기
      const academyName = user?.academyName || '학원';
      const printDate = new Date().toLocaleDateString('ko-KR');

      // 답안지용 정답 목록
      const answers = extractedProblems.map(p => ({
        number: p.number,
        answer: p.answer || '(정답 없음)'
      }));

      // 문제지 HTML 생성
      const problemsHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>문제지</title>
          <style>
            @media print {
              @page { 
                margin: 15mm 20mm;
                size: A4;
              }
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            body {
              font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
              line-height: 1.8;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .academy-name {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .test-info {
              font-size: 13px;
              color: #333;
            }
            .student-info {
              margin: 15px 0 25px 0;
              font-size: 14px;
            }
            .student-info span {
              display: inline-block;
              margin-right: 30px;
            }
            .underline {
              display: inline-block;
              border-bottom: 1px solid #000;
              min-width: 80px;
              margin-left: 5px;
            }
            .problem {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .problem-number {
              font-weight: bold;
              font-size: 15px;
              margin-bottom: 6px;
            }
            .problem-content {
              font-size: 14px;
              white-space: pre-wrap;
              line-height: 1.7;
              padding-left: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="academy-name">${academyName}</div>
            <div class="test-info">문제지 · ${printDate}</div>
          </div>
          
          <div class="student-info">
            <span>학년: <span class="underline"></span></span>
            <span>이름: <span class="underline"></span></span>
          </div>

          ${extractedProblems.map(problem => `
            <div class="problem">
              <div class="problem-number">${problem.number}.</div>
              <div class="problem-content">${problem.content.replace(/\n/g, '<br>').replace(/\*\*/g, '')}</div>
            </div>
          `).join('')}

          <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0f0;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">인쇄하기</button>
            <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">닫기</button>
          </div>
        </body>
        </html>
      `;

      // 답안지 HTML 생성
      const answerSheetHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>답안지</title>
          <style>
            @media print {
              @page { 
                margin: 15mm 20mm;
                size: A4;
              }
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
              line-height: 1.8;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .academy-name {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .test-info {
              font-size: 13px;
              color: #333;
            }
            .answer-list {
              margin-top: 30px;
            }
            .answer-item {
              padding: 8px 0;
              border-bottom: 1px solid #eee;
              font-size: 14px;
            }
            .answer-number {
              display: inline-block;
              width: 50px;
              font-weight: bold;
            }
            .answer-content {
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="academy-name">${academyName}</div>
            <div class="test-info">답안지 · ${printDate}</div>
          </div>

          <div class="answer-list">
            ${answers.map(ans => `
              <div class="answer-item">
                <span class="answer-number">${ans.number}.</span>
                <span class="answer-content">${ans.answer.replace(/\*\*/g, '')}</span>
              </div>
            `).join('')}
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0f0;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">인쇄하기</button>
            <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">닫기</button>
          </div>
        </body>
        </html>
      `;

      // 문제지 창 열기
      const problemWindow = window.open('', '_blank');
      if (problemWindow) {
        problemWindow.document.write(problemsHtml);
        problemWindow.document.close();
        
        // 로드 완료 후 인쇄창 열기
        problemWindow.onload = () => {
          problemWindow.focus();
          setTimeout(() => problemWindow.print(), 100);
        };
      }

      // 답안지 창 열기 (1초 후)
      setTimeout(() => {
        const answerWindow = window.open('', '_blank');
        if (answerWindow) {
          answerWindow.document.write(answerSheetHtml);
          answerWindow.document.close();
          
          answerWindow.onload = () => {
            answerWindow.focus();
            setTimeout(() => answerWindow.print(), 100);
          };
        }
      }, 1000);

      console.log(`✅ Print windows opened: ${extractedProblems.length} problems`);
      alert(`문제지와 답안지 인쇄창이 열렸습니다!\n${extractedProblems.length}개의 문제`);
      
    } catch (error: any) {
      console.error('❌ PDF generation error:', error);
      alert(`문제지 생성 중 오류: ${error.message}`);
    }
  };

  const handlePrintProblems = async () => {
    console.log('🖨️ handlePrintProblems called!');
    
    try {
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
    console.log('📋 선택된 메시지 ID:', Array.from(selectedMessageIds));

    // 체크된 메시지만 필터링 (체크박스 선택이 필수)
    if (selectedMessageIds.size === 0) {
      alert('출력할 메시지를 선택해주세요. 각 AI 응답 옆의 체크박스를 클릭하여 선택할 수 있습니다.');
      return;
    }

    const assistantMessages = messages.filter(m => m.role === 'assistant' && selectedMessageIds.has(m.id));

    if (assistantMessages.length === 0) {
      alert('출력할 메시지를 선택해주세요. 각 AI 응답 옆의 체크박스를 클릭하여 선택할 수 있습니다.');
      return;
    }

    console.log('🖨️ 체크된 메시지만 출력:', assistantMessages.length);
    console.log('✅ 선택된 메시지 ID:', Array.from(selectedMessageIds));

    // ========== 문제 추출 로직 ==========
    console.log('📋 Starting problem extraction...');
    
    const extractedProblems: Array<{
      number: number;
      content: string;
      answer: string;
      type: 'multiple' | 'descriptive';
    }> = [];

    assistantMessages.forEach((msg, msgIndex) => {
      let fullText = msg.content;
      console.log(`\n🔍 Processing message ${msgIndex + 1}:`, fullText.substring(0, 100) + '...');
      
      // Step 0: 구분선으로 문제/답안 섹션 분리
      const separatorPatterns = [
        '\n**정답 및 해설**',
        '\n**정답**',
        '\n## 정답',
        '\n## 해설',
        '\n정답 및 해설',
        '\n정답:',
      ];
      
      let problemSection = fullText;
      let answerSection = '';
      let separatorFound = false;
      
      // 먼저 명확한 답안 키워드 검색
      for (const separator of separatorPatterns) {
        const sepIndex = fullText.indexOf(separator);
        if (sepIndex !== -1) {
          problemSection = fullText.substring(0, sepIndex);
          answerSection = fullText.substring(sepIndex + separator.length);
          console.log(`✂️  Found separator "${separator.trim()}" at index ${sepIndex}`);
          console.log(`📦 Problem section: ${problemSection.length} chars`);
          console.log(`📦 Answer section: ${answerSection.length} chars`);
          separatorFound = true;
          break;
        }
      }
      
      // 답안 키워드를 못 찾았으면 마지막 --- 구분선 찾기
      if (!separatorFound) {
        const allDashIndices = [];
        let searchIndex = 0;
        while (true) {
          const dashIndex = fullText.indexOf('\n---\n', searchIndex);
          if (dashIndex === -1) break;
          allDashIndices.push(dashIndex);
          searchIndex = dashIndex + 1;
        }
        
        if (allDashIndices.length > 0) {
          const lastDashIndex = allDashIndices[allDashIndices.length - 1];
          problemSection = fullText.substring(0, lastDashIndex);
          answerSection = fullText.substring(lastDashIndex + 5); // '\n---\n'.length = 5
          console.log(`✂️  Found last --- separator at index ${lastDashIndex}`);
          console.log(`📦 Problem section: ${problemSection.length} chars`);
          console.log(`📦 Answer section: ${answerSection.length} chars`);
        }
      }
      
      // 답안 섹션에서 답안 추출 (번호 -> 답안 매핑)
      const answersMap: { [key: string]: string } = {};
      if (answerSection.trim()) {
        const answerLines = answerSection.split('\n');
        let currentNum = '';
        let currentAnswer = '';
        
        for (const line of answerLines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          const match = trimmed.match(/^(\d+)[.\)]\s*(.*)$/);
          if (match) {
            // 이전 답안 저장
            if (currentNum && currentAnswer) {
              answersMap[currentNum] = currentAnswer.trim();
            }
            currentNum = match[1];
            currentAnswer = match[2] || '';
          } else {
            // 현재 답안에 텍스트 추가
            if (currentNum) {
              currentAnswer += '\n' + trimmed;
            }
          }
        }
        
        // 마지막 답안 저장
        if (currentNum && currentAnswer) {
          answersMap[currentNum] = currentAnswer.trim();
        }
        
        console.log(`✅ Extracted ${Object.keys(answersMap).length} answers from answer section:`, answersMap);
      }
      
      // Step 1: 문제 섹션에서 문제 추출
      const lines = problemSection.split('\n');
      let currentProblemNum = '';
      let currentProblemText = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        const numberMatch = trimmed.match(/^(\d+)[.\)]\s*(.*)$/);
        
        if (numberMatch) {
          // 이전 문제가 있으면 처리
          if (currentProblemNum && currentProblemText) {
            processProblem(currentProblemNum, currentProblemText);
          }
          // 새 문제 시작
          currentProblemNum = numberMatch[1];
          currentProblemText = numberMatch[2] || '';
        } else {
          // 현재 문제에 텍스트 추가
          currentProblemText += '\n' + trimmed;
        }
      }
      
      // 마지막 문제 처리
      if (currentProblemNum && currentProblemText) {
        processProblem(currentProblemNum, currentProblemText);
      }
      
      function processProblem(problemNum: string, fullProblemText: string) {
        fullProblemText = fullProblemText.trim();
        console.log(`\n📝 Found problem #${problemNum}`);
        console.log(`Raw text: "${fullProblemText.substring(0, 80)}..."`);
        
        let problemText = fullProblemText;
        
        // Step 2: 인라인 답안 제거 (혹시 문제 텍스트 안에 포함된 경우)
        problemText = problemText.replace(/[\(\[]답\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]Answer\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]정답\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]Solution\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]풀이\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]해설\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]정답\s*해설\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        problemText = problemText.replace(/[\(\[]해답\s*[:：]\s*[^\)\]]+[\)\]]/gi, '');
        
        // Step 3: 답안 키워드로 시작하는 부분 제거
        problemText = problemText.replace(/\n+답\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+정답\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+풀이\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+해설\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+정답\s*해설\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+정답\s*및\s*해설.*$/s, '');
        problemText = problemText.replace(/\n+해답\s*[:：].*$/s, '');
        problemText = problemText.replace(/\n+\*\*정답.*$/s, '');
        problemText = problemText.replace(/\n+Answer\s*[:：].*$/si, '');
        problemText = problemText.replace(/\n+Solution\s*[:：].*$/si, '');
        
        problemText = problemText.trim();
        
        // Step 4: 유효성 검사 (길이 + 기본 키워드 체크)
        const hasValidLength = problemText.length >= 10 && problemText.length <= 2000;
        const hasKeywords = /계산|구하|풀이|답하|선택|고르|쓰시오|바꾸|번역|해석|영작|맞는|틀린|일치|다음|알맞|적절|문제|solve|calculate|find|choose|what|which|translate|write|correct/i.test(problemText);
        const hasSpecialChars = /[=?①②③④⑤⑥⑦⑧⑨⑩]/.test(problemText);
        
        const isValidProblem = hasValidLength && (hasKeywords || hasSpecialChars);
        
        if (!isValidProblem) {
          console.log(`⏭️  Skipped: Invalid problem (length: ${problemText.length})`);
          return;
        }
        
        // Step 5: 답안 섹션에서 답안 가져오기
        const answerText = answersMap[problemNum] || '';
        
        // Step 6: 객관식/서술형 판단
        const isMultipleChoice = /[①②③④⑤⑥⑦⑧⑨⑩]/.test(problemText) ||
                                /\([1-5]\)|\[[1-5]\]/.test(problemText) ||
                                /\n[A-E][\)\.]\s/.test(problemText);
        
        extractedProblems.push({
          number: parseInt(problemNum),
          content: problemText,
          answer: answerText || '정답 없음',
          type: isMultipleChoice ? 'multiple' : 'descriptive'
        });
        
        console.log(`✅ Added: Problem #${problemNum} (${isMultipleChoice ? '객관식' : '서술형'})`);
        console.log(`   📄 Problem content: "${problemText}"`);
        console.log(`   ✅ Answer content: "${answerText || '정답 없음'}"`);
        console.log(`   🔍 Answer from map?: ${!!answersMap[problemNum]}`);
      }
    });
    
    console.log(`\n📊 Total problems extracted: ${extractedProblems.length}`);
    console.log(`📊 Problems with answers: ${extractedProblems.filter(p => p.answer !== '정답 없음').length}`);

    if (extractedProblems.length === 0) {
      alert('출력할 문제를 찾을 수 없습니다.\n\nAI에게 "수학 문제 3개 출제해줘" 같은 요청을 먼저 해보세요.');
      return;
    }

    // Separate multiple choice and descriptive
    const multipleChoiceProblems = extractedProblems.filter(p => p.type === 'multiple');
    const descriptiveProblems = extractedProblems.filter(p => p.type === 'descriptive');

    // Renumber each type
    multipleChoiceProblems.forEach((p, index) => {
      p.number = index + 1;
    });
    descriptiveProblems.forEach((p, index) => {
      p.number = index + 1;
    });

    console.log('📝 Multiple choice:', multipleChoiceProblems.length);
    console.log('📝 Descriptive:', descriptiveProblems.length);

    // Get academy name
    let academyName = '학원';
    try {
      if (user?.academyName) {
        academyName = user.academyName;
        console.log('✅ Academy name from user state:', academyName);
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          academyName = userData.academyName || userData.name || '학원';
          console.log('✅ Academy name from localStorage:', academyName);
        }
      }
    } catch (error) {
      console.error('Failed to get academy name:', error);
    }

    console.log('🏫 Final academy name:', academyName);

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.');
      return;
    }

    // Generate problems HTML with answers on separate pages (same document)
    const problemsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>문제지 및 답안지 - ${academyName}</title>
        <style>
          @media print {
            @page { margin: 1.5cm 1cm; size: A4 portrait; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            max-width: 21cm;
            margin: 0 auto;
            padding: 1.5cm 1cm;
            background: white;
            color: #000;
            line-height: 1.6;
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
          .section-title {
            font-size: 15px;
            font-weight: 700;
            margin: 20px 0 15px 0;
            padding: 8px 10px;
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
          }
          .section-title.answer-section {
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
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
          .answer-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .answer-number {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 6px;
          }
          .answer-content {
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            color: #000;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        </style>
      </head>
      <body>
        <!-- 문제지 섹션 -->
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
        ${multipleChoiceProblems.map((p) => `
          <div class="problem">
            <div class="problem-number">${p.number}. </div>
            <div class="problem-content">${p.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
        </div>
        ` : ''}

        ${descriptiveProblems.length > 0 ? `
        ${multipleChoiceProblems.length > 0 ? '<div class="page-break"></div>' : ''}
        <div class="section-title">서술형 문제</div>
        <div class="problems-container">
        ${descriptiveProblems.map((p) => `
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

        <!-- 페이지 나누기 -->
        <div class="page-break"></div>

        <!-- 답안지 섹션 -->
        <div class="header">
          <div class="academy-name">${academyName}</div>
          <div class="worksheet-title">답안지</div>
        </div>

        ${multipleChoiceProblems.length > 0 ? `
        <div class="section-title answer-section">객관식 정답</div>
        <div class="problems-container">
        ${multipleChoiceProblems.map((p) => `
          <div class="answer-item">
            <div class="answer-number">${p.number}. </div>
            <div class="answer-content">${(p.answer || '정답 없음').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
        </div>
        ` : ''}

        ${descriptiveProblems.length > 0 ? `
        ${multipleChoiceProblems.length > 0 ? '<div class="page-break"></div>' : ''}
        <div class="section-title answer-section">서술형 모범 답안</div>
        <div class="problems-container">
        ${descriptiveProblems.map((p) => `
          <div class="answer-item">
            <div class="answer-number">${p.number}. </div>
            <div class="answer-content">${(p.answer || '모범 답안 없음').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
        </div>
        ` : ''}

        <div class="no-print" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 15px 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <button onclick="window.print()" style="padding: 10px 25px; font-size: 14px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">
            전체 인쇄
          </button>
          <button onclick="window.close()" style="padding: 10px 25px; font-size: 14px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
            닫기
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(problemsHtml);
    printWindow.document.close();
    printWindow.document.close();
    } catch (error) {
      console.error('❌ Error in handlePrintProblems:', error);
      alert('문제지 출력 중 오류가 발생했습니다.\n\n' + error);
    }
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
        // 🔥 권한 체크용 추가 정보
        userRole: user?.role,
        userAcademyId: user?.academyId,
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
        } transition-all duration-300 ${
          sidebarOpen ? "border-r border-gray-200" : "border-0"
        } flex flex-col bg-gray-50 h-full overflow-hidden ${
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
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mt-1">
                        {/* Checkbox for problem selection */}
                        {(() => {
                          const enableFlag = selectedBot?.enableProblemGeneration;
                          const isProblemEnabled = enableFlag === 1 || enableFlag === "1" || enableFlag === true || Number(enableFlag) === 1;
                          return isProblemEnabled && (
                            <button
                              onClick={() => toggleMessageSelection(message.id)}
                              className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                                selectedMessageIds.has(message.id) ? 'bg-blue-100' : ''
                              }`}
                              title="문제지에 포함하려면 체크하세요"
                            >
                              {selectedMessageIds.has(message.id) ? (
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                </svg>
                              )}
                            </button>
                          );
                        })()}
                        {/* Voice button */}
                        {(() => {
                          const voiceFlag = selectedBot?.voiceEnabled;
                          const isVoiceEnabled = voiceFlag === 1 || voiceFlag === "1" || voiceFlag === true || Number(voiceFlag) === 1;
                          return isVoiceEnabled && (
                            <button
                              onClick={() => playTTS(message.content, message.id)}
                              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                              title="음성으로 듣기"
                            >
                              <Volume2 className="w-4 h-4 text-gray-600" />
                            </button>
                          );
                        })()}
                      </div>
                    )}
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
