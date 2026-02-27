'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Share2, 
  TrendingUp, 
  Target, 
  MessageCircle,
  Instagram,
  Mail,
  Smartphone,
  BarChart,
  Users,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function MarketingPage() {
  const marketingFeatures = [
    {
      icon: <Share2 className="h-10 w-10 text-blue-600" />,
      title: '소셜미디어 관리',
      description: '인스타그램, 페이스북, 블로그 등을 통합 관리',
      benefits: [
        '자동 포스팅 스케줄링',
        '통합 콘텐츠 관리',
        '댓글 및 메시지 통합 관리',
        '성과 분석 리포트'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-green-600" />,
      title: '마케팅 분석',
      description: '실시간 마케팅 성과를 데이터로 확인',
      benefits: [
        '실시간 통계 대시보드',
        '광고 ROI 분석',
        '고객 유입 경로 추적',
        '경쟁사 비교 분석'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Target className="h-10 w-10 text-purple-600" />,
      title: '타겟 광고',
      description: '효율적인 광고 캠페인 운영',
      benefits: [
        'AI 기반 타겟팅',
        '자동 예산 최적화',
        'A/B 테스트 지원',
        '광고 성과 리포트'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-orange-600" />,
      title: '고객 소통',
      description: '학부모 및 학생과의 효과적인 커뮤니케이션',
      benefits: [
        '자동 문자 발송',
        '이메일 캠페인',
        '푸시 알림 관리',
        '피드백 수집'
      ],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <Instagram className="h-10 w-10 text-pink-600" />,
      title: '인스타그램 마케팅',
      description: '인스타그램 특화 마케팅 도구',
      benefits: [
        '스토리 자동 생성',
        '릴스 콘텐츠 최적화',
        '해시태그 분석',
        '인플루언서 협업 관리'
      ],
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Mail className="h-10 w-10 text-indigo-600" />,
      title: '이메일 마케팅',
      description: '자동화된 이메일 캠페인',
      benefits: [
        '맞춤형 이메일 템플릿',
        '자동 발송 스케줄',
        '오픈율 및 클릭률 추적',
        'A/B 테스트'
      ],
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  const successStories = [
    {
      name: '강남 ABC 학원',
      improvement: '학생 수 45% 증가',
      quote: '소셜미디어 통합 관리로 마케팅 시간이 70% 단축되었습니다.',
      period: '3개월'
    },
    {
      name: '분당 DEF 학원',
      improvement: '문의 건수 3배 증가',
      quote: '타겟 광고로 정확한 고객에게 도달할 수 있었습니다.',
      period: '2개월'
    },
    {
      name: '일산 GHI 학원',
      improvement: '전환율 60% 향상',
      quote: '데이터 기반 의사결정으로 광고비를 효율적으로 사용하게 되었습니다.',
      period: '4개월'
    }
  ];

  const marketingStats = [
    { number: '250%', label: '평균 학생 증가율' },
    { number: '85%', label: '마케팅 비용 절감' },
    { number: '3배', label: '문의 건수 증가' },
    { number: '95%', label: '고객 만족도' }
  ];

  const campaignTypes = [
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: '모바일 광고',
      description: '앱 설치 및 웹사이트 방문 유도'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: '커뮤니티 마케팅',
      description: '학부모 카페 및 커뮤니티 활동'
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: '이벤트 프로모션',
      description: '시즌별 특별 이벤트 기획'
    },
    {
      icon: <BarChart className="h-8 w-8" />,
      title: 'SEO 최적화',
      description: '검색 엔진 상위 노출 전략'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">마케팅 솔루션</h1>
                <p className="text-sm text-gray-500">학원 성장을 위한 통합 마케팅 도구</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            학원 성장을 가속화하는 스마트 마케팅
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI 기반 마케팅 자동화로 학생 모집부터 학부모 관리까지 한번에
          </p>
          <div className="flex justify-center gap-4">
            <Link href="https://superplace-academy.pages.dev" target="_blank">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-pink-600">
                마케팅 플랫폼 시작하기
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                무료 상담 신청
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {marketingStats.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Marketing Features */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">마케팅 기능</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketingFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Campaign Types */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">캠페인 유형</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {campaignTypes.map((campaign, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mx-auto mb-4 text-orange-600">
                    {campaign.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{campaign.title}</h4>
                  <p className="text-sm text-gray-600">{campaign.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">성공 사례</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{story.name}</CardTitle>
                    <span className="text-xs text-gray-500">{story.period}</span>
                  </div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
                    {story.improvement}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-2">
                    <span className="text-4xl text-orange-300">"</span>
                    <p className="text-gray-700 italic">{story.quote}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">이용 방법</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '플랫폼 가입', desc: '간단한 정보 입력으로 시작' },
              { step: '2', title: '캠페인 설정', desc: '타겟과 예산 설정' },
              { step: '3', title: '자동 운영', desc: 'AI가 자동으로 최적화' },
              { step: '4', title: '성과 분석', desc: '실시간 데이터 확인' }
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-600 to-pink-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Info */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">마케팅 패키지 요금제</CardTitle>
            <CardDescription>학원 규모에 맞는 최적의 플랜을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-xl mb-2">베이직</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">₩99,000<span className="text-sm font-normal text-gray-500">/월</span></div>
                <ul className="space-y-2 mb-6">
                  {['소셜미디어 관리', '기본 분석 리포트', '월 10회 자동 포스팅', '이메일 지원'].map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">선택하기</Button>
              </div>

              <div className="border-2 border-orange-500 rounded-lg p-6 hover:shadow-lg transition-shadow relative">
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                  인기
                </div>
                <h4 className="font-bold text-xl mb-2">프로</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">₩249,000<span className="text-sm font-normal text-gray-500">/월</span></div>
                <ul className="space-y-2 mb-6">
                  {['베이직 기능 모두 포함', '고급 분석 & AI 추천', '무제한 자동 포스팅', '타겟 광고 관리', '전화 지원'].map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-orange-600 to-pink-600">선택하기</Button>
              </div>

              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-xl mb-2">엔터프라이즈</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">맞춤형</div>
                <ul className="space-y-2 mb-6">
                  {['프로 기능 모두 포함', '전담 마케팅 매니저', '맞춤형 전략 수립', '무제한 광고 예산', '24/7 우선 지원'].map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">문의하기</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-orange-600 to-pink-600 text-white border-none">
          <CardContent className="py-12 text-center">
            <Zap className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">지금 시작하고 학생 수를 늘리세요</h3>
            <p className="text-xl mb-8 opacity-90">
              첫 달 50% 할인 혜택을 놓치지 마세요
            </p>
            <div className="flex justify-center gap-4">
              <Link href="https://superplace-academy.pages.dev" target="_blank">
                <Button size="lg" variant="secondary">
                  <Zap className="h-5 w-5 mr-2" />
                  무료로 시작하기
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  전문가 상담 신청
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
