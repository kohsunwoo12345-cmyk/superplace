"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Upload, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function QuickExportPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      const response = await fetch('/api/force-export-to-d1');
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch (error) {
      console.error('미리보기 로드 실패:', error);
    }
  };

  const handleExport = async () => {
    if (!confirm(`${preview?.localUsers || 0}명의 사용자를 Cloudflare D1로 내보내시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/force-export-to-d1', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        alert(`✅ 성공!\n\n${data.message}`);
        loadPreview();
      } else {
        alert(`❌ 실패: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🚀 빠른 D1 내보내기</h1>
        <p className="text-gray-600">로컬 DB의 모든 사용자를 D1로 한 번에 복사</p>
      </div>

      {preview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              현재 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">로컬 PostgreSQL</div>
                <div className="text-3xl font-bold">{preview.localUsers}명</div>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="text-sm text-gray-500 mb-1">Cloudflare D1</div>
                <div className="text-3xl font-bold text-blue-600">{preview.d1Users}명</div>
              </div>
            </div>

            {preview.d1Users === 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  D1이 비어있습니다. 지금 바로 내보내기를 실행하세요!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            내보내기 실행
          </CardTitle>
          <CardDescription>
            {preview?.localUsers || 0}명의 사용자를 D1로 복사합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={loading || !preview}
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? '내보내는 중...' : `${preview?.localUsers || 0}명 D1로 내보내기`}
          </Button>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <div>✅ 중복 체크: 이메일 기준</div>
            <div>✅ 기존 데이터: 자동 업데이트</div>
            <div>✅ 소요 시간: 약 {Math.ceil((preview?.localUsers || 0) / 10)} 초</div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              내보내기 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-gray-600">전체</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-gray-600">성공</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">실패</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-red-600">오류 목록:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err: any, idx: number) => (
                    <div key={idx} className="text-sm p-2 bg-red-50 rounded">
                      <strong>{err.email}</strong>: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                이제 자동 동기화가 5분마다 실행됩니다!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">다음 단계</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>1. ✅ D1로 내보내기 완료</div>
          <div>2. 🔄 자동 동기화가 5분마다 실행됩니다</div>
          <div>3. 📊 <a href="/dashboard/sync" className="text-blue-600 underline">동기화 대시보드</a>에서 확인</div>
          <div>4. 👥 <a href="/dashboard/admin/users" className="text-blue-600 underline">사용자 관리</a>에서 동기화된 사용자 확인</div>
        </CardContent>
      </Card>
    </div>
  );
}
