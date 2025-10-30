import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Zap,
  Instagram,
  Youtube,
  MessageSquare,
  MapPin
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SUPER PLACE</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              회사 소개
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              기능
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              요금제
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary">
              문의
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/register">
              <Button>무료 시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            모든 마케팅 채널을<br />하나로 관리하세요
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            네이버, 인스타그램, 유튜브, 틱톡, 당근마켓까지<br />
            실시간 모니터링과 통합 분석으로 마케팅 성과를 극대화하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                데모 보기
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>네이버 블로그</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              <span>네이버 플레이스</span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-6 w-6" />
              <span>인스타그램</span>
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6" />
              <span>유튜브</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              <span>틱톡</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>당근마켓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            강력한 기능
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="실시간 모니터링"
              description="모든 채널의 활동을 실시간으로 추적하고 모니터링하세요"
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-primary" />}
              title="통합 분석"
              description="각 플랫폼의 데이터를 통합하여 인사이트를 얻으세요"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="안전한 데이터"
              description="엔터프라이즈급 보안으로 데이터를 안전하게 보호합니다"
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="빠른 동기화"
              description="API 연동으로 데이터를 즉시 동기화합니다"
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10 text-primary" />}
              title="댓글 관리"
              description="모든 채널의 댓글을 한 곳에서 관리하세요"
            />
            <FeatureCard
              icon={<MapPin className="h-10 w-10 text-primary" />}
              title="리뷰 모니터링"
              description="고객 리뷰를 실시간으로 확인하고 대응하세요"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            요금제
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="무료"
              price="0"
              features={[
                "계정 1개",
                "기본 분석",
                "월간 리포트",
                "이메일 지원"
              ]}
            />
            <PricingCard
              name="프리미엄"
              price="49,000"
              features={[
                "계정 5개",
                "고급 분석",
                "실시간 알림",
                "우선 지원",
                "API 접근"
              ]}
              popular
            />
            <PricingCard
              name="엔터프라이즈"
              price="문의"
              features={[
                "무제한 계정",
                "커스텀 분석",
                "전담 매니저",
                "24/7 지원",
                "맞춤 개발"
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            14일 무료 체험, 신용카드 필요 없음
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">SUPER PLACE</span>
              </div>
              <p className="text-sm text-gray-600">
                통합 소셜미디어 마케팅 플랫폼
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">제품</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features">기능</Link></li>
                <li><Link href="#pricing">요금제</Link></li>
                <li><Link href="#demo">데모</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">회사</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#about">회사 소개</Link></li>
                <li><Link href="#contact">문의</Link></li>
                <li><Link href="#careers">채용</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">법적 고지</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#privacy">개인정보처리방침</Link></li>
                <li><Link href="#terms">이용약관</Link></li>
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

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ 
  name, 
  price, 
  features, 
  popular 
}: { 
  name: string; 
  price: string; 
  features: string[];
  popular?: boolean;
}) {
  return (
    <div className={`p-8 border rounded-lg ${popular ? 'border-primary shadow-xl scale-105' : ''}`}>
      {popular && (
        <div className="text-center mb-4">
          <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
            인기
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-center mb-4">{name}</h3>
      <div className="text-center mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "문의" && <span className="text-gray-600">/월</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg
              className="h-5 w-5 text-primary mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button className="w-full" variant={popular ? "default" : "outline"}>
          시작하기
        </Button>
      </Link>
    </div>
  );
}
