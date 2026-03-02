"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, ArrowLeft, Users, UserCheck, UserX, DollarSign, Database } from "lucide-react";

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
    // Create a hidden link and trigger download
    const url = `/api/admin/export-users?type=by-plan&planId=${planId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `회원목록_${planName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectExport = (type: string, typeName: string) => {
    // Create a hidden link and trigger download
    const url = `/api/admin/export-users?type=${type}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `회원목록_${typeName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Database className="h-8 w-8 text-purple-600" />
            회원 DB 추출
          </h1>
          <p className="text-gray-600 mt-1">
            다양한 필터로 회원 목록을 엑셀(CSV)로 다운로드합니다
          </p>
        </div>
      </div>

      {/* 빠른 추출 옵션 */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="h-6 w-6 text-blue-600" />
          빠른 추출
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 전체 회원 */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDirectExport('all', '전체회원')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Users className="h-5 w-5" />
                전체 회원
              </CardTitle>
              <CardDescription>모든 회원 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleDirectExport('all', '전체회원'); }}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </CardContent>
          </Card>

          {/* 활성 회원 */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDirectExport('active', '활성회원')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <UserCheck className="h-5 w-5" />
                활성 회원
              </CardTitle>
              <CardDescription>최근 30일 내 활동</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); handleDirectExport('active', '활성회원'); }}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </CardContent>
          </Card>

          {/* 비활성 회원 */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDirectExport('inactive', '비활성회원')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <UserX className="h-5 w-5" />
                비활성 회원
              </CardTitle>
              <CardDescription>90일 이상 미접속</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={(e) => { e.stopPropagation(); handleDirectExport('inactive', '비활성회원'); }}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </CardContent>
          </Card>

          {/* 구독 없는 회원 */}
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDirectExport('no-subscription', '구독없음')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <DollarSign className="h-5 w-5" />
                구독 없는 회원
              </CardTitle>
              <CardDescription>학원장·교사 중 구독 미사용</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-red-600 hover:bg-red-700" onClick={(e) => { e.stopPropagation(); handleDirectExport('no-subscription', '구독없음'); }}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 요금제별 추출 */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Filter className="h-6 w-6 text-purple-600" />
          요금제별 추출
        </h2>
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
                    <p>• 1개월: {(plan.pricing?.['1month'] ?? 0).toLocaleString()}원</p>
                    <p>• 6개월: {(plan.pricing?.['6months'] ?? 0).toLocaleString()}원</p>
                    <p>• 12개월: {(plan.pricing?.['12months'] ?? 0).toLocaleString()}원</p>
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
    </div>
  );
}
