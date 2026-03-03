"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Settings,
  Users,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
} from "lucide-react";

interface DirectorLimitation {
  id?: number;
  director_id: number;
  academy_id: number;
  
  homework_grading_daily_limit: number;
  homework_grading_monthly_limit: number;
  homework_grading_daily_used: number;
  homework_grading_monthly_used: number;
  
  max_students: number;
  
  similar_problem_enabled: number;
  similar_problem_daily_limit: number;
  similar_problem_monthly_limit: number;
  similar_problem_daily_used: number;
  similar_problem_monthly_used: number;
  
  weak_concept_analysis_enabled: number;
  weak_concept_daily_limit: number;
  weak_concept_monthly_limit: number;
  weak_concept_daily_used: number;
  weak_concept_monthly_used: number;
  
  competency_analysis_enabled: number;
  competency_daily_limit: number;
  competency_monthly_limit: number;
  competency_daily_used: number;
  competency_monthly_used: number;
  
  landing_page_html_direct_edit: number;
}

interface Academy {
  id: number;
  name: string;
  directorId?: number;
  directorName?: string;
}

export default function DirectorLimitationsPage() {
  const router = useRouter();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<number | null>(null);
  const [limitation, setLimitation] = useState<DirectorLimitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAcademies();
  }, []);

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/admin/academies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAcademies(data.academies || []);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }

      // Fallback to mock data
      const mockAcademies: Academy[] = [
        {
          id: 1,
          name: "서울 수학 학원",
          directorId: 2,
          directorName: "김학원",
        },
        {
          id: 2,
          name: "부산 영어 학원",
          directorId: 8,
          directorName: "최원장",
        },
      ];
      setAcademies(mockAcademies);
    } catch (error) {
      console.error('Failed to fetch academies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLimitation = async (academyId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let apiSuccess = false;
      
      if (token) {
        try {
          // 먼저 학원장 정보 조회
          const directorResponse = await fetch(`/api/admin/users?academyId=${academyId}&role=DIRECTOR`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          let directorId = null;
          if (directorResponse.ok) {
            const directorData = await directorResponse.json();
            if (directorData.users && directorData.users.length > 0) {
              directorId = directorData.users[0].id;
            }
          }
          
          if (!directorId) {
            // Use mock director ID
            const mockDirectorIds: { [key: number]: number } = { 1: 2, 2: 8 };
            directorId = mockDirectorIds[academyId] || 1;
          }
          
          // 제한 정보 조회
          const response = await fetch(`/api/admin/director-limitations?academyId=${academyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const limitationData = data.limitation;
            
            // director_id와 academy_id가 없으면 추가
            if (!limitationData.director_id) {
              limitationData.director_id = directorId;
            }
            if (!limitationData.academy_id) {
              limitationData.academy_id = academyId;
            }
            
            setLimitation(limitationData);
            console.log('✅ Limitation loaded:', limitationData);
            apiSuccess = true;
          }
        } catch (apiError) {
          console.log('API not available, using mock data');
        }
      }

      // Fallback to mock data
      if (!apiSuccess) {
        const mockDirectorIds: { [key: number]: number } = { 1: 2, 2: 8 };
        const directorId = mockDirectorIds[academyId] || 1;

        const mockLimitation: DirectorLimitation = {
          id: academyId,
          director_id: directorId,
          academy_id: academyId,
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
          landing_page_html_direct_edit: 0,
        };

        setLimitation(mockLimitation);
      }
    } catch (error) {
      console.error('Failed to fetch limitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademySelect = async (academyId: number) => {
    setSelectedAcademyId(academyId);
    await fetchLimitation(academyId);
  };

  const saveLimitation = async () => {
    if (!limitation) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch('/api/admin/director-limitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limitation),
      });

      if (response.ok) {
        alert('✅ 학원장 제한 설정이 저장되었습니다.');
        if (selectedAcademyId) {
          await fetchLimitation(selectedAcademyId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to save limitation:', error);
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const selectedAcademy = academies.find(a => a.id === selectedAcademyId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-8 h-8 text-blue-600" />
                학원장 기능 제한 설정
              </h1>
              <p className="text-gray-600 mt-1">
                학원별로 기능 사용 제한을 설정할 수 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* Academy Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              학원 선택
            </CardTitle>
            <CardDescription>제한을 설정할 학원을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedAcademyId || ''}
              onChange={(e) => handleAcademySelect(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">학원을 선택하세요</option>
              {academies.map((academy) => (
                <option key={academy.id} value={academy.id}>
                  {academy.name} {academy.directorName && `(원장: ${academy.directorName})`}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Limitation Settings */}
        {selectedAcademyId && limitation && (
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="features">기능 활성화</TabsTrigger>
              <TabsTrigger value="daily">일일 제한</TabsTrigger>
              <TabsTrigger value="monthly">월간 제한</TabsTrigger>
              <TabsTrigger value="students">학생 수 제한</TabsTrigger>
              <TabsTrigger value="landingpage">랜딩페이지</TabsTrigger>
            </TabsList>

            {/* Feature Activation */}
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>기능 활성화 설정</CardTitle>
                  <CardDescription>각 기능의 활성화/비활성화를 설정합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Similar Problem */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">유사문제 출제 기능</h3>
                      <p className="text-sm text-gray-500">학생의 부족한 개념에 대한 유사문제를 출제합니다</p>
                    </div>
                    <Button
                      variant={limitation.similar_problem_enabled === 1 ? "default" : "outline"}
                      onClick={() => setLimitation({
                        ...limitation,
                        similar_problem_enabled: limitation.similar_problem_enabled === 1 ? 0 : 1
                      })}
                    >
                      {limitation.similar_problem_enabled === 1 ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> 활성화</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" /> 비활성화</>
                      )}
                    </Button>
                  </div>

                  {/* Weak Concept Analysis */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">부족한 개념 분석 기능</h3>
                      <p className="text-sm text-gray-500">학생의 학습 데이터를 분석하여 부족한 개념을 찾습니다</p>
                    </div>
                    <Button
                      variant={limitation.weak_concept_analysis_enabled === 1 ? "default" : "outline"}
                      onClick={() => setLimitation({
                        ...limitation,
                        weak_concept_analysis_enabled: limitation.weak_concept_analysis_enabled === 1 ? 0 : 1
                      })}
                    >
                      {limitation.weak_concept_analysis_enabled === 1 ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> 활성화</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" /> 비활성화</>
                      )}
                    </Button>
                  </div>

                  {/* Competency Analysis */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">AI 기반 역량 분석 기능</h3>
                      <p className="text-sm text-gray-500">AI가 학생의 대화를 분석하여 역량을 평가합니다</p>
                    </div>
                    <Button
                      variant={limitation.competency_analysis_enabled === 1 ? "default" : "outline"}
                      onClick={() => setLimitation({
                        ...limitation,
                        competency_analysis_enabled: limitation.competency_analysis_enabled === 1 ? 0 : 1
                      })}
                    >
                      {limitation.competency_analysis_enabled === 1 ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> 활성화</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" /> 비활성화</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Daily Limits */}
            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>일일 사용 제한</CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>하루에 사용할 수 있는 횟수를 설정합니다</p>
                      <p className="text-blue-600 font-medium">💡 0으로 설정하면 무제한으로 사용 가능합니다</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        숙제 채점 (일일)
                        {limitation.homework_grading_daily_limit === 0 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.homework_grading_daily_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          homework_grading_daily_limit: Number(e.target.value)
                        })}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.homework_grading_daily_limit === 0 
                          ? '무제한 사용 가능' 
                          : `현재 사용: ${limitation.homework_grading_daily_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        유사문제 출제 (일일)
                        {limitation.similar_problem_daily_limit === 0 && limitation.similar_problem_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.similar_problem_daily_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          similar_problem_daily_limit: Number(e.target.value)
                        })}
                        disabled={limitation.similar_problem_enabled === 0}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.similar_problem_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.similar_problem_daily_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.similar_problem_daily_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        부족한 개념 분석 (일일)
                        {limitation.weak_concept_daily_limit === 0 && limitation.weak_concept_analysis_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.weak_concept_daily_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          weak_concept_daily_limit: Number(e.target.value)
                        })}
                        disabled={limitation.weak_concept_analysis_enabled === 0}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.weak_concept_analysis_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.weak_concept_daily_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.weak_concept_daily_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        AI 역량 분석 (일일)
                        {limitation.competency_daily_limit === 0 && limitation.competency_analysis_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.competency_daily_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          competency_daily_limit: Number(e.target.value)
                        })}
                        disabled={limitation.competency_analysis_enabled === 0}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.competency_analysis_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.competency_daily_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.competency_daily_used || 0}회`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Limits */}
            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>월간 사용 제한</CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>한 달에 사용할 수 있는 횟수를 설정합니다</p>
                      <p className="text-blue-600 font-medium">💡 0으로 설정하면 무제한으로 사용 가능합니다</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        숙제 채점 (월간)
                        {limitation.homework_grading_monthly_limit === 0 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.homework_grading_monthly_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          homework_grading_monthly_limit: Number(e.target.value)
                        })}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.homework_grading_monthly_limit === 0 
                          ? '무제한 사용 가능' 
                          : `현재 사용: ${limitation.homework_grading_monthly_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        유사문제 출제 (월간)
                        {limitation.similar_problem_monthly_limit === 0 && limitation.similar_problem_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.similar_problem_monthly_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          similar_problem_monthly_limit: Number(e.target.value)
                        })}
                        disabled={limitation.similar_problem_enabled === 0}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.similar_problem_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.similar_problem_monthly_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.similar_problem_monthly_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        부족한 개념 분석 (월간)
                        {limitation.weak_concept_monthly_limit === 0 && limitation.weak_concept_analysis_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.weak_concept_monthly_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          weak_concept_monthly_limit: Number(e.target.value)
                        })}
                        disabled={limitation.weak_concept_analysis_enabled === 0}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.weak_concept_analysis_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.weak_concept_monthly_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.weak_concept_monthly_used || 0}회`
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        AI 역량 분석 (월간)
                        {limitation.competency_monthly_limit === 0 && limitation.competency_analysis_enabled === 1 && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={limitation.competency_monthly_limit}
                        onChange={(e) => setLimitation({
                          ...limitation,
                          competency_monthly_limit: Number(e.target.value)
                        })}
                        disabled={limitation.competency_analysis_enabled === 0}
                        placeholder="0 = 무제한"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {limitation.competency_analysis_enabled === 0 
                          ? '기능 비활성화됨' 
                          : limitation.competency_monthly_limit === 0 
                            ? '무제한 사용 가능'
                            : `현재 사용: ${limitation.competency_monthly_used || 0}회`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Landing Page Permission */}
            <TabsContent value="landingpage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>랜딩페이지 HTML 직접 편집 권한</CardTitle>
                  <CardDescription>
                    학원장이 HTML 코드를 직접 입력하여 랜딩페이지를 만들 수 있는 권한을 부여합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">HTML 직접 편집 기능</h3>
                      <p className="text-sm text-gray-500">활성화 시 학원장이 랜딩페이지 생성 시 HTML 코드를 직접 입력할 수 있습니다</p>
                    </div>
                    <Button
                      variant={limitation.landing_page_html_direct_edit === 1 ? "default" : "outline"}
                      onClick={() => setLimitation({
                        ...limitation,
                        landing_page_html_direct_edit: limitation.landing_page_html_direct_edit === 1 ? 0 : 1
                      })}
                    >
                      {limitation.landing_page_html_direct_edit === 1 ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> 활성화</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-2" /> 비활성화</>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">주의사항</p>
                        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                          <li>HTML 직접 편집은 고급 기능으로, HTML/CSS/JavaScript에 대한 이해가 필요합니다</li>
                          <li>잘못된 코드 입력 시 랜딩페이지가 제대로 표시되지 않을 수 있습니다</li>
                          <li>보안상 주의가 필요하므로 신뢰할 수 있는 학원장에게만 권한을 부여하세요</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Limit */}
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    학생 수 제한
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>학원에 등록할 수 있는 최대 학생 수를 설정합니다</p>
                      <p className="text-blue-600 font-medium">💡 0으로 설정하면 무제한으로 등록 가능합니다</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-md">
                    <label className="block text-sm font-medium mb-2">
                      최대 학생 수
                      {limitation.max_students === 0 && (
                        <span className="ml-2 text-xs text-blue-600 font-semibold">무제한</span>
                      )}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={limitation.max_students}
                      onChange={(e) => setLimitation({
                        ...limitation,
                        max_students: Number(e.target.value)
                      })}
                      placeholder="0 = 무제한"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {limitation.max_students === 0 
                        ? '무제한 등록 가능' 
                        : `설정된 제한: ${limitation.max_students}명`
                      }
                    </p>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">주의사항</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            학생 수 제한은 신규 학생 등록 시에만 적용됩니다.
                            기존에 등록된 학생은 영향을 받지 않습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Save Button */}
        {selectedAcademyId && limitation && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button onClick={saveLimitation} disabled={saving}>
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
          </div>
        )}

        {!selectedAcademyId && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">학원을 선택하여 제한 설정을 시작하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
