"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Save,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Zap,
  Settings,
  Globe,
  Target,
  Brain,
  Lightbulb,
  TestTube,
  Send,
  Smile,
  ImageIcon,
  FileText,
  Upload,
  X,
} from "lucide-react";

const GEMINI_MODELS = [
  // ✅ 작동 확인된 모델 (2024년 기준)
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (추천)", description: "✅ 최신 2.5 모델, 빠르고 안정적", recommended: true },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "⚠️ 최고 성능이지만 안전 필터 엄격", recommended: false },
];

const PRESET_PROMPTS = [
  {
    name: "학습 도우미",
    icon: "📚",
    description: "학생들의 공부를 돕는 친절한 선생님",
    systemPrompt: `당신은 학생들의 학습을 돕는 친절하고 전문적인 AI 선생님입니다.

**역할:**
- 학생들이 개념을 쉽게 이해할 수 있도록 명확하고 간단한 설명 제공
- 질문에 대해 단계별로 차근차근 설명
- 학생의 수준에 맞춰 적절한 예시와 비유 사용

**답변 방식:**
1. 학생의 질문을 정확히 이해했는지 확인
2. 핵심 개념을 먼저 설명
3. 구체적인 예시나 그림으로 보충 설명
4. 연습 문제나 추가 학습 자료 제안

**제약사항:**
- 답을 바로 알려주기보다는 힌트를 통해 스스로 생각하도록 유도
- 격려하고 긍정적인 피드백 제공
- 전문 용어는 쉬운 말로 풀어서 설명`,
    welcomeMessage: "안녕하세요! 📚 무엇을 공부하고 계신가요? 궁금한 점을 편하게 물어보세요!",
    starterMessages: ["수학 문제 풀이 도와줘", "영어 문법 설명해줘", "과학 개념 알려줘"]
  },
  {
    name: "코딩 멘토",
    icon: "💻",
    description: "프로그래밍 학습을 돕는 개발 전문가",
    systemPrompt: `당신은 프로그래밍을 가르치는 경험 많은 개발 전문가입니다.

**역할:**
- 코드 작성법과 프로그래밍 개념을 명확하게 설명
- 실용적인 예제 코드와 함께 설명
- 디버깅과 문제 해결 방법 제시

**답변 방식:**
1. 코드 블록을 사용하여 명확하게 표시
2. 주석을 달아 각 부분을 설명
3. 단계별로 구현 방법 안내
4. 모범 사례(Best Practices)와 주의사항 공유

**제약사항:**
- 완성된 코드보다는 학습을 위한 가이드 제공
- 보안이나 성능 문제가 있는 코드는 경고
- 여러 해결 방법이 있다면 장단점 비교`,
    welcomeMessage: "안녕하세요! 💻 어떤 프로그래밍 주제에 대해 도움이 필요하신가요?",
    starterMessages: ["Python 기초 알려줘", "웹 개발 시작하기", "알고리즘 문제 풀이"]
  },
  {
    name: "창의적 작가",
    icon: "✍️",
    description: "글쓰기와 창작을 돕는 크리에이티브 조력자",
    systemPrompt: `당신은 창의적인 글쓰기를 돕는 전문 작가이자 편집자입니다.

**역할:**
- 에세이, 스토리, 시 등 다양한 글쓰기 지원
- 아이디어 발상과 구조화 도움
- 문장 개선과 표현력 향상 제안

**답변 방식:**
1. 사용자의 의도와 목적을 먼저 파악
2. 창의적인 아이디어와 구조 제안
3. 구체적인 예시와 비유 활용
4. 다양한 관점과 접근법 제시

**제약사항:**
- 표절이나 저작권 침해 금지
- 사용자의 고유한 목소리 존중
- 건설적이고 구체적인 피드백 제공`,
    welcomeMessage: "안녕하세요! ✍️ 어떤 글을 쓰고 계신가요? 함께 멋진 작품을 만들어봐요!",
    starterMessages: ["소설 아이디어 추천", "에세이 피드백", "시 창작 도움"]
  },
  {
    name: "비즈니스 어드바이저",
    icon: "💼",
    description: "비즈니스 전략과 의사결정을 지원하는 컨설턴트",
    systemPrompt: `당신은 비즈니스 전략과 경영을 지원하는 전문 컨설턴트입니다.

**역할:**
- 비즈니스 문제 분석과 해결책 제시
- 시장 분석과 전략 수립 지원
- 의사결정을 위한 데이터 기반 인사이트 제공

**답변 방식:**
1. 문제의 핵심 파악과 구조화
2. 데이터와 근거 기반 분석
3. 실행 가능한 구체적 방안 제시
4. 위험과 기회 요인 분석

**제약사항:**
- 검증되지 않은 정보는 명확히 표시
- 법률이나 재무 자문은 전문가 상담 권장
- 객관적이고 균형잡힌 시각 유지`,
    welcomeMessage: "안녕하세요! 💼 비즈니스 관련 어떤 주제로 도움이 필요하신가요?",
    starterMessages: ["마케팅 전략 수립", "사업 계획서 작성", "경쟁 분석"]
  },
  {
    name: "언어 튜터",
    icon: "🌍",
    description: "외국어 학습을 돕는 언어 전문가",
    systemPrompt: `당신은 외국어 학습을 돕는 경험 많은 언어 튜터입니다.

**역할:**
- 문법, 어휘, 발음 등 종합적인 언어 학습 지원
- 실생활에서 사용할 수 있는 실용적 표현 교육
- 문화적 맥락과 함께 언어 설명

**답변 방식:**
1. 학습자의 수준에 맞는 설명
2. 예문과 함께 맥락 제공
3. 발음 팁과 주의사항 안내
4. 연습 문제와 회화 예시 제공

**제약사항:**
- 목표 언어와 한국어를 적절히 혼합 사용
- 문화적 차이나 뉘앙스 설명
- 정확한 문법과 자연스러운 표현 강조`,
    welcomeMessage: "안녕하세요! 🌍 어떤 언어를 공부하고 계신가요? 함께 실력을 키워봐요!",
    starterMessages: ["영어 회화 연습", "일본어 기초", "중국어 문법"]
  },
];

// 프로필 아이콘 옵션 (200+ 이모지)
const PROFILE_EMOJIS = [
  // 기술 & AI (확장)
  "🤖", "💻", "🖥️", "⌨️", "🖱️", "💾", "💿", "📱", "📲", "☎️", "📞", "📟", "📠", "📡", "🔌", "💡", "🔦", "💾", "🖨️", "⌚",
  // 교육 & 학습 (확장)
  "🎓", "📚", "📖", "📝", "✏️", "✒️", "🖊️", "🖍️", "📕", "📗", "📘", "📙", "📔", "📓", "📒", "📃", "📜", "📄", "📰", "🗞️",
  // 에너지 & 빛 (확장)
  "💡", "🔦", "🕯️", "💫", "⭐", "🌟", "✨", "🌠", "🔆", "☀️", "🌞", "🌝", "🌛", "🌜", "🌙", "⚡", "🔥", "💥", "✴️", "🌟",
  // 우주 & 과학 (확장)
  "🚀", "🛸", "🛰️", "🔬", "🔭", "⚗️", "🧪", "🧬", "🔋", "⚡", "🌌", "🪐", "🌍", "🌎", "🌏", "🗺️", "🧭", "⚙️", "🔩", "🔧",
  // 예술 & 창작 (확장)
  "🎨", "🖼️", "🎭", "🎪", "🎬", "🎤", "🎧", "🎼", "🎹", "🎸", "🎺", "🎷", "🥁", "🎻", "🪕", "🎲", "♟️", "🎯", "🎰", "🎮",
  // 스포츠 & 성취 (확장)
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎯", "🎲", "🎰", "🎳", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥊", "🥋", "🎿",
  // 자연 & 날씨 (확장)
  "🌈", "🌤️", "⛅", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "☃️", "⛄", "❄️", "☁️", "🌪️", "🌫️", "🌬️", "💨", "🌊", "💦", "💧", "☔",
  // 동물 - 포유류 (확장)
  "🐱", "🐶", "🦊", "🐼", "🦁", "🐯", "🐨", "🐻", "🐰", "🐹", "🐭", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🦍", "🦧",
  "🐺", "🦝", "🦨", "🦦", "🦥", "🦘", "🦡", "🐘", "🦏", "🦛", "🐪", "🐫", "🦒", "🦌", "🐎", "🦓", "🦙", "🐐", "🐑", "🦙",
  // 동물 - 조류 & 해양 (확장)
  "🦅", "🦆", "🦉", "🦜", "🐧", "🐦", "🐤", "🐣", "🐥", "🦩", "🦚", "🦃", "🦢", "🕊️", "🐓", "🐔",
  "🐬", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐠", "🐟", "🐡", "🐚", "🦪", "🪼", "🐢",
  // 곤충 & 작은 생물 (확장)
  "🐝", "🦋", "🐛", "🐌", "🐞", "🦗", "🕷️", "🦂", "🐜", "🪰", "🪱", "🦟", "🪲", "🐾",
  // 식물 & 꽃 (확장)
  "🌸", "🌺", "🌻", "🌼", "🌷", "🥀", "🏵️", "🌹", "🍀", "🍁", "🍂", "🍃", "🌿", "🌱", "🌾", "🌵", "🎄", "🌲", "🌳", "🌴",
  "🎋", "🎍", "🌾", "🌺", "🌻", "🏞️", "🌾", "🪴", "🪵",
  // 음식 & 음료 (확장)
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍑", "🍒", "🍍", "🥝", "🥑", "🍔", "🍕", "🍰", "🎂", "🍪", "🍩", "☕", "🍵",
  "🥐", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍤", "🍱", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍥",
  "🍦", "🍧", "🍨", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🧃", "🧉", "🧊",
  // 여행 & 장소 (확장)
  "✈️", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒",
  "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🚚", "🚛", "🚜",
  "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌",
  // 시간 & 도구 (확장)
  "⏰", "⏱️", "⏲️", "⏳", "⌛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛",
  "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪛", "🔩", "⚙️", "🔗", "⛓️", "📎", "🖇️", "📌", "📍", "✂️", "🗃️", "🗄️", "🗑️",
  // 기타 유용한 이모지 (확장)
  "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "♥️", "💯",
  "💢", "💬", "💭", "🗨️", "🗯️", "💤", "💮", "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏴‍☠️",
  // 표정 & 감정
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
  "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
  // 상징 & 기호
  "✅", "❎", "✔️", "✖️", "❌", "➕", "➖", "✳️", "✴️", "❇️", "‼️", "⁉️", "❓", "❔", "❕", "❗", "〰️", "©️", "®️", "™️",
  "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛", "⬜", "◼️", "◻️"
];

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function CreateAIBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPresets, setShowPresets] = useState(true);
  const [testMessage, setTestMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<Array<{name: string, content: string, size: number}>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    welcomeMessage: "",
    starterMessage1: "",
    starterMessage2: "",
    starterMessage3: "",
    profileIcon: "🤖",
    profileImage: "", // 이미지 URL 추가
    model: "gemini-2.0-flash-exp",
    temperature: "0.7",
    maxTokens: "2000",
    topK: "40",
    topP: "0.95",
    language: "ko",
    knowledgeBase: "",
    enableProblemGeneration: false,
    voiceEnabled: false, // TTS 활성화 여부
    voiceName: "ko-KR", // 음성 이름
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const applyPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setFormData({
      ...formData,
      name: preset.name,
      description: preset.description,
      systemPrompt: preset.systemPrompt,
      welcomeMessage: preset.welcomeMessage,
      starterMessage1: preset.starterMessages?.[0] || "",
      starterMessage2: preset.starterMessages?.[1] || "",
      starterMessage3: preset.starterMessages?.[2] || "",
      profileIcon: preset.icon,
    });
    setShowPresets(false);
  };

  const handleTest = async (message?: string) => {
    const messageToSend = message || testMessage;
    if (!messageToSend.trim()) {
      alert("메시지를 입력하세요.");
      return;
    }

    // 사용자 메시지 추가
    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setTestMessage("");
    setTestLoading(true);

    try {
      // 지식 베이스를 시스템 프롬프트에 추가
      const enhancedSystemPrompt = formData.knowledgeBase 
        ? `${formData.systemPrompt}\n\n---\n\n## 참고 자료 (Knowledge Base)\n\n다음 자료를 참고하여 답변하세요:\n\n${formData.knowledgeBase}`
        : formData.systemPrompt;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          systemPrompt: enhancedSystemPrompt,
          model: formData.model,
          temperature: parseFloat(formData.temperature),
          maxTokens: parseInt(formData.maxTokens),
          topK: parseInt(formData.topK),
          topP: parseFloat(formData.topP),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "응답을 받지 못했습니다.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: "테스트 중 오류가 발생했습니다.",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("테스트 실패:", error);
      const assistantMessage: Message = {
        role: "assistant",
        content: "연결 오류가 발생했습니다.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setTestLoading(false);
    }
  };

  const handleStarterMessage = (message: string) => {
    handleTest(message);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        // 파일 크기 제한 (20MB)
        if (file.size > 20 * 1024 * 1024) {
          alert(`${file.name}: 파일 크기는 20MB를 초과할 수 없습니다.`);
          continue;
        }

        console.log(`📁 파일 업로드 시작: ${file.name} (${file.size} bytes, type: ${file.type})`);

        let text = '';
        
        // 텍스트 파일 처리
        if (file.type.startsWith('text/') || 
            file.name.endsWith('.txt') || 
            file.name.endsWith('.md') ||
            file.name.endsWith('.json') ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.html') ||
            file.name.endsWith('.xml')) {
          text = await file.text();
          console.log(`✅ 텍스트 파일 읽기 완료: ${text.length}자`);
        } 
        // PDF 파일 처리 - 간단한 텍스트 추출만 시도
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            console.log('📄 PDF 파일 감지:', file.name);
            
            // PDF는 간단하게 빈 텍스트로 처리하고 파일 이름만 저장
            // 실제 내용은 사용자가 직접 입력하도록 안내
            const userInput = confirm(
              `PDF 파일 "${file.name}"이 선택되었습니다.\n\n` +
              `PDF 내용을 자동으로 추출하시겠습니까?\n\n` +
              `"확인": PDF 파일명만 저장하고 내용은 직접 입력\n` +
              `"취소": 파일 건너뛰기`
            );
            
            if (userInput) {
              // 파일명만 저장하고, 사용자가 내용을 직접 입력하도록 안내
              text = `[PDF 파일: ${file.name}]\n\n여기에 PDF 내용을 직접 입력해주세요.`;
              console.log('✅ PDF 파일 등록 (내용은 사용자 입력 필요)');
            } else {
              console.log('⏭️ PDF 파일 건너뛰기');
              continue;
            }
          } catch (error) {
            console.error('❌ PDF 파일 처리 오류:', error);
            alert(`${file.name}: PDF 파일을 처리할 수 없습니다.\n\n내용을 복사하여 붙여넣어 주세요.`);
            continue;
          }
        }
        else {
          alert(`${file.name}: 지원하지 않는 파일 형식입니다.\n\n지원 형식: TXT, MD, JSON, CSV, PDF`);
          continue;
        }
        
        console.log(`✅ 파일 읽기 완료: ${file.name} (${text.length} chars)`);
        
        setKnowledgeFiles(prev => [
          ...prev,
          {
            name: file.name,
            content: text,
            size: file.size
          }
        ]);

        // knowledgeBase에 추가
        setFormData(prev => ({
          ...prev,
          knowledgeBase: prev.knowledgeBase + `\n\n## 📄 ${file.name}\n\n${text}\n\n---\n`
        }));
        
        console.log(`💾 Knowledge Base 업데이트 완료`);
      }
      
      alert(`${files.length}개 파일이 성공적으로 업로드되었습니다.`);
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error);
      alert('파일을 읽는 중 오류가 발생했습니다.\n\n' + (error as Error).message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeKnowledgeFile = (fileName: string) => {
    setKnowledgeFiles(prev => prev.filter(f => f.name !== fileName));
    
    // knowledgeBase에서 제거
    const fileToRemove = knowledgeFiles.find(f => f.name === fileName);
    if (fileToRemove) {
      const pattern = `\n\n## ${fileName}\n${fileToRemove.content}`;
      setFormData(prev => ({
        ...prev,
        knowledgeBase: prev.knowledgeBase.replace(pattern, '')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 AI 봇 생성 시작');
    console.log('  이름:', formData.name);
    console.log('  시스템 프롬프트:', formData.systemPrompt.substring(0, 50) + '...');
    
    if (!formData.name || !formData.systemPrompt) {
      alert("봇 이름과 시스템 프롬프트는 필수입니다.");
      return;
    }

    // 숫자 필드 검증 및 기본값 설정
    const temperature = parseFloat(formData.temperature) || 0.7;
    const maxTokens = parseInt(formData.maxTokens) || 2000;
    const topK = parseInt(formData.topK) || 40;
    const topP = parseFloat(formData.topP) || 0.95;

    // 범위 검증
    if (temperature < 0 || temperature > 2) {
      alert("온도 값은 0에서 2 사이여야 합니다.");
      return;
    }
    if (maxTokens < 100 || maxTokens > 32768) {
      alert("최대 토큰은 100에서 32768 사이여야 합니다. (Gemini 2.5 Flash 최대값)");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        ...formData,
        temperature,
        maxTokens,
        topK,
        topP,
      };
      
      console.log('📤 요청 데이터:', {
        name: requestBody.name,
        model: requestBody.model,
        temperature: requestBody.temperature,
        maxTokens: requestBody.maxTokens
      });

      const response = await fetch("/api/admin/ai-bots", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 응답 상태:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📥 응답 데이터:', data);
      
      if (response.ok) {
        console.log('✅ 봇 생성 성공:', data.botId);
        
        // 🔥 Knowledge Base가 있으면 Vectorize에 업로드
        if (formData.knowledgeBase && formData.knowledgeBase.trim().length > 0) {
          console.log('📚 Knowledge Base 업로드 시작...');
          console.log(`  └─ Knowledge Base 길이: ${formData.knowledgeBase.length} 자`);
          console.log(`  └─ 파일 개수: ${knowledgeFiles.length}`);
          console.log(`  └─ Bot ID: ${data.botId}`);
          
          // 먼저 성공 메시지 표시
          alert(`✨ AI Gem이 생성되었습니다!\n\n📚 지식 베이스를 업로드 중입니다...\n(약 10-30초 소요)\n\n파일 ${knowledgeFiles.length}개, 총 ${formData.knowledgeBase.length}자`);
          
          // 백그라운드에서 업로드 시작 (리다이렉트 전에 실행)
          try {
            console.log('🔄 Vectorize 업로드 요청 전송 중...');
            const uploadResponse = await fetch("/api/admin/upload-knowledge", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                botId: data.botId,
                knowledgeBase: formData.knowledgeBase,
                fileName: knowledgeFiles.length > 0 ? knowledgeFiles[0].name : 'manual_input'
              })
            });
            
            console.log(`📡 Upload 응답 상태: ${uploadResponse.status}`);
            const uploadData = await uploadResponse.json();
            console.log('📡 Upload 응답 데이터:', uploadData);
            
            if (uploadResponse.ok) {
              console.log(`✅ Vectorize 업로드 성공: ${uploadData.vectorCount}개 벡터`);
              alert(`✅ 지식 베이스 업로드 완료!\n\n벡터: ${uploadData.vectorCount}개\n청크: ${uploadData.chunkCount}개`);
            } else {
              console.error('❌ Vectorize 업로드 실패:', uploadData);
              alert(`⚠️ 지식 베이스 업로드 실패\n\n오류: ${uploadData.error || uploadData.message || '알 수 없는 오류'}`);
            }
          } catch (uploadError) {
            console.error('❌ Vectorize 업로드 오류:', uploadError);
            alert(`⚠️ 지식 베이스 업로드 중 오류 발생\n\n${uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'}`);
          }
          
          // 업로드 후 리다이렉트
          router.push("/dashboard/admin/ai-bots");
        } else {
          console.log('ℹ️ Knowledge Base가 비어있어 업로드 건너뜀');
          alert("✨ AI Gem이 생성되었습니다!");
          router.push("/dashboard/admin/ai-bots");
        }
      } else {
        console.error("❌ 봇 생성 실패:", data);
        alert(`봇 생성에 실패했습니다.\n오류: ${data.message || data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("❌ 봇 생성 오류:", error);
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            새로운 Gem 만들기
          </h1>
          <p className="text-gray-600 mt-1">
            Google Gemini 기반 맞춤형 AI 어시스턴트를 만들어보세요
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin/ai-bots")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      {/* 프리셋 선택 (처음에만 표시) */}
      {showPresets && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              템플릿으로 빠르게 시작하기
            </CardTitle>
            <CardDescription>
              미리 준비된 템플릿을 선택하거나 직접 만들 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_PROMPTS.map((preset, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-purple-400"
                  onClick={() => applyPreset(preset)}
                >
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-3 text-center">{preset.icon}</div>
                    <h3 className="font-semibold text-lg mb-2 text-center">
                      {preset.name}
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                      {preset.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowPresets(false)}
                className="text-purple-600"
              >
                또는 처음부터 직접 만들기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 설정 폼 (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  기본 정보
                </CardTitle>
                <CardDescription>
                  Gem의 이름, 프로필, 설명을 작성하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 프로필 아이콘/이미지 선택 */}
                <div>
                  <Label className="text-base mb-2 block">프로필 아이콘 / 이미지</Label>
                  <div className="space-y-3">
                    {/* 미리보기 */}
                    <div className="flex items-center gap-3">
                      {formData.profileImage ? (
                        <img 
                          src={formData.profileImage} 
                          alt="프로필 이미지" 
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                        />
                      ) : (
                        <div className="text-5xl">{formData.profileIcon}</div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="flex-1"
                          >
                            <Smile className="w-4 h-4 mr-2" />
                            이모지 선택
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const url = prompt("이미지 URL을 입력하세요:");
                              if (url) {
                                setFormData({ ...formData, profileImage: url, profileIcon: "" });
                              }
                            }}
                            className="flex-1"
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            이미지 URL
                          </Button>
                        </div>
                        {(formData.profileImage || formData.profileIcon !== "🤖") && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ ...formData, profileImage: "", profileIcon: "🤖" })}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            초기화
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* 이모지 선택 그리드 */}
                    {showEmojiPicker && (
                      <div className="p-3 border rounded-lg bg-white shadow-lg grid grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                        {PROFILE_EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="text-2xl hover:bg-blue-50 p-2 rounded transition"
                            onClick={() => {
                              setFormData({ ...formData, profileIcon: emoji, profileImage: "" });
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      이모지 또는 이미지 URL을 선택하여 봇의 프로필을 설정할 수 있습니다
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name" className="text-base">
                    Gem 이름 *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 나의 학습 도우미"
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    사용자에게 표시될 이름입니다
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-base">
                    간단한 설명
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="이 Gem이 어떤 일을 하는지 간단히 설명해주세요"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="welcomeMessage" className="text-base">
                    환영 인사
                  </Label>
                  <Textarea
                    id="welcomeMessage"
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                    placeholder="대화를 시작할 때 표시할 첫 인사말"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                {/* 스타터 메시지 */}
                <div>
                  <Label className="text-base mb-2 block">스타터 메시지 (추천 질문)</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    사용자가 빠르게 시작할 수 있는 예시 질문을 3개까지 추가하세요
                  </p>
                  <div className="space-y-2">
                    <Input
                      value={formData.starterMessage1}
                      onChange={(e) => setFormData({ ...formData, starterMessage1: e.target.value })}
                      placeholder="예: 수학 문제 풀이 도와줘"
                    />
                    <Input
                      value={formData.starterMessage2}
                      onChange={(e) => setFormData({ ...formData, starterMessage2: e.target.value })}
                      placeholder="예: 영어 문법 설명해줘"
                    />
                    <Input
                      value={formData.starterMessage3}
                      onChange={(e) => setFormData({ ...formData, starterMessage3: e.target.value })}
                      placeholder="예: 과학 개념 알려줘"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 지침 (Instructions) */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Gem 지침 (Instructions) *
                </CardTitle>
                <CardDescription>
                  Gem이 어떻게 행동하고 응답해야 하는지 상세히 설명하세요. 이것이 Gem의 핵심입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="예시:

당신은 학생들의 학습을 돕는 친절한 AI 선생님입니다.

역할:
- 개념을 쉽고 명확하게 설명
- 단계별로 차근차근 가르치기
- 학생이 스스로 생각할 수 있도록 힌트 제공

답변 방식:
1. 질문을 정확히 이해했는지 확인
2. 핵심 개념부터 설명
3. 구체적 예시로 보충
4. 연습 문제 제안

제약사항:
- 답을 바로 알려주지 말고 힌트 제공
- 긍정적이고 격려하는 톤 유지
- 전문 용어는 쉽게 풀어서 설명"
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    💡 효과적인 지침 작성 팁:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>역할 정의:</strong> "당신은 ~입니다" 형식으로 명확히 (예: "당신은 친절한 수학 선생님입니다")</li>
                    <li>• <strong>구체적 행동:</strong> 해야 할 것과 하지 말아야 할 것을 명시</li>
                    <li>• <strong>톤과 스타일:</strong> 친근한, 전문적인, 교육적인, 격려하는 등</li>
                    <li>• <strong>응답 형식:</strong> 구조화된 답변 방식 제시 (단계별, 번호 매기기 등)</li>
                    <li>• <strong>제약 사항:</strong> 길이, 형식, 내용 제한 명시</li>
                    <li>• <strong>예시 제공:</strong> 원하는 응답의 구체적 예시 포함</li>
                    <li>• <strong>맥락 설명:</strong> 대상 사용자, 사용 목적 명시</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-xs font-semibold text-blue-900 mb-1">🎯 실전 적용 가능한 요소:</p>
                    <ul className="text-xs text-blue-800 space-y-0.5">
                      <li>✓ <strong>페르소나:</strong> 나이, 성격, 전문 분야 설정</li>
                      <li>✓ <strong>대화 스타일:</strong> 이모지 사용 여부, 반말/존댓말</li>
                      <li>✓ <strong>응답 길이:</strong> 간결한 답변 vs 상세한 설명</li>
                      <li>✓ <strong>오류 처리:</strong> 모르는 답변 시 대응 방법</li>
                      <li>✓ <strong>안전 장치:</strong> 부적절한 질문 대응 방식</li>
                      <li>✓ <strong>특화 기능:</strong> 코드 블록, 표, 리스트 활용</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 지식 베이스 (Knowledge Base) - RAG */}
            <Card className="border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  지식 베이스 (Knowledge Base)
                </CardTitle>
                <CardDescription>
                  AI가 참고할 수 있는 문서, 자료, 지식을 업로드하세요. RAG (Retrieval-Augmented Generation)로 더 정확한 답변을 제공합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* 파일 업로드 버튼 */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.json,.csv,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="knowledge-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingFile ? "업로드 중..." : "파일 선택 (txt, md, json, csv, pdf)"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    • 최대 파일 크기: 5MB per file
                    <br />
                    • 지원 형식: 텍스트(.txt), 마크다운(.md), JSON(.json), CSV(.csv), PDF(.pdf)
                    <br />
                    • PDF는 서버에서 처리됩니다 (텍스트 추출 지원)
                  </p>
                </div>

                {/* 업로드된 파일 목록 */}
                {knowledgeFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">업로드된 파일 ({knowledgeFiles.length}개)</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {knowledgeFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKnowledgeFile(file.name)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 지식 베이스 내용 미리보기 */}
                {formData.knowledgeBase && (
                  <div>
                    <Label className="text-sm font-semibold">지식 베이스 내용 미리보기</Label>
                    <Textarea
                      value={formData.knowledgeBase}
                      onChange={(e) => setFormData({ ...formData, knowledgeBase: e.target.value })}
                      rows={8}
                      className="mt-2 font-mono text-xs"
                      placeholder="파일을 업로드하면 여기에 내용이 표시됩니다"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 업로드된 내용을 직접 수정할 수도 있습니다
                    </p>
                  </div>
                )}

                {/* RAG 설명 */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900 mb-2">
                    📚 RAG (Retrieval-Augmented Generation)란?
                  </p>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• AI가 답변할 때 <strong>업로드된 지식을 참고</strong>하여 더 정확하고 맞춤형 답변 제공</li>
                    <li>• 회사 매뉴얼, 학습 자료, 제품 설명서 등을 업로드하여 <strong>전문화된 AI 봇</strong> 생성</li>
                    <li>• 실시간으로 최신 정보를 반영하여 환각(Hallucination) 현상 감소</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Gemini 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  고급 설정
                </CardTitle>
                <CardDescription>
                  Gemini AI 모델의 동작을 세밀하게 조정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 모델 선택 */}
                <div>
                  <Label htmlFor="model" className="text-base mb-3 block">Gemini 모델 선택</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {GEMINI_MODELS.map((model) => (
                      <div
                        key={model.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.model === model.value
                            ? "border-purple-500 bg-purple-50 shadow-md"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                        onClick={() => setFormData({ ...formData, model: model.value })}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm">{model.label}</div>
                              {model.recommended && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                  추천
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{model.description}</div>
                          </div>
                          {formData.model === model.value && (
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 모델 선택 가이드:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• <strong>2.5 Flash (추천):</strong> 대부분의 작업에 적합, 빠르고 비용 효율적</li>
                      <li>• <strong>2.5 Pro:</strong> 복잡한 추론, 코드 생성, 데이터 분석에 최적</li>
                      <li>• <strong>3.0 Preview:</strong> 최신 기능 테스트용, 프로덕션 미권장</li>
                      <li>• <strong>2.5 Flash Lite:</strong> 간단한 작업, 초고속 응답 필요시</li>
                    </ul>
                  </div>
                </div>

                {/* 파라미터 설정 */}
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-900 mb-1">⚙️ 파라미터 조정 가이드:</p>
                    <ul className="text-xs text-amber-800 space-y-0.5">
                      <li>• <strong>창의적 작업</strong> (시, 스토리): Temperature 0.8-1.2</li>
                      <li>• <strong>일반 대화</strong> (상담, 조언): Temperature 0.6-0.8</li>
                      <li>• <strong>정확한 답변</strong> (계산, 번역): Temperature 0.3-0.5</li>
                      <li>• <strong>코드 생성</strong>: Temperature 0.2-0.4, Top-K 20-30</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="temperature" className="text-base">
                        Temperature (창의성) 🌡️
                      </Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          id="temperature"
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono w-12 text-right font-semibold">
                          {formData.temperature}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-600">
                        <span>정확함 (0.0)</span>
                        <span>창의적 (2.0)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {parseFloat(formData.temperature) < 0.5 ? "🎯 매우 일관적이고 정확한 응답" :
                         parseFloat(formData.temperature) < 1.0 ? "⚖️ 균형잡힌 응답 (추천)" :
                         "🎨 창의적이고 다양한 응답"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="topP" className="text-base">
                        Top-P (다양성) 🎲
                      </Label>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          id="topP"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={formData.topP}
                          onChange={(e) => setFormData({ ...formData, topP: e.target.value })}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono w-12 text-right font-semibold">
                          {formData.topP}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-600">
                        <span>집중 (0.0)</span>
                        <span>다양함 (1.0)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {parseFloat(formData.topP) < 0.5 ? "🎯 가장 확률 높은 답변만" :
                         parseFloat(formData.topP) < 0.9 ? "⚖️ 적절한 다양성" :
                         "🌈 매우 다양한 표현"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="topK" className="text-base">
                        Top-K (어휘 범위) 📚
                      </Label>
                      <Input
                        id="topK"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.topK}
                        onChange={(e) => setFormData({ ...formData, topK: e.target.value || "40" })}
                        className="mt-2"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        상위 K개 단어만 고려 (낮을수록 일관적, 기본: 40)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="maxTokens" className="text-base">
                        최대 토큰 (응답 길이) 📏
                      </Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        step="500"
                        min="100"
                        max="32768"
                        value={formData.maxTokens}
                        onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value || "2000" })}
                        className="mt-2"
                        required
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, maxTokens: "1000" })}
                          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          짧게 (1000)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, maxTokens: "2000" })}
                          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                        >
                          기본 (2000)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, maxTokens: "4000" })}
                          className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                        >
                          중간 (4000)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, maxTokens: "8000" })}
                          className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                        >
                          길게 (8000)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, maxTokens: "32768" })}
                          className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                        >
                          최대 (32768)
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {parseInt(formData.maxTokens) < 1000 ? "⚡ 매우 짧은 답변 (~500자)" :
                         parseInt(formData.maxTokens) < 2000 ? "📝 짧은 답변 (~1000자)" :
                         parseInt(formData.maxTokens) < 4000 ? "📄 기본 답변 (~2000자)" :
                         parseInt(formData.maxTokens) < 8000 ? "📋 중간 길이 (~4000자)" :
                         parseInt(formData.maxTokens) < 16000 ? "📚 긴 답변 (~8000자)" :
                         parseInt(formData.maxTokens) < 32768 ? "📖 매우 긴 답변 (~16000자)" :
                         "🔥 최대 길이 (32768토큰)"} · Gemini 2.5 Flash 최대: 32,768
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="language" className="text-base">
                    주 언어
                  </Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enableProblemGeneration"
                      checked={formData.enableProblemGeneration}
                      onChange={(e) => setFormData({ ...formData, enableProblemGeneration: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="enableProblemGeneration" className="text-base font-semibold cursor-pointer">
                        📝 유사문제 출제 기능
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        AI와 대화 중 나온 문제를 학원 이름이 들어간 문제지로 프린트할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* TTS 음성 출력 설정 */}
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="voiceEnabled"
                      checked={formData.voiceEnabled}
                      onChange={(e) => setFormData({ ...formData, voiceEnabled: e.target.checked })}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <Label htmlFor="voiceEnabled" className="text-base font-semibold cursor-pointer">
                        🔊 음성 출력 (TTS)
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        AI 응답을 음성으로 들을 수 있습니다. 채팅 화면에서 스피커 버튼을 눌러 재생하세요.
                      </p>
                      
                      {formData.voiceEnabled && (
                        <div className="mt-3">
                          <Label htmlFor="voiceName" className="text-sm font-medium">
                            음성 선택
                          </Label>
                          <select
                            id="voiceName"
                            value={formData.voiceName}
                            onChange={(e) => setFormData({ ...formData, voiceName: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <optgroup label="한국어">
                              <option value="ko-KR">한국어 (기본)</option>
                              <option value="ko-KR-Wavenet-A">한국어 여성 (A)</option>
                              <option value="ko-KR-Wavenet-B">한국어 남성 (B)</option>
                              <option value="ko-KR-Wavenet-C">한국어 여성 (C)</option>
                              <option value="ko-KR-Wavenet-D">한국어 남성 (D)</option>
                            </optgroup>
                            <optgroup label="영어">
                              <option value="en-US">영어 (기본)</option>
                              <option value="en-US-Wavenet-A">영어 여성 (A)</option>
                              <option value="en-US-Wavenet-B">영어 남성 (B)</option>
                              <option value="en-US-Wavenet-C">영어 여성 (C)</option>
                              <option value="en-US-Wavenet-D">영어 남성 (D)</option>
                            </optgroup>
                            <optgroup label="일본어">
                              <option value="ja-JP">일본어 (기본)</option>
                              <option value="ja-JP-Wavenet-A">일본어 여성 (A)</option>
                              <option value="ja-JP-Wavenet-B">일본어 여성 (B)</option>
                              <option value="ja-JP-Wavenet-C">일본어 남성 (C)</option>
                              <option value="ja-JP-Wavenet-D">일본어 남성 (D)</option>
                            </optgroup>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 실시간 테스트 채팅 (1/3) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-2 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-green-600" />
                  Gem 테스트
                </CardTitle>
                <CardDescription>
                  실시간으로 Gem과 대화해보세요
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* 채팅 영역 */}
                <div className="space-y-4">
                  {/* 환영 메시지 */}
                  {chatMessages.length === 0 && formData.welcomeMessage && (
                    <div className="flex gap-3">
                      <div className="text-3xl">{formData.profileIcon}</div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm text-gray-800">{formData.welcomeMessage}</p>
                        </div>
                        {/* 스타터 메시지 버튼 */}
                        {(formData.starterMessage1 || formData.starterMessage2 || formData.starterMessage3) && (
                          <div className="mt-2 space-y-2">
                            {formData.starterMessage1 && (
                              <button
                                type="button"
                                onClick={() => handleStarterMessage(formData.starterMessage1)}
                                className="block w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                                disabled={testLoading}
                              >
                                💬 {formData.starterMessage1}
                              </button>
                            )}
                            {formData.starterMessage2 && (
                              <button
                                type="button"
                                onClick={() => handleStarterMessage(formData.starterMessage2)}
                                className="block w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                                disabled={testLoading}
                              >
                                💬 {formData.starterMessage2}
                              </button>
                            )}
                            {formData.starterMessage3 && (
                              <button
                                type="button"
                                onClick={() => handleStarterMessage(formData.starterMessage3)}
                                className="block w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                                disabled={testLoading}
                              >
                                💬 {formData.starterMessage3}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 채팅 메시지 */}
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "assistant" && (
                          <div className="text-2xl">{formData.profileIcon}</div>
                        )}
                        <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white ml-auto"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="text-2xl">👤</div>
                        )}
                      </div>
                    ))}
                    {testLoading && (
                      <div className="flex gap-3">
                        <div className="text-2xl">{formData.profileIcon}</div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* 입력 영역 */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleTest()}
                        disabled={testLoading || !formData.systemPrompt}
                      />
                      <Button
                        type="button"
                        onClick={() => handleTest()}
                        disabled={testLoading || !formData.systemPrompt}
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {chatMessages.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="w-full"
                      >
                        대화 초기화
                      </Button>
                    )}
                  </div>

                  {!formData.systemPrompt && (
                    <p className="text-xs text-amber-600 text-center">
                      ⚠️ 테스트하려면 먼저 시스템 프롬프트를 입력하세요
                    </p>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      🔍 <strong>현재 모델:</strong> {GEMINI_MODELS.find(m => m.value === formData.model)?.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      🌡️ <strong>Temperature:</strong> {formData.temperature} | 
                      <strong> Top-P:</strong> {formData.topP}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/ai-bots")}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "생성 중..." : "Gem 생성하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
