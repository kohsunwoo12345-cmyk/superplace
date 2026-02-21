"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Phone,
  MessageSquare,
  Upload,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Coins,
  Link as LinkIcon,
  UserCheck,
  Calendar,
  Trash2,
  Eye,
  Download,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  parentPhone?: string;
  grade?: string;
  class?: string;
  studentId?: string;
}

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  studentId?: string;
}

interface RecipientMapping {
  studentId: string;
  studentName: string;
  parentPhone: string;
  landingPageUrl: string;
  grade?: string;
  class?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  messageType: string;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  points: number;
}

interface KakaoChannel {
  channelId: string;
  phoneNumber: string;
  channelName: string;
  status: string;
}

const SMS_COST = 20; // 20 포인트/건
const KAKAO_COST = 15; // 15 포인트/건

export default function MessageSendPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 메시지 설정
  const [messageType, setMessageType] = useState<"SMS" | "KAKAO">("SMS");
  const [senderNumber, setSenderNumber] = useState("");
  const [selectedKakaoChannel, setSelectedKakaoChannel] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [senderNumbers, setSenderNumbers] = useState<string[]>([]);
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([]);

  // 수신자 설정
  const [recipientMode, setRecipientMode] = useState<"manual" | "students" | "excel">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState<{ phone: string; name: string }[]>([
    { phone: "", name: "" },
  ]);

  // 랜딩페이지 설정
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedLandingPageId, setSelectedLandingPageId] = useState("");
  const [useLandingPage, setUseLandingPage] = useState(false);
  const [recipientMappings, setRecipientMappings] = useState<RecipientMapping[]>([]);

  // 템플릿
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // 엑셀 업로드
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadedRecipients, setUploadedRecipients] = useState<any[]>([]);

  // 예약 발송
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // 미리보기
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadInitialData(userData);
    } else {
      router.push("/login");
    }
  }, []);

  const loadInitialData = async (userData: UserInfo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 발신번호 목록
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

      // 학생 목록
      const studentsRes = await fetch("/api/students/by-academy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }

      // 랜딩페이지 목록
      const landingRes = await fetch("/api/landing-pages/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (landingRes.ok) {
        const data = await landingRes.json();
        setLandingPages(data.landingPages || []);
      }

      // 템플릿 목록
      const templatesRes = await fetch("/api/message-templates/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }

      // 카카오 채널 목록
      const kakaoRes = await fetch("/api/kakao/channels/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (kakaoRes.ok) {
        const data = await kakaoRes.json();
        const approvedChannels = (data.channels || []).filter((ch: KakaoChannel) => ch.status === 'APPROVED');
        setKakaoChannels(approvedChannels);
        if (approvedChannels.length > 0) {
          setSelectedKakaoChannel(approvedChannels[0].channelId);
        }
      }

      // 사용자 포인트 갱신
      const userRes = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setUser((prev) => (prev ? { ...prev, points: data.user.points } : null));
      }
    } catch (error) {
      console.error("초기 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddManualRecipient = () => {
    setManualRecipients([...manualRecipients, { phone: "", name: "" }]);
  };

  const handleRemoveManualRecipient = (index: number) => {
    setManualRecipients(manualRecipients.filter((_, i) => i !== index));
  };

  const handleManualRecipientChange = (
    index: number,
    field: "phone" | "name",
    value: string
  ) => {
    const updated = [...manualRecipients];
    updated[index][field] = value;
    setManualRecipients(updated);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
      if (template.messageType === "KAKAO" && !messageTitle) {
        setMessageTitle(template.name);
      }
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/recipients/upload-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedRecipients(data.recipients || []);
        alert(`✅ ${data.recipients.length}건의 수신자 정보를 불러왔습니다.`);
      } else {
        alert("엑셀 파일 업로드 실패");
      }
    } catch (error) {
      console.error("엑셀 업로드 오류:", error);
      alert("엑셀 파일 업로드 중 오류가 발생했습니다.");
    }
  };

  const generateRecipientMappings = () => {
    const mappings: RecipientMapping[] = [];

    if (recipientMode === "students" && useLandingPage && selectedLandingPageId) {
      const baseLandingPage = landingPages.find((lp) => lp.id === selectedLandingPageId);
      if (!baseLandingPage) return mappings;

      selectedStudents.forEach((studentId) => {
        const student = students.find((s) => s.id === studentId);
        if (student && student.parentPhone) {
          // 각 학생마다 고유한 슬러그 생성
          const customSlug = `${baseLandingPage.slug}-${student.studentId || student.id}`;
          const landingPageUrl = `${window.location.origin}/l/${customSlug}`;

          mappings.push({
            studentId: student.id,
            studentName: student.name,
            parentPhone: student.parentPhone,
            landingPageUrl,
            grade: student.grade,
            class: student.class,
          });
        }
      });
    } else if (recipientMode === "students") {
      // 랜딩페이지 없이 학생 목록만
      selectedStudents.forEach((studentId) => {
        const student = students.find((s) => s.id === studentId);
        if (student && student.parentPhone) {
          mappings.push({
            studentId: student.id,
            studentName: student.name,
            parentPhone: student.parentPhone,
            landingPageUrl: "",
            grade: student.grade,
            class: student.class,
          });
        }
      });
    } else if (recipientMode === "manual") {
      manualRecipients.forEach((recipient, index) => {
        if (recipient.phone && recipient.name) {
          mappings.push({
            studentId: `manual-${index}`,
            studentName: recipient.name,
            parentPhone: recipient.phone,
            landingPageUrl: "",
          });
        }
      });
    } else if (recipientMode === "excel") {
      uploadedRecipients.forEach((recipient) => {
        mappings.push({
          studentId: recipient.id || `excel-${recipient.studentName}`,
          studentName: recipient.studentName,
          parentPhone: recipient.parentPhone,
          landingPageUrl: "",
          grade: recipient.grade,
          class: recipient.class,
        });
      });
    }

    return mappings;
  };

  const calculateTotalCost = () => {
    const mappings = generateRecipientMappings();
    const costPerMessage = messageType === "SMS" ? SMS_COST : KAKAO_COST;
    return mappings.length * costPerMessage;
  };

  const handlePreview = () => {
    const mappings = generateRecipientMappings();
    setRecipientMappings(mappings);
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    if (messageType === "SMS" && !senderNumber) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (messageType === "KAKAO" && !selectedKakaoChannel) {
      alert("카카오 채널을 선택해주세요.");
      return;
    }

    if (!messageContent.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    const mappings = generateRecipientMappings();
    if (mappings.length === 0) {
      alert("수신자를 선택해주세요.");
      return;
    }

    const totalCost = calculateTotalCost();
    if (!user || user.points < totalCost) {
      alert(`포인트가 부족합니다. 필요: ${totalCost}P, 보유: ${user?.points || 0}P`);
      router.push("/dashboard/point-charge");
      return;
    }

    const confirmed = confirm(
      `총 ${mappings.length}명에게 ${messageType} 발송\n` +
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageType,
          senderNumber: messageType === "SMS" ? senderNumber : null,
          kakaoChannelId: messageType === "KAKAO" ? selectedKakaoChannel : null,
          messageTitle,
          messageContent,
          recipients: mappings,
          landingPageId: useLandingPage ? selectedLandingPageId : null,
          scheduledAt: isScheduled ? scheduledDateTime : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ 발송 완료!\n` +
            `성공: ${data.successCount}건\n` +
            `실패: ${data.failCount}건\n` +
            `차감 포인트: ${totalCost}P`
        );
        router.push("/dashboard/message-history");
      } else {
        const error = await response.json();
        alert(`❌ 발송 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("발송 오류:", error);
      alert("발송 중 오류가 발생했습니다.");
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

  const totalCost = calculateTotalCost();
  const recipientCount = generateRecipientMappings().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* 상단 메뉴 */}
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
              문자 / 카카오 발송
            </h1>
            <p className="text-gray-600 mt-1">
              학부모에게 학생별 맞춤 메시지를 발송하세요
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
                  <MessageSquare className="w-5 h-5" />
                  발송 유형 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={messageType}
                  onValueChange={(value) => setMessageType(value as "SMS" | "KAKAO")}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="sms"
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      messageType === "SMS"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="SMS" id="sms" className="sr-only" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Phone className="w-6 h-6 text-blue-600" />
                        <Badge variant={messageType === "SMS" ? "default" : "outline"}>
                          {SMS_COST}P/건
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">SMS 문자</div>
                        <div className="text-sm text-gray-600">
                          단문/장문 문자 발송
                        </div>
                      </div>
                    </div>
                  </Label>

                  <Label
                    htmlFor="kakao"
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      messageType === "KAKAO"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="KAKAO" id="kakao" className="sr-only" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <MessageSquare className="w-6 h-6 text-yellow-600" />
                        <Badge
                          variant={messageType === "KAKAO" ? "default" : "outline"}
                          className={messageType === "KAKAO" ? "bg-yellow-500" : ""}
                        >
                          {KAKAO_COST}P/건
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">카카오톡</div>
                        <div className="text-sm text-gray-600">
                          알림톡/친구톡 발송
                        </div>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>

                {messageType === "SMS" && (
                  <div className="space-y-2">
                    <Label>발신번호</Label>
                    <Select value={senderNumber} onValueChange={setSenderNumber}>
                      <SelectTrigger>
                        <SelectValue placeholder="발신번호 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {senderNumbers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            등록된 발신번호가 없습니다
                          </SelectItem>
                        ) : (
                          senderNumbers.map((number) => (
                            <SelectItem key={number} value={number}>
                              {number}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                )}

                {messageType === "KAKAO" && (
                  <div className="space-y-2">
                    <Label>카카오 채널</Label>
                    <Select value={selectedKakaoChannel} onValueChange={setSelectedKakaoChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="카카오 채널 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {kakaoChannels.length === 0 ? (
                          <SelectItem value="none" disabled>
                            등록된 카카오 채널이 없습니다
                          </SelectItem>
                        ) : (
                          kakaoChannels.map((channel) => (
                            <SelectItem key={channel.channelId} value={channel.channelId}>
                              {channel.channelName} ({channel.phoneNumber})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {kakaoChannels.length === 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => router.push("/dashboard/kakao-channel")}
                        className="p-0 h-auto"
                      >
                        카카오 채널 등록하기 →
                      </Button>
                    )}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      💡 카카오 알림톡 발송 시 채널 검수가 완료된 채널만 사용 가능합니다.
                    </div>
                  </div>
                )}
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
                <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="students">학생 선택</TabsTrigger>
                    <TabsTrigger value="manual">직접 입력</TabsTrigger>
                    <TabsTrigger value="excel">엑셀 업로드</TabsTrigger>
                  </TabsList>

                  <TabsContent value="students" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        학부모 연락처가 등록된 학생만 표시됩니다
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllStudents}
                      >
                        {selectedStudents.length === students.length
                          ? "전체 해제"
                          : "전체 선택"}
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {students
                        .filter((s) => s.parentPhone)
                        .map((student) => (
                          <div
                            key={student.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedStudents.includes(student.id)
                                ? "border-teal-500 bg-teal-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handleStudentSelection(student.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => handleStudentSelection(student.id)}
                                  className="w-5 h-5"
                                />
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {student.grade} {student.class} | 학부모:{" "}
                                    {student.parentPhone}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline">{student.studentId}</Badge>
                            </div>
                          </div>
                        ))}

                      {students.filter((s) => s.parentPhone).length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          학부모 연락처가 등록된 학생이 없습니다.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-2">
                      {manualRecipients.map((recipient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="이름"
                            value={recipient.name}
                            onChange={(e) =>
                              handleManualRecipientChange(index, "name", e.target.value)
                            }
                            className="w-1/3"
                          />
                          <Input
                            placeholder="전화번호 (010-1234-5678)"
                            value={recipient.phone}
                            onChange={(e) =>
                              handleManualRecipientChange(index, "phone", e.target.value)
                            }
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveManualRecipient(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleAddManualRecipient}
                      className="w-full"
                    >
                      수신자 추가
                    </Button>
                  </TabsContent>

                  <TabsContent value="excel" className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <div className="space-y-2">
                        <Label
                          htmlFor="excel-upload"
                          className="cursor-pointer text-teal-600 font-semibold hover:text-teal-700"
                        >
                          엑셀 파일 업로드
                        </Label>
                        <Input
                          id="excel-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500">
                          학생명, 학부모명, 전화번호가 포함된 엑셀 파일
                        </p>
                      </div>
                    </div>

                    {uploadedRecipients.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-medium">
                          업로드된 수신자: {uploadedRecipients.length}명
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {uploadedRecipients.map((r, i) => (
                            <div
                              key={i}
                              className="text-sm p-2 bg-gray-50 rounded border"
                            >
                              {r.studentName} ({r.parentPhone})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        window.open("/templates/recipients_template.xlsx", "_blank");
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      엑셀 양식 다운로드
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 랜딩페이지 연결 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  랜딩페이지 연결 (선택사항)
                </CardTitle>
                <CardDescription>
                  학생별로 다른 랜딩페이지 URL이 생성되어 발송됩니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-landing-page"
                    checked={useLandingPage}
                    onChange={(e) => setUseLandingPage(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="use-landing-page">랜딩페이지 사용</Label>
                </div>

                {useLandingPage && (
                  <div className="space-y-2">
                    <Label>랜딩페이지 선택</Label>
                    <Select
                      value={selectedLandingPageId}
                      onValueChange={setSelectedLandingPageId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="랜딩페이지를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {landingPages.length === 0 ? (
                          <SelectItem value="none" disabled>
                            생성된 랜딩페이지가 없습니다
                          </SelectItem>
                        ) : (
                          landingPages.map((lp) => (
                            <SelectItem key={lp.id} value={lp.id}>
                              {lp.title} ({lp.slug})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {landingPages.length === 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => router.push("/dashboard/admin/landing-pages")}
                        className="p-0 h-auto"
                      >
                        랜딩페이지 만들기 →
                      </Button>
                    )}

                    {selectedLandingPageId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="font-medium text-blue-900 mb-1">
                          📌 학생별 URL 생성
                        </div>
                        <div className="text-blue-700">
                          각 학생마다 고유한 랜딩페이지 URL이 생성되어 메시지에
                          포함됩니다.
                          <br />
                          예: example.com/l/report-student001
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 메시지 작성 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  메시지 작성
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 템플릿 선택 */}
                <div className="space-y-2">
                  <Label>템플릿 선택 (선택사항)</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="저장된 템플릿 불러오기" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter((t) => t.messageType === messageType)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {messageType === "KAKAO" && (
                  <div className="space-y-2">
                    <Label>메시지 제목</Label>
                    <Input
                      placeholder="카카오톡 메시지 제목"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>메시지 내용</Label>
                    <span className="text-sm text-gray-500">
                      {messageContent.length}자
                      {messageType === "SMS" && messageContent.length > 90 && (
                        <Badge variant="secondary" className="ml-2">
                          LMS
                        </Badge>
                      )}
                    </span>
                  </div>
                  <Textarea
                    placeholder={
                      messageType === "SMS"
                        ? "문자 메시지 내용을 입력하세요"
                        : "카카오톡 메시지 내용을 입력하세요"
                    }
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={8}
                  />
                  <div className="text-xs text-gray-500">
                    💡 변수 사용: {"{{학생명}}"}, {"{{학부모명}}"}, {"{{성적}}"},{" "}
                    {"{{URL}}"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 예약 발송 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  예약 발송 (선택사항)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduled"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="scheduled">예약 발송 사용</Label>
                </div>

                {isScheduled && (
                  <div className="space-y-2">
                    <Label>발송 일시</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 우측: 발송 요약 */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>발송 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">발송 유형</span>
                    <Badge
                      variant={messageType === "SMS" ? "default" : "secondary"}
                      className={
                        messageType === "KAKAO" ? "bg-yellow-500 text-white" : ""
                      }
                    >
                      {messageType}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">수신자</span>
                    <span className="font-semibold">{recipientCount}명</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">메시지당 포인트</span>
                    <span className="font-semibold">
                      {messageType === "SMS" ? SMS_COST : KAKAO_COST}P
                    </span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">총 차감 포인트</span>
                      <span className="font-bold text-red-600">{totalCost}P</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">잔여 포인트</span>
                    <span
                      className={`font-semibold ${
                        (user?.points || 0) - totalCost >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(user?.points || 0) - totalCost}P
                    </span>
                  </div>
                </div>

                {(user?.points || 0) < totalCost && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-800 font-medium">
                      ⚠️ 포인트가 부족합니다
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/dashboard/point-charge")}
                      className="p-0 h-auto text-red-600"
                    >
                      포인트 충전하기 →
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="w-full"
                    disabled={recipientCount === 0}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </Button>

                  <Button
                    onClick={handleSend}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={
                      recipientCount === 0 ||
                      !messageContent.trim() ||
                      (user?.points || 0) < totalCost ||
                      sending
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
                        {isScheduled ? "예약 발송" : "즉시 발송"}
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>• 발송 전 내용을 다시 확인해주세요</div>
                  <div>• 발송 후 포인트는 환불되지 않습니다</div>
                  <div>• 대량 발송 시 지연이 있을 수 있습니다</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 미리보기 다이얼로그 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>발송 미리보기</DialogTitle>
            <DialogDescription>
              {recipientMappings.length}명의 수신자에게 발송됩니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">메시지 내용</CardTitle>
              </CardHeader>
              <CardContent>
                {messageType === "KAKAO" && messageTitle && (
                  <div className="font-semibold mb-2 text-lg">{messageTitle}</div>
                )}
                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                  {messageContent}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">수신자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recipientMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded border text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{mapping.studentName}</span>
                        <Badge variant="outline">{mapping.parentPhone}</Badge>
                      </div>
                      {mapping.landingPageUrl && (
                        <div className="text-xs text-teal-600 truncate">
                          🔗 {mapping.landingPageUrl}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
