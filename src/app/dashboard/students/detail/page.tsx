"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Mail, Phone, Calendar, MessageSquare,
  TrendingUp, Brain, Loader2, RefreshCw, CheckCircle, XCircle,
  ClipboardCheck, AlertTriangle, QrCode, Copy, Check
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface StudentDetail {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  academy_id?: number;
  academyName?: string;
  created_at?: string;
  student_code?: string;
}

interface AttendanceCode {
  code: string;
  userId: string;
  isActive: number;
}

interface ChatMessage {
  id: number;
  studentId: number;
  message: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface CompetencyAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  chatCount: number;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

interface WeakConcept {
  concept: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  relatedTopics: string[];
}

interface ConceptRecommendation {
  concept: string;
  action: string;
}

function StudentDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams?.get('id');

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<CompetencyAnalysis | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([]);
  const [conceptRecommendations, setConceptRecommendations] = useState<ConceptRecommendation[]>([]);
  const [conceptSummary, setConceptSummary] = useState<string>("");
  const [studentCode, setStudentCode] = useState<string>("");
  const [attendanceCode, setAttendanceCode] = useState<AttendanceCode | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [conceptAnalyzingLoading, setConceptAnalyzingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [attendanceCodeCopied, setAttendanceCodeCopied] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, router]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      // 1. 학생 기본 정보
      const userResponse = await fetch(`/api/admin/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const studentData = userData.user || userData;
        setStudent(studentData);
        
        // student_code가 없으면 자동 생성
        if (!studentData.student_code) {
          console.log('🔑 No student code found, generating...');
          try {
            const codeResponse = await fetch(`/api/students/generate-code`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ studentId }),
            });
            
            if (codeResponse.ok) {
              const codeData = await codeResponse.json();
              setStudentCode(codeData.studentCode);
              console.log('✅ Student code generated:', codeData.studentCode);
            } else {
              setStudentCode("");
            }
          } catch (error) {
            console.error('Failed to generate student code:', error);
            setStudentCode("");
          }
        } else {
          setStudentCode(studentData.student_code);
        }
      } else {
        throw new Error("학생 정보를 불러올 수 없습니다.");
      }

      // 2. AI 챗봇 대화 내역
      const chatResponse = await fetch(`/api/students/chat-history?studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChatHistory(chatData.chatHistory || []);
      }

      // 3. 출결 정보
      const attendanceResponse = await fetch(`/api/students/attendance?studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData.attendance || []);
        setAttendanceStats(attendanceData.stats || null);
      }

      // 4. 출석 코드 조회
      const attendanceCodeResponse = await fetch(`/api/students/attendance-code?userId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (attendanceCodeResponse.ok) {
        const codeData = await attendanceCodeResponse.json();
        if (codeData.success) {
          setAttendanceCode({
            code: codeData.code,
            userId: codeData.userId,
            isActive: codeData.isActive,
          });
        }
      }

      // 5. 캐시된 부족한 개념 분석 결과 조회
      const weakConceptsResponse = await fetch(`/api/students/weak-concepts?studentId=${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (weakConceptsResponse.ok) {
        const weakConceptsData = await weakConceptsResponse.json();
        if (weakConceptsData.cached && weakConceptsData.weakConcepts.length > 0) {
          console.log('📦 Loaded cached weak concepts analysis');
          setWeakConcepts(weakConceptsData.weakConcepts || []);
          setConceptRecommendations(weakConceptsData.recommendations || []);
          setConceptSummary(weakConceptsData.summary || "");
        }
      }

    } catch (error: any) {
      console.error("Failed to fetch student data:", error);
      setError(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeCompetency = async () => {
    try {
      setAnalyzingLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        throw new Error("역량 분석에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Failed to analyze competency:", error);
      alert(error.message || "역량 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingLoading(false);
    }
  };

  const analyzeWeakConcepts = async () => {
    try {
      setConceptAnalyzingLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/weak-concepts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWeakConcepts(data.weakConcepts || []);
        setConceptRecommendations(data.recommendations || []);
        setConceptSummary(data.summary || "");
      } else {
        throw new Error("부족한 개념 분석에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Failed to analyze weak concepts:", error);
      alert(error.message || "부족한 개념 분석 중 오류가 발생했습니다.");
    } finally {
      setConceptAnalyzingLoading(false);
    }
  };

  const generateStudentCode = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudentCode(data.studentCode);
        alert("학생 코드가 생성되었습니다!");
      } else {
        throw new Error("학생 코드 생성에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Failed to generate student code:", error);
      alert(error.message || "학생 코드 생성 중 오류가 발생했습니다.");
    }
  };

  const copyStudentCode = () => {
    if (studentCode) {
      navigator.clipboard.writeText(studentCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const copyAttendanceCode = () => {
    if (attendanceCode?.code) {
      navigator.clipboard.writeText(attendanceCode.code);
      setAttendanceCodeCopied(true);
      setTimeout(() => setAttendanceCodeCopied(false), 2000);
    }
  };

  const toggleAttendanceCodeStatus = async () => {
    if (!attendanceCode || !studentId) return;

    try {
      const token = localStorage.getItem("token");
      const newStatus = attendanceCode.isActive === 1 ? 0 : 1;

      const response = await fetch(`/api/students/activate-attendance-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: studentId, 
          isActive: newStatus === 1 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceCode({
          ...attendanceCode,
          isActive: data.isActive,
        });
        alert(data.message);
      } else {
        throw new Error("출석 코드 상태 변경에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Failed to toggle attendance code status:", error);
      alert(error.message || "출석 코드 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-500">출석</Badge>;
      case 'late':
        return <Badge variant="default" className="bg-yellow-500">지각</Badge>;
      case 'absent':
        return <Badge variant="default" className="bg-red-500">결석</Badge>;
      case 'excused':
        return <Badge variant="default" className="bg-blue-500">병결</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300';
      case 'low':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-gray-600">{error || "학생을 찾을 수 없습니다."}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">뒤로가기</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 truncate">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <span className="truncate">{student.name}</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{student.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
            <TabsTrigger value="info" className="text-xs sm:text-sm">개인 정보</TabsTrigger>
            <TabsTrigger value="code" className="text-xs sm:text-sm">학생 코드</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">출결</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">AI 대화</TabsTrigger>
            <TabsTrigger value="concepts" className="text-xs sm:text-sm">부족한 개념</TabsTrigger>
          </TabsList>

          {/* 개인 정보 탭 */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>학생의 기본 정보를 확인할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">이름</p>
                      <p className="font-medium">{student.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>

                  {student.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">전화번호</p>
                        <p className="font-medium">{student.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-0.5">
                      {student.role}
                    </Badge>
                    <div>
                      <p className="text-sm text-gray-500">역할</p>
                      <p className="font-medium">학생</p>
                    </div>
                  </div>

                  {student.academyName && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">소속 학원</p>
                        <p className="font-medium">{student.academyName}</p>
                      </div>
                    </div>
                  )}

                  {student.created_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">가입일</p>
                        <p className="font-medium">
                          {new Date(student.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 역량 분석 카드 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI 기반 역량 분석
                    </CardTitle>
                    <CardDescription>
                      Gemini AI가 학생의 대화를 분석하여 역량을 평가합니다
                    </CardDescription>
                  </div>
                  <Button
                    onClick={analyzeCompetency}
                    disabled={analyzingLoading || chatHistory.length === 0}
                  >
                    {analyzingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        역량 분석 실행
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!analysis ? (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {chatHistory.length === 0
                        ? "분석할 대화 내역이 없습니다."
                        : "역량 분석을 시작해보세요."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">
                        {analysis.summary}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        분석된 대화: {analysis.chatCount}개
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          강점
                        </h4>
                        <ul className="space-y-1">
                          {analysis.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-green-600">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          개선 필요
                        </h4>
                        <ul className="space-y-1">
                          {analysis.weaknesses.slice(0, 3).map((weakness, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-red-600">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 학생 코드 탭 */}
          <TabsContent value="code" className="space-y-4">
            {/* 출석용 6자리 코드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-green-600" />
                  출석 코드 (6자리)
                </CardTitle>
                <CardDescription>
                  출석 체크 시 사용하는 학생 전용 6자리 코드입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {attendanceCode ? (
                  <>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-3">출석 코드</p>
                        <div className="flex items-center gap-3">
                          <code className="px-8 py-4 bg-green-50 border-2 border-green-200 rounded-lg font-mono text-4xl font-bold text-green-700 tracking-widest">
                            {attendanceCode.code}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyAttendanceCode}
                            className="h-12 w-12"
                          >
                            {attendanceCodeCopied ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          <Button
                            variant={attendanceCode.isActive ? "default" : "outline"}
                            size="sm"
                            onClick={toggleAttendanceCodeStatus}
                            className={attendanceCode.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {attendanceCode.isActive ? "활성화됨 (클릭하여 비활성화)" : "비활성화됨 (클릭하여 활성화)"}
                          </Button>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="p-4 sm:p-6 bg-white border-2 border-green-200 rounded-lg">
                        <QRCodeSVG 
                          value={attendanceCode.code} 
                          size={window.innerWidth < 640 ? 150 : 200}
                          className="w-full h-auto max-w-[200px]"
                        />
                        <p className="text-center text-xs text-gray-500 mt-3">
                          출석 QR 코드
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        사용 방법
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 출석 체크 시 이 6자리 코드를 입력하세요</li>
                        <li>• QR 코드를 스캔하여 빠르게 출석 처리 가능</li>
                        <li>• 코드는 학생마다 고유하게 부여됩니다</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">출석 코드를 불러오는 중...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 학생 식별 코드 (기존) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  학생 식별 코드
                </CardTitle>
                <CardDescription>
                  학생의 고유 식별 코드입니다 (시스템용)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentCode ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">식별 코드</p>
                        <div className="flex items-center gap-2">
                          <code className="px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                            {studentCode}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyStudentCode}
                          >
                            {codeCopied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={generateStudentCode}
                      className="w-full"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      새 코드 생성
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-3">식별 코드가 생성되지 않았습니다.</p>
                    <Button onClick={generateStudentCode} size="sm">
                      코드 생성하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 출결 탭 */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-green-600" />
                      출결 관리
                    </CardTitle>
                    <CardDescription>
                      학생의 출결 기록을 확인할 수 있습니다
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchStudentData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <Card className="border-2 border-gray-100">
                      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-gray-500">총 출결</p>
                        <p className="text-xl sm:text-2xl font-bold">{attendanceStats.total}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-green-100">
                      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-gray-500">출석</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{attendanceStats.present}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-yellow-100">
                      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-gray-500">지각</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600">{attendanceStats.late}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-red-100">
                      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-gray-500">결석</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{attendanceStats.absent}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-blue-100">
                      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                        <p className="text-xs sm:text-sm text-gray-500">출석률</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">출결 기록이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record) => (
                      <div
                        key={record.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">
                              {new Date(record.date).toLocaleDateString('ko-KR')}
                            </p>
                            {record.checkInTime && (
                              <p className="text-xs text-gray-500">
                                입실: {record.checkInTime}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 대화 내역 탭 */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>AI 챗봇 대화 내역</CardTitle>
                    <CardDescription>
                      총 {chatHistory.length}개의 대화가 있습니다
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchStudentData} className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {chatHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">아직 대화 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className="text-[10px] sm:text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 부족한 개념 탭 */}
          <TabsContent value="concepts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      부족한 개념 분석
                    </CardTitle>
                    <CardDescription className="mt-1">
                      AI가 대화 내역과 숙제 채점 데이터를 분석하여 학생이 어려워하는 개념을 찾아냅니다
                    </CardDescription>
                  </div>
                  <Button
                    onClick={analyzeWeakConcepts}
                    disabled={conceptAnalyzingLoading}
                    className="w-full sm:w-auto whitespace-nowrap"
                    size="sm"
                  >
                    {conceptAnalyzingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        개념 분석 실행
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {weakConcepts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      개념 분석 버튼을 클릭하여 AI 분석을 시작해보세요.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      대화 내역과 숙제 데이터를 종합하여 분석합니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {conceptSummary && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">전반적인 이해도</h4>
                        <p className="text-sm text-gray-700">{conceptSummary}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-3 text-sm sm:text-base">부족한 개념</h4>
                      <div className="space-y-3">
                        {weakConcepts.map((concept, idx) => (
                          <div
                            key={idx}
                            className={`p-3 sm:p-4 border-2 rounded-lg ${getSeverityColor(concept.severity)}`}
                          >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                              <h5 className="font-semibold text-sm sm:text-base">{concept.concept}</h5>
                              <Badge 
                                variant={concept.severity === 'high' ? 'destructive' : 'outline'}
                                className="text-xs whitespace-nowrap"
                              >
                                {concept.severity === 'high' ? '높음' : concept.severity === 'medium' ? '중간' : '낮음'}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 mb-2">{concept.description}</p>
                            {concept.relatedTopics && concept.relatedTopics.length > 0 && (
                              <div className="flex gap-1 flex-wrap mb-3">
                                {concept.relatedTopics.map((topic, topicIdx) => (
                                  <Badge key={topicIdx} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-xs sm:text-sm"
                              onClick={() => {
                                alert(`${concept.concept}에 대한 유사문제를 생성합니다.`);
                                // TODO: 유사문제 생성 API 호출
                              }}
                            >
                              📝 유사문제 출제
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {conceptRecommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">학습 개선 방안</h4>
                        <div className="space-y-2">
                          {conceptRecommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">{rec.concept}</p>
                                <p className="text-sm text-gray-700">{rec.action}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <StudentDetailContent />
    </Suspense>
  );
}
