"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Shield, User, Camera, Upload, X, AlertCircle, Plus, Trash2 } from "lucide-react";

export default function AttendanceVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [grading, setGrading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      console.log("📊 Response status:", response.status);
      console.log("📊 Already checked in:", data.alreadyCheckedIn);
      console.log("📊 data.success:", data.success);

      // success가 true이면 무조건 통과
      if (data.success === true) {
        console.log("✅ success === true, 학생 정보 설정 및 페이지 전환");
        console.log("📊 받은 데이터:", data);
        
        // 학생 정보 설정
        setStudentInfo({
          ...data.student,
          userId: data.student?.id,
          userName: data.student?.name,
          userEmail: data.student?.email,
          attendanceCode: trimmedCode,
          verifiedAt: new Date().toLocaleString('ko-KR'),
          status: data.attendance?.status,
          statusText: data.attendance?.status === 'LATE' ? '지각' : '출석',
          alreadyCheckedIn: data.alreadyCheckedIn || false
        });
        
        console.log("✅ 저장된 학생 정보:", {
          userId: data.student?.id,
          userName: data.student?.name,
          attendanceCode: trimmedCode
        });
        
        // 숙제 제출 페이지로 이동
        setVerified(true);
        console.log("✅ setVerified(true) 완료");
        
        // 이미 출석한 경우 로그
        if (data.alreadyCheckedIn) {
          console.log("ℹ️ 이미 출석 완료 (", data.attendance?.status, "), 숙제 제출로 진행");
        }
      } else {
        // success가 false인 경우에만 오류 표시
        console.error("❌ success === false, 오류 처리");
        const errorMsg = data.message || data.error || "출석 인증에 실패했습니다.";
        const debugInfo = data.debug ? `\n\n디버그 정보:\n${JSON.stringify(data.debug, null, 2)}` : '';
        alert(errorMsg + debugInfo);
        console.error("❌ 인증 실패:", data);
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
      console.log("📸 카메라 시작...");
      
      // 카메라 지원 확인
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("이 브라우저는 카메라를 지원하지 않습니다.");
        return;
      }

      // 먼저 화면 표시
      setShowCamera(true);
      setVideoReady(false);
      
      // 스트림 획득 (간단한 설정)
      let mediaStream;
      try {
        // 먼저 후면 카메라 시도
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (envError) {
        console.log("후면 카메라 없음, 기본 카메라 사용");
        // 후면 카메라 없으면 기본 카메라
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      console.log("✅ 스트림 획득:", { id: mediaStream.id, active: mediaStream.active });
      setStream(mediaStream);
      
      // React 렌더링 대기
      await new Promise(r => setTimeout(r, 100));
      
      const video = videoRef.current;
      if (!video) {
        throw new Error("비디오 요소를 찾을 수 없습니다");
      }

      // 스트림 연결
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      console.log("🔗 비디오 연결 완료");
      
      // 여러 이벤트 리스너로 즉시 활성화 보장
      const activateNow = () => {
        console.log("✅ 카메라 활성화!", {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
        setVideoReady(true);
      };
      
      // loadedmetadata 이벤트
      video.addEventListener('loadedmetadata', activateNow, { once: true });
      
      // loadeddata 이벤트
      video.addEventListener('loadeddata', activateNow, { once: true });
      
      // canplay 이벤트
      video.addEventListener('canplay', activateNow, { once: true });
      
      // 재생 시도
      try {
        await video.play();
        console.log("▶️ 비디오 재생 시작");
        // 재생 성공하면 즉시 활성화
        activateNow();
      } catch (playError) {
        console.warn("자동 재생 실패:", playError);
      }
      
      // 200ms 후 무조건 강제 활성화 (안전장치)
      setTimeout(() => {
        console.log("⚡ 타임아웃 강제 활성화");
        setVideoReady(true);
      }, 200);
      
    } catch (err: any) {
      console.error("❌ 카메라 오류:", err.name, err.message);
      
      let msg = "카메라를 시작할 수 없습니다.";
      if (err.name === 'NotAllowedError') {
        msg = "카메라 권한을 허용해주세요.";
      } else if (err.name === 'NotFoundError') {
        msg = "카메라를 찾을 수 없습니다.";
      } else if (err.name === 'OverconstrainedError') {
        // 간단한 설정으로 재시도
        try {
          console.log("⚡ 기본 설정으로 재시도...");
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(simpleStream);
          
          await new Promise(r => setTimeout(r, 50));
          
          const video = videoRef.current;
          if (video) {
            video.srcObject = simpleStream;
            await video.play().catch(() => {});
            setTimeout(() => setVideoReady(true), 500);
            return;
          }
        } catch (e) {
          console.error("재시도 실패:", e);
        }
      }
      
      alert(`${msg}\n\n파일 업로드를 이용해주세요.`);
      setShowCamera(false);
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
        // ✅ 해상도 제한 추가 (최대 1280px)
        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // ✅ 압축 강도 0.7 (파일 크기 감소)
        let imageData = canvas.toDataURL('image/jpeg', 0.7);
        console.log("📸 사진 촬영 완료, 크기:", (imageData.length / 1024 / 1024).toFixed(2), "MB, 해상도:", canvas.width, "x", canvas.height);
        
        // ✅ 2MB 초과 시 추가 압축
        let quality = 0.7;
        let attempts = 0;
        while (imageData.length > 2 * 1024 * 1024 && attempts < 3) {
          attempts++;
          quality = Math.max(0.3, quality - 0.15);
          imageData = canvas.toDataURL('image/jpeg', quality);
          console.log(`🔄 추가 압축 ${attempts}: ${(imageData.length / 1024 / 1024).toFixed(2)}MB (품질: ${(quality * 100).toFixed(0)}%)`);
        }
        
        if (imageData.length > 2 * 1024 * 1024) {
          alert(`이미지 크기가 너무 큽니다 (${(imageData.length / 1024 / 1024).toFixed(2)}MB). 더 간단한 배경에서 촬영해주세요.`);
          return;
        }
        
        // 다중 이미지 배열에 추가
        setCapturedImages([...capturedImages, imageData]);
        alert(`${capturedImages.length + 1}번째 사진이 촬영되었습니다.`);
        // 카메라는 계속 켜두어 다음 촬영 가능하도록 함
      } else {
        alert("사진 촬영에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      fileArray.forEach(file => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          
          // ✅ 파일 업로드 시에도 압축 적용
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 1280;
            const scale = Math.min(1, maxWidth / img.width);
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              let imageData = canvas.toDataURL('image/jpeg', 0.7);
              console.log("📁 파일 업로드 완료, 크기:", (imageData.length / 1024 / 1024).toFixed(2), "MB");
              
              // 2MB 초과 시 추가 압축
              let quality = 0.7;
              let attempts = 0;
              while (imageData.length > 2 * 1024 * 1024 && attempts < 3) {
                attempts++;
                quality = Math.max(0.3, quality - 0.15);
                imageData = canvas.toDataURL('image/jpeg', quality);
                console.log(`🔄 파일 압축 ${attempts}: ${(imageData.length / 1024 / 1024).toFixed(2)}MB`);
              }
              
              if (imageData.length > 2 * 1024 * 1024) {
                alert(`파일 크기가 너무 큽니다 (${(imageData.length / 1024 / 1024).toFixed(2)}MB). 더 작은 이미지를 선택해주세요.`);
                return;
              }
              
              setCapturedImages(prev => [...prev, imageData]);
            }
          };
          img.src = result;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitHomework = async () => {
    if (capturedImages.length === 0 || !studentInfo) {
      alert("숙제 사진을 촬영해주세요.");
      return;
    }

    setGrading(true);
    try {
      console.log("📤 숙제 제출 시작... 총", capturedImages.length, "장");
      console.log("📊 전송할 학생 정보:", {
        userId: studentInfo?.userId,
        attendanceCode: studentInfo?.attendanceCode || code,
        imagesCount: capturedImages.length
      });
      
      // userId 검증
      if (!studentInfo?.userId) {
        console.error("❌ userId가 없습니다!", studentInfo);
        alert("학생 정보를 찾을 수 없습니다. 다시 출석 인증을 해주세요.");
        setGrading(false);
        return;
      }
      
      console.log("🌐 API 호출 시작: /api/homework/submit");
      const response = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentInfo.userId,
          code: studentInfo.attendanceCode || code,
          images: capturedImages, // 다중 이미지 전달
        }),
      });

      console.log("📡 API 응답 상태:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("✅ 제출 응답:", data);

      if (response.ok && data.success) {
        console.log("✅ 제출 성공!");
        const submissionId = data.submission?.id;
        
        // 제출 완료 상태로 업데이트
        setStudentInfo({
          ...studentInfo,
          homework: {
            submitted: true,
            score: 0, // 채점 대기 중
            feedback: "AI 채점이 진행 중입니다. 잠시 후 결과 페이지에서 확인하세요.",
            strengths: "",
            suggestions: "",
            graded: false, // 아직 채점 안됨
            submissionId: submissionId,
            imageCount: capturedImages.length
          }
        });

        // 자동 채점 시작 (백그라운드)
        if (submissionId) {
          console.log('🤖 자동 채점 시작:', submissionId);
          fetch('/api/homework/process-grading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId })
          }).then(gradingResponse => {
            if (gradingResponse.ok) {
              return gradingResponse.json();
            }
            throw new Error('채점 API 오류');
          }).then(gradingData => {
            console.log('✅ 자동 채점 완료:', gradingData);
          }).catch(err => {
            console.error('❌ 자동 채점 실패:', err);
          });
        }

        alert("제출이 완료되었습니다!\n\nAI 채점이 자동으로 시작되었습니다.\n결과는 10초 후 '숙제 결과' 페이지에서 확인하세요.");

        // 3초 후 페이지 새로고침
        setTimeout(() => {
          window.location.href = '/attendance-verify';
        }, 3000);
      } else {
        console.error("❌ 제출 실패:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        alert(`제출에 실패했습니다.\n\n오류: ${data.error || data.message || '알 수 없는 오류'}\n상태: ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ 숙제 제출 오류:", {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`오류가 발생했습니다.\n\n상세: ${error.message || '네트워크 오류'}\n\n다시 시도해주세요.`);
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
            
            {/* 출석 상태 표시 */}
            <div className={`mt-3 p-2 rounded-lg ${
              studentInfo.alreadyCheckedIn 
                ? 'bg-blue-100 border border-blue-300' 
                : 'bg-green-100 border border-green-300'
            }`}>
              <p className={`text-sm font-medium ${
                studentInfo.alreadyCheckedIn ? 'text-blue-800' : 'text-green-800'
              }`}>
                {studentInfo.alreadyCheckedIn 
                  ? `✅ 오늘 이미 출석 완료 (${studentInfo.statusText})` 
                  : `✅ 출석 완료 (${studentInfo.statusText})`
                }
              </p>
            </div>
            
            {capturedImages.length > 0 && (
              <p className="text-sm font-semibold text-blue-600 mt-2">
                총 {capturedImages.length}장 촬영됨
              </p>
            )}
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
                    {videoReady ? `${capturedImages.length + 1}번째 촬영` : "준비 중..."}
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

            {/* 촬영된 이미지들 미리보기 */}
            {capturedImages.length > 0 && !showCamera && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">촬영한 사진 ({capturedImages.length}장)</h3>
                <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {capturedImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`숙제 ${index + 1}`} className="w-full rounded-lg border-2 border-gray-300" />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {index + 1}
                      </div>
                      <Button
                        onClick={() => removeImage(index)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼들 */}
            {!showCamera && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={startCamera} 
                  className="h-32 flex flex-col"
                  size="lg"
                >
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-lg">
                    {capturedImages.length > 0 ? "다음 장 촬영" : "카메라 촬영"}
                  </span>
                  {capturedImages.length > 0 && (
                    <span className="text-xs mt-1">({capturedImages.length + 1}번째)</span>
                  )}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-32 flex flex-col"
                  size="lg"
                >
                  <Upload className="w-10 h-10 mb-2" />
                  <span className="text-lg">파일 업로드</span>
                  <span className="text-xs mt-1">(여러 장 가능)</span>
                </Button>
              </div>
            )}

            {/* 제출 버튼 */}
            {capturedImages.length > 0 && (
              <Button
                onClick={submitHomework}
                disabled={grading}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {grading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    AI 채점 중... ({capturedImages.length}장)
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    숙제 제출 및 채점받기 ({capturedImages.length}장)
                  </>
                )}
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
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
