'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingDown, AlertCircle, CheckCircle, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  grade: string;
  weakConcepts: string[];
  overallScore: number;
  improvementRate: number;
}

interface ConceptAnalysis {
  concept: string;
  studentCount: number;
  averageScore: number;
  severity: 'high' | 'medium' | 'low';
}

export default function AIConceptAnalysisPage() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: '김철수',
      grade: '중1',
      weakConcepts: ['일차방정식', '도형의 넓이', '정수와 유리수'],
      overallScore: 65,
      improvementRate: 12
    },
    {
      id: '2',
      name: '이영희',
      grade: '중2',
      weakConcepts: ['연립방정식', '확률과 통계'],
      overallScore: 72,
      improvementRate: 8
    },
    {
      id: '3',
      name: '박민수',
      grade: '중3',
      weakConcepts: ['이차함수', '삼각비', '원의 방정식'],
      overallScore: 58,
      improvementRate: 15
    },
    {
      id: '4',
      name: '최지은',
      grade: '중1',
      weakConcepts: ['정수와 유리수', '식의 계산'],
      overallScore: 68,
      improvementRate: 10
    }
  ]);

  const [conceptAnalyses, setConceptAnalyses] = useState<ConceptAnalysis[]>([
    { concept: '일차방정식', studentCount: 8, averageScore: 62, severity: 'high' },
    { concept: '이차함수', studentCount: 12, averageScore: 55, severity: 'high' },
    { concept: '확률과 통계', studentCount: 6, averageScore: 70, severity: 'medium' },
    { concept: '도형의 넓이', studentCount: 5, averageScore: 75, severity: 'medium' },
    { concept: '삼각비', studentCount: 9, averageScore: 58, severity: 'high' },
    { concept: '원의 방정식', studentCount: 4, averageScore: 80, severity: 'low' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('전체');

  const grades = ['전체', '중1', '중2', '중3'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === '전체' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return '긴급';
      case 'medium': return '주의';
      case 'low': return '양호';
      default: return '확인';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-rose-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI 부족한 개념 분석</h1>
                <p className="text-sm text-gray-500">학생들의 취약 개념을 AI가 자동으로 분석합니다</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">분석된 학생</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}명</div>
              <p className="text-xs text-muted-foreground">전체 학생 대상</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">취약 개념</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conceptAnalyses.length}개</div>
              <p className="text-xs text-muted-foreground">집중 관리 필요</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(students.reduce((sum, s) => sum + s.overallScore, 0) / students.length)}점
              </div>
              <p className="text-xs text-muted-foreground">100점 만점</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 개선율</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(students.reduce((sum, s) => sum + s.improvementRate, 0) / students.length)}%
              </div>
              <p className="text-xs text-muted-foreground">지난 달 대비</p>
            </CardContent>
          </Card>
        </div>

        {/* Concept Analysis Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>취약 개념 통계</CardTitle>
            <CardDescription>학생들이 가장 어려워하는 개념들을 분석했습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conceptAnalyses
                .sort((a, b) => a.averageScore - b.averageScore)
                .map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <Brain className="h-8 w-8 text-rose-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{analysis.concept}</h3>
                        <p className="text-sm text-gray-500">{analysis.studentCount}명의 학생이 어려움을 겪고 있습니다</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{analysis.averageScore}점</div>
                        <p className="text-xs text-gray-500">평균 점수</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
                        {getSeverityText(analysis.severity)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="학생 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {grades.map(grade => (
                  <Button
                    key={grade}
                    variant={selectedGrade === grade ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGrade(grade)}
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudents.map(student => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>{student.grade}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{student.overallScore}점</div>
                    <div className="text-sm text-green-600">+{student.improvementRate}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">취약 개념:</h4>
                    <div className="flex flex-wrap gap-2">
                      {student.weakConcepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    상세 분석 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
