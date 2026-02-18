'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertCircle, Database, RefreshCw } from 'lucide-react';

export default function DatabaseInitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const populateDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/database/populate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to populate database');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-teal-600" />
            데이터베이스 초기화
          </h1>
          <p className="text-gray-600 mt-1">
            기본 데이터를 데이터베이스에 추가합니다
          </p>
        </div>

        {!result && !error && (
          <Card>
            <CardHeader>
              <CardTitle>데이터베이스 초기화</CardTitle>
              <CardDescription>
                다음 데이터가 생성됩니다:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>✅ 관리자 계정 (admin@superplace.co.kr / admin123456)</p>
                <p>✅ 슈퍼플레이스 학원</p>
                <p>✅ AI 봇 3개 (학습 도우미, 수학 튜터, 영어 튜터)</p>
                <p>✅ 샘플 학생 3명</p>
                <p>✅ 샘플 클래스 2개</p>
                <p>✅ 샘플 학부모 3명</p>
                <p>✅ SMS 잔액 10,000P</p>
              </div>

              <Button
                onClick={populateDatabase}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    초기화 중...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    데이터베이스 초기화 실행
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                초기화 실패
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={populateDatabase} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                초기화 완료!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-semibold text-green-900">생성된 데이터:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white rounded">
                    <span className="text-gray-600">사용자:</span>{' '}
                    <span className="font-bold">{result.summary?.users || 0}명</span>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <span className="text-gray-600">AI 봇:</span>{' '}
                    <span className="font-bold">{result.summary?.bots || 0}개</span>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <span className="text-gray-600">학원:</span>{' '}
                    <span className="font-bold">{result.summary?.academies || 0}개</span>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <span className="text-gray-600">클래스:</span>{' '}
                    <span className="font-bold">{result.summary?.classes || 0}개</span>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <span className="text-gray-600">학부모:</span>{' '}
                    <span className="font-bold">{result.summary?.parents || 0}명</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-green-900">상세 로그:</p>
                <div className="bg-white p-3 rounded text-xs space-y-1 max-h-64 overflow-y-auto">
                  {result.results?.map((msg: string, idx: number) => (
                    <div key={idx}>{msg}</div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-green-200">
                <p className="font-semibold text-green-900">다음 단계:</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full"
                    variant="outline"
                  >
                    로그인 페이지로 이동
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/admin/database-status')}
                    className="w-full"
                    variant="outline"
                  >
                    데이터베이스 상태 확인
                  </Button>
                  <Button
                    onClick={populateDatabase}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 초기화
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-900 border border-blue-200">
                <p className="font-semibold mb-1">관리자 로그인 정보:</p>
                <p>이메일: admin@superplace.co.kr</p>
                <p>비밀번호: admin123456</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
