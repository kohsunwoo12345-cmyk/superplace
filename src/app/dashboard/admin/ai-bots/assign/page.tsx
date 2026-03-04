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

interface Academy {
  id: string;
  name: string;
  code: string;
  directorName?: string;
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
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // 폼 상태
  const [assignType, setAssignType] = useState<"user" | "academy">("user");
  const [selectedBot, setSelectedBot] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAcademy, setSelectedAcademy] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [studentLimit, setStudentLimit] = useState("30");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState("month");
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initPage = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        
        if (!mounted) return;
        
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

        // DIRECTOR/TEACHER는 학생에게만 할당 가능하도록 설정
        if (role === 'DIRECTOR' || role === 'TEACHER') {
          setSelectedRole('STUDENT');
        }

        // userData를 직접 전달
        await fetchData(userData);
      } catch (error) {
        console.error("페이지 초기화 실패:", error);
        if (mounted) {
          alert("페이지 로드 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      }
    };

    initPage();
    
    return () => {
      mounted = false;
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
      console.log(`📡 Fetching bots from: ${botsEndpoint}`);
      console.log(`🔑 Token: ${token ? 'Present' : 'Missing'}`);
      
      const botsResponse = await fetch(botsEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Bots Response Status: ${botsResponse.status}`);
      
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        console.log('✅ Bots loaded:', botsData);
        console.log(`📦 Total bots: ${(botsData.bots || []).length}`);
        console.log(`🤖 Bot details:`, botsData.bots);
        
        setBots(botsData.bots || []);
        
        if ((botsData.bots || []).length === 0) {
          console.warn('⚠️ No bots found');
          if (role === 'DIRECTOR' || role === 'TEACHER') {
            alert('❌ 할당된 AI 봇이 없습니다.\n\n해결 방법:\n1. AI 쇼핑몰에서 봇 구독을 신청하세요\n2. 관리자의 승인을 기다려주세요\n3. 승인 후 이 페이지를 새로고침하세요');
          } else {
            alert('❌ AI 봇이 하나도 없습니다.\n\n해결 방법:\n1. AI 봇 생성 페이지에서 봇을 만드세요\n2. 봇을 활성화(isActive)하세요');
          }
        }
      } else {
        const errorData = await botsResponse.json().catch(() => ({}));
        console.error('❌ Failed to load bots:', errorData);
        console.error(`❌ Response status: ${botsResponse.status}`);
        console.error(`❌ Response statusText: ${botsResponse.statusText}`);
        alert(`❌ 봇 목록 로드 실패\n\nStatus: ${botsResponse.status}\nError: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
      }

      // 사용자 목록 조회 (자신의 학원 사용자만)
      console.log('📡 Fetching users from: /api/admin/users');
      const usersResponse = await fetch("/api/admin/users", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Users Response Status: ${usersResponse.status}`);
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users loaded:', usersData);
        console.log(`👥 Total users: ${(usersData.users || []).length}`);
        setUsers(usersData.users || []);
      } else {
        console.error(`❌ Failed to load users - Status: ${usersResponse.status}`);
        const errorData = await usersResponse.json().catch(() => ({}));
        console.error('❌ Users error:', errorData);
      }

      // 기존 할당 목록 조회
      console.log('📡 Fetching assignments from: /api/admin/ai-bots/assignments');
      const assignmentsResponse = await fetch("/api/admin/ai-bots/assignments", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Assignments Response Status: ${assignmentsResponse.status}`);
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log('✅ Assignments loaded:', assignmentsData);
        console.log(`📋 Total assignments: ${(assignmentsData.assignments || []).length}`);
        setAssignments(assignmentsData.assignments || []);
      } else {
        console.error(`❌ Failed to load assignments - Status: ${assignmentsResponse.status}`);
        const errorData = await assignmentsResponse.json().catch(() => ({}));
        console.error('❌ Assignments error:', errorData);
      }

      // ADMIN/SUPER_ADMIN인 경우 학원 목록 가져오기
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        console.log('📡 Fetching academies from: /api/admin/academies');
        const academiesResponse = await fetch("/api/admin/academies", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📊 Academies Response Status: ${academiesResponse.status}`);
        
        if (academiesResponse.ok) {
          const academiesData = await academiesResponse.json();
          console.log('✅ Academies loaded:', academiesData);
          console.log(`🏫 Total academies: ${(academiesData.academies || []).length}`);
          setAcademies(academiesData.academies || []);
        } else {
          console.error(`❌ Failed to load academies - Status: ${academiesResponse.status}`);
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert(`데이터 로드 실패: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    // 검증
    if (!selectedBot || !duration) {
      alert("AI 봇과 기간을 입력해주세요.");
      return;
    }

    if (assignType === "user" && !selectedUser) {
      alert("사용자를 선택해주세요.");
      return;
    }

    if (assignType === "academy") {
      if (!selectedAcademy) {
        alert("학원을 선택해주세요.");
        return;
      }
      const limitNumber = parseInt(studentLimit);
      if (isNaN(limitNumber) || limitNumber < 1) {
        alert("학생 수는 1 이상의 숫자여야 합니다.");
        return;
      }
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
      
      if (assignType === "academy") {
        // 학원 할당 로직 (academy-bot-subscriptions API 사용)
        const response = await fetch("/api/admin/academy-bot-subscriptions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            academyId: selectedAcademy,
            productId: selectedBot,
            studentCount: parseInt(studentLimit),
            durationValue: durationNumber,
            durationUnit: durationUnit
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const selectedAcademyName = academies.find(a => a.id === selectedAcademy)?.name || selectedAcademy;
          const selectedBotName = bots.find(b => b.id === selectedBot)?.name || selectedBot;
          
          alert(
            `✅ 학원에 AI 봇이 할당되었습니다!\n\n` +
            `학원: ${selectedAcademyName}\n` +
            `AI 봇: ${selectedBotName}\n` +
            `학생 수 제한: ${studentLimit}명\n` +
            `기간: ${durationNumber} ${durationUnit === "day" ? "일" : "개월"}`
          );
          
          // 폼 초기화
          setSelectedBot("");
          setSelectedAcademy("");
          setStudentLimit("30");
          setDuration("1");
          
          // 데이터 새로고침
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            await fetchData(JSON.parse(storedUser));
          }
        } else {
          const error = await response.json();
          alert(error.error || "할당에 실패했습니다.");
        }
      } else {
        // 사용자 개별 할당 로직 (기존 방식)
        const response = await fetch("/api/admin/ai-bots/assign", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            botId: selectedBot,
            userId: selectedUser,
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

  // 역할별로 사용자 필터링 (안전한 처리)
  // 퇴원생 제외 + 역할 필터링
  const activeUsers = (users || []).filter(user => !user.isWithdrawn);
  
  const filteredUsers = selectedRole === "all" 
    ? activeUsers
    : activeUsers.filter(user => {
        if (selectedRole === "ACADEMY") return user.role === "DIRECTOR" || user.role === "member";
        if (selectedRole === "TEACHER") return user.role === "TEACHER" || user.role === "user";
        if (selectedRole === "STUDENT") return user.role === "STUDENT";
        return false;
      });

  // 역할별 사용자 수 (안전한 처리, 퇴원생 제외)
  const roleStats = {
    all: activeUsers?.length || 0,
    academy: activeUsers?.filter(u => u.role === "DIRECTOR" || u.role === "member")?.length || 0,
    teacher: activeUsers?.filter(u => u.role === "TEACHER" || u.role === "user")?.length || 0,
    student: activeUsers?.filter(u => u.role === "STUDENT")?.length || 0,
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
          {/* 할당 타입 선택 (ADMIN/SUPER_ADMIN만) */}
          {currentUser && ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role?.toUpperCase()) && (
            <div className="mb-6 pb-6 border-b">
              <Label className="text-base font-semibold mb-3 block">할당 방식 선택</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="user"
                    checked={assignType === "user"}
                    onChange={(e) => setAssignType(e.target.value as "user")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">개별 사용자</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="academy"
                    checked={assignType === "academy"}
                    onChange={(e) => setAssignType(e.target.value as "academy")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">학원 전체 (여러 학생 할당 가능)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {assignType === "user" 
                  ? "한 명의 사용자에게 봇을 할당합니다" 
                  : "학원에 봇을 할당하면 원장/선생님이 여러 학생에게 할당할 수 있습니다"}
              </p>
            </div>
          )}

          {/* DIRECTOR/TEACHER용 안내 메시지 (grid 외부) */}
          {currentUser && ['DIRECTOR', 'TEACHER'].includes(currentUser.role?.toUpperCase()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 학원 학생들에게 AI 봇을 할당할 수 있습니다. (퇴원생 제외)
              </p>
            </div>
          )}

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

            {assignType === "user" ? (
              <>
                {/* 역할 필터 (ADMIN/SUPER_ADMIN만) */}
                {currentUser && ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role?.toUpperCase()) && (
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
                )}

                {/* 사용자 선택 */}
                <div className="space-y-2">
                  <Label htmlFor="user">사용자 선택</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="사용자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {(filteredUsers || []).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email}) - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {(filteredUsers || []).length}명의 사용자 (퇴원생 제외)
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* 학원 선택 */}
                <div className="space-y-2">
                  <Label htmlFor="academy">학원 선택</Label>
                  <Select value={selectedAcademy} onValueChange={setSelectedAcademy}>
                    <SelectTrigger id="academy">
                      <SelectValue placeholder="학원을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {(academies || []).map((academy) => (
                        <SelectItem key={academy.id} value={academy.id}>
                          {academy.name} ({academy.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {(academies || []).length}개의 학원
                  </p>
                </div>

                {/* 학생 수 제한 */}
                <div className="space-y-2">
                  <Label htmlFor="studentLimit">학생 수 제한 (명)</Label>
                  <Input
                    id="studentLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={studentLimit}
                    onChange={(e) => setStudentLimit(e.target.value)}
                    placeholder="예: 30"
                  />
                  <p className="text-xs text-gray-500">
                    이 학원에서 봇을 할당할 수 있는 최대 학생 수
                  </p>
                </div>
              </>
            )}

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
                disabled={
                  submitting || 
                  !selectedBot || 
                  (assignType === "user" ? !selectedUser : !selectedAcademy || !studentLimit)
                }
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
                    {assignType === "user" ? "사용자에게 할당" : "학원에 할당"}
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
