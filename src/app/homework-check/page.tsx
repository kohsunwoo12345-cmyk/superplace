"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, Send, X, Plus, Image as ImageIcon, Award, TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";

interface HomeworkHistory {
  id: string;
  score: number;
  feedback: string;
  strengths: string;
  suggestions: string;
  subject: string;
  completion: string;
  effort: string;
  pageCount: number;
  submittedAt: string;
  gradedAt: string;
}

function HomeworkCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attendanceIdFromUrl = searchParams.get("attendanceId");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [homeworkHistory, setHomeworkHistory] = useState<HomeworkHistory[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // 숙제 기록 불러오기
      fetchHomeworkHistory(user.id);
    } else {
      setError("사용자 정보가 없습니다. 로그인해주세요.");
      setTimeout(() => router.push("/login"), 2000);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchHomeworkHistory = async (userId: number) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/homework/history?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setHomeworkHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch homework history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

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
    if (capturedImages.length === 0 || !currentUser) {
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
          userId: currentUser.id,
          attendanceRecordId: attendanceIdFromUrl ? parseInt(attendanceIdFromUrl) : null,
          images: capturedImages,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        
        // 숙제 기록 다시 불러오기
        fetchHomeworkHistory(currentUser.id);
        
        // 제출 완료 후 카메라 리셋
        setCapturedImages([]);
        
        // 3초 후 결과 초기화
        setTimeout(() => {
          setResult(null);
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🎉";
    if (score >= 70) return "👍";
    if (score >= 50) return "💪";
    return "📚";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}월 ${day}일 ${hours}:${String(minutes).padStart(2, '0')}`;
  };

  if (!currentUser) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 숙제 제출 섹션 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Camera className="w-6 h-6" />
              숙제 제출하기
            </CardTitle>
            <p className="text-purple-100 text-sm mt-2">
              숙제를 여러 장 찍어서 제출하면 AI가 자동으로 채점합니다
            </p>
          </CardHeader>
          <CardContent className="p-6">
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
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                      disabled={loading || capturedImages.length === 0}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          AI 채점 중...
                        </>
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
                      className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      카메라 시작
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">제출 완료!</h3>
                  <p className="text-gray-600">AI가 {capturedImages.length}장의 숙제를 채점했습니다</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✅ 선생님과 학원장님께 알림이 전송되었습니다
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 나의 숙제 기록 섹션 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Award className="w-6 h-6" />
              나의 숙제 기록
            </CardTitle>
            <p className="text-blue-100 text-sm mt-2">
              AI가 채점한 나의 숙제 점수와 피드백을 확인하세요
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            ) : homeworkHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600">아직 제출한 숙제가 없습니다</p>
                <p className="text-sm text-gray-500 mt-2">위에서 숙제를 제출해보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkHistory.map((hw, index) => (
                  <Card key={hw.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl font-bold px-4 py-2 rounded-lg border-2 ${getScoreColor(hw.score)}`}>
                            {getScoreEmoji(hw.score)} {hw.score}점
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                {hw.subject || "일반"}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(hw.submittedAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                완성도: {hw.completion || "중"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                노력도: {hw.effort || "중"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                {hw.pageCount}장
                              </span>
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                            최근
                          </span>
                        )}
                      </div>

                      {/* AI 피드백 */}
                      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">💬 AI 피드백</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{hw.feedback}</p>
                        </div>

                        {hw.strengths && (
                          <div>
                            <p className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              잘한 점
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{hw.strengths}</p>
                          </div>
                        )}

                        {hw.suggestions && (
                          <div>
                            <p className="text-sm font-semibold text-orange-700 mb-1 flex items-center gap-1">
                              <TrendingDown className="w-4 h-4" />
                              개선할 점
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{hw.suggestions}</p>
                          </div>
                        )}
                      </div>

                      {/* 이전 제출과 비교 */}
                      {index > 0 && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">
                            {hw.score > homeworkHistory[index - 1].score ? (
                              <>
                                🎉 이전보다 <strong>{hw.score - homeworkHistory[index - 1].score}점</strong> 향상되었어요!
                              </>
                            ) : hw.score < homeworkHistory[index - 1].score ? (
                              <>
                                💪 이번엔 <strong>{homeworkHistory[index - 1].score - hw.score}점</strong> 낮아졌어요. 다음엔 더 잘할 수 있어요!
                              </>
                            ) : (
                              <>
                                👍 이전과 <strong>동일한 점수</strong>예요!
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
