"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Building2, 
  User, 
  Phone, 
  Mail,
  ArrowRight,
  GraduationCap,
  FileText,
  CheckCircle,
  Bot,
  Package
} from "lucide-react";

// 요금제 정보
const PLANS = [
  { id: "FREE", name: "무료 플랜", price: 0, maxStudents: 10, maxTeachers: 2 },
  { id: "BASIC", name: "베이직 플랜", price: 29000, maxStudents: 30, maxTeachers: 5 },
  { id: "PREMIUM", name: "프리미엄 플랜", price: 49000, maxStudents: 100, maxTeachers: 20 },
  { id: "ENTERPRISE", name: "엔터프라이즈 플랜", price: 99000, maxStudents: 999999, maxTeachers: 999999 }
];

interface AIBot {
  id: string;
  name: string;
  description: string;
  profileIcon: string;
  price: number;
}

export default function PaymentApplyPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
  const [purchaseType, setPurchaseType] = useState<"plan" | "bot">("plan");
  const [submitting, setSubmitting] = useState(false);
  const [availableBots, setAvailableBots] = useState<AIBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  
  const [formData, setFormData] = useState({
    academyName: "",
    directorName: "",
    phone: "",
    email: "",
    planName: "",
    selectedPlan: "",
    selectedBot: "",
    amount: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    accountBank: "",
    accountNumber: "",
    accountHolder: "",
    notes: ""
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setFormData(prev => ({
          ...prev,
          directorName: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || ""
        }));
      } catch (e) {
        console.error("사용자 정보 파싱 실패:", e);
      }
    }

    // AI 봇 목록 로드
    fetchAvailableBots();
  }, []);

  const fetchAvailableBots = async () => {
    try {
      setLoadingBots(true);
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        // 봇 가격 설정 (실제로는 봇마다 다를 수 있음)
        const botsWithPrice = (data.bots || []).map((bot: any) => ({
          ...bot,
          price: 15000 // 기본 봇 가격
        }));
        setAvailableBots(botsWithPrice);
      }
    } catch (error) {
      console.error("봇 목록 로드 실패:", error);
    } finally {
      setLoadingBots(false);
    }
  };

  // 요금제 선택 시
  const handlePlanSelect = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (plan) {
      setFormData({
        ...formData,
        selectedPlan: planId,
        planName: plan.id,
        amount: plan.price.toString()
      });
    }
  };

  // 봇 선택 시
  const handleBotSelect = (botId: string) => {
    const bot = availableBots.find(b => b.id === botId);
    if (bot) {
      setFormData({
        ...formData,
        selectedBot: botId,
        planName: `BOT-${botId}`,
        amount: bot.price.toString()
      });
    }
  };

  const handleSubmit = async () => {
    // 구매 항목 선택 확인
    if (purchaseType === "plan" && !formData.selectedPlan) {
      alert("요금제를 선택해주세요.");
      return;
    }
    if (purchaseType === "bot" && !formData.selectedBot) {
      alert("AI 봇을 선택해주세요.");
      return;
    }

    if (!formData.academyName.trim() || !formData.directorName.trim() || !formData.phone.trim() || !formData.amount.trim()) {
      alert("필수 정보를 모두 입력해주세요.");
      return;
    }

    if (paymentMethod === "card") {
      if (!formData.cardNumber.trim() || !formData.cardExpiry.trim() || !formData.cardCvc.trim()) {
        alert("카드 정보를 모두 입력해주세요.");
        return;
      }
    } else {
      if (!formData.accountBank.trim() || !formData.accountNumber.trim() || !formData.accountHolder.trim()) {
        alert("계좌 정보를 모두 입력해주세요.");
        return;
      }
    }

    const itemName = purchaseType === "plan"
      ? PLANS.find(p => p.id === formData.selectedPlan)?.name || ""
      : availableBots.find(b => b.id === formData.selectedBot)?.name || "";

    if (!confirm(`${itemName} - ${paymentMethod === "card" ? "카드 결제" : "계좌이체"} 신청을 제출하시겠습니까?`)) {
      return;
    }

    try {
      setSubmitting(true);

      const storedUser = localStorage.getItem("user");
      let academyId = `academy-${Date.now()}`;
      let userId = null;

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          academyId = userData.academyId || academyId;
          userId = userData.id || null;
        } catch (e) {
          console.error("사용자 정보 파싱 실패:", e);
        }
      }

      let paymentInfo = "";
      if (paymentMethod === "card") {
        paymentInfo = `카드번호: ${formData.cardNumber}\n유효기간: ${formData.cardExpiry}\nCVC: ${formData.cardCvc}`;
      } else {
        paymentInfo = `은행: ${formData.accountBank}\n계좌번호: ${formData.accountNumber}\n예금주: ${formData.accountHolder}`;
      }

      const payload = {
        academyId,
        userId,
        planName: formData.planName,
        amount: parseFloat(formData.amount),
        paymentMethod,
        notes: `학원명: ${formData.academyName}
학원장: ${formData.directorName}
연락처: ${formData.phone}
이메일: ${formData.email}

[결제 정보]
${paymentInfo}

비고: ${formData.notes}`
      };

      const response = await fetch("/api/admin/payment-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("결제 신청이 완료되었습니다!\n관리자 승인 후 서비스를 이용하실 수 있습니다.");
        router.push("/dashboard");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">결제 신청</h1>
          <p className="text-gray-600">구독 플랜 결제를 신청합니다</p>
        </div>

        <div className="space-y-6">
          {/* 구매 유형 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                구매 유형 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setPurchaseType("plan");
                    setFormData(prev => ({ ...prev, selectedBot: "", planName: "", amount: "" }));
                  }}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    purchaseType === "plan"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <GraduationCap className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">요금제 구독</div>
                  <div className="text-xs text-gray-500 mt-1">월간 구독 플랜</div>
                </button>

                <button
                  onClick={() => {
                    setPurchaseType("bot");
                    setFormData(prev => ({ ...prev, selectedPlan: "", planName: "", amount: "" }));
                  }}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    purchaseType === "bot"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">AI 봇 구매</div>
                  <div className="text-xs text-gray-500 mt-1">영구 사용 가능</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 요금제 또는 봇 선택 */}
          {purchaseType === "plan" ? (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  요금제 선택
                </CardTitle>
                <CardDescription>학원에 적합한 요금제를 선택해주세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.selectedPlan === plan.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-bold text-lg">{plan.name}</div>
                      <div className="text-2xl font-bold text-purple-600 mt-2">
                        {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
                        {plan.price > 0 && <span className="text-sm text-gray-500">/월</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-3 space-y-1">
                        <div>• 학생 최대 {plan.maxStudents === 999999 ? "무제한" : `${plan.maxStudents}명`}</div>
                        <div>• 교사 최대 {plan.maxTeachers === 999999 ? "무제한" : `${plan.maxTeachers}명`}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI 봇 선택
                </CardTitle>
                <CardDescription>구매할 AI 봇을 선택해주세요</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBots ? (
                  <div className="text-center py-8 text-gray-500">봇 목록을 불러오는 중...</div>
                ) : availableBots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">사용 가능한 봇이 없습니다.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBots.map((bot) => (
                      <button
                        key={bot.id}
                        onClick={() => handleBotSelect(bot.id)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.selectedBot === bot.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-3xl">{bot.profileIcon || "🤖"}</div>
                          <div>
                            <div className="font-bold">{bot.name}</div>
                            <div className="text-sm text-gray-600">{bot.description?.substring(0, 50) || "AI 봇"}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          ₩{bot.price.toLocaleString()}
                          <span className="text-sm text-gray-500 ml-1">영구 사용</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 결제 방법 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                결제 방법 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">카드 결제</div>
                  <div className="text-xs text-gray-500 mt-1">신용/체크카드</div>
                </button>

                <button
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    paymentMethod === "transfer"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Building2 className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">계좌이체</div>
                  <div className="text-xs text-gray-500 mt-1">무통장 입금</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>학원 및 신청자 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">학원명 *</label>
                  <Input
                    value={formData.academyName}
                    onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                    placeholder="예: 슈퍼플레이스 학원"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">학원장명 *</label>
                  <Input
                    value={formData.directorName}
                    onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                    placeholder="홍길동"
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

                <div>
                  <label className="block text-sm font-medium mb-2">이메일</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">구매 항목</label>
                  <Input
                    value={
                      purchaseType === "plan" 
                        ? PLANS.find(p => p.id === formData.selectedPlan)?.name || ""
                        : availableBots.find(b => b.id === formData.selectedBot)?.name || ""
                    }
                    disabled
                    className="bg-gray-100"
                    placeholder="위에서 항목을 선택해주세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">결제 금액 (원)</label>
                  <Input
                    type="text"
                    value={formData.amount ? `₩${parseInt(formData.amount).toLocaleString()}` : ""}
                    disabled
                    className="bg-gray-100 text-lg font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 카드 결제 정보 */}
          {paymentMethod === "card" && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  카드 정보
                </CardTitle>
                <CardDescription>결제할 카드 정보를 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">카드 번호 *</label>
                  <Input
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    placeholder="1234-5678-9012-3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">유효기간 (MM/YY) *</label>
                    <Input
                      value={formData.cardExpiry}
                      onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                      placeholder="12/25"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CVC *</label>
                    <Input
                      value={formData.cardCvc}
                      onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  카드 정보는 안전하게 암호화되어 전송됩니다.
                </div>
              </CardContent>
            </Card>
          )}

          {/* 계좌이체 정보 */}
          {paymentMethod === "transfer" && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  계좌 정보
                </CardTitle>
                <CardDescription>입금할 계좌 정보를 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">은행 *</label>
                  <Input
                    value={formData.accountBank}
                    onChange={(e) => setFormData({ ...formData, accountBank: e.target.value })}
                    placeholder="예: 국민은행"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">계좌번호 *</label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="123456-78-901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">예금주 *</label>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  신청 후 관리자 승인 시 입금 계좌를 안내드립니다.
                </div>
              </CardContent>
            </Card>
          )}

          {/* 추가 요청사항 */}
          <Card>
            <CardHeader>
              <CardTitle>추가 요청사항</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="추가로 전달하실 내용이 있으시면 입력해주세요."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 text-lg"
          >
            {submitting ? "처리 중..." : "결제 신청하기"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="text-center text-sm text-gray-500">
            <Link href="/pricing" className="text-blue-600 hover:underline">
              요금제 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
