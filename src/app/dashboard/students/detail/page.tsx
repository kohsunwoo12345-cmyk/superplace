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
  ClipboardCheck, AlertTriangle, Copy, Check, QrCode
} from "lucide-react";

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

interface HomeworkSubmission {
  id: string;
  userId: number;
  score: number;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  feedback: string;
  strengths: string;
  suggestions: string;
  weaknessTypes: string[];
  detailedAnalysis: string;
  studyDirection: string;
  submittedAt: string;
  gradedAt: string;
  imageCount: number;
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
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [studentCode, setStudentCode] = useState<string>("");
  const [attendanceCode, setAttendanceCode] = useState<AttendanceCode | null>(null);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);
  const [generatingSimilarProblems, setGeneratingSimilarProblems] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasAdminBackup, setHasAdminBackup] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [conceptAnalyzingLoading, setConceptAnalyzingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [attendanceCodeCopied, setAttendanceCodeCopied] = useState(false);

  useEffect(() => {
    // Client-side only flag
    setIsClient(true);
    
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    if (studentId) {
      // Check for admin backup in sessionStorage (client-side only)
      if (typeof window !== 'undefined' && sessionStorage.getItem('admin_backup_user')) {
        setHasAdminBackup(true);
      }
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

      // 5. 숙제 제출 내역 조회
      const homeworkResponse = await fetch(`/api/homework/results?role=ADMIN&email=admin@superplace.co.kr`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (homeworkResponse.ok) {
        const homeworkData = await homeworkResponse.json();
        if (homeworkData.success && homeworkData.submissions) {
          // 해당 학생의 숙제만 필터링
          const studentHomework = homeworkData.submissions.filter(
            (hw: any) => hw.userId === parseInt(studentId || '0')
          );
          setHomeworkSubmissions(studentHomework);
          console.log(`✅ 학생 숙제 ${studentHomework.length}건 로드됨`);
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
        setDailyProgress(data.dailyProgress || []);
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

  const generateSimilarProblems = async () => {
    try {
      setGeneratingSimilarProblems(true);
      const token = localStorage.getItem("token");

      // 최근 틀린 문제들의 약점 유형 수집
      const recentHomework = homeworkSubmissions.slice(0, 5); // 최근 5개
      const weaknessTypes = new Set<string>();
      recentHomework.forEach(hw => {
        if (hw.weaknessTypes && Array.isArray(hw.weaknessTypes)) {
          hw.weaknessTypes.forEach(type => weaknessTypes.add(type));
        }
      });

      const weaknessTypesArray = Array.from(weaknessTypes);

      if (weaknessTypesArray.length === 0) {
        alert("분석 가능한 약점 유형이 없습니다. 먼저 숙제를 제출해주세요.");
        return;
      }

      console.log('🎯 약점 유형:', weaknessTypesArray);

      const response = await fetch(`/api/homework/generate-similar-problems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId,
          weaknessTypes: weaknessTypesArray,
          studentName: student?.name || '학생'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 새 탭에서 유사문제 페이지 열기
          const problemsWindow = window.open('', '_blank');
          if (problemsWindow) {
            problemsWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>${student?.name}님 맞춤 유사문제</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * { box-sizing: border-box; }
                  body { 
                    font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; 
                    padding: 40px; 
                    max-width: 1000px; 
                    margin: 0 auto; 
                    background: #f9fafb;
                    line-height: 1.6;
                  }
                  h1 { 
                    color: #1e40af; 
                    text-align: center;
                    margin-bottom: 10px;
                  }
                  .header-info {
                    text-align: center;
                    color: #6b7280;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                  }
                  .weakness-types {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 15px;
                  }
                  .weakness-type { 
                    display: inline-block; 
                    background: #fef3c7; 
                    color: #92400e; 
                    padding: 6px 16px; 
                    border-radius: 16px; 
                    font-size: 14px;
                    font-weight: 500;
                  }
                  .print-btn { 
                    background: #2563eb; 
                    color: white; 
                    padding: 12px 32px; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 16px; 
                    margin: 20px auto;
                    display: block;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                  }
                  .print-btn:hover { 
                    background: #1d4ed8;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
                    transform: translateY(-1px);
                  }
                  
                  /* 문제 섹션 스타일 */
                  .problem-section {
                    background: white;
                    margin: 30px 0;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                  }
                  .weakness-title {
                    color: #dc2626;
                    font-size: 22px;
                    margin-top: 0;
                    padding-bottom: 15px;
                    border-bottom: 3px solid #fee2e2;
                  }
                  
                  /* 난이도별 그룹 */
                  .difficulty-group {
                    margin: 25px 0;
                    padding: 20px;
                    border-radius: 10px;
                    background: #fafafa;
                  }
                  .difficulty-level {
                    font-size: 18px;
                    font-weight: 700;
                    margin: 0 0 15px 0;
                    padding: 10px 15px;
                    border-radius: 8px;
                    display: inline-block;
                  }
                  .difficulty-level.basic {
                    background: #dbeafe;
                    color: #1e40af;
                  }
                  .difficulty-level.variation {
                    background: #fef3c7;
                    color: #92400e;
                  }
                  .difficulty-level.advanced {
                    background: #fee2e2;
                    color: #991b1b;
                  }
                  
                  /* 문제 스타일 */
                  .problem { 
                    background: white;
                    margin: 20px 0; 
                    padding: 25px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 10px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                  }
                  .problem-content {
                    margin-bottom: 15px;
                  }
                  .problem-content p {
                    font-size: 16px;
                    color: #1f2937;
                    line-height: 1.8;
                  }
                  .problem-content strong {
                    color: #111827;
                    font-size: 17px;
                  }
                  
                  /* Details 스타일 */
                  details { 
                    margin: 12px 0; 
                    padding: 15px; 
                    border-radius: 8px;
                    cursor: pointer;
                  }
                  details.hint {
                    background: #eff6ff;
                    border-left: 4px solid #3b82f6;
                  }
                  details.solution {
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                  }
                  summary { 
                    font-weight: 600; 
                    color: #374151;
                    font-size: 15px;
                    padding: 5px 0;
                    list-style: none;
                  }
                  summary::-webkit-details-marker {
                    display: none;
                  }
                  summary:hover {
                    opacity: 0.8;
                  }
                  details[open] summary {
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  details p {
                    color: #4b5563;
                    margin: 8px 0;
                  }
                  .solution-steps {
                    margin-top: 15px;
                    padding: 15px;
                    background: #f9fafb;
                    border-radius: 6px;
                  }
                  .solution-steps ol {
                    margin: 10px 0;
                    padding-left: 25px;
                  }
                  .solution-steps li {
                    margin: 8px 0;
                    line-height: 1.7;
                    color: #374151;
                  }
                  
                  .footer {
                    text-align: center;
                    color: #9ca3af;
                    font-size: 14px;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                  }
                  
                  @media print { 
                    .print-btn { display: none; }
                    body { background: white; }
                    .problem-section { box-shadow: none; page-break-inside: avoid; }
                    .difficulty-group { page-break-inside: avoid; }
                  }
                </style>
              </head>
              <body>
                <h1>📚 ${student?.name}님 맞춤 유사문제</h1>
                <div class="header-info">
                  <p><strong>생성일:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                  <p><strong>분석된 약점 유형:</strong></p>
                  <div class="weakness-types">
                    ${weaknessTypesArray.map(t => `<span class="weakness-type">${t}</span>`).join('')}
                  </div>
                </div>
                <button class="print-btn" onclick="window.print()">🖨️ 인쇄하기</button>
                
                ${data.problems}
                
                <div class="footer">
                  <p>이 문제는 학생의 약점 분석을 바탕으로 AI가 생성한 맞춤형 유사문제입니다.</p>
                  <p>슈퍼플레이스 스터디 - 생성일: ${new Date().toLocaleString('ko-KR')}</p>
                </div>
              </body>
              </html>
            `);
          }
        } else {
          alert(data.error || "유사문제 생성에 실패했습니다.");
        }
      } else {
        throw new Error("유사문제 생성에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Failed to generate similar problems:", error);
      alert(error.message || "유사문제 생성 중 오류가 발생했습니다.");
    } finally {
      setGeneratingSimilarProblems(false);
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
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
          <Button 
            onClick={generateSimilarProblems}
            disabled={generatingSimilarProblems || homeworkSubmissions.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {generatingSimilarProblems ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                유사문제 출제
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">전체</TabsTrigger>
            <TabsTrigger value="info">개인 정보</TabsTrigger>
            <TabsTrigger value="code">학생 코드</TabsTrigger>
            <TabsTrigger value="attendance">출결</TabsTrigger>
            <TabsTrigger value="chat">AI 대화</TabsTrigger>
            <TabsTrigger value="concepts">부족한 개념</TabsTrigger>
          </TabsList>

          {/* 전체 탭 - 새로 추가 */}
          <TabsContent value="overview" className="space-y-4">
            {/* 이번 달 출결 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  이번 달 출결 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{attendanceStats.total}</p>
                      <p className="text-sm text-gray-600">총 출석일</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                      <p className="text-sm text-gray-600">출석</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                      <p className="text-sm text-gray-600">지각</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                      <p className="text-sm text-gray-600">결석</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {attendanceStats.attendanceRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">출석률</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">출석 데이터가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            {/* 숙제 제출 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-green-600" />
                  숙제 제출 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homeworkSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{homeworkSubmissions.length}</p>
                        <p className="text-sm text-gray-600">총 제출</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {(homeworkSubmissions.reduce((acc, hw) => acc + hw.score, 0) / homeworkSubmissions.length).toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">평균 점수</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {homeworkSubmissions[0]?.subject || '-'}
                        </p>
                        <p className="text-sm text-gray-600">최근 과목</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">최근 제출 (최대 5개)</h4>
                      {homeworkSubmissions.slice(0, 5).map((hw, idx) => (
                        <div key={hw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={hw.score >= 80 ? "default" : hw.score >= 60 ? "secondary" : "destructive"}>
                                {hw.score}점
                              </Badge>
                              <span className="text-sm font-medium">{hw.subject}</span>
                              <span className="text-xs text-gray-500">
                                ({hw.correctAnswers}/{hw.totalQuestions})
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              제출: {new Date(hw.submittedAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          {hw.score >= 80 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">아직 제출한 숙제가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            {/* 부족한 개념 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  보통 부족한 개념
                </CardTitle>
              </CardHeader>
              <CardContent>
                {homeworkSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {/* 약점 유형 통계 */}
                    {(() => {
                      const weaknessCount = new Map<string, number>();
                      homeworkSubmissions.forEach(hw => {
                        if (hw.weaknessTypes && Array.isArray(hw.weaknessTypes)) {
                          hw.weaknessTypes.forEach(type => {
                            weaknessCount.set(type, (weaknessCount.get(type) || 0) + 1);
                          });
                        }
                      });
                      
                      const sortedWeaknesses = Array.from(weaknessCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                      
                      return sortedWeaknesses.length > 0 ? (
                        <div className="space-y-2">
                          {sortedWeaknesses.map(([type, count], idx) => (
                            <div key={type} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-yellow-800">{idx + 1}.</span>
                                <span className="text-sm font-medium">{type}</span>
                              </div>
                              <Badge variant="outline">{count}회 반복</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">약점 유형 데이터가 없습니다.</p>
                      );
                    })()}
                    
                    {/* 개선 제안 */}
                    {homeworkSubmissions[0]?.suggestions && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 개선 할 점</h4>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">
                          {homeworkSubmissions[0].suggestions}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">숙제 제출 후 분석 결과가 표시됩니다.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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

            {/* 학생 계정 로그인 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  학생 계정 접속
                </CardTitle>
                <CardDescription>
                  학생의 관점에서 시스템을 확인하거나 테스트할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-900 mb-4">
                    이 버튼을 클릭하면 학생 계정으로 자동 로그인됩니다. 
                    학생이 보는 화면을 확인하거나 문제를 테스트할 수 있습니다.
                  </p>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      if (confirm(`${student.name} 학생 계정으로 로그인하시겠습니까?`)) {
                        // 현재 관리자/교사 정보를 임시 저장 (client-side only)
                        if (typeof window !== 'undefined') {
                          const currentUser = localStorage.getItem('user');
                          const currentToken = localStorage.getItem('token');
                          if (currentUser && currentToken) {
                            sessionStorage.setItem('admin_backup_user', currentUser);
                            sessionStorage.setItem('admin_backup_token', currentToken);
                            setHasAdminBackup(true);
                          }
                        }
                        
                        // 학생 계정으로 전환
                        localStorage.setItem('user', JSON.stringify({
                          id: student.id,
                          email: student.email,
                          name: student.name,
                          role: 'STUDENT',
                          academyId: student.academy_id
                        }));
                        
                        // 학생 대시보드로 이동
                        alert(`${student.name} 학생으로 로그인되었습니다.\n\n원래 계정으로 돌아가려면 로그아웃 후 다시 로그인하세요.`);
                        window.location.href = '/';
                      }
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {student.name} 계정으로 로그인
                  </Button>
                  
                  {isClient && hasAdminBackup && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-xs text-indigo-700 mb-2">
                        💡 원래 계정으로 돌아가기
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const backupUser = sessionStorage.getItem('admin_backup_user');
                            const backupToken = sessionStorage.getItem('admin_backup_token');
                            if (backupUser && backupToken) {
                              localStorage.setItem('user', backupUser);
                              localStorage.setItem('token', backupToken);
                              sessionStorage.removeItem('admin_backup_user');
                              sessionStorage.removeItem('admin_backup_token');
                              setHasAdminBackup(false);
                              window.location.href = '/dashboard';
                            }
                          }
                        }}
                      >
                        관리자 계정으로 복귀
                      </Button>
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        사용 방법
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 출석 체크 시 이 6자리 코드를 입력하세요</li>
                        <li>• 코드는 학생마다 고유하게 부여됩니다</li>
                        <li>• 코드가 활성화되어 있어야 출석 체크가 가능합니다</li>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card className="border-2 border-gray-100">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500">총 출결</p>
                        <p className="text-2xl font-bold">{attendanceStats.total}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-green-100">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500">출석</p>
                        <p className="text-2xl font-bold text-green-600">{attendanceStats.present}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-yellow-100">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500">지각</p>
                        <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-red-100">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500">결석</p>
                        <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}일</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-blue-100">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500">출석률</p>
                        <p className="text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</p>
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
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI 챗봇 대화 내역</CardTitle>
                    <CardDescription>
                      총 {chatHistory.length}개의 대화가 있습니다
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchStudentData}>
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
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      부족한 개념 분석
                    </CardTitle>
                    <CardDescription>
                      숙제 제출 데이터를 분석하여 학생이 어려워하는 개념을 찾아냅니다
                    </CardDescription>
                  </div>
                  <Button
                    onClick={analyzeWeakConcepts}
                    disabled={conceptAnalyzingLoading || homeworkSubmissions.length === 0}
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
                      {homeworkSubmissions.length === 0
                        ? "분석할 숙제 제출 내역이 없습니다."
                        : "개념 분석을 시작해보세요."}
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
                      <h4 className="font-semibold mb-3">부족한 개념</h4>
                      <div className="space-y-3">
                        {weakConcepts.map((concept, idx) => (
                          <div
                            key={idx}
                            className={`p-4 border-2 rounded-lg ${getSeverityColor(concept.severity)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold">{concept.concept}</h5>
                              <Badge variant={concept.severity === 'high' ? 'destructive' : 'outline'}>
                                {concept.severity === 'high' ? '높음' : concept.severity === 'medium' ? '중간' : '낮음'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{concept.description}</p>
                            {concept.relatedTopics && concept.relatedTopics.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {concept.relatedTopics.map((topic, topicIdx) => (
                                  <Badge key={topicIdx} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
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

                    {dailyProgress.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          매일매일 학습 기록
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="px-3 py-2 text-left font-medium">날짜</th>
                                <th className="px-3 py-2 text-left font-medium">과목</th>
                                <th className="px-3 py-2 text-center font-medium">점수</th>
                                <th className="px-3 py-2 text-center font-medium">상태</th>
                                <th className="px-3 py-2 text-left font-medium">메모</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyProgress.map((progress, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="px-3 py-2">{progress.date}</td>
                                  <td className="px-3 py-2">{progress.subject}</td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge 
                                      variant={progress.score >= 80 ? "default" : progress.score >= 60 ? "secondary" : "destructive"}
                                    >
                                      {progress.score.toFixed(1)}점
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge 
                                      variant={
                                        progress.status === '개선됨' ? "default" : 
                                        progress.status === '유지' ? "secondary" : 
                                        "destructive"
                                      }
                                    >
                                      {progress.status}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">{progress.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
