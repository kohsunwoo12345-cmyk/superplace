"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Phone,
  MessageSquare,
  History,
  Users,
  TrendingUp,
  Loader2,
  ArrowRight,
  Coins,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalSent: number;
  thisMonthSent: number;
  smsCount: number;
  kakaoCount: number;
  successRate: number;
  points: number;
  senderNumbers: number;
  kakaoChannels: number;
  pendingMessages: number;
}

export default function MessageDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalSent: 0,
    thisMonthSent: 0,
    smsCount: 0,
    kakaoCount: 0,
    successRate: 0,
    points: 0,
    senderNumbers: 0,
    kakaoChannels: 0,
    pendingMessages: 0,
  });

  useEffect(() => {
    // 사용자 역할 가져오기
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role.toUpperCase());
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 사용자 포인트
      const userRes = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setStats((prev) => ({ ...prev, points: userData.user.points || 0 }));
      }

      // 발송 이력 통계
      const historyRes = await fetch("/api/messages/history?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const messages = historyData.messages || [];
        
        const totalSent = messages.length;
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthSent = messages.filter(
          (m: any) => new Date(m.sentAt) >= thisMonth
        ).length;
        const smsCount = messages.filter((m: any) => m.messageType === "SMS").length;
        const kakaoCount = messages.filter((m: any) => m.messageType === "KAKAO").length;
        const successCount = messages.filter((m: any) => m.status === "SENT").length;
        const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

        setStats((prev) => ({
          ...prev,
          totalSent,
          thisMonthSent,
          smsCount,
          kakaoCount,
          successRate,
        }));
      }

      // 발신번호 개수
      const sendersRes = await fetch("/api/sender-numbers/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sendersRes.ok) {
        const sendersData = await sendersRes.json();
        setStats((prev) => ({
          ...prev,
          senderNumbers: sendersData.senderNumbers?.length || 0,
        }));
      }

      // 카카오 채널 개수
      const kakaoRes = await fetch("/api/kakao/channels/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (kakaoRes.ok) {
        const kakaoData = await kakaoRes.json();
        setStats((prev) => ({
          ...prev,
          kakaoChannels: kakaoData.channels?.length || 0,
        }));
      }
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📨 문자 발송 관리
              </h1>
              <p className="text-gray-600">
                SMS와 카카오톡 메시지를 효율적으로 관리하세요
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/message-send")}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="w-5 h-5 mr-2" />
              메시지 발송하기
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 보유 포인트 */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                보유 포인트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.points.toLocaleString()}
                </div>
                <Coins className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                SMS: 20P/건 · 카카오: 15P/건
              </p>
            </CardContent>
          </Card>

          {/* 총 발송 건수 */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                총 발송 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalSent.toLocaleString()}
                </div>
                <Send className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                이번 달: {stats.thisMonthSent.toLocaleString()}건
              </p>
            </CardContent>
          </Card>

          {/* 성공률 */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                발송 성공률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.successRate}%
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                SMS: {stats.smsCount}건 · 카카오: {stats.kakaoCount}건
              </p>
            </CardContent>
          </Card>

          {/* 등록 현황 */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                등록 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-gray-900">
                    발신번호: {stats.senderNumbers}개
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    카카오 채널: {stats.kakaoChannels}개
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 주요 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 메시지 발송 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>메시지 발송</CardTitle>
              <CardDescription>
                SMS 또는 카카오톡으로 메시지를 발송하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/dashboard/message-send")}
                variant="ghost"
                className="w-full justify-between"
              >
                발송하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 발신번호 등록 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>발신번호 등록</CardTitle>
              <CardDescription>
                SMS 발송을 위한 발신번호를 등록하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">등록된 번호</span>
                <Badge variant={stats.senderNumbers > 0 ? "default" : "secondary"}>
                  {stats.senderNumbers}개
                </Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/sender-number-register")}
                variant="ghost"
                className="w-full justify-between"
              >
                관리하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 카카오 알림톡 발송 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-yellow-200">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle>카카오 알림톡</CardTitle>
              <CardDescription>
                템플릿으로 카카오 알림톡을 발송하세요 (15P/건)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">등록된 채널</span>
                <Badge variant={stats.kakaoChannels > 0 ? "default" : "secondary"}>
                  {stats.kakaoChannels}개
                </Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/kakao-alimtalk")}
                variant="ghost"
                className="w-full justify-between"
              >
                발송하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 카카오 채널 등록 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>카카오 채널 등록</CardTitle>
              <CardDescription>
                카카오톡 발송을 위한 채널을 등록하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">등록된 채널</span>
                <Badge variant={stats.kakaoChannels > 0 ? "default" : "secondary"}>
                  {stats.kakaoChannels}개
                </Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/kakao-channel")}
                variant="ghost"
                className="w-full justify-between"
              >
                관리하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 발송 이력 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>발송 이력</CardTitle>
              <CardDescription>
                발송한 메시지의 상세 이력을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">총 발송</span>
                <Badge variant="outline">{stats.totalSent.toLocaleString()}건</Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/message-history")}
                variant="ghost"
                className="w-full justify-between"
              >
                확인하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 수신자 관리 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-pink-200 transition-colors">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>수신자 관리</CardTitle>
              <CardDescription>
                학생 및 학부모 연락처를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">학생 관리</span>
                <Badge variant="outline">관리 중</Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/students")}
                variant="ghost"
                className="w-full justify-between"
              >
                관리하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 포인트 충전 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-green-200">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <Coins className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>포인트 충전</CardTitle>
              <CardDescription>
                메시지 발송을 위한 포인트를 충전하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">보유 포인트</span>
                <Badge variant="default" className="bg-green-600">
                  {stats.points.toLocaleString()}P
                </Badge>
              </div>
              <Button
                onClick={() => router.push("/dashboard/point-charge")}
                variant="ghost"
                className="w-full justify-between"
              >
                충전하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 관리자 전용: 승인 관리 */}
        {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
          <>
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                승인 관리 (관리자 전용)
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 발신번호 승인 관리 */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-purple-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                    <Phone className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>발신번호 승인 관리</CardTitle>
                  <CardDescription>
                    사용자들의 발신번호 등록 신청을 승인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">대기 중인 신청</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      확인 필요
                    </Badge>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/admin/sms/registration-approval")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    승인 관리
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* 카카오 채널 승인 관리 */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-purple-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>카카오 채널 승인 관리</CardTitle>
                  <CardDescription>
                    사용자들의 카카오 채널 등록 신청을 승인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">대기 중인 신청</span>
                    <Badge variant="outline" className="bg-yellow-50">
                      확인 필요
                    </Badge>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/admin/kakao/channel-approval")}
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    승인 관리
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-5 h-5" />
              사용 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>SMS 발송:</strong> 발신번호 등록 후 사용 가능 (20P/건)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>카카오톡 발송:</strong> 카카오 채널 등록 및 승인 후 사용 가능 (15P/건)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>승인 시간:</strong> 발신번호 및 카카오 채널 승인은 1-2일 소요됩니다
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Coins className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>포인트 충전:</strong> 포인트 충전 신청 후 관리자 승인이 필요합니다
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
