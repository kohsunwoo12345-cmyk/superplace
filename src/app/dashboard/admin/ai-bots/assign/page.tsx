"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Users,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface AIBot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  botId: string;
  botName: string;
  userId: number;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit: string;
  status: string;
  createdAt: string;
}

export default function AIBotAssignPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 데이터
  const [bots, setBots] = useState<AIBot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // 폼 상태
  const [selectedBot, setSelectedBot] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState("month");
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // ADMIN, SUPER_ADMIN, DIRECTOR(학원 원장) 접근 허용
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "DIRECTOR", "member"];
    if (!allowedRoles.includes(userData.role)) {
      alert("접근 권한이 없습니다. 관리자 또는 학원 원장만 접근 가능합니다.");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // AI 봇 목록 조회
      const botsResponse = await fetch("/api/admin/ai-bots");
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        setBots(botsData.bots || []);
      }

      // 사용자 목록 조회
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // 기존 할당 목록 조회
      const assignmentsResponse = await fetch("/api/admin/ai-bots/assignments");
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBot || !selectedUser || !duration) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    const durationNumber = parseInt(duration);
    if (isNaN(durationNumber) || durationNumber < 1) {
      alert("기간은 1 이상의 숫자여야 합니다.");
      return;
    }

    // 최대 기간 검증
    if (durationUnit === "day" && durationNumber > 36500) {
      alert("일 단위는 최대 36,500일(100년)까지 가능합니다.");
      return;
    }
    if (durationUnit === "month" && durationNumber > 1200) {
      alert("월 단위는 최대 1,200개월(100년)까지 가능합니다.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/admin/ai-bots/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: selectedBot,
          userId: parseInt(selectedUser),
          duration: durationNumber,
          durationUnit,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ AI 봇이 성공적으로 할당되었습니다!\n\n사용자: ${data.assignment.userName}\n봇: ${data.assignment.botName}\n기간: ${data.assignment.duration}${data.assignment.durationUnit === 'day' ? '일' : '개월'}\n종료일: ${data.assignment.endDate}`);
        
        // 폼 초기화
        setSelectedBot("");
        setSelectedUser("");
        setDuration("1");
        setDurationUnit("month");
        
        // 할당 목록 새로고침
        fetchData();
      } else {
        alert(`❌ 할당 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("할당 오류:", error);
      alert("할당 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    if (!confirm("정말 이 할당을 취소하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ai-bots/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ 할당이 취소되었습니다.");
        fetchData();
      } else {
        alert(`❌ 취소 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("취소 오류:", error);
      alert("취소 중 오류가 발생했습니다.");
    }
  };

  // 역할별로 사용자 필터링
  const filteredUsers = selectedRole === "all" 
    ? users 
    : users.filter(user => {
        if (selectedRole === "ACADEMY") return user.role === "DIRECTOR" || user.role === "member";
        if (selectedRole === "TEACHER") return user.role === "TEACHER" || user.role === "user";
        if (selectedRole === "STUDENT") return user.role === "STUDENT";
        return false;
      });

  // 역할별 사용자 수
  const roleStats = {
    all: users.length,
    academy: users.filter(u => u.role === "DIRECTOR" || u.role === "member").length,
    teacher: users.filter(u => u.role === "TEACHER" || u.role === "user").length,
    student: users.filter(u => u.role === "STUDENT").length,
  };

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/ai-bots")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-blue-600" />
              AI 봇 할당
            </h1>
            <p className="text-gray-600 mt-1">
              사용자에게 AI 봇을 할당하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 할당 폼 */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            새 봇 할당
          </CardTitle>
          <CardDescription>
            사용자를 선택하고 AI 봇을 할당하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI 봇 선택 */}
            <div className="space-y-2">
              <Label htmlFor="bot">AI 봇 선택</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger id="bot">
                  <SelectValue placeholder="봇을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {bots.filter(bot => bot.isActive).map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                활성화된 봇만 표시됩니다 ({bots.filter(b => b.isActive).length}개)
              </p>
            </div>

            {/* 역할 필터 */}
            <div className="space-y-2">
              <Label htmlFor="role-filter">사용자 역할 필터</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="역할을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    전체 ({roleStats.all}명)
                  </SelectItem>
                  <SelectItem value="ACADEMY">
                    학원 원장 ({roleStats.academy}명)
                  </SelectItem>
                  <SelectItem value="TEACHER">
                    선생님 ({roleStats.teacher}명)
                  </SelectItem>
                  <SelectItem value="STUDENT">
                    학생 ({roleStats.student}명)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                역할별로 사용자를 필터링합니다
              </p>
            </div>

            {/* 사용자 선택 */}
            <div className="space-y-2">
              <Label htmlFor="user">사용자 선택</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="사용자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {filteredUsers.length}명의 사용자
              </p>
            </div>

            {/* 기간 입력 */}
            <div className="space-y-2">
              <Label htmlFor="duration">사용 기간</Label>
              <div className="flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max={durationUnit === "day" ? "36500" : "1200"}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="기간"
                  className="flex-1"
                />
                <Select value={durationUnit} onValueChange={setDurationUnit}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">일</SelectItem>
                    <SelectItem value="month">개월</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500">
                {durationUnit === "day"
                  ? "최대 36,500일(100년) 가능"
                  : "최대 1,200개월(100년) 가능"}
              </p>
            </div>

            {/* 할당 버튼 */}
            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={submitting || !selectedBot || !selectedUser}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    할당 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    봇 할당하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기존 할당 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            할당 목록
          </CardTitle>
          <CardDescription>현재 활성화된 AI 봇 할당</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">할당된 봇이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-semibold">
                        {assignment.botName}
                      </Badge>
                      <span className="text-sm text-gray-600">→</span>
                      <p className="font-semibold">{assignment.userName}</p>
                      <span className="text-sm text-gray-500">
                        ({assignment.userEmail})
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {assignment.duration}
                        {assignment.durationUnit === "day" ? "일" : "개월"}
                      </span>
                      <span>
                        시작: {assignment.startDate}
                      </span>
                      <span>
                        종료: {assignment.endDate}
                      </span>
                      <Badge
                        variant={
                          assignment.status === "active" ? "default" : "secondary"
                        }
                      >
                        {assignment.status === "active" ? "활성" : "만료"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevoke(assignment.id)}
                  >
                    취소
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
