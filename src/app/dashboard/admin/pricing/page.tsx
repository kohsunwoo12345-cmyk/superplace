"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Plus, Edit, Trash2 } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      id: 1,
      name: "베이직",
      price: 150000,
      period: "월",
      features: [
        "학생 최대 50명",
        "기본 AI 봇 1개",
        "출석 관리",
        "숙제 관리",
        "기본 통계",
      ],
      popular: false,
    },
    {
      id: 2,
      name: "프로",
      price: 300000,
      period: "월",
      features: [
        "학생 최대 200명",
        "AI 봇 3개",
        "출석 관리",
        "숙제 관리",
        "고급 통계",
        "맞춤형 대시보드",
        "우선 지원",
      ],
      popular: true,
    },
    {
      id: 3,
      name: "엔터프라이즈",
      price: 500000,
      period: "월",
      features: [
        "학생 무제한",
        "AI 봇 무제한",
        "모든 기능",
        "전담 관리자",
        "24/7 지원",
        "커스터마이징",
        "API 접근",
      ],
      popular: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-purple-600" />
            요금제 관리
          </h1>
          <p className="text-gray-600 mt-1">서비스 요금제 설정 및 관리</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 요금제 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">베이직 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">45개</div>
            <p className="text-sm text-gray-500 mt-2">활성 학원</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">프로 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">23개</div>
            <p className="text-sm text-gray-500 mt-2">활성 학원</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">엔터프라이즈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">7개</div>
            <p className="text-sm text-gray-500 mt-2">활성 학원</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular
                ? "border-2 border-purple-500 shadow-lg"
                : "border-2 border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  인기
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <div className="text-4xl font-bold text-gray-900 mt-2">
                  {plan.price.toLocaleString()}원
                  <span className="text-lg font-normal text-gray-500">/{plan.period}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 space-y-2">
                <Button className="w-full" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </Button>
                <Button className="w-full" variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>요금제 설정</CardTitle>
          <CardDescription>전체 요금제 관리 옵션</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">무료 체험 기간</p>
              <p className="text-sm text-gray-500">신규 가입 시 무료로 사용할 수 있는 기간</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={14}
                className="w-20 px-3 py-2 border rounded-lg"
              />
              <span>일</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">할인 쿠폰</p>
              <p className="text-sm text-gray-500">프로모션 및 할인 쿠폰 관리</p>
            </div>
            <Button variant="outline">관리</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">결제 방법</p>
              <p className="text-sm text-gray-500">지원하는 결제 수단 설정</p>
            </div>
            <Button variant="outline">설정</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
