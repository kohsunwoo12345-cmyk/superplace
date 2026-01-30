"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ExportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export default function ExportUsersPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/export-users-to-d1');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '미리보기 실패');
      }
      
      const data = await response.json();
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!confirm(`${preview?.localStats?.total || 0}명의 사용자를 Cloudflare D1로 내보내시겠습니까?\n\n이 작업은 몇 분이 소요될 수 있습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/export-users-to-d1', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '내보내기 실패');
      }
      
      const data = await response.json();
      setResult(data.result);
      
      await loadPreview();
      
      alert('✅ 사용자 내보내기 완료!');
    } catch (err: any) {
      setError(err.message);
      alert(`❌ 내보내기 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">사용자 데이터 내보내기</h1>
        <p className="text-gray-600">로컬 PostgreSQL → Cloudflare D1</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-500">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터베이스 상태
          </CardTitle>
          <CardDescription>
            현재 데이터베이스의 사용자 수를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={loadPreview} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? '조회 중...' : '미리보기 로드'}
            </Button>

            {preview && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">로컬 PostgreSQL</div>
                  <div className="text-3xl font-bold">{preview.localStats.total}명</div>
                  {preview.localStats.sampleUsers && (
                    <div className="mt-2 text-xs text-gray-600">
                      예시: {preview.localStats.sampleUsers.slice(0, 3).map((u: any) => u.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="text-sm text-gray-500 mb-2">Cloudflare D1</div>
                  <div className="text-3xl font-bold text-blue-600">{preview.d1Stats.total}명</div>
                  <div className="mt-2 text-xs text-gray-600">
                    {preview.d1Stats.total === 0 ? '비어있음' : '데이터 있음'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              내보내기 실행
            </CardTitle>
            <CardDescription>
              로컬 DB의 {preview.localStats.total}명을 Cloudflare D1로 내보냅니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>주의:</strong> D1에 이미 있는 사용자는 업데이트되고, 없는 사용자는 새로 생성됩니다.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? '내보내는 중...' : `${preview.localStats.total}명 내보내기`}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              내보내기 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-gray-600">전체</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-gray-600">생성됨</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">{result.updated}</div>
                <div className="text-sm text-gray-600">업데이트됨</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">실패</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-red-600">오류 목록:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-sm p-2 bg-red-50 rounded">
                      <strong>{err.email}</strong>: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
