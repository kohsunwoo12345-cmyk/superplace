"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Calendar } from "lucide-react";
import { PLANS } from "@/services/payment";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: string, amount: number) => {
    if (amount === 0) {
      alert("현재 무료 플랜을 사용 중입니다");
      return;
    }

    setLoading(planType);

    try {
      // Initialize payment
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType, amount }),
      });

      if (!response.ok) {
        throw new Error("결제 초기화 실패");
      }

      const paymentData = await response.json();

      // Load Toss Payments widget
      // @ts-ignore
      const tossPayments = TossPayments(paymentData.clientKey);
      
      // Request payment
      await tossPayments.requestPayment("카드", {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("결제 중 오류가 발생했습니다");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">구독 관리</h1>
        <p className="text-gray-600 mt-1">
          플랜을 선택하고 구독을 시작하세요
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>현재 구독</CardTitle>
          <CardDescription>활성화된 구독 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">무료 플랜</p>
                <p className="text-sm text-gray-600">계정 1개, 기본 기능</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">다음 결제일</p>
              <p className="font-semibold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => (
          <PricingCard
            key={key}
            planType={key}
            name={plan.name}
            price={plan.price}
            features={plan.features}
            onSubscribe={handleSubscribe}
            loading={loading === key}
            popular={key === "PREMIUM"}
          />
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
          <CardDescription>구독 및 결제 히스토리</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>결제 내역이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PricingCardProps {
  planType: string;
  name: string;
  price: number | null;
  features: string[];
  onSubscribe: (planType: string, amount: number) => void;
  loading: boolean;
  popular?: boolean;
}

function PricingCard({
  planType,
  name,
  price,
  features,
  onSubscribe,
  loading,
  popular,
}: PricingCardProps) {
  return (
    <Card className={popular ? "border-primary shadow-lg" : ""}>
      <CardHeader>
        {popular && (
          <div className="text-center mb-2">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
              인기
            </span>
          </div>
        )}
        <CardTitle className="text-center">{name}</CardTitle>
        <div className="text-center py-4">
          {price === null ? (
            <div className="text-2xl font-bold">문의</div>
          ) : (
            <>
              <div className="text-3xl font-bold">
                {price === 0 ? "무료" : `₩${price.toLocaleString()}`}
              </div>
              {price > 0 && (
                <div className="text-sm text-gray-600">/월</div>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={() => price !== null && onSubscribe(planType, price)}
          disabled={loading || price === null}
        >
          {loading ? "처리중..." : price === null ? "문의하기" : "구독하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
