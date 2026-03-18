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
  ClipboardCheck, AlertTriangle, QrCode, Copy, Check, Key, Edit, Save, X as XIcon, FileText
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface StudentDetail {
  id: string; // Changed from number to string
  email: string;
  name: string;
  phone?: string;
  parentPhone?: string;
  role: string;
  password?: string;
  academyId?: string; // Changed from academy_id (number)
  academyName?: string;
  createdAt?: string; // Changed from created_at
  student_code?: string;
  grade?: string;
  class?: string;
  diagnostic_memo?: string;
  className?: string;
  classId?: string; // Changed from number
  classes?: Array<{classId: string; className: string}>; // Changed type
  isWithdrawn?: number;
  withdrawnAt?: string;
  withdrawnReason?: string;
  withdrawnBy?: number;
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
  const [detailedAnalysis, setDetailedAnalysis] = useState<string>("");
  const [learningDirection, setLearningDirection] = useState<string>("");
  const [commonMistakes, setCommonMistakes] = useState<any[]>([]);
  const [studentCode, setStudentCode] = useState<string>("");
  const [attendanceCode, setAttendanceCode] = useState<AttendanceCode | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [conceptAnalyzingLoading, setConceptAnalyzingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [attendanceCodeCopied, setAttendanceCodeCopied] = useState(false);
  
  // 퇴원 처리 상태
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  
  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<StudentDetail | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 학원 및 반 목록
  const [academies, setAcademies] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  
  // 날짜 필터 상태 추가
  const [analysisStartDate, setAnalysisStartDate] = useState<string>("");
  const [analysisEndDate, setAnalysisEndDate] = useState<string>("");
  
  // 유사문제 출제 상태
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<string[]>(['concept']);
  const [selectedQuestionFormats, setSelectedQuestionFormats] = useState<string[]>(['multiple_choice', 'open_ended']); // 문제 형식
  const [selectedSubject, setSelectedSubject] = useState<string>(''); // 과목 선택
  const [problemCount, setProblemCount] = useState<number>(5);
  const [generatedProblems, setGeneratedProblems] = useState<any[]>([]);
  const [generatingProblems, setGeneratingProblems] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showProblemPreview, setShowProblemPreview] = useState(false); // 문제 미리보기 모드
  
  // 학원장 제한 설정
  const [limitations, setLimitations] = useState<any>(null);
  
  // 숙제 제출 기록 상태
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<any[]>([]);
  const [loadingHomework, setLoadingHomework] = useState(false);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return '미등록';
    // 숫자만 추출
    const numbers = phone.replace(/[^0-9]/g, '');
    // 010-1234-5678 형식으로 변환
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    return phone; // 원본 반환
  };

  // 이메일 표시 함수
  const displayEmail = (email: string | undefined) => {
    if (!email) return '미등록';
    // 명시적으로 생성된 임시 이메일만 미등록으로 표시
    if (email.includes('@temp.student.local') || 
        email.includes('@phone.generated')) {
      return '미등록';
    }
    // student_XXX@temp.superplace.local 형식도 실제 이메일로 간주
    return email;
  };

  // 기본 날짜 설정 (최근 30일)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setAnalysisEndDate(today.toISOString().split('T')[0]);
    setAnalysisStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    // Don't redirect to login, allow mock data to be displayed
    if (!userStr) {
      console.log('No user found, will use mock data');
    }

    if (studentId) {
      fetchStudentData();
      fetchAcademies();
      fetchClasses();
      fetchHomeworkSubmissions();
    }
  }, [studentId, router]);

  // 🔧 Fallback: 학생 목록에서 데이터 가져오기
  // 숙제 제출 기록 불러오기
  const fetchHomeworkSubmissions = async () => {
    try {
      setLoadingHomework(true);
      const token = localStorage.getItem("token");
      
      // 날짜 필터 없이 해당 학생의 모든 숙제 기록 조회
      const response = await fetch(`/api/homework/results?userId=${studentId}&startDate=2020-01-01&endDate=2099-12-31`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📚 숙제 제출 기록:', data);
        
        // API 응답 정규화
        const formattedResults = (data.results || []).map((result: any) => {
          const safeJsonParse = (value: any, defaultValue: any = null) => {
            if (!value) return defaultValue;
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return defaultValue;
              }
            }
            return value;
          };
          
          return {
            ...result,
            id: result.submissionId,
            score: (function(s: number | undefined | null) {
              if (!s) return 0;
              if (s > 0 && s <= 1) return Math.round(s * 100);
              return Math.round(s);
            })(result.grading?.score),
            feedback: result.grading?.feedback || '',
            subject: result.grading?.subject || '미지정',
            totalQuestions: result.grading?.totalQuestions || 0,
            correctAnswers: result.grading?.correctAnswers || 0,
            detailedResults: safeJsonParse(result.grading?.detailedResults, []),
            overallFeedback: result.grading?.overallFeedback || result.grading?.feedback || '',
            improvements: result.grading?.improvements || '',
            gradedAt: result.grading?.gradedAt || null,
          };
        });
        
        setHomeworkSubmissions(formattedResults);
      }
    } catch (error) {
      console.error('❌ 숙제 제출 기록 조회 실패:', error);
    } finally {
      setLoadingHomework(false);
    }
  };

  const tryFallbackFromList = async (token: string, studentId: string): Promise<boolean> => {
    try {
      console.log('🔄 Fallback: 학생 목록에서 데이터 가져오는 중...');
      const listResponse = await fetch('/api/students/by-academy', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        const foundStudent = listData.students?.find((s: any) => s.id === studentId);
        
        if (foundStudent) {
          console.log('✅ Fallback 성공: 학생 목록에서 발견', foundStudent);
          setStudent(foundStudent);
          return true;
        } else {
          console.log('⚠️ Fallback 실패: 학생 목록에 없음');
        }
      }
    } catch (error) {
      console.error('❌ Fallback 오류:', error);
    }
    return false;
  };

  const fetchStudentData = async () => {
    let userData = null;
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      let apiSuccess = false;

      // Try to fetch from API first
      if (token) {
        try {
          // 1. 학생 기본 정보 (by-academy 엔드포인트 사용 - 단일 학생 조회 지원)
          const userResponse = await fetch(`/api/students/by-academy?id=${studentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (userResponse.ok) {
            userData = await userResponse.json();
            const studentData = userData.student || userData;
            
            console.log("📥 Received student data:", studentData);
            
            // API 응답 정규화: academy 객체 → academyName, academy_name으로 변환
            if (studentData.academy && typeof studentData.academy === 'object') {
              studentData.academyName = studentData.academy.name;
              studentData.academy_name = studentData.academy.name;
              studentData.academyAddress = studentData.academy.address;
              studentData.academyPhone = studentData.academy.phone;
              console.log('✅ 학원 정보 정규화:', studentData.academyName);
            }
            
            // 로그인한 사용자 정보에서 학원 정보 가져오기
            const userStr = localStorage.getItem("user");
            if (userStr) {
              try {
                const currentUser = JSON.parse(userStr);
                // 학생에게 학원 정보가 없으면 현재 director의 학원으로 설정
                if (!studentData.academyId && currentUser.academyId) {
                  studentData.academyId = currentUser.academyId;
                  studentData.academy_name = currentUser.academyName || '현재 학원';
                  studentData.academyName = currentUser.academyName || '현재 학원';
                  console.log('✅ 학원 정보 자동 설정:', studentData.academyId);
                }
              } catch (e) {
                console.error('사용자 정보 파싱 실패:', e);
              }
            }
            
            setStudent(studentData);
            apiSuccess = true;
            
            // 출석 통계도 이미 포함되어 있음
            if (studentData.attendanceStats) {
              setAttendanceStats(studentData.attendanceStats);
            }
            
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
          } else if (userResponse.status === 401) {
            console.error('❌ Unauthorized, trying fallback...');
            // Fallback: 학생 목록에서 찾기
            apiSuccess = await tryFallbackFromList(token, studentId);
          } else {
            console.error('❌ API failed:', userResponse.status, 'trying fallback...');
            // Fallback: 학생 목록에서 찾기
            apiSuccess = await tryFallbackFromList(token, studentId);
          }
        } catch (apiError) {
          console.log('API not available, using mock data');
        }
      }

      // Fallback to mock data if API failed
      if (!apiSuccess) {
        console.log('Using mock data for student detail');
        const mockStudents: { [key: string]: StudentDetail } = {
          "1": {
            id: 1,
            email: "student1@seoul.academy",
            name: "이학생",
            phone: "010-2345-6789",
            role: "STUDENT",
            academy_id: 1,
            academyName: "서울 수학 학원",
            created_at: "2025-02-01T10:00:00Z",
            student_code: "STU001",
            school: "서울중학교",
            grade: "2학년",
            diagnostic_memo: "수학 기초가 탄탄한 학생",
            className: "수학A반",
            classId: 1,
          },
          "2": {
            id: 2,
            email: "student2@seoul.academy",
            name: "박학생",
            phone: "010-3456-7890",
            role: "STUDENT",
            academy_id: 1,
            academyName: "서울 수학 학원",
            created_at: "2025-03-15T10:00:00Z",
            student_code: "STU002",
            school: "강남중학교",
            grade: "3학년",
            className: "수학B반",
            classId: 2,
          },
          "3": {
            id: 3,
            email: "student3@seoul.academy",
            name: "최학생",
            phone: "010-4567-8901",
            role: "STUDENT",
            academy_id: 1,
            academyName: "서울 수학 학원",
            created_at: "2025-04-20T10:00:00Z",
            student_code: "STU003",
            school: "역삼중학교",
            grade: "1학년",
            className: "수학C반",
            classId: 3,
          },
        };

        const mockStudent = mockStudents[studentId || "1"];
        if (mockStudent) {
          setStudent(mockStudent);
          setStudentCode(mockStudent.student_code || "");
          userData = { student: mockStudent };
          
          // Mock 출석 통계
          setAttendanceStats({
            total: 20,
            present: 18,
            late: 1,
            absent: 1,
            excused: 0,
            attendanceRate: 90,
          });

          // Mock 출석 기록
          setAttendance([
            {
              id: 1,
              date: "2025-02-15",
              status: "present",
              checkInTime: "09:00:00",
              checkOutTime: "12:00:00",
            },
            {
              id: 2,
              date: "2025-02-16",
              status: "present",
              checkInTime: "09:05:00",
              checkOutTime: "12:00:00",
            },
          ]);

          // Mock 학원장 제한 설정 (모든 기능 활성화)
          setLimitations({
            id: 1,
            director_id: 1,
            academy_id: 1,
            homework_grading_daily_limit: 100,
            homework_grading_monthly_limit: 3000,
            homework_grading_daily_used: 0,
            homework_grading_monthly_used: 0,
            max_students: 100,
            similar_problem_enabled: 1,
            similar_problem_daily_limit: 50,
            similar_problem_monthly_limit: 1500,
            similar_problem_daily_used: 0,
            similar_problem_monthly_used: 0,
            weak_concept_analysis_enabled: 1,
            weak_concept_daily_limit: 20,
            weak_concept_monthly_limit: 600,
            weak_concept_daily_used: 0,
            weak_concept_monthly_used: 0,
            competency_analysis_enabled: 1,
            competency_daily_limit: 10,
            competency_monthly_limit: 300,
            competency_daily_used: 0,
            competency_monthly_used: 0,
          });
        } else {
          throw new Error("학생 정보를 찾을 수 없습니다.");
        }
      }

      // Only fetch additional data if API was successful
      if (apiSuccess && token) {
        // 2. AI 챗봇 대화 내역
        try {
          const chatResponse = await fetch(`/api/students/chat-history?studentId=${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            setChatHistory(chatData.chatHistory || []);
          }
        } catch (error) {
          console.log('Failed to fetch chat history');
        }

        // 3. 출결 정보
        try {
          const attendanceResponse = await fetch(`/api/students/attendance?studentId=${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            setAttendance(attendanceData.attendance || []);
            setAttendanceStats(attendanceData.stats || null);
          }
        } catch (error) {
          console.log('Failed to fetch attendance');
        }

        // 4. 출석 코드 조회 (student.id 사용)
        try {
          // student 객체에서 실제 숫자 ID 가져오기
          const numericUserId = studentData?.id || studentData?.userId;
          console.log('🎯 Fetching attendance code for numeric userId:', numericUserId, '(studentId was:', studentId, ')');
          
          if (!numericUserId) {
            console.error('❌ No numeric user ID found in student data');
            // 학생이 존재하지 않음을 명확히 표시
            setAttendanceCode({
              code: 'ERROR',
              userId: 0,
              isActive: 0,
              error: '학생 정보를 찾을 수 없습니다. 학생 목록에서 다시 선택해주세요.',
            });
          } else {
            const attendanceCodeResponse = await fetch(`/api/students/attendance-code?userId=${numericUserId}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            console.log('📡 Attendance code response status:', attendanceCodeResponse.status);
            
            if (attendanceCodeResponse.ok) {
              const codeData = await attendanceCodeResponse.json();
              console.log('📦 Attendance code data:', codeData);
              
              if (codeData.success) {
                console.log('✅ Setting attendance code:', codeData.code);
                setAttendanceCode({
                  code: codeData.code,
                  userId: codeData.userId,
                  isActive: codeData.isActive,
                });
              } else {
                console.error('❌ Attendance code fetch failed:', codeData.error || 'Unknown error');
                setAttendanceCode({
                  code: 'ERROR',
                  userId: 0,
                  isActive: 0,
                  error: codeData.error || '출석 코드를 불러올 수 없습니다.',
                });
              }
            } else {
              console.error('❌ Attendance code response not ok:', attendanceCodeResponse.status);
              setAttendanceCode({
                code: 'ERROR',
                userId: 0,
                isActive: 0,
                error: '출석 코드 조회에 실패했습니다.',
              });
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch attendance code:', error);
          setAttendanceCode({
            code: 'ERROR',
            userId: 0,
            isActive: 0,
            error: '출석 코드 조회 중 오류가 발생했습니다.',
          });
        }

        // 5. 캐시된 부족한 개념 분석 결과 조회
        try {
          const weakConceptsResponse = await fetch(`/api/students/weak-concepts?studentId=${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (weakConceptsResponse.ok) {
            const weakConceptsData = await weakConceptsResponse.json();
            // cached가 true이고 summary가 있으면 표시 (weakConcepts가 0개여도 표시)
            if (weakConceptsData.cached && weakConceptsData.summary) {
              console.log('📦 Loaded cached weak concepts analysis');
              setWeakConcepts(weakConceptsData.weakConcepts || []);
              setConceptRecommendations(weakConceptsData.recommendations || []);
              setConceptSummary(weakConceptsData.summary || "");
            }
          }
        } catch (error) {
          console.log('Failed to fetch weak concepts');
        }

        // 6. 학원장 제한 설정 조회 (학생의 academy_id 기반)
        if (userData) {
          const currentStudent = userData.student || userData;
          if (currentStudent && (currentStudent.academyId || currentStudent.academy_id)) {
            const academyId = currentStudent.academyId || currentStudent.academy_id;
            console.log('🔍 Fetching limitations for academy:', academyId);
            
            try {
              const limitationsResponse = await fetch(`/api/admin/director-limitations?academyId=${academyId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              console.log('📊 Limitations response status:', limitationsResponse.status);
              
              if (limitationsResponse.ok) {
                const limitationsData = await limitationsResponse.json();
                console.log('📥 Limitations data received:', limitationsData);
                
                if (limitationsData.success && limitationsData.limitation) {
                  console.log('✅ Setting limitations:', limitationsData.limitation);
                  setLimitations(limitationsData.limitation);
                  
                  // 각 제한 값 출력
                  console.log('🎛️ Limitation details:');
                  console.log('  - similar_problem_enabled:', limitationsData.limitation.similar_problem_enabled);
                  console.log('  - weak_concept_analysis_enabled:', limitationsData.limitation.weak_concept_analysis_enabled);
                  console.log('  - competency_analysis_enabled:', limitationsData.limitation.competency_analysis_enabled);
                } else {
                  console.warn('⚠️ Limitations data structure unexpected:', limitationsData);
                }
              } else {
                console.error('❌ Failed to fetch limitations, status:', limitationsResponse.status);
              }
            } catch (limitError) {
              console.error('❌ Error fetching limitations:', limitError);
            }
          } else {
            console.warn('⚠️ No academyId found for student');
          }
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
    console.log('='.repeat(60));
    console.log('🧠 AI 역량 분석 시작 (Gemini 2.5 Flash Lite)');
    console.log('📊 Current limitations:', limitations);
    console.log('✅ 사용 모델: gemini-2.5-flash-lite-preview-06-17');
    console.log('='.repeat(60));
    
    // 프론트엔드 제한 확인
    if (limitations && limitations.competency_analysis_enabled === 0) {
      alert('❌ AI 역량 분석 기능이 현재 요금제에서 비활성화되어 있습니다.');
      return;
    }
    
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

      const data = await response.json();
      
      if (!response.ok) {
        // 요금제 제한 오류 처리
        if (data.error === 'FEATURE_DISABLED') {
          alert('❌ AI 역량 분석 기능이 현재 요금제에서 비활성화되어 있습니다.\n요금제 업그레이드가 필요합니다.');
        } else if (data.error === 'DAILY_LIMIT_EXCEEDED') {
          alert(`❌ 오늘의 AI 역량 분석 한도를 초과했습니다.\n(${data.currentUsage}/${data.maxLimit}회)\n내일 다시 시도해주세요.`);
        } else if (data.error === 'MONTHLY_LIMIT_EXCEEDED') {
          alert(`❌ 이번 달 AI 역량 분석 한도를 초과했습니다.\n(${data.currentUsage}/${data.maxLimit}회)\n다음 달에 다시 시도해주세요.`);
        } else {
          throw new Error(data.message || data.error || '역량 분석에 실패했습니다.');
        }
        return;
      }
      
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('분석 결과를 받지 못했습니다.');
      }
    } catch (error: any) {
      console.error("Failed to analyze competency:", error);
      alert(error.message || "역량 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingLoading(false);
    }
  };

  // 학원 목록 불러오기
  const fetchAcademies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/admin/academies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error('Failed to fetch academies:', error);
    }
  };

  // 반 목록 불러오기 (학원별)
  const fetchClasses = async (academyId: number) => {
    console.log('🔍 fetchClasses called with academyId:', academyId);
    if (!academyId) {
      console.log('❌ No academyId, skipping class fetch');
      setClasses([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      console.log('🔑 Token:', token ? 'exists' : 'missing');
      
      const response = await fetch(`/api/classes`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Classes API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Classes loaded:', data.classes?.length || 0);
        console.log('📋 Classes data:', data.classes);
        setClasses(data.classes || []);
      } else {
        console.error('❌ Classes API error:', response.status);
        setClasses([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch classes:', error);
      setClasses([]);
    }
  };

  // 편집 모드 시작
  const startEditing = async () => {
    setIsEditing(true);
    setEditedStudent({ ...student! });
    
    // 학원과 반 목록 불러오기
    await fetchAcademies();
    if (student!.academy_id) {
      await fetchClasses(student!.academy_id);
    }
    
    // 현재 학생의 다중 반 ID 로드
    const classIds: number[] = [];
    if (student!.classes && Array.isArray(student!.classes)) {
      student!.classes.forEach((cls: any) => {
        if (cls.classId) classIds.push(cls.classId);
      });
    } else if (student!.classId) {
      // 하위 호환성: 단일 반만 있는 경우
      classIds.push(student!.classId);
    }
    setSelectedClassIds(classIds);
    
    console.log('📝 Editing started with class IDs:', classIds);
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedStudent(null);
  };

  // 학생 정보 저장
  const saveStudentInfo = async () => {
    if (!editedStudent) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          name: editedStudent.name,
          phone: editedStudent.phone,
          email: editedStudent.email,
          grade: editedStudent.grade,
          diagnostic_memo: editedStudent.diagnostic_memo,
          password: editedStudent.password,
          classIds: selectedClassIds, // 최대 3개의 반 ID
        }),
      });

      if (response.ok) {
        alert('✅ 학생 정보가 수정되었습니다.');
        setStudent(editedStudent);
        setIsEditing(false);
        setEditedStudent(null);
        // 데이터 다시 로드
        fetchStudentData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '정보 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 학생 정보 수정 실패:', error);
      alert(error.message || '학생 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const analyzeWeakConcepts = async () => {
    console.log('='.repeat(60));
    console.log('🧠 부족한 개념 분석 시작 (Gemini 2.5 Flash Lite)');
    console.log('📊 Current limitations:', limitations);
    console.log('✅ 사용 모델: gemini-2.5-flash-lite-preview-06-17');
    console.log('='.repeat(60));
    
    // 프론트엔드 제한 확인
    if (limitations && limitations.weak_concept_analysis_enabled === 0) {
      alert('❌ 부족한 개념 분석 기능이 현재 요금제에서 비활성화되어 있습니다.');
      return;
    }
    
    try {
      setConceptAnalyzingLoading(true);
      const token = localStorage.getItem("token");

      console.log('🧠 부족한 개념 분석 시작...');

      // 타임아웃 설정 (30초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/students/weak-concepts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId,
          startDate: analysisStartDate,
          endDate: analysisEndDate
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API 오류:', response.status, errorData);
        
        // 요금제 제한 오류 처리
        if (errorData.error === 'FEATURE_DISABLED') {
          alert('❌ 부족한 개념 분석 기능이 현재 요금제에서 비활성화되어 있습니다.\n요금제 업그레이드가 필요합니다.');
          return;
        } else if (errorData.error === 'DAILY_LIMIT_EXCEEDED') {
          alert(`❌ 오늘의 부족한 개념 분석 한도를 초과했습니다.\n(${errorData.currentUsage}/${errorData.maxLimit}회)\n내일 다시 시도해주세요.`);
          return;
        } else if (errorData.error === 'MONTHLY_LIMIT_EXCEEDED') {
          alert(`❌ 이번 달 부족한 개념 분석 한도를 초과했습니다.\n(${errorData.currentUsage}/${errorData.maxLimit}회)\n다음 달에 다시 시도해주세요.`);
          return;
        }
        
        throw new Error(errorData.error || `API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ 분석 완료:', data);
      
      setWeakConcepts(data.weakConcepts || []);
      setConceptRecommendations(data.recommendations || []);
      setConceptSummary(data.summary || "");
      setDetailedAnalysis(data.detailedAnalysis || "");
      setLearningDirection(data.learningDirection || "");
      setCommonMistakes(Array.isArray(data.commonMistakeTypes) ? data.commonMistakeTypes : []);
      
      alert('✅ 분석이 완료되었습니다!');
    } catch (error: any) {
      console.error("Failed to analyze weak concepts:", error);
      
      if (error.name === 'AbortError') {
        alert('⏱️ 분석 시간이 초과되었습니다. 다시 시도해주세요.');
      } else if (error.message.includes('Failed to fetch')) {
        alert('🌐 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      } else {
        alert('❌ ' + (error.message || "부족한 개념 분석 중 오류가 발생했습니다."));
      }
    } finally {
      setConceptAnalyzingLoading(false);
    }
  };

  const generateSimilarProblems = async () => {
    console.log('='.repeat(60));
    console.log('📝 유사문제 생성 시작 (Gemini 2.5 Flash Lite)');
    console.log('📊 Current limitations:', limitations);
    console.log('✅ 사용 모델: gemini-2.5-flash-lite-preview-06-17');
    console.log('='.repeat(60));
    
    // 프론트엔드 제한 확인
    if (limitations && limitations.similar_problem_enabled === 0) {
      alert('❌ 유사문제 출제 기능이 현재 요금제에서 비활성화되어 있습니다.');
      return;
    }
    
    if (!selectedSubject) {
      alert('과목을 선택해주세요.');
      return;
    }

    if (selectedConcepts.length === 0) {
      alert('최소 1개 이상의 개념을 선택해주세요.');
      return;
    }

    if (selectedProblemTypes.length === 0) {
      alert('최소 1개 이상의 문제 유형을 선택해주세요.');
      return;
    }

    if (selectedQuestionFormats.length === 0) {
      alert('최소 1개 이상의 문제 형식을 선택해주세요.');
      return;
    }

    try {
      setGeneratingProblems(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/students/generate-problems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          concepts: selectedConcepts,
          problemTypes: selectedProblemTypes,
          questionFormats: selectedQuestionFormats, // 문제 형식 추가
          problemCount,
          studentName: student?.name || '학생',
          studentGrade: student?.grade || null, // 학년 정보 추가
          subject: selectedSubject || null, // 과목 정보 추가
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 요금제 제한 오류 처리
        if (errorData.error === 'FEATURE_DISABLED') {
          alert('❌ 유사문제 출제 기능이 현재 요금제에서 비활성화되어 있습니다.\n요금제 업그레이드가 필요합니다.');
          return;
        } else if (errorData.error === 'DAILY_LIMIT_EXCEEDED') {
          alert(`❌ 오늘의 유사문제 출제 한도를 초과했습니다.\n(${errorData.currentUsage}/${errorData.maxLimit}회)\n내일 다시 시도해주세요.`);
          return;
        } else if (errorData.error === 'MONTHLY_LIMIT_EXCEEDED') {
          alert(`❌ 이번 달 유사문제 출제 한도를 초과했습니다.\n(${errorData.currentUsage}/${errorData.maxLimit}회)\n다음 달에 다시 시도해주세요.`);
          return;
        }
        
        throw new Error(errorData.message || errorData.error || '문제 생성에 실패했습니다.');
      }

      const data = await response.json();
      setGeneratedProblems(data.problems || []);
      setShowProblemModal(false);
      
      // 시험지 미리보기 모드로 전환 (자동 인쇄 제거 - 사용자가 인쇄 버튼으로 선택)
      setShowProblemPreview(true);
      // 페이지 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error: any) {
      console.error("Failed to generate problems:", error);
      alert('❌ ' + (error.message || "문제 생성 중 오류가 발생했습니다."));
    } finally {
      setGeneratingProblems(false);
    }
  };

  const toggleConceptSelection = (concept: string) => {
    setSelectedConcepts(prev => 
      prev.includes(concept) 
        ? prev.filter(c => c !== concept)
        : [...prev, concept]
    );
  };

  const toggleProblemType = (type: string) => {
    setSelectedProblemTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleQuestionFormat = (format: string) => {
    setSelectedQuestionFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const printProblemsOnly = () => {
    // 문제지만 인쇄 (답안지 제외)
    console.log('📄 문제지만 인쇄');
    const answerSheet = document.querySelector('.answer-sheet-page');
    if (answerSheet) {
      const element = answerSheet as HTMLElement;
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.setAttribute('data-print-hidden', 'true');
      console.log('✅ 답안지 숨김');
    }
    setTimeout(() => {
      window.print();
      // 인쇄 후 답안지 다시 표시
      if (answerSheet) {
        const element = answerSheet as HTMLElement;
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.removeAttribute('data-print-hidden');
        console.log('✅ 답안지 복원');
      }
    }, 100);
  };

  const printAnswersOnly = () => {
    // 답안지만 인쇄
    console.log('📚 답안지만 인쇄');
    const problemPages = document.querySelectorAll('.problem-page');
    problemPages.forEach(page => {
      const element = page as HTMLElement;
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.setAttribute('data-print-hidden', 'true');
    });
    console.log(`✅ ${problemPages.length}개 문제 페이지 숨김`);
    
    setTimeout(() => {
      window.print();
      // 인쇄 후 문제지 다시 표시
      problemPages.forEach(page => {
        const element = page as HTMLElement;
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.removeAttribute('data-print-hidden');
      });
      console.log('✅ 문제지 복원');
    }, 100);
  };

  const printAllPages = () => {
    // 모든 페이지(문제+서술형+답지)를 한 번에 인쇄
    console.log('📋 전체 페이지 인쇄');
    setTimeout(() => window.print(), 100);
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

  // 퇴원 처리
  const handleWithdraw = async () => {
    if (!studentId) return;
    
    if (!withdrawReason.trim()) {
      alert("퇴원 사유를 입력해주세요.");
      return;
    }

    if (!confirm(`${student?.name} 학생을 퇴원 처리하시겠습니까?\n\n퇴원 사유: ${withdrawReason}`)) {
      return;
    }

    try {
      setWithdrawing(true);
      const token = localStorage.getItem("token");

      console.log("=".repeat(60));
      console.log("🔐 TOKEN CHECK");
      console.log("=".repeat(60));
      console.log("Token exists:", !!token);
      if (token) {
        console.log("Token preview:", token.substring(0, 50) + "...");
        console.log("Token length:", token.length);
        const tokenParts = token.split("|");
        console.log("Token parts:", tokenParts.length);
        if (tokenParts.length >= 3) {
          console.log("User ID:", tokenParts[0]);
          console.log("Email:", tokenParts[1]);
          console.log("Role:", tokenParts[2]);
          console.log("Academy ID:", tokenParts[3] || "없음");
        }
      }
      console.log("=".repeat(60));

      if (!token) {
        alert("❌ 로그인 토큰이 없습니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }

      console.log("=".repeat(60));
      console.log("📤 WITHDRAW REQUEST");
      console.log("=".repeat(60));
      console.log("Student ID:", studentId);
      console.log("Student Name:", student?.name);
      console.log("Withdraw Reason:", withdrawReason);
      console.log("Request URL:", "/api/students/withdraw");
      console.log("=".repeat(60));

      const response = await fetch("/api/students/withdraw", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          withdrawnReason: withdrawReason,
        }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("📥 Response body (raw):", responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Success:", data);
        alert(`✅ 퇴원 처리가 완료되었습니다!\n\n학생: ${student?.name || studentId}\n사유: ${withdrawReason}`);
        setShowWithdrawDialog(false);
        setWithdrawReason("");
        // 퇴원 처리 후 학생 목록으로 이동
        router.push("/dashboard/students");
      } else {
        let errorMsg = "퇴원 처리에 실패했습니다.";
        let errorDetails = "";
        
        try {
          const error = JSON.parse(responseText);
          console.error("❌ Error response:", error);
          errorMsg = error.message || error.error || errorMsg;
          errorDetails = JSON.stringify(error, null, 2);
        } catch (parseError) {
          console.error("❌ Failed to parse error response");
          errorDetails = responseText;
        }
        
        alert(`❌ 퇴원 처리 실패\n\n상태 코드: ${response.status}\n메시지: ${errorMsg}\n\n상세 정보:\n${errorDetails}`);
      }
    } catch (error: any) {
      console.error("Failed to withdraw student:", error);
      alert("퇴원 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawing(false);
    }
  };

  // 복학 처리
  const handleReactivate = async () => {
    if (!studentId) return;

    if (!confirm(`${student?.name} 학생을 복학 처리하시겠습니까?`)) {
      return;
    }

    try {
      setWithdrawing(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/students/reactivate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        // 페이지 새로고침하여 최신 정보 표시
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ ${error.message || "복학 처리에 실패했습니다."}`);
      }
    } catch (error: any) {
      console.error("Failed to reactivate student:", error);
      alert("복학 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawing(false);
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
    <>
      {/* 퇴원 처리 다이얼로그 */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                학생 퇴원 처리
              </h3>
              <button
                onClick={() => setShowWithdrawDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{student?.name}</strong> 학생을 퇴원 처리하시겠습니까?
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  퇴원 처리 후에도 학생 데이터는 유지되며, 복학 처리를 통해 다시 활성화할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  퇴원 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="퇴원 사유를 입력해주세요 (예: 졸업, 이사, 타 학원 전학 등)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowWithdrawDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={withdrawing}
              >
                취소
              </Button>
              <Button
                onClick={handleWithdraw}
                variant="destructive"
                className="flex-1"
                disabled={withdrawing || !withdrawReason.trim()}
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    퇴원 처리
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* 학생 프로필 헤더 - 현대적이고 귀여운 디자인 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 배경 그라데이션 */}
          <div className="h-32 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 relative">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
          </div>
          
          {/* 프로필 정보 */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* 프로필 아바타 */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl border-4 border-white">
                  {student.name?.charAt(0) || '학'}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* 학생 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 truncate">
                    {student.name}
                  </h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white w-fit">
                    학생
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {student.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-purple-500" />
                      <span>{formatPhoneNumber(student.phone)}</span>
                    </div>
                  )}
                  {student.academyName && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      <span>{student.academyName}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 액션 버튼 - 요금제 로직 연동 */}
              {(() => {
                const shouldShow = !limitations || limitations.similar_problem_enabled === 1;
                console.log('🔍 유사문제 출제 버튼 표시 여부:', {
                  shouldShow,
                  limitations,
                  similar_problem_enabled: limitations?.similar_problem_enabled,
                  weakConceptsLength: weakConcepts.length
                });
                return shouldShow && (
                  <Button
                    onClick={() => setShowProblemModal(true)}
                    disabled={weakConcepts.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg whitespace-nowrap"
                    size="sm"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    유사문제 출제
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tabs - 더 귀여운 디자인 */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full gap-2 bg-white rounded-xl p-2 shadow-md" style={{gridTemplateColumns: `repeat(${(!limitations || limitations.weak_concept_analysis_enabled === 1) ? '6' : '5'}, minmax(0, 1fr))`}}>
            <TabsTrigger 
              value="info" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
            >
              <User className="w-4 h-4 mr-1.5" />
              개인 정보
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              학생 코드
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              출결
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              AI 대화
            </TabsTrigger>
            <TabsTrigger 
              value="homework" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              숙제 기록
            </TabsTrigger>
            {(!limitations || limitations.weak_concept_analysis_enabled === 1) && (
              <TabsTrigger 
                value="concepts" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white text-xs sm:text-sm font-semibold"
              >
                <Brain className="w-4 h-4 mr-1.5" />
                부족한 개념
              </TabsTrigger>
            )}
          </TabsList>

          {/* 개인 정보 탭 */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      기본 정보
                      {student.isWithdrawn === 1 && (
                        <Badge variant="destructive">퇴원</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>학생의 기본 정보를 확인하고 수정할 수 있습니다</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {student.isWithdrawn === 1 ? (
                      <Button 
                        onClick={handleReactivate} 
                        disabled={withdrawing}
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {withdrawing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            복학 처리
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        {!isEditing && (
                          <Button 
                            onClick={() => setShowWithdrawDialog(true)} 
                            variant="destructive" 
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            퇴원 처리
                          </Button>
                        )}
                      </>
                    )}
                    {!isEditing ? (
                      <Button onClick={startEditing} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                    ) : (
                      <>
                        <Button onClick={saveStudentInfo} disabled={saving} size="sm">
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              저장
                            </>
                          )}
                        </Button>
                        <Button onClick={cancelEditing} variant="outline" size="sm" disabled={saving}>
                          <XIcon className="w-4 h-4 mr-2" />
                          취소
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 이름 */}
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">이름</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.name || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent!, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{student.name}</p>
                      )}
                    </div>
                  </div>

                  {/* 전화번호 */}
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">전화번호</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedStudent?.phone || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent!, phone: e.target.value })}
                          placeholder="010-1234-5678"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{formatPhoneNumber(student.phone)}</p>
                      )}
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">이메일</p>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedStudent?.email || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent!, email: e.target.value })}
                          placeholder="example@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="font-medium">{displayEmail(student.email)}</p>
                      )}
                    </div>
                  </div>

                  {/* 학년 */}
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      학년
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">학년</p>
                      {isEditing ? (
                        <select
                          value={editedStudent?.grade || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent!, grade: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택하세요</option>
                          <option value="초1">초등 1학년</option>
                          <option value="초2">초등 2학년</option>
                          <option value="초3">초등 3학년</option>
                          <option value="초4">초등 4학년</option>
                          <option value="초5">초등 5학년</option>
                          <option value="초6">초등 6학년</option>
                          <option value="중1">중학 1학년</option>
                          <option value="중2">중학 2학년</option>
                          <option value="중3">중학 3학년</option>
                          <option value="고1">고등 1학년</option>
                          <option value="고2">고등 2학년</option>
                          <option value="고3">고등 3학년</option>
                        </select>
                      ) : (
                        <p className="font-medium">{student.grade || '미등록'}</p>
                      )}
                    </div>
                  </div>

                  {/* 소속 학원 */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">소속 학원</p>
                      {isEditing ? (
                        <select
                          value={editedStudent?.academy_id || ''}
                          onChange={async (e) => {
                            const academyId = Number(e.target.value);
                            setEditedStudent({ ...editedStudent!, academy_id: academyId });
                            await fetchClasses(academyId);
                            setSelectedClassIds([]); // 학원 변경 시 반 선택 초기화
                          }}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed opacity-60"
                        >
                          <option value={editedStudent?.academy_id || ''}>
                            {student.academy_name || student.academyName || '소속 학원'}
                          </option>
                        </select>
                      ) : (
                        <p className="font-medium">{student.academy_name || student.academyName || '미등록'}</p>
                      )}
                    </div>
                  </div>

                  {/* 소속 반 (다중 선택, 최대 3개) */}
                  <div className="flex items-start gap-3 col-span-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">소속 반 (최대 3개)</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          {/* 선택된 반 표시 */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedClassIds.map((classId, index) => {
                              const className = classes.find((c: any) => c.id === classId)?.name || `반 ${classId}`;
                              return (
                                <Badge key={classId} variant="secondary" className="flex items-center gap-1">
                                  {className}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedClassIds(selectedClassIds.filter((id) => id !== classId))}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                          {/* 반 추가 드롭다운 */}
                          {selectedClassIds.length < 3 && (
                            <select
                              value=""
                              onChange={(e) => {
                                const classId = Number(e.target.value);
                                if (classId && !selectedClassIds.includes(classId)) {
                                  setSelectedClassIds([...selectedClassIds, classId]);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={classes.length === 0}
                            >
                              <option value="">반 추가하기...</option>
                              {classes
                                .filter((cls: any) => !selectedClassIds.includes(cls.id))
                                .map((cls: any) => (
                                  <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                  </option>
                                ))}
                            </select>
                          )}
                          {selectedClassIds.length >= 3 && (
                            <p className="text-xs text-gray-500">최대 3개 반까지 선택 가능합니다.</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {student.classes && student.classes.length > 0 ? (
                            student.classes.map((cls: any) => (
                              <Badge key={cls.classId} variant="outline">
                                {cls.className}
                              </Badge>
                            ))
                          ) : student.className ? (
                            <Badge variant="outline">{student.className}</Badge>
                          ) : student.class ? (
                            <p className="font-medium">{student.class}</p>
                          ) : (
                            <p className="font-medium">미등록</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">비밀번호</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.password || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent!, password: e.target.value })}
                          placeholder="비밀번호 입력 (빈 칸으로 두면 변경 안 함)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      ) : (
                        <p className="font-medium font-mono bg-gray-50 px-2 py-1 rounded">
                          {student.password || '미설정'}
                        </p>
                      )}
                    </div>
                  </div>

                  {student.created_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">가입일</p>
                        <p className="font-medium">{new Date(student.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                  )}

                  {/* 퇴원 정보 */}
                  {student.isWithdrawn === 1 && (
                    <>
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">퇴원일</p>
                          <p className="font-medium text-red-600">
                            {student.withdrawnAt ? new Date(student.withdrawnAt).toLocaleDateString('ko-KR') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:col-span-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">퇴원 사유</p>
                          <p className="font-medium text-orange-700">
                            {student.withdrawnReason || '-'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 퇴원 상태 알림 */}
                {student.isWithdrawn === 1 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-900 mb-1">
                          퇴원 처리된 학생입니다
                        </h3>
                        <p className="text-sm text-red-700">
                          이 학생은 현재 퇴원 상태입니다. 복학 처리를 원하시면 상단의 "복학 처리" 버튼을 클릭하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 진단 메모 */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">진단 메모</h3>
                  {isEditing ? (
                    <textarea
                      value={editedStudent?.diagnostic_memo || ''}
                      onChange={(e) => setEditedStudent({ ...editedStudent!, diagnostic_memo: e.target.value })}
                      placeholder="학생에 대한 진단 메모를 입력하세요..."
                      rows={4}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  ) : (
                    <p className="text-sm text-blue-700">
                      {student.diagnostic_memo || '진단 메모가 없습니다.'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 역량 분석 카드 - 기능이 활성화된 경우에만 표시 */}
            {(!limitations || limitations.competency_analysis_enabled === 1) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI 기반 역량 분석
                    </CardTitle>
                    <CardDescription>
                      AI가 학생의 대화를 분석하여 역량을 평가합니다
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
                  <div className="space-y-5">
                    {/* 종합 요약 */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        종합 평가 (Gemini 2.5 Flash Lite)
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {analysis.summary}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        분석된 대화: {analysis.chatCount}개
                      </p>
                    </div>

                    {/* 강점 / 개선필요 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          강점
                        </h4>
                        <ul className="space-y-1">
                          {(analysis.strengths || []).map((strength: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          개선 필요
                        </h4>
                        <ul className="space-y-1">
                          {(analysis.weaknesses || []).map((weakness: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-red-600 mt-0.5">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 자기주도성 평가 */}
                    {analysis.selfDirectedness && (
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          자기주도성 평가
                          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                            {analysis.selfDirectedness.score}점 / {analysis.selfDirectedness.level}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">{analysis.selfDirectedness.description}</p>
                        {analysis.selfDirectedness.indicators && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.selfDirectedness.indicators.map((ind: string, idx: number) => (
                              <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{ind}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 리더십 프로파일 */}
                    {analysis.leadershipProfile && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-orange-600" />
                          리더십 잠재력 및 이끄는 모습
                          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">
                            {analysis.leadershipProfile.score}점 / {analysis.leadershipProfile.type}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">{analysis.leadershipProfile.description}</p>
                        {analysis.leadershipProfile.traits && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.leadershipProfile.traits.map((trait: string, idx: number) => (
                              <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{trait}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 학습 스타일 */}
                    {analysis.learningStyle && (
                      <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-600" />
                          학습 스타일
                          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-800">
                            {analysis.learningStyle.primary}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">{analysis.learningStyle.description}</p>
                        {analysis.learningStyle.preferences && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.learningStyle.preferences.map((pref: string, idx: number) => (
                              <span key={idx} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{pref}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 감정 패턴 */}
                    {analysis.emotionalPattern && (
                      <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-pink-600" />
                          학습 감정 패턴
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{analysis.emotionalPattern.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {analysis.emotionalPattern.positiveAspects && (
                            <div>
                              <p className="text-xs font-semibold text-green-700 mb-1">긍정적 패턴</p>
                              {analysis.emotionalPattern.positiveAspects.map((asp: string, idx: number) => (
                                <p key={idx} className="text-xs text-gray-600">• {asp}</p>
                              ))}
                            </div>
                          )}
                          {analysis.emotionalPattern.areasForGrowth && (
                            <div>
                              <p className="text-xs font-semibold text-orange-700 mb-1">성장 필요 영역</p>
                              {analysis.emotionalPattern.areasForGrowth.map((area: string, idx: number) => (
                                <p key={idx} className="text-xs text-gray-600">• {area}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 맞츤형 개선 방안 */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          맞츤형 개선 방안
                        </h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-indigo-600 font-bold mt-0.5">{idx + 1}.</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )}
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
                    <p className="text-xs text-gray-400">
                      출석 코드가 표시되지 않으면 브라우저 콘솔(F12)을 확인하세요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 학생 식별 코드 - QR 코드 제거 버전 */}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      // 출결 데이터만 별도로 다시 불러오기 (캐시 방지 위해 타임스탬프 추가)
                      const token = localStorage.getItem("token");
                      if (token && studentId) {
                        try {
                          const attendanceResponse = await fetch(`/api/students/attendance?studentId=${studentId}&t=${Date.now()}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                          });
                          if (attendanceResponse.ok) {
                            const attendanceData = await attendanceResponse.json();
                            setAttendance(attendanceData.attendance || []);
                            setAttendanceStats(attendanceData.stats || null);
                          }
                        } catch (error) {
                          console.log('Failed to refresh attendance');
                        }
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                  <Card className="border-2 border-gray-100">
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                      <p className="text-xs sm:text-sm text-gray-500">총 출결</p>
                      <p className="text-xl sm:text-2xl font-bold">{attendanceStats?.total || 0}일</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-green-100">
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                      <p className="text-xs sm:text-sm text-gray-500">출석</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{attendanceStats?.present || 0}일</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-yellow-100">
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                      <p className="text-xs sm:text-sm text-gray-500">지각</p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-600">{attendanceStats?.late || 0}일</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-red-100">
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                      <p className="text-xs sm:text-sm text-gray-500">결석</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{attendanceStats?.absent || 0}일</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-100">
                    <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
                      <p className="text-xs sm:text-sm text-gray-500">출석률</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{attendanceStats?.attendanceRate || 0}%</p>
                    </CardContent>
                  </Card>
                </div>

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

          {/* 숙제 제출 기록 탭 */}
          <TabsContent value="homework" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  숙제 제출 기록
                </CardTitle>
                <CardDescription>
                  학생이 제출한 숙제와 AI 채점 결과를 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHomework ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : homeworkSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">아직 제출한 숙제가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {homeworkSubmissions.map((submission: any) => (
                      <Card key={submission.id} className="border-2 hover:border-indigo-300 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                                submission.score >= 90 ? 'bg-green-100 text-green-700' :
                                submission.score >= 70 ? 'bg-blue-100 text-blue-700' :
                                submission.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {submission.score}점
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{submission.subject}</p>
                                <p className="text-sm text-gray-500">
                                  제출: {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                                </p>
                              </div>
                            </div>
                            {submission.gradedAt && (
                              <Badge className="bg-green-100 text-green-800">
                                ✅ 채점 완료
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* 채점 통계 */}
                          {submission.totalQuestions > 0 && (
                            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-600">전체 문제</p>
                                <p className="text-lg font-bold text-gray-900">{submission.totalQuestions}개</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">정답 수</p>
                                <p className="text-lg font-bold text-indigo-600">{submission.correctAnswers}개</p>
                              </div>
                            </div>
                          )}

                          {/* 문제별 분석 */}
                          {submission.detailedResults && submission.detailedResults.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-gray-700">문제별 분석</h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {submission.detailedResults.map((result: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-lg text-center border-2 ${
                                      result.isCorrect
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    }`}
                                  >
                                    <div className="text-xs text-gray-600 mb-1">
                                      문제 {result.questionNumber || idx + 1}
                                    </div>
                                    <div className={`font-bold text-sm ${
                                      result.isCorrect ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {result.isCorrect ? '✓ 정답' : '✗ 오답'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 종합 평가 */}
                          {submission.overallFeedback && (
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <h4 className="font-semibold text-sm mb-2 text-purple-700">종합 평가</h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {submission.overallFeedback}
                              </p>
                            </div>
                          )}

                          {/* 개선할 점 */}
                          {submission.improvements && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h4 className="font-semibold text-sm mb-2 text-orange-700">개선할 점</h4>
                              <p className="text-sm text-gray-700">
                                {submission.improvements}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 부족한 개념 탭 - 기능이 활성화된 경우에만 표시 */}
          {(!limitations || limitations.weak_concept_analysis_enabled === 1) && (
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
                {/* 날짜 필터 UI */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    분석 기간 설정
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">시작일</label>
                      <input
                        type="date"
                        value={analysisStartDate}
                        onChange={(e) => setAnalysisStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">종료일</label>
                      <input
                        type="date"
                        value={analysisEndDate}
                        onChange={(e) => setAnalysisEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 선택한 기간 내의 채팅 내역과 숙제 데이터를 분석합니다
                  </p>
                </div>

                {conceptAnalyzingLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium text-lg">AI가 분석 중입니다...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      약 10-15초 정도 소요될 수 있습니다.
                    </p>
                    <div className="mt-4">
                      <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : !conceptSummary ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      개념 분석 버튼을 클릭하여 AI 분석을 시작해보세요.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      대화 내역과 숙제 데이터를 종합하여 분석합니다.
                    </p>
                  </div>
                ) : conceptSummary.includes('분석할 데이터가 없습니다') ? (
                  <div className="text-center py-12">
                    <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                      <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                      <p className="text-orange-700 font-medium text-lg mb-2">
                        {conceptSummary}
                      </p>
                      <p className="text-sm text-orange-600 mt-3">
                        AI 챗봇과 대화를 하거나 숙제를 제출하여 부족한 개념을 파악하세요.
                      </p>
                      <Button
                        onClick={analyzeWeakConcepts}
                        variant="outline"
                        className="mt-4"
                        size="sm"
                        disabled={limitations && limitations.weak_concept_analysis_enabled === 0}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {limitations && limitations.weak_concept_analysis_enabled === 0 ? '개념 분석 비활성화됨' : '다시 분석하기'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {conceptSummary && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">전반적인 이해도</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{conceptSummary}</p>
                      </div>
                    )}

                    {detailedAnalysis && (
                      <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          상세 분석
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{detailedAnalysis}</p>
                      </div>
                    )}

                    {commonMistakes && commonMistakes.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          자주 틀리는 유형
                        </h4>
                        <div className="space-y-3">
                          {commonMistakes.map((mistake, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-sm text-red-700">{mistake.type}</h5>
                                <Badge variant={mistake.frequency === 'high' ? 'destructive' : 'outline'} className="text-xs">
                                  {mistake.frequency === 'high' ? '높음' : mistake.frequency === 'medium' ? '중간' : '낮음'}
                                </Badge>
                              </div>
                              {mistake.example && (
                                <p className="text-xs text-gray-600 mb-1">예시: {mistake.example}</p>
                              )}
                              {mistake.solution && (
                                <p className="text-xs text-blue-700 font-medium">해결: {mistake.solution}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {learningDirection && (
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          앞으로의 학습 방향
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{learningDirection}</p>
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
                            {(() => {
                              const shouldShow = !limitations || limitations.similar_problem_enabled === 1;
                              console.log('🔍 개념별 유사문제 버튼 표시:', {
                                concept: concept.concept,
                                shouldShow,
                                similar_problem_enabled: limitations?.similar_problem_enabled
                              });
                              return shouldShow && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto text-xs sm:text-sm"
                                  onClick={() => {
                                    // 해당 개념만 선택하여 모달 열기
                                    setSelectedConcepts([concept.concept]);
                                    setSelectedProblemTypes(['concept', 'pattern']);
                                    setSelectedQuestionFormats(['multiple_choice', 'open_ended']);
                                    setShowProblemModal(true);
                                  }}
                                >
                                  📝 유사문제 출제
                                </Button>
                              );
                            })()}
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
          )}
        </Tabs>

        {/* 유사문제 출제 모달 */}
        {showProblemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">유사문제 출제</h2>
                  <button
                    onClick={() => setShowProblemModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 문제 유형 선택 (다중 선택) */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">문제 유형 (여러 개 선택 가능)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => toggleProblemType('concept')}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedProblemTypes.includes('concept')
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedProblemTypes.includes('concept') && '✓ '}개념 문제
                      </button>
                      <button
                        onClick={() => toggleProblemType('pattern')}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedProblemTypes.includes('pattern')
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedProblemTypes.includes('pattern') && '✓ '}유형 문제
                      </button>
                      <button
                        onClick={() => toggleProblemType('advanced')}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedProblemTypes.includes('advanced')
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedProblemTypes.includes('advanced') && '✓ '}심화 문제
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedProblemTypes.length}개 유형 선택됨
                    </p>
                  </div>

                  {/* 문제 형식 선택 (객관식/서술형) */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">문제 형식 (여러 개 선택 가능)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleQuestionFormat('multiple_choice')}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedQuestionFormats.includes('multiple_choice')
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedQuestionFormats.includes('multiple_choice') && '✓ '}객관식 (1~5번 선택)
                      </button>
                      <button
                        onClick={() => toggleQuestionFormat('open_ended')}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedQuestionFormats.includes('open_ended')
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {selectedQuestionFormats.includes('open_ended') && '✓ '}주관식 (서술형)
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedQuestionFormats.length}개 형식 선택됨
                      {selectedQuestionFormats.length === 2 && ' · 객관식과 주관식 혼합 출제'}
                    </p>
                  </div>

                  {/* 과목 선택 */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      과목 선택 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="수학">수학</option>
                      <option value="영어">영어</option>
                      <option value="국어">국어</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedSubject 
                        ? `${selectedSubject} 과목의 부족한 개념으로 문제를 생성합니다` 
                        : '과목을 선택하면 해당 과목의 약점 개념으로 문제가 생성됩니다'}
                    </p>
                  </div>

                  {/* 문제 수 설정 */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">문제 수</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={problemCount}
                      onChange={(e) => setProblemCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1~20개 사이로 설정 가능합니다
                    </p>
                  </div>

                  {/* 개념 선택 */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">출제할 개념 선택</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {weakConcepts.map((concept, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedConcepts.includes(concept.concept)}
                            onChange={() => toggleConceptSelection(concept.concept)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{concept.concept}</p>
                            <p className="text-xs text-gray-600">{concept.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedConcepts.length}개 선택됨
                    </p>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowProblemModal(false)}
                      disabled={generatingProblems}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={generateSimilarProblems}
                      disabled={generatingProblems || !selectedSubject || selectedConcepts.length === 0 || selectedProblemTypes.length === 0 || selectedQuestionFormats.length === 0 || (limitations && limitations.similar_problem_enabled === 0)}
                    >
                      {generatingProblems ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-4 h-4 mr-2" />
                          {limitations && limitations.similar_problem_enabled === 0 ? '기능 비활성화됨' : '문제 생성 및 인쇄'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 문제 생성 완료 후 버튼 */}
        {generatedProblems.length > 0 && (
          <div className="fixed bottom-4 right-4 flex gap-2 z-50 print:hidden flex-wrap justify-end max-w-lg">
            <Button
              onClick={() => {
                setShowProblemPreview(prev => !prev);
                if (!showProblemPreview) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              size="lg"
              variant="outline"
              className="shadow-lg bg-white border-gray-400"
            >
              <FileText className="w-5 h-5 mr-2" />
              {showProblemPreview ? '미리보기 닫기' : '문제 미리보기'}
            </Button>
            <Button onClick={printProblemsOnly} size="lg" className="shadow-lg bg-blue-600 hover:bg-blue-700">
              <FileText className="w-5 h-5 mr-2" />
              문제지 인쇄
            </Button>
            <Button onClick={printAnswersOnly} size="lg" className="shadow-lg bg-green-600 hover:bg-green-700">
              <BookOpen className="w-5 h-5 mr-2" />
              답안지 인쇄
            </Button>
            <Button onClick={printAllPages} size="lg" className="shadow-lg bg-purple-600 hover:bg-purple-700">
              <ClipboardCheck className="w-5 h-5 mr-2" />
              전체 인쇄
            </Button>
            <Button
              onClick={() => {
                setGeneratedProblems([]);
                setShowProblemPreview(false);
              }}
              size="lg"
              variant="outline"
              className="shadow-lg bg-white border-red-400 text-red-600 hover:bg-red-50"
            >
              문제 삭제
            </Button>
          </div>
        )}

        {/* 시험지 및 답지 출력 영역 (화면 미리보기 + 인쇄) */}
        {generatedProblems.length > 0 && showProblemPreview && (
          <div className="block">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-area, .print-area * {
                  visibility: visible;
                }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                @page {
                  margin: 2cm;
                  size: A4;
                }
                .problem-item {
                  page-break-inside: avoid;
                  break-inside: avoid;
                  page-break-after: auto;
                }
                .print-header {
                  page-break-after: avoid;
                }
                .page-break {
                  page-break-before: always;
                  break-before: always;
                }
                /* 숨겨진 페이지는 인쇄하지 않음 - 우선순위 최상 */
                [data-print-hidden="true"],
                [data-print-hidden="true"] *,
                .answer-sheet-page[style*="display: none"],
                .answer-sheet-page[style*="display:none"],
                .problem-page[style*="display: none"],
                .problem-page[style*="display:none"] {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  overflow: hidden !important;
                  position: absolute !important;
                  left: -9999px !important;
                }
              }
            `}</style>
            
            <div className="print-area">
              <div className="max-w-4xl mx-auto bg-white">
                {/* 페이지 1: 객관식 문제 */}
                {generatedProblems.filter(p => p.options && p.options.length > 0).length > 0 && (
                  <div className="p-8 problem-page"
                    data-page-type="multiple-choice">
                    {/* 시험지 헤더 */}
                    <div className="print-header border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-3xl font-bold text-center mb-2">
                        학습 확인 문제 (객관식)
                      </h1>
                      <div className="flex justify-between text-sm mt-4">
                        <div>
                          <span className="font-semibold">학생명:</span> {student?.name}
                        </div>
                        <div>
                          <span className="font-semibold">출제일:</span> {new Date().toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="font-semibold">출제 개념:</span> {selectedConcepts.join(', ')}
                      </div>
                    </div>

                    {/* 객관식 문제 */}
                    <div className="space-y-6">
                      {generatedProblems
                        .map((problem, idx) => ({ problem, originalIdx: idx }))
                        .filter(({ problem }) => problem.options && problem.options.length > 0)
                        .map(({ problem, originalIdx }, displayIdx) => (
                        <div key={originalIdx} className="problem-item border border-gray-300 p-4 rounded">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-lg">{displayIdx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-1 border border-gray-400 rounded">
                                  {problem.type === 'concept' ? '개념' : problem.type === 'pattern' ? '유형' : '심화'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  [{problem.concept}]
                                </span>
                              </div>
                              <p className="text-base whitespace-pre-wrap mb-4">{problem.question}</p>
                              
                              <div className="space-y-2 ml-4">
                                {problem.options.map((option: string, optIdx: number) => (
                                  <div key={optIdx} className="flex items-start gap-2">
                                    <span className="font-medium">({optIdx + 1})</span>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 시험지 푸터 */}
                    <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
                      <p>※ 문제를 풀고 선생님께 제출해주세요.</p>
                    </div>
                  </div>
                )}

                {/* 페이지 2: 서술형 문제 */}
                {generatedProblems.filter(p => p.answerSpace || (!p.options || p.options.length === 0)).length > 0 && (
                  <div className="p-8 page-break problem-page"
                    data-page-type="essay">
                    {/* 서술형 헤더 */}
                    <div className="print-header border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-3xl font-bold text-center mb-2">
                        학습 확인 문제 (서술형)
                      </h1>
                      <div className="flex justify-between text-sm mt-4">
                        <div>
                          <span className="font-semibold">학생명:</span> {student?.name}
                        </div>
                        <div>
                          <span className="font-semibold">출제일:</span> {new Date().toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="font-semibold">출제 개념:</span> {selectedConcepts.join(', ')}
                      </div>
                    </div>

                    {/* 서술형 문제 */}
                    <div className="space-y-6">
                      {generatedProblems
                        .map((problem, idx) => ({ problem, originalIdx: idx }))
                        .filter(({ problem }) => problem.answerSpace || (!problem.options || problem.options.length === 0))
                        .map(({ problem, originalIdx }, displayIdx) => (
                        <div key={originalIdx} className="problem-item border border-gray-300 p-4 rounded">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-lg">{displayIdx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-1 border border-gray-400 rounded">
                                  {problem.type === 'concept' ? '개념' : problem.type === 'pattern' ? '유형' : '심화'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  [{problem.concept}]
                                </span>
                              </div>
                              <p className="text-base whitespace-pre-wrap mb-4">{problem.question}</p>

                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-2">풀이:</p>
                                <div className="min-h-[120px] border border-gray-300 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 서술형 푸터 */}
                    <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
                      <p>※ 문제를 풀고 선생님께 제출해주세요.</p>
                    </div>
                  </div>
                )}

                {/* 페이지 3: 답안지 */}
                <div className="p-8 page-break answer-sheet-page"
                  data-page-type="answers">
                  {/* 답지 헤더 */}
                  <div className="print-header border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-center mb-2">
                      정답 및 해설
                    </h1>
                    <div className="flex justify-between text-sm mt-4">
                      <div>
                        <span className="font-semibold">학생명:</span> {student?.name}
                      </div>
                      <div>
                        <span className="font-semibold">출제일:</span> {new Date().toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-semibold">출제 개념:</span> {selectedConcepts.join(', ')}
                    </div>
                  </div>

                  {/* 답안 */}
                  <div className="space-y-5">
                    {generatedProblems.map((problem, idx) => (
                      <div key={idx} className="problem-item border border-gray-300 p-4 rounded">
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-lg">{idx + 1}.</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2 py-1 border border-gray-400 rounded">
                                {problem.type === 'concept' ? '개념' : problem.type === 'pattern' ? '유형' : '심화'}
                              </span>
                              <span className="text-xs text-gray-600">
                                [{problem.concept}]
                              </span>
                            </div>
                            
                            {/* 정답 */}
                            <div className="bg-gray-50 p-3 rounded mb-3">
                              <p className="font-semibold text-sm mb-1">정답:</p>
                              <p className="text-base">{problem.answer || '답안 참조'}</p>
                            </div>

                            {/* 해설 */}
                            {problem.explanation && (
                              <div className="border-t pt-3">
                                <p className="font-semibold text-sm mb-2">해설:</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {problem.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 답지 푸터 */}
                  <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
                    <p>※ 이 답지는 교사용입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
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
// Build 1771716273
