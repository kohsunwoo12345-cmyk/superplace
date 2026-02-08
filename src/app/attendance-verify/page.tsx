"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Shield, User, Camera, Upload, X, AlertCircle } from "lucide-react";

export default function AttendanceVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    
    if (!trimmedCode) {
      alert("출석 코드를 입력해주세요.");
      return;
    }

    if (trimmedCode.length !== 6) {
      alert("6자리 출석 코드를 입력해주세요.");
      return;
    }

    // 숫자만 포함되어 있는지 확인
    if (!/^\d{6}$/.test(trimmedCode)) {
      alert("출석 코드는 6자리 숫자여야 합니다.");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 출석 인증 요청:", { code: trimmedCode });
      
      const response = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();
      console.log("✅ 출석 인증 응답:", data);

      if (response.ok && data.success) {
        setStudentInfo(data);
        setVerified(true);
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

  const startCamera = async () => {
    try {
      // 카메라 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("이 브라우저는 카메라를 지원하지 않습니다.");
        return;
      }

      // 카메라 권한 요청 및 스트림 시작
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log("📸 카메라 시작 시도...");
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ 카메라 스트림 획득:", mediaStream);

      setStream(mediaStream);
      setVideoReady(false);
      
      // videoRef에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // 비디오 메타데이터 로드 대기
        videoRef.current.onloadedmetadata = async () => {
          console.log("✅ 비디오 메타데이터 로드 완료");
          if (videoRef.current) {
            await videoRef.current.play();
            console.log("✅ 비디오 재생 시작");
            // 비디오 준비 완료
            setTimeout(() => {
              setVideoReady(true);
              console.log("✅ 비디오 준비 완료");
            }, 500); // 500ms 대기 후 촬영 가능
          }
        };
      }
      
      setShowCamera(true);
    } catch (err: any) {
      console.error("❌ 카메라 오류:", err);
      alert(`카메라를 시작할 수 없습니다: ${err.message}\n\n파일 업로드를 이용해주세요.`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("🛑 카메라 트랙 중지:", track.label);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setVideoReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // 비디오 준비 상태 재확인
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("카메라가 아직 준비 중입니다. 잠시만 기다려주세요.");
        // 1초 후 자동으로 videoReady를 true로 설정
        setTimeout(() => {
          setVideoReady(true);
        }, 1000);
        return;
      }
      
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        console.log("📸 사진 촬영 완료, 크기:", imageData.length, "해상도:", canvas.width, "x", canvas.height);
        
        setCapturedImage(imageData);
        stopCamera();
      } else {
        alert("사진 촬영에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedImage(result);
        console.log("📁 파일 업로드 완료, 크기:", result.length);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHomework = async () => {
    if (!capturedImage || !studentInfo) {
      alert("숙제 사진을 촬영해주세요.");
      return;
    }

    setGrading(true);
    try {
      console.log("📤 숙제 제출 시작...");
      console.log("학생 정보:", studentInfo);
      
      const response = await fetch("/api/homework/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentInfo.userId,
          code: studentInfo.attendanceCode || code,
          image: capturedImage,
        }),
      });

      const data = await response.json();
      console.log("✅ 채점 응답:", data);

      if (response.ok && data.success) {
        // 채점 결과를 studentInfo에 추가
        setStudentInfo({
          ...studentInfo,
          homework: {
            submitted: true,
            score: data.grading?.score || 0,
            feedback: data.grading?.feedback || "채점 완료",
            strengths: data.grading?.strengths || "",
            suggestions: data.grading?.suggestions || "",
            graded: true,
            submissionId: data.submission?.id
          }
        });

        // 3초 후 페이지 새로고침
        setTimeout(() => {
          window.location.href = '/attendance-verify';
        }, 3000);
      } else {
        console.error("❌ 채점 실패:", data);
        alert(data.error || "채점에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 숙제 제출 오류:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setGrading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      handleVerify();
    }
  };

  // 출석 완료 + 숙제 채점 완료 화면
  if (verified && studentInfo && studentInfo.homework?.graded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">출석 & 숙제 완료!</h2>
            
            {/* 학생 정보 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">{studentInfo.userName || "학생"}</span>
              </div>
              <p className="text-sm text-gray-600">{studentInfo.userEmail || ""}</p>
              <p className="text-xs text-gray-500 mt-2">
                출석 시간: {studentInfo.verifiedAt || "-"}
              </p>
              <p className={`text-xs font-medium mt-1 ${
                studentInfo.status === 'LATE' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                상태: {studentInfo.statusText || (studentInfo.status === 'LATE' ? '지각' : '출석')}
              </p>
            </div>

            {/* 숙제 채점 결과 */}
            <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">숙제 채점 완료</span>
              </div>
              <p className="text-sm text-purple-700 mb-1">
                채점 점수: <span className="font-bold text-lg">
                  {studentInfo.homework?.score || 0}점
                </span>
              </p>
              {studentInfo.homework?.feedback && (
                <p className="text-xs text-gray-600 mt-2">
                  {studentInfo.homework.feedback}
                </p>
              )}
            </div>

            <p className="text-gray-600 mb-4">다음 학생 출석 대기 중...</p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <span>잠시 후 자동으로 돌아갑니다</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 출석 완료 - 숙제 제출 대기
  if (verified && studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">📚 숙제 제출</CardTitle>
            <CardDescription>
              {studentInfo.userName}님, 숙제 사진을 촬영하거나 업로드해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 카메라 화면 */}
            {showCamera && (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
                {/* 비디오 준비 중 오버레이 */}
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                      <p>카메라 준비 중...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-0 right-0 flex gap-2 px-4">
                  <Button 
                    onClick={capturePhoto} 
                    disabled={!videoReady}
                    className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {videoReady ? "촬영" : "준비 중..."}
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    className="bg-white/90"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* 촬영된 이미지 */}
            {capturedImage && !showCamera && (
              <div className="relative">
                <img src={capturedImage} alt="숙제" className="w-full rounded-lg" />
                <Button
                  onClick={() => setCapturedImage(null)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  다시 촬영
                </Button>
              </div>
            )}

            {/* 버튼들 */}
            {!showCamera && !capturedImage && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={startCamera} 
                  className="h-32 flex flex-col"
                  size="lg"
                >
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-lg">카메라 촬영</span>
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-32 flex flex-col"
                  size="lg"
                >
                  <Upload className="w-10 h-10 mb-2" />
                  <span className="text-lg">파일 업로드</span>
                </Button>
              </div>
            )}

            {/* 제출 버튼 */}
            {capturedImage && (
              <Button
                onClick={submitHomework}
                disabled={grading}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {grading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    AI 채점 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    숙제 제출 및 채점받기
                  </>
                )}
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 출석 코드 입력 화면
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
                  코드 입력 → 숙제 사진 촬영 → AI 자동 채점
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
