"use client";
// Version: 2026-02-11-v4-ALERT - Force alert for debugging

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, Send, X, Plus, Image as ImageIcon, Award, TrendingUp, TrendingDown, Calendar, ArrowLeft, Eye, ChevronRight } from "lucide-react";

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
  const [selectedHistory, setSelectedHistory] = useState<HomeworkHistory | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
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
        video: { facingMode: 'environment', width: 640, height: 480 }
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
        // Version check - DO NOT REMOVE
        const BUILD_VERSION = '2026-02-11-v3-auto-grading-fix';
        console.log(`🔧 빌드 버전: ${BUILD_VERSION}`);
        
        // 강력한 해상도 제한 (너비 640px) - 더 작게!
        const maxWidth = 640;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 초강력 압축: 0.5 (50%) → 반복 압축
        let imageData = canvas.toDataURL('image/jpeg', 0.5);
        let attempts = 0;
        
        // 1MB 이하가 될 때까지 반복 압축
        while (imageData.length > 1024 * 1024 && attempts < 5) {
          attempts++;
          const quality = Math.max(0.3, 0.5 - (attempts * 0.1));
          imageData = canvas.toDataURL('image/jpeg', quality);
          console.log(`🔄 압축 시도 ${attempts}: ${(imageData.length / 1024 / 1024).toFixed(2)}MB (품질: ${quality * 100}%)`);
        }
        
        console.log(`✅ 최종 이미지: ${(imageData.length / 1024 / 1024).toFixed(2)}MB`);
        
        // 여전히 1MB 초과 시 오류
        if (imageData.length > 1024 * 1024) {
          setError(`이미지가 너무 큽니다 (${(imageData.length / 1024 / 1024).toFixed(2)}MB). 더 간단한 배경에서 다시 촬영해주세요.`);
          return;
        }
        
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
    
    // 강제 알림으로 사용자에게 진행 상황 표시
    alert('🚀 제출 시작! 채점까지 약 10초 소요됩니다.');
    console.log('🚀 [DEBUG] 제출 시작 - 빌드 버전: 2026-02-11-v4-ALERT');

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
      console.log('📦 [DEBUG] 제출 응답:', data);

      if (response.ok && data.success) {
        setResult(data);
        setCapturedImages([]);
        
        // 🚀 채점 API 명시적 호출 (await 사용)
        console.log('🚀 [SUBMIT] 채점 API 호출 시작:', data.submission.id);
        console.log('📍 [SUBMIT] API URL: /api/homework/process-grading');
        
        try {
          const gradingResponse = await fetch("/api/homework/process-grading", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              submissionId: data.submission.id
            })
          });
          
          console.log('📊 [SUBMIT] 채점 응답 상태:', gradingResponse.status);
          
          const gradingData = await gradingResponse.json();
          console.log('✅ [SUBMIT] 채점 완료:', gradingData);
          
          if (!gradingResponse.ok) {
            console.error('❌ [SUBMIT] 채점 API 오류:', gradingData);
            alert('❌ 채점 실패: ' + JSON.stringify(gradingData));
            throw new Error('채점 API 오류');
          }
          
          // 채점 완료 알림
          alert('✅ 채점 완료! 점수: ' + (gradingData.grading?.score || '확인 중'));
          
          // 채점 완료 후 히스토리 다시 불러오기
          console.log('🔄 [SUBMIT] 히스토리 새로고침 시작...');
          await fetchHomeworkHistory(currentUser.id);
          console.log('✅ [SUBMIT] 히스토리 새로고침 완료');
          
          // 성공 메시지 3초 후 제거
          setTimeout(() => {
            setResult(null);
          }, 3000);
        } catch (err: any) {
          console.error('❌ [SUBMIT] 채점 오류:', err);
          console.error('❌ [SUBMIT] 오류 상세:', err.message, err.stack);
          alert('❌ 채점 중 오류: ' + err.message);
          setError("채점 중 오류가 발생했습니다: " + err.message);
        }
      } else {
        setError(data.error || "제출 실패");
      }
    } catch (err: any) {
      console.error("❌ [SUBMIT] 제출 오류:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            대시보드
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">📝 숙제 제출</h1>
            <p className="text-sm text-gray-500">{currentUser.name}님의 숙제</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 간단한 제출 버튼 */}
        {!showCamera && capturedImages.length === 0 && (
          <Card className="border-2 border-dashed border-purple-300 hover:border-purple-500 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">새 숙제 제출하기</h3>
              <p className="text-sm text-gray-600 mb-4">
                카메라로 숙제를 찍어서 제출하세요
              </p>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                카메라 시작
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 카메라 화면 (축소) */}
        {showCamera && (
          <Card>
            <CardContent className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button onClick={stopCamera} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button onClick={capturePhoto} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Camera className="w-4 h-4 mr-2" />
                  찍기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 찍은 사진 (축소) */}
        {!showCamera && capturedImages.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">찍은 사진 ({capturedImages.length}장)</span>
                <Button onClick={addMorePhotos} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Homework ${index + 1}`}
                      className="w-full h-20 object-cover rounded border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                onClick={submitHomework}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    AI 채점 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {capturedImages.length}장 제출하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 제출 완료 알림 */}
        {result && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-green-700 mb-1">제출 완료!</h3>
              <p className="text-sm text-green-600">AI 채점이 완료되었습니다</p>
            </CardContent>
          </Card>
        )}

        {/* 나의 숙제 기록 */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            나의 숙제 기록
          </h2>

          {loadingHistory ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
              </CardContent>
            </Card>
          ) : homeworkHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">아직 제출한 숙제가 없습니다</p>
                <p className="text-sm text-gray-500">위에서 숙제를 제출해보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {homeworkHistory.map((hw, index) => (
                <Card key={hw.id} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold px-3 py-2 rounded-lg border-2 ${getScoreColor(hw.score)}`}>
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
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                          최근
                        </span>
                      )}
                    </div>

                    {/* 간단한 피드백 미리보기 */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{hw.feedback}</p>
                    </div>

                    {/* 이전 제출과 비교 */}
                    {index > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        {hw.score > homeworkHistory[index - 1].score ? (
                          <>
                            🎉 이전보다 <strong>{hw.score - homeworkHistory[index - 1].score}점</strong> 향상!
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
                      </div>
                    )}

                    {/* 상세보기 버튼 */}
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setSelectedHistory(hw)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      자세히 보기
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedHistory(null)}
        >
          <Card
            className="w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">📊 숙제 상세 분석</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHistory(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 점수 및 기본 정보 */}
              <div className="text-center">
                <div className={`inline-block text-5xl font-bold px-6 py-4 rounded-2xl border-4 ${getScoreColor(selectedHistory.score)} mb-4`}>
                  {getScoreEmoji(selectedHistory.score)} {selectedHistory.score}점
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">
                    {selectedHistory.subject || "일반"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedHistory.submittedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded">
                    완성도: {selectedHistory.completion || "중"}
                  </span>
                  <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded">
                    노력도: {selectedHistory.effort || "중"}
                  </span>
                  <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded">
                    {selectedHistory.pageCount}장
                  </span>
                </div>
              </div>

              {/* AI 전체 평가 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  💬 AI 전체 평가
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedHistory.feedback}</p>
              </div>

              {/* 잘한 점 */}
              {selectedHistory.strengths && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    👏 잘한 점
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedHistory.strengths}</p>
                </div>
              )}

              {/* 개선할 점 */}
              {selectedHistory.suggestions && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    📚 개선할 점 (부족한 점)
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedHistory.suggestions}</p>
                </div>
              )}

              {/* 학습 조언 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-700 mb-3">💡 학습 조언</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>오답을 다시 풀어보고 왜 틀렸는지 이해하세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>부족한 개념은 교과서를 다시 읽어보세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>선생님께 질문하여 확실히 이해하세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>비슷한 문제를 더 풀어보며 연습하세요</span>
                  </li>
                </ul>
              </div>

              {/* 닫기 버튼 */}
              <Button
                onClick={() => setSelectedHistory(null)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                size="lg"
              >
                확인
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
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
