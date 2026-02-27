"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Academy {
  id: string;
  name: string;
  code: string;
  directorName?: string;
}

interface AIBot {
  id: string;
  name: string;
  description?: string;
  profileIcon?: string;
  isActive: boolean;
}

export default function AssignAcademyBotPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 데이터
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [bots, setBots] = useState<AIBot[]>([]);
  
  // 폼 상태
  const [selectedAcademy, setSelectedAcademy] = useState("");
  const [selectedBot, setSelectedBot] = useState("");
  const [studentLimit, setStudentLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceType, setPriceType] = useState("free");
  const [pricePerStudent, setPricePerStudent] = useState("");
  const [memo, setMemo] = useState("");
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // 권한 체크
    const role = userData.role?.toUpperCase();
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      alert('학원에 봇을 할당할 권한이 없습니다.');
      router.push('/dashboard/admin/bot-management');
      return;
    }

    // 오늘 날짜를 시작일로 설정
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    
    // 1개월 후를 종료일로 설정
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    setEndDate(oneMonthLater.toISOString().split('T')[0]);

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAcademies(),
        fetchBots(),
      ]);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/academies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error("학원 목록 로드 실패:", error);
    }
  };

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/ai-bots", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error("AI 봇 목록 로드 실패:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!selectedAcademy) {
      setError("학원을 선택해주세요.");
      return;
    }

    if (!selectedBot) {
      setError("AI 봇을 선택해주세요.");
      return;
    }

    if (!studentLimit || parseInt(studentLimit) <= 0) {
      setError("학생 수 제한은 1명 이상이어야 합니다.");
      return;
    }

    if (!startDate || !endDate) {
      setError("시작일과 종료일을 입력해주세요.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("종료일은 시작일보다 뒤여야 합니다.");
      return;
    }

    if (priceType === "paid" && (!pricePerStudent || parseFloat(pricePerStudent) <= 0)) {
      setError("학생당 가격을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/academy-bot-subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academyId: selectedAcademy,
          productId: selectedBot,
          studentCount: parseInt(studentLimit),
          subscriptionStart: startDate,
          subscriptionEnd: endDate,
          pricePerStudent: priceType === "free" ? 0 : parseFloat(pricePerStudent),
          memo: memo.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ 학원에 봇 구독이 할당되었습니다!\n\n학생 수 제한: ${studentLimit}명\n기간: ${startDate} ~ ${endDate}`);
        router.push("/dashboard/admin/bot-management");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "할당에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("봇 할당 실패:", error);
      setError(error.message || "봇 할당 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBotData = bots.find(b => b.id === selectedBot);
  const selectedAcademyData = academies.find(a => a.id === selectedAcademy);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/bot-management")}
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                목록으로
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  학원에 AI 봇 할당
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  학원을 선택하고 AI 봇 구독을 할당하세요
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">오류</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 할당 폼 */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>할당 정보 입력</CardTitle>
              <CardDescription>
                학원에 할당할 AI 봇과 구독 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 학원 선택 */}
              <div className="space-y-2">
                <Label htmlFor="academy" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  학원 선택 <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedAcademy} onValueChange={setSelectedAcademy}>
                  <SelectTrigger id="academy">
                    <SelectValue placeholder="학원을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {academies.length === 0 ? (
                      <SelectItem value="none" disabled>
                        학원이 없습니다
                      </SelectItem>
                    ) : (
                      academies.map((academy) => (
                        <SelectItem key={academy.id} value={academy.id}>
                          {academy.name} ({academy.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* AI 봇 선택 */}
              <div className="space-y-2">
                <Label htmlFor="bot" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  AI 봇 선택 <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedBot} onValueChange={setSelectedBot}>
                  <SelectTrigger id="bot">
                    <SelectValue placeholder="AI 봇을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {bots.filter(bot => bot.isActive).length === 0 ? (
                      <SelectItem value="none" disabled>
                        활성화된 봇이 없습니다
                      </SelectItem>
                    ) : (
                      bots
                        .filter(bot => bot.isActive)
                        .map((bot) => (
                          <SelectItem key={bot.id} value={bot.id}>
                            {bot.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {selectedBotData && selectedBotData.description && (
                  <p className="text-sm text-gray-500">
                    {selectedBotData.description}
                  </p>
                )}
              </div>

              {/* 학생 수 제한 */}
              <div className="space-y-2">
                <Label htmlFor="studentLimit" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  학생 수 제한 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="studentLimit"
                  type="number"
                  min="1"
                  value={studentLimit}
                  onChange={(e) => setStudentLimit(e.target.value)}
                  placeholder="예: 30"
                />
                <p className="text-xs text-gray-500">
                  이 학원에서 봇을 할당할 수 있는 최대 학생 수입니다.
                </p>
              </div>

              {/* 기간 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    시작일 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    종료일 (만료일) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 가격 설정 */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  가격 설정
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      value="free"
                      checked={priceType === "free"}
                      onChange={(e) => setPriceType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">무료</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      value="paid"
                      checked={priceType === "paid"}
                      onChange={(e) => setPriceType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">유료</span>
                  </label>
                </div>

                {priceType === "paid" && (
                  <div className="space-y-2">
                    <Label htmlFor="pricePerStudent">
                      학생 한 명당 가격 (원) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pricePerStudent"
                      type="number"
                      min="0"
                      step="100"
                      value={pricePerStudent}
                      onChange={(e) => setPricePerStudent(e.target.value)}
                      placeholder="예: 10000"
                    />
                  </div>
                )}
              </div>

              {/* 메모 */}
              <div className="space-y-2">
                <Label htmlFor="memo" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  메모 (선택사항)
                </Label>
                <Textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="할당에 대한 메모를 입력하세요..."
                  rows={4}
                />
              </div>

              {/* 요약 정보 */}
              {selectedAcademy && selectedBot && studentLimit && startDate && endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">할당 요약</p>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1">
                        <li>• 학원: {selectedAcademyData?.name}</li>
                        <li>• AI 봇: {selectedBotData?.name}</li>
                        <li>• 학생 수 제한: <strong>{studentLimit}명</strong></li>
                        <li>• 기간: {startDate} ~ {endDate}</li>
                        <li>
                          • 가격: {priceType === "free" 
                            ? "무료" 
                            : `학생당 ${parseInt(pricePerStudent).toLocaleString()}원`}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/admin/bot-management")}
                  disabled={submitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      할당 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      할당하기
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
