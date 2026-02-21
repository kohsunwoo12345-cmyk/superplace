"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";

interface SenderNumber {
  id: string;
  phoneNumber: string;
  purpose?: string;
  status: string;
  verificationDocUrl?: string;
  businessCertUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export default function SenderNumberRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myNumbers, setMyNumbers] = useState<SenderNumber[]>([]);

  // 입력 폼
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [businessCert, setBusinessCert] = useState<File | null>(null);

  useEffect(() => {
    loadMyNumbers();
  }, []);

  const loadMyNumbers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sender-numbers/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyNumbers(data.senderNumbers || []);
      }
    } catch (error) {
      console.error("발신번호 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "verification" | "business"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "verification") {
        setVerificationDoc(file);
      } else {
        setBusinessCert(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!phoneNumber || !verificationDoc) {
      alert("발신번호와 통신서비스이용증명원은 필수입니다.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      // 파일 업로드
      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("purpose", purpose);
      if (verificationDoc) formData.append("verificationDoc", verificationDoc);
      if (businessCert) formData.append("businessCert", businessCert);

      const response = await fetch("/api/sender-numbers/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("✅ 발신번호 등록 신청이 완료되었습니다!\n관리자 승인까지 1-2 영업일이 소요됩니다.");
        setPhoneNumber("");
        setPurpose("");
        setVerificationDoc(null);
        setBusinessCert(null);
        loadMyNumbers();
      } else {
        const error = await response.json();
        alert(`❌ 등록 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("등록 오류:", error);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인완료
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            거절됨
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            승인대기
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8 text-teal-600" />
            발신번호 등록
          </h1>
          <p className="text-gray-600 mt-1">
            문자 발송을 위한 발신번호를 등록하세요
          </p>
        </div>

        {/* 안내 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              발신번호 등록 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>• <strong>전기통신사업법</strong>에 따라 발신번호 사전등록이 필수입니다</p>
            <p>• 등록 신청 후 관리자 승인까지 <strong>1-2 영업일</strong>이 소요됩니다</p>
            <p>• 본인 명의의 전화번호만 등록 가능합니다</p>
            <p>• 필수: 통신서비스이용증명원 (통신사 앱에서 발급 가능)</p>
            <p>• 선택: 사업자등록증 (법인 번호인 경우)</p>
          </CardContent>
        </Card>

        {/* 등록 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>새 발신번호 등록</CardTitle>
            <CardDescription>
              발신번호와 인증 서류를 제출해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>발신번호 *</Label>
              <Input
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={13}
              />
              <p className="text-xs text-gray-500">
                하이픈(-)을 포함하여 입력해주세요
              </p>
            </div>

            <div className="space-y-2">
              <Label>용도</Label>
              <Textarea
                placeholder="예: 학원 공지사항 및 학습 리포트 발송"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>통신서비스이용증명원 * (필수)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {verificationDoc ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-green-600" />
                    <div className="font-medium text-green-700">
                      {verificationDoc.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerificationDoc(null)}
                    >
                      파일 제거
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <Label
                        htmlFor="verification-upload"
                        className="cursor-pointer text-teal-600 font-semibold hover:text-teal-700"
                      >
                        파일 선택
                      </Label>
                      <Input
                        id="verification-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "verification")}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, JPG, PNG 파일 (최대 10MB)
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>통신서비스이용증명원 발급 방법:</strong><br />
                  통신사 앱(SKT, KT, LG U+) → 고객센터 → 증명서 발급 → 통신서비스이용증명원
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>사업자등록증 (선택)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {businessCert ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-green-600" />
                    <div className="font-medium text-green-700">
                      {businessCert.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBusinessCert(null)}
                    >
                      파일 제거
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <Label
                        htmlFor="business-upload"
                        className="cursor-pointer text-teal-600 font-semibold hover:text-teal-700"
                      >
                        파일 선택
                      </Label>
                      <Input
                        id="business-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "business")}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      법인 번호인 경우 제출해주세요
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!phoneNumber || !verificationDoc || submitting}
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  발신번호 등록 신청
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 등록 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>내 발신번호 목록</CardTitle>
            <CardDescription>
              등록한 발신번호의 승인 현황을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myNumbers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 발신번호가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {myNumbers.map((number) => (
                  <div
                    key={number.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-lg">
                        {number.phoneNumber}
                      </div>
                      {getStatusBadge(number.status)}
                    </div>

                    {number.purpose && (
                      <div className="text-sm text-gray-600">
                        <strong>용도:</strong> {number.purpose}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div>신청일: {new Date(number.createdAt).toLocaleDateString("ko-KR")}</div>
                      {number.approvedAt && (
                        <div>승인일: {new Date(number.approvedAt).toLocaleDateString("ko-KR")}</div>
                      )}
                    </div>

                    {number.status === "REJECTED" && number.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-semibold text-red-900 mb-1">
                          거절 사유
                        </div>
                        <div className="text-sm text-red-700">
                          {number.rejectionReason}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {number.verificationDocUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(number.verificationDocUrl, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          통신서비스이용증명원
                        </Button>
                      )}
                      {number.businessCertUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(number.businessCertUrl, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          사업자등록증
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 참고 자료 */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">📚 참고 자료</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div>
              <strong>통신서비스이용증명원 발급:</strong>
              <ul className="ml-6 mt-1 list-disc space-y-1">
                <li>SKT: T world 앱 → 고객지원 → 증명서</li>
                <li>KT: My KT 앱 → 전체메뉴 → 증명서</li>
                <li>LG U+: U+ 고객센터 앱 → 증명서</li>
              </ul>
            </div>
            <div className="pt-2">
              <strong>승인 기준:</strong>
              <ul className="ml-6 mt-1 list-disc space-y-1">
                <li>본인 명의 전화번호</li>
                <li>명확한 사용 목적</li>
                <li>유효한 인증 서류</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
