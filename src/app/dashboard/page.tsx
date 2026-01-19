"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  FileText,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  GraduationCap,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMaterials: 0,
    totalAssignments: 0,
    completionRate: 0,
  });

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isDirector = session?.user?.role === "DIRECTOR";
  const isTeacher = session?.user?.role === "TEACHER";
  const isStudent = session?.user?.role === "STUDENT";

  // Super Admin Dashboard
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              시스템 관리자 대시보드
            </h1>
            <p className="text-gray-600 mt-1">
              전체 시스템 현황을 모니터링하고 관리합니다
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 사용자
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">1,234명</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+48명</span>
                <span className="text-gray-500 ml-1">이번 달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                등록된 학원
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">42개</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+5개</span>
                <span className="text-gray-500 ml-1">이번 달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                활성 학생
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">856명</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">전체 1,234명 중</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI 사용량
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">15.2K</div>
              <div className="flex items-center text-sm mt-2">
                <span className="text-gray-500">이번 달 요청 수</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                최근 가입 사용자
              </CardTitle>
              <CardDescription>최근 7일 내 가입한 사용자 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "김철수", role: "DIRECTOR", academy: "서울수학학원", date: "1일 전" },
                  { name: "이영희", role: "TEACHER", academy: "강남영어학원", date: "2일 전" },
                  { name: "박민수", role: "STUDENT", academy: "부산과학학원", date: "3일 전" },
                  { name: "최지원", role: "DIRECTOR", academy: "인천국어학원", date: "5일 전" },
                ].map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {user.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">
                          {user.role === "DIRECTOR" ? "학원장" : user.role === "TEACHER" ? "선생님" : "학생"} · {user.academy}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{user.date}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                전체 사용자 보기
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                시스템 상태
              </CardTitle>
              <CardDescription>현재 시스템 운영 상태</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "데이터베이스", status: "정상", color: "green" },
                  { name: "API 서버", status: "정상", color: "green" },
                  { name: "AI 서비스", status: "정상", color: "green" },
                  { name: "파일 저장소", status: "정상", color: "green" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <span className={`text-sm px-3 py-1 rounded-full bg-${item.color}-100 text-${item.color}-700`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academy Overview */}
        <Card className="border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              학원 현황
            </CardTitle>
            <CardDescription>요금제별 학원 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plan: "FREE", count: 15, color: "gray" },
                { plan: "BASIC", count: 18, color: "blue" },
                { plan: "PRO", count: 7, color: "purple" },
                { plan: "ENTERPRISE", count: 2, color: "orange" },
              ].map((item) => (
                <div key={item.plan}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.plan}</span>
                    <span className="text-sm text-gray-600">{item.count}개 학원</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-${item.color}-600 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${(item.count / 42) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 실행</CardTitle>
            <CardDescription>관리자 전용 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
                <span>사용자 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-purple-50">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                <span>학원 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-green-50">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <span>전체 통계</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-orange-50">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <span>시스템 설정</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Director Dashboard
  if (isDirector || isTeacher) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              학원장 대시보드
            </h1>
            <p className="text-gray-600 mt-1">
              학원 운영 현황을 한눈에 확인하세요
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Users className="h-4 w-4 mr-2" />
            학생 추가
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                전체 학생
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">128명</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+8명</span>
                <span className="text-gray-500 ml-1">이번 달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                학습 자료
              </CardTitle>
              <BookOpen className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">342개</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+12개</span>
                <span className="text-gray-500 ml-1">이번 주</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                진행 중 과제
              </CardTitle>
              <FileText className="h-5 w-5 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">45건</div>
              <div className="flex items-center text-sm mt-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-500">미제출 3건</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                평균 출석률
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">96%</div>
              <div className="flex items-center text-sm mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+2%</span>
                <span className="text-gray-500 ml-1">지난 달 대비</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                최근 등록 학생
              </CardTitle>
              <CardDescription>최근 7일 내 가입한 학생 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "김민준", grade: "고2", date: "2일 전", class: "A반" },
                  { name: "이서연", grade: "고1", date: "3일 전", class: "B반" },
                  { name: "박지호", grade: "중3", date: "5일 전", class: "C반" },
                  { name: "최유나", grade: "고3", date: "6일 전", class: "특반" },
                ].map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {student.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.grade} · {student.class}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{student.date}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                전체 학생 보기
              </Button>
            </CardContent>
          </Card>

          {/* Pending Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                검토 대기 과제
              </CardTitle>
              <CardDescription>채점이 필요한 과제 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { student: "김민준", subject: "수학", assignment: "2차 방정식 연습", date: "1시간 전" },
                  { student: "이서연", subject: "영어", assignment: "독해 문제 풀이", date: "3시간 전" },
                  { student: "박지호", subject: "과학", assignment: "화학 실험 보고서", date: "5시간 전" },
                  { student: "최유나", subject: "국어", assignment: "문학 작품 분석", date: "1일 전" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-orange-600">
                          {item.subject}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{item.assignment}</p>
                      <p className="text-xs text-gray-600 mt-1">제출: {item.student}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      검토
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                전체 과제 보기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress Overview */}
        <Card className="border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              학습 진도 현황
            </CardTitle>
            <CardDescription>과목별 평균 학습 진도율</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: "수학", progress: 87, color: "blue" },
                { subject: "영어", progress: 92, color: "green" },
                { subject: "과학", progress: 78, color: "purple" },
                { subject: "국어", progress: 85, color: "pink" },
              ].map((item) => (
                <div key={item.subject}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.subject}</span>
                    <span className="text-sm text-gray-600">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`bg-${item.color}-600 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 실행</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
                <span>학생 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-purple-50">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <span>학습 자료</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-pink-50">
                <FileText className="h-6 w-6 text-pink-600" />
                <span>과제 관리</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-green-50">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <span>성적 분석</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            안녕하세요, {session?.user?.name || "학생"}님! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            오늘도 열심히 공부해봐요!
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <BookOpen className="h-4 w-4 mr-2" />
          학습 시작
        </Button>
      </div>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              오늘의 학습
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">2시간 30분</div>
            <div className="flex items-center text-sm mt-2">
              <Target className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">목표 달성!</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              완료한 강의
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">15개</div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-gray-500">전체 42개 중</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              제출할 과제
            </CardTitle>
            <FileText className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">3개</div>
            <div className="flex items-center text-sm mt-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-500">마감 임박 1개</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              평균 점수
            </CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">87점</div>
            <div className="flex items-center text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5점 상승</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content for Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              오늘의 학습 일정
            </CardTitle>
            <CardDescription>2024년 1월 18일</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "14:00", subject: "수학", topic: "이차함수의 최대최소", status: "completed" },
                { time: "15:00", subject: "영어", topic: "문법 - 관계대명사", status: "in-progress" },
                { time: "16:00", subject: "과학", topic: "화학반응식", status: "pending" },
                { time: "17:00", subject: "국어", topic: "현대시 감상", status: "pending" },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    item.status === "completed" ? "bg-green-50 border-green-200" :
                    item.status === "in-progress" ? "bg-blue-50 border-blue-200" :
                    "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-semibold text-gray-600">{item.time}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {item.subject}
                      </span>
                      {item.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {item.status === "in-progress" && (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.topic}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={item.status === "completed" ? "outline" : "default"}
                    disabled={item.status === "completed"}
                  >
                    {item.status === "completed" ? "완료" : "시작"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-pink-600" />
              제출할 과제
            </CardTitle>
            <CardDescription>마감일이 다가오는 순서</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { subject: "수학", title: "미적분 연습문제", dueDate: "오늘", status: "urgent" },
                { subject: "영어", title: "문법 workbook", dueDate: "내일", status: "normal" },
                { subject: "과학", title: "실험 보고서", dueDate: "3일 후", status: "normal" },
                { subject: "국어", title: "독서 감상문", dueDate: "5일 후", status: "normal" },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    item.status === "urgent" ? "bg-red-50 border-red-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-purple-600">
                        {item.subject}
                      </span>
                      {item.status === "urgent" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          긴급
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">마감: {item.dueDate}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    제출
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card className="border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            나의 학습 진도
          </CardTitle>
          <CardDescription>과목별 학습 완료율</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: "수학", progress: 85, total: 42, completed: 36 },
              { subject: "영어", progress: 92, total: 38, completed: 35 },
              { subject: "과학", progress: 78, total: 45, completed: 35 },
              { subject: "국어", progress: 88, total: 40, completed: 35 },
            ].map((item) => (
              <div key={item.subject}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{item.subject}</span>
                  <span className="text-sm text-gray-600">
                    {item.completed}/{item.total} 완료 ({item.progress}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 실행</CardTitle>
          <CardDescription>자주 사용하는 기능</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-blue-50">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span>학습 자료</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-purple-50">
              <FileText className="h-6 w-6 text-purple-600" />
              <span>과제 제출</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-pink-50">
              <Award className="h-6 w-6 text-pink-600" />
              <span>성적 조회</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-green-50">
              <Calendar className="h-6 w-6 text-green-600" />
              <span>출석 확인</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
