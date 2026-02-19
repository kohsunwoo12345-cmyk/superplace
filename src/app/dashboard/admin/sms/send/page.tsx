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
    const costPerMessage = messageType === "LMS" ? 50 : 20; // 예시 요금
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
          senderId: selectedSender,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 상단 메뉴 바 */}
      <div className="bg-white border-b shadow-sm mb-6 -mx-6 -mt-6 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms")}
            className="whitespace-nowrap"
          >
            <Send className="w-4 h-4 mr-1" />
            대시보드
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms/registration")}
            className="whitespace-nowrap"
          >
            <Phone className="w-4 h-4 mr-1" />
            발신번호 등록
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms/registration-approval")}
            className="whitespace-nowrap"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            등록 승인
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms/send")}
            className="whitespace-nowrap bg-teal-50 text-teal-700"
          >
            <Send className="w-4 h-4 mr-1" />
            문자 발송
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms/templates")}
            className="whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1" />
            템플릿
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/admin/sms/history")}
            className="whitespace-nowrap"
          >
            <History className="w-4 h-4 mr-1" />
            발송이력
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Send className="h-8 w-8 text-teal-600" />
              문자 발송
            </h1>
            <p className="text-gray-600 mt-1">학생 및 학부모에게 문자를 발송합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 수신자 선택 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>수신자 선택</CardTitle>
                    <CardDescription>
                      {selectedStudents.length}명 선택됨
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllStudents}>
                    {selectedStudents.length === filteredStudents.length
                      ? "전체 해제"
                      : "전체 선택"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="이름, 이메일, 전화번호 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStudents.includes(student.id)
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.phone && (
                              <p className="text-sm text-gray-500">{student.phone}</p>
                            )}
                            {!student.phone && (
                              <Badge variant="secondary" className="mt-1">
                                전화번호 없음
                              </Badge>
                            )}
                          </div>
                          <Checkbox checked={selectedStudents.includes(student.id)} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>메시지 작성</CardTitle>
                <CardDescription>
                  {byteSize}바이트 / {cost.type} ({cost.type === "SMS" ? "90바이트 이하" : "90바이트 초과"})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 템플릿 선택 */}
                {templates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={useTemplate}
                        onCheckedChange={(checked) => setUseTemplate(!!checked)}
                      />
                      <Label>템플릿 사용</Label>
                    </div>

                    {useTemplate && (
                      <div className="grid grid-cols-2 gap-2">
                        {templates.map((template) => (
                          <Button
                            key={template.id}
                            variant={selectedTemplate === template.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyTemplate(template.id)}
                            className="justify-start"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {template.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Textarea
                  placeholder="메시지를 입력하세요..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                {/* 예약 발송 */}
                <div>
                  <Label>예약 발송 (선택)</Label>
                  <Input
                    type="datetime-local"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 발송 정보 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>발신번호 선택</CardTitle>
              </CardHeader>
              <CardContent>
                {senders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">등록된 발신번호가 없습니다.</p>
                    <Button size="sm" variant="outline">
                      발신번호 등록
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedSender}
                    onChange={(e) => setSelectedSender(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {senders.map((sender) => (
                      <option key={sender.id} value={sender.phone_number}>
                        {sender.phone_number}
                        {sender.verified ? " ✓" : " (미인증)"}
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardHeader>
                <CardTitle className="text-teal-900">발송 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>수신자 수:</span>
                  <span className="font-semibold">{selectedStudents.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span>메시지 타입:</span>
                  <Badge>{cost.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>건당 비용:</span>
                  <span>{cost.perMessage}P</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>총 비용:</span>
                  <span className="text-teal-600">{cost.total}P</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>현재 잔액:</span>
                  <span className={balance >= cost.total ? "text-green-600" : "text-red-600"}>
                    {balance}P
                  </span>
                </div>
                {balance < cost.total && (
                  <div className="bg-red-100 text-red-700 p-2 rounded text-xs">
                    포인트가 부족합니다. 충전이 필요합니다.
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleSend}
              disabled={selectedStudents.length === 0 || !message.trim() || sending || balance < cost.total}
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : reserveTime ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  예약 발송
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  즉시 발송
                </>
              )}
            </Button>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>• 전화번호가 없는 학생은 발송되지 않습니다</p>
                    <p>• 발송 후 취소가 불가능합니다</p>
                    <p>• 예약 발송은 최대 30일 이내만 가능합니다</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
