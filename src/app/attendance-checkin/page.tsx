"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function AttendanceCheckinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError("6자리 코드를 입력하세요");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.attendance);
        
        // 3초 후 숙제 검사 페이지로 이동
        setTimeout(() => {
          router.push(`/homework-check?userId=${data.attendance.userId}&attendanceId=${data.attendance.id}`);
        }, 3000);
      } else {
        setError(data.error || "출석 체크인 실패");
      }
    } catch (err) {
      console.error("Checkin error:", err);
      setError("출석 체크인 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md sm:max-w-lg">
        <CardHeader className="p-4 sm:p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">출석 체크인</CardTitle>
          <CardDescription>
            선생님께 받은 6자리 출석 코드를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <form onSubmit={handleCheckin} className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="예: ABC123"
                  maxLength={6}
                  className="text-center text-2xl font-bold tracking-widest"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || code.length !== 6}
              >
                {loading ? "확인 중..." : "출석 체크인"}
              </Button>

              <p className="text-xs text-center text-gray-500">
                코드를 받지 못했다면 선생님께 문의하세요
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  {result.status === 'LATE' ? '지각 체크인 완료' : '출석 완료!'}
                </h3>
                <p className="text-gray-600">{result.userName}님 환영합니다</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">체크인 시간</span>
                  <span className="font-medium">
                    {new Date(result.checkInTime).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상태</span>
                  <span className={`font-medium ${result.status === 'LATE' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {result.status === 'LATE' ? '지각' : '출석'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-blue-600 animate-pulse">
                잠시 후 숙제 검사 페이지로 이동합니다...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
