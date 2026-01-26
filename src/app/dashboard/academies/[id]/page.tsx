"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  GraduationCap,
  Bot,
  ArrowLeft,
  Key,
  LogIn,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Academy = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  subscriptionPlan: string;
  maxStudents: number;
  maxTeachers: number;
  aiUsageLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Director = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  studentId: string | null;
  studentCode: string | null;
  grade: string | null;
  school: string | null;
  approved: boolean;
  points: number;
  createdAt: string;
  lastLoginAt: string | null;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  approved: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type BotAssignment = {
  id: string;
  botId: string;
  userId: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

type Stats = {
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  totalTeachers: number;
  approvedTeachers: number;
  pendingTeachers: number;
  totalBots: number;
};

export default function AcademyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const academyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [director, setDirector] = useState<Director | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignedBots, setAssignedBots] = useState<BotAssignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 학원 정보 로드
  useEffect(() => {
    loadAcademyDetail();
  }, [academyId]);

  const loadAcademyDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academies/${academyId}`);
      
      if (!res.ok) {
        throw new Error('학원 정보를 불러올 수 없습니다.');
      }

      const data = await res.json();
      setAcademy(data.academy);
      setDirector(data.director);
      setStudents(data.students);
      setTeachers(data.teachers);
      setAssignedBots(data.assignedBots);
      setStats(data.stats);
    } catch (error) {
      console.error('학원 정보 로딩 오류:', error);
      toast({
        title: "오류",
        description: "학원 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 학원장 계정으로 전환
  const handleSwitchAccount = async () => {
    if (!confirm('학원장 계정으로 전환하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/academies/${academyId}/switch`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('계정 전환에 실패했습니다.');
      }

      const data = await res.json();
      
      toast({
        title: "성공",
        description: `${data.targetUser.name} 계정으로 전환되었습니다.`,
      });

      // 페이지 새로고침하여 세션 갱신
      window.location.href = data.redirectUrl || '/dashboard';
    } catch (error) {
      console.error('계정 전환 오류:', error);
      toast({
        title: "오류",
        description: "계정 전환 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "오류",
        description: "비밀번호는 최소 8자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch(`/api/academies/${academyId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        throw new Error('비밀번호 변경에 실패했습니다.');
      }

      toast({
        title: "성공",
        description: "학원장 비밀번호가 변경되었습니다.",
      });

      setPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      toast({
        title: "오류",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: "bg-gray-500",
      BASIC: "bg-blue-500",
      PRO: "bg-purple-500",
      ENTERPRISE: "bg-amber-500",
    };
    return colors[plan] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">학원 정보를 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/academies')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{academy.name}</h1>
            <p className="text-gray-500 mt-1">학원 코드: {academy.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPasswordDialogOpen(true)}
            variant="outline"
          >
            <Key className="h-4 w-4 mr-2" />
            비밀번호 변경
          </Button>
          <Button
            onClick={handleSwitchAccount}
            disabled={!director}
          >
            <LogIn className="h-4 w-4 mr-2" />
            학원장 계정으로 로그인
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 학생</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              승인 {stats?.approvedStudents || 0} / 대기 {stats?.pendingStudents || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 선생님</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            <p className="text-xs text-muted-foreground">
              승인 {stats?.approvedTeachers || 0} / 대기 {stats?.pendingTeachers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">할당된 봇</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBots || 0}</div>
            <p className="text-xs text-muted-foreground">고유 봇 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">요금제</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getPlanBadge(academy.subscriptionPlan)}>
              {academy.subscriptionPlan}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              최대 {academy.maxStudents}명 / 선생님 {academy.maxTeachers}명
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 학원 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>학원 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">설명</Label>
              <p className="mt-1">{academy.description || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">상태</Label>
              <div className="mt-1">
                {academy.isActive ? (
                  <Badge variant="default">활성</Badge>
                ) : (
                  <Badge variant="destructive">비활성</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1 text-gray-400" />
              <div>
                <Label className="text-sm text-gray-500">주소</Label>
                <p className="mt-1">{academy.address || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-1 text-gray-400" />
              <div>
                <Label className="text-sm text-gray-500">전화번호</Label>
                <p className="mt-1">{academy.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-1 text-gray-400" />
              <div>
                <Label className="text-sm text-gray-500">이메일</Label>
                <p className="mt-1">{academy.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-1 text-gray-400" />
              <div>
                <Label className="text-sm text-gray-500">생성일</Label>
                <p className="mt-1">
                  {new Date(academy.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학원장 정보 */}
      {director && (
        <Card>
          <CardHeader>
            <CardTitle>학원장 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">이름</Label>
                <p className="mt-1">{director.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">이메일</Label>
                <p className="mt-1">{director.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">전화번호</Label>
                <p className="mt-1">{director.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">마지막 로그인</Label>
                <p className="mt-1">
                  {director.lastLoginAt
                    ? new Date(director.lastLoginAt).toLocaleString('ko-KR')
                    : '로그인 기록 없음'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">
            학생 ({students.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            선생님 ({teachers.length})
          </TabsTrigger>
          <TabsTrigger value="bots">
            할당된 봇 ({assignedBots.length})
          </TabsTrigger>
        </TabsList>

        {/* 학생 탭 */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>학생 목록</CardTitle>
              <CardDescription>
                총 {students.length}명의 학생이 등록되어 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    등록된 학생이 없습니다.
                  </p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{student.name}</h4>
                          {student.approved ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <div className="flex gap-2 mt-2">
                          {student.studentId && (
                            <Badge variant="outline">학번: {student.studentId}</Badge>
                          )}
                          {student.studentCode && (
                            <Badge variant="outline">코드: {student.studentCode}</Badge>
                          )}
                          {student.grade && (
                            <Badge variant="secondary">{student.grade}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.points} 포인트</p>
                        <p className="text-xs text-gray-500">
                          {student.lastLoginAt
                            ? `최근: ${new Date(student.lastLoginAt).toLocaleDateString('ko-KR')}`
                            : '로그인 기록 없음'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 선생님 탭 */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>선생님 목록</CardTitle>
              <CardDescription>
                총 {teachers.length}명의 선생님이 등록되어 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    등록된 선생님이 없습니다.
                  </p>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{teacher.name}</h4>
                          {teacher.approved ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        {teacher.phone && (
                          <p className="text-sm text-gray-500">{teacher.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {teacher.lastLoginAt
                            ? `최근: ${new Date(teacher.lastLoginAt).toLocaleDateString('ko-KR')}`
                            : '로그인 기록 없음'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 봇 탭 */}
        <TabsContent value="bots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>할당된 AI 봇</CardTitle>
              <CardDescription>
                이 학원에 할당된 총 {assignedBots.length}개의 고유 봇이 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedBots.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    할당된 봇이 없습니다.
                  </p>
                ) : (
                  assignedBots.map((bot) => (
                    <div
                      key={bot.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-purple-500" />
                          <h4 className="font-medium">봇 ID: {bot.botId}</h4>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          할당 대상: {bot.user.name} ({bot.user.email})
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {bot.user.role}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          할당일: {new Date(bot.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학원장 비밀번호 변경</DialogTitle>
            <DialogDescription>
              {director ? `${director.name} (${director.email})` : '학원장'} 계정의 비밀번호를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 8자 이상"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !newPassword || newPassword.length < 8}
            >
              {passwordLoading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
