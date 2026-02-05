"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  Brain, MessageSquare, TrendingUp, Users, Clock, 
  BookOpen, Award, Target, Sparkles 
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatAnalysis {
  totalChats: number;
  totalStudents: number;
  averagePerStudent: number;
  mostActiveTime: string;
  topTopics: string[];
}

export default function AIChatAnalysisPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<ChatAnalysis>({
    totalChats: 0,
    totalStudents: 0,
    averagePerStudent: 0,
    mostActiveTime: "",
    topTopics: [],
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    fetchAnalysis();
  }, [router]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      
      // 목업 데이터
      setAnalysis({
        totalChats: 1248,
        totalStudents: 42,
        averagePerStudent: 29.7,
        mostActiveTime: "15:00 ~ 18:00",
        topTopics: ["수학", "영어", "과학", "역사", "코딩"],
      });
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  // 시간대별 채팅 데이터
  const hourlyData = [
    { hour: "06:00", count: 12 },
    { hour: "09:00", count: 45 },
    { hour: "12:00", count: 89 },
    { hour: "15:00", count: 156 },
    { hour: "18:00", count: 134 },
    { hour: "21:00", count: 78 },
    { hour: "24:00", count: 23 },
  ];

  // 주제별 데이터
  const topicData = [
    { name: "수학", value: 320, color: "#3b82f6" },
    { name: "영어", value: 280, color: "#10b981" },
    { name: "과학", value: 210, color: "#f59e0b" },
    { name: "역사", value: 180, color: "#ef4444" },
    { name: "기타", value: 258, color: "#8b5cf6" },
  ];

  // 학습 패턴 데이터
  const learningPatternData = [
    { date: "월", questions: 45, completed: 38 },
    { date: "화", questions: 52, completed: 47 },
    { date: "수", questions: 48, completed: 42 },
    { date: "목", questions: 61, completed: 55 },
    { date: "금", questions: 58, completed: 51 },
    { date: "토", questions: 35, completed: 32 },
    { date: "일", questions: 28, completed: 25 },
  ];

  // 상위 학생 데이터
  const topStudents = [
    { name: "김민준", chats: 87, topics: ["수학", "과학"], progress: 92 },
    { name: "이서연", chats: 76, topics: ["영어", "역사"], progress: 88 },
    { name: "박지호", chats: 69, topics: ["코딩", "수학"], progress: 85 },
    { name: "최유진", chats: 64, topics: ["영어", "과학"], progress: 82 },
    { name: "정현우", chats: 58, topics: ["수학", "코딩"], progress: 79 },
  ];

  // 자주 묻는 질문
  const frequentQuestions = [
    { question: "이차방정식 푸는 방법", count: 45, category: "수학" },
    { question: "영어 문법 시제 설명", count: 38, category: "영어" },
    { question: "파이썬 반복문 사용법", count: 32, category: "코딩" },
    { question: "광합성 과정 설명", count: 28, category: "과학" },
    { question: "한국사 주요 사건", count: 24, category: "역사" },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              AI 채팅 분석
            </h1>
            <p className="text-gray-600 mt-1">학습 패턴과 질문 트렌드를 분석합니다</p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            뒤로가기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                총 대화 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{analysis.totalChats}</div>
              <p className="text-xs text-gray-500 mt-1">전체 AI 채팅</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                참여 학생
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analysis.totalStudents}명</div>
              <p className="text-xs text-gray-500 mt-1">AI 사용 학생</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                평균 사용
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analysis.averagePerStudent}</div>
              <p className="text-xs text-gray-500 mt-1">학생당 대화</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                활발 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600">{analysis.mostActiveTime}</div>
              <p className="text-xs text-gray-500 mt-1">가장 활발한 시간</p>
            </CardContent>
          </Card>
        </div>

        {/* 차트 탭 */}
        <Tabs defaultValue="time" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="time">시간대별</TabsTrigger>
            <TabsTrigger value="topic">주제별</TabsTrigger>
            <TabsTrigger value="pattern">학습 패턴</TabsTrigger>
          </TabsList>

          <TabsContent value="time">
            <Card>
              <CardHeader>
                <CardTitle>시간대별 채팅 활동</CardTitle>
                <CardDescription>하루 중 AI 채팅이 가장 활발한 시간</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="채팅 수" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topic">
            <Card>
              <CardHeader>
                <CardTitle>주제별 분포</CardTitle>
                <CardDescription>학생들이 가장 많이 질문하는 과목</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pattern">
            <Card>
              <CardHeader>
                <CardTitle>주간 학습 패턴</CardTitle>
                <CardDescription>질문 수와 완료율 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningPatternData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="questions" stroke="#3b82f6" name="질문 수" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" name="완료 수" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 상위 활동 학생 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                상위 활동 학생
              </CardTitle>
              <CardDescription>AI 채팅을 가장 많이 활용하는 학생들</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <div className="flex gap-2 mt-1">
                        {student.topics.map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{student.chats}회</p>
                      <p className="text-xs text-gray-500">{student.progress}% 진도</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 자주 묻는 질문 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                자주 묻는 질문
              </CardTitle>
              <CardDescription>학생들이 가장 많이 하는 질문</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {frequentQuestions.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.question}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-600">{item.count}회</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 인사이트 카드 */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI 분석 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm">
                📊 <strong>학습 패턴:</strong> 학생들은 주로 방과 후 15:00~18:00에 AI 튜터를 가장 많이 사용합니다.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm">
                🎯 <strong>인기 주제:</strong> 수학(26%)과 영어(22%)가 가장 많은 질문을 차지하고 있습니다.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm">
                💡 <strong>추천 사항:</strong> 수학과 영어 AI 봇의 응답 품질을 개선하면 전체 만족도가 향상될 것으로 예상됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
