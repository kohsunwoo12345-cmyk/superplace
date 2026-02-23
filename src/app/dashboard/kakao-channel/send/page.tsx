"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  MessageCircle,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Coins,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  parentPhone?: string;
}

interface KakaoChannel {
  channelId: string;
  phoneNumber: string;
  channelName: string;
  status: string;
}

const KAKAO_COST = 15; // 15 포인트/건

export default function KakaoSendPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 메시지 설정
  const [selectedKakaoChannel, setSelectedKakaoChannel] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([]);

  // 수신자 설정
  const [recipientMode, setRecipientMode] = useState<"students" | "manual">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState<{ phone: string; name: string }[]>([
    { phone: "", name: "" },
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadInitialData();
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 학생 목록 (부모 연락처가 있는 학생만)
      const studentsRes = await fetch("/api/students/by-academy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        const studentsWithParent = (data.students || []).filter(
          (s: Student) => s.parentPhone
        );
        setStudents(studentsWithParent);
      }

      // 카카오 채널 목록 (승인된 채널만)
      const channelsRes = await fetch("/api/kakao/channels/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (channelsRes.ok) {
        const data = await channelsRes.json();
        const approved = (data.channels || []).filter(
          (c: KakaoChannel) => c.status === "APPROVED"
        );
        setKakaoChannels(approved);
        if (approved.length > 0) {
          setSelectedKakaoChannel(approved[0].channelId);
        }
      }

      // 사용자 포인트 업데이트
      const userRes = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const addManualRecipient = () => {
    setManualRecipients([...manualRecipients, { phone: "", name: "" }]);
  };

  const removeManualRecipient = (index: number) => {
    setManualRecipients(manualRecipients.filter((_, i) => i !== index));
  };

  const updateManualRecipient = (index: number, field: "phone" | "name", value: string) => {
    const updated = [...manualRecipients];
    updated[index][field] = value;
    setManualRecipients(updated);
  };

  const getRecipientCount = () => {
    if (recipientMode === "students") {
      return selectedStudents.length;
    } else {
      return manualRecipients.filter((r) => r.phone.trim()).length;
    }
  };

  const totalCost = getRecipientCount() * KAKAO_COST;

  const handleSend = async () => {
    // 검증
    if (!selectedKakaoChannel) {
      alert("카카오 채널을 선택해주세요");
      return;
    }

    if (!messageContent.trim()) {
      alert("메시지 내용을 입력해주세요");
      return;
    }

    const recipientCount = getRecipientCount();
    if (recipientCount === 0) {
      alert("수신자를 선택해주세요");
      return;
    }

    if (user && user.points < totalCost) {
      alert(`포인트가 부족합니다. (필요: ${totalCost}P, 보유: ${user.points}P)`);
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem("token");

      // 수신자 정보 생성
      let recipients = [];
      if (recipientMode === "students") {
        recipients = students
          .filter((s) => selectedStudents.includes(s.id))
          .map((s) => ({
            phone: s.parentPhone,
            name: s.name,
          }));
      } else {
        recipients = manualRecipients.filter((r) => r.phone.trim());
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageType: "KAKAO",
          channelId: selectedKakaoChannel,
          title: messageTitle,
          content: messageContent,
          recipients,
        }),
      });

      if (response.ok) {
        alert(`카카오톡 메시지가 발송되었습니다!\n수신자: ${recipientCount}명\n차감 포인트: ${totalCost}P`);
        router.push("/dashboard/message-history");
      } else {
        const error = await response.json();
        alert(`발송 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Send error:", error);
      alert("메시지 발송 중 오류가 발생했습니다");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/kakao-channel")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Send className="w-8 h-8 text-orange-600" />
              카카오톡 메시지 발송
            </h1>
            <p className="text-gray-600 mt-1">
              승인된 카카오 채널로 메시지를 발송합니다
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">보유 포인트</p>
            <p className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
              <Coins className="w-5 h-5" />
              {user?.points || 0}P
            </p>
          </div>
        </div>

        {/* 채널 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-yellow-600" />
              카카오 채널 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kakaoChannels.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">승인된 카카오 채널이 없습니다</p>
                <Button
                  onClick={() => router.push("/dashboard/kakao-channel/register")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  채널 등록하기
                </Button>
              </div>
            ) : (
              <Select value={selectedKakaoChannel} onValueChange={setSelectedKakaoChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="채널 선택" />
                </SelectTrigger>
                <SelectContent>
                  {kakaoChannels.map((channel) => (
                    <SelectItem key={channel.channelId} value={channel.channelId}>
                      {channel.channelName} ({channel.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* 수신자 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              수신자 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">학생 선택</TabsTrigger>
                <TabsTrigger value="manual">직접 입력</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    부모 연락처가 등록된 학생만 표시됩니다
                  </p>
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    {selectedStudents.length === students.length ? "전체 해제" : "전체 선택"}
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {students.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      부모 연락처가 등록된 학생이 없습니다
                    </p>
                  ) : (
                    students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleStudentToggle(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.parentPhone}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-3">
                  {manualRecipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="이름"
                        value={recipient.name}
                        onChange={(e) => updateManualRecipient(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="연락처 (010-0000-0000)"
                        value={recipient.phone}
                        onChange={(e) => updateManualRecipient(index, "phone", e.target.value)}
                        className="flex-1"
                      />
                      {manualRecipients.length > 1 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeManualRecipient(index)}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button onClick={addManualRecipient} variant="outline" className="w-full">
                  수신자 추가
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 메시지 작성 */}
        <Card>
          <CardHeader>
            <CardTitle>메시지 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>제목 (선택)</Label>
              <Input
                placeholder="메시지 제목"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {messageTitle.length}/50자
              </p>
            </div>
            <div>
              <Label>내용 *</Label>
              <Textarea
                placeholder="메시지 내용을 입력하세요"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={8}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {messageContent.length}/1,000자
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 발송 요약 */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">발송 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">메시지 타입</span>
              <Badge className="bg-yellow-500">카카오톡</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">수신자 수</span>
              <span className="font-semibold">{getRecipientCount()}명</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">건당 비용</span>
              <span className="font-semibold">{KAKAO_COST}P</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">총 차감 포인트</span>
              <span className="font-bold text-orange-600 text-lg">{totalCost}P</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">발송 후 잔여 포인트</span>
              <span
                className={`font-semibold ${
                  user && user.points >= totalCost ? "text-green-600" : "text-red-600"
                }`}
              >
                {user ? user.points - totalCost : 0}P
              </span>
            </div>

            {user && user.points < totalCost && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                포인트가 부족합니다.{" "}
                <Button
                  size="sm"
                  variant="link"
                  className="text-red-600 underline p-0 h-auto"
                  onClick={() => router.push("/dashboard/point-charge")}
                >
                  포인트 충전하기
                </Button>
              </div>
            )}

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
              onClick={handleSend}
              disabled={
                sending ||
                !selectedKakaoChannel ||
                !messageContent.trim() ||
                getRecipientCount() === 0 ||
                (user && user.points < totalCost)
              }
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  카카오톡 발송
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
