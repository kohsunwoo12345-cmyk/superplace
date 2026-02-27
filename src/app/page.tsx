"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Award,
  BarChart3,
  Clock,
  FileText,
  Target,
  ChevronDown,
  TrendingUp,
  Briefcase,
  MessageCircle,
  Share2,
  Building2,
  Phone,
  HelpCircle
} from "lucide-react";
import { useEffect, useState } from "react";

// Helper Components
function FeatureCard({ icon, title, description, color = "blue" }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color?: string;
}) {
  const colorClasses = {
    blue: "hover:border-blue-300 hover:shadow-blue-100",
    purple: "hover:border-purple-300 hover:shadow-purple-100",
    pink: "hover:border-pink-300 hover:shadow-pink-100",
    indigo: "hover:border-indigo-300 hover:shadow-indigo-100",
  };

  return (
    <div className={`p-8 border-2 rounded-2xl hover:shadow-xl transition-all duration-300 bg-white ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ text, color = "blue" }: { text: string; color?: string }) {
  const colorClasses = {
    blue: "text-blue-600",
    purple: "text-purple-600",
  };

  return (
    <li className="flex items-start gap-3">
      <svg
        className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses]} mt-0.5 flex-shrink-0`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M5 13l4 4L19 7"></path>
      </svg>
      <span className="text-gray-700 font-medium">{text}</span>
    </li>
  );
}

// Mega Menu Component
function MegaMenu({ 
  title, 
  description, 
  items, 
  link 
}: { 
  title: string; 
  description: string; 
  items: Array<{ icon: string; title: string; description: string; href: string }>;
  link?: string;
}) {
  const itemsPerRow = items.length;
  const descriptionCols = Math.max(2, Math.floor(itemsPerRow / 2));
  const totalCols = descriptionCols + itemsPerRow;

  return (
    <div className="fixed left-0 right-0 mt-2 bg-white shadow-2xl border-t opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
      <div 
        className="container mx-auto px-4 py-8 transform translate-y-[-20px] group-hover:translate-y-0 transition-transform duration-500 ease-out"
      >
        <div className={`grid gap-6`} style={{ gridTemplateColumns: `${descriptionCols}fr ${'1fr '.repeat(itemsPerRow)}` }}>
          {/* 메인 설명 */}
          <div className={`pr-8 border-r`} style={{ gridColumn: `span ${descriptionCols}` }}>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {description}
            </p>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>지금 바로 시작하기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            )}
          </div>
          
          {/* 기능 그리드 - Stagger Animation */}
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="p-6 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:shadow-lg group/item transform opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
              style={{
                transitionDelay: `${index * 100}ms`,
                transitionDuration: '500ms'
              }}
            >
              <div className="text-4xl mb-3 group-hover/item:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <h4 className="font-semibold text-lg mb-2 group-hover/item:text-blue-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // const { data: session, status } = useSession(); // Static Export
  // const router = useRouter(); // Static Export
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Scroll animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // localStorage에서 로그인 정보 확인
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(userData.name || "사용자");
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  // Mega menu data - 학생용 메뉴
  const featuresMenu = {
    title: "학생 학습 자료",
    description: "학습 효율을 극대화하는 스마트 기능들",
    items: [
      {
        icon: "📚",
        title: "디지털 학습 자료",
        description: "언제 어디서나 접근 가능한 체계적인 학습 콘텐츠",
        href: "/student/materials"
      },
      {
        icon: "📊",
        title: "학습 진도 관리",
        description: "실시간으로 확인하는 나의 학습 진행 상황",
        href: "/student/progress"
      },
      {
        icon: "🤖",
        title: "AI 부족한 개념 분석",
        description: "AI가 자동으로 취약 개념을 분석하고 보완 학습 제공",
        href: "/student/ai-analysis"
      },
      {
        icon: "🎯",
        title: "개별 학습 관리",
        description: "나만의 맞춤형 학습 계획과 관리",
        href: "/student/personalized"
      },
      {
        icon: "💬",
        title: "24시간 AI 튜터",
        description: "언제든지 질문하고 답변받는 AI 학습 도우미",
        href: "/student/tutor"
      }
    ]
  };

  // 학원장용 메뉴
  const benefitsMenu = {
    title: "학원장 관리",
    description: "효율적인 학원 운영을 위한 통합 솔루션",
    items: [
      {
        icon: "🛒",
        title: "AI 쇼핑몰",
        description: "다양한 AI 교육 솔루션을 구매하고 관리",
        href: "/director/ai-shop"
      },
      {
        icon: "⏰",
        title: "24시간 AI 튜터",
        description: "학생들을 위한 24시간 질의응답 서비스",
        href: "/director/tutor-24"
      },
      {
        icon: "🧠",
        title: "AI 부족한 개념 분석",
        description: "전체 학생의 취약 개념을 한눈에 파악",
        href: "/director/ai-concept-analysis"
      },
      {
        icon: "👥",
        title: "개별 학습 관리",
        description: "학생별 맞춤형 학습 관리 및 분석",
        href: "/director/student-management"
      }
    ]
  };

  const marketingMenu = {
    title: "학원 운영 및 마케팅",
    description: "학원 운영을 위한 통합 마케팅 솔루션",
    link: "https://superplace-academy.pages.dev",
    items: [
      {
        icon: <Share2 className="h-6 w-6" />,
        title: "소셜미디어 관리",
        description: "인스타그램, 블로그 등 통합 관리",
        href: "https://superplace-academy.pages.dev"
      },
      {
        icon: <TrendingUp className="h-6 w-6" />,
        title: "마케팅 분석",
        description: "실시간 마케팅 성과 분석",
        href: "https://superplace-academy.pages.dev"
      },
      {
        icon: <Target className="h-6 w-6" />,
        title: "타겟 광고",
        description: "효율적인 광고 캠페인 운영",
        href: "https://superplace-academy.pages.dev"
      },
      {
        icon: <MessageCircle className="h-6 w-6" />,
        title: "고객 소통",
        description: "학부모 및 학생 커뮤니케이션",
        href: "https://superplace-academy.pages.dev"
      }
    ]
  };

  const aboutMenu = {
    title: "학원 소개",
    description: "SUPER PLACE와 함께하는 스마트 학습",
    items: [
      {
        icon: <Building2 className="h-6 w-6" />,
        title: "학원 소개",
        description: "체계적인 학습 관리 시스템을 제공합니다",
        href: "#about"
      },
      {
        icon: <Phone className="h-6 w-6" />,
        title: "문의하기",
        description: "궁금한 점이 있으시면 언제든 연락주세요",
        href: "/contact"
      },
      {
        icon: <HelpCircle className="h-6 w-6" />,
        title: "도움말",
        description: "서비스 이용 가이드와 FAQ",
        href: "#help"
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            {/* 네비게이션 메뉴들 - 모두 동일한 group 사용 */}
            <div className="relative group/nav">
              {/* 기능 소개 */}
              <button 
                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                기능 소개
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="relative group/nav">
              {/* 학습 효과 */}
              <button 
                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                학습 효과
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="relative group/nav">
              {/* 학원 운영 및 마케팅 */}
              <button 
                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                학원 운영 및 마케팅
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="relative group/nav">
              {/* 학원 소개 */}
              <button 
                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                학원 소개
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 요금제 메뉴 - 직접 링크 */}
            <Link 
              href="/pricing"
              className="text-sm font-medium hover:text-primary transition-colors py-2 flex items-center gap-1"
            >
              요금제
            </Link>

            {/* 통합 메가메뉴 - 모든 메뉴 동시 표시 */}
            <div 
              className={`fixed left-0 right-0 mt-2 bg-white shadow-2xl border-t transition-all duration-300 z-50 overflow-hidden ${
                isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
              style={{ top: '72px' }}
            >
              <div 
                className={`container mx-auto px-4 py-8 transform transition-transform duration-500 ease-out ${
                  isMenuOpen ? 'translate-y-0' : 'translate-y-[-20px]'
                }`}
              >
                <div className="grid grid-cols-4 gap-8">
                  {/* 기능 소개 섹션 */}
                  <div className="space-y-4">
                    <div className="pb-4 border-b">
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {featuresMenu.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {featuresMenu.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {featuresMenu.items.map((item, index) => (
                        <a
                          key={index}
                          href={item.href}
                          className={`block p-3 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:shadow-md group/item transform opacity-0 translate-y-4 ${
                            isMenuOpen ? 'opacity-100 translate-y-0' : ''
                          }`}
                          style={{
                            transitionDelay: `${index * 50}ms`,
                            transitionDuration: '400ms'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-blue-600 group-hover/item:scale-110 transition-transform duration-200">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1 group-hover/item:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 학습 효과 섹션 */}
                  <div className="space-y-4">
                    <div className="pb-4 border-b">
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {benefitsMenu.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {benefitsMenu.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {benefitsMenu.items.map((item, index) => (
                        <a
                          key={index}
                          href={item.href}
                          className={`block p-3 rounded-lg hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-200 hover:shadow-md group/item transform opacity-0 translate-y-4 ${
                            isMenuOpen ? 'opacity-100 translate-y-0' : ''
                          }`}
                          style={{
                            transitionDelay: `${(index + 4) * 50}ms`,
                            transitionDuration: '400ms'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-purple-600 group-hover/item:scale-110 transition-transform duration-200">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1 group-hover/item:text-purple-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 학원 운영 및 마케팅 섹션 */}
                  <div className="space-y-4">
                    <div className="pb-4 border-b">
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                        {marketingMenu.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {marketingMenu.description}
                      </p>
                      {marketingMenu.link && (
                        <a
                          href={marketingMenu.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-lg hover:from-pink-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <span>바로가기</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="space-y-2">
                      {marketingMenu.items.map((item, index) => (
                        <a
                          key={index}
                          href={item.href}
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className={`block p-3 rounded-lg hover:bg-gradient-to-br hover:from-pink-50 hover:to-orange-50 transition-all duration-200 hover:shadow-md group/item transform opacity-0 translate-y-4 ${
                            isMenuOpen ? 'opacity-100 translate-y-0' : ''
                          }`}
                          style={{
                            transitionDelay: `${(index + 7) * 50}ms`,
                            transitionDuration: '400ms'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-pink-600 group-hover/item:scale-110 transition-transform duration-200">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1 group-hover/item:text-pink-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 학원 소개 섹션 */}
                  <div className="space-y-4">
                    <div className="pb-4 border-b">
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        {aboutMenu.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {aboutMenu.description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {aboutMenu.items.map((item, index) => (
                        <a
                          key={index}
                          href={item.href}
                          className={`block p-3 rounded-lg hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 hover:shadow-md group/item transform opacity-0 translate-y-4 ${
                            isMenuOpen ? 'opacity-100 translate-y-0' : ''
                          }`}
                          style={{
                            transitionDelay: `${(index + 11) * 50}ms`,
                            transitionDuration: '400ms'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-indigo-600 group-hover/item:scale-110 transition-transform duration-200">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1 group-hover/item:text-indigo-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          {!isLoggedIn && (
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <Button variant="ghost" className="group-hover:bg-gray-100">
                  로그인
                </Button>
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="/teacher-login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-t-lg transition-colors">
                    <Users className="inline-block w-4 h-4 mr-2" />
                    학원장 / 선생님
                  </a>
                  <a href="/student-login" className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-b-lg transition-colors">
                    <GraduationCap className="inline-block w-4 h-4 mr-2" />
                    학생
                  </a>
                </div>
              </div>
              <a href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  회원가입
                </Button>
              </a>
            </div>
          )}
          {isLoggedIn && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userName}님
              </span>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  대시보드로 가기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
        <div 
          className="container mx-auto text-center transition-all duration-1000"
          style={{
            opacity: Math.min(1, 1 - scrollY / 500),
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        >
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              스마트 학습 관리 시스템
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              체계적인 학습 관리로<br />성적 향상을 실현하세요
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            학원장님은 학생들을 효과적으로 관리하고,<br />
            학생들은 맞춤형 학습 자료로 실력을 향상시킬 수 있습니다
          </p>
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/student-login">
                <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  학생 로그인
                </Button>
              </a>
              <a href="/teacher-login">
                <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 / 선생님 로그인
                </Button>
              </a>
            </div>
          )}
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-sm text-gray-600">학습 자료</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-sm text-gray-600">재원생</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">학습 만족도</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">학습 지원</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white overflow-hidden">
        <div className="container mx-auto">
          <div 
            className="text-center mb-16 transition-all duration-1000"
            style={{
              opacity: scrollY > 200 ? 1 : 0,
              transform: `translateY(${scrollY > 200 ? 0 : 50}px)`
            }}
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                핵심 기능
              </span>
            </h2>
            <p className="text-gray-600 text-lg">학습 효율을 극대화하는 스마트 기능들</p>
          </div>
          <div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000"
            style={{
              opacity: scrollY > 300 ? 1 : 0,
              transform: `translateY(${scrollY > 300 ? 0 : 50}px)`
            }}
          >
            <FeatureCard
              icon={<BookOpen className="h-12 w-12 text-blue-600" />}
              title="디지털 학습 자료"
              description="언제 어디서나 접근 가능한 체계적인 학습 콘텐츠"
              color="blue"
            />
            <FeatureCard
              icon={<BarChart3 className="h-12 w-12 text-purple-600" />}
              title="학습 진도 관리"
              description="실시간으로 확인하는 나의 학습 진행 상황"
              color="purple"
            />
            <FeatureCard
              icon={<FileText className="h-12 w-12 text-pink-600" />}
              title="과제 제출 시스템"
              description="온라인으로 간편하게 과제 제출 및 피드백"
              color="pink"
            />
            <FeatureCard
              icon={<Award className="h-12 w-12 text-indigo-600" />}
              title="성적 분석"
              description="시험 점수 및 성취도를 한눈에 확인"
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section for Students */}
      <section id="benefits" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        <div className="container mx-auto">
          <div 
            className="grid md:grid-cols-2 gap-12 items-center transition-all duration-1000"
            style={{
              opacity: scrollY > 600 ? 1 : 0,
              transform: `translateY(${scrollY > 600 ? 0 : 50}px)`
            }}
          >
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
                <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  학생을 위한
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                스스로 학습하는<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  자기주도 학습 환경
                </span>
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                언제 어디서나 학습 자료에 접근하고,<br />
                자신의 진도를 확인하며 체계적으로 공부하세요.
              </p>
              <ul className="space-y-4">
                <BenefitItem text="과목별 맞춤 학습 자료 제공" />
                <BenefitItem text="학습 진도 실시간 확인" />
                <BenefitItem text="과제 제출 및 피드백 시스템" />
                <BenefitItem text="시험 성적 분석 및 관리" />
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">오늘의 학습</div>
                    <div className="text-sm text-gray-600">3개 과목 · 2시간 30분</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="font-semibold">진도율</div>
                    <div className="text-sm text-gray-600">수학 85% · 영어 92%</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl">
                  <Award className="h-8 w-8 text-pink-600" />
                  <div>
                    <div className="font-semibold">이번 달 성취</div>
                    <div className="text-sm text-gray-600">완료한 과제 15개</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section for Directors */}
      <section className="py-20 px-4 bg-white overflow-hidden">
        <div className="container mx-auto">
          <div 
            className="grid md:grid-cols-2 gap-12 items-center transition-all duration-1000"
            style={{
              opacity: scrollY > 1200 ? 1 : 0,
              transform: `translateY(${scrollY > 1200 ? 0 : 50}px)`
            }}
          >
            <div className="order-2 md:order-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 shadow-xl">
              <div className="bg-white rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="font-semibold">재원생 관리</div>
                    <div className="text-sm text-gray-600">전체 128명 · 출석률 96%</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">학습 현황</div>
                    <div className="text-sm text-gray-600">평균 진도율 87%</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl">
                  <FileText className="h-8 w-8 text-pink-600" />
                  <div>
                    <div className="font-semibold">과제 현황</div>
                    <div className="text-sm text-gray-600">미제출 3건 · 검토 대기 12건</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block mb-4 px-4 py-2 bg-purple-100 rounded-full">
                <span className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  학원장을 위한
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                효율적인 학원 운영을 위한<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  통합 관리 시스템
                </span>
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                학생 정보부터 학습 진도, 출석까지<br />
                모든 것을 한 곳에서 체계적으로 관리하세요.
              </p>
              <ul className="space-y-4">
                <BenefitItem text="학생 계정 생성 및 관리" color="purple" />
                <BenefitItem text="학습 자료 등록 및 배포" color="purple" />
                <BenefitItem text="전체 학생 진도 모니터링" color="purple" />
                <BenefitItem text="출석 및 성적 관리" color="purple" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-24 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              학생이든 학원장이든, 더 나은 학습 환경을 경험해보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/student-login">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 bg-white text-green-600 hover:bg-gray-100 shadow-xl">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  학생 로그인
                </Button>
              </a>
              <a href="/teacher-login">
                <Button size="lg" className="text-lg px-10 py-7 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 / 선생님 로그인
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SUPER PLACE
                </span>
              </div>
              <p className="text-sm text-gray-600">
                스마트 학습 관리 시스템
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">학생</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/student/materials" className="hover:text-blue-600 transition-colors">학습 자료</Link></li>
                <li><Link href="/student/progress" className="hover:text-blue-600 transition-colors">진도 관리</Link></li>
                <li><Link href="/student/ai-analysis" className="hover:text-blue-600 transition-colors">AI 부족한 개념 분석</Link></li>
                <li><Link href="/student/personalized" className="hover:text-blue-600 transition-colors">개별학습 관리</Link></li>
                <li><Link href="/student/tutor" className="hover:text-blue-600 transition-colors">24시간 AI 튜터</Link></li>
                <li><a href="/register" className="hover:text-blue-600 transition-colors">회원가입</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">학원장</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/login" className="hover:text-blue-600 transition-colors">로그인</a></li>
                <li><Link href="/director/ai-shop" className="hover:text-blue-600 transition-colors">AI 쇼핑몰</Link></li>
                <li><Link href="/director/24-tutor" className="hover:text-blue-600 transition-colors">24시간 튜터 서비스</Link></li>
                <li><Link href="/director/analytics" className="hover:text-blue-600 transition-colors">학원 분석</Link></li>
                <li><Link href="/director/management" className="hover:text-blue-600 transition-colors">통합 관리</Link></li>
                <li><Link href="#features" className="hover:text-blue-600 transition-colors">기능 소개</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#about">학원 소개</Link></li>
                <li><Link href="#contact">문의하기</Link></li>
                <li><Link href="#help">도움말</Link></li>
              </ul>
            </div>
          </div>
          
          {/* 회사 정보 및 정책 링크 */}
          <div className="mt-12 pt-8 border-t">
            <div className="text-center space-y-4">
              {/* 회사 소개 */}
              <div className="mb-6">
                <h3 className="font-bold text-xl text-gray-800 mb-3">주식회사 우리는 슈퍼플레이스다</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>사업자등록번호: 142-88-02445</p>
                  <p>주소: 인천광역시 서구 청라커낼로 270, 2층</p>
                  <p>
                    이메일: <a href="mailto:wangholy1@naver.com" className="hover:text-blue-600 transition-colors underline">wangholy1@naver.com</a>
                    {" | "}
                    전화: <a href="tel:010-8739-9697" className="hover:text-blue-600 transition-colors underline">010-8739-9697</a>
                  </p>
                </div>
              </div>

              {/* 정책 링크 - 더 눈에 띄게 */}
              <div className="py-4 border-y border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-6 text-base font-medium">
                  <Link 
                    href="#about" 
                    className="text-gray-700 hover:text-blue-600 transition-colors hover:underline"
                  >
                    회사 소개
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link 
                    href="/terms" 
                    className="text-gray-700 hover:text-blue-600 transition-colors hover:underline"
                  >
                    이용약관
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link 
                    href="/privacy" 
                    className="text-gray-700 hover:text-blue-600 transition-colors hover:underline font-semibold"
                  >
                    개인정보처리방침
                  </Link>
                </div>
              </div>

              {/* 저작권 */}
              <p className="text-sm text-gray-500 pt-2">
                © 2026 우리는 슈퍼플레이스다. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
