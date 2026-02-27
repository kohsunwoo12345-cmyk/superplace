'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, BookOpen, Award, Target, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

interface StudentDetail {
  id: string;
  name: string;
  grade: string;
  email: string;
  phone: string;
  parentPhone: string;
  enrollmentDate: string;
  attendanceRate: number;
  homeworkCompletionRate: number;
  averageScore: number;
  studyHours: number;
  recentActivities: Activity[];
  strengths: string[];
  improvements: string[];
}

interface Activity {
  id: string;
  type: 'attendance' | 'homework' | 'test' | 'ai-analysis';
  description: string;
  date: string;
  score?: number;
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<StudentDetail[]>([
    {
      id: '1',
      name: '김철수',
      grade: '중1',
      email: 'chulsoo@example.com',
      phone: '010-1234-5678',
      parentPhone: '010-9876-5432',
      enrollmentDate: '2024-03-01',
      attendanceRate: 95,
      homeworkCompletionRate: 88,
      averageScore: 85,
      studyHours: 45,
      recentActivities: [
        { id: '1', type: 'attendance', description: '출석', date: '2024-02-27', },
        { id: '2', type: 'homework', description: '수학 숙제 제출', date: '2024-02-26', score: 90 },
        { id: '3', type: 'test', description: '중간고사', date: '2024-02-25', score: 88 }
      ],
      strengths: ['논리적 사고', '문제 해결력', '자기주도 학습'],
      improvements: ['시간 관리', '반복 학습']
    },
    {
      id: '2',
      name: '이영희',
      grade: '중2',
      email: 'younghee@example.com',
      phone: '010-2345-6789',
      parentPhone: '010-8765-4321',
      enrollmentDate: '2024-02-15',
      attendanceRate: 92,
      homeworkCompletionRate: 95,
      averageScore: 92,
      studyHours: 52,
      recentActivities: [
        { id: '1', type: 'attendance', description: '출석', date: '2024-02-27' },
        { id: '2', type: 'homework', description: '영어 숙제 제출', date: '2024-02-26', score: 95 },
        { id: '3', type: 'ai-analysis', description: 'AI 역량 분석', date: '2024-02-24' }
      ],
      strengths: ['꼼꼼함', '성실성', '독해력'],
      improvements: ['수학적 사고', '발표력']
    }
  ]);

  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <Calendar className="h-4 w-4" />;
      case 'homework': return <BookOpen className="h-4 w-4" />;
      case 'test': return <Award className="h-4 w-4" />;
      case 'ai-analysis': return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'attendance': return 'bg-green-50 text-green-600';
      case 'homework': return 'bg-blue-50 text-blue-600';
      case 'test': return 'bg-purple-50 text-purple-600';
      case 'ai-analysis': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">개별 학습 관리</h1>
                <p className="text-sm text-gray-500">학생별 맞춤 학습 관리 및 분석</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}명</div>
              <p className="text-xs text-muted-foreground">등록된 학생 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)}%
              </div>
              <p className="text-xs text-muted-foreground">전체 평균</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length)}점
              </div>
              <p className="text-xs text-muted-foreground">100점 만점</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">숙제 완료율</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(students.reduce((sum, s) => sum + s.homeworkCompletionRate, 0) / students.length)}%
              </div>
              <p className="text-xs text-muted-foreground">전체 평균</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>학생 목록</CardTitle>
                <CardDescription>학생을 선택하여 상세 정보를 확인하세요</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="학생 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                        selectedStudent?.id === student.id ? 'border-indigo-500 bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <span className="text-sm text-gray-500">{student.grade}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>출석 {student.attendanceRate}%</span>
                        <span>평균 {student.averageScore}점</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Detail */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedStudent.name}님의 학습 정보</CardTitle>
                    <CardDescription>등록일: {selectedStudent.enrollmentDate}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">학년</p>
                        <p className="font-medium">{selectedStudent.grade}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">이메일</p>
                        <p className="font-medium">{selectedStudent.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">학생 연락처</p>
                        <p className="font-medium">{selectedStudent.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">학부모 연락처</p>
                        <p className="font-medium">{selectedStudent.parentPhone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">출석률</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{selectedStudent.attendanceRate}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${selectedStudent.attendanceRate}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">숙제 완료율</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{selectedStudent.homeworkCompletionRate}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedStudent.homeworkCompletionRate}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">평균 점수</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">{selectedStudent.averageScore}점</div>
                      <p className="text-sm text-gray-500 mt-1">100점 만점</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">학습 시간</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{selectedStudent.studyHours}시간</div>
                      <p className="text-sm text-gray-500 mt-1">이번 달 누적</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">강점</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedStudent.strengths.map((strength, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">개선 필요</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedStudent.improvements.map((improvement, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>최근 활동</CardTitle>
                    <CardDescription>최근 학습 활동 내역</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedStudent.recentActivities.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{activity.description}</p>
                              <p className="text-sm text-gray-500">{activity.date}</p>
                            </div>
                          </div>
                          {activity.score && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{activity.score}점</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-24 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">학생을 선택하여 상세 정보를 확인하세요</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
