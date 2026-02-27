"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Plus, Edit, Trash2, X, Save, CheckCircle, FileText, Settings } from "lucide-react";

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  isPopular: number;
  isActive: number;
  htmlContent?: string;
}

interface PlanStats {
  planName: string;
  activeAcademies: number;
}

export default function PricingManagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [stats, setStats] = useState<PlanStats[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxStudents: 10,
    maxTeachers: 2,
    maxHomeworkChecks: 100,
    maxAIGrading: 100,
    maxCapabilityAnalysis: 50,
    maxConceptAnalysis: 50,
    maxSimilarProblems: 100,
    maxLandingPages: 3,
    features: "",
    isPopular: false,
    htmlContent: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    const role = userData.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/dashboard");
      return;
    }

    fetchPlans();
  }, [router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/pricing");
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error("요금제 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditing(true);
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxStudents: 10,
      maxTeachers: 2,
      maxHomeworkChecks: 100,
      maxAIGrading: 100,
      maxCapabilityAnalysis: 50,
      maxConceptAnalysis: 50,
      maxSimilarProblems: 100,
      maxLandingPages: 3,
      features: "",
      isPopular: false,
      htmlContent: ""
    });
  };

  const handleEdit = (plan: PricingPlan) => {
    setIsEditing(true);
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxHomeworkChecks: (plan as any).maxHomeworkChecks || 100,
      maxAIGrading: (plan as any).maxAIGrading || 100,
      maxCapabilityAnalysis: (plan as any).maxCapabilityAnalysis || 50,
      maxConceptAnalysis: (plan as any).maxConceptAnalysis || 50,
      maxSimilarProblems: (plan as any).maxSimilarProblems || 100,
      maxLandingPages: (plan as any).maxLandingPages || 3,
      features: plan.features.join("\n"),
      isPopular: plan.isPopular === 1,
      htmlContent: plan.htmlContent || ""
    });
  };

  const handleSave = async () => {
    console.log("Form data:", formData);
    
    if (!formData.name.trim()) {
      alert("요금제 이름을 입력해주세요.");
      return;
    }

    // 가격은 0 이상이어야 함 (0은 무료 플랜)
    const monthlyPrice = Number(formData.monthlyPrice);
    if (isNaN(monthlyPrice) || monthlyPrice < 0) {
      alert("유효한 월간 가격을 입력해주세요.");
      return;
    }

    try {
      const featuresArray = formData.features
        .split("\n")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pricing: {
          '1month': Number(formData.monthlyPrice),
          '6months': Number(formData.yearlyPrice) > 0 ? Number(formData.yearlyPrice) / 2 : Number(formData.monthlyPrice) * 6,
          '12months': Number(formData.yearlyPrice) || Number(formData.monthlyPrice) * 12
        },
        limits: {
          maxStudents: Number(formData.maxStudents),
          maxTeachers: Number(formData.maxTeachers),
          maxHomeworkChecks: Number(formData.maxHomeworkChecks),
          maxAIAnalysis: Number(formData.maxCapabilityAnalysis),
          maxAIGrading: Number(formData.maxAIGrading),
          maxCapabilityAnalysis: Number(formData.maxCapabilityAnalysis),
          maxConceptAnalysis: Number(formData.maxConceptAnalysis),
          maxSimilarProblems: Number(formData.maxSimilarProblems),
          maxLandingPages: Number(formData.maxLandingPages)
        },
        features: featuresArray,
        isPopular: formData.isPopular,
        color: '#3b82f6',
        order: 0
      };

      console.log("Sending payload:", payload);

      let response;
      if (editingPlan) {
        // 수정
        response = await fetch(`/api/admin/pricing-plans`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingPlan.id, isActive: true })
        });
      } else {
        // 생성
        response = await fetch("/api/admin/pricing-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        alert(editingPlan ? "요금제가 수정되었습니다." : "요금제가 추가되었습니다.");
        setIsEditing(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        alert("요금제 저장에 실패했습니다: " + (errorData.message || ""));
      }
    } catch (error) {
      console.error("요금제 저장 실패:", error);
      alert("요금제 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm("이 요금제를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/pricing?id=${planId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("요금제가 삭제되었습니다.");
        fetchPlans();
      } else {
        alert("요금제 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("요금제 삭제 실패:", error);
      alert("요금제 삭제 중 오류가 발생했습니다.");
    }
  };

  const getStatsForPlan = (planName: string) => {
    const stat = stats.find(s => s.planName === planName);
    return stat?.activeAcademies || 0;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-purple-600" />
            요금제 관리
          </h1>
          <p className="text-gray-600 mt-1">서비스 요금제 설정 및 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard/admin/payment-approvals")}
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            결제 승인
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard/admin/logs")}
            className="border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            상세 기록
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard/admin/academies")}
            className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            학원 권한 설정
          </Button>
          {!isEditing && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              새 요금제 추가
            </Button>
          )}
        </div>
      </div>

      {/* 요금제 생성/수정 폼 */}
      {isEditing && (
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editingPlan ? "요금제 수정" : "새 요금제 추가"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">요금제 이름 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 스탠다드"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="예: 중소규모 학원을 위한 추천 플랜"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월간 가격 (원) *</label>
                <Input
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">연간 가격 (원) *</label>
                <Input
                  type="number"
                  value={formData.yearlyPrice}
                  onChange={(e) => setFormData({ ...formData, yearlyPrice: parseInt(e.target.value) || 0 })}
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">최대 학생 수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">최대 선생님 수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxTeachers}
                  onChange={(e) => setFormData({ ...formData, maxTeachers: parseInt(e.target.value) || 2 })}
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월별 숙제 검사 횟수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxHomeworkChecks}
                  onChange={(e) => setFormData({ ...formData, maxHomeworkChecks: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월별 AI 채점 횟수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxAIGrading}
                  onChange={(e) => setFormData({ ...formData, maxAIGrading: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월별 역량 분석 횟수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxCapabilityAnalysis}
                  onChange={(e) => setFormData({ ...formData, maxCapabilityAnalysis: parseInt(e.target.value) || 50 })}
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월별 개념 분석 횟수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxConceptAnalysis}
                  onChange={(e) => setFormData({ ...formData, maxConceptAnalysis: parseInt(e.target.value) || 50 })}
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">월별 유사문제 생성 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxSimilarProblems}
                  onChange={(e) => setFormData({ ...formData, maxSimilarProblems: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">랜딩페이지 제작 수 (-1 = 무제한)</label>
                <Input
                  type="number"
                  value={formData.maxLandingPages}
                  onChange={(e) => setFormData({ ...formData, maxLandingPages: parseInt(e.target.value) || 3 })}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">기능 목록 (한 줄에 하나씩)</label>
              <Textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={8}
                placeholder="최대 50명의 학생 관리&#10;최대 5명의 선생님 계정&#10;고급 출석 관리&#10;..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">HTML 상세 페이지 (선택)</label>
              <Textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                rows={6}
                placeholder="<div>상세 페이지 HTML 내용...</div>"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isPopular" className="text-sm font-medium">인기 요금제로 표시</label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.filter(p => p.isActive === 1).map((plan, index) => {
            const colors = ["blue", "purple", "orange", "green"];
            const color = colors[index % colors.length];
            
            return (
              <Card key={plan.id} className={`border-2 border-${color}-100`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{plan.name} 구독</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold text-${color}-600`}>
                    {getStatsForPlan(plan.name)}개
                  </div>
                  <p className="text-sm text-gray-500 mt-2">활성 학원</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pricing Plans */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.isActive === 1).map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.isPopular
                  ? "border-2 border-purple-500 shadow-lg"
                  : "border-2 border-gray-200"
              }`}
            >
              {plan.isPopular === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    인기
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <CardDescription>
                  <div className="text-4xl font-bold text-gray-900 mt-2">
                    {plan.monthlyPrice === 0 ? "무료" : `${plan.monthlyPrice.toLocaleString()}원`}
                    {plan.monthlyPrice > 0 && <span className="text-lg font-normal text-gray-500">/월</span>}
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      연간: {plan.yearlyPrice.toLocaleString()}원
                    </div>
                  )}
                </CardDescription>
                <div className="text-sm text-gray-600 mt-2">
                  최대 {plan.maxStudents}명 학생 · {plan.maxTeachers}명 선생님
                </div>
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
                  <Button className="w-full" variant="outline" onClick={() => handleEdit(plan)}>
                    <Edit className="w-4 h-4 mr-2" />
                    수정
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {plans.filter(p => p.isActive === 1).length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              등록된 요금제가 없습니다. 새 요금제를 추가해주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
