"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, ArrowLeft } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  pricing: {
    '1month': number;
    '6months': number;
    '12months': number;
  };
  isActive: boolean;
}

export default function ExportByPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch("/api/admin/pricing-plans");
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("요금제 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (planId: string, planName: string) => {
    window.open(`/api/admin/export-users?type=by-plan&planId=${planId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            관리자 대시보드로
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Filter className="h-8 w-8 text-purple-600" />
            요금제별 회원 DB 추출
          </h1>
          <p className="text-gray-600 mt-1">
            특정 요금제를 사용 중인 회원 목록을 다운로드합니다
          </p>
        </div>
      </div>

      {/* 요금제 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`border-2 hover:shadow-lg transition-shadow ${
              plan.isActive ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {!plan.isActive && (
                  <span className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded">
                    비활성
                  </span>
                )}
              </CardTitle>
              <CardDescription>{plan.description || "요금제 설명 없음"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">가격:</p>
                  <p>• 1개월: {plan.pricing['1month'].toLocaleString()}원</p>
                  <p>• 6개월: {plan.pricing['6months'].toLocaleString()}원</p>
                  <p>• 12개월: {plan.pricing['12months'].toLocaleString()}원</p>
                </div>
                
                <Button
                  onClick={() => handleExport(plan.id, plan.name)}
                  className="w-full"
                  disabled={!plan.isActive}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {plan.name} 사용자 추출
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              등록된 요금제가 없습니다.
            </p>
            <div className="text-center mt-4">
              <Button
                onClick={() => router.push("/dashboard/admin/pricing")}
                variant="outline"
              >
                요금제 관리로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
