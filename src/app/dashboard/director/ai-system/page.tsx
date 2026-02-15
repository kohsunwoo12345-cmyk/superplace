"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Users, GraduationCap, Plus, Trash2, Calendar,
  Search, Filter, CheckCircle, XCircle, Clock, RefreshCw
} from "lucide-react";

interface BotAssignment {
  id: number;
  botId: number;
  botName: string;
  botIcon: string;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: 'STUDENT' | 'TEACHER';
  assignedAt: string;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED';
}

interface Bot {
  id: number;
  name: string;
  description: string;
  profileIcon: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function DirectorAISystemPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 봇 할당 관련
  const [assignments, setAssignments] = useState<BotAssignment[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  
  // 할당 폼
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  
  // 검색 및 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role?.toUpperCase() !== 'DIRECTOR') {
        alert("학원장만 접근할 수 있습니다");
        router.push("/dashboard");
        return;
      }
      setUser(userData);
      loadData();
    } catch (error) {
      console.error("Failed to parse user data:", error);
      router.push("/login");
    }
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // 봇 목록 조회
      const botsResponse = await fetch("/api/director/ai-bots", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        setBots(botsData.bots || []);
      }
      
      // 학생 목록 조회
      const studentsResponse = await fetch("/api/director/users?role=STUDENT", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.users || []);
      }
      
      // 교사 목록 조회
      const teachersResponse = await fetch("/api/director/users?role=TEACHER", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.users || []);
      }
      
      // 할당 목록 조회
      await loadAssignments();
      
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/director/bot-assignments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    }
  };

  const handleAssignBot = async () => {
    if (!selectedBot || !selectedUser) {
      alert("봇과 사용자를 선택해주세요");
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/director/bot-assignments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          botId: selectedBot,
          userId: selectedUser,
          userRole: selectedUserType,
          expiresAt: expiryDate || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`봇이 할당되었습니다 (ID: ${result.assignmentId})`);
        
        // 폼 초기화
        setSelectedBot(null);
        setSelectedUser(null);
        setExpiryDate("");
        
        // 목록 새로고침
        await loadAssignments();
      } else {
        const error = await response.json();
        throw new Error(error.error || "할당에 실패했습니다");
      }
    } catch (error: any) {
      console.error("Failed to assign bot:", error);
      alert(`할당 실패: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm("정말 이 할당을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/director/bot-assignments/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert("할당이 삭제되었습니다");
        await loadAssignments();
      } else {
        throw new Error("삭제에 실패했습니다");
      }
    } catch (error: any) {
      console.error("Failed to remove assignment:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = 
      a.botName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "ALL" || a.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const userList = selectedUserType === 'STUDENT' ? students : teachers;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="w-8 h-8 text-indigo-600" />
          AI 시스템 관리
        </h1>
        <p className="text-gray-600 mt-2">학생과 교사에게 AI 챗봇을 할당하고 관리합니다</p>
      </div>

      <Tabs defaultValue="assign" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign">봇 할당</TabsTrigger>
          <TabsTrigger value="list">할당 목록</TabsTrigger>
        </TabsList>

        {/* 봇 할당 탭 */}
        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>새 봇 할당</CardTitle>
              <CardDescription>학생이나 교사에게 AI 챗봇을 할당합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 사용자 유형 선택 */}
              <div>
                <Label>사용자 유형 *</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={selectedUserType === 'STUDENT' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedUserType('STUDENT');
                      setSelectedUser(null);
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    학생
                  </Button>
                  <Button
                    type="button"
                    variant={selectedUserType === 'TEACHER' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedUserType('TEACHER');
                      setSelectedUser(null);
                    }}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    교사
                  </Button>
                </div>
              </div>

              {/* 봇 선택 */}
              <div>
                <Label htmlFor="bot-select">AI 봇 선택 *</Label>
                <select
                  id="bot-select"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedBot || ""}
                  onChange={(e) => setSelectedBot(parseInt(e.target.value))}
                  required
                >
                  <option value="">봇을 선택하세요</option>
                  {bots.filter(b => b.status === 'ACTIVE').map(bot => (
                    <option key={bot.id} value={bot.id}>
                      {bot.profileIcon} {bot.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 사용자 선택 */}
              <div>
                <Label htmlFor="user-select">
                  {selectedUserType === 'STUDENT' ? '학생' : '교사'} 선택 *
                </Label>
                <select
                  id="user-select"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(parseInt(e.target.value))}
                  required
                >
                  <option value="">
                    {selectedUserType === 'STUDENT' ? '학생을' : '교사를'} 선택하세요
                  </option>
                  {userList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* 만료일 */}
              <div>
                <Label htmlFor="expiry-date">만료일 (선택)</Label>
                <Input
                  id="expiry-date"
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  설정하지 않으면 무제한으로 사용할 수 있습니다
                </p>
              </div>

              {/* 할당 버튼 */}
              <Button
                onClick={handleAssignBot}
                disabled={assigning || !selectedBot || !selectedUser}
                className="w-full"
              >
                {assigning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    할당 중...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    봇 할당하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 할당 목록 탭 */}
        <TabsContent value="list" className="space-y-6">
          {/* 검색 및 필터 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="봇 이름 또는 사용자 이름으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("ALL")}
                  >
                    전체
                  </Button>
                  <Button
                    variant={filterStatus === "ACTIVE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("ACTIVE")}
                  >
                    활성
                  </Button>
                  <Button
                    variant={filterStatus === "EXPIRED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("EXPIRED")}
                  >
                    만료
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAssignments}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 할당 목록 */}
          <div className="grid gap-4">
            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  할당된 봇이 없습니다
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map(assignment => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-3xl">{assignment.botIcon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{assignment.botName}</h3>
                            <Badge variant={assignment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {assignment.status === 'ACTIVE' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  활성
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  만료
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline">
                              {assignment.userRole === 'STUDENT' ? '학생' : '교사'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {assignment.userName} ({assignment.userEmail})
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              할당: {new Date(assignment.assignedAt).toLocaleDateString('ko-KR')}
                            </span>
                            {assignment.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                만료: {new Date(assignment.expiresAt).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
