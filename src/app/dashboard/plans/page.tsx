"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
  Users,
  DollarSign,
  Calendar,
  Star,
} from "lucide-react";

// 요금제 타입 정의
type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  features: string[];
  maxStudents: number;
  maxTeachers: number;
  aiCredits: number;
  status: "active" | "inactive";
  popular?: boolean;
  subscriberCount: number;
};

// 샘플 요금제 데이터
const samplePlans: Plan[] = [
  {
    id: "1",
    name: "베이직",
    description: "소규모 학원을 위한 기본 플랜",
    price: 50000,
    billingCycle: "monthly",
    features: [
      "학생 관리 시스템",
      "출석 체크",
      "기본 성적 관리",
      "학습 자료 업로드",
      "이메일 지원",
    ],
    maxStudents: 50,
    maxTeachers: 3,
    aiCredits: 100,
    status: "active",
    subscriberCount: 45,
  },
  {
    id: "2",
    name: "프로",
    description: "중규모 학원을 위한 프로페셔널 플랜",
    price: 100000,
    billingCycle: "monthly",
    features: [
      "베이직 플랜 모든 기능",
      "AI 학습 도우미",
      "과제 자동 채점",
      "상세 분석 리포트",
      "SMS 알림",
      "우선 지원",
    ],
    maxStudents: 150,
    maxTeachers: 10,
    aiCredits: 500,
    status: "active",
    popular: true,
    subscriberCount: 128,
  },
  {
    id: "3",
    name: "엔터프라이즈",
    description: "대규모 학원을 위한 맞춤형 플랜",
    price: 250000,
    billingCycle: "monthly",
    features: [
      "프로 플랜 모든 기능",
      "무제한 AI 크레딧",
      "맞춤형 분석 대시보드",
      "API 접근 권한",
      "전담 계정 매니저",
      "24/7 전화 지원",
      "맞춤형 기능 개발",
    ],
    maxStudents: 999,
    maxTeachers: 50,
    aiCredits: 999999,
    status: "active",
    subscriberCount: 23,
  },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(samplePlans);

  const handleCreatePlan = () => {
    alert("요금제 생성 기능은 추후 구현 예정입니다.");
  };

  const handleEditPlan = (planId: string) => {
    alert(`요금제 수정: ${planId} - 추후 구현 예정`);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm("정말 이 요금제를 삭제하시겠습니까?")) {
      setPlans(plans.filter((p) => p.id !== planId));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">요금제 관리</h1>
          <p className="mt-2 text-gray-600">
            학원용 요금제를 관리하고 구독 현황을 확인하세요
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="mr-2 h-4 w-4" />
          새 요금제 만들기
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 요금제</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">활성 요금제</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 구독자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((sum, plan) => sum + plan.subscriberCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">활성 구독</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">월 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                plans.reduce(
                  (sum, plan) => sum + plan.price * plan.subscriberCount,
                  0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">예상 월 매출</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인기 요금제</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.find((p) => p.popular)?.name || "프로"}
            </div>
            <p className="text-xs text-muted-foreground">가장 많이 선택됨</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular ? "border-primary border-2 shadow-lg" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1">
                  <Star className="mr-1 h-3 w-3" />
                  인기
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </div>
                <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                  {plan.status === "active" ? "활성" : "비활성"}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="ml-2 text-gray-500">
                    / {plan.billingCycle === "monthly" ? "월" : "년"}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <p className="font-semibold text-sm">포함 기능</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limits */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">최대 학생 수</span>
                  <span className="font-semibold">
                    {plan.maxStudents === 999 ? "무제한" : `${plan.maxStudents}명`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">최대 선생님 수</span>
                  <span className="font-semibold">
                    {plan.maxTeachers === 50 ? "무제한" : `${plan.maxTeachers}명`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">AI 크레딧</span>
                  <span className="font-semibold">
                    {plan.aiCredits === 999999 ? "무제한" : `${plan.aiCredits}개`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">현재 구독자</span>
                  <span className="font-semibold text-primary">
                    {plan.subscriberCount}명
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditPlan(plan.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  수정
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
