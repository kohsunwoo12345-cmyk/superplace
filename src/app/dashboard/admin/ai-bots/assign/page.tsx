// Force rebuild: 2026-02-13 16:18:01
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
  isWithdrawn?: boolean;
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
    let isMounted = true;
    
    const initializePage = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        if (!isMounted) return;
        
        setCurrentUser(userData);
        
        console.log("📋 User data:", userData);
        console.log("✅ AI Bot Assign page access granted");

        // 권한 체크
        const role = userData.role?.toUpperCase();
        if (!['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'TEACHER'].includes(role)) {
          alert('AI 봇 할당 권한이 없습니다.');
          router.push('/dashboard');
          return;
        }

        // userData를 직접 전달
        if (isMounted) {
          await fetchData(userData);
        }
      } catch (error) {
        console.error("초기화 오류:", error);
        if (isMounted) {
          alert("페이지 로드 중 오류가 발생했습니다.");
          router.push('/dashboard');
        }
      }
    };
    
    initializePage();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = async (userData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log('🔍 Current user:', userData);
      console.log('🔍 Academy ID:', userData?.academyId);
      
      // 학원장/선생님은 자신의 학원에 할당된 봇만 조회
      const role = userData?.role?.toUpperCase();
      let botsEndpoint = "/api/admin/ai-bots";
      
      if (role === 'DIRECTOR' || role === 'TEACHER') {
        // 학원장/선생님: 자신의 학원에 할당된 봇만
        const academyId = userData?.academyId;
        if (!academyId) {
          alert('학원 정보가 없습니다. 관리자에게 문의하세요.');
          setLoading(false);
          return;
        }
        botsEndpoint = `/api/user/ai-bots?academyId=${academyId}`;
        console.log('🔒 DIRECTOR/TEACHER: Using assigned bots only from', botsEndpoint);
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        // 관리자: 모든 봇
        console.log('🔓 ADMIN: Using all bots from', botsEndpoint);
      } else {
        alert('AI 봇 할당 권한이 없습니다.');
        router.push('/dashboard');
        return;
      }
      
      // AI 봇 목록 조회
      const botsResponse = await fetch(botsEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        console.log('✅ Bots loaded:', botsData);
        setBots(botsData.bots || []);
        
        if ((botsData.bots || []).length === 0) {
          alert('할당된 AI 봇이 없습니다.\n관리자에게 봇 할당을 요청하세요.');
        }
      } else {
        const errorData = await botsResponse.json().catch(() => ({}));
        console.error('❌ Failed to load bots:', errorData);
        alert(`봇 목록 로드 실패: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
      }

      // 사용자 목록 조회 (자신의 학원 사용자만)
      const usersResponse = await fetch("/api/admin/users", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users loaded:', usersData);
        setUsers(usersData.users || []);
      } else {
        console.error('❌ Failed to load users');
      }

      // 기존 할당 목록 조회
      const assignmentsResponse = await fetch("/api/admin/ai-bots/assignments", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log('✅ Assignments loaded:', assignmentsData);
        setAssignments(assignmentsData.assignments || []);
      } else {
        console.error('❌ Failed to load assignments');
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert(`데이터 로드 실패: ${error}`);
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

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/ai-bots/assign", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          botId: selectedBot,
          userId: selectedUser, // userId를 TEXT로 전송 (parseInt 제거)
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
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchData(userData);
        }
      } else {
        // 상세 오류 메시지 표시
        const errorMessage = data.message || data.error || "알 수 없는 오류";
        alert(`❌ 할당 실패\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error("할당 오류:", error);
      alert("할당 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    if (!confirm("정말 이 할당을 취소하시겠습니까?\n\n취소하면 구독 슬롯이 복원되어 다른 학생에게 재할당할 수 있습니다.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/ai-bots/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ 할당이 취소되었습니다.\n\n구독 슬롯이 복원되어 다른 학생에게 재할당할 수 있습니다.");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchData(userData);
        }
      } else {
        const errorMessage = data.message || data.error || "알 수 없는 오류";
        alert(`❌ 취소 실패\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error("취소 오류:", error);
      alert("취소 중 오류가 발생했습니다.");
    }
  };

  // 퇴원생 제외 - 안전한 배열 처리
  const activeUsers = (users || []).filter(user => !user?.isWithdrawn);

  // 역할별로 사용자 필터링
  const filteredUsers = selectedRole === "all" 
    ? activeUsers
    : activeUsers.filter(user => {
        if (selectedRole === "ACADEMY") return user.role === "DIRECTOR" || user.role === "member";
        if (selectedRole === "TEACHER") return user.role === "TEACHER" || user.role === "user";
        if (selectedRole === "STUDENT") return user.role === "STUDENT";
        return false;
      });

  // 역할별 사용자 수 (퇴원생 제외)
  const roleStats = {
    all: activeUsers.length,
    academy: activeUsers.filter(u => u?.role === "DIRECTOR" || u?.role === "member").length,
    teacher: activeUsers.filter(u => u?.role === "TEACHER" || u?.role === "user").length,
    student: activeUsers.filter(u => u?.role === "STUDENT").length,
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
                  {(bots || []).filter(bot => bot?.isActive).map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                활성화된 봇만 표시됩니다 ({(bots || []).filter(b => b?.isActive).length}개)
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
          {(assignments || []).length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">할당된 봇이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(assignments || []).map((assignment) => (
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
