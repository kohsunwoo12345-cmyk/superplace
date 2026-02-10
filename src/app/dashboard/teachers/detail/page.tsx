"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  FileText,
  Calendar,
  BarChart,
  BookOpen,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  academyId: number;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: TeacherPermissions;
  assignedClasses?: Class[];
}

interface TeacherPermissions {
  id?: number;
  teacherId: number;
  academyId: number;
  canViewAllClasses: boolean;
  canViewAllStudents: boolean;
  canManageHomework: boolean;
  canManageAttendance: boolean;
  canViewStatistics: boolean;
}

interface Class {
  id: number;
  name: string;
  grade?: string;
  subject?: string;
  description?: string;
  academyId: number;
  status: string;
  studentCount?: number;
}

function TeacherDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<TeacherPermissions | null>(null);

  useEffect(() => {
    if (!teacherId) {
      router.push("/dashboard/teachers/manage");
      return;
    }
    fetchTeacherDetail();
  }, [teacherId]);

  const fetchTeacherDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const academyId = user.academy_id || user.academyId;

      // 교사 정보
      const params = new URLSearchParams();
      if (user.role) {
        params.append("role", user.role);
      }
      if (academyId) {
        params.append("academyId", academyId.toString());
      }
      
      const teacherResponse = await fetch(`/api/teachers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teacherData = await teacherResponse.json();
      const foundTeacher = teacherData.teachers?.find((t: Teacher) => t.id === parseInt(teacherId!));

      if (!foundTeacher) {
        alert("교사를 찾을 수 없습니다");
        router.push("/dashboard/teachers/manage");
        return;
      }

      // 권한 정보
      const permResponse = await fetch(
        `/api/teachers/permissions?teacherId=${teacherId}&academyId=${academyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const permData = await permResponse.json();

      // 배정된 반 정보
      const classResponse = await fetch(
        `/api/teachers/classes?teacherId=${teacherId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const classData = await classResponse.json();

      const teacherDetail: Teacher = {
        ...foundTeacher,
        permissions: permData.permissions && permData.permissions.length > 0
          ? {
              ...permData.permissions[0],
              canViewAllClasses: permData.permissions[0].canViewAllClasses === 1,
              canViewAllStudents: permData.permissions[0].canViewAllStudents === 1,
              canManageHomework: permData.permissions[0].canManageHomework === 1,
              canManageAttendance: permData.permissions[0].canManageAttendance === 1,
              canViewStatistics: permData.permissions[0].canViewStatistics === 1,
            }
          : {
              teacherId: parseInt(teacherId),
              academyId,
              canViewAllClasses: false,
              canViewAllStudents: false,
              canManageHomework: true,
              canManageAttendance: true,
              canViewStatistics: false,
            },
        assignedClasses: classData.classes || [],
      };

      // 각 반의 학생 수 조회
      if (teacherDetail.assignedClasses) {
        const classesWithCount = await Promise.all(
          teacherDetail.assignedClasses.map(async (cls) => {
            try {
              const studentsResponse = await fetch(`/api/class-students?classId=${cls.id}`);
              const studentsData = await studentsResponse.json();
              return {
                ...cls,
                studentCount: studentsData.students?.length || 0,
              };
            } catch {
              return { ...cls, studentCount: 0 };
            }
          })
        );
        teacherDetail.assignedClasses = classesWithCount;
      }

      setTeacher(teacherDetail);
    } catch (error) {
      console.error("Failed to fetch teacher detail:", error);
      alert("교사 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = () => {
    setTempPermissions(teacher?.permissions || null);
    setEditingPermissions(true);
  };

  const handlePermissionChange = (permission: keyof TeacherPermissions, value: boolean) => {
    if (tempPermissions) {
      setTempPermissions({ ...tempPermissions, [permission]: value });
    }
  };

  const savePermissions = async () => {
    try {
      setSavingPermissions(true);
      const response = await fetch("/api/teachers/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempPermissions),
      });

      const data = await response.json();

      if (data.success) {
        alert("권한이 저장되었습니다");
        setEditingPermissions(false);
        fetchTeacherDetail();
      } else {
        alert(`권한 저장 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to save permissions:", error);
      alert("권한 저장 중 오류가 발생했습니다");
    } finally {
      setSavingPermissions(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">교사를 찾을 수 없습니다</h3>
            <Button onClick={() => router.push("/dashboard/teachers/manage")} className="mt-4">
              교사 관리로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/teachers/manage")} className="mb-4">
          ← 교사 관리로 돌아가기
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              {teacher.name} 교사
            </h1>
            <p className="text-gray-600">{teacher.email}</p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-4 py-2">
            {teacher.role === "TEACHER" ? "교사" : teacher.role}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-medium">{teacher.email}</p>
              </div>
            </div>

            {teacher.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">전화번호</p>
                  <p className="font-medium">{teacher.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="font-medium">{formatDate(teacher.createdAt)}</p>
              </div>
            </div>

            {teacher.lastLoginAt && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">최근 로그인</p>
                  <p className="font-medium">{formatDate(teacher.lastLoginAt)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 권한 설정 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                권한 설정
              </CardTitle>
              {!editingPermissions && (
                <Button size="sm" onClick={handleEditPermissions}>
                  <Settings className="w-4 h-4 mr-1" />
                  수정
                </Button>
              )}
            </div>
            <CardDescription>교사가 조회하고 관리할 수 있는 범위</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 전체 반 조회 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold">전체 반 조회 권한</p>
                  <p className="text-sm text-gray-600">
                    학원의 모든 반을 조회 (OFF: 배정된 반만)
                  </p>
                </div>
              </div>
              {editingPermissions ? (
                <Switch
                  checked={tempPermissions?.canViewAllClasses}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("canViewAllClasses", checked)
                  }
                />
              ) : teacher.permissions?.canViewAllClasses ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* 전체 학생 조회 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="font-semibold">전체 학생 조회 권한</p>
                  <p className="text-sm text-gray-600">
                    학원의 모든 학생을 조회 (OFF: 배정된 학생만)
                  </p>
                </div>
              </div>
              {editingPermissions ? (
                <Switch
                  checked={tempPermissions?.canViewAllStudents}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("canViewAllStudents", checked)
                  }
                />
              ) : teacher.permissions?.canViewAllStudents ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* 숙제 관리 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold">숙제 관리 권한</p>
                  <p className="text-sm text-gray-600">숙제를 생성하고 관리</p>
                </div>
              </div>
              {editingPermissions ? (
                <Switch
                  checked={tempPermissions?.canManageHomework}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("canManageHomework", checked)
                  }
                />
              ) : teacher.permissions?.canManageHomework ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* 출석 관리 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">출석 관리 권한</p>
                  <p className="text-sm text-gray-600">출석을 체크하고 관리</p>
                </div>
              </div>
              {editingPermissions ? (
                <Switch
                  checked={tempPermissions?.canManageAttendance}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("canManageAttendance", checked)
                  }
                />
              ) : teacher.permissions?.canManageAttendance ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* 전체 통계 조회 */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <BarChart className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold">전체 통계 조회 권한</p>
                  <p className="text-sm text-gray-600">
                    학원 전체의 통계 조회 (OFF: 배정된 반만)
                  </p>
                </div>
              </div>
              {editingPermissions ? (
                <Switch
                  checked={tempPermissions?.canViewStatistics}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("canViewStatistics", checked)
                  }
                />
              ) : teacher.permissions?.canViewStatistics ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {editingPermissions && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingPermissions(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={savePermissions}
                  disabled={savingPermissions}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {savingPermissions ? "저장 중..." : "저장"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 담당 반 */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              담당 반 ({teacher.assignedClasses?.length || 0}개)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => router.push(`/dashboard/teachers/manage`)}
            >
              반 배정 수정
            </Button>
          </div>
          <CardDescription>
            이 교사가 담당하는 반 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!teacher.assignedClasses || teacher.assignedClasses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>배정된 반이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.assignedClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{cls.name}</span>
                      <Badge variant="outline">{cls.status === "active" ? "활성" : "비활성"}</Badge>
                    </CardTitle>
                    {cls.grade && (
                      <CardDescription>{cls.grade} • {cls.subject || "일반"}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {cls.description && (
                      <p className="text-sm text-gray-600 mb-3">{cls.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{cls.studentCount || 0}명</span>
                      <span className="text-gray-500">학생</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">담당 반</p>
                <p className="text-2xl font-bold">{teacher.assignedClasses?.length || 0}개</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">담당 학생</p>
                <p className="text-2xl font-bold">
                  {teacher.assignedClasses?.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) || 0}명
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">권한 수준</p>
                <p className="text-2xl font-bold">
                  {[
                    teacher.permissions?.canViewAllClasses,
                    teacher.permissions?.canViewAllStudents,
                    teacher.permissions?.canManageHomework,
                    teacher.permissions?.canManageAttendance,
                    teacher.permissions?.canViewStatistics,
                  ].filter(Boolean).length}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TeacherDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TeacherDetailContent />
    </Suspense>
  );
}
