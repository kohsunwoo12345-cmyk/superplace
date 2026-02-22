"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, ExternalLink, ArrowRight, BookOpen, 
  CheckCircle, HelpCircle, Megaphone, ShoppingBag, Wrench,
  ChevronRight, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function KakaoBusinessGuidePage() {
  const router = useRouter();

  const guideSteps = [
    {
      step: 1,
      title: "카카오 계정을 만드는 방법을 알아보세요",
      link: "https://kakaobusiness.gitbook.io/main/undefined/untitled",
      icon: "👤"
    },
    {
      step: 2,
      title: "카카오톡 비즈니스 채널을 만들어보세요",
      link: "https://kakaobusiness.gitbook.io/main/channel/start",
      icon: "💬"
    },
    {
      step: 3,
      title: "광고를 연결하여 더 많은 사용자에게 도달해보세요",
      link: "https://kakaobusiness.gitbook.io/main/broken-reference",
      icon: "📢"
    }
  ];

  const channelGuides = [
    {
      title: "채널 소개",
      description: "카카오톡 채널의 기본 개념과 주요 기능을 알아보세요",
      link: "https://kakaobusiness.gitbook.io/main/channel/info",
      icon: <MessageCircle className="w-6 h-6 text-yellow-600" />
    },
    {
      title: "채널 시작하기",
      description: "카카오톡 채널을 생성하고 설정하는 방법",
      link: "https://kakaobusiness.gitbook.io/main/channel/start",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />
    },
    {
      title: "자주 묻는 질문",
      description: "카카오톡 채널 관련 FAQ",
      link: "https://kakaobusiness.gitbook.io/main/channel/faq",
      icon: <HelpCircle className="w-6 h-6 text-blue-600" />
    }
  ];

  const adGuides = [
    {
      title: "카카오모먼트",
      link: "https://kakaobusiness.gitbook.io/main/ad/moment"
    },
    {
      title: "키워드광고",
      link: "https://kakaobusiness.gitbook.io/main/ad/searchad"
    },
    {
      title: "쇼핑광고",
      link: "https://kakaobusiness.gitbook.io/main/ad/shopping-ad"
    },
    {
      title: "기타 광고",
      link: "https://kakaobusiness.gitbook.io/main/ad/other-ad"
    }
  ];

  const serviceTools = [
    {
      title: "카카오싱크",
      description: "통합 회원 관리 서비스",
      link: "https://kakaobusiness.gitbook.io/main/tool/kakaosync"
    },
    {
      title: "톡체크아웃",
      description: "간편한 결제 솔루션",
      link: "https://kakaobusiness.gitbook.io/main/tool/checkout"
    },
    {
      title: "예약하기",
      description: "예약 관리 시스템",
      link: "https://kakaobusiness.gitbook.io/main/tool/booking"
    },
    {
      title: "주문하기",
      description: "배달/주문 서비스",
      link: "https://kakaobusiness.gitbook.io/main/tool/order"
    },
    {
      title: "비즈니스폼",
      description: "설문 및 폼 작성 도구",
      link: "https://kakaobusiness.gitbook.io/main/tool/bizform"
    },
    {
      title: "비즈플러그인",
      description: "웹사이트 연동 플러그인",
      link: "https://kakaobusiness.gitbook.io/main/tool/bizplugin"
    },
    {
      title: "픽셀 & SDK",
      description: "추적 및 분석 도구",
      link: "https://kakaobusiness.gitbook.io/main/tool/pixel-sdk"
    }
  ];

  const contactChannels = [
    {
      title: "카카오톡 채널 관리자센터",
      link: "https://cs.kakao.com/requests?service=102&locale=ko"
    },
    {
      title: "카카오모먼트 관리자센터",
      link: "https://cs.kakao.com/requests?service=110&locale=ko"
    },
    {
      title: "키워드 광고",
      link: "https://cs.kakao.com/requests?service=186&locale=ko"
    },
    {
      title: "카카오싱크",
      link: "https://cs.kakao.com/helps?service=143"
    },
    {
      title: "톡체크아웃 파트너센터",
      link: "https://cs.kakao.com/helps?service=174"
    },
    {
      title: "카카오톡 주문하기",
      link: "https://cs.kakao.com/helps?service=95"
    },
    {
      title: "비즈니스폼",
      link: "https://cs.kakao.com/helps?service=127&category=563&locale=ko"
    },
    {
      title: "비즈플러그인",
      link: "https://cs.kakao.com/helps?service=127&category=572&locale=ko"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">카카오비즈니스 가이드</h1>
                <p className="text-gray-600 mt-1">
                  카카오에서 비즈니스를 시작하고 성공하기 위한 완벽한 가이드
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="h-12 px-6"
            >
              ← 돌아가기
            </Button>
          </div>

          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    카카오에서 처음 비즈니스를 시작하더라도 쉽게 따라할 수 있고, 
                    궁금한 점이 있을 때는 빠르게 해결할 수 있도록 유용한 가이드와 
                    자주 묻는 질문을 모아두었습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 카카오 비즈니스가 처음이신가요? */}
        <Card className="mb-8 shadow-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b-2 border-yellow-200">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-yellow-600" />
              💼 카카오 비즈니스가 처음이신가요?
            </CardTitle>
            <CardDescription className="text-base mt-2">
              카카오비즈니스의 모든 것을 알려드립니다. 아래 공식 가이드를 참고하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <a 
              href="https://kakaobusiness.gitbook.io/main" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <div className="p-6 bg-white rounded-lg border-2 border-yellow-300 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-yellow-100 rounded-lg">
                      <BookOpen className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                        카카오비즈니스 공식 가이드
                      </h3>
                      <p className="text-gray-600 mt-1">
                        시작부터 활용까지 모든 것을 담은 완벽한 가이드북
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-6 h-6 text-yellow-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* 비즈니스 성공의 첫 단계 */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              🎯 비즈니스 성공의 첫 단계
            </CardTitle>
            <CardDescription className="text-base mt-2">
              카카오비즈니스를 시작하기 위한 3단계 가이드
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {guideSteps.map((guide, index) => (
                <a
                  key={index}
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                          {guide.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-blue-600">STEP {guide.step}</Badge>
                          </div>
                          <p className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                            {guide.title}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 카카오톡 채널 */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-green-50 border-b">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-7 h-7 text-yellow-600" />
              <CardTitle className="text-2xl">💬 카카오톡 채널</CardTitle>
            </div>
            <CardDescription className="text-base">
              카카오톡 채널은 고객과 커뮤니케이션을 하는 카카오톡 내 비즈니스 홈입니다.
              <br />
              <a 
                href="https://center-pf.kakao.com/profiles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-600 hover:underline font-semibold"
              >
                카카오톡 채널 관리자센터
              </a>
              에서 손쉽게 당신의 비즈니스 홈을 만들고, 활용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              {channelGuides.map((guide, index) => (
                <a
                  key={index}
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full border-2 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        {guide.icon}
                        <CardTitle className="text-lg group-hover:text-yellow-600 transition-colors">
                          {guide.title}
                        </CardTitle>
                      </div>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-yellow-600 font-semibold">
                        자세히 보기 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 광고 */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-7 h-7 text-purple-600" />
              <CardTitle className="text-2xl">📢 광고</CardTitle>
            </div>
            <CardDescription className="text-base">
              <a 
                href="https://moment.kakao.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline font-semibold"
              >
                카카오모먼트
              </a>
              와 
              <a 
                href="https://keywordad.kakao.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline font-semibold ml-1"
              >
                카카오 키워드광고
              </a>
              에서 다양한 형태의 광고를 집행할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adGuides.map((guide, index) => (
                <a
                  key={index}
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {guide.title}
                      </span>
                      <ExternalLink className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 서비스 및 비즈도구 */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-7 h-7 text-green-600" />
              <CardTitle className="text-2xl">🛠️ 서비스 및 비즈도구</CardTitle>
            </div>
            <CardDescription className="text-base">
              쇼핑, 배달주문, 상품구독 등 내 비즈니스에 최적화된 서비스와 
              실질적 성과 상승을 돕는 다양한 비즈도구들을 쉽고 편리하게 사용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTools.map((tool, index) => (
                <a
                  key={index}
                  href={tool.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full border-2 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-green-600 transition-colors flex items-center justify-between">
                        {tool.title}
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 고객센터 문의 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-7 h-7 text-blue-600" />
              <CardTitle className="text-2xl">🤔 카카오비즈니스 활용 중 궁금한 점이 있으신가요?</CardTitle>
            </div>
            <CardDescription className="text-base">
              카카오톡 채널 혹은 고객센터를 통해 문의하실 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* 카카오톡 채널 상담 */}
            <div className="mb-6 p-5 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-yellow-600" />
                📱 채널 문의
              </h3>
              <p className="text-gray-700 mb-3">
                <a 
                  href="http://pf.kakao.com/_WekxcC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:underline font-semibold"
                >
                  카카오비즈니스 채널
                </a>
                을 추가하시면 카카오톡으로 채팅 상담을 시작하실 수 있습니다.
                <br />
                모바일에서 편리하게 묻고 빠르게 답변을 받아보세요.
              </p>
              <p className="text-sm text-gray-600">
                ⏰ 운영 시간: 평일 오전 9시 ~ 오후 6시 (주말 및 공휴일 제외)
              </p>
            </div>

            {/* 고객센터 문의 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                💬 고객센터 문의
              </h3>
              <p className="text-gray-700 mb-4">
                카카오 고객센터에서 문의사항을 남겨주시면, 이메일로 답변해드립니다.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {contactChannels.map((contact, index) => (
                  <a
                    key={index}
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {contact.title}
                        </span>
                        <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 안내 */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-2">
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-4">
                더 자세한 정보는 카카오비즈니스 공식 가이드를 참고해주세요.
              </p>
              <a 
                href="https://kakaobusiness.gitbook.io/main" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  <BookOpen className="w-5 h-5 mr-2" />
                  카카오비즈니스 공식 가이드 방문하기
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
