"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  FileText,
  History,
  Wallet,
  Plus,
  MessageSquare,
  Users,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface SMSStats {
  totalSent: number;
  thisMonth: number;
  balance: number;
  templates: number;
}

export default function SMSManagementPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("SMS 통계 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Send className="h-8 w-8 text-teal-600" />
              문자 발송 관리
            </h1>
            <p className="text-gray-600 mt-1">
              학부모에게 학습 리포트 및 공지사항을 문자로 발송하세요
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/admin/sms/send")}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4 mr-2" />
            문자 발송하기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 발송 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">
                {stats?.totalSent || 0}건
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                이번 달 발송
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.thisMonth || 0}건
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                SMS 포인트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.balance || 0}P
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.templates || 0}개
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-teal-200"
            onClick={() => router.push("/dashboard/admin/sms/send")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-teal-600" />
                문자 발송
              </CardTitle>
              <CardDescription>
                개별 또는 그룹 문자를 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                발송하기
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/dashboard/admin/sms/templates")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                템플릿 관리
              </CardTitle>
              <CardDescription>
                자주 사용하는 메시지를 템플릿으로 저장합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                관리하기
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/dashboard/admin/sms/history")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                발송 이력
              </CardTitle>
              <CardDescription>
                과거 발송 내역을 조회합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                조회하기
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200"
            onClick={() => router.push("/dashboard/admin/sms/charge")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                포인트 충전
              </CardTitle>
              <CardDescription>
                SMS 발송을 위한 포인트를 충전합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                충전하기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                수신자 그룹
              </CardTitle>
              <CardDescription>
                발송 대상 그룹을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                관리하기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                통계 분석
              </CardTitle>
              <CardDescription>
                발송 통계 및 성과를 분석합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                보기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 중요 안내 */}
        <Card className="bg-red-50 border-red-300 border-2">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              ⚠️ 발송 전 먼저 신청해주세요!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 space-y-2">
            <p className="font-semibold text-base">SMS 발송 서비스 이용을 위해 먼저 신청이 필요합니다.</p>
            <p>• 발신번호 등록 및 인증이 필요합니다</p>
            <p>• 발송 서비스 신청 후 승인까지 1-2 영업일 소요됩니다</p>
            <p>• 신청 문의: 고객센터 또는 관리자에게 문의해주세요</p>
          </CardContent>
        </Card>

        {/* 안내 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📱 SMS 발송 안내</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• <strong>SMS (단문)</strong>: 90바이트 이하, 약 45자</p>
            <p>• <strong>LMS (장문)</strong>: 2,000바이트 이하, 약 1,000자</p>
            <p>• 발송 전 반드시 포인트를 충전해주세요</p>
            <p>• 발신번호는 사전 등록이 필요합니다</p>
            <p>• 대량 발송 시 예약 발송을 권장합니다</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
