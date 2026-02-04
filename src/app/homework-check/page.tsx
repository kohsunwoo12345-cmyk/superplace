"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, RotateCcw, Send } from "lucide-react";

function HomeworkCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const attendanceId = searchParams.get("attendanceId");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setError("사용자 정보가 없습니다");
      return;
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [userId]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
      setError("카메라를 시작할 수 없습니다");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        
        // 카메라 중지
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
    setError("");
    startCamera();
  };

  const submitHomework = async () => {
    if (!capturedImage || !userId) {
      setError("이미지 또는 사용자 정보가 없습니다");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          attendanceRecordId: attendanceId,
          imageData: capturedImage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        
        // 5초 후 완료 페이지로 이동
        setTimeout(() => {
          router.push("/homework-check/complete");
        }, 5000);
      } else {
        setError(data.error || "제출 실패");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("제출 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg text-red-600">사용자 정보가 없습니다</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            숙제 검사
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="space-y-4">
              {!capturedImage ? (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📸 숙제를 카메라에 잘 보이도록 놓고 사진을 찍어주세요
                    </p>
                  </div>

                  <Button
                    onClick={capturePhoto}
                    className="w-full"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    사진 찍기
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={capturedImage}
                      alt="Captured homework"
                      className="w-full h-auto"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={retake}
                      variant="outline"
                      size="lg"
                      disabled={loading}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      다시 찍기
                    </Button>
                    <Button
                      onClick={submitHomework}
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        "AI 채점 중..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          제출하기
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-2">제출 완료!</h3>
                <p className="text-gray-600">AI가 숙제를 채점했습니다</p>
              </div>

              {result.grading && (
                <div className="space-y-3 text-left">
                  {result.grading.score !== null && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">점수</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {result.grading.score}점
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">AI 피드백</p>
                    <p className="text-sm text-gray-600">{result.grading.feedback}</p>
                  </div>

                  {result.grading.strengths?.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-700 mb-2">👍 잘한 점</p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {result.grading.strengths.map((s: string, i: number) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.grading.suggestions?.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-700 mb-2">💡 개선 제안</p>
                      <ul className="text-sm text-yellow-600 space-y-1">
                        {result.grading.suggestions.map((s: string, i: number) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-purple-600 animate-pulse">
                선생님께 결과가 전송되었습니다...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomeworkCheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <HomeworkCheckContent />
    </Suspense>
  );
}
