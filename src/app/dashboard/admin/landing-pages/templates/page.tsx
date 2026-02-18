"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Calendar,
  Rocket,
  Users,
  Check,
  Eye,
} from "lucide-react";

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  previewUrl: string;
  icon: any;
  color: string;
  features: string[];
  data: {
    title: string;
    subtitle: string;
    description: string;
    template_type: string;
    input_data: any[];
    og_title: string;
    og_description: string;
    show_qr_code: boolean;
    qr_code_position: string;
  };
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "modern_academy",
    name: "모던 학원 소개",
    description: "세련되고 전문적인 학원 소개 페이지",
    category: "academy",
    thumbnail: "🎓",
    previewUrl: "/templates/preview/modern_academy",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    features: ["반응형 디자인", "비디오 배경", "애니메이션 효과", "SNS 연동"],
    data: {
      title: "새로운 학습의 시작, [학원명]",
      subtitle: "최고의 강사진과 함께하는 프리미엄 교육",
      description: "20년 전통의 명문 학원에서 여러분의 꿈을 이루세요. 1:1 맞춤 커리큘럼과 체계적인 학습 관리로 확실한 성적 향상을 보장합니다.",
      template_type: "custom",
      input_data: [
        { id: "1", type: "text", label: "학생 이름", placeholder: "홍길동", required: true, order: 0 },
        { id: "2", type: "phone", label: "학부모 연락처", placeholder: "010-1234-5678", required: true, order: 1 },
        { id: "3", type: "text", label: "학년", placeholder: "예: 중3, 고1", required: true, order: 2 },
        { id: "4", type: "text", label: "관심 과목", placeholder: "수학, 영어 등", required: false, order: 3 },
        { id: "5", type: "checkbox", label: "개인정보 수집 및 이용 동의", placeholder: "", required: true, order: 4 },
      ],
      og_title: "프리미엄 교육의 시작",
      og_description: "명문 학원과 함께 꿈을 이루세요",
      show_qr_code: true,
      qr_code_position: "bottom",
    },
  },
  {
    id: "student_success",
    name: "학생 성취 리포트",
    description: "학생의 성장과 발전을 보여주는 리포트 템플릿",
    category: "report",
    thumbnail: "📊",
    previewUrl: "/templates/preview/student_success",
    icon: Sparkles,
    color: "from-purple-500 to-pink-600",
    features: ["성적 그래프", "학습 분석", "선생님 코멘트", "목표 달성률"],
    data: {
      title: "🌟 [학생명] 학습 성취 리포트",
      subtitle: "이번 달 학습 성과를 확인하세요",
      description: "체계적인 학습 관리와 꾸준한 노력으로 놀라운 성장을 이루었습니다. 다음 목표를 향해 함께 나아가요!",
      template_type: "student_report",
      input_data: [
        { id: "1", type: "text", label: "학부모 성함", placeholder: "홍길동 학부모님", required: true, order: 0 },
        { id: "2", type: "email", label: "이메일", placeholder: "parent@example.com", required: false, order: 1 },
        { id: "3", type: "textarea", label: "궁금한 점이나 건의사항", placeholder: "자유롭게 작성해주세요", required: false, order: 2 },
      ],
      og_title: "학생 성취 리포트",
      og_description: "이번 달 학습 성과를 확인하세요",
      show_qr_code: false,
      qr_code_position: "top",
    },
  },
  {
    id: "event_seminar",
    name: "이벤트 & 세미나",
    description: "특별 이벤트와 세미나 안내 페이지",
    category: "event",
    thumbnail: "🎉",
    previewUrl: "/templates/preview/event_seminar",
    icon: Calendar,
    color: "from-orange-500 to-red-600",
    features: ["카운트다운 타이머", "좌석 현황", "조기신청 할인", "실시간 알림"],
    data: {
      title: "🎉 특별 입시설명회 초대",
      subtitle: "2026 대입 전략 완벽 분석",
      description: "대치동 입시 전문가가 직접 알려주는 합격 전략! 선착순 100명 한정 무료 참여. 참가자 전원에게 입시 가이드북 증정!",
      template_type: "event",
      input_data: [
        { id: "1", type: "text", label: "참가자 이름", placeholder: "홍길동", required: true, order: 0 },
        { id: "2", type: "phone", label: "연락처", placeholder: "010-1234-5678", required: true, order: 1 },
        { id: "3", type: "email", label: "이메일", placeholder: "example@email.com", required: true, order: 2 },
        { id: "4", type: "text", label: "학생 학년", placeholder: "예: 고1, 고2", required: true, order: 3 },
        { id: "5", type: "checkbox", label: "SMS 알림 수신 동의", placeholder: "", required: false, order: 4 },
      ],
      og_title: "특별 입시설명회 초대",
      og_description: "2026 대입 전략을 무료로 알아보세요",
      show_qr_code: true,
      qr_code_position: "bottom",
    },
  },
  {
    id: "free_trial",
    name: "무료 체험 신청",
    description: "무료 체험 수업 신청을 위한 전환 최적화 페이지",
    category: "conversion",
    thumbnail: "🚀",
    previewUrl: "/templates/preview/free_trial",
    icon: Rocket,
    color: "from-green-500 to-emerald-600",
    features: ["긴급성 강조", "사회적 증거", "신뢰 배지", "간편 신청"],
    data: {
      title: "🚀 지금 무료로 체험하세요!",
      subtitle: "첫 수업 100% 무료 + 학습 진단 제공",
      description: "단 3분 만에 신청 완료! 이번 주 체험 신청자 한정 특별 혜택을 드립니다. 상담 후 등록 시 첫 달 30% 할인!",
      template_type: "basic",
      input_data: [
        { id: "1", type: "text", label: "학생 이름", placeholder: "홍길동", required: true, order: 0 },
        { id: "2", type: "phone", label: "학부모 연락처", placeholder: "010-1234-5678", required: true, order: 1 },
        { id: "3", type: "text", label: "학년", placeholder: "예: 초5, 중2", required: true, order: 2 },
        { id: "4", type: "text", label: "희망 과목", placeholder: "수학, 영어 등", required: false, order: 3 },
        { id: "5", type: "text", label: "편한 시간대", placeholder: "예: 평일 저녁, 주말", required: false, order: 4 },
      ],
      og_title: "무료 체험 수업 신청",
      og_description: "지금 신청하면 특별 혜택이 가득!",
      show_qr_code: true,
      qr_code_position: "top",
    },
  },
  {
    id: "parent_community",
    name: "학부모 커뮤니티",
    description: "학부모 소통과 참여를 위한 커뮤니티 페이지",
    category: "community",
    thumbnail: "👥",
    previewUrl: "/templates/preview/parent_community",
    icon: Users,
    color: "from-teal-500 to-cyan-600",
    features: ["설문조사", "의견 수렴", "공지사항", "갤러리"],
    data: {
      title: "👥 학부모 커뮤니티에 함께하세요",
      subtitle: "우리 아이들의 더 나은 교육을 위해",
      description: "학부모님들의 의견을 듣고 함께 성장하는 교육 커뮤니티입니다. 교육 정보 공유, 상담 예약, 학원 소식을 한곳에서 확인하세요.",
      template_type: "basic",
      input_data: [
        { id: "1", type: "text", label: "학부모 성함", placeholder: "홍길동", required: true, order: 0 },
        { id: "2", type: "phone", label: "연락처", placeholder: "010-1234-5678", required: true, order: 1 },
        { id: "3", type: "email", label: "이메일", placeholder: "parent@example.com", required: false, order: 2 },
        { id: "4", type: "text", label: "자녀 학년", placeholder: "예: 중1, 고2", required: true, order: 3 },
        { id: "5", type: "textarea", label: "관심 주제 또는 건의사항", placeholder: "자유롭게 작성해주세요", required: false, order: 4 },
        { id: "6", type: "checkbox", label: "커뮤니티 가입 및 정보 수신 동의", placeholder: "", required: true, order: 5 },
      ],
      og_title: "학부모 커뮤니티",
      og_description: "함께 성장하는 교육 커뮤니티",
      show_qr_code: false,
      qr_code_position: "sidebar",
    },
  },
];

export default function LandingPageTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreset | null>(null);

  const categories = [
    { value: "all", label: "전체" },
    { value: "academy", label: "학원 소개" },
    { value: "report", label: "리포트" },
    { value: "event", label: "이벤트" },
    { value: "conversion", label: "전환 최적화" },
    { value: "community", label: "커뮤니티" },
  ];

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATE_PRESETS
      : TEMPLATE_PRESETS.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = (template: TemplatePreset) => {
    // 템플릿 데이터를 로컬 스토리지에 저장
    localStorage.setItem("landing_page_draft", JSON.stringify(template.data));
    // 빌더 페이지로 이동
    router.push("/dashboard/admin/landing-pages/builder");
  };

  const handlePreview = (template: TemplatePreset) => {
    setSelectedTemplate(template);
    // 미리보기 로직
    alert(`${template.name} 미리보기\n\n${template.description}\n\n곧 실제 미리보기 기능이 추가됩니다!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-indigo-600" />
                템플릿 갤러리
              </h1>
              <p className="text-gray-600 mt-1">
                전문 디자이너가 제작한 검증된 템플릿으로 빠르게 시작하세요
              </p>
            </div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className={
                selectedCategory === category.value
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : ""
              }
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* 템플릿 썸네일 */}
                <div
                  className={`h-48 bg-gradient-to-br ${template.color} flex items-center justify-center text-white relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="relative z-10 text-center">
                    <div className="text-6xl mb-2">{template.thumbnail}</div>
                    <Icon className="w-12 h-12 mx-auto opacity-80" />
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {categories.find((c) => c.value === template.category)?.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 주요 기능 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">주요 기능</p>
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Check className="w-3 h-3 mr-1 text-green-600" />
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      미리보기
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      사용하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 빈 상태 */}
        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">이 카테고리에는 템플릿이 없습니다.</p>
              <p className="text-gray-400 text-sm">다른 카테고리를 선택해보세요.</p>
            </CardContent>
          </Card>
        )}

        {/* 안내 카드 */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">템플릿 커스터마이징</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  모든 템플릿은 완전히 커스터마이징 가능합니다. 색상, 텍스트, 이미지, 폼 필드 등을
                  자유롭게 수정하여 여러분만의 독특한 랜딩페이지를 만들어보세요. 템플릿을
                  선택하면 빌더 페이지로 이동하여 바로 편집을 시작할 수 있습니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">반응형 디자인</Badge>
                  <Badge variant="outline">SEO 최적화</Badge>
                  <Badge variant="outline">모바일 친화적</Badge>
                  <Badge variant="outline">빠른 로딩</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
