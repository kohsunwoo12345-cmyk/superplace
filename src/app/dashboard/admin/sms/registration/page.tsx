"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Phone,
  Building,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Registration {
  id: string;
  phone_number: string;
  company_name: string;
  business_number: string;
  representative_name: string;
  representative_phone: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  createdAt: string;
  approvedAt?: string;
}

export default function SMSRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    phone_number: "",
    company_name: "",
    business_number: "",
    representative_name: "",
    representative_phone: "",
  });

  const [files, setFiles] = useState({
    telecom_certificate: null as File | null,
    employment_certificate: null as File | null,
    usage_agreement: null as File | null,
    proxy_application: null as File | null,
  });

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/registration", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error("등록 이력 조회 실패:", error);
    }
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleDownloadTemplate = (filename: string) => {
    const link = document.createElement("a");
    link.href = `/documents/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 입력 검증
    if (!formData.phone_number || !formData.company_name || !formData.representative_name || !formData.representative_phone) {
      toast.error("필수 입력 항목을 모두 입력해주세요.");
      return;
    }

    // 파일 업로드 검증
    if (!files.telecom_certificate || !files.employment_certificate || !files.usage_agreement || !files.proxy_application) {
      toast.error("모든 서류를 첨부해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("phone_number", formData.phone_number);
      formDataToSend.append("company_name", formData.company_name);
      formDataToSend.append("business_number", formData.business_number);
      formDataToSend.append("representative_name", formData.representative_name);
      formDataToSend.append("representative_phone", formData.representative_phone);
      
      if (files.telecom_certificate) formDataToSend.append("telecom_certificate", files.telecom_certificate);
      if (files.employment_certificate) formDataToSend.append("employment_certificate", files.employment_certificate);
      if (files.usage_agreement) formDataToSend.append("usage_agreement", files.usage_agreement);
      if (files.proxy_application) formDataToSend.append("proxy_application", files.proxy_application);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/registration", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("발신번호 등록 신청이 완료되었습니다!");
        setShowForm(false);
        fetchMyRegistrations();
        
        // 폼 초기화
        setFormData({
          phone_number: "",
          company_name: "",
          business_number: "",
          representative_name: "",
          representative_phone: "",
        });
        setFiles({
          telecom_certificate: null,
          employment_certificate: null,
          usage_agreement: null,
          proxy_application: null,
        });
      } else {
        toast.error(data.error || "등록 신청 실패");
      }
    } catch (error) {
      console.error("등록 신청 오류:", error);
      toast.error("등록 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> 승인됨</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> 검토중</Badge>;
      case "rejected":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> 거부됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Phone className="h-8 w-8 text-teal-600" />
              발신번호 등록
            </h1>
            <p className="text-gray-600 mt-1">
              SMS 발송을 위한 발신번호를 등록하세요
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              새 등록 신청
            </Button>
          )}
        </div>

        {/* 안내사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              발신번호 등록 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• 전기통신사업법에 따라 발신번호는 사전 등록이 필수입니다</p>
            <p>• 등록 신청 후 관리자 검토 및 승인이 필요합니다 (1-2 영업일)</p>
            <p>• 아래 서류를 다운로드하여 작성 후 첨부해주세요</p>
            <p>• 모든 서류는 PDF 또는 이미지 파일로 첨부 가능합니다</p>
          </CardContent>
        </Card>

        {/* 서류 다운로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              필수 서류 다운로드
            </CardTitle>
            <CardDescription>
              아래 서류를 다운로드하여 작성 후 첨부해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleDownloadTemplate("발신번호_사전등록_대리_신청서.pdf")}
              >
                <FileText className="w-5 h-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">발신번호 사전등록 대리 신청서</div>
                  <div className="text-xs text-gray-500">PDF 양식</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleDownloadTemplate("발신번호_사전등록_대리_신청서.docx")}
              >
                <FileText className="w-5 h-5 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">발신번호 사전등록 대리 신청서</div>
                  <div className="text-xs text-gray-500">DOCX 양식 (편집 가능)</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleDownloadTemplate("문자메시지 이용계약서.pdf")}
              >
                <FileText className="w-5 h-5 mr-3 text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold">문자메시지 이용계약서</div>
                  <div className="text-xs text-gray-500">PDF 양식</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start h-auto p-4 opacity-50"
                disabled
              >
                <FileText className="w-5 h-5 mr-3 text-orange-600" />
                <div className="text-left">
                  <div className="font-semibold">통신사가입증명원</div>
                  <div className="text-xs text-gray-500">통신사에서 발급</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 신청 폼 */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>발신번호 등록 신청</CardTitle>
              <CardDescription>
                아래 정보를 입력하고 서류를 첨부해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">발신번호 *</Label>
                    <Input
                      id="phone_number"
                      placeholder="010-1234-5678"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">회사명 *</Label>
                    <Input
                      id="company_name"
                      placeholder="주식회사 OOO"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_number">사업자등록번호</Label>
                    <Input
                      id="business_number"
                      placeholder="123-45-67890"
                      value={formData.business_number}
                      onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representative_name">대표자명 *</Label>
                    <Input
                      id="representative_name"
                      placeholder="홍길동"
                      value={formData.representative_name}
                      onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representative_phone">대표자 연락처 *</Label>
                    <Input
                      id="representative_phone"
                      placeholder="010-1234-5678"
                      value={formData.representative_phone}
                      onChange={(e) => setFormData({ ...formData, representative_phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* 서류 첨부 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">서류 첨부 *</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telecom_certificate">통신사가입증명원 *</Label>
                      <Input
                        id="telecom_certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("telecom_certificate", e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employment_certificate">재직증명서 *</Label>
                      <Input
                        id="employment_certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("employment_certificate", e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usage_agreement">문자메시지 이용계약서 *</Label>
                      <Input
                        id="usage_agreement"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("usage_agreement", e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proxy_application">발신번호 사전등록 대리 신청서 *</Label>
                      <Input
                        id="proxy_application"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange("proxy_application", e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        신청 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        신청하기
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 내 등록 이력 */}
        <Card>
          <CardHeader>
            <CardTitle>내 등록 이력</CardTitle>
            <CardDescription>
              발신번호 등록 신청 내역을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myRegistrations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>등록 신청 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map((registration) => (
                  <Card key={registration.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{registration.phone_number}</span>
                            {getStatusBadge(registration.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{registration.company_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{registration.representative_name} ({registration.representative_phone})</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            신청일: {new Date(registration.createdAt).toLocaleString("ko-KR")}
                          </div>
                          {registration.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              <strong>거부 사유:</strong> {registration.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
