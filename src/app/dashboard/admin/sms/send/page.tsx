"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  FileText,
  Users,
  Loader2,
  Plus,
  X,
  Clock,
  Info,
  Phone,
  CheckCircle,
  History,
  Smartphone,
  MessageSquare,
  TrendingUp,
  Zap,
  Eye,
  AlertCircle,
  DollarSign,
  Calendar,
  Target,
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Template {
  id: number;
  title: string;
  content: string;
}

interface Sender {
  id: number;
  phone_number: string;
  verified: boolean;
}

export default function SMSSendPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [message, setMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [reserveTime, setReserveTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 학생 목록
      const studentsRes = await fetch("/api/admin/users?role=STUDENT", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.users || []);
      }

      // 템플릿 목록
      const templatesRes = await fetch("/api/admin/sms/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }

      // 발신번호 목록
      const sendersRes = await fetch("/api/admin/sms/senders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sendersRes.ok) {
        const data = await sendersRes.json();
        setSenders(data.senders || []);
        if (data.senders.length > 0) {
          setSelectedSender(data.senders[0].phone_number);
        }
      }

      // 포인트 잔액
      const balanceRes = await fetch("/api/admin/sms/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    const filtered = filteredStudents;
    if (selectedStudents.length === filtered.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map((s) => s.id));
    }
  };

  const applyTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const calculateCost = () => {
    const byteSize = new Blob([message]).size;
    const messageType = byteSize > 90 ? "LMS" : "SMS";
    const costPerMessage = messageType === "LMS" ? 50 : 20;
    return {
      type: messageType,
      total: costPerMessage * selectedStudents.length,
      perMessage: costPerMessage,
    };
  };

  const handleSend = async () => {
    if (selectedStudents.length === 0) {
      alert("수신자를 선택해주세요.");
      return;
    }

    if (!message.trim()) {
      alert("메시지를 입력해주세요.");
      return;
    }

    if (!selectedSender) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    const cost = calculateCost();
    if (balance < cost.total) {
      alert(`포인트가 부족합니다. (필요: ${cost.total}P, 보유: ${balance}P)`);
      return;
    }

    if (!confirm(`${selectedStudents.length}명에게 문자를 발송하시겠습니까?\n예상 비용: ${cost.total}P`)) {
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem("token");

      const receivers = selectedStudents
        .map((id) => students.find((s) => s.id === id))
        .filter((s) => s?.phone)
        .map((s) => ({
          phone: s!.phone!,
          name: s!.name,
        }));

      const response = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderPhone: selectedSender,
          receivers,
          message,
          reserveTime: reserveTime || null,
        }),
      });

      if (response.ok) {
        alert("문자 발송이 완료되었습니다!");
        router.push("/dashboard/admin/sms");
      } else {
        const error = await response.json();
        throw new Error(error.error || "발송 실패");
      }
    } catch (error: any) {
      console.error("SMS 발송 실패:", error);
      alert(error.message || "발송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.phone && student.phone.includes(searchQuery))
  );

  const cost = calculateCost();
  const byteSize = new Blob([message]).size;
  const validRecipients = selectedStudents.filter(id => {
    const student = students.find(s => s.id === id);
    return student?.phone;
  });
  const invalidRecipients = selectedStudents.length - validRecipients.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
          <div className="relative bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-6" />
            <div className="space-y-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                데이터 로딩 중
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10">
      {/* 상단 메뉴 바 - 프리미엄 글래스모피즘 */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-2xl mb-8 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/sms")}
              className="whitespace-nowrap hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-200 hover:scale-105 rounded-xl"
            >
              <Send className="w-4 h-4 mr-2" />
              대시보드
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/sms/registration")}
              className="whitespace-nowrap hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:scale-105 rounded-xl"
            >
              <Phone className="w-4 h-4 mr-2" />
              발신번호
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/sms/registration-approval")}
              className="whitespace-nowrap hover:bg-gradient-to-r hover:from-green-100 hover:to-teal-100 transition-all duration-200 hover:scale-105 rounded-xl"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              승인
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/message-send")}
              className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 rounded-xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              문자 발송
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/sms/templates")}
              className="whitespace-nowrap hover:bg-gradient-to-r hover:from-teal-100 hover:to-cyan-100 transition-all duration-200 hover:scale-105 rounded-xl"
            >
              <FileText className="w-4 h-4 mr-2" />
              템플릿
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/sms/history")}
              className="whitespace-nowrap hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 transition-all duration-200 hover:scale-105 rounded-xl"
            >
              <History className="w-4 h-4 mr-2" />
              발송이력
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pb-16 space-y-8">
        {/* 헤더 - 프리미엄 그라디언트 카드 */}
        <Card className="border-0 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white overflow-hidden relative transform hover:scale-[1.01] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10 pb-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl ring-2 ring-white/30 transform hover:rotate-6 transition-transform duration-300">
                    <Send className="h-10 w-10 drop-shadow-lg" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tight drop-shadow-lg">알림톡 발송하기</h1>
                    <p className="text-white/95 mt-2 text-xl font-medium drop-shadow">학생 및 학부모에게 효과적으로 메시지를 전달하세요</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>실시간 발송</span>
                  </div>
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>예약 발송 가능</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border border-white/30 rounded-xl px-6 py-6 transition-all duration-200 hover:scale-105 shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                뒤로가기
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 통계 카드 - 프리미엄 애니메이션 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative transform hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">전체 학생</p>
                  <p className="text-4xl font-black mt-2 drop-shadow-lg">{students.length}</p>
                  <p className="text-xs text-white/70 mt-1">명</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-9 h-9 drop-shadow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative transform hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">선택된 수신자</p>
                  <p className="text-4xl font-black mt-2 drop-shadow-lg">{selectedStudents.length}</p>
                  <p className="text-xs text-white/70 mt-1">명</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <Target className="w-9 h-9 drop-shadow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-teal-600 to-cyan-600 text-white overflow-hidden relative transform hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">예상 비용</p>
                  <p className="text-4xl font-black mt-2 drop-shadow-lg">{cost.total}</p>
                  <p className="text-xs text-white/70 mt-1">P</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <DollarSign className="w-9 h-9 drop-shadow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative transform hover:scale-105 hover:-translate-y-1 ${
            balance >= cost.total 
              ? 'bg-gradient-to-br from-emerald-600 to-green-700' 
              : 'bg-gradient-to-br from-red-600 to-rose-700'
          } text-white`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-semibold tracking-wide uppercase">현재 잔액</p>
                  <p className="text-4xl font-black mt-2 drop-shadow-lg">{balance}</p>
                  <p className="text-xs text-white/70 mt-1">P</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <TrendingUp className="w-9 h-9 drop-shadow" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 수신자 선택 및 메시지 작성 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 수신자 선택 */}
            <Card className="group border-0 shadow-2xl hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 bg-white/80 backdrop-blur-xl transform hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-purple-100 via-pink-50 to-blue-100 border-b border-purple-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-black">
                        수신자 선택
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      <span className="text-purple-700 font-bold text-lg">{selectedStudents.length}명</span> 선택됨
                      {invalidRecipients > 0 && (
                        <span className="text-orange-600 font-semibold ml-3 inline-flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          (전화번호 없음: {invalidRecipients}명)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllStudents}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 border-purple-300 text-purple-700 font-bold px-5 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    {selectedStudents.length === filteredStudents.length
                      ? "전체 해제"
                      : "전체 선택"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 z-10" />
                  <Input
                    placeholder="이름, 이메일, 전화번호 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 py-7 border-3 border-gray-200 focus:border-purple-500 rounded-2xl transition-all duration-200 text-lg shadow-sm hover:shadow-md relative bg-white"
                  />
                </div>

                <div className="max-h-[480px] overflow-y-auto space-y-4 pr-3 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100 scrollbar-thumb-rounded-full">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-lg">검색 결과가 없습니다.</p>
                      <p className="text-gray-400 text-sm mt-2">다른 검색어를 입력해보세요</p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`group p-5 border-3 rounded-2xl cursor-pointer transition-all duration-300 transform ${
                          selectedStudents.includes(student.id)
                            ? "border-purple-500 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 shadow-xl scale-[1.02] ring-4 ring-purple-200/50"
                            : "border-gray-200 hover:border-purple-400 hover:shadow-lg hover:scale-[1.01] bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-300 ${
                              selectedStudents.includes(student.id)
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-4 ring-purple-200 transform scale-110'
                                : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 group-hover:from-purple-200 group-hover:to-pink-200'
                            }`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{student.name}</p>
                              <p className="text-sm text-gray-600 font-medium mt-0.5">{student.email}</p>
                              {student.phone ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Phone className="w-3.5 h-3.5 text-green-700" />
                                  </div>
                                  <p className="text-sm text-gray-800 font-semibold">{student.phone}</p>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="mt-2 text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 font-semibold">
                                  전화번호 없음
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Checkbox 
                            checked={selectedStudents.includes(student.id)} 
                            className={`w-7 h-7 rounded-lg border-3 transition-all duration-200 ${
                              selectedStudents.includes(student.id) 
                                ? 'border-purple-500 bg-purple-500 shadow-lg' 
                                : 'border-gray-300 group-hover:border-purple-400'
                            }`}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 메시지 작성 */}
            <Card className="group border-0 shadow-2xl hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 bg-white/80 backdrop-blur-xl transform hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-blue-100 via-cyan-50 to-teal-100 border-b border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-black">
                        메시지 작성
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-3 text-base">
                      <Badge className={`px-3 py-1.5 text-sm font-bold shadow-md ${
                        cost.type === "SMS" 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                          : "bg-gradient-to-r from-orange-500 to-amber-600"
                      }`}>
                        {cost.type}
                      </Badge>
                      <span className="font-bold text-gray-700">{byteSize}바이트</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{cost.type === "SMS" ? "90바이트 이하" : "90바이트 초과"}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-blue-300 text-blue-700 font-bold px-5 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "편집" : "미리보기"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                {/* 템플릿 선택 */}
                {templates.length > 0 && (
                  <div className="p-5 bg-gradient-to-r from-purple-100 via-pink-50 to-blue-100 rounded-2xl border-2 border-purple-200 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox
                        checked={useTemplate}
                        onCheckedChange={(checked) => setUseTemplate(!!checked)}
                        className="w-6 h-6 rounded-lg border-2"
                      />
                      <Label className="font-bold text-gray-800 text-lg cursor-pointer">템플릿 사용하기</Label>
                      <Badge className="bg-purple-600 text-white px-2 py-1">{templates.length}개</Badge>
                    </div>

                    {useTemplate && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {templates.map((template) => (
                          <Button
                            key={template.id}
                            variant={selectedTemplate === template.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyTemplate(template.id)}
                            className={`justify-start py-6 rounded-xl font-semibold transition-all duration-200 ${
                              selectedTemplate === template.id
                                ? "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl scale-105 ring-4 ring-purple-200"
                                : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-105"
                            }`}
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            {template.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 메시지 입력 또는 미리보기 */}
                {showPreview ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl ring-1 ring-white/10">
                      <div className="bg-white rounded-2xl p-6 shadow-2xl transform transition-transform duration-300 hover:scale-[1.02]">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-purple-100">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <Smartphone className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-black text-gray-900 text-lg">메시지 미리보기</span>
                          <Badge className={cost.type === "SMS" ? "bg-green-500" : "bg-orange-500"}>
                            {cost.type}
                          </Badge>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 min-h-[280px] shadow-inner border-2 border-purple-100">
                          <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">
                            {message || "메시지를 입력해주세요..."}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-purple-100 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">발신: {selectedSender || "발신번호 미선택"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold">{new Date().toLocaleString('ko-KR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <Textarea
                      placeholder="안녕하세요. 학원에서 알려드립니다.&#10;&#10;메시지를 입력하세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={12}
                      className="relative resize-none border-3 border-gray-200 focus:border-blue-500 rounded-2xl transition-all duration-200 text-lg p-6 shadow-sm hover:shadow-md bg-white leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-6 flex items-center gap-3 text-sm">
                      <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                        {byteSize} / {cost.type === "SMS" ? "90" : "2000"}바이트
                      </Badge>
                      <Badge className={cost.type === "SMS" ? "bg-green-500" : "bg-orange-500"}>
                        {cost.type}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* 예약 발송 */}
                <div className="p-5 bg-gradient-to-r from-teal-100 via-cyan-50 to-blue-100 rounded-2xl border-2 border-teal-200 shadow-md">
                  <Label className="flex items-center gap-3 font-bold text-gray-800 text-lg mb-4">
                    <div className="p-2 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg shadow-md">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    예약 발송 (선택사항)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                    className="border-3 border-teal-300 focus:border-teal-500 rounded-xl py-6 text-base font-semibold bg-white shadow-sm hover:shadow-md transition-all duration-200"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 발송 정보 및 설정 */}
          <div className="space-y-8">
            {/* 발신번호 선택 */}
            <Card className="border-0 shadow-2xl hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 bg-white/80 backdrop-blur-xl transform hover:scale-[1.02]">
              <CardHeader className="bg-gradient-to-r from-green-100 via-emerald-50 to-teal-100 border-b border-green-200/50">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl shadow-lg">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent font-black">
                    발신번호
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                {senders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Phone className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-bold mb-2 text-lg">등록된 발신번호가 없습니다.</p>
                    <p className="text-gray-500 text-sm mb-5">발신번호를 먼저 등록해주세요</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-2 border-green-300 text-green-700 font-bold px-6 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      발신번호 등록하기
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedSender}
                    onChange={(e) => setSelectedSender(e.target.value)}
                    className="w-full p-4 border-3 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-200 outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md font-semibold text-base"
                  >
                    {senders.map((sender) => (
                      <option key={sender.id} value={sender.phone_number}>
                        {sender.phone_number}
                        {sender.verified ? " ✓ 인증완료" : " (미인증)"}
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>

            {/* 발송 정보 */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 text-white overflow-hidden relative transform hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="font-black">발송 정보</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105">
                    <span className="text-white/95 font-semibold">수신자 수</span>
                    <span className="font-black text-2xl drop-shadow-lg">{validRecipients.length}명</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105">
                    <span className="text-white/95 font-semibold">메시지 타입</span>
                    <Badge className={`${
                      cost.type === "SMS" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                        : "bg-gradient-to-r from-orange-500 to-amber-600"
                    } px-4 py-1.5 text-white font-bold shadow-lg`}>
                      {cost.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105">
                    <span className="text-white/95 font-semibold">건당 비용</span>
                    <span className="font-bold text-xl">{cost.perMessage}P</span>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white/25 backdrop-blur-md rounded-2xl border-2 border-white/40 shadow-2xl">
                    <span className="font-black text-xl">총 비용</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-7 h-7" />
                      <span className="font-black text-3xl drop-shadow-lg">{cost.total}P</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg transition-transform duration-200 hover:scale-105">
                    <span className="text-white/95 font-semibold">현재 잔액</span>
                    <span className={`font-black text-xl ${
                      balance >= cost.total ? "text-green-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "text-red-300 drop-shadow-[0_0_10px_rgba(252,165,165,0.5)]"
                    }`}>
                      {balance}P
                    </span>
                  </div>
                </div>

                {balance < cost.total && (
                  <div className="bg-red-500/40 backdrop-blur-md border-2 border-red-300/60 rounded-2xl p-5 shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-500 rounded-lg shadow-lg">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="font-black text-lg mb-2">포인트가 부족합니다</p>
                        <p className="text-white/95 font-semibold">충전이 필요합니다. ({cost.total - balance}P 부족)</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 발송 버튼 */}
            <Button
              onClick={handleSend}
              disabled={selectedStudents.length === 0 || !message.trim() || sending || balance < cost.total}
              className="w-full py-8 text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 shadow-2xl hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-2xl border-2 border-white/20"
            >
              {sending ? (
                <>
                  <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                  발송 중...
                </>
              ) : reserveTime ? (
                <>
                  <Calendar className="w-7 h-7 mr-3" />
                  예약 발송하기
                </>
              ) : (
                <>
                  <Send className="w-7 h-7 mr-3" />
                  즉시 발송하기
                </>
              )}
            </Button>

            {/* 안내 사항 */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 transform hover:scale-[1.01] transition-all duration-300">
              <CardContent className="pt-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg transform hover:rotate-6 transition-transform duration-300">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-3 text-base text-gray-800">
                    <p className="font-black text-blue-900 text-xl">발송 전 확인사항</p>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-3 group">
                        <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-200">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <span className="font-semibold">전화번호가 없는 학생은 발송되지 않습니다</span>
                      </li>
                      <li className="flex items-start gap-3 group">
                        <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-200">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <span className="font-semibold">발송 후 취소가 불가능합니다</span>
                      </li>
                      <li className="flex items-start gap-3 group">
                        <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-200">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <span className="font-semibold">예약 발송은 최대 30일 이내만 가능합니다</span>
                      </li>
                      <li className="flex items-start gap-3 group">
                        <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5 group-hover:scale-110 transition-transform duration-200">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <span className="font-semibold">SMS는 90바이트, LMS는 2,000바이트까지 가능합니다</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
