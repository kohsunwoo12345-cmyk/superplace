'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Award, TrendingUp, Target, Heart, Zap, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: '학생 중심',
      description: '학생들의 성장과 발전을 최우선으로 생각합니다'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: '혁신적 기술',
      description: 'AI와 최신 기술로 학습 효율을 극대화합니다'
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: '신뢰와 안전',
      description: '안전하고 믿을 수 있는 학습 환경을 제공합니다'
    },
    {
      icon: <Target className="h-8 w-8 text-green-500" />,
      title: '맞춤형 교육',
      description: '개인별 학습 수준에 맞는 최적의 교육을 제공합니다'
    }
  ];

  const milestones = [
    { year: '2024.01', title: 'SUPER PLACE 설립', description: '스마트 학습 관리 시스템 개발 시작' },
    { year: '2024.03', title: 'AI 학습 분석 시스템 출시', description: '학생 맞춤형 AI 분석 기능 도입' },
    { year: '2024.06', title: '학원 50곳 돌파', description: '전국 50개 학원에서 사용 중' },
    { year: '2024.09', title: '24시간 AI 튜터 서비스 론칭', description: '언제든지 질문하고 답변받는 시스템 구축' },
    { year: '2024.12', title: '학생 10,000명 돌파', description: '누적 학생 수 1만 명 달성' },
    { year: '2025.02', title: 'AI 쇼핑몰 오픈', description: '다양한 AI 교육 솔루션 제공 시작' }
  ];

  const team = [
    { role: 'CEO', name: '대표이사', description: '20년 경력의 교육 전문가' },
    { role: 'CTO', name: '기술이사', description: 'AI 및 빅데이터 전문가' },
    { role: '교육연구팀', name: '5명', description: '교육 과정 및 콘텐츠 개발' },
    { role: '개발팀', name: '8명', description: '플랫폼 개발 및 유지보수' },
    { role: '디자인팀', name: '3명', description: 'UX/UI 디자인 및 기획' },
    { role: '고객지원팀', name: '4명', description: '24시간 고객 지원 서비스' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">회사 소개</h1>
                <p className="text-sm text-gray-500">SUPER PLACE에 대해 알아보세요</p>
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
            미래를 만드는 스마트 교육 플랫폼
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SUPER PLACE는 AI 기술을 활용하여 학생, 학부모, 학원이 함께 성장하는 
            차세대 교육 플랫폼입니다.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">128+</div>
              <p className="text-gray-600">제휴 학원</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
              <p className="text-gray-600">활성 학생</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <p className="text-gray-600">선생님</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
              <p className="text-gray-600">만족도</p>
            </CardContent>
          </Card>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                미션
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                모든 학생이 자신의 잠재력을 최대한 발휘할 수 있도록 
                <span className="font-semibold text-blue-600"> AI 기반 맞춤형 학습 환경</span>을 제공하고, 
                학원과 선생님들이 더 효율적으로 학생을 관리할 수 있도록 돕습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                비전
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                대한민국 최고의 교육 플랫폼을 넘어 
                <span className="font-semibold text-purple-600"> 글로벌 에듀테크 리더</span>로 성장하여 
                전 세계 학생들에게 혁신적인 학습 경험을 제공합니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">핵심 가치</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h4 className="text-xl font-bold mb-2">{value.title}</h4>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">주요 연혁</h3>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-bold text-gray-900">{milestone.title}</h4>
                        <span className="text-sm font-medium text-blue-600">{milestone.year}</span>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">우리 팀</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle>{member.role}</CardTitle>
                  <CardDescription>{member.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              회사 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">회사명</p>
                <p className="font-medium text-gray-900">SUPER PLACE</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">사업자등록번호</p>
                <p className="font-medium text-gray-900">142-88-02445</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">주소</p>
                <p className="font-medium text-gray-900">인천광역시 서구 청라커낼로 270, 2층</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">대표 전화</p>
                <p className="font-medium text-gray-900">010-8739-9697</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">이메일</p>
                <p className="font-medium text-gray-900">wangholy1@naver.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">설립일</p>
                <p className="font-medium text-gray-900">2024년 1월</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-none">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">함께 성장하고 싶으신가요?</h3>
              <p className="text-gray-600 mb-6">SUPER PLACE와 함께 교육의 미래를 만들어가세요</p>
              <div className="flex justify-center gap-4">
                <Link href="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    문의하기
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline">
                    무료 체험 시작
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
