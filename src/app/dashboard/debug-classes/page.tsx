"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Database, User as UserIcon } from "lucide-react";

export default function DebugClassesPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      console.log("👤 User from localStorage:", userData);
    }
  };

  const testClassesAPI = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      console.log("🔑 Token:", token ? "존재함" : "없음");

      // 1. 클래스 조회 API 호출
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log("📡 API Response:", data);
      
      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        data: data
      });

    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDiagnostic = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");

      // 종합 진단 API 호출
      const response = await fetch('/api/classes/diagnostic', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllClasses(data);
        console.log("🔬 Comprehensive Diagnostic:", data);
      }

    } catch (err: any) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    loadUserInfo();
    testClassesAPI();
    testDiagnostic();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔍 클래스 디버그 페이지</h1>
        <p className="text-gray-600">
          클래스 생성 및 조회 문제를 진단합니다
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <Button onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          전체 새로고침
        </Button>
        <Button onClick={testClassesAPI} variant="outline" disabled={loading}>
          클래스 API 테스트
        </Button>
        <Button onClick={testDiagnostic} variant="outline" disabled={loading}>
          종합 진단
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">오류 발생:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 mb-6">
        {/* 사용자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              1️⃣ 사용자 정보 (localStorage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">이메일:</span>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <span className="font-semibold">이름:</span>
                    <p className="text-sm">{user.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold">역할:</span>
                    <Badge>{user.role}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold">사용자 ID:</span>
                    <p className="text-sm">{user.id}</p>
                  </div>
                  <div>
                    <span className="font-semibold">academyId:</span>
                    <Badge variant={user.academyId ? "default" : "destructive"}>
                      {user.academyId || "❌ NULL"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">academy_id:</span>
                    <Badge variant={user.academy_id ? "default" : "destructive"}>
                      {user.academy_id || "❌ NULL"}
                    </Badge>
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    전체 사용자 데이터 보기
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-500">사용자 정보가 없습니다</p>
            )}
          </CardContent>
        </Card>

        {/* API 응답 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              2️⃣ /api/classes API 응답
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-semibold">HTTP 상태:</span>
                    <Badge 
                      variant={apiResponse.status === 200 ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {apiResponse.status} {apiResponse.statusText}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">성공:</span>
                    {apiResponse.data.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 inline ml-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 inline ml-2" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">클래스 개수:</span>
                    <Badge variant="outline" className="ml-2">
                      {apiResponse.data.classes?.length || 0}개
                    </Badge>
                  </div>
                </div>

                {apiResponse.data.classes && apiResponse.data.classes.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-2">조회된 클래스:</p>
                    <div className="space-y-2">
                      {apiResponse.data.classes.map((cls: any) => (
                        <div key={cls.id} className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="font-semibold">ID:</span> {cls.id}</div>
                            <div><span className="font-semibold">이름:</span> {cls.name}</div>
                            <div><span className="font-semibold">academy_id:</span> {cls.academyId}</div>
                            <div><span className="font-semibold">학년:</span> {cls.grade || '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-semibold">⚠️ 조회된 클래스가 없습니다</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      사용자의 academyId와 일치하는 클래스가 없거나, 필터링 조건에 맞지 않습니다.
                    </p>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    전체 API 응답 보기
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-500">API를 호출하려면 위의 버튼을 클릭하세요</p>
            )}
          </CardContent>
        </Card>

        {/* 종합 진단 결과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              3️⃣ 종합 진단 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allClasses && typeof allClasses === 'object' && allClasses.user ? (
              <div className="space-y-6">
                {/* User Info from DB */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">👤 데이터베이스 사용자 정보</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-semibold">테이블:</span> {allClasses.user.table}</div>
                      <div><span className="font-semibold">이메일:</span> {allClasses.user.data?.email}</div>
                      <div><span className="font-semibold">역할:</span> <Badge>{allClasses.user.role}</Badge></div>
                      <div>
                        <span className="font-semibold">academyId:</span> 
                        <Badge variant={allClasses.user.academyId ? "default" : "destructive"} className="ml-2">
                          {allClasses.user.academyId || "NULL"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type Checks */}
                {allClasses.typeChecks && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🔍 타입 비교 분석</h3>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold">사용자 academyId:</span> 
                        <code className="ml-2 px-2 py-1 bg-white rounded">
                          {JSON.stringify(allClasses.typeChecks.userAcademyIdValue)} 
                          (타입: {allClasses.typeChecks.userAcademyIdType})
                        </code>
                      </div>
                      <div className="mt-3">
                        <p className="font-semibold text-sm mb-2">각 클래스의 academy_id 비교:</p>
                        <div className="space-y-1 max-h-64 overflow-auto">
                          {allClasses.typeChecks.classAcademyIds?.map((item: any, idx: number) => (
                            <div 
                              key={idx}
                              className={`p-2 rounded text-xs ${
                                item.matches ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                              }`}
                            >
                              <span className="font-mono">
                                클래스 ID: {item.id} | academy_id: {JSON.stringify(item.academy_id)} ({item.type}) | 
                                loose(==): {item.matches ? '✓' : '✗'} | 
                                strict(===): {item.strictMatches ? '✓' : '✗'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Classes */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">📚 모든 클래스 ({allClasses.classes?.count || 0}개)</h3>
                  {allClasses.classes?.all && allClasses.classes.all.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {allClasses.classes.all.map((cls: any) => (
                        <div key={cls.id} className="p-3 bg-gray-50 border border-gray-300 rounded text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div><span className="font-semibold">ID:</span> {cls.id}</div>
                            <div><span className="font-semibold">이름:</span> {cls.class_name}</div>
                            <div><span className="font-semibold">academy_id:</span> {cls.academy_id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">클래스가 없습니다</p>
                  )}
                </div>

                {/* Matching Classes */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">✅ 매칭된 클래스 ({allClasses.classes?.matchingCount || 0}개)</h3>
                  {allClasses.classes?.matchingUserAcademy && allClasses.classes.matchingUserAcademy.length > 0 ? (
                    <div className="space-y-2">
                      {allClasses.classes.matchingUserAcademy.map((cls: any) => (
                        <div key={cls.id} className="p-3 bg-green-50 border border-green-300 rounded text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div><span className="font-semibold">ID:</span> {cls.id}</div>
                            <div><span className="font-semibold">이름:</span> {cls.class_name}</div>
                            <div><span className="font-semibold">academy_id:</span> {cls.academy_id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-300 rounded">
                      <p className="text-red-800 font-semibold">⚠️ 매칭된 클래스가 없습니다!</p>
                      <p className="text-sm text-red-700 mt-1">
                        사용자의 academyId와 일치하는 academy_id를 가진 클래스가 데이터베이스에 없습니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* SQL JOIN Result */}
                {allClasses.joins?.withUserAcademy && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🔗 JOIN 쿼리 결과</h3>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                      <p className="text-sm mb-2">
                        User, Academy 테이블과 JOIN한 결과: {allClasses.joins.withUserAcademy.length}개
                      </p>
                      {allClasses.joins.withUserAcademy.length > 0 ? (
                        <div className="space-y-2">
                          {allClasses.joins.withUserAcademy.map((cls: any) => (
                            <div key={cls.id} className="p-2 bg-white rounded text-xs">
                              {cls.class_name} (academy: {cls.academyName || 'N/A'}, teacher: {cls.teacherName || 'N/A'})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-purple-700">JOIN 결과가 없습니다</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-semibold">
                    전체 진단 데이터 (JSON)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(allClasses, null, 2)}
                  </pre>
                </details>
              </div>
            ) : Array.isArray(allClasses) && allClasses.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  총 {allClasses.length}개의 클래스
                </p>
                {allClasses.map((cls: any) => {
                  const matchesUser = 
                    cls.academyId === user?.academyId || 
                    cls.academyId === user?.academy_id ||
                    cls.academy_id === user?.academyId ||
                    cls.academy_id === user?.academy_id;

                  return (
                    <div 
                      key={cls.id} 
                      className={`p-3 border rounded ${
                        matchesUser 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{cls.name || cls.class_name}</span>
                        {matchesUser && (
                          <Badge variant="default" className="bg-green-600">
                            ✓ 매칭됨
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">ID:</span> {cls.id}
                        </div>
                        <div>
                          <span className="text-gray-600">academy_id:</span>{" "}
                          <span className="font-mono">{cls.academy_id || cls.academyId || "NULL"}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">학년:</span> {cls.grade || "-"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">전체 DB 조회 버튼을 클릭하세요</p>
            )}
          </CardContent>
        </Card>

        {/* 진단 결과 */}
        {user && apiResponse && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🔬 진단 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">사용자 academyId:</span>
                  <code className="ml-2 px-2 py-1 bg-white rounded">
                    {user.academyId || user.academy_id || user.id || "NULL"}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">조회된 클래스 수:</span>
                  <code className="ml-2 px-2 py-1 bg-white rounded">
                    {apiResponse.data.classes?.length || 0}개
                  </code>
                </div>

                {apiResponse.data.classes?.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="font-semibold text-yellow-900 mb-2">⚠️ 문제 원인:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-800">
                      <li>사용자의 academyId: <code>{user.academyId || user.academy_id || "없음"}</code></li>
                      <li>생성된 클래스의 academy_id와 불일치할 가능성</li>
                      <li>또는 User 테이블에 academyId가 설정되지 않음</li>
                    </ul>
                  </div>
                )}

                {apiResponse.data.classes?.length > 0 && (
                  <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
                    <p className="font-semibold text-green-900">✅ 정상 작동 중</p>
                    <p className="text-green-800 mt-1">
                      클래스가 정상적으로 조회되고 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 해결 방법 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 문제 해결 방법</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. academyId가 NULL인 경우</h3>
              <p className="text-gray-700">
                User 테이블에서 사용자의 academyId를 설정해야 합니다.
              </p>
              <code className="block mt-2 p-2 bg-gray-100 rounded text-xs">
                UPDATE User SET academyId = [학원ID] WHERE email = '[이메일]'
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. academy_id 불일치인 경우</h3>
              <p className="text-gray-700">
                클래스 생성 시 올바른 academyId가 전달되지 않았습니다.
              </p>
              <p className="text-gray-600 mt-1">
                클래스 생성 페이지에서 사용자의 academyId를 확인하세요.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. 로그 확인</h3>
              <p className="text-gray-700">
                Cloudflare Workers 로그에서 실제 쿼리 파라미터를 확인하세요:
              </p>
              <p className="text-gray-600 mt-1">
                Cloudflare Dashboard → Workers → superplace → Logs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
