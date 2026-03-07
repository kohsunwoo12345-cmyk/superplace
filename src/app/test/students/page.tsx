"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      console.log("=== 테스트 시작 ===");
      console.log("Token:", token?.substring(0, 50) + "...");
      console.log("User:", user);
      
      const response = await fetch("/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        token: token ? "존재함" : "없음",
        user: user,
      });
    } catch (error: any) {
      console.error("Error:", error);
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 학생 API 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading} className="w-full">
            {loading ? "테스트 중..." : "API 호출 테스트"}
          </Button>
          
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">📊 결과:</h3>
                <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-bold mb-2">📝 요약:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• HTTP 상태: {result.status}</li>
                  <li>• 성공 여부: {result.ok ? "✅" : "❌"}</li>
                  <li>• Token: {result.token}</li>
                  <li>• 학생 수: {result.data?.students?.length || 0}명</li>
                  <li>• API 성공: {result.data?.success ? "✅" : "❌"}</li>
                  {result.data?.error && (
                    <li className="text-red-600">• 에러: {result.data.error}</li>
                  )}
                </ul>
              </div>
              
              {result.data?.students && result.data.students.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h3 className="font-bold mb-2">👥 학생 목록:</h3>
                  <ul className="space-y-1 text-sm">
                    {result.data.students.slice(0, 5).map((s: any) => (
                      <li key={s.id}>
                        • {s.name} ({s.email}) - {s.role}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
