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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  MessageSquare,
  Upload,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Coins,
  Eye,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface KakaoTemplate {
  templateId: string;
  templateCode: string;
  templateName: string;
  content: string;
  buttons: any[];
  status: string;
  inspectionStatus: string;
  channelId: string;
  variables: string[];
}

interface KakaoChannel {
  channelId: string;
  phoneNumber: string;
  channelName: string;
  status: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  parentPhone?: string;
  parentName?: string;
}

interface RecipientMapping {
  phone: string;
  name: string;
  studentId?: string;
  studentName?: string;
  variables?: { [key: string]: string };
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  points: number;
}

const KAKAO_COST = 15; // 15 포인트/건

export default function KakaoAlimtalkPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // 카카오 채널 및 템플릿
  const [kakaoChannels, setKakaoChannels] = useState<KakaoChannel[]>([]);
  const [selectedKakaoChannel, setSelectedKakaoChannel] = useState("");
  const [templates, setTemplates] = useState<KakaoTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<KakaoTemplate | null>(null);

  // 수신자 설정
  const [recipientMode, setRecipientMode] = useState<"manual" | "students">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState<{ phone: string; name: string }[]>([
    { phone: "", name: "" },
  ]);

  // 템플릿 변수 값
  const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({});

  // 미리보기
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

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

      // 카카오 채널 목록
      const kakaoRes = await fetch("/api/kakao/channels/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (kakaoRes.ok) {
        const data = await kakaoRes.json();
        const approvedChannels = (data.channels || []).filter(
          (ch: KakaoChannel) => ch.status === "APPROVED"
        );
        setKakaoChannels(approvedChannels);
        if (approvedChannels.length > 0) {
          setSelectedKakaoChannel(approvedChannels[0].channelId);
        }
      }

      // 학생 목록
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

  const loadTemplates = async () => {
    if (!selectedKakaoChannel) {
      alert("먼저 카카오 채널을 선택해주세요.");
      return;
    }

    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/kakao/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // 선택된 채널의 승인된 템플릿만 필터링
        const approvedTemplates = (data.templates || []).filter(
          (t: KakaoTemplate) =>
            t.channelId === selectedKakaoChannel &&
            (t.inspectionStatus === "APPROVED" || t.status === "APPROVED")
        );
        setTemplates(approvedTemplates);
        
        if (approvedTemplates.length === 0) {
          alert("승인된 알림톡 템플릿이 없습니다. Solapi에서 템플릿을 먼저 등록하고 승인받아주세요.");
        }
      } else {
        const error = await response.json();
        alert(`템플릿 로딩 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("템플릿 로딩 실패:", error);
      alert("템플릿을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.templateId === templateId);
    setSelectedTemplate(template || null);

    // 변수 초기화
    if (template) {
      const initialVariables: { [key: string]: string } = {};
      template.variables.forEach((varName) => {
        initialVariables[varName] = "";
      });
      setTemplateVariables(initialVariables);
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

  const generateRecipientMappings = (): RecipientMapping[] => {
    if (recipientMode === "students") {
      return selectedStudents.map((studentId) => {
        const student = students.find((s) => s.id === studentId);
        return {
          phone: student?.parentPhone || "",
          name: student?.parentName || "학부모님",
          studentId: student?.id,
          studentName: student?.name,
          variables: {
            ...templateVariables,
            학생명: student?.name || "",
            학부모명: student?.parentName || "학부모님",
          },
        };
      });
    } else {
      return manualRecipients
        .filter((r) => r.phone.trim())
        .map((r) => ({
          phone: r.phone,
          name: r.name || "고객님",
          variables: {
            ...templateVariables,
            고객명: r.name || "고객님",
          },
        }));
    }
  };

  const calculateTotalCost = () => {
    const recipientCount = generateRecipientMappings().length;
    return recipientCount * KAKAO_COST;
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.content;
    const sampleVariables = {
      ...templateVariables,
      학생명: "홍길동",
      학부모명: "홍학부모",
      고객명: "고객님",
    };

    // 변수 치환
    Object.keys(sampleVariables).forEach((key) => {
      const regex = new RegExp(`#{${key}}`, "g");
      content = content.replace(regex, sampleVariables[key] || `[${key}]`);
    });

    setPreviewContent(content);
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    if (!selectedKakaoChannel) {
      alert("카카오 채널을 선택해주세요.");
      return;
    }

    if (!selectedTemplateId) {
      alert("알림톡 템플릿을 선택해주세요.");
      return;
    }

    const mappings = generateRecipientMappings();
    if (mappings.length === 0) {
      alert("수신자를 선택해주세요.");
      return;
    }

    // 템플릿 변수 값 검증
    if (selectedTemplate) {
      const missingVars = selectedTemplate.variables.filter(
        (varName) => !templateVariables[varName]?.trim()
      );
      if (missingVars.length > 0) {
        alert(`다음 변수 값을 입력해주세요: ${missingVars.join(", ")}`);
        return;
      }
    }

    const totalCost = calculateTotalCost();
    if (!user || user.points < totalCost) {
      alert(`포인트가 부족합니다. 필요: ${totalCost}P, 보유: ${user?.points || 0}P`);
      router.push("/dashboard/point-charge");
      return;
    }

    const confirmed = confirm(
      `총 ${mappings.length}명에게 카카오 알림톡 발송\n` +
        `템플릿: ${selectedTemplate?.templateName}\n` +
        `차감 포인트: ${totalCost}P\n` +
        `잔여 포인트: ${user.points - totalCost}P\n\n` +
        `발송하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      setSending(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/kakao/send-alimtalk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: selectedKakaoChannel,
          templateId: selectedTemplateId,
          templateCode: selectedTemplate?.templateCode,
          recipients: mappings,
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6">
      {/* 헤더 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/message-dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  💬 카카오 알림톡 발송
                </h1>
                <p className="text-gray-600">
                  승인된 템플릿으로 카카오 알림톡을 발송하세요 (15P/건)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">보유 포인트</div>
              <div className="text-2xl font-bold text-green-600">
                {user?.points.toLocaleString()}P
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 발송 설정 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 카카오 채널 및 템플릿 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
                카카오 채널 및 템플릿 선택
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 카카오 채널 */}
              <div className="space-y-2">
                <Label>카카오 채널</Label>
                {kakaoChannels.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-900 mb-1">
                          등록된 카카오 채널이 없습니다
                        </div>
                        <Button
                          onClick={() => router.push("/dashboard/kakao-channel")}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white mt-2"
                          size="sm"
                        >
                          카카오 채널 등록하러 가기
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Select value={selectedKakaoChannel} onValueChange={setSelectedKakaoChannel}>
                    <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                      <SelectValue placeholder="카카오 채널 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {kakaoChannels.map((channel) => (
                        <SelectItem key={channel.channelId} value={channel.channelId}>
                          💬 {channel.channelName} ({channel.phoneNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 템플릿 로드 버튼 */}
              {selectedKakaoChannel && (
                <Button
                  onClick={loadTemplates}
                  disabled={templatesLoading}
                  className="w-full"
                  variant="outline"
                >
                  {templatesLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      템플릿 로딩 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Solapi에서 템플릿 불러오기
                    </>
                  )}
                </Button>
              )}

              {/* 템플릿 선택 */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>알림톡 템플릿</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.templateId} value={template.templateId}>
                          {template.templateName} ({template.templateCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 템플릿 내용 표시 */}
              {selectedTemplate && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                  <div className="font-semibold text-yellow-900">템플릿 내용</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </div>
                  {selectedTemplate.variables.length > 0 && (
                    <div className="pt-3 border-t border-yellow-200">
                      <div className="text-sm font-semibold text-yellow-900 mb-2">
                        📝 변수 값 입력
                      </div>
                      <div className="space-y-2">
                        {selectedTemplate.variables.map((varName) => (
                          <div key={varName}>
                            <Label className="text-xs">{varName}</Label>
                            <Input
                              value={templateVariables[varName] || ""}
                              onChange={(e) =>
                                setTemplateVariables({
                                  ...templateVariables,
                                  [varName]: e.target.value,
                                })
                              }
                              placeholder={`${varName} 값 입력`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button onClick={generatePreview} variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </Button>
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="students">학생 선택</TabsTrigger>
                  <TabsTrigger value="manual">직접 입력</TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>학생 목록 ({students.length}명)</Label>
                    <Button onClick={handleSelectAllStudents} variant="outline" size="sm">
                      {selectedStudents.length === students.length ? "전체 해제" : "전체 선택"}
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                    {students.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        학부모 연락처가 등록된 학생이 없습니다
                      </div>
                    ) : (
                      students.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedStudents.includes(student.id)
                              ? "border-yellow-500 bg-yellow-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleStudentSelection(student.id)}
                        >
                          <div>
                            <div className="font-semibold">{student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.parentName} · {student.parentPhone}
                            </div>
                          </div>
                          {selectedStudents.includes(student.id) && (
                            <CheckCircle className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  {manualRecipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="이름"
                        value={recipient.name}
                        onChange={(e) => updateManualRecipient(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="전화번호 (010-1234-5678)"
                        value={recipient.phone}
                        onChange={(e) => updateManualRecipient(index, "phone", e.target.value)}
                        className="flex-1"
                      />
                      {manualRecipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeManualRecipient(index)}
                        >
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addManualRecipient} variant="outline" className="w-full">
                    + 수신자 추가
                  </Button>
                </TabsContent>
              </Tabs>
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">수신자</span>
                  <span className="font-semibold">{recipientCount}명</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">포인트/건</span>
                  <span className="font-semibold">{KAKAO_COST}P</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">총 차감 포인트</span>
                  <span className="font-semibold text-orange-600">{totalCost}P</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">잔여 포인트</span>
                  <span className="font-semibold text-green-600">
                    {((user?.points || 0) - totalCost).toLocaleString()}P
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || recipientCount === 0 || !selectedTemplateId}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    알림톡 발송하기
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <div>• 알림톡은 15P/건이 차감됩니다</div>
                <div>• 승인된 템플릿만 사용 가능합니다</div>
                <div>• 발송 실패 시 자동으로 SMS로 전환됩니다</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 미리보기 다이얼로그 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메시지 미리보기</DialogTitle>
            <DialogDescription>
              실제 발송되는 메시지의 예시입니다 (변수는 샘플 값으로 표시됩니다)
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="whitespace-pre-wrap">{previewContent}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
