'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  BarChart3, 
  Brain, 
  Clock, 
  Users, 
  Award, 
  Target,
  Zap,
  Shield,
  CheckCircle,
  ArrowLeft,
  TrendingUp,
  MessageCircle,
  FileText,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const studentFeatures = [
    {
      icon: <BookOpen className="h-10 w-10 text-blue-600" />,
      title: '디지털 학습 자료',
      description: '언제 어디서나 접근 가능한 체계적인 학습 콘텐츠',
      benefits: [
        '과목별 정리된 학습 자료',
        '다운로드 및 오프라인 학습',
        '최신 자료 자동 업데이트',
        '개인 맞춤 추천 자료'
      ],
      link: '/student/materials'
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-green-600" />,
      title: '학습 진도 관리',
      description: '실시간으로 확인하는 나의 학습 진행 상황',
      benefits: [
        '과목별 진도율 확인',
        '학습 목표 설정 및 추적',
        '시각화된 진도 그래프',
        '주간/월간 학습 리포트'
      ],
      link: '/student/progress'
    },
    {
      icon: <Brain className="h-10 w-10 text-purple-600" />,
      title: 'AI 부족한 개념 분석',
      description: 'AI가 자동으로 취약 개념을 분석하고 보완',
      benefits: [
        '자동 취약점 분석',
        '맞춤형 보완 학습 추천',
        '개념 이해도 측정',
        '반복 학습 스케줄링'
      ],
      link: '/student/ai-analysis'
    },
    {
      icon: <Target className="h-10 w-10 text-orange-600" />,
      title: '개별 학습 관리',
      description: '나만의 맞춤형 학습 계획과 관리',
      benefits: [
        '개인별 학습 계획 수립',
        '출석 및 과제 관리',
        '성적 추이 분석',
        '학습 시간 추적'
      ],
      link: '/student/personalized'
    },
    {
      icon: <Clock className="h-10 w-10 text-red-600" />,
      title: '24시간 AI 튜터',
      description: '언제든지 질문하고 답변받는 AI 학습 도우미',
      benefits: [
        '24시간 실시간 질의응답',
        '즉각적인 문제 해결',
        '대화형 학습 지원',
        '학습 기록 자동 저장'
      ],
      link: '/student/tutor'
    },
    {
      icon: <FileText className="h-10 w-10 text-indigo-600" />,
      title: '과제 제출 시스템',
      description: '온라인으로 간편하게 과제 제출 및 피드백',
      benefits: [
        '파일 업로드 제출',
        '제출 기한 알림',
        'AI 자동 채점',
        '선생님 피드백 확인'
      ],
      link: '/homework-check'
    }
  ];

  const teacherFeatures = [
    {
      icon: <Users className="h-10 w-10 text-blue-600" />,
      title: '학생 관리',
      description: '효율적인 학생 정보 및 학습 현황 관리',
      benefits: [
        '학생 정보 통합 관리',
        '출석 및 성적 추적',
        '학부모 소통 기능',
        '개별 학습 분석'
      ]
    },
    {
      icon: <FileText className="h-10 w-10 text-green-600" />,
      title: '숙제 관리',
      description: '과제 생성부터 채점까지 원스톱',
      benefits: [
        '간편한 숙제 생성',
        '제출 현황 실시간 확인',
        'AI 자동 채점',
        '피드백 일괄 전송'
      ]
    },
    {
      icon: <Brain className="h-10 w-10 text-purple-600" />,
      title: 'AI 채점 시스템',
      description: '자동 채점으로 업무 시간 절약',
      benefits: [
        '즉시 자동 채점',
        '정확한 평가 기준',
        '수정 및 보완 가능',
        '채점 이력 저장'
      ]
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-orange-600" />,
      title: '성적 분석',
      description: '데이터 기반 학생 성적 분석',
      benefits: [
        '과목별 성적 분석',
        '학생별 추이 확인',
        '리포트 자동 생성',
        '취약점 파악'
      ]
    },
    {
      icon: <Calendar className="h-10 w-10 text-red-600" />,
      title: '출석 관리',
      description: 'QR 코드로 간편한 출석 체크',
      benefits: [
        'QR 코드 출석',
        '실시간 출석 현황',
        '결석 알림 자동 발송',
        '출석률 통계'
      ]
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-indigo-600" />,
      title: '학부모 소통',
      description: '효과적인 학부모 커뮤니케이션',
      benefits: [
        '학습 리포트 자동 발송',
        '공지사항 전달',
        '1:1 상담 기능',
        '알림 맞춤 설정'
      ]
    }
  ];

  const directorFeatures = [
    {
      icon: <TrendingUp className="h-10 w-10 text-blue-600" />,
      title: '학원 통계 대시보드',
      description: '학원 운영 현황을 한눈에',
      benefits: [
        '실시간 학원 통계',
        '출석률 및 성적 분석',
        '매출 현황 확인',
        '트렌드 분석'
      ]
    },
    {
      icon: <Users className="h-10 w-10 text-green-600" />,
      title: '선생님 관리',
      description: '효율적인 교직원 관리 시스템',
      benefits: [
        '선생님 초대 및 권한 설정',
        '업무 배정 및 추적',
        '성과 모니터링',
        '급여 관리 연동'
      ]
    },
    {
      icon: <Brain className="h-10 w-10 text-purple-600" />,
      title: 'AI 개념 분석',
      description: '전체 학생의 취약 개념 파악',
      benefits: [
        '학생별 취약점 분석',
        '개념별 이해도 통계',
        '보완 수업 추천',
        '학습 효율 개선'
      ],
      link: '/director/ai-concept-analysis'
    },
    {
      icon: <Target className="h-10 w-10 text-orange-600" />,
      title: '개별 학습 관리',
      description: '학생별 맞춤 관리 및 분석',
      benefits: [
        '학생별 상세 정보',
        '학습 패턴 분석',
        '맞춤 학습 계획',
        '학부모 리포트'
      ],
      link: '/director/student-management'
    },
    {
      icon: <Zap className="h-10 w-10 text-red-600" />,
      title: 'AI 쇼핑몰',
      description: 'AI 교육 솔루션 통합 마켓',
      benefits: [
        '다양한 AI 교육 도구',
        '과목별 솔루션',
        '간편한 구매 및 적용',
        '정기 업데이트'
      ],
      link: '/director/ai-shop'
    },
    {
      icon: <Clock className="h-10 w-10 text-indigo-600" />,
      title: '24시간 AI 튜터',
      description: '학생들을 위한 상시 학습 지원',
      benefits: [
        '학생 질문 자동 응답',
        '대화 내역 모니터링',
        '만족도 분석',
        '비용 효율적'
      ],
      link: '/director/tutor-24'
    }
  ];

  const platformBenefits = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: '빠른 속도',
      description: '클라우드 기반으로 언제나 빠른 응답'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: '안전한 보안',
      description: '암호화된 데이터 저장 및 전송'
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: 'AI 기술',
      description: '최신 AI로 학습 효율 극대화'
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: '24/7 지원',
      description: '연중무휴 고객 지원 서비스'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">기능 소개</h1>
                <p className="text-sm text-gray-500">SUPER PLACE의 모든 기능을 확인하세요</p>
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
            모든 학습 과정을 하나의 플랫폼에서
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            학생, 선생님, 학원장 모두를 위한 통합 교육 관리 시스템
          </p>
        </div>

        {/* Platform Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {platformBenefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">{benefit.icon}</div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">학생을 위한 기능</h3>
            <p className="text-gray-600">자기주도 학습을 위한 스마트 도구</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  {feature.link && (
                    <Link href={feature.link}>
                      <Button variant="outline" className="w-full">
                        자세히 보기
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Teacher Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">선생님을 위한 기능</h3>
            <p className="text-gray-600">효율적인 학생 관리와 수업 진행</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
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

        {/* Director Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">학원장을 위한 기능</h3>
            <p className="text-gray-600">통합 학원 운영 및 관리 시스템</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {directorFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  {feature.link && (
                    <Link href={feature.link}>
                      <Button variant="outline" className="w-full">
                        자세히 보기
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardContent className="py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h3>
            <p className="text-xl mb-8 opacity-90">
              14일 무료 체험으로 모든 기능을 사용해보세요
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  무료 체험 시작
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  요금제 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
