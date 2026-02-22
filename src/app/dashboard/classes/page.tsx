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
  Loader2,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  Edit,
} from "lucide-react";

// 학생용 타입
type ProgressAnalysis = {
  currentProgress: string;
  level: string;
  mainTopics: string[];
  nextExpected: string;
  summary: string;
  details: string;
};

type ClassProgressData = {
  success: boolean;
  hasClass: boolean;
  hasData: boolean;
  className?: string;
  classGrade?: string;
  classDescription?: string;
  classmatesCount?: number;
  homeworkCount?: number;
  message?: string;
  student: {
    id: number;
    name: string;
    grade: string | null;
  };
  progressAnalysis?: ProgressAnalysis;
};

// 관리자/학원장용 타입
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 학생용 상태
  const [classData, setClassData] = useState<ClassProgressData | null>(null);

  // 관리자/학원장용 상태
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);

      const role = userData.role?.toUpperCase();
      const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
      const isDirector = role === "DIRECTOR";
      const isStudent = role === "STUDENT";

      if (isAdmin || isDirector) {
        // 관리자/학원장: 클래스 목록 로드
        loadClasses();
      } else if (isStudent) {
        // 학생: 진도 확인
        loadClassProgress(userData.id);
      } else {
        // 선생님: 클래스 목록 로드
        loadClasses();
      }
    } catch (error) {
      console.error("사용자 정보 파싱 오류:", error);
      router.push("/login");
    }
  }, [router]);

  // 학생용: 진도 로드
  const loadClassProgress = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/my-class-progress?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📚 나의 반 데이터:', data);
        setClassData(data);
      } else {
        console.error('반 진도 조회 실패:', response.status);
      }
    } catch (error) {
      console.error("반 진도 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 관리자/학원장용: 클래스 목록 로드
  const loadClasses = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem('user');
      
      console.log('📚 Loading classes...');
      console.log('👤 Current user:', storedUser ? JSON.parse(storedUser) : null);
      
      if (!token) {
        console.error('토큰 없음');
        router.push('/login');
        return;
      }

      console.log('📚 클래스 목록 로드 중...');

      // Add cache buster to force fresh API call
      const cacheBuster = `?_t=${Date.now()}`;
      const response = await fetch(`/api/classes${cacheBuster}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 클래스 데이터:', data);
        console.log('📊 클래스 개수:', data.classes?.length || 0);
        
        // 임시 디버그: 클래스가 0개면 alert로 상세 정보 표시
        if (!data.classes || data.classes.length === 0) {
          const debugInfo = {
            user: storedUser ? JSON.parse(storedUser) : null,
            apiResponse: data,
            message: "API는 응답했지만 클래스가 0개입니다"
          };
          console.error('🚨 클래스 0개 디버그:', debugInfo);
          // alert(JSON.stringify(debugInfo, null, 2));
        }
        
        setClasses(data.classes || []);
      } else if (response.status === 401) {
        console.error('❌ 인증 실패');
        router.push('/login');
      } else {
        console.error('❌ 클래스 조회 실패:', response.status);
        const errorData = await response.json();
        console.error('❌ 오류 내용:', errorData);
        setClasses([]);
      }
    } catch (error) {
      console.error("반 목록 로딩 오류:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClass = async (classId: string, className: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!confirm(`"${className}" 반을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/classes?id=${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('반이 삭제되었습니다.');
        // 목록 새로고침
        window.location.reload();
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
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 학생용 화면
  if (user?.role?.toUpperCase() === "STUDENT") {
    return <StudentClassView classData={classData} />;
  }

  // 관리자/학원장/선생님용 화면
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
            onClick={() => {
              setClasses([]);
              loadClasses();
            }}
            variant="outline"
            className="w-full sm:w-auto"
          >
            새로고침
          </Button>
          {(user?.role?.toUpperCase() === "SUPER_ADMIN" || 
            user?.role?.toUpperCase() === "ADMIN" ||
            user?.role?.toUpperCase() === "DIRECTOR") && (
            <Button
              onClick={() => router.push("/dashboard/classes/add")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              클래스 추가
            </Button>
          )}
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
                {(user?.role?.toUpperCase() === "SUPER_ADMIN" || 
                  user?.role?.toUpperCase() === "ADMIN" ||
                  user?.role?.toUpperCase() === "DIRECTOR") && (
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
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">클래스가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? "검색 결과가 없습니다"
              : "새로운 클래스를 추가해보세요"}
          </p>
          {/* 디버그 정보 */}
          {user && (
            <details className="mt-4 text-left max-w-2xl mx-auto">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                🔍 디버그 정보 보기
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded text-xs text-left">
                <div className="mb-2">
                  <strong>사용자 정보:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
                </div>
                <div className="mb-2">
                  <strong>API 응답 (console.log 확인):</strong>
                  <p className="mt-1">F12 → Console 탭에서 "클래스 데이터" 확인</p>
                </div>
                <div>
                  <strong>해결 방법:</strong>
                  <ol className="mt-1 ml-4 list-decimal">
                    <li>F12 키를 눌러 개발자 도구 열기</li>
                    <li>Console 탭에서 "클래스 데이터" 검색</li>
                    <li>스크린샷 공유</li>
                  </ol>
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// 학생용 화면 컴포넌트
function StudentClassView({ classData }: { classData: ClassProgressData | null }) {
  const router = useRouter();

  if (!classData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">데이터를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  // 소속된 반이 없는 경우
  if (!classData.hasClass) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              나의 반
            </CardTitle>
            <CardDescription>내가 속한 반의 진도를 확인합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">소속된 반이 없습니다</h3>
              <p className="text-gray-600 mb-6">
                선생님께서 반에 배정해주시면 진도를 확인할 수 있습니다.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  💡 반 배정은 선생님께 문의해주세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 반은 있지만 데이터가 없는 경우
  if (!classData.hasData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">나의 반</h1>
          <p className="text-gray-600">우리 반의 현재 진도를 확인합니다</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              {classData.className}
            </CardTitle>
            <CardDescription>
              {classData.classGrade && `${classData.classGrade} | `}
              같은 반 학생 {classData.classmatesCount}명
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">아직 숙제 검사 데이터가 없습니다</h3>
              <p className="text-gray-600 mb-6">
                숙제를 제출하고 검사를 받으면 우리 반의 진도를 확인할 수 있습니다.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  💡 숙제를 꾸준히 제출하면 AI가 우리 반의 학습 진도를 분석해드립니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 진도 데이터가 있는 경우
  const analysis = classData.progressAnalysis!;
  const levelColor = {
    '상': 'text-green-600 bg-green-50',
    '중': 'text-blue-600 bg-blue-50',
    '하': 'text-orange-600 bg-orange-50'
  }[analysis.level] || 'text-gray-600 bg-gray-50';

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">나의 반</h1>
        <p className="text-gray-600">우리 반의 현재 학습 진도를 확인합니다</p>
      </div>

      {/* 반 정보 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {classData.className}
          </CardTitle>
          <CardDescription>
            {classData.classGrade && `${classData.classGrade} | `}
            같은 반 학생 {classData.classmatesCount}명 · 최근 숙제 {classData.homeworkCount}건
          </CardDescription>
        </CardHeader>
        {classData.classDescription && (
          <CardContent>
            <p className="text-sm text-gray-600">{classData.classDescription}</p>
          </CardContent>
        )}
      </Card>

      {/* 현재 진도 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            현재 진도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={levelColor}>
                  학습 수준: {analysis.level}
                </Badge>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {analysis.currentProgress}
              </h3>
              <p className="text-gray-600">
                {analysis.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주요 학습 내용 */}
      {analysis.mainTopics && analysis.mainTopics.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              주요 학습 내용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {analysis.mainTopics.map((topic, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{topic}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 다음 예상 진도 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            다음 예상 진도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-900 font-medium">
              {analysis.nextExpected}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 상세 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            상세 분석
          </CardTitle>
          <CardDescription>
            최근 30일간 우리 반 숙제 검사 데이터 기반
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line">
              {analysis.details}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 업데이트 안내 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          💡 진도 정보는 우리 반 학생들의 숙제 제출 현황을 바탕으로 AI가 자동으로 분석합니다
        </p>
      </div>
    </div>
  );
}
