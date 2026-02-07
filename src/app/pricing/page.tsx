"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X,
  Zap,
  Users,
  Crown,
  Building2,
  GraduationCap,
  ArrowRight,
  Star
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  notIncluded?: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "무료",
    description: "소규모 학원을 위한 기본 플랜",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 10,
    maxTeachers: 2,
    icon: <GraduationCap className="h-8 w-8" />,
    color: "text-gray-600",
    features: [
      "최대 10명의 학생 관리",
      "최대 2명의 선생님 계정",
      "기본 출석 관리",
      "기본 과제 제출 시스템",
      "학생별 성적 기록",
      "기본 학습 자료 공유",
    ],
    notIncluded: [
      "AI 챗봇 기능",
      "고급 분석 리포트",
      "맞춤형 브랜딩",
      "우선 고객 지원",
    ]
  },
  {
    id: "standard",
    name: "스탠다드",
    description: "중소규모 학원을 위한 추천 플랜",
    monthlyPrice: 50000,
    yearlyPrice: 500000,
    maxStudents: 50,
    maxTeachers: 5,
    icon: <Users className="h-8 w-8" />,
    color: "text-blue-600",
    isPopular: true,
    features: [
      "최대 50명의 학생 관리",
      "최대 5명의 선생님 계정",
      "고급 출석 관리 (QR 코드)",
      "AI 챗봇 기능 (기본)",
      "과제 자동 채점",
      "학습 진도 분석",
      "학부모 알림 서비스",
      "클라우드 저장공간 50GB",
      "이메일 고객 지원",
    ],
    notIncluded: [
      "무제한 AI 챗봇",
      "맞춤형 브랜딩",
      "전담 매니저",
    ]
  },
  {
    id: "premium",
    name: "프리미엄",
    description: "대규모 학원을 위한 완벽한 솔루션",
    monthlyPrice: 150000,
    yearlyPrice: 1500000,
    maxStudents: 200,
    maxTeachers: 20,
    icon: <Crown className="h-8 w-8" />,
    color: "text-purple-600",
    features: [
      "최대 200명의 학생 관리",
      "최대 20명의 선생님 계정",
      "모든 스탠다드 기능 포함",
      "무제한 AI 챗봇 대화",
      "고급 학습 분석 리포트",
      "맞춤형 브랜딩 (로고, 색상)",
      "학원 전용 모바일 앱",
      "클라우드 저장공간 200GB",
      "우선 고객 지원 (24/7)",
      "월 1회 컨설팅",
    ],
  },
  {
    id: "enterprise",
    name: "엔터프라이즈",
    description: "대형 학원 및 프랜차이즈를 위한 맞춤형 솔루션",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 999999,
    maxTeachers: 999999,
    icon: <Building2 className="h-8 w-8" />,
    color: "text-amber-600",
    features: [
      "무제한 학생 및 선생님",
      "모든 프리미엄 기능 포함",
      "다중 지점 통합 관리",
      "전담 매니저 배정",
      "맞춤형 기능 개발",
      "무제한 클라우드 저장공간",
      "API 통합 지원",
      "온사이트 교육 및 지원",
      "연간 전략 컨설팅",
    ],
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  const getPrice = (plan: PricingPlan) => {
    if (plan.id === "enterprise") {
      return "문의";
    }
    if (plan.monthlyPrice === 0) {
      return "무료";
    }
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const getSavingsPercentage = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0 || plan.id === "enterprise") return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = ((monthlyTotal - plan.yearlyPrice) / monthlyTotal * 100).toFixed(0);
    return savings;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">홈으로</Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button>대시보드</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">로그인</Button>
                </Link>
                <Link href="/register">
                  <Button>회원가입</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <Zap className="w-4 h-4 mr-1" />
            요금제
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            학원에 맞는 플랜을 선택하세요
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            소규모부터 대형 프랜차이즈까지,<br />
            모든 학원 규모에 맞는 맞춤형 솔루션을 제공합니다
          </p>

          {/* 요금 주기 선택 */}
          <div className="inline-flex items-center gap-4 p-2 bg-white rounded-full shadow-lg mb-12">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full font-semibold transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              연간 결제
              {billingCycle === "yearly" && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  최대 17% 할인
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 요금제 카드 */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.isPopular ? 'border-4 border-blue-500 shadow-xl' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold">
                    <Star className="w-4 h-4 inline mr-1" />
                    인기
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto mb-4 ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-6">
                    {plan.id === "enterprise" ? (
                      <div className="text-4xl font-bold">맞춤 견적</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {getPrice(plan)}
                          {plan.monthlyPrice > 0 && (
                            <span className="text-lg font-normal text-gray-600">
                              원/{billingCycle === "monthly" ? "월" : "년"}
                            </span>
                          )}
                        </div>
                        {billingCycle === "yearly" && getSavingsPercentage(plan) && (
                          <Badge variant="secondary" className="mt-2">
                            {getSavingsPercentage(plan)}% 할인
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    최대 {plan.maxStudents === 999999 ? "무제한" : plan.maxStudents}명 학생 · 
                    {plan.maxTeachers === 999999 ? "무제한" : plan.maxTeachers}명 선생님
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded?.map((feature, index) => (
                      <li key={`not-${index}`} className="flex items-start gap-2 opacity-50">
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.id === "enterprise" ? "/contact" : "/register"}>
                    <Button 
                      className={`w-full ${
                        plan.isPopular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : ''
                      }`}
                      variant={plan.isPopular ? "default" : "outline"}
                    >
                      {plan.id === "enterprise" ? "문의하기" : "시작하기"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">자주 묻는 질문</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>중간에 플랜을 변경할 수 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 
                  업그레이드 시에는 즉시 적용되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>무료 체험 기간이 있나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  무료 플랜으로 시작하여 서비스를 체험해보실 수 있습니다. 
                  유료 플랜의 경우 첫 14일간 무료로 사용해보실 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>환불 정책은 어떻게 되나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  서비스 시작 후 30일 이내에는 100% 환불이 가능합니다. 
                  그 이후에는 남은 기간에 대해 일할 계산하여 환불해드립니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>학생 수가 증가하면 어떻게 하나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  현재 플랜의 학생 수를 초과하면 상위 플랜으로 업그레이드하실 수 있습니다. 
                  또는 엔터프라이즈 플랜으로 맞춤형 솔루션을 제공받으실 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="text-4xl mb-4">아직 고민 중이신가요?</CardTitle>
              <CardDescription className="text-white/90 text-lg">
                전문 상담원이 학원에 맞는 최적의 플랜을 추천해드립니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    상담 신청하기
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 text-white border-white hover:bg-white hover:text-blue-600">
                    무료로 시작하기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 SUPER PLACE. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/terms" className="hover:text-blue-600">이용약관</Link>
            <Link href="/privacy" className="hover:text-blue-600">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
