"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Loader2,
  Search,
} from "lucide-react";

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/academy/students?role=TEACHER");
      
      // 선생님 목록 API가 없으므로 임시로 사용
      const studentsResponse = await fetch("/api/academy/students");
      
      if (studentsResponse.ok) {
        const data = await studentsResponse.json();
        // 선생님만 필터링
        const teachersList = data.students.filter((user: any) => 
          user.role === "TEACHER" || user.email?.includes("teacher")
        );
        setTeachers(teachersList);
      }
    } catch (error) {
      console.error("선생님 목록 로딩 오류:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId: string) => {
    if (!confirm("이 선생님을 승인하시겠습니까?")) return;
    
    try {
      // API 호출 (실제로는 구현 필요)
      alert("승인 기능은 추후 구현 예정입니다.");
      loadTeachers();
    } catch (error) {
      console.error("승인 오류:", error);
    }
  };

  const handleReject = async (teacherId: string) => {
    if (!confirm("이 선생님의 승인을 거부하시겠습니까?")) return;
    
    try {
      // API 호출 (실제로는 구현 필요)
      alert("거부 기능은 추후 구현 예정입니다.");
      loadTeachers();
    } catch (error) {
      console.error("거부 오류:", error);
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    Object.values(teacher).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">선생님 관리</h1>
        <p className="mt-2 text-gray-600">
          선생님 계정을 관리하고 승인하세요 (원장님 전용)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 선생님</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teachers.filter((t) => t.approved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {teachers.filter((t) => !t.approved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>선생님 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름, 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredTeachers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">
                등록된 선생님이 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{teacher.name}</CardTitle>
                      <Badge
                        variant={teacher.approved ? "default" : "secondary"}
                      >
                        {teacher.approved ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            승인됨
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            대기 중
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {teacher.email}
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {!teacher.approved && (
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(teacher.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      승인
                    </Button>
                    <Button
                      onClick={() => handleReject(teacher.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      거부
                    </Button>
                  </div>
                </CardContent>
              )}

              {teacher.approved && (
                <CardContent>
                  <div className="text-sm text-gray-500">
                    {teacher.lastLoginAt
                      ? `최근 로그인: ${new Date(
                          teacher.lastLoginAt
                        ).toLocaleDateString("ko-KR")}`
                      : "로그인 기록 없음"}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
