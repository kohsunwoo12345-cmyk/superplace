'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Book, Video, FileText, Search, ChevronDown, ChevronRight, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: 'getting-started',
      title: '시작하기',
      icon: <Book className="h-6 w-6" />,
      color: 'text-blue-600',
      articles: [
        { title: '회원가입 방법', content: '회원가입은 간단합니다. 홈페이지 상단의 "회원가입" 버튼을 클릭하고, 이메일, 이름, 비밀번호를 입력하세요.' },
        { title: '첫 로그인 가이드', content: '등록한 이메일과 비밀번호로 로그인하면, 역할에 맞는 대시보드로 자동 이동합니다.' },
        { title: '프로필 설정하기', content: '대시보드에서 프로필 아이콘을 클릭하여 개인정보와 학습 설정을 변경할 수 있습니다.' },
        { title: '무료 체험 시작하기', content: '14일 무료 체험을 통해 모든 기능을 사용해볼 수 있습니다.' }
      ]
    },
    {
      id: 'student',
      title: '학생 기능',
      icon: <Book className="h-6 w-6" />,
      color: 'text-green-600',
      articles: [
        { title: '학습 자료 이용하기', content: '디지털 학습 자료 페이지에서 과목별 자료를 확인하고 다운로드할 수 있습니다.' },
        { title: '진도 확인하기', content: '학습 진도 관리 페이지에서 내 학습 현황을 실시간으로 확인하세요.' },
        { title: '숙제 제출하기', content: '숙제 페이지에서 파일을 업로드하거나 텍스트로 작성하여 제출할 수 있습니다.' },
        { title: 'AI 튜터 사용하기', content: '24시간 AI 튜터에게 언제든 질문하고 즉시 답변을 받을 수 있습니다.' },
        { title: '출석 체크하기', content: '출석 체크 페이지에서 QR 코드를 스캔하거나 코드를 입력하여 출석할 수 있습니다.' }
      ]
    },
    {
      id: 'teacher',
      title: '선생님 기능',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-purple-600',
      articles: [
        { title: '학생 관리하기', content: '학생 목록에서 출석, 성적, 학습 진도를 한눈에 확인하고 관리할 수 있습니다.' },
        { title: '숙제 관리하기', content: '숙제를 생성하고, 학생들의 제출 현황을 확인하며, AI 채점을 활용할 수 있습니다.' },
        { title: 'AI 채점 활용하기', content: 'AI가 자동으로 숙제를 채점하고 피드백을 제공합니다. 필요시 수정도 가능합니다.' },
        { title: '출석 관리하기', content: 'QR 코드나 출석 코드를 생성하여 학생들의 출석을 간편하게 관리하세요.' },
        { title: '성적 분석하기', content: '학생별, 과목별 성적을 분석하고 리포트를 생성할 수 있습니다.' }
      ]
    },
    {
      id: 'director',
      title: '학원장 기능',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-orange-600',
      articles: [
        { title: '학원 통계 보기', content: '대시보드에서 학생 수, 출석률, 숙제 제출률 등 전체 통계를 확인하세요.' },
        { title: '선생님 관리하기', content: '선생님을 초대하고, 권한을 설정하며, 활동을 모니터링할 수 있습니다.' },
        { title: 'AI 쇼핑몰 이용하기', content: '다양한 AI 교육 솔루션을 구매하여 학원에 적용할 수 있습니다.' },
        { title: '요금제 관리하기', content: '현재 구독 중인 요금제를 확인하고, 필요시 업그레이드할 수 있습니다.' },
        { title: '학생별 분석 보기', content: '개별 학습 관리에서 각 학생의 학습 현황을 상세히 분석할 수 있습니다.' },
        { title: 'AI 개념 분석하기', content: '전체 학생들의 취약 개념을 AI가 자동으로 분석하여 보여줍니다.' }
      ]
    },
    {
      id: 'subscription',
      title: '요금제 및 결제',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-red-600',
      articles: [
        { title: '요금제 종류', content: 'Free, Starter, Pro, Enterprise 총 4가지 요금제가 있습니다. 각각 학생 수, 기능 제한이 다릅니다.' },
        { title: '결제 방법', content: '계좌이체와 카드 결제를 지원합니다. 계좌이체 시 하나은행 746-910023-17004로 입금하세요.' },
        { title: '요금제 변경하기', content: '요금제 페이지에서 원하는 플랜을 선택하고 업그레이드할 수 있습니다.' },
        { title: '환불 정책', content: '구독 후 7일 이내 전액 환불이 가능합니다. 그 이후는 비례 환불이 적용됩니다.' },
        { title: '자동 갱신', content: '구독 기간이 만료되면 자동으로 갱신됩니다. 설정에서 자동 갱신을 끌 수 있습니다.' }
      ]
    },
    {
      id: 'troubleshooting',
      title: '문제 해결',
      icon: <HelpCircle className="h-6 w-6" />,
      color: 'text-gray-600',
      articles: [
        { title: '로그인이 안 돼요', content: '비밀번호를 확인하고, "비밀번호 찾기"를 통해 재설정하세요. 문제가 계속되면 고객센터에 문의하세요.' },
        { title: '파일 업로드가 안 돼요', content: '파일 크기는 최대 10MB까지 가능합니다. 지원 형식은 PDF, JPG, PNG, DOCX입니다.' },
        { title: '출석 체크가 안 돼요', content: 'QR 코드가 제대로 스캔되는지, 코드가 만료되지 않았는지 확인하세요.' },
        { title: '성적이 반영이 안 돼요', content: '선생님이 성적을 입력하고 저장해야 반영됩니다. 최대 1시간 정도 소요될 수 있습니다.' },
        { title: 'AI 튜터가 응답하지 않아요', content: '인터넷 연결을 확인하고 페이지를 새로고침하세요. 문제가 계속되면 고객센터에 문의하세요.' }
      ]
    }
  ];

  const quickLinks = [
    { title: '회원가입', icon: '👤', href: '/register' },
    { title: '요금제', icon: '💳', href: '/pricing' },
    { title: '문의하기', icon: '📞', href: '/contact' },
    { title: '회사 소개', icon: '🏢', href: '/about' }
  ];

  const videos = [
    { title: '플랫폼 소개 영상', duration: '3:24', thumbnail: '🎬' },
    { title: '학생 가이드', duration: '5:12', thumbnail: '📚' },
    { title: '선생님 가이드', duration: '7:45', thumbnail: '👨‍🏫' },
    { title: '학원장 가이드', duration: '6:30', thumbnail: '💼' }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    articles: category.articles.filter(
      article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">도움말 센터</h1>
                <p className="text-sm text-gray-500">필요한 정보를 빠르게 찾아보세요</p>
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
        {/* Search Bar */}
        <div className="mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색어를 입력하세요... (예: 회원가입, 숙제 제출)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Link key={index} href={link.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-2">{link.icon}</div>
                  <p className="font-medium text-gray-900">{link.title}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {searchTerm ? '검색 결과' : '카테고리별 도움말'}
            </h2>
            
            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-2">다른 검색어로 시도해보세요.</p>
                </CardContent>
              </Card>
            ) : (
              filteredCategories.map(category => (
                <Card key={category.id}>
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={category.color}>{category.icon}</div>
                        <div>
                          <CardTitle>{category.title}</CardTitle>
                          <CardDescription>{category.articles.length}개 항목</CardDescription>
                        </div>
                      </div>
                      {expandedCategory === category.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedCategory === category.id && (
                    <CardContent>
                      <div className="space-y-4">
                        {category.articles.map((article, idx) => (
                          <div key={idx} className="border-l-4 border-gray-200 pl-4 hover:border-purple-500 transition-colors">
                            <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                            <p className="text-sm text-gray-600">{article.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2 text-purple-600" />
                  비디오 가이드
                </CardTitle>
                <CardDescription>동영상으로 쉽게 배우기</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{video.thumbnail}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{video.title}</p>
                          <p className="text-xs text-gray-500">{video.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                  추가 도움이 필요하신가요?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  찾으시는 답변이 없으신가요? 고객지원팀이 도와드리겠습니다.
                </p>
                <Link href="/contact">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    문의하기
                  </Button>
                </Link>
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">전화 문의</p>
                  <p className="font-medium text-gray-900">010-8739-9697</p>
                  <p className="text-xs text-gray-500 mt-1">평일 09:00 - 18:00</p>
                </div>
              </CardContent>
            </Card>

            {/* Popular Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                  인기 도움말
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    '회원가입 방법',
                    '숙제 제출하기',
                    'AI 튜터 사용하기',
                    '요금제 변경하기',
                    '학생 관리하기'
                  ].map((title, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-gray-700 hover:text-purple-600 cursor-pointer py-1"
                    >
                      {idx + 1}. {title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
