"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, RotateCcw, Send, X, Plus, Image as ImageIcon } from "lucide-react";

function HomeworkCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const attendanceId = searchParams.get("attendanceId");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setError("사용자 정보가 없습니다");
      return;
    }

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
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("카메라를 시작할 수 없습니다");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
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
        setCapturedImages(prev => [...prev, imageData]);
        
        // 카메라 중지
        stopCamera();
      }
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addMorePhotos = () => {
    startCamera();
  };

  const submitHomework = async () => {
    if (capturedImages.length === 0 || !userId) {
      setError("최소 1장 이상의 사진을 찍어주세요");
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
          images: capturedImages, // 다중 이미지 전송
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        
        // 5초 후 피드백 페이지로 이동
        setTimeout(() => {
          router.push(`/homework-check/feedback?submissionId=${data.submissionId}&userId=${userId}`);
        }, 3000);
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
        <CardHeader className="p-4 sm:p-6 text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            숙제 검사
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            숙제를 여러 장 찍어서 제출할 수 있습니다
          </p>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="space-y-4">
              {/* 카메라 화면 */}
              {showCamera && (
                <div className="space-y-3">
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

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="lg"
                    >
                      <X className="w-5 h-5 mr-2" />
                      취소
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      사진 찍기
                    </Button>
                  </div>
                </div>
              )}

              {/* 찍은 사진들 표시 */}
              {!showCamera && capturedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">찍은 사진 ({capturedImages.length}장)</h3>
                    <Button
                      onClick={addMorePhotos}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      사진 추가
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Homework ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                          {index + 1}번
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={submitHomework}
                    className="w-full"
                    size="lg"
                    disabled={loading || capturedImages.length === 0}
                  >
                    {loading ? (
                      "AI 채점 중..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {capturedImages.length}장 제출하기
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* 처음 시작 화면 */}
              {!showCamera && capturedImages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">숙제 사진을 찍어주세요</h3>
                    <p className="text-sm text-gray-600">
                      숙제가 여러 페이지라면 각각 찍어서 제출하세요
                    </p>
                  </div>
                  <Button
                    onClick={startCamera}
                    size="lg"
                    className="px-8"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    카메라 시작
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-2">제출 완료!</h3>
                <p className="text-gray-600">AI가 {capturedImages.length}장의 숙제를 채점 중입니다</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✅ 선생님과 학원장님께 알림이 전송되었습니다
                </p>
              </div>

              <p className="text-sm text-purple-600 animate-pulse">
                잠시 후 결과 페이지로 이동합니다...
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
