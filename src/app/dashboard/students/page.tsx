"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  UserPlus,
  Eye,
  GraduationCap,
} from "lucide-react";

interface Student {
  id: string;
  email: string;
  name: string;
  phone?: string;
  grade?: string;
  studentCode?: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/students", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            학생 관리
          </h1>
          <p className="text-gray-600 mt-1">전체 학생 목록을 확인하고 관리합니다</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-5 w-5" />
          학생 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 학생
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{students.length}명</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              활동 중
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {students.filter(s => s.status === 'ACTIVE').length}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기 중
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {students.filter(s => s.status === 'PENDING').length}명
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              이번 달 신규
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {students.filter(s => {
                const created = new Date(s.createdAt || 0);
                const now = new Date();
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
              }).length}명
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>학생 목록</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="이름 또는 이메일 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">학생이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-semibold text-blue-600 text-lg">
                        {student.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-lg">{student.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {student.email}
                        </span>
                        {student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {student.phone}
                          </span>
                        )}
                        {student.grade && (
                          <Badge variant="outline">{student.grade}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.status === 'ACTIVE' && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                        활동 중
                      </Badge>
                    )}
                    {student.status === 'PENDING' && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                        대기 중
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/students/${student.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
