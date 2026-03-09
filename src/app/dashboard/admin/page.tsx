"use client";
// Force redeploy: 2026-02-21 08:50:00 - PPT Feature Added

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Bot,
  MessageSquare,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ShoppingCart,
  Package,
  FileText,
  Presentation,
  Download,
  Database,
  UserMinus,
  Filter,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("통계 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            시스템 관리자 대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            전체 시스템 현황을 모니터링하고 관리합니다
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">관리자</p>
          <p className="font-semibold">{user.name}</p>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/users")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 사용자
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalUsers || 0}명
            </div>
            <div className="flex items-center text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+{stats?.newUsersThisMonth || 0}</span>
              <span className="text-gray-500 ml-1">이번 달</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              학생 {stats?.usersByRole?.STUDENT || 0} | 선생님 {stats?.usersByRole?.TEACHER || 0} | 학원장 {stats?.usersByRole?.DIRECTOR || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/academies")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              등록된 학원
            </CardTitle>
            <Building2 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats?.totalAcademies || 0}개
            </div>
            <div className="flex items-center text-sm mt-2">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-gray-500">활성 {stats?.activeAcademies || 0}개</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              평균 학생 수: {stats?.averageStudentsPerAcademy || 0}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/ai-bots")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI 봇
            </CardTitle>
            <Bot className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totalBots || 0}개
            </div>
            <div className="flex items-center text-sm mt-2">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-gray-500">활성 {stats?.activeBots || 0}개</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              이번 달 대화: {stats?.conversationsThisMonth || 0}건
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/dashboard/admin/inquiries")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              문의 사항
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.totalInquiries || 0}건
            </div>
            <div className="flex items-center text-sm mt-2">
              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">대기 {stats?.pendingInquiries || 0}건</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              완료 {stats?.resolvedInquiries || 0}건
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 승인 대기 알림 */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          승인 대기
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 카카오 채널 승인 */}
          <Card className="border-2 border-yellow-200 hover:shadow-lg transition-shadow cursor-pointer bg-yellow-50"
                onClick={() => router.push("/dashboard/admin/kakao-approvals")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
                카카오 채널 신청
                {stats?.pendingKakaoChannels > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {stats.pendingKakaoChannels}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-yellow-700">
                승인 대기 중인 카카오 채널 신청
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingKakaoChannels || 0}건
              </div>
              <Button className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 text-white">
                승인 관리
              </Button>
            </CardContent>
          </Card>

          {/* 포인트 충전 승인 */}
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow cursor-pointer bg-green-50"
                onClick={() => router.push("/dashboard/admin/point-approvals")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5 text-green-600" />
                포인트 충전 승인
                {stats?.pendingPointApprovals > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {stats.pendingPointApprovals}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-green-700">
                승인 대기 중인 포인트 충전 신청
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.pendingPointApprovals || 0}건
              </div>
              <Button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white">
                승인 관리
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 빠른 액세스 메뉴 */}
      <div>
        <h2 className="text-xl font-bold mb-4">빠른 액세스</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
                onClick={() => router.push("/dashboard/admin/store-management")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                🛒 AI 쇼핑몰 관리
              </CardTitle>
              <CardDescription>
                AI 쇼핑몰 제품을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
                onClick={() => router.push("/dashboard/admin/store-management/create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                ➕ AI 쇼핑몰 제품 추가
              </CardTitle>
              <CardDescription>
                새로운 AI 봇 제품을 쇼핑몰에 등록합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">제품 추가</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200"
                onClick={() => router.push("/dashboard/admin/academy-statistics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                📊 학원별 통계
              </CardTitle>
              <CardDescription>
                학원별 학생, 출석, 숙제 통계를 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">통계 보기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-amber-200"
                onClick={() => router.push("/dashboard/admin/logs")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                📋 상세 기록
              </CardTitle>
              <CardDescription>
                시스템 로그 및 사용자 활동을 확인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">기록 보기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                사용자 관리
              </CardTitle>
              <CardDescription>
                전체 사용자를 관리하고 역할을 수정합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/academies")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                학원 관리
              </CardTitle>
              <CardDescription>
                등록된 학원 정보를 조회하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/ai-bots")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-600" />
                AI 봇 관리
              </CardTitle>
              <CardDescription>
                AI 챗봇을 생성하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/ai-bots/create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AI 봇 제작
              </CardTitle>
              <CardDescription>
                새로운 AI 챗봇을 만듭니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">새로 만들기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
                onClick={() => router.push("/dashboard/admin/ai-bots/assign")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                AI 봇 할당
              </CardTitle>
              <CardDescription>
                사용자에게 AI 봇을 할당합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">할당하기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/inquiries")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                문의 관리
              </CardTitle>
              <CardDescription>
                사용자 문의를 확인하고 답변합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200"
                onClick={() => router.push("/dashboard/admin/payment-approvals")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                💳 결제 승인
              </CardTitle>
              <CardDescription>
                결제 요청을 검토하고 승인합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
                onClick={() => router.push("/dashboard/admin/bot-shop-approvals")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                🛒 봇 쇼핑몰 결제 승인
              </CardTitle>
              <CardDescription>
                학원장의 봇 구매 요청을 승인하거나 거절합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">바로가기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard/admin/system")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 전역 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">설정</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200"
                onClick={() => router.push("/dashboard/admin/landing-pages")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                📄 학습 리포트 랜딩페이지
              </CardTitle>
              <CardDescription>
                학생의 학습 데이터를 학부모에게 공유할 랜딩페이지를 제작합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">제작하기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-teal-200"
                onClick={() => router.push("/dashboard/admin/sms")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-teal-600" />
                📱 문자 발송
              </CardTitle>
              <CardDescription>
                학부모에게 학습 리포트 및 공지사항을 문자로 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">발송하기</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-pink-200"
                onClick={() => router.push("/dashboard/ppt-create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-pink-600" />
                📊 PPT 제작
              </CardTitle>
              <CardDescription>
                내용을 입력하면 자동으로 프레젠테이션 파일을 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">제작하기</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              최근 가입 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentUsers || []).slice(0, 5).map((recentUser: any) => (
                <div key={recentUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{recentUser.name}</p>
                    <p className="text-sm text-gray-600">{recentUser.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {recentUser.role === "STUDENT" ? "학생" : 
                       recentUser.role === "TEACHER" ? "선생님" : 
                       recentUser.role === "DIRECTOR" ? "학원장" : "관리자"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(recentUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <p className="text-center text-gray-500 py-8">최근 가입 사용자가 없습니다</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              대기 중인 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentInquiries || []).slice(0, 5).map((inquiry: any) => (
                <div key={inquiry.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{inquiry.subject}</p>
                    <p className="text-xs text-gray-600 mt-1">{inquiry.userName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {inquiry.status === "PENDING" ? "대기" : "처리중"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {(!stats?.recentInquiries || stats.recentInquiries.length === 0) && (
              <p className="text-center text-gray-500 py-8">대기 중인 문의가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 데이터 관리 & 추출 섹션 */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6 text-indigo-600" />
          데이터 관리 & 추출
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 전체 회원 추출 */}
          <Card className="border-2 border-indigo-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-indigo-50 to-white"
                onClick={() => window.open('/api/admin/export-users?type=all', '_blank')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Download className="h-5 w-5 text-indigo-600" />
                전체 회원 DB 추출
              </CardTitle>
              <CardDescription>
                모든 회원 정보를 엑셀로 내보내기
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 전체 사용자 정보</p>
                <p>• 요금제 정보 포함</p>
                <p>• CSV 형식 (Excel 호환)</p>
              </div>
            </CardContent>
          </Card>

          {/* 활성 회원 추출 */}
          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-white"
                onClick={() => window.open('/api/admin/export-users?type=active', '_blank')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <UserCheck className="h-5 w-5 text-green-600" />
                활성 회원 DB 추출
              </CardTitle>
              <CardDescription>
                최근 30일 내 활동한 회원
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 최근 30일 활동 회원</p>
                <p>• 구독 상태 포함</p>
                <p>• 활성 사용자 분석용</p>
              </div>
            </CardContent>
          </Card>

          {/* 비활성/탈퇴 예정 회원 추출 */}
          <Card className="border-2 border-red-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-red-50 to-white"
                onClick={() => window.open('/api/admin/export-users?type=inactive', '_blank')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <UserMinus className="h-5 w-5 text-red-600" />
                비활성 회원 DB 추출
              </CardTitle>
              <CardDescription>
                90일 이상 미접속 회원
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 90일 이상 미접속</p>
                <p>• 탈퇴 대상 회원</p>
                <p>• 재활성화 캠페인용</p>
              </div>
            </CardContent>
          </Card>

          {/* 구독 없는 회원 추출 */}
          <Card className="border-2 border-yellow-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-yellow-50 to-white"
                onClick={() => window.open('/api/admin/export-users?type=no-subscription', '_blank')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                구독 없는 회원 추출
              </CardTitle>
              <CardDescription>
                요금제 미가입 학원장/선생님
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 구독 미가입 회원</p>
                <p>• 학원장/선생님만</p>
                <p>• 구독 유도용</p>
              </div>
            </CardContent>
          </Card>

          {/* 요금제별 회원 추출 */}
          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-white"
                onClick={() => router.push('/dashboard/admin/export-by-plan')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Filter className="h-5 w-5 text-purple-600" />
                요금제별 회원 추출
              </CardTitle>
              <CardDescription>
                특정 요금제 사용 회원만
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 요금제별 필터링</p>
                <p>• 사용량 정보 포함</p>
                <p>• 요금제 분석용</p>
              </div>
            </CardContent>
          </Card>

          {/* 요금제 관리 */}
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-white"
                onClick={() => router.push('/dashboard/admin/pricing')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="h-5 w-5 text-blue-600" />
                요금제 관리
              </CardTitle>
              <CardDescription>
                요금제 생성 및 수정
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• 월간/6개월/연간 설정</p>
                <p>• 기능 한도 설정</p>
                <p>• 가격 관리</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
