"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, CheckCircle, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function HomeworkCheckPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "camera" | "preview" | "result">("login");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 학생 코드 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/student-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 학생 정보 저장 (세션 대신 상태로 관리)
      setUser(data.user);
      
      // 토큰을 localStorage에 저장 (API 요청 시 사용)
      if (data.token) {
        localStorage.setItem('student_token', data.token);
      }
      
      // 출석 체크 메시지 표시
      if (data.attendanceMarked) {
        setAttendanceMarked(true);
      }
      
      setStep("camera");
      // 카메라 시작
      setTimeout(() => startCamera(), 100);
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // 후면 카메라 우선
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("카메라 접근 오류:", err);
      setError("카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.");
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImagePreview(imageUrl);
        stopCamera();
        setStep("preview");
      }
    }
  };

  // 다시 촬영
  const retakePhoto = () => {
    setImagePreview("");
    setStep("camera");
    setTimeout(() => startCamera(), 100);
  };

  // 숙제 제출
  const handleSubmit = async () => {
    if (!imagePreview) {
      setError("숙제 사진을 촬영해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // localStorage에서 토큰 가져오기
      const token = localStorage.getItem('student_token');
      
      if (!token) {
        setError("세션이 만료되었습니다. 다시 로그인해주세요.");
        setLoading(false);
        handleLogout();
        return;
      }

      const response = await fetch("/api/homework/submit-with-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: imagePreview }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "제출에 실패했습니다.");
        setLoading(false);
        return;
      }

      setResult(data.submission);
      setStep("result");
      setLoading(false);

      // 5초 후 로그아웃
      setTimeout(() => {
        handleLogout();
      }, 5000);
    } catch (err) {
      setError("제출 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    // 카메라 중지
    stopCamera();
    
    // localStorage에서 토큰 제거
    localStorage.removeItem('student_token');
    
    setStep("login");
    setStudentCode("");
    setImagePreview("");
    setResult(null);
    setUser(null);
    setAttendanceMarked(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            📚 숙제 검사 시스템
          </h1>
          <p className="text-sm text-gray-600">
            {step === "login" && "학생 코드를 입력하세요"}
            {step === "camera" && "숙제 사진을 촬영하세요"}
            {step === "preview" && "사진을 확인하고 제출하세요"}
            {step === "result" && "제출 완료!"}
          </p>
        </div>

        {attendanceMarked && step === "camera" && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
            ✅ 출석이 자동으로 체크되었습니다!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학생 코드 (5자리)
              </label>
              <Input
                type="text"
                maxLength={5}
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.replace(/\D/g, ""))}
                placeholder="12345"
                className="text-center text-2xl tracking-widest font-mono"
                disabled={loading}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || studentCode.length !== 5}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        )}

        {step === "camera" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                안녕하세요, <span className="font-bold text-blue-600">{user?.name}</span>님!
              </p>
            </div>

            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={loading}
              >
                <Camera className="w-5 h-5 mr-2" />
                사진 촬영
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="lg"
                className="px-4"
                disabled={loading}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                사진을 확인하고 제출하세요
              </p>
            </div>

            <div className="rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="숙제 미리보기"
                className="w-full h-auto"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    제출하기
                  </>
                )}
              </Button>
              <Button
                onClick={retakePhoto}
                variant="outline"
                size="lg"
                disabled={loading}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                다시 촬영
              </Button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                제출 완료!
              </h2>
              <p className="text-sm text-gray-600">
                AI가 숙제를 분석했습니다
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">완성도</span>
                <span className="text-lg font-bold text-blue-600">
                  {result.completeness}점
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">정확도</span>
                <span className="text-lg font-bold text-blue-600">
                  {result.accuracy}점
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">노력도</span>
                <span className="text-lg font-bold text-blue-600">
                  {result.effort}점
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                <span className="text-sm font-bold text-gray-900">종합 점수</span>
                <span className="text-2xl font-bold text-blue-600">
                  {result.overallScore}점
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">AI 분석</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.analysis}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">피드백</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.feedback}
              </p>
            </div>

            {result.attendanceMarked && (
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <CheckCircle className="w-5 h-5 inline-block mr-2 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  출석이 인정되었습니다!
                </span>
              </div>
            )}

            <p className="text-xs text-center text-gray-500">
              5초 후 자동으로 로그아웃됩니다...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
