"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Calendar,
  BookOpen,
  Loader2,
  Search,
} from "lucide-react";

type ClassData = {
  id: string;
  name: string;
  grade: string | null;
  description: string | null;
  capacity: number;
  isActive: boolean;
  students: Array<{
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
      studentCode: string;
      grade: string | null;
    };
  }>;
  schedules: Array<{
    id: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  _count: {
    students: number;
  };
};

export default function ClassManagementPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // localStorage에서 사용자 정보 확인
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    loadClasses();
  }, [router]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/classes/manage");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("반 목록 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">클래스 관리</h1>
          <p className="text-gray-600">학원의 클래스를 관리합니다</p>
        </div>
        <Button onClick={() => alert("클래스 추가 기능은 곧 추가됩니다.")}>
          <Plus className="w-4 h-4 mr-2" />
          클래스 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 클래스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold">{classes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 학생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold">
                {classes.reduce((sum, cls) => sum + cls._count.students, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 클래스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold">
                {classes.filter((c) => c.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="클래스 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 클래스 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>{cls.grade || "모든 학년"}</CardDescription>
                </div>
                <Badge variant={cls.isActive ? "default" : "secondary"}>
                  {cls.isActive ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>학생 {cls._count.students}명</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    정원 {cls.capacity}명
                  </div>
                </div>

                {cls.schedules && cls.schedules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">수업 시간</div>
                    {cls.schedules.slice(0, 2).map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {["일", "월", "화", "수", "목", "금", "토"][schedule.dayOfWeek]}{" "}
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
                >
                  자세히 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
