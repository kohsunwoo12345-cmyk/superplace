"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

interface ReportData {
  studentName: string;
  period: string;
  totalDays: number;
  presentDays: number;
  tardyDays: number;
  absentDays: number;
  attendanceRate: string;
  homeworkRate: string;
  homeworkCompleted: number;
  aiChatCount: number;
  academyName?: string;
  directorName?: string;
}

export default function StudentGrowthReportViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 데모 데이터 로드
    setTimeout(() => {
      setReport({
        studentName: "김민준",
        period: "2024.01.01 ~ 2024.02.28",
        totalDays: 40,
        presentDays: 38,
        tardyDays: 1,
        absentDays: 1,
        attendanceRate: "95%",
        homeworkRate: "90%",
        homeworkCompleted: 36,
        aiChatCount: 127,
        academyName: "슈퍼플레이스 스터디",
        directorName: "홍길동"
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">리포트를 찾을 수 없습니다</h2>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        
        body {
            font-family: 'Pretendard', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        .text-gradient {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .text-gradient-gold {
            background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stat-card {
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.04);
            border-color: #e2e8f0;
        }

        .progress-bar-fill {
            transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
            background-size: 200% 200%;
            animation: gradientMove 3s ease infinite;
        }

        @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .bg-pattern {
            background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-[850px] mx-auto mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>

        <div className="max-w-[850px] mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          
          {/* Header Section */}
          <div className="relative bg-slate-900 px-10 py-12 overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-30"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 bg-white/10 text-indigo-200 text-xs font-semibold tracking-wider rounded-full backdrop-blur-sm border border-white/10">
                    <i className="fas fa-sparkles mr-1 text-yellow-400"></i> AI-POWERED ANALYSIS
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                  <span className="text-gradient-gold">{report.studentName}</span> 학생 
                  <span className="block mt-1 font-light text-slate-200">종합 학습 성과 리포트</span>
                </h1>
              </div>
              <div className="mt-6 md:mt-0 text-right">
                <p className="text-slate-400 text-sm font-medium">분석 기간</p>
                <p className="text-white font-semibold tracking-wide bg-slate-800/50 px-4 py-2 rounded-lg mt-1 border border-slate-700 backdrop-blur-sm">
                  {report.period}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            
            {/* Intro */}
            <div className="mb-12 relative">
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <div className="pl-6">
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                  학부모님, 안녕하십니까.
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  본 리포트는 20년의 교육 노하우와 최첨단 AI 시스템의 정밀한 데이터를 바탕으로 작성되었습니다. 해당 기간 동안 <span className="font-bold text-indigo-600">{report.studentName}</span> 학생이 학원에서 보여준 눈부신 성장과 학습 궤적을 투명하고 섬세하게 공유해 드립니다.
                </p>
              </div>
            </div>

            {/* Section 1: Attendance */}
            <div className="mb-14">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 shadow-sm">
                  <i className="fas fa-calendar-check text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800">출결 및 성실도 지표</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card bg-slate-50 rounded-xl p-5 text-center">
                  <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wide">총 수업 일수</p>
                  <p className="text-2xl font-bold text-slate-800">{report.totalDays}<span className="text-sm font-medium text-slate-500 ml-1">일</span></p>
                </div>
                <div className="stat-card bg-emerald-50/50 rounded-xl p-5 text-center border border-emerald-100/50">
                  <p className="text-xs font-semibold text-emerald-600 mb-1 tracking-wide">출석</p>
                  <p className="text-2xl font-bold text-emerald-600">{report.presentDays}<span className="text-sm font-medium text-emerald-500 ml-1">일</span></p>
                </div>
                <div className="stat-card bg-amber-50/50 rounded-xl p-5 text-center border border-amber-100/50">
                  <p className="text-xs font-semibold text-amber-600 mb-1 tracking-wide">지각</p>
                  <p className="text-2xl font-bold text-amber-500">{report.tardyDays}<span className="text-sm font-medium text-amber-500 ml-1">일</span></p>
                </div>
                <div className="stat-card bg-rose-50/50 rounded-xl p-5 text-center border border-rose-100/50">
                  <p className="text-xs font-semibold text-rose-600 mb-1 tracking-wide">결석</p>
                  <p className="text-2xl font-bold text-rose-500">{report.absentDays}<span className="text-sm font-medium text-rose-500 ml-1">일</span></p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-600">종합 출석률</span>
                  <span className="text-xl font-extrabold text-blue-600">{report.attendanceRate}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full progress-bar-fill shadow-sm" style={{width: report.attendanceRate}}></div>
                </div>
              </div>
            </div>

            {/* Section 2: Homework */}
            <div className="mb-14">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shadow-sm">
                  <i className="fas fa-pen-nib text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800">자기주도학습 및 과제 달성도</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 mb-3">과제 완수율</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl font-extrabold text-gradient">{report.homeworkRate}</span>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                      <i className="fas fa-check-double text-indigo-500 text-xl"></i>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-full rounded-full progress-bar-fill" style={{width: report.homeworkRate}}></div>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 text-slate-50 opacity-50">
                    <i className="fas fa-layer-group text-9xl"></i>
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-bold text-slate-500 mb-1">누적 과제 완료</p>
                    <p className="text-5xl font-extrabold text-slate-800 mt-2">
                      {report.homeworkCompleted}<span className="text-lg font-medium text-slate-400 ml-1 tracking-normal">건</span>
                    </p>
                    <p className="text-xs text-indigo-500 mt-3 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">
                      <i className="fas fa-arrow-trend-up mr-1"></i> 꾸준한 성실함의 결과입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: AI Learning */}
            <div className="mb-14">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-3 shadow-sm">
                  <i className="fas fa-brain text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800">AI 스마트 튜터링 상호작용</h3>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-purple-100 rounded-2xl p-8 relative overflow-hidden shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                <div className="absolute right-0 top-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0 relative">
                    <div className="w-32 h-32 rounded-full bg-white shadow-xl flex flex-col items-center justify-center border-4 border-purple-50 relative z-10">
                      <span className="text-sm font-bold text-purple-400 mb-[-4px]">TOTAL</span>
                      <span className="text-4xl font-black text-purple-600 tracking-tighter">{report.aiChatCount}</span>
                      <span className="text-xs font-semibold text-slate-400 mt-1">INTERACTIONS</span>
                    </div>
                    <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20"></div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xl font-extrabold text-slate-800 mb-3">자기주도적 AI 학습 체화</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {report.studentName} 학생은 전용 AI 튜터 시스템을 통해 총 <strong className="text-purple-600 text-base">{report.aiChatCount}회</strong>의 심층적인 질의응답과 내신 대비 훈련을 진행했습니다. 
                      이는 단순히 정답을 암기하는 것을 넘어, <strong>스스로 취약점을 발견하고 AI와 상호작용하며 문제를 해결하는 메타인지 능력</strong>이 극대화되었음을 증명하는 핵심 데이터입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Evaluation */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shadow-sm">
                  <i className="fas fa-quote-left text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800">원장 종합 분석 및 향후 방향</h3>
              </div>
              
              <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-100 text-slate-700 leading-loose text-sm font-medium">
                <p className="mb-4">
                  {report.studentName} 학생은 이번 학습 기간 동안 완벽에 가까운 과제 수행률(<span className="font-bold text-indigo-600">{report.homeworkRate}</span>)과 주도적인 AI 스마트 학습(<span className="font-bold text-purple-600">{report.aiChatCount}회</span>)을 통해 괄목할 만한 학업적 성장을 증명해 보였습니다.
                </p>
                <p className="mb-4">
                  이러한 정량적 수치는 학생이 가진 <strong>'배움에 대한 끈기'</strong>와 <strong>'새로운 학습 시스템(AI)을 흡수하는 유연성'</strong>을 동시에 보여주는 매우 긍정적인 신호입니다. 다가오는 커리큘럼에서는 현재 확보된 탄탄한 기본기를 바탕으로, 고난도 서술형 영작 및 수능형 독해 추론 능력을 극대화하는 데 집중하여 완벽한 최상위권으로 도약할 수 있도록 철저히 지도하겠습니다.
                </p>
                <p className="text-slate-500 mt-6 text-center italic">
                  "가정에서도 {report.studentName} 학생의 훌륭한 태도와 눈부신 성장에 아낌없는 칭찬과 지지를 부탁드립니다."
                </p>
              </div>

              {/* Footer & Signature */}
              <div className="mt-16 text-center">
                <div className="inline-block relative">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-300"></div>
                    <i className="fas fa-gem text-slate-300 text-xs"></i>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-300"></div>
                  </div>
                  
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-widest mb-1">{report.academyName || "슈퍼플레이스 스터디"}</h2>
                  <p className="text-slate-500 font-semibold text-sm">
                    <span className="text-indigo-600">인문학 박사</span> / 원장 {report.directorName || "홍길동"} 배상
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
