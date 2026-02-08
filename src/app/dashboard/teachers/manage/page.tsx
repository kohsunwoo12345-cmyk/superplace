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
import { Input } from "@/components/ui/input";
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
  UserPlus,
  BookOpen,
  Trash2,
} from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
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
}

export default function TeacherManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  
  // 교사 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    permissions: {
      canViewAllClasses: false,
      canViewAllStudents: false,
      canManageHomework: true,
      canManageAttendance: true,
      canViewStatistics: false,
    },
    classIds: [] as number[],
  });
  const [addingTeacher, setAddingTeacher] = useState(false);

  // 반 배정 모달
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [savingClasses, setSavingClasses] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      console.error("❌ No user found in localStorage");
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);
    console.log("👤 Current user:", JSON.stringify(user, null, 2));
    console.log("🔑 User role:", user.role);
    
    setCurrentUser(user);
    
    // 원장, 관리자만 접근 가능 (대소문자 무관)
    const userRole = String(user.role || "").toUpperCase().trim();
    console.log("🔍 Normalized role:", userRole);
    
    const allowedRoles = ["DIRECTOR", "ADMIN", "SUPER_ADMIN"];
    
    if (!allowedRoles.includes(userRole)) {
      console.error("❌ Access denied. Role:", userRole);
      setHasAccess(false);
      setLoading(false);
      return;
    }

    console.log("✅ Access granted. Fetching data...");
    setHasAccess(true);
    fetchTeachers(user.academy_id || user.academyId);
    fetchClasses(user.academy_id || user.academyId);
  }, []);

  const fetchTeachers = async (academyId?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      // role 추가 (관리자 여부 확인용)
      if (currentUser?.role) {
        params.append("role", currentUser.role);
      }
      // academyId 추가 (학원장용)
      if (academyId) {
        params.append("academyId", academyId.toString());
      }

      console.log('👨‍🏫 Fetching teachers with params:', { role: currentUser?.role, academyId });

      const response = await fetch(`/api/teachers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const teacherList = data.teachers || [];
        
        // 각 선생님의 권한과 배정된 반 정보 조회
        const teachersWithDetails = await Promise.all(
          teacherList.map(async (teacher: Teacher) => {
            try {
              // 권한 정보
              const permResponse = await fetch(
                `/api/teachers/permissions?teacherId=${teacher.id}&academyId=${academyId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const permData = await permResponse.json();

              // 배정된 반 정보
              const classResponse = await fetch(
                `/api/teachers/classes?teacherId=${teacher.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const classData = await classResponse.json();

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
                assignedClasses: classData.classes || [],
              };
            } catch (error) {
              console.error(`Failed to fetch details for teacher ${teacher.id}:`, error);
              return teacher;
            }
          })
        );

        setTeachers(teachersWithDetails);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (academyId?: number) => {
    try {
      const params = new URLSearchParams();
      if (academyId) {
        params.append("academyId", academyId.toString());
      }

      const response = await fetch(`/api/classes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      alert("이름, 이메일, 비밀번호를 모두 입력해주세요");
      return;
    }

    try {
      setAddingTeacher(true);
      const academyId = currentUser.academy_id || currentUser.academyId;
      
      // 1. 교사 추가
      const response = await fetch("/api/teachers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeacher.name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          password: newTeacher.password,
          academyId,
        }),
      });

      const data = await response.json();

      if (data.success && data.teacher) {
        const teacherId = data.teacher.id;
        
        // 2. 권한 설정
        await fetch("/api/teachers/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            academyId,
            ...newTeacher.permissions,
          }),
        });

        // 3. 반 배정
        if (newTeacher.classIds.length > 0) {
          await fetch("/api/teachers/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teacherId,
              classIds: newTeacher.classIds,
            }),
          });
        }

        alert("교사가 추가되었습니다");
        setShowAddModal(false);
        setNewTeacher({
          name: "",
          email: "",
          phone: "",
          password: "",
          permissions: {
            canViewAllClasses: false,
            canViewAllStudents: false,
            canManageHomework: true,
            canManageAttendance: true,
            canViewStatistics: false,
          },
          classIds: [],
        });
        fetchTeachers(academyId);
      } else {
        alert(`교사 추가 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to add teacher:", error);
      alert("교사 추가 중 오류가 발생했습니다");
    } finally {
      setAddingTeacher(false);
    }
  };

  const handlePermissionChange = (
    teacher: Teacher,
    permission: keyof TeacherPermissions,
    value: boolean
  ) => {
    setSelectedTeacher({
      ...teacher,
      permissions: {
        ...teacher.permissions!,
        [permission]: value,
      },
    });
  };

  const savePermissions = async (teacher: Teacher) => {
    try {
      setSavingPermissions(true);
      const response = await fetch("/api/teachers/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacher.permissions),
      });

      const data = await response.json();

      if (data.success) {
        alert("권한이 저장되었습니다");
        setSelectedTeacher(null);
        fetchTeachers(currentUser.academy_id || currentUser.academyId);
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

  const openClassModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassIds(teacher.assignedClasses?.map(c => c.id) || []);
    setShowClassModal(true);
  };

  const toggleClass = (classId: number) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const saveClassAssignments = async () => {
    if (!selectedTeacher) return;

    try {
      setSavingClasses(true);
      const response = await fetch("/api/teachers/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          classIds: selectedClassIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowClassModal(false);
        fetchTeachers(currentUser.academy_id || currentUser.academyId);
      } else {
        alert(`반 배정 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to assign classes:", error);
      alert("반 배정 중 오류가 발생했습니다");
    } finally {
      setSavingClasses(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-6 h-6" />
              접근 권한 없음
            </CardTitle>
            <CardDescription>
              학원장 또는 관리자만 접근할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            ← 돌아가기
          </Button>
          <h1 className="text-3xl font-bold mb-2">👨‍🏫 교사 관리</h1>
          <p className="text-gray-600">
            교사를 추가하고 권한 및 담당 반을 설정하세요
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          교사 추가
        </Button>
      </div>

      {/* 교사 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {teachers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                등록된 교사가 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                "교사 추가" 버튼을 눌러 교사를 등록하세요
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                교사 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      {teacher.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {teacher.email} {teacher.phone && `• ${teacher.phone}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/teachers/detail?id=${teacher.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openClassModal(teacher)}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      반 배정 ({teacher.assignedClasses?.length || 0})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeacher(teacher)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      권한 설정
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 배정된 반 */}
                {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📚 담당 반</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.assignedClasses.map((cls) => (
                        <Badge key={cls.id} variant="outline" className="bg-blue-50">
                          {cls.name} {cls.grade && `(${cls.grade})`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 권한 배지 */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {teacher.permissions?.canViewAllClasses ? (
                    <Badge className="bg-green-600 justify-center py-2">
                      <Eye className="w-3 h-3 mr-1" />
                      전체 반
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="justify-center py-2">
                      <XCircle className="w-3 h-3 mr-1" />
                      배정 반만
                    </Badge>
                  )}

                  {teacher.permissions?.canViewAllStudents ? (
                    <Badge className="bg-cyan-600 justify-center py-2">
                      <Users className="w-3 h-3 mr-1" />
                      전체 학생
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

      {/* 교사 추가 모달 */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddModal(false)}
        >
          <Card
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                새 교사 추가
              </CardTitle>
              <CardDescription>
                교사 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>이름 *</Label>
                <Input
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label>이메일 *</Label>
                <Input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="teacher@example.com"
                />
              </div>
              <div>
                <Label>전화번호</Label>
                <Input
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <Label>초기 비밀번호 *</Label>
                <Input
                  type="password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  placeholder="최소 6자 이상"
                />
              </div>

              {/* 권한 설정 */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">🔐 권한 설정</h3>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">전체 반 조회</Label>
                  <Switch
                    checked={newTeacher.permissions.canViewAllClasses}
                    onCheckedChange={(checked) =>
                      setNewTeacher({
                        ...newTeacher,
                        permissions: { ...newTeacher.permissions, canViewAllClasses: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">전체 학생 조회</Label>
                  <Switch
                    checked={newTeacher.permissions.canViewAllStudents}
                    onCheckedChange={(checked) =>
                      setNewTeacher({
                        ...newTeacher,
                        permissions: { ...newTeacher.permissions, canViewAllStudents: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">숙제 관리</Label>
                  <Switch
                    checked={newTeacher.permissions.canManageHomework}
                    onCheckedChange={(checked) =>
                      setNewTeacher({
                        ...newTeacher,
                        permissions: { ...newTeacher.permissions, canManageHomework: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">출석 관리</Label>
                  <Switch
                    checked={newTeacher.permissions.canManageAttendance}
                    onCheckedChange={(checked) =>
                      setNewTeacher({
                        ...newTeacher,
                        permissions: { ...newTeacher.permissions, canManageAttendance: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">전체 통계 조회</Label>
                  <Switch
                    checked={newTeacher.permissions.canViewStatistics}
                    onCheckedChange={(checked) =>
                      setNewTeacher({
                        ...newTeacher,
                        permissions: { ...newTeacher.permissions, canViewStatistics: checked },
                      })
                    }
                  />
                </div>
              </div>

              {/* 반 배정 */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm">📚 담당 반 배정</h3>
                {classes.length === 0 ? (
                  <p className="text-sm text-gray-500">등록된 반이 없습니다</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`class-${cls.id}`}
                          checked={newTeacher.classIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTeacher({
                                ...newTeacher,
                                classIds: [...newTeacher.classIds, cls.id],
                              });
                            } else {
                              setNewTeacher({
                                ...newTeacher,
                                classIds: newTeacher.classIds.filter(id => id !== cls.id),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                          {cls.name} {cls.grade && `(${cls.grade})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddTeacher}
                  disabled={addingTeacher}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {addingTeacher ? "추가 중..." : "추가"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 반 배정 모달 */}
      {showClassModal && selectedTeacher && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowClassModal(false)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                {selectedTeacher.name} 선생님 반 배정
              </CardTitle>
              <CardDescription>
                담당할 반을 선택하세요 (다중 선택 가능)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {classes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  등록된 반이 없습니다
                </p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedClassIds.includes(cls.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => toggleClass(cls.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{cls.name}</h4>
                        <p className="text-sm text-gray-600">
                          {cls.grade && `${cls.grade} •`} {cls.subject || "일반"}
                        </p>
                        {cls.description && (
                          <p className="text-xs text-gray-500 mt-1">{cls.description}</p>
                        )}
                      </div>
                      {selectedClassIds.includes(cls.id) && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowClassModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={saveClassAssignments}
                  disabled={savingClasses}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {savingClasses ? "저장 중..." : `${selectedClassIds.length}개 반 배정`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 권한 설정 모달 */}
      {selectedTeacher && !showClassModal && (
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
