import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  Mail, 
  Phone, 
  MapPin,
  Award,
  Users,
  Target,
  TrendingUp
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SUPER PLACE</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              회사 소개
            </Link>
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/register">
              <Button>무료 시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            SUPER PLACE
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            실제 교육 현장에서 검증된 마케팅 노하우로<br />
            학원과 교육업체의 성장을 돕는 통합 마케팅 플랫폼
          </p>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">20년+</div>
              <div className="text-gray-600">교육업 현장 경력</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">학원 컨설팅</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">6개</div>
              <div className="text-gray-600">플랫폼 통합 관리</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-gray-600">실전 검증 시스템</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">팀 소개</h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* CEO */}
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-blue-600 to-blue-800">
                <Image
                  src="https://page.gensparksite.com/v1/base64_upload/a675e819f3ce4c14ef6aa02c04b46da9"
                  alt="고희준 대표이사"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">고희준</h3>
                  <p className="text-primary font-semibold mb-4">대표이사 · 현직 학원장</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      인문학 석사 · 박사
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      학원 운영 20년 경력
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      전) 대학교수
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  대학교수를 거쳐 20년간 현장에서 직접 학원을 운영하며 쌓은 실전 노하우를 바탕으로 슈퍼플레이스를 설립했습니다. 
                  학부모 심리, 교육업계 트렌드, 지역별 특성을 깊이 이해하며, 이론과 실전을 겸비한 검증된 마케팅 시스템을 개발했습니다. 
                  현재도 꾸메땅학원을 직접 운영하며 현장의 생생한 노하우를 전국 학원장님들과 공유하고 있습니다.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    010-8739-9697
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    kohsunwoo12345@gmail.com
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    인천광역시 서구 청라커넬로 270, 2층
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marketing Director */}
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-blue-600 to-blue-800">
                <Image
                  src="https://page.gensparksite.com/v1/base64_upload/70ce8dd746a6170e3668f6315e9468dd"
                  alt="고선우 마케팅 팀장"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">고선우</h3>
                  <p className="text-primary font-semibold mb-4">마케팅 팀장 · 통합 마케팅 전문가</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      네이버 플레이스
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      블로그 SEO
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      메타 광고
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      인스타그램
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      당근 마케팅
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      퍼스널 브랜딩
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      랜딩페이지
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      콘텐츠 기획
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  디지털 마케팅의 모든 분야를 섭렵한 올라운드 플레이어입니다. 
                  네이버 플레이스·블로그 상위 노출부터 메타 광고, 인스타그램 자동화, 당근 비즈니스, 
                  원장 퍼스널 브랜딩, 랜딩페이지 제작, 학부모 설명회 기획, 콘텐츠 마케팅까지 
                  학원 성장에 필요한 모든 마케팅 전략을 실행할 수 있는 전문가입니다. 
                  데이터 기반의 체계적인 접근으로 실질적인 성과를 만들어냅니다.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    010-8532-8739
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    kohsunwoo12345@gmail.com
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    인천광역시 서구 청라커넬로 270, 2층
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Strengths */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">우리의 강점</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">현장 검증</h3>
              <p className="text-gray-600">
                실제 학원 운영 경험을 바탕으로 한 검증된 마케팅 시스템
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">전문가 팀</h3>
              <p className="text-gray-600">
                교육과 마케팅 분야의 전문가들이 함께 만드는 솔루션
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">맞춤형 전략</h3>
              <p className="text-gray-600">
                각 학원의 특성과 지역에 맞춘 최적화된 마케팅 전략
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">지속 성장</h3>
              <p className="text-gray-600">
                단기 성과가 아닌 지속 가능한 성장을 위한 시스템
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            SUPER PLACE와 함께 학원의 새로운 성장을 경험하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 text-white border-white hover:bg-white hover:text-blue-600">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-gray-50">
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
                <li><Link href="/about">회사 소개</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">지원</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#contact">문의</Link></li>
                <li><Link href="#faq">자주 묻는 질문</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">연락처</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>📞 010-8739-9697</li>
                <li>📧 kohsunwoo12345@gmail.com</li>
                <li>📍 인천광역시 서구 청라커넬로 270, 2층</li>
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
