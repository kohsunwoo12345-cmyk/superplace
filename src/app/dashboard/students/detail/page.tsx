"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Clock, Award,
  BookOpen, MessageSquare, TrendingUp, FileText, Edit, QrCode, Copy
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

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

interface AttendanceCode {
  code: string;
  userId: string;
  isActive: number;
}

function StudentDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams?.get('id');

  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [attendanceCode, setAttendanceCode] = useState<AttendanceCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      fetchAttendanceCode();
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

  const fetchAttendanceCode = async () => {
    try {
      const response = await fetch(`/api/students/attendance-code?userId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceCode({
            code: data.code,
            userId: data.userId,
            isActive: data.isActive,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch attendance code:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* 출석 코드 섹션 */}
        {attendanceCode && (
          <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-indigo-600" />
                학생 출석 코드
              </CardTitle>
              <CardDescription>
                학생이 출석 인증 시 사용하는 고유 코드입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 코드 정보 */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-6 border-2 border-indigo-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">출석 코드</span>
                      <Badge variant={attendanceCode.isActive ? "default" : "secondary"}>
                        {attendanceCode.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-4xl font-bold text-indigo-600 tracking-widest font-mono">
                        {attendanceCode.code}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(attendanceCode.code)}
                        className="ml-auto"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-2">✓ 복사되었습니다</p>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>사용 방법:</strong><br/>
                      학생이 출석 인증 페이지에서 이 코드를 입력하면 자동으로 출석이 체크됩니다.
                    </p>
                  </div>
                </div>

                {/* QR 코드 */}
                <div className="flex flex-col items-center justify-center bg-white rounded-lg p-6 border-2 border-indigo-300">
                  <p className="text-sm text-gray-600 mb-4">QR 코드로 스캔</p>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={attendanceCode.code}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    카메라로 스캔하여 빠르게 인증
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
