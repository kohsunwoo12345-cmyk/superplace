"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Shield, User } from "lucide-react";

export default function AttendanceVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  const handleVerify = async () => {
    if (!code.trim()) {
      alert("출석 코드를 입력해주세요.");
      return;
    }

    if (code.length !== 6) {
      alert("6자리 출석 코드를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 출석 인증 API 호출 (로그인 불필요)
      const response = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStudentInfo(data);
        setVerified(true);
        
        // 2초 후 숙제 검사 페이지로 이동
        setTimeout(() => {
          router.push(`/homework-check?userId=${data.userId}&attendanceId=${data.recordId}`);
        }, 2000);
      } else {
        alert(data.message || "출석 인증에 실패했습니다.");
      }
    } catch (error) {
      console.error("Attendance verify error:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      handleVerify();
    }
  };

  if (verified && studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">출석 인증 완료!</h2>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">{studentInfo.userName}</span>
              </div>
              <p className="text-sm text-gray-600">{studentInfo.userEmail}</p>
              <p className="text-xs text-gray-500 mt-2">
                출석 시간: {new Date(studentInfo.verifiedAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <p className="text-gray-600 mb-4">숙제 검사 페이지로 이동합니다...</p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <span>잠시만 기다려주세요</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            출석 인증
          </CardTitle>
          <CardDescription className="text-base mt-2">
            선생님이 알려준 6자리 출석 코드를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">출석 코드로 간편하게!</p>
                <p className="text-xs text-blue-600">
                  로그인 없이 코드만으로 출석할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 출석 코드 입력 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">출석 코드</label>
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="text-center text-3xl tracking-[1em] font-bold h-16 border-2 focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">
              {code.length}/6 자리 입력됨
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                인증 중...
              </>
            ) : (
              <>
                출석 인증하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* 추가 안내 */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              💡 출석 후 자동으로 숙제 제출 페이지로 이동합니다
            </p>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-sm text-gray-600"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
