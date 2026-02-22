"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Database, Bug } from "lucide-react";

export default function ClassTraceDebugPage() {
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const runTrace = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch('/api/classes/trace', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTraceData(data);
        console.log("🔍 Trace Data:", data);
      } else {
        const error = await response.json();
        console.error("❌ Trace Error:", error);
        alert("추적 실패: " + error.message);
      }

    } catch (err: any) {
      console.error("❌ Error:", err);
      alert("오류 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="w-8 h-8 text-red-600" />
          🔍 클래스 실시간 추적 디버거
        </h1>
        <p className="text-gray-600">
          클래스 생성부터 표시까지 모든 단계를 추적하여 문제를 정확히 파악합니다
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={runTrace} disabled={loading} size="lg">
          <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          전체 추적 시작
        </Button>
      </div>

      {traceData && (
        <div className="space-y-6">
          {/* STEP 1: 사용자 조회 */}
          <Card className="border-2 border-blue-300">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                사용자 조회 (User Lookup)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {traceData.step1_userLookup.found ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">사용자 찾음</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded">
                    <div>
                      <span className="font-semibold">이메일:</span>
                      <p className="text-sm">{traceData.step1_userLookup.email}</p>
                    </div>
                    <div>
                      <span className="font-semibold">역할:</span>
                      <Badge className="ml-2">{traceData.step1_userLookup.role}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold">테이블:</span>
                      <Badge variant="outline" className="ml-2">{traceData.step1_userLookup.table}</Badge>
                    </div>
                    <div>
                      <span className="font-semibold">academyId:</span>
                      <Badge 
                        variant={traceData.step1_userLookup.academyId ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {traceData.step1_userLookup.academyId || "NULL"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">사용자를 찾을 수 없습니다</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 2: 모든 클래스 */}
          <Card className="border-2 border-purple-300">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                데이터베이스의 모든 클래스
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-3">
                <span className="text-lg font-semibold">
                  총 {traceData.step2_allClasses.total}개의 클래스
                </span>
              </div>
              {traceData.step2_allClasses.classes && traceData.step2_allClasses.classes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {traceData.step2_allClasses.classes.map((cls: any) => (
                    <div key={cls.id} className="p-3 bg-gray-50 border border-gray-300 rounded">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="font-semibold">ID:</span> {cls.id}</div>
                        <div><span className="font-semibold">이름:</span> {cls.name}</div>
                        <div>
                          <span className="font-semibold">academy_id:</span> 
                          <code className="ml-1 px-1 bg-white rounded text-xs">
                            {JSON.stringify(cls.academy_id)} ({cls.academy_id_type})
                          </code>
                        </div>
                        <div><span className="font-semibold">학원:</span> {cls.academy_name || 'N/A'}</div>
                        <div><span className="font-semibold">생성일:</span> {cls.created_at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
                  <span className="text-red-700 font-semibold">데이터베이스에 클래스가 없습니다!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 3: 필터링 */}
          <Card className="border-2 border-yellow-300">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                필터링 로직
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-3 p-3 bg-gray-100 rounded">
                <div className="font-semibold">필터 방법: {traceData.step3_filtering.method}</div>
                {traceData.step3_filtering.userAcademyId && (
                  <div className="mt-2">
                    <span className="font-semibold">사용자 academyId: </span>
                    <code className="px-2 py-1 bg-white rounded">
                      {JSON.stringify(traceData.step3_filtering.userAcademyId)} 
                      ({traceData.step3_filtering.userAcademyIdType})
                    </code>
                  </div>
                )}
              </div>

              {traceData.step3_filtering.error ? (
                <div className="p-4 bg-red-50 border border-red-300 rounded">
                  <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
                  <span className="text-red-700 font-semibold">{traceData.step3_filtering.error}</span>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <span className="text-lg font-semibold">
                      필터 결과: {traceData.step3_filtering.totalClasses || 0}개 중 {traceData.step3_filtering.matchedClasses || traceData.step3_filtering.matched}개 매칭
                    </span>
                  </div>

                  {traceData.step3_filtering.filterDetails && (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {traceData.step3_filtering.filterDetails.map((detail: any, idx: number) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded border-2 ${
                            detail.finalMatch 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{detail.className}</span>
                            {detail.finalMatch ? (
                              <Badge className="bg-green-600">✓ 매칭됨</Badge>
                            ) : (
                              <Badge variant="destructive">✗ 불일치</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              클래스 academy_id: 
                              <code className="ml-1 px-1 bg-white rounded">
                                {JSON.stringify(detail.class_academy_id)} ({detail.class_academy_id_type})
                              </code>
                            </div>
                            <div>
                              사용자 academyId: 
                              <code className="ml-1 px-1 bg-white rounded">
                                {JSON.stringify(detail.user_academyId)} ({detail.user_academyId_type})
                              </code>
                            </div>
                            <div>
                              String 비교 (===): {detail.stringMatch ? '✓' : '✗'}
                            </div>
                            <div>
                              Loose 비교 (==): {detail.looseMatch ? '✓' : '✗'}
                            </div>
                            <div>
                              Strict 비교 (===): {detail.strictMatch ? '✓' : '✗'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 4: 최종 결과 */}
          <Card className="border-2 border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                최종 결과 (사용자에게 표시될 클래스)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-3">
                <span className="text-lg font-semibold">
                  {traceData.step4_finalResult.count}개의 클래스가 표시됩니다
                </span>
              </div>
              {traceData.step4_finalResult.count > 0 ? (
                <div className="space-y-2">
                  {traceData.step4_finalResult.classes.map((cls: any) => (
                    <div key={cls.id} className="p-3 bg-green-50 border border-green-300 rounded">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="font-semibold">ID:</span> {cls.id}</div>
                        <div><span className="font-semibold">이름:</span> {cls.name}</div>
                        <div><span className="font-semibold">학년:</span> {cls.grade || '-'}</div>
                        <div><span className="font-semibold">색상:</span> 
                          <span className="ml-2 inline-block w-4 h-4 rounded" style={{backgroundColor: cls.color}}></span>
                        </div>
                        <div><span className="font-semibold">생성일:</span> {cls.createdAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-300 rounded">
                  <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
                  <span className="text-red-700 font-semibold">⚠️ 표시될 클래스가 없습니다!</span>
                  <p className="text-sm text-red-600 mt-2">
                    위의 필터링 단계에서 문제를 확인하세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 전체 JSON */}
          <details className="border rounded p-4">
            <summary className="cursor-pointer font-semibold text-lg mb-2">
              📊 전체 추적 데이터 (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-96 font-mono">
              {JSON.stringify(traceData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {!traceData && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">
              위의 "전체 추적 시작" 버튼을 클릭하여 디버깅을 시작하세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
