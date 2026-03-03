"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Bell, Shield, CreditCard, Calendar, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setName(userData.name || "");
    setEmail(userData.email || "");
    setPhone(userData.phone || "");
    
    console.log("사용자 정보:", userData);
    console.log("사용자 역할:", userData.role);
    console.log("학원 ID:", userData.academyId);
    
    // 구독 정보 가져오기
    if (userData.role === "DIRECTOR") {
      if (userData.academyId) {
        console.log("학원장 계정 - 구독 정보 조회");
        fetchSubscription(userData.academyId);
        fetchAlerts(userData.academyId);
        fetchTrends(userData.academyId, trendPeriod);
      } else {
        console.warn("학원장 계정이지만 academyId가 없습니다.");
        setLoadingSubscription(false);
        setSubscription(null);
      }
    } else {
      console.log("학원장이 아닌 계정 - 구독 정보 조회 건너뛰기");
      setLoadingSubscription(false);
    }
  }, [router]);
  
  const fetchSubscription = async (academyId: string) => {
    try {
      console.log("구독 정보 조회 시작 - academyId:", academyId);
      
      const response = await fetch(`/api/subscription/check?academyId=${academyId}`);
      console.log("API 응답 상태:", response.status);
      
      const data = await response.json();
      console.log("API 응답 데이터:", data);
      
      if (data.success && data.hasSubscription) {
        console.log("구독 정보 설정:", data.subscription);
        setSubscription(data.subscription);
      } else {
        console.log("활성 구독 없음:", data.message);
        setSubscription(null);
      }
    } catch (error) {
      console.error("구독 정보 로드 실패:", error);
      setSubscription(null);
    } finally {
      console.log("구독 정보 로딩 완료");
      setLoadingSubscription(false);
    }
  };
  
  const fetchAlerts = async (academyId: string) => {
    try {
      const response = await fetch(`/api/subscription/get-usage-alerts?academyId=${academyId}&unreadOnly=true`);
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("알림 조회 실패:", error);
    }
  };
  
  const fetchTrends = async (academyId: string, period: string) => {
    try {
      const response = await fetch(`/api/subscription/usage-trends?academyId=${academyId}&period=${period}`);
      const data = await response.json();
      if (data.success) {
        setTrends(data);
      }
    } catch (error) {
      console.error("트렌드 조회 실패:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (response.ok) {
        const updatedUser = { ...user, name, phone };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("프로필이 업데이트되었습니다.");
      } else {
        alert("프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        alert("비밀번호가 변경되었습니다.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert("비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">설정</h1>
        <p className="text-gray-600">계정 설정을 관리합니다</p>
      </div>

      {/* 원장 계정인 경우 구독 정보 표시 */}
      {user.role === "DIRECTOR" && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              현재 플랜
            </CardTitle>
            <CardDescription>
              현재 구독 중인 요금제 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubscription ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : subscription && subscription.planName ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">플랜</div>
                      <div className="font-semibold text-lg">{subscription.planName}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">만료일</div>
                      <div className="font-semibold">
                        {new Date(subscription.endDate).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 text-gray-700">사용 한도</h4>
                  <div className="space-y-4">
                    {/* 학생 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">학생</div>
                        <div className="text-sm font-bold text-blue-600">
                          {subscription.usage.students || 0}
                          <span className="text-gray-500">
                            {subscription.limits.maxStudents === -1 
                              ? " / 무제한" 
                              : ` / ${subscription.limits.maxStudents}`}
                          </span>
                        </div>
                      </div>
                      {subscription.limits.maxStudents !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((subscription.usage.students || 0) / subscription.limits.maxStudents) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    {/* 숙제 검사 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">숙제 검사</div>
                        <div className="text-sm font-bold text-green-600">
                          {subscription.usage.homeworkChecks || 0}
                          <span className="text-gray-500">
                            {subscription.limits.maxHomeworkChecks === -1 
                              ? " / 무제한" 
                              : ` / ${subscription.limits.maxHomeworkChecks}`}
                          </span>
                        </div>
                      </div>
                      {subscription.limits.maxHomeworkChecks !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((subscription.usage.homeworkChecks || 0) / subscription.limits.maxHomeworkChecks) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    {/* AI 분석 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">AI 분석</div>
                        <div className="text-sm font-bold text-purple-600">
                          {subscription.usage.aiAnalysis || 0}
                          <span className="text-gray-500">
                            {subscription.limits.maxAIAnalysis === -1 
                              ? " / 무제한" 
                              : ` / ${subscription.limits.maxAIAnalysis}`}
                          </span>
                        </div>
                      </div>
                      {subscription.limits.maxAIAnalysis !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((subscription.usage.aiAnalysis || 0) / subscription.limits.maxAIAnalysis) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    {/* 유사문제 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">유사문제</div>
                        <div className="text-sm font-bold text-orange-600">
                          {subscription.usage.similarProblems || 0}
                          <span className="text-gray-500">
                            {subscription.limits.maxSimilarProblems === -1 
                              ? " / 무제한" 
                              : ` / ${subscription.limits.maxSimilarProblems}`}
                          </span>
                        </div>
                      </div>
                      {subscription.limits.maxSimilarProblems !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((subscription.usage.similarProblems || 0) / subscription.limits.maxSimilarProblems) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    {/* 랜딩페이지 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">랜딩페이지</div>
                        <div className="text-sm font-bold text-pink-600">
                          {subscription.usage.landingPages || 0}
                          <span className="text-gray-500">
                            {subscription.limits.maxLandingPages === -1 
                              ? " / 무제한" 
                              : ` / ${subscription.limits.maxLandingPages}`}
                          </span>
                        </div>
                      </div>
                      {subscription.limits.maxLandingPages !== -1 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((subscription.usage.landingPages || 0) / subscription.limits.maxLandingPages) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push("/pricing")}
                >
                  플랜 업그레이드
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">
                  {user.academyId 
                    ? "활성화된 구독이 없습니다" 
                    : "학원 정보가 설정되지 않았습니다. 관리자에게 문의하세요."}
                </p>
                {user.academyId && (
                  <Button onClick={() => router.push("/pricing")}>
                    요금제 선택하기
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 알림 카드 (학원장 전용) */}
      {user?.role === "DIRECTOR" && alerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              사용량 알림
            </CardTitle>
            <CardDescription>
              한도 도달 알림 ({alerts.length}개)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert: any) => (
                <div 
                  key={alert.id} 
                  className="p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">
                        {alert.typeLabel}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {alert.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString("ko-KR")}
                      </div>
                    </div>
                    <Badge 
                      variant={alert.threshold >= 100 ? "destructive" : "secondary"}
                      className="ml-2"
                    >
                      {alert.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용량 트렌드 카드 (학원장 전용) */}
      {user?.role === "DIRECTOR" && trends && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              사용량 트렌드
            </CardTitle>
            <CardDescription>
              기간별 사용량 통계
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Button 
                size="sm" 
                variant={trendPeriod === 'daily' ? 'default' : 'outline'}
                onClick={() => {
                  setTrendPeriod('daily');
                  if (user?.academyId) fetchTrends(user.academyId, 'daily');
                }}
              >
                일별
              </Button>
              <Button 
                size="sm" 
                variant={trendPeriod === 'weekly' ? 'default' : 'outline'}
                onClick={() => {
                  setTrendPeriod('weekly');
                  if (user?.academyId) fetchTrends(user.academyId, 'weekly');
                }}
              >
                주별
              </Button>
              <Button 
                size="sm" 
                variant={trendPeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => {
                  setTrendPeriod('monthly');
                  if (user?.academyId) fetchTrends(user.academyId, 'monthly');
                }}
              >
                월별
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">AI 분석</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {trends.summary?.totalAIAnalysis || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {trendPeriod === 'daily' ? '최근 30일' : trendPeriod === 'weekly' ? '최근 12주' : '최근 12개월'}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">숙제 검사</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {trends.summary?.totalHomework || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {trendPeriod === 'daily' ? '최근 30일' : trendPeriod === 'weekly' ? '최근 12주' : '최근 12개월'}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">유사문제</div>
                <div className="text-2xl font-bold text-orange-600 mt-1">
                  {trends.summary?.totalSimilarProblems || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {trendPeriod === 'daily' ? '최근 30일' : trendPeriod === 'weekly' ? '최근 12주' : '최근 12개월'}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">랜딩페이지</div>
                <div className="text-2xl font-bold text-pink-600 mt-1">
                  {trends.summary?.totalLandingPages || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {trendPeriod === 'daily' ? '최근 30일' : trendPeriod === 'weekly' ? '최근 12주' : '최근 12개월'}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="text-sm text-gray-600">현재 학생</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {trends.currentUsage?.students || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  활성 학생 수
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            프로필
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            보안
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            알림
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="w-4 h-4 mr-2" />
            개인정보
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>
                기본 프로필 정보를 수정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" value={email} disabled />
                  <p className="text-sm text-gray-500 mt-1">
                    이메일은 변경할 수 없습니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <Label>역할</Label>
                  <Input value={user.role} disabled />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "저장 중..." : "변경사항 저장"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>비밀번호 변경</CardTitle>
              <CardDescription>
                계정 보안을 위해 정기적으로 비밀번호를 변경하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>
                알림 수신 방법을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">알림 설정 기능은 곧 추가됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>개인정보 설정</CardTitle>
              <CardDescription>
                개인정보 보호 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">개인정보 설정 기능은 곧 추가됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
