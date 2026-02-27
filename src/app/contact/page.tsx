'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: '일반 문의'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 API를 통해 문의를 전송해야 합니다
    console.log('문의 내용:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: '일반 문의'
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: '전화 문의',
      content: '010-8739-9697',
      description: '평일 09:00 - 18:00'
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: '이메일',
      content: 'wangholy1@naver.com',
      description: '24시간 접수 가능'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: '주소',
      content: '인천광역시 서구 청라커낼로 270, 2층',
      description: '주차 가능'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: '운영 시간',
      content: '평일 09:00 - 18:00',
      description: '주말 및 공휴일 휴무'
    }
  ];

  const faqCategories = [
    {
      category: '서비스 이용',
      questions: [
        { q: '회원가입은 어떻게 하나요?', a: '홈페이지 상단의 회원가입 버튼을 클릭하여 간단한 정보 입력 후 가입할 수 있습니다.' },
        { q: '무료 체험이 가능한가요?', a: '네, 14일 무료 체험이 가능합니다. 회원가입 후 바로 이용하실 수 있습니다.' }
      ]
    },
    {
      category: '요금제',
      questions: [
        { q: '요금제는 어떻게 되나요?', a: 'Free, Starter, Pro, Enterprise 총 4가지 요금제가 있습니다. 자세한 내용은 요금제 페이지를 참고해주세요.' },
        { q: '결제 방법은 무엇이 있나요?', a: '계좌이체와 카드 결제를 지원합니다.' }
      ]
    },
    {
      category: '기술 지원',
      questions: [
        { q: '시스템 오류가 발생했어요', a: '고객지원팀(010-8739-9697)으로 연락주시면 즉시 해결해드립니다.' },
        { q: '데이터 백업은 어떻게 되나요?', a: '모든 데이터는 클라우드에 자동으로 백업되며, 언제든지 복구 가능합니다.' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">문의하기</h1>
                <p className="text-sm text-gray-500">궁금하신 점을 문의해주세요</p>
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
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
                    {info.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                  <p className="font-medium text-gray-700 mb-1">{info.content}</p>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">문의 양식</CardTitle>
              <CardDescription>
                문의 내용을 작성해주시면 빠르게 답변드리겠습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">문의가 접수되었습니다!</h3>
                  <p className="text-gray-600">빠른 시일 내에 답변드리겠습니다.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      문의 유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="일반 문의">일반 문의</option>
                      <option value="기술 지원">기술 지원</option>
                      <option value="요금제 문의">요금제 문의</option>
                      <option value="제휴 문의">제휴 문의</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="홍길동"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="example@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="문의 제목을 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      문의 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="문의 내용을 상세히 입력해주세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-blue-600">
                    <Send className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">자주 묻는 질문</CardTitle>
                <CardDescription>
                  빠른 답변이 필요하신가요? FAQ를 확인해보세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqCategories.map((category, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                      <div className="h-6 w-1 bg-green-500 mr-2"></div>
                      {category.category}
                    </h3>
                    <div className="space-y-3 ml-3">
                      {category.questions.map((item, qIdx) => (
                        <div key={qIdx} className="border-l-2 border-gray-200 pl-4">
                          <p className="font-medium text-gray-900 mb-1">Q. {item.q}</p>
                          <p className="text-sm text-gray-600">A. {item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4">빠른 상담이 필요하신가요?</h3>
                <div className="space-y-3">
                  <a
                    href="tel:010-8739-9697"
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">전화 상담</p>
                      <p className="text-sm text-gray-600">010-8739-9697</p>
                    </div>
                  </a>
                  <a
                    href="mailto:wangholy1@naver.com"
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">이메일 문의</p>
                      <p className="text-sm text-gray-600">wangholy1@naver.com</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section (Optional - 실제 지도 API 연동 필요) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-green-600" />
              오시는 길
            </CardTitle>
            <CardDescription>인천광역시 서구 청라커낼로 270, 2층</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">지도 API 연동 예정</p>
                <p className="text-sm text-gray-400 mt-2">
                  인천광역시 서구 청라커낼로 270, 2층
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
