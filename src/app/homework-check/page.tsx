"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function HomeworkCheckPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "upload" | "result">("login");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);

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
      
      setStep("upload");
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이미지 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 숙제 제출
  const handleSubmit = async () => {
    if (!imageFile) {
      setError("숙제 사진을 선택해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 이미지를 base64로 변환
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageUrl = reader.result as string;
        
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
          body: JSON.stringify({ imageUrl }),
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

        // 3초 후 로그아웃
        setTimeout(() => {
          handleLogout();
        }, 3000);
      };

      reader.readAsDataURL(imageFile);
    } catch (err) {
      setError("제출 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    // localStorage에서 토큰 제거
    localStorage.removeItem('student_token');
    
    setStep("login");
    setStudentCode("");
    setImageFile(null);
    setImagePreview("");
    setResult(null);
    setUser(null);
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
            {step === "upload" && "숙제 사진을 업로드하세요"}
            {step === "result" && "제출 완료!"}
          </p>
        </div>

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

        {step === "upload" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                안녕하세요, <span className="font-bold text-blue-600">{user?.name}</span>님!
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="숙제 미리보기"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                  >
                    다시 선택
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    숙제 사진을 선택하세요
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" type="button">
                    파일 선택
                  </Button>
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                className="flex-1"
                size="lg"
                disabled={!imageFile || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  "제출하기"
                )}
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
              3초 후 자동으로 로그아웃됩니다...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
