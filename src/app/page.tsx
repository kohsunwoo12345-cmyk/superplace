"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Users, 
  BarChart3,
  ChevronDown,
  Briefcase,
  Brain,
  Bot,
  ClipboardCheck,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  MessageSquare,
  CalendarCheck,
  FileCheck,
  Zap,
  Star,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

// ── 스크롤 감지 커스텀 훅 ──────────────────────────
function useScrollReveal(threshold = 100) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: `0px 0px -${threshold}px 0px` }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── 카운트업 애니메이션 ────────────────────────────
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── 5대 핵심 기능 데이터 ──────────────────────────
const FEATURES = [
  {
    id: 1,
    icon: Bot,
    color: "blue",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    border: "border-blue-100",
    badge: "24시간 AI 튜터",
    title: "우리 학원만의 AI가\n24시간 아이들의 학습을 도와줍니다",
    desc: "학원 커리큘럼과 교재에 최적화된 전용 AI 튜터. 학생이 언제 질문해도 학원 선생님처럼 정확하게 답변합니다.",
    points: [
      "학원 교재·커리큘럼 기반 맞춤 응답",
      "심야·주말에도 끊김 없는 학습 지원",
      "다음 수업 전까지 복습 자동 유도",
    ],
    mockup: {
      label: "AI 튜터 채팅",
      lines: [
        { who: "학생", text: "이 문제 왜 2번이야?" },
        { who: "AI", text: "주어가 복수이기 때문에 동사도 복수형으로 써야 해. 학원 교재 p.34 예문을 같이 볼까?" },
        { who: "학생", text: "아 맞다, 이해했어!" },
      ],
    },
  },
  {
    id: 2,
    icon: Brain,
    color: "purple",
    gradient: "from-purple-500 to-violet-400",
    bg: "bg-purple-50",
    border: "border-purple-100",
    badge: "AI 전문 채점",
    title: "AI가 전문적으로 채점하고\n취약점을 정확하게 추출합니다",
    desc: "단순 O/X 채점을 넘어, 오답 이유·부족한 개념·개선 포인트를 자동으로 분석하고 리포트를 생성합니다.",
    points: [
      "사진 한 장으로 즉시 채점 완료",
      "틀린 문제별 취약 개념 자동 분류",
      "학생·학부모·선생님용 리포트 생성",
    ],
    mockup: {
      label: "채점 리포트",
      lines: [
        { who: "결과", text: "수학 78점 · 영어 91점" },
        { who: "취약", text: "이차방정식 풀이 개념 미흡" },
        { who: "추천", text: "보충 학습 자료 3개 자동 제공" },
      ],
    },
  },
  {
    id: 3,
    icon: TrendingUp,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    badge: "유사문제 자동 출제",
    title: "자주 틀리는 유형을 AI가 파악해\n유사문제를 자동으로 출제합니다",
    desc: "누적 오답 데이터를 분석해 학생 개인의 취약 유형에 딱 맞는 문제를 AI가 직접 생성합니다.",
    points: [
      "오답 패턴 기반 개인 맞춤 문제 생성",
      "난이도 자동 조절로 점진적 실력 향상",
      "반복 학습으로 오개념 완전 해소",
    ],
    mockup: {
      label: "AI 문제 생성",
      lines: [
        { who: "분석", text: "김민준 학생 — 비례식 유형 오답률 68%" },
        { who: "생성", text: "유사 문제 5개 자동 출제 완료" },
        { who: "결과", text: "재시도 후 정답률 94% 달성 🎉" },
      ],
    },
  },
  {
    id: 4,
    icon: CalendarCheck,
    color: "orange",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-50",
    border: "border-orange-100",
    badge: "출결·채점 자동화",
    title: "학원 출결 관리와 채점을\n한 번에 자동으로 처리합니다",
    desc: "QR 체크인부터 숙제 채점까지 모든 반복 업무를 자동화해 선생님은 수업에만 집중할 수 있습니다.",
    points: [
      "QR/앱 기반 실시간 출결 자동 기록",
      "숙제 사진 제출 → AI 즉시 채점",
      "미출석·미제출 학생 자동 알림",
    ],
    mockup: {
      label: "출결 대시보드",
      lines: [
        { who: "오늘", text: "출석 28명 / 결석 2명 자동 집계" },
        { who: "채점", text: "숙제 30건 AI 채점 완료 (3분)" },
        { who: "알림", text: "결석 학생 학부모 자동 문자 발송" },
      ],
    },
  },
  {
    id: 5,
    icon: Bell,
    color: "pink",
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-50",
    border: "border-pink-100",
    badge: "학부모 자동 발송",
    title: "출결·학습 내용을 AI가\n학부모 페이지로 자동 제작·발송합니다",
    desc: "매 수업 후 학부모에게 맞춤형 학습 리포트 페이지를 자동 생성하고 카카오톡·문자로 자동 발송합니다.",
    points: [
      "수업 후 학부모 전용 페이지 자동 생성",
      "출결·학습 성취·숙제 현황 한눈에",
      "카카오톡·문자 자동 발송",
    ],
    mockup: {
      label: "학부모 리포트",
      lines: [
        { who: "발송", text: "[수업 종료] 오늘 수업 리포트 도착!" },
        { who: "내용", text: "출석 ✅ | 집중도 ★★★★☆ | 숙제 완료" },
        { who: "링크", text: "📎 오늘 학습 상세 보기 →" },
      ],
    },
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  blue: Bot,
  purple: Brain,
  emerald: TrendingUp,
  orange: CalendarCheck,
  pink: Bell,
};

const COLOR_TEXT: Record<string, string> = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  emerald: "text-emerald-600",
  orange: "text-orange-600",
  pink: "text-pink-600",
};
const COLOR_BG: Record<string, string> = {
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  emerald: "bg-emerald-600",
  orange: "bg-orange-600",
  pink: "bg-pink-600",
};
const COLOR_RING: Record<string, string> = {
  blue: "ring-blue-200",
  purple: "ring-purple-200",
  emerald: "ring-emerald-200",
  orange: "ring-orange-200",
  pink: "ring-pink-200",
};

// ── 기능 카드 컴포넌트 ─────────────────────────────
function FeatureSection({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const { ref, visible } = useScrollReveal(60);
  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`py-20 px-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${isEven ? "" : "md:[&>*:first-child]:order-2"}`}>
          {/* 텍스트 */}
          <div className="space-y-6">
            {/* 뱃지 */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${feature.bg} ${COLOR_TEXT[feature.color]} font-semibold text-sm`}>
              <Icon className="h-4 w-4" />
              {feature.badge}
            </div>

            {/* 번호 + 제목 */}
            <div>
              <div className={`text-6xl font-black ${COLOR_TEXT[feature.color]} opacity-10 leading-none mb-1`}>
                0{feature.id}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-snug text-gray-900 whitespace-pre-line">
                {feature.title}
              </h2>
            </div>

            <p className="text-gray-500 text-lg leading-relaxed">{feature.desc}</p>

            <ul className="space-y-3">
              {feature.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${COLOR_TEXT[feature.color]}`} />
                  <span className="text-gray-700 font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 목업 카드 */}
          <div className={`relative ${isEven ? "" : ""}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-2xl opacity-20 scale-95`} />
            <div className={`relative bg-white rounded-3xl shadow-2xl border ${feature.border} overflow-hidden`}>
              {/* 카드 헤더 */}
              <div className={`bg-gradient-to-r ${feature.gradient} px-6 py-4 flex items-center gap-3`}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                  <span className="w-3 h-3 rounded-full bg-white/40" />
                </div>
                <span className="text-white font-semibold text-sm ml-1">{feature.mockup.label}</span>
              </div>

              {/* 채팅 라인 */}
              <div className="p-6 space-y-4">
                {feature.mockup.lines.map((line, i) => {
                  const isAI = line.who === "AI" || line.who === "결과" || line.who === "생성" || line.who === "발송" || line.who === "채점";
                  const isStudent = line.who === "학생" || line.who === "분석" || line.who === "오늘";
                  return (
                    <div
                      key={i}
                      className={`flex ${isAI ? "justify-end" : "justify-start"} gap-3`}
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      {!isAI && (
                        <div className={`w-8 h-8 rounded-full ${feature.bg} ${COLOR_TEXT[feature.color]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                          {line.who[0]}
                        </div>
                      )}
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isAI
                          ? `bg-gradient-to-r ${feature.gradient} text-white rounded-tr-none`
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}>
                        {line.text}
                      </div>
                      {isAI && (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 라이브 인디케이터 */}
                <div className="flex items-center gap-2 pt-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${COLOR_BG[feature.color]}`} />
                  <span className={`text-xs font-medium ${COLOR_TEXT[feature.color]}`}>AI 실시간 분석 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const ud = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(ud.name || "사용자");
      }
    } catch {}
  }, []);

  // 기능 탭 자동 순환
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const featuresMenu = {
    title: "학생 학습 자료",
    description: "학습 효율을 극대화하는 스마트 기능들",
    items: [
      { icon: "📚", title: "디지털 학습 자료", description: "언제 어디서나 접근 가능한 체계적인 학습 콘텐츠", href: "/student/materials" },
      { icon: "📊", title: "학습 진도 관리", description: "실시간으로 확인하는 나의 학습 진행 상황", href: "/student/progress" },
      { icon: "🤖", title: "AI 부족한 개념 분석", description: "AI가 자동으로 취약 개념을 분석하고 보완 학습 제공", href: "/student/ai-analysis" },
      { icon: "🎯", title: "개별 학습 관리", description: "나만의 맞춤형 학습 계획과 관리", href: "/student/personalized" },
      { icon: "💬", title: "24시간 AI 튜터", description: "언제든지 질문하고 답변받는 AI 학습 도우미", href: "/student/tutor" },
    ],
  };
  const benefitsMenu = {
    title: "학원장 관리",
    description: "효율적인 학원 운영을 위한 통합 솔루션",
    items: [
      { icon: "🛒", title: "AI 쇼핑몰", description: "다양한 AI 교육 솔루션을 구매하고 관리", href: "/director/ai-shop" },
      { icon: "⏰", title: "24시간 AI 튜터", description: "학생들을 위한 24시간 질의응답 서비스", href: "/director/tutor-24" },
      { icon: "🧠", title: "AI 부족한 개념 분석", description: "전체 학생의 취약 개념을 한눈에 파악", href: "/director/ai-concept-analysis" },
      { icon: "👥", title: "개별 학습 관리", description: "학생별 맞춤형 학습 관리 및 분석", href: "/director/student-management" },
    ],
  };
  const marketingMenu = {
    title: "학원 운영 및 마케팅",
    description: "학원 운영을 위한 통합 마케팅 솔루션",
    link: "https://wearesuperplace.com/",
    items: [
      { icon: "📱", title: "소셜미디어 관리", description: "인스타그램, 블로그 등 통합 관리", href: "https://wearesuperplace.com/" },
      { icon: "📊", title: "마케팅 분석", description: "실시간 마케팅 성과 분석", href: "https://wearesuperplace.com/" },
      { icon: "🎯", title: "타겟 광고", description: "효율적인 광고 캠페인 운영", href: "https://wearesuperplace.com/" },
      { icon: "💬", title: "고객 소통", description: "학부모 및 학생 커뮤니케이션", href: "https://wearesuperplace.com/" },
    ],
  };
  const aboutMenu = {
    title: "회사 소개",
    description: "SUPER PLACE와 함께하는 스마트 학습",
    items: [
      { icon: "🏢", title: "회사 소개", description: "체계적인 학습 관리 시스템을 제공합니다", href: "/about" },
      { icon: "📞", title: "문의하기", description: "궁금한 점이 있으시면 언제든 연락주세요", href: "/contact" },
      { icon: "❓", title: "도움말", description: "서비스 이용 가이드와 FAQ", href: "/help" },
      { icon: "⚡", title: "기능 소개", description: "모든 기능을 자세히 알아보세요", href: "/features" },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {[
              { label: "기능 소개" },
              { label: "학습 효과" },
              { label: "학원 운영 및 마케팅" },
              { label: "학원 소개" },
            ].map(({ label }) => (
              <div key={label} className="relative group/nav">
                <button
                  className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 transition-colors py-2"
                  onMouseEnter={() => setIsMenuOpen(true)}
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  {label}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            ))}
            <Link href="/pricing" className="text-sm font-medium hover:text-blue-600 transition-colors py-2">
              요금제
            </Link>

            {/* 메가 메뉴 */}
            <div
              className={`fixed left-0 right-0 bg-white shadow-2xl border-t transition-all duration-300 z-50 overflow-hidden ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
              style={{ top: "72px" }}
            >
              <div className={`container mx-auto px-4 py-8 transform transition-transform duration-500 ease-out ${isMenuOpen ? "translate-y-0" : "-translate-y-5"}`}>
                <div className="grid grid-cols-4 gap-8">
                  {[
                    { menu: featuresMenu, color: "blue" },
                    { menu: benefitsMenu, color: "purple" },
                    { menu: marketingMenu, color: "pink" },
                    { menu: aboutMenu, color: "indigo" },
                  ].map(({ menu, color }, ci) => (
                    <div key={ci} className="space-y-4">
                      <div className="pb-4 border-b">
                        <h3 className={`text-lg font-bold mb-1 text-${color}-600`}>{menu.title}</h3>
                        <p className="text-xs text-gray-500">{menu.description}</p>
                      </div>
                      <div className="space-y-1">
                        {menu.items.map((item, i) => (
                          <a
                            key={i}
                            href={item.href}
                            target={item.href.startsWith("http") ? "_blank" : undefined}
                            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className={`flex items-start gap-3 p-2.5 rounded-lg hover:bg-${color}-50 transition-colors`}
                          >
                            <span className="text-xl">{item.icon}</span>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                              <div className="text-xs text-gray-500 leading-relaxed">{item.description}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {!isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <Button variant="ghost">로그인</Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="/teacher-login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-t-lg transition-colors">
                    <Users className="inline-block w-4 h-4 mr-2" />학원장 / 선생님
                  </a>
                  <a href="/student-login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-b-lg transition-colors">
                    <GraduationCap className="inline-block w-4 h-4 mr-2" />학생
                  </a>
                </div>
              </div>
              <a href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  무료 시작하기
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{userName}님</span>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  대시보드
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl" />
          {/* 그리드 패턴 */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div
          className="container mx-auto px-4 py-28 text-center relative z-10 transition-all duration-300"
          style={{
            opacity: Math.max(0, 1 - scrollY / 600),
            transform: `translateY(${Math.min(scrollY * 0.2, 80)}px)`,
          }}
        >
          {/* 배지 */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-semibold text-blue-200 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
            학원 전용 AI 솔루션 — 5가지 핵심 기능
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
            <span className="block text-white">우리 학원만의 AI로</span>
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mt-2">
              학원 운영을 혁신하세요
            </span>
          </h1>

          <p className="text-xl text-blue-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            24시간 AI 튜터 · AI 채점 · 유사문제 출제 · 출결 자동화 · 학부모 자동 발송<br />
            <span className="text-white/60 text-base">반복 업무는 AI가, 선생님은 수업에만 집중하세요</span>
          </p>

          {/* 기능 탭 미리보기 */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFeature === i
                      ? `bg-gradient-to-r ${f.gradient} text-white shadow-lg scale-105`
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {f.badge}
                </button>
              );
            })}
          </div>

          {/* CTA 버튼 */}
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <a href="/register">
                <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-2xl hover:shadow-blue-500/25 transition-all transform hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  무료로 시작하기
                </Button>
              </a>
              <a href="/teacher-login">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 로그인
                </Button>
              </a>
            </div>
          )}

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: 500, suffix: "+", label: "재원생", color: "text-blue-400" },
              { value: 95, suffix: "%", label: "학습 만족도", color: "text-purple-400" },
              { value: 3, suffix: "분", label: "평균 채점 시간", color: "text-cyan-400" },
              { value: 24, suffix: "/7", label: "AI 학습 지원", color: "text-pink-400" },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className={`text-3xl font-black ${s.color} mb-1`}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white/50 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 물결 구분선 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 40C840 48 960 64 1080 72C1200 80 1320 80 1380 80L1440 80V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ══ 5대 기능 소개 섹션 ══════════════════════════════ */}
      {/* 섹션 헤더 */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-6">
            <Star className="h-4 w-4 text-yellow-500" />
            5가지 핵심 기능
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            반복 업무는 AI에게,<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              선생님은 수업에만 집중하세요
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            학원 운영의 모든 반복 업무를 자동화하고,<br />
            아이들의 학습 효과를 극대화하는 5가지 AI 솔루션
          </p>
        </div>
      </section>

      {/* 기능 구분선 */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 기능 1: 24시간 AI 튜터 — 흰 배경 */}
      {FEATURES.map((feature, index) => (
        <section
          key={feature.id}
          className={index % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
        >
          <FeatureSection feature={feature} index={index} />
          {index < FEATURES.length - 1 && (
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          )}
        </section>
      ))}

      {/* ══ 프로세스 요약 ════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-900 to-blue-950 text-white overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              도입 후 달라지는 학원 하루
            </h2>
            <p className="text-blue-200/70 text-lg">기존 3시간 업무 → SUPER PLACE와 함께 15분으로</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { time: "수업 시작", icon: ClipboardCheck, text: "QR 출결\n자동 기록", color: "from-blue-500 to-cyan-500" },
              { time: "수업 중", icon: Bot, text: "AI 튜터\n질문 응답", color: "from-purple-500 to-violet-500" },
              { time: "수업 후", icon: FileCheck, text: "숙제 사진\nAI 즉시 채점", color: "from-emerald-500 to-teal-500" },
              { time: "저녁", icon: MessageSquare, text: "학부모 리포트\n자동 발송", color: "from-orange-500 to-amber-500" },
              { time: "심야", icon: Brain, text: "학생 AI 질문\n24시간 응답", color: "from-pink-500 to-rose-500" },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                {i < 4 && (
                  <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-white/30" />
                  </div>
                )}
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}>
                  <step.icon className="h-9 w-9 text-white" />
                </div>
                <div className="text-xs text-blue-300/60 font-semibold mb-1 uppercase tracking-wide">{step.time}</div>
                <div className="text-white font-bold text-sm leading-relaxed whitespace-pre-line">{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════ */}
      {!isLoggedIn && (
        <section className="py-28 px-4 bg-white">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold mb-8">
              <Sparkles className="h-4 w-4" />
              지금 바로 무료 체험
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              우리 학원도 AI로<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                한 단계 도약할 수 있습니다
              </span>
            </h2>
            <p className="text-gray-500 text-lg mb-10">
              설치 없이 바로 사용 · 무료 체험 제공 · 도입 상담 무료
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register">
                <Button size="lg" className="text-lg px-12 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  무료로 시작하기
                </Button>
              </a>
              <a href="/teacher-login">
                <Button size="lg" variant="outline" className="text-lg px-12 py-7 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 로그인
                </Button>
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-6">신용카드 불필요 · 언제든 취소 가능</p>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SUPER PLACE
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                학원을 위한 AI 올인원 솔루션.<br />
                반복 업무는 AI가, 수업은 선생님이.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">학생</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/student/materials" className="hover:text-blue-600 transition-colors">학습 자료</Link></li>
                <li><Link href="/student/progress" className="hover:text-blue-600 transition-colors">진도 관리</Link></li>
                <li><Link href="/student/ai-analysis" className="hover:text-blue-600 transition-colors">AI 개념 분석</Link></li>
                <li><Link href="/student/tutor" className="hover:text-blue-600 transition-colors">24시간 AI 튜터</Link></li>
                <li><a href="/register" className="hover:text-blue-600 transition-colors">회원가입</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">학원장</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/teacher-login" className="hover:text-blue-600 transition-colors">로그인</a></li>
                <li><Link href="/director/ai-shop" className="hover:text-blue-600 transition-colors">AI 쇼핑몰</Link></li>
                <li><Link href="/director/analytics" className="hover:text-blue-600 transition-colors">학원 분석</Link></li>
                <li><Link href="/director/management" className="hover:text-blue-600 transition-colors">통합 관리</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-gray-800">지원</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">회사 소개</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">문의하기</Link></li>
                <li><Link href="/help" className="hover:text-blue-600 transition-colors">도움말</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">요금제</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">주식회사 우리는 슈퍼플레이스다</h3>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>사업자등록번호: 142-88-02445</p>
                  <p>주소: 인천광역시 서구 청라커낼로 270, 2층</p>
                  <p>
                    이메일:{" "}
                    <a href="mailto:wangholy1@naver.com" className="hover:text-blue-600 underline">wangholy1@naver.com</a>
                    {" | "}
                    전화:{" "}
                    <a href="tel:010-8739-9697" className="hover:text-blue-600 underline">010-8739-9697</a>
                  </p>
                </div>
              </div>
              <div className="py-4 border-y border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
                  <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">회사 소개</Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">이용약관</Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors font-semibold">개인정보처리방침</Link>
                </div>
              </div>
              <p className="text-sm text-gray-400">© 2026 우리는 슈퍼플레이스다. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
