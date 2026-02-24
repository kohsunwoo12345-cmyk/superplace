"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Send,
  Phone,
  MessageSquare,
  Users,
  Loader2,
  Coins,
  FileText,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  parentPhone?: string;
  grade?: string;
  class?: string;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  points: number;
}

const SMS_COST = 20; // 20 포인트/건

export default function MessageSendPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 메시지 설정
  const [senderNumber, setSenderNumber] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [senderNumbers, setSenderNumbers] = useState<string[]>([]);

  // 수신자 설정
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    const initPage = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // 발신번호 목록 로드
        try {
          const sendersRes = await fetch("/api/sender-numbers/approved", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (sendersRes.ok) {
            const data = await sendersRes.json();
            setSenderNumbers(data.senderNumbers || []);
            if (data.senderNumbers?.length > 0) {
              setSenderNumber(data.senderNumbers[0]);
            }
          }
        } catch (error) {
          console.error("발신번호 로딩 실패:", error);
        }

        // 학생 목록 로드
        try {
          const studentsRes = await fetch("/api/students/by-academy", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (studentsRes.ok) {
            const data = await studentsRes.json();
            setStudents(data.students || []);
          }
        } catch (error) {
          console.error("학생 목록 로딩 실패:", error);
        }

        setLoading(false);
      } catch (error) {
        console.error("페이지 초기화 실패:", error);
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSend = async () => {
    if (!senderNumber) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (!messageContent.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (selectedStudents.length === 0) {
      alert("수신자를 선택해주세요.");
      return;
    }

    const totalCost = selectedStudents.length * SMS_COST;
    if (!user || user.points < totalCost) {
      alert(`포인트가 부족합니다. 필요: ${totalCost}P, 보유: ${user?.points || 0}P`);
      router.push("/dashboard/point-charge");
      return;
    }

    const confirmed = confirm(
      `총 ${selectedStudents.length}명에게 SMS 발송\n` +
        `차감 포인트: ${totalCost}P\n` +
        `잔여 포인트: ${user.points - totalCost}P\n\n` +
        `발송하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      setSending(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderNumber,
          messageType: "SMS",
          messageContent,
          recipients: selectedStudents.map((studentId) => {
            const student = students.find((s) => s.id === studentId);
            return {
              studentId: student?.id || "",
              studentName: student?.name || "",
              parentPhone: student?.parentPhone || "",
            };
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("메시지 발송 실패");
      }

      alert("메시지가 성공적으로 발송되었습니다!");
      router.push("/dashboard/message-history");
    } catch (error) {
      console.error("메시지 발송 실패:", error);
      alert("메시지 발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const studentsWithPhone = students.filter((s) => s.parentPhone);
  const totalCost = selectedStudents.length * SMS_COST;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* 상단 메뉴 */}
      <div className="bg-white border-b shadow-sm mb-6 -mx-6 -mt-6 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="whitespace-nowrap"
          >
            <Send className="w-4 h-4 mr-1" />
            대시보드
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/message-send")}
            className="whitespace-nowrap bg-teal-50 text-teal-700"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            메시지 발송
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/message-history")}
            className="whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1" />
            발송 이력
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/point-charge")}
            className="whitespace-nowrap"
          >
            <Coins className="w-4 h-4 mr-1" />
            포인트 충전
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Send className="h-8 w-8 text-teal-600" />
              SMS 문자 발송
            </h1>
            <p className="text-gray-600 mt-1">
              학부모에게 학생별 맞춤 SMS 메시지를 발송하세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Coins className="w-5 h-5 mr-2 text-amber-500" />
              {user?.points || 0} P
            </Badge>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 발송 설정 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 발송 유형 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  SMS 문자 발송
                  <Badge variant="outline" className="ml-auto">
                    📱 {SMS_COST}P/건
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>발신번호</Label>
                  <select
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {senderNumbers.length === 0 ? (
                      <option value="">등록된 발신번호가 없습니다</option>
                    ) : (
                      senderNumbers.map((number) => (
                        <option key={number} value={number}>
                          {number}
                        </option>
                      ))
                    )}
                  </select>
                  {senderNumbers.length === 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/dashboard/sender-number-register")}
                      className="p-0 h-auto"
                    >
                      발신번호 등록하기 →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 수신자 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  수신자 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      학부모 연락처가 등록된 학생: {studentsWithPhone.length}명
                    </div>
                    <Button onClick={handleSelectAllStudents} variant="outline" size="sm">
                      {selectedStudents.length === studentsWithPhone.length ? "전체 해제" : "전체 선택"}
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {studentsWithPhone.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelection(student.id)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? "bg-teal-50 border-teal-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.parentPhone}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => {}}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메시지 작성 */}
            <Card>
              <CardHeader>
                <CardTitle>메시지 작성</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="메시지 내용을 입력하세요..."
                  rows={6}
                  maxLength={2000}
                />
                <div className="text-right text-sm text-gray-500 mt-2">
                  {messageContent.length} / 2000자
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측: 발송 요약 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>발송 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">발송 유형</span>
                    <span className="font-medium">SMS 문자</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">수신자 수</span>
                    <span className="font-medium">{selectedStudents.length}명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">건당 비용</span>
                    <span className="font-medium">{SMS_COST}P</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">총 차감 포인트</span>
                    <span className="font-semibold text-lg">{totalCost}P</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">잔여 포인트</span>
                    <span className={`font-medium ${
                      (user?.points || 0) - totalCost < 0 ? "text-red-600" : "text-green-600"
                    }`}>
                      {(user?.points || 0) - totalCost}P
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={
                    sending ||
                    !senderNumber ||
                    !messageContent.trim() ||
                    selectedStudents.length === 0 ||
                    (user?.points || 0) < totalCost
                  }
                  className="w-full"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      메시지 발송
                    </>
                  )}
                </Button>

                {(user?.points || 0) < totalCost && selectedStudents.length > 0 && (
                  <div className="text-sm text-red-600 text-center">
                    포인트가 부족합니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
