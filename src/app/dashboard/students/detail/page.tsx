"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Clock, Award,
  BookOpen, MessageSquare, TrendingUp, FileText, Edit
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface StudentDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  academyId?: string;
  academyName?: string;
  createdAt: string;
  lastLoginAt?: string;
  points: number;
  balance: number;
  grade?: string;
  studentCode?: string;
  status?: string;
}

function StudentDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams?.get('id');

  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (studentId && user) {
      fetchStudentDetail();
    }
  }, [studentId, user]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // API는 { user: {...} } 형식으로 반환
        setStudent(data.user || data);
      } else {
        const errorData = await response.json().catch(() => ({ message: "학생 정보를 불러올 수 없습니다." }));
        setError(errorData.message || "학생 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch student detail:", error);
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">오류 발생</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{error || "학생 정보를 불러올 수 없습니다."}</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <User className="h-8 w-8 text-blue-600" />
                {student.name}
              </h1>
              <p className="text-gray-600 mt-1">{student.email}</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            정보 수정
          </Button>
        </div>

        {/* 기본 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                이메일
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium truncate">{student.email}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                전화번호
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{student.phone || "미등록"}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="w-4 h-4" />
                포인트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-purple-600">{student.points || 0}P</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                가입일
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {format(new Date(student.createdAt), "yyyy.MM.dd", { locale: ko })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 상세 정보 탭 */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="learning">학습 현황</TabsTrigger>
            <TabsTrigger value="attendance">출석 기록</TabsTrigger>
            <TabsTrigger value="activity">활동 내역</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>학생 상세 정보</CardTitle>
                <CardDescription>학생의 기본 정보 및 소속</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">이름</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">이메일</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">전화번호</p>
                    <p className="font-medium">{student.phone || "미등록"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">학원</p>
                    <p className="font-medium">{student.academyName || "미배정"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">포인트</p>
                    <p className="font-medium text-purple-600">{student.points || 0}P</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">잔액</p>
                    <p className="font-medium text-blue-600">{(student.balance || 0).toLocaleString()}원</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">가입일</p>
                    <p className="font-medium">
                      {format(new Date(student.createdAt), "yyyy년 MM월 dd일", { locale: ko })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">마지막 로그인</p>
                    <p className="font-medium">
                      {student.lastLoginAt 
                        ? format(new Date(student.lastLoginAt), "yyyy.MM.dd HH:mm", { locale: ko })
                        : "기록 없음"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning">
            <Card>
              <CardHeader>
                <CardTitle>학습 현황</CardTitle>
                <CardDescription>수강 중인 과목 및 진도</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">학습 데이터를 준비 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>출석 기록</CardTitle>
                <CardDescription>최근 출석 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">출석 기록을 준비 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>활동 내역</CardTitle>
                <CardDescription>AI 채팅, 숙제 제출 등</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">활동 데이터를 준비 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <StudentDetailContent />
    </Suspense>
  );
}
