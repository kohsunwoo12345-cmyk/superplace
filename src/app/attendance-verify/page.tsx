"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, QrCode as QrCodeIcon, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function AttendanceVerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    
    // 학생인 경우 출석 코드 자동 로드
    if (userData.role === 'STUDENT') {
      fetchAttendanceCode(userData.id);
    }
  }, [router]);

  const fetchAttendanceCode = async (userId: string) => {
    try {
      const response = await fetch(`/api/students/attendance-code?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceCode(data.code);
      }
    } catch (error) {
      console.error("Failed to fetch attendance code:", error);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      alert("출석 코드를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 출석 인증 API 호출
      const response = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          code: code.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVerified(true);
        setTimeout(() => {
          router.push(`/homework-check?userId=${user.id}&attendanceId=${data.recordId}`);
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.message || "출석 인증에 실패했습니다.");
      }
    } catch (error) {
      console.error("Attendance verify error:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (verified) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">출석 인증</CardTitle>
          <CardDescription>
            출석 코드를 입력하여 출석을 인증하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 학생 출석 코드 표시 */}
          {user.role === 'STUDENT' && attendanceCode && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <QrCodeIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">내 출석 코드</span>
                  </div>
                  
                  {/* QR 코드 */}
                  <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                    <QRCodeSVG 
                      value={`ATTENDANCE:${user.id}:${attendanceCode}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                      fgColor="#7c3aed"
                    />
                  </div>
                  
                  {/* 숫자 코드 */}
                  <div className="text-4xl font-bold text-purple-700 tracking-widest">
                    {attendanceCode}
                  </div>
                  <p className="text-xs text-gray-600">
                    QR 코드를 스캔하거나 숫자를 입력하세요
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 출석 코드 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">출석 코드</label>
            <Input
              type="text"
              placeholder="6자리 숫자 입력"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-bold"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 text-center">
              선생님이 제공한 6자리 숫자를 입력하세요
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full"
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

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-sm"
            >
              뒤로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
