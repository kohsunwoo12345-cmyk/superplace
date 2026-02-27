"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";

type ClassData = {
  id: string;
  name: string;
  grade: string | null;
  description: string | null;
  color?: string | null;
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

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 개발 환경: 토큰이 없으면 기본 테스트 토큰 설정
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (!storedUser && !storedToken) {
      console.log('⚠️ 개발 모드: 기본 테스트 사용자 설정');
      const testUser = {
        id: '1',
        email: 'director@test.com',
        name: '테스트 학원장',
        role: 'DIRECTOR',
        academy_id: '1',
        academyId: '1',
        academyName: '테스트 학원',
        token: `1|director@test.com|DIRECTOR|1|${Date.now()}`,
      };
      localStorage.setItem('user', JSON.stringify(testUser));
      localStorage.setItem('token', testUser.token);
      console.log('✅ 테스트 사용자 설정 완료:', testUser.email);
    }
    
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📚 클래스 목록 로드 중...');

      // 토큰 가져오기
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      const headers: any = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      };
      
      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Using authentication token for academy-specific data');
      } else {
        console.log('⚠️ No token found, will load demo data');
      }

      const cacheBuster = `?_t=${Date.now()}`;
      const response = await fetch(`/api/classes${cacheBuster}`, {
        headers: headers
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 클래스 데이터:', data);
        console.log('📊 클래스 개수:', data.classes?.length || 0);
        
        setClasses(data.classes || []);
      } else {
        console.error('❌ 클래스 조회 실패:', response.status);
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
        console.error('❌ 오류 내용:', errorData);
        setError(errorData.message || '클래스 목록을 불러올 수 없습니다');
        setClasses([]);
      }
    } catch (error: any) {
      console.error("❌ 반 목록 로딩 오류:", error);
      setError(error.message || '네트워크 오류가 발생했습니다');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClass = async (classId: string, className: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`"${className}" 반을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      // 토큰 가져오기
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const token = user?.token || localStorage.getItem("token");
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/classes?id=${classId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (response.ok) {
        alert('반이 삭제되었습니다.');
        loadClasses(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        alert(`삭제 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('반 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">클래스 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold mb-2">클래스 관리</h1>
          <p className="text-gray-600">학원의 클래스를 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadClasses}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            onClick={() => router.push("/dashboard/classes/add")}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            클래스 추가
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="클래스 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 클래스 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((classItem) => (
          <Card
            key={classItem.id}
            className="hover:shadow-lg transition-shadow relative overflow-hidden"
          >
            {/* 색상 바 */}
            {classItem.color && (
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: classItem.color }}
              />
            )}
            <CardHeader className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-center gap-3">
                  {/* 색상 인디케이터 */}
                  {classItem.color && (
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: classItem.color }}
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {classItem.grade || "학년 미지정"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={classItem.isActive ? "default" : "secondary"}>
                  {classItem.isActive ? "활성" : "비활성"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classItem.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {classItem.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{classItem._count?.students || 0}명</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{classItem.schedules?.length || 0}개 수업</span>
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/classes/edit/?id=${classItem.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={(e) => handleDeleteClass(classItem.id, classItem.name, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 클래스가 없는 경우 */}
      {!loading && filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">클래스가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? "검색 결과가 없습니다"
              : "새로운 클래스를 추가해보세요"}
          </p>
          <Button onClick={() => router.push("/dashboard/classes/add")}>
            <Plus className="h-4 w-4 mr-2" />
            클래스 추가
          </Button>
        </div>
      )}
    </div>
  );
}
