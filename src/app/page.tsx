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
  ChevronDown
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  // Scroll animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // If user is logged in, redirect to dashboard
  if (status === "authenticated" && session) {
    router.push("/dashboard");
    return null;
  }

  const isLoggedIn = status === "authenticated";

  // Dropdown menu data
  const featuresMenu = [
    { name: "디지털 학습 자료", href: "#features" },
    { name: "학습 진도 관리", href: "#features" },
    { name: "과제 제출 시스템", href: "#features" },
    { name: "성적 분석", href: "#features" },
  ];

  const benefitsMenu = [
    { name: "학생을 위한", href: "#benefits" },
    { name: "학원장을 위한", href: "#benefits" },
    { name: "선생님을 위한", href: "#benefits" },
  ];

  const aboutMenu = [
    { name: "학원 소개", href: "#about" },
    { name: "문의하기", href: "#contact" },
    { name: "도움말", href: "#help" },
  ];

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
            {/* 기능 소개 드롭다운 */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2">
                기능 소개
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {featuresMenu.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                      index === 0 ? "rounded-t-lg" : ""
                    } ${index === featuresMenu.length - 1 ? "rounded-b-lg" : ""}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 학습 효과 드롭다운 */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2">
                학습 효과
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {benefitsMenu.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors ${
                      index === 0 ? "rounded-t-lg" : ""
                    } ${index === benefitsMenu.length - 1 ? "rounded-b-lg" : ""}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 학원 소개 드롭다운 */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors py-2">
                학원 소개
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {aboutMenu.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                      index === 0 ? "rounded-t-lg" : ""
                    } ${index === aboutMenu.length - 1 ? "rounded-b-lg" : ""}`}
                  >
                    {item.name}
                  </Link>
                ))}
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
                  <Link href="/login/director" className="block px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-t-lg transition-colors">
                    <Users className="inline-block w-4 h-4 mr-2" />
                    학원장 / 선생님
                  </Link>
                  <Link href="/login/student" className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-b-lg transition-colors">
                    <GraduationCap className="inline-block w-4 h-4 mr-2" />
                    학생
                  </Link>
                </div>
              </div>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button>대시보드로 이동</Button>
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
            <span className="text-sm font-semibold text-blue-700">🎓 스마트 학습 관리 시스템</span>
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
              <Link href="/login/student">
                <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  학생 로그인
                </Button>
              </Link>
              <Link href="/login/director">
                <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 로그인
                </Button>
              </Link>
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
                <span className="text-sm font-semibold text-blue-700">👨‍🎓 학생을 위한</span>
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
                <span className="text-sm font-semibold text-purple-700">👨‍💼 학원장을 위한</span>
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
              <Link href="/login/student">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 bg-white text-green-600 hover:bg-gray-100 shadow-xl">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  학생 로그인
                </Button>
              </Link>
              <Link href="/login/director">
                <Button size="lg" className="text-lg px-10 py-7 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 shadow-xl">
                  <Users className="mr-2 h-5 w-5" />
                  학원장 로그인
                </Button>
              </Link>
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
                <li><Link href="#features">학습 자료</Link></li>
                <li><Link href="#benefits">진도 관리</Link></li>
                <li><Link href="/register">회원가입</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">학원장</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/login">로그인</Link></li>
                <li><Link href="#features">기능 소개</Link></li>
                <li><Link href="#about">관리 시스템</Link></li>
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
          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
            © 2024 SUPER PLACE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
