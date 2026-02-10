"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Loader2, ClipboardCheck } from "lucide-react";

export default function AttendanceCheckPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError("6자리 출석 코드를 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setCode("");
      } else {
        setError(data.error || data.message || "출석 인증에 실패했습니다");
      }
    } catch (err: any) {
      setError("출석 인증 중 오류가 발생했습니다");
      console.error("Attendance verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <ClipboardCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">출석 인증</h1>
          <p className="text-gray-600">6자리 출석 코드를 입력하세요</p>
        </div>

        {/* 입력 폼 */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>출석 코드 입력</CardTitle>
            <CardDescription>
              학생별로 부여된 6자리 코드를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCode(value);
                    setError("");
                    setResult(null);
                  }}
                  className="text-center text-2xl font-bold tracking-widest"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  숫자 6자리를 입력하세요
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">오류</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      {result.message}
                    </p>
                    {result.student && (
                      <div className="text-sm text-green-700 space-y-1">
                        <p>• 이름: {result.student.name}</p>
                        <p>• 날짜: {result.attendance?.date}</p>
                        <p>• 상태: {result.attendance?.status === 'present' ? '출석' : '지각'}</p>
                        <p>• 시간: {result.attendance?.checkInTime}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    인증 중...
                  </>
                ) : (
                  "출석 인증"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-2">📌 안내 사항</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 각 학생에게 부여된 고유 6자리 코드를 사용하세요</li>
              <li>• 하루에 한 번만 출석 체크가 가능합니다</li>
              <li>• 오전 9시 이전: 출석 / 9시 이후: 지각</li>
              <li>• 출석 코드가 활성화되어 있어야 합니다</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
