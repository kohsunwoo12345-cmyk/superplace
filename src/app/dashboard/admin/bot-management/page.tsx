"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Plus,
  Trash2,
  Calendar,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Academy {
  id: string;
  name: string;
  code: string;
}

interface AIBot {
  id: string;
  name: string;
  description?: string;
  profileIcon: string;
  isActive: boolean;
}

interface BotAssignment {
  id: number;
  academyId: string;
  academyName: string;
  botId: string;
  botName: string;
  botIcon: string;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  notes?: string;
}

export default function AdminBotManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 데이터
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [bots, setBots] = useState<AIBot[]>([]);
  const [assignments, setAssignments] = useState<BotAssignment[]>([]);
  
  // 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAcademy, setSelectedAcademy] = useState<string | null>(null);
  
  // 할당 모달
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAcademyId, setAssignAcademyId] = useState("");
  const [assignBotId, setAssignBotId] = useState("");
  const [assignExpiresAt, setAssignExpiresAt] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    
    // 로그인한 모든 사용자에게 접근 허용
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAcademies(),
        fetchBots(),
        fetchAssignments(),
      ]);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademies = async () => {
    try {
      const response = await fetch("/api/admin/academies");
      if (response.ok) {
        const data = await response.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error("학원 목록 로드 실패:", error);
    }
  };

  const fetchBots = async () => {
    try {
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/admin/bot-assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("봇 할당 목록 로드 실패:", error);
    }
  };

  const handleAssignBot = async () => {
    if (!assignAcademyId || !assignBotId) {
      alert("학원과 봇을 선택해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/admin/bot-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academyId: assignAcademyId,
          botId: assignBotId,
          expiresAt: assignExpiresAt || null,
          notes: assignNotes,
        }),
      });

      if (response.ok) {
        alert("봇이 할당되었습니다.");
        setShowAssignModal(false);
        resetAssignForm();
        fetchAssignments();
      } else {
        const data = await response.json();
        alert(data.message || "봇 할당 실패");
      }
    } catch (error) {
      console.error("봇 할당 오류:", error);
      alert("봇 할당 중 오류가 발생했습니다.");
    }
  };

  const handleRevokeBot = async (assignmentId: number) => {
    if (!confirm("정말 이 봇 할당을 취소하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bot-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("봇 할당이 취소되었습니다.");
        fetchAssignments();
      } else {
        alert("봇 할당 취소 실패");
      }
    } catch (error) {
      console.error("봇 할당 취소 오류:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const resetAssignForm = () => {
    setAssignAcademyId("");
    setAssignBotId("");
    setAssignExpiresAt("");
    setAssignNotes("");
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.academyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.botName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAcademy = !selectedAcademy || assignment.academyId === selectedAcademy;
    return matchesSearch && matchesAcademy;
  });

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI 봇 관리</h1>
          <p className="text-gray-600 mt-1">
            학원별 AI 봇 할당 및 관리
          </p>
        </div>
        <Button
          onClick={() => setShowAssignModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          봇 할당
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 학원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academies.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 봇
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bots.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 할당
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter((a) => a.isActive && !isExpired(a.expiresAt)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              만료됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assignments.filter((a) => isExpired(a.expiresAt)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="학원명 또는 봇 이름 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">학원 선택</label>
              <select
                value={selectedAcademy || ""}
                onChange={(e) => setSelectedAcademy(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">전체 학원</option>
                {academies.map((academy) => (
                  <option key={academy.id} value={academy.id}>
                    {academy.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 할당 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>봇 할당 목록</CardTitle>
          <CardDescription>
            총 {filteredAssignments.length}개의 할당
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                할당된 봇이 없습니다.
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{assignment.botIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{assignment.academyName}</h3>
                        {isExpired(assignment.expiresAt) ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            만료됨
                          </span>
                        ) : assignment.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            활성
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        봇: {assignment.botName}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          할당일: {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                        {assignment.expiresAt && (
                          <span>
                            만료일: {new Date(assignment.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {assignment.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          메모: {assignment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeBot(assignment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 할당 모달 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>봇 할당</CardTitle>
              <CardDescription>학원에 AI 봇을 할당합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  학원 선택 *
                </label>
                <select
                  value={assignAcademyId}
                  onChange={(e) => setAssignAcademyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">학원을 선택하세요</option>
                  {academies.map((academy) => (
                    <option key={academy.id} value={academy.id}>
                      {academy.name} ({academy.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  봇 선택 *
                </label>
                <select
                  value={assignBotId}
                  onChange={(e) => setAssignBotId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">봇을 선택하세요</option>
                  {bots.filter(bot => bot.isActive).map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.profileIcon} {bot.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  만료일 (선택)
                </label>
                <Input
                  type="datetime-local"
                  value={assignExpiresAt}
                  onChange={(e) => setAssignExpiresAt(e.target.value)}
                  placeholder="만료일을 설정하지 않으면 무제한"
                />
                <p className="text-xs text-gray-500 mt-1">
                  비워두면 무제한으로 사용할 수 있습니다
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  메모 (선택)
                </label>
                <Input
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="할당 관련 메모"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAssignBot}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  할당
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    resetAssignForm();
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
