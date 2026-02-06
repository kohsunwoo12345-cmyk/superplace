"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  permissions?: TeacherPermissions;
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

export default function TeacherManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // 원장만 접근 가능
      if (user.role !== "DIRECTOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        alert("권한이 없습니다");
        router.push("/dashboard");
        return;
      }

      fetchTeachers(user.academyId);
    } else {
      router.push("/login");
    }
  }, []);

  const fetchTeachers = async (academyId?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // 선생님 목록 조회
      const params = new URLSearchParams();
      if (academyId) {
        params.append("academyId", academyId.toString());
      }

      const response = await fetch(`/api/teachers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const teacherList = data.teachers || [];
        
        // 각 선생님의 권한 정보 조회
        const teachersWithPermissions = await Promise.all(
          teacherList.map(async (teacher: Teacher) => {
            try {
              const permResponse = await fetch(
                `/api/teachers/permissions?teacherId=${teacher.id}&academyId=${academyId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const permData = await permResponse.json();

              return {
                ...teacher,
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
                      teacherId: teacher.id,
                      academyId: academyId || 0,
                      canViewAllClasses: false,
                      canViewAllStudents: false,
                      canManageHomework: true,
                      canManageAttendance: true,
                      canViewStatistics: false,
                    },
              };
            } catch (error) {
              console.error(`Failed to fetch permissions for teacher ${teacher.id}:`, error);
              return teacher;
            }
          })
        );

        setTeachers(teachersWithPermissions);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (
    teacher: Teacher,
    permission: keyof TeacherPermissions,
    value: boolean
  ) => {
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacher.id
          ? {
              ...t,
              permissions: {
                ...t.permissions!,
                [permission]: value,
              },
            }
          : t
      )
    );
  };

  const savePermissions = async (teacher: Teacher) => {
    if (!teacher.permissions) return;

    try {
      setSavingPermissions(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/teachers/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          academyId: currentUser.academyId,
          canViewAllClasses: teacher.permissions.canViewAllClasses,
          canViewAllStudents: teacher.permissions.canViewAllStudents,
          canManageHomework: teacher.permissions.canManageHomework,
          canManageAttendance: teacher.permissions.canManageAttendance,
          canViewStatistics: teacher.permissions.canViewStatistics,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("권한이 저장되었습니다");
        setSelectedTeacher(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← 돌아가기
        </Button>
        <h1 className="text-3xl font-bold mb-2">👨‍🏫 선생님 관리</h1>
        <p className="text-gray-600">
          선생님별 권한을 설정하고 관리하세요
        </p>
      </div>

      {/* 선생님 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {teachers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                등록된 선생님이 없습니다
              </h3>
              <p className="text-gray-600">
                선생님을 먼저 등록해주세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {teacher.name}
                    </CardTitle>
                    <CardDescription>
                      {teacher.email}
                      {teacher.phone && ` • ${teacher.phone}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    권한 설정
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {teacher.permissions?.canViewAllClasses ? (
                    <Badge className="bg-green-600 justify-center py-2">
                      <Eye className="w-3 h-3 mr-1" />
                      전체 반 조회
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      배정 반만
                    </Badge>
                  )}

                  {teacher.permissions?.canViewAllStudents ? (
                    <Badge className="bg-green-600 justify-center py-2">
                      <Users className="w-3 h-3 mr-1" />
                      전체 학생 조회
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      배정 학생만
                    </Badge>
                  )}

                  {teacher.permissions?.canManageHomework ? (
                    <Badge className="bg-blue-600 justify-center py-2">
                      <FileText className="w-3 h-3 mr-1" />
                      숙제 관리
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      숙제 제한
                    </Badge>
                  )}

                  {teacher.permissions?.canManageAttendance ? (
                    <Badge className="bg-purple-600 justify-center py-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      출석 관리
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      출석 제한
                    </Badge>
                  )}

                  {teacher.permissions?.canViewStatistics ? (
                    <Badge className="bg-orange-600 justify-center py-2">
                      <BarChart className="w-3 h-3 mr-1" />
                      전체 통계
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      통계 제한
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 권한 설정 모달 */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTeacher(null)}
        >
          <Card
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                {selectedTeacher.name} 선생님 권한 설정
              </CardTitle>
              <CardDescription>
                선생님이 조회하고 관리할 수 있는 범위를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 전체 반 조회 권한 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    전체 반 조회 권한
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    학원의 모든 반을 조회할 수 있습니다 (OFF: 배정된 반만)
                  </p>
                </div>
                <Switch
                  checked={selectedTeacher.permissions?.canViewAllClasses}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(
                      selectedTeacher,
                      "canViewAllClasses",
                      checked
                    )
                  }
                />
              </div>

              {/* 전체 학생 조회 권한 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    전체 학생 조회 권한
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    학원의 모든 학생을 조회할 수 있습니다 (OFF: 배정된 학생만)
                  </p>
                </div>
                <Switch
                  checked={selectedTeacher.permissions?.canViewAllStudents}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(
                      selectedTeacher,
                      "canViewAllStudents",
                      checked
                    )
                  }
                />
              </div>

              {/* 숙제 관리 권한 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    숙제 관리 권한
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    숙제를 생성하고 관리할 수 있습니다
                  </p>
                </div>
                <Switch
                  checked={selectedTeacher.permissions?.canManageHomework}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(
                      selectedTeacher,
                      "canManageHomework",
                      checked
                    )
                  }
                />
              </div>

              {/* 출석 관리 권한 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    출석 관리 권한
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    출석을 체크하고 관리할 수 있습니다
                  </p>
                </div>
                <Switch
                  checked={selectedTeacher.permissions?.canManageAttendance}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(
                      selectedTeacher,
                      "canManageAttendance",
                      checked
                    )
                  }
                />
              </div>

              {/* 전체 통계 조회 권한 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-red-600" />
                    전체 통계 조회 권한
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    학원 전체의 통계를 조회할 수 있습니다 (OFF: 배정된 반만)
                  </p>
                </div>
                <Switch
                  checked={selectedTeacher.permissions?.canViewStatistics}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(
                      selectedTeacher,
                      "canViewStatistics",
                      checked
                    )
                  }
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTeacher(null)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={() => savePermissions(selectedTeacher)}
                  disabled={savingPermissions}
                  className="flex-1"
                >
                  {savingPermissions ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
