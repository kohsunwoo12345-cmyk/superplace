"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Building,
  User,
  FileText,
  Download,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Registration {
  id: string;
  phone_number: string;
  company_name: string;
  business_number: string;
  representative_name: string;
  representative_phone: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  telecom_certificate_url?: string;
  employment_certificate_url?: string;
  usage_agreement_url?: string;
  proxy_application_url?: string;
  createdAt: string;
  approvedAt?: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

export default function SMSRegistrationApprovalPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/sms/registration/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error("등록 신청 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    if (!confirm("이 신청을 승인하시겠습니까?")) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/sms/registration/${registrationId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("신청이 승인되었습니다");
        fetchRegistrations();
        setSelectedRegistration(null);
      } else {
        toast.error(data.error || "승인 실패");
      }
    } catch (error) {
      console.error("승인 오류:", error);
      toast.error("승인 중 오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error("거부 사유를 입력해주세요");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/sms/registration/${selectedRegistration.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("신청이 거부되었습니다");
        fetchRegistrations();
        setShowRejectDialog(false);
        setSelectedRegistration(null);
        setRejectionReason("");
      } else {
        toast.error(data.error || "거부 실패");
      }
    } catch (error) {
      console.error("거부 오류:", error);
      toast.error("거부 중 오류가 발생했습니다");
    } finally {
      setActionLoading(false);
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

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-teal-600" />
            발신번호 등록 승인 관리
          </h1>
          <p className="text-gray-600 mt-1">
            사용자의 발신번호 등록 신청을 검토하고 승인하세요
          </p>
        </div>

        {/* 필터 */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            전체 ({registrations.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            검토중 ({registrations.filter((r) => r.status === "pending").length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className={filter === "approved" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            승인됨 ({registrations.filter((r) => r.status === "approved").length})
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
            className={filter === "rejected" ? "bg-red-500 hover:bg-red-600" : ""}
          >
            거부됨 ({registrations.filter((r) => r.status === "rejected").length})
          </Button>
        </div>

        {/* 등록 신청 목록 */}
        {filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록 신청이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 상태 및 기본 정보 */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="font-bold text-lg">{registration.phone_number}</span>
                          {getStatusBadge(registration.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building className="w-4 h-4" />
                            <span><strong>회사명:</strong> {registration.company_name}</span>
                          </div>
                          {registration.business_number && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span><strong>사업자번호:</strong> {registration.business_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span><strong>대표자:</strong> {registration.representative_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span><strong>연락처:</strong> {registration.representative_phone}</span>
                          </div>
                        </div>

                        {registration.createdBy && (
                          <div className="text-sm text-gray-500">
                            신청자: {registration.createdBy.name} ({registration.createdBy.email})
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          신청일: {new Date(registration.createdAt).toLocaleString("ko-KR")}
                        </div>

                        {registration.rejection_reason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                            <strong className="text-red-900">거부 사유:</strong>
                            <p className="text-sm text-red-800 mt-1">{registration.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 첨부 서류 */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        첨부 서류
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {registration.telecom_certificate_url && (
                          <a
                            href={registration.telecom_certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 text-sm"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                            <span className="truncate">통신사가입증명원</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        )}
                        {registration.employment_certificate_url && (
                          <a
                            href={registration.employment_certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 text-sm"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                            <span className="truncate">재직증명서</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        )}
                        {registration.usage_agreement_url && (
                          <a
                            href={registration.usage_agreement_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 text-sm"
                          >
                            <Download className="w-4 h-4 text-purple-600" />
                            <span className="truncate">이용계약서</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        )}
                        {registration.proxy_application_url && (
                          <a
                            href={registration.proxy_application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 text-sm"
                          >
                            <Download className="w-4 h-4 text-orange-600" />
                            <span className="truncate">대리 신청서</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    {registration.status === "pending" && (
                      <div className="flex gap-2 border-t pt-4">
                        <Button
                          onClick={() => handleApprove(registration.id)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowRejectDialog(true);
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          거부
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 거부 사유 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 거부</DialogTitle>
            <DialogDescription>
              거부 사유를 입력해주세요. 신청자에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">거부 사유</Label>
              <Textarea
                id="rejection_reason"
                placeholder="서류가 불완전합니다..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  거부하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
