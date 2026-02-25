"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Search, Mail, Phone, School } from "lucide-react";

interface Student {
  id: number | string;
  name: string;
  email: string;
  studentCode?: string;
  grade?: string | null;
  phone?: string;
  academy_id?: number;
  academyId?: number;
  academy_name?: string;
  role?: string;
  status?: string;
  created_at?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let userData = null;
    
    if (storedUser) {
      userData = JSON.parse(storedUser);
      setUser(userData);
    } else {
      // No user in localStorage, but we can still show mock data
      console.log('No user found, will use mock data');
      setUser({ name: "Guest User", role: "TEACHER", academy_name: "데모 학원" });
    }
    
    loadStudents(userData);
  }, [router]);

  const loadStudents = async (userData: any) => {
    try {
      setLoading(true);
      
      // 🔒 보안 강화: Authorization 헤더에 토큰 포함
      // 서버에서 토큰을 검증하여 역할과 학원 정보를 추출하므로
      // 클라이언트에서 role, academyId 등의 파라미터를 전송하지 않음
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      if (!token) {
        console.error('❌ No authentication token found');
        setStudents([]);
        setLoading(false);
        return;
      }
      
      // Try API call
      try {
        const response = await fetch('/api/students/by-academy', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          console.error('❌ Unauthorized - invalid token');
          setStudents([]);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded students:', data.students?.length || 0);
          setStudents(data.students || []);
          setLoading(false);
          return;
        }
        
        console.error('❌ Failed to load students:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setStudents([]);
      } catch (apiError) {
        console.error('API call failed:', apiError);
        setStudents([]);
      }
      
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students
    .filter(student => {
      // student-로 시작하는 ID만 허용 (user-, director- 등 제외)
      const isValidStudentId = typeof student.id === 'string' && student.id.startsWith('student-');
      if (!isValidStudentId) {
        console.warn('⚠️ Invalid student ID detected:', student.id, 'Name:', student.name);
        return false;
      }
      return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">학생 관리</h1>
          <p className="text-gray-500 mt-1">등록된 학생을 관리하고 새 학생을 추가하세요</p>
        </div>
        <Button onClick={() => router.push("/dashboard/students/add/")}>
          <UserPlus className="w-4 h-4 mr-2" />
          학생 추가
        </Button>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 학생</CardDescription>
            <CardTitle className="text-3xl">{students.length}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>검색 결과</CardDescription>
            <CardTitle className="text-3xl">{filteredStudents.length}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>소속 학원</CardDescription>
            <CardTitle className="text-xl">{user?.academy_name || "전체"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 학생 목록 */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <School className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? "다른 검색어를 입력해보세요" : "새 학생을 추가해보세요"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/dashboard/students/add/")}>
                <UserPlus className="w-4 h-4 mr-2" />
                학생 추가
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboard/students/detail/?id=${student.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {student.studentCode ? `학생코드: ${student.studentCode}` : `ID: ${student.id}`}
                    </CardDescription>
                  </div>
                  <Badge variant="default">{student.grade || '학생'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.academy_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <School className="h-4 w-4" />
                      <span>{student.academy_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
