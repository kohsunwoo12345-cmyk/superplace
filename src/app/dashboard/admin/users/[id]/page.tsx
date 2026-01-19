"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Bot,
  Coins,
  Key,
  Save,
  User,
  Mail,
  Building2,
  Calendar,
  LogIn,
  Shield,
} from "lucide-react";

interface UserDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  points: number;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  approved: boolean;
  academy?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  lastLoginAt?: string;
  _count: {
    aiUsages: number;
    pointHistory: number;
  };
}

export default function UserDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [points, setPoints] = useState(0);
  const [aiChatEnabled, setAiChatEnabled] = useState(false);
  const [aiHomeworkEnabled, setAiHomeworkEnabled] = useState(false);
  const [aiStudyEnabled, setAiStudyEnabled] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchUserDetail();
  }, [session, status, router, userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPoints(data.user.points);
        setAiChatEnabled(data.user.aiChatEnabled);
        setAiHomeworkEnabled(data.user.aiHomeworkEnabled);
        setAiStudyEnabled(data.user.aiStudyEnabled);
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points,
          aiChatEnabled,
          aiHomeworkEnabled,
          aiStudyEnabled,
        }),
      });

      if (response.ok) {
        alert("설정이 저장되었습니다.");
        fetchUserDetail();
      } else {
        const data = await response.json();
        alert(data.error || "설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (!confirm("해당 사용자의 비밀번호를 변경하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert("비밀번호가 변경되었습니다.");
        setNewPassword("");
      } else {
        const data = await response.json();
        alert(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleAddPoints = async (amount: number) => {
    if (!confirm(`${amount} 포인트를 ${amount > 0 ? "지급" : "회수"}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: "관리자 지급/회수" }),
      });

      if (response.ok) {
        alert("포인트가 처리되었습니다.");
        fetchUserDetail();
      } else {
        const data = await response.json();
        alert(data.error || "포인트 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("포인트 처리 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleImpersonate = async () => {
    if (!confirm("해당 사용자 계정으로 로그인하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("로그인 실패");
      }
    } catch (error) {
      console.error("Impersonate 실패:", error);
      alert("오류가 발생했습니다.");
    }
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

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">사용자를 찾을 수 없습니다.</p>
            <Button onClick={() => router.back()} className="mt-4">
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500";
      case "DIRECTOR":
        return "bg-purple-500";
      case "TEACHER":
        return "bg-blue-500";
      case "STUDENT":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "시스템 관리자";
      case "DIRECTOR":
        return "학원장";
      case "TEACHER":
        return "선생님";
      case "STUDENT":
        return "학생";
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold">사용자 상세 정보</h1>
          </div>
        </div>
        <Button onClick={handleImpersonate} variant="outline">
          <LogIn className="w-4 h-4 mr-2" />
          계정으로 로그인
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📱</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.academy && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {user.academy.name} ({user.academy.code})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>가입일: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <LogIn className="w-4 h-4" />
                    <span>
                      최근 로그인: {new Date(user.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">승인 상태</span>
                <Badge variant={user.approved ? "default" : "outline"}>
                  {user.approved ? "승인됨" : "승인 대기"}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">AI 사용 내역</span>
                <span className="font-semibold">{user._count.aiUsages}회</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">포인트 내역</span>
                <span className="font-semibold">{user._count.pointHistory}건</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 설정 및 권한 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              설정 및 권한 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 포인트 관리 */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-yellow-600" />
                포인트 관리
              </Label>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    placeholder="포인트"
                  />
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {points.toLocaleString()} P
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(100)}
                >
                  +100P
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(500)}
                >
                  +500P
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(1000)}
                >
                  +1000P
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(-100)}
                  className="text-red-600"
                >
                  -100P
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(-500)}
                  className="text-red-600"
                >
                  -500P
                </Button>
              </div>
            </div>

            {/* AI 봇 권한 */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-indigo-600" />
                AI 봇 권한
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">AI 채팅 도우미</p>
                    <p className="text-sm text-gray-600">
                      학습 관련 질문에 답변하는 AI 챗봇
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={aiChatEnabled}
                      onChange={(e) => setAiChatEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">AI 숙제 검사</p>
                    <p className="text-sm text-gray-600">
                      영어 숙제를 자동으로 검사하고 피드백
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={aiHomeworkEnabled}
                      onChange={(e) => setAiHomeworkEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">AI 학습 도우미</p>
                    <p className="text-sm text-gray-600">
                      맞춤형 학습 계획 및 자료 추천
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={aiStudyEnabled}
                      onChange={(e) => setAiStudyEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-red-600" />
                비밀번호 변경
              </Label>
              <div className="flex gap-3">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (8자 이상)"
                />
                <Button onClick={handleChangePassword} variant="outline">
                  비밀번호 변경
                </Button>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "저장 중..." : "설정 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
