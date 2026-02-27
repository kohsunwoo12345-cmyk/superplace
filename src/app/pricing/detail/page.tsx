"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, Building2, Check } from "lucide-react";

function PricingDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const bankAccount = "746-910023-17004"; // 하나은행 계좌번호

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (planId) {
      fetchPlanDetail();
    }
    
    // 사용자 정보 자동 채우기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
      } catch (e) {
        console.error("사용자 정보 파싱 실패:", e);
      }
    }
  }, [planId]);

  const fetchPlanDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pricing?id=${planId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Plan detail response:", data);
        // API가 { success: true, plan: {...} } 형식으로 반환
        if (data.success && data.plan) {
          setPlan(data.plan);
        } else {
          console.error("Invalid response format:", data);
        }
      } else {
        console.error("Failed to fetch plan:", response.status);
      }
    } catch (error) {
      console.error("요금제 상세 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert("연락처 정보를 모두 입력해주세요.");
      return;
    }

    if (!confirm(`${paymentMethod === "card" ? "카드 결제" : "계좌이체"} 신청을 제출하시겠습니까?`)) {
      return;
    }

    try {
      setSubmitting(true);

      const storedUser = localStorage.getItem("user");
      let academyId = null;
      let userId = null;

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          academyId = userData.academyId || userData.academy_id;
          userId = userData.id;
        } catch (e) {
          console.error("사용자 정보 파싱 실패:", e);
        }
      }

      const payload = {
        academyId,
        userId,
        planName: plan.name,
        amount: plan.monthlyPrice,
        paymentMethod,
        notes: `이름: ${formData.name}\n이메일: ${formData.email}\n연락처: ${formData.phone}`,
      };

      const response = await fetch("/api/admin/payment-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`결제 신청이 완료되었습니다!\n\n결제 방식: ${paymentMethod === "card" ? "카드 결제" : "계좌이체"}\n\n관리자가 확인 후 연락드리겠습니다.`);
        router.push("/pricing");
      } else {
        alert("결제 신청에 실패했습니다.");
      }
    } catch (error) {
      console.error("결제 신청 실패:", error);
      alert("결제 신청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">요금제를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/pricing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* 뒤로 가기 버튼 */}
        <Button
          variant="ghost"
          onClick={() => router.push("/pricing")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: HTML 상세 내용 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-gray-600">{plan.description}</p>
                <div className="text-3xl font-bold text-blue-600 mt-4">
                  ₩{plan.monthlyPrice.toLocaleString()} <span className="text-lg font-normal text-gray-600">/ 월</span>
                </div>
              </CardHeader>
              <CardContent>
                {/* HTML 컨텐츠 렌더링 */}
                {plan.htmlContent ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: plan.htmlContent }}
                  />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">포함된 기능</h3>
                    <ul className="space-y-2">
                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li>기능 정보가 없습니다.</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 결제 신청 폼 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>결제 신청</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 결제 방식 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">결제 방식</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-semibold">카드 결제</div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("transfer")}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        paymentMethod === "transfer"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Building2 className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-semibold">계좌이체</div>
                    </button>
                  </div>
                </div>

                {/* 연락처 정보 */}
                <div>
                  <label className="block text-sm font-medium mb-2">이름 *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">이메일 *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">연락처 *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                  />
                </div>

                {/* 안내 메시지 */}
                <div className={`p-3 rounded-lg text-sm ${
                  paymentMethod === "card" 
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                }`}>
                  {paymentMethod === "card" ? (
                    <>
                      <Check className="w-4 h-4 inline mr-1" />
                      관리자 확인 후 카드 결제 링크를 보내드립니다.
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Check className="w-4 h-4 inline mr-1" />
                        아래 계좌로 입금해주시면 관리자가 확인 후 승인해드립니다.
                      </div>
                      <div className="bg-white p-3 rounded border border-yellow-300">
                        <div className="text-xs font-semibold mb-1">입금 계좌</div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-lg">하나은행</div>
                            <div className="font-mono text-lg">{bankAccount}</div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={copied ? "secondary" : "outline"}
                            onClick={() => {
                              navigator.clipboard.writeText(bankAccount);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="whitespace-nowrap"
                          >
                            {copied ? "복사완료!" : "계좌복사"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 제출 버튼 */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? "처리 중..." : "신청하기"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <PricingDetailContent />
    </Suspense>
  );
}
