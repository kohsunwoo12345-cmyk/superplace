"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Download, ChevronRight } from "lucide-react";
import { PPTVariables, DEFAULT_PPT_VARIABLES } from "@/types/ppt-variables";
import { createDetailedPPT } from "@/utils/ppt-generator";

// PptxGenJS 타입 선언
declare global {
  interface Window {
    PptxGenJS: any;
  }
}

export default function PPTCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pptxReady, setPptxReady] = useState(false);
  const [data, setData] = useState<PPTVariables>(DEFAULT_PPT_VARIABLES);

  // CDN에서 PptxGenJS 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PptxGenJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
      script.onload = () => {
        console.log('✅ PptxGenJS loaded from CDN');
        setPptxReady(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load PptxGenJS from CDN');
      };
      document.head.appendChild(script);
    } else if (window.PptxGenJS) {
      setPptxReady(true);
    }
  }, []);

  const updateField = (field: keyof PPTVariables, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const createPPT = async () => {
    if (!data.title.trim()) {
      alert("제목을 입력하세요");
      return;
    }

    if (!pptxReady || !window.PptxGenJS) {
      alert("PPT 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Creating PPT with variables...');
      const result = createDetailedPPT(data);
      console.log('✅ PPT created:', result);
      alert(`✅ PPT가 성공적으로 생성되었습니다!\n\n파일명: ${result.filename}`);
    } catch (error: any) {
      console.error("❌ Failed to create PPT:", error);
      alert(`❌ PPT 생성 실패\n\n오류: ${error.message || error}\n\n페이지를 새로고침 후 다시 시도해주세요.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">📊 PPT 제작 (변수 기반)</h1>
          <p className="text-gray-600 mt-2">50개 변수를 입력하면 자동으로 8-20페이지 전문 PPT가 생성됩니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            돌아가기
          </Button>
          <Button 
            onClick={createPPT} 
            disabled={loading || !pptxReady}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                PPT 생성
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 변수 입력 폼 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="student">학생 정보</TabsTrigger>
          <TabsTrigger value="scores">성적 정보</TabsTrigger>
          <TabsTrigger value="analysis">학습 분석</TabsTrigger>
          <TabsTrigger value="goals">목표 및 메시지</TabsTrigger>
        </TabsList>

        {/* 탭 1: 기본 정보 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보 (5개 변수)</CardTitle>
              <CardDescription>학원 및 보고서 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academyName">학원명 *</Label>
                  <Input
                    id="academyName"
                    value={data.academyName}
                    onChange={(e) => updateField('academyName', e.target.value)}
                    placeholder="예: 서울수학학원"
                  />
                </div>
                <div>
                  <Label htmlFor="presenter">발표자</Label>
                  <Input
                    id="presenter"
                    value={data.presenter}
                    onChange={(e) => updateField('presenter', e.target.value)}
                    placeholder="예: 이선생님"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="예: 김민수 학생 학습 성장 보고서"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">부제목</Label>
                <Input
                  id="subtitle"
                  value={data.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  placeholder="예: 2026년 3월 월간 학습 리포트"
                />
              </div>

              <div>
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={data.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 2: 학생 정보 */}
        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle>학생 기본 정보 (10개 변수)</CardTitle>
              <CardDescription>학생의 기본 정보와 출석 현황을 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">학생 이름 *</Label>
                  <Input
                    id="studentName"
                    value={data.studentName}
                    onChange={(e) => updateField('studentName', e.target.value)}
                    placeholder="예: 김민수"
                  />
                </div>
                <div>
                  <Label htmlFor="studentGrade">학년</Label>
                  <Input
                    id="studentGrade"
                    value={data.studentGrade}
                    onChange={(e) => updateField('studentGrade', e.target.value)}
                    placeholder="예: 중학교 2학년"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="studentClass">반</Label>
                  <Input
                    id="studentClass"
                    value={data.studentClass}
                    onChange={(e) => updateField('studentClass', e.target.value)}
                    placeholder="예: A반"
                  />
                </div>
                <div>
                  <Label htmlFor="studentNumber">학번</Label>
                  <Input
                    id="studentNumber"
                    value={data.studentNumber}
                    onChange={(e) => updateField('studentNumber', e.target.value)}
                    placeholder="예: 2024001"
                  />
                </div>
                <div>
                  <Label htmlFor="studentPhone">전화번호</Label>
                  <Input
                    id="studentPhone"
                    value={data.studentPhone}
                    onChange={(e) => updateField('studentPhone', e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">학부모 이름</Label>
                  <Input
                    id="parentName"
                    value={data.parentName}
                    onChange={(e) => updateField('parentName', e.target.value)}
                    placeholder="예: 김학부모"
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone">학부모 전화번호</Label>
                  <Input
                    id="parentPhone"
                    value={data.parentPhone}
                    onChange={(e) => updateField('parentPhone', e.target.value)}
                    placeholder="010-8765-4321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="enrollmentDate">등록일</Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={data.enrollmentDate}
                    onChange={(e) => updateField('enrollmentDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="attendanceRate">출석률</Label>
                  <Input
                    id="attendanceRate"
                    value={data.attendanceRate}
                    onChange={(e) => updateField('attendanceRate', e.target.value)}
                    placeholder="예: 95%"
                  />
                </div>
                <div>
                  <Label htmlFor="totalClasses">총 수업 수</Label>
                  <Input
                    id="totalClasses"
                    value={data.totalClasses}
                    onChange={(e) => updateField('totalClasses', e.target.value)}
                    placeholder="예: 40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 3: 성적 정보 */}
        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>성적 정보 (15개 변수)</CardTitle>
              <CardDescription>과목별 점수와 등수 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="koreanScore">국어</Label>
                  <Input
                    id="koreanScore"
                    value={data.koreanScore}
                    onChange={(e) => updateField('koreanScore', e.target.value)}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="mathScore">수학</Label>
                  <Input
                    id="mathScore"
                    value={data.mathScore}
                    onChange={(e) => updateField('mathScore', e.target.value)}
                    placeholder="92"
                  />
                </div>
                <div>
                  <Label htmlFor="englishScore">영어</Label>
                  <Input
                    id="englishScore"
                    value={data.englishScore}
                    onChange={(e) => updateField('englishScore', e.target.value)}
                    placeholder="88"
                  />
                </div>
                <div>
                  <Label htmlFor="scienceScore">과학</Label>
                  <Input
                    id="scienceScore"
                    value={data.scienceScore}
                    onChange={(e) => updateField('scienceScore', e.target.value)}
                    placeholder="90"
                  />
                </div>
                <div>
                  <Label htmlFor="socialScore">사회</Label>
                  <Input
                    id="socialScore"
                    value={data.socialScore}
                    onChange={(e) => updateField('socialScore', e.target.value)}
                    placeholder="87"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="averageScore">평균 점수</Label>
                  <Input
                    id="averageScore"
                    value={data.averageScore}
                    onChange={(e) => updateField('averageScore', e.target.value)}
                    placeholder="88.4"
                  />
                </div>
                <div>
                  <Label htmlFor="totalScore">총점</Label>
                  <Input
                    id="totalScore"
                    value={data.totalScore}
                    onChange={(e) => updateField('totalScore', e.target.value)}
                    placeholder="442"
                  />
                </div>
                <div>
                  <Label htmlFor="rank">등수</Label>
                  <Input
                    id="rank"
                    value={data.rank}
                    onChange={(e) => updateField('rank', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="grade">등급</Label>
                  <Input
                    id="grade"
                    value={data.grade}
                    onChange={(e) => updateField('grade', e.target.value)}
                    placeholder="A"
                  />
                </div>
                <div>
                  <Label htmlFor="previousAverage">이전 평균</Label>
                  <Input
                    id="previousAverage"
                    value={data.previousAverage}
                    onChange={(e) => updateField('previousAverage', e.target.value)}
                    placeholder="82.0"
                  />
                </div>
                <div>
                  <Label htmlFor="scoreChange">점수 변화</Label>
                  <Input
                    id="scoreChange"
                    value={data.scoreChange}
                    onChange={(e) => updateField('scoreChange', e.target.value)}
                    placeholder="+6.4"
                  />
                </div>
                <div>
                  <Label htmlFor="rankChange">등수 변화</Label>
                  <Input
                    id="rankChange"
                    value={data.rankChange}
                    onChange={(e) => updateField('rankChange', e.target.value)}
                    placeholder="+3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="strongestSubject">가장 강한 과목</Label>
                  <Input
                    id="strongestSubject"
                    value={data.strongestSubject}
                    onChange={(e) => updateField('strongestSubject', e.target.value)}
                    placeholder="수학"
                  />
                </div>
                <div>
                  <Label htmlFor="weakestSubject">가장 약한 과목</Label>
                  <Input
                    id="weakestSubject"
                    value={data.weakestSubject}
                    onChange={(e) => updateField('weakestSubject', e.target.value)}
                    placeholder="국어"
                  />
                </div>
                <div>
                  <Label htmlFor="improvementRate">향상률</Label>
                  <Input
                    id="improvementRate"
                    value={data.improvementRate}
                    onChange={(e) => updateField('improvementRate', e.target.value)}
                    placeholder="7.8%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 4: 학습 분석 */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>학습 분석 (10개 변수)</CardTitle>
              <CardDescription>학습 태도와 습관에 대한 상세 분석을 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="strengths">강점 (줄바꿈으로 구분)</Label>
                <Textarea
                  id="strengths"
                  value={data.strengths}
                  onChange={(e) => updateField('strengths', e.target.value)}
                  placeholder="수학적 사고력 우수&#10;문제 해결 능력 뛰어남&#10;꾸준한 학습 태도"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="weaknesses">약점 (줄바꿈으로 구분)</Label>
                <Textarea
                  id="weaknesses"
                  value={data.weaknesses}
                  onChange={(e) => updateField('weaknesses', e.target.value)}
                  placeholder="국어 독해 속도 개선 필요&#10;영어 듣기 연습 부족"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studyHabits">학습 습관</Label>
                  <Input
                    id="studyHabits"
                    value={data.studyHabits}
                    onChange={(e) => updateField('studyHabits', e.target.value)}
                    placeholder="매일 2시간 자기주도학습"
                  />
                </div>
                <div>
                  <Label htmlFor="concentration">집중력</Label>
                  <Input
                    id="concentration"
                    value={data.concentration}
                    onChange={(e) => updateField('concentration', e.target.value)}
                    placeholder="높음 (90%)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="participation">참여도</Label>
                  <Input
                    id="participation"
                    value={data.participation}
                    onChange={(e) => updateField('participation', e.target.value)}
                    placeholder="적극적"
                  />
                </div>
                <div>
                  <Label htmlFor="homework">숙제 완성도</Label>
                  <Input
                    id="homework"
                    value={data.homework}
                    onChange={(e) => updateField('homework', e.target.value)}
                    placeholder="100% 완성"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="attitude">학습 태도</Label>
                  <Input
                    id="attitude"
                    value={data.attitude}
                    onChange={(e) => updateField('attitude', e.target.value)}
                    placeholder="성실하고 적극적"
                  />
                </div>
                <div>
                  <Label htmlFor="progressRate">진도율</Label>
                  <Input
                    id="progressRate"
                    value={data.progressRate}
                    onChange={(e) => updateField('progressRate', e.target.value)}
                    placeholder="95%"
                  />
                </div>
                <div>
                  <Label htmlFor="understandingLevel">이해도</Label>
                  <Input
                    id="understandingLevel"
                    value={data.understandingLevel}
                    onChange={(e) => updateField('understandingLevel', e.target.value)}
                    placeholder="높음"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recommendations">추천사항</Label>
                <Textarea
                  id="recommendations"
                  value={data.recommendations}
                  onChange={(e) => updateField('recommendations', e.target.value)}
                  placeholder="국어 독해 연습 강화&#10;영어 듣기 매일 30분 권장"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 5: 목표 및 메시지 */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>목표 설정 및 메시지 (10개 변수)</CardTitle>
              <CardDescription>단기/중기/장기 목표와 선생님 코멘트를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shortTermGoal">단기 목표 (1개월)</Label>
                <Input
                  id="shortTermGoal"
                  value={data.shortTermGoal}
                  onChange={(e) => updateField('shortTermGoal', e.target.value)}
                  placeholder="다음 시험 수학 100점 달성"
                />
              </div>

              <div>
                <Label htmlFor="midTermGoal">중기 목표 (3개월)</Label>
                <Input
                  id="midTermGoal"
                  value={data.midTermGoal}
                  onChange={(e) => updateField('midTermGoal', e.target.value)}
                  placeholder="전체 평균 90점 이상 유지"
                />
              </div>

              <div>
                <Label htmlFor="longTermGoal">장기 목표 (6개월)</Label>
                <Input
                  id="longTermGoal"
                  value={data.longTermGoal}
                  onChange={(e) => updateField('longTermGoal', e.target.value)}
                  placeholder="과학고 진학 준비"
                />
              </div>

              <div>
                <Label htmlFor="actionPlan1">실행 계획 1</Label>
                <Input
                  id="actionPlan1"
                  value={data.actionPlan1}
                  onChange={(e) => updateField('actionPlan1', e.target.value)}
                  placeholder="국어 독해 문제집 매일 10문제"
                />
              </div>

              <div>
                <Label htmlFor="actionPlan2">실행 계획 2</Label>
                <Input
                  id="actionPlan2"
                  value={data.actionPlan2}
                  onChange={(e) => updateField('actionPlan2', e.target.value)}
                  placeholder="영어 듣기 매일 30분 연습"
                />
              </div>

              <div>
                <Label htmlFor="actionPlan3">실행 계획 3</Label>
                <Input
                  id="actionPlan3"
                  value={data.actionPlan3}
                  onChange={(e) => updateField('actionPlan3', e.target.value)}
                  placeholder="수학 심화 문제 주 3회"
                />
              </div>

              <div>
                <Label htmlFor="expectedOutcome">기대 성과</Label>
                <Input
                  id="expectedOutcome"
                  value={data.expectedOutcome}
                  onChange={(e) => updateField('expectedOutcome', e.target.value)}
                  placeholder="다음 시험 전과목 90점 이상"
                />
              </div>

              <div>
                <Label htmlFor="teacherComment">선생님 코멘트</Label>
                <Textarea
                  id="teacherComment"
                  value={data.teacherComment}
                  onChange={(e) => updateField('teacherComment', e.target.value)}
                  placeholder="꾸준한 노력으로 성적이 크게 향상되었습니다. 국어와 영어에 조금 더 집중하면 더 좋은 결과를 기대할 수 있습니다."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="encouragement">격려 문구</Label>
                <Input
                  id="encouragement"
                  value={data.encouragement}
                  onChange={(e) => updateField('encouragement', e.target.value)}
                  placeholder="민수는 매우 성실한 학생입니다. 지금처럼만 하면 목표를 충분히 달성할 수 있습니다!"
                />
              </div>

              <div>
                <Label htmlFor="parentAdvice">학부모님께 드리는 말씀</Label>
                <Textarea
                  id="parentAdvice"
                  value={data.parentAdvice}
                  onChange={(e) => updateField('parentAdvice', e.target.value)}
                  placeholder="가정에서도 국어 독서 시간을 늘려주시면 큰 도움이 될 것입니다."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PPT 라이브러리 로딩 상태 */}
      {!pptxReady && (
        <Card className="mt-4 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-yellow-800">PPT 라이브러리를 로딩 중입니다...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
