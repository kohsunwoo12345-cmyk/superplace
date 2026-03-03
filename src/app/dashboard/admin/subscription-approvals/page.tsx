"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

interface PaymentApproval {
  id: number;
  academyId: string;
  academyName: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  period: string;
  paymentMethod: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  transactionId: string | null;
  notes: string;
  price_1month: number;
  price_6months: number;
  price_12months: number;
  // Parsed from notes
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingAmount: number;
  approvedAmount: number;
}

export default function PaymentApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvals, setApprovals] = useState<PaymentApproval[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });

  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");

  useEffect(() => {
    // Check admin role
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== "ADMIN") {
          alert("관리자만 접근 가능합니다.");
          router.push("/dashboard");
          return;
        }
      } catch (e) {
        router.push("/login");
        return;
      }
    } else {
      router.push("/login");
      return;
    }

    fetchApprovals();
  }, [statusFilter]);

  const parseNotes = (notes: string) => {
    const parsed = {
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
    };

    if (!notes) return parsed;

    // Handle both \n (escaped) and actual newline characters
    const lines = notes.split(/\\n|\n/);
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("이름:")) {
        parsed.applicantName = trimmedLine.replace("이름:", "").trim();
      } else if (trimmedLine.startsWith("이메일:")) {
        parsed.applicantEmail = trimmedLine.replace("이메일:", "").trim();
      } else if (trimmedLine.startsWith("연락처:")) {
        parsed.applicantPhone = trimmedLine.replace("연락처:", "").trim();
      }
    });

    return parsed;
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const url = statusFilter === "all"
        ? "/api/admin/payment-approvals"
        : `/api/admin/payment-approvals?status=${statusFilter}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        
        // Parse notes for each approval
        const parsedApprovals = (data.approvals || []).map((approval: PaymentApproval) => {
          const parsedInfo = parseNotes(approval.notes);
          return {
            ...approval,
            ...parsedInfo,
          };
        });

        setApprovals(parsedApprovals);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Failed to fetch payment approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: number) => {
    if (!transactionId.trim()) {
      alert("거래 ID를 입력해주세요.");
      return;
    }

    if (!confirm("승인하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/payment-approvals?id=${approvalId}&action=approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: "admin-001",
            transactionId: transactionId,
          }),
        }
      );

      if (response.ok) {
        alert("승인되었습니다.");
        setSelectedApproval(null);
        setTransactionId("");
        fetchApprovals();
      } else {
        alert("승인 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (approvalId: number) => {
    if (!rejectedReason.trim()) {
      alert("거절 사유를 입력해주세요.");
      return;
    }

    if (!confirm("거절하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/payment-approvals?id=${approvalId}&action=reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: "admin-001",
            rejectedReason: rejectedReason,
          }),
        }
      );

      if (response.ok) {
        alert("거절되었습니다.");
        setSelectedApproval(null);
        setRejectedReason("");
        fetchApprovals();
      } else {
        alert("거절 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            승인
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            거절
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    return method === "card" ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        <CreditCard className="w-3 h-3 mr-1" />
        카드
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <Building2 className="w-3 h-3 mr-1" />
        계좌이체
      </Badge>
    );
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      "1month": "1개월",
      "6months": "6개월",
      "12months": "12개월",
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">결제 승인 관리</h1>
          <p className="text-gray-600 mt-1">
            요금제 신청 승인 및 관리
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
          대시보드로
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 신청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              승인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats.approvedAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              거절
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
        >
          전체
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending")}
        >
          대기중
        </Button>
        <Button
          variant={statusFilter === "approved" ? "default" : "outline"}
          onClick={() => setStatusFilter("approved")}
        >
          승인
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "default" : "outline"}
          onClick={() => setStatusFilter("rejected")}
        >
          거절
        </Button>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">신청 내역이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          approvals.map((approval) => (
            <Card key={approval.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {approval.academyName || "학원명 없음"}
                    </CardTitle>
                    {getStatusBadge(approval.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    신청 ID: {approval.id}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 신청자 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      신청자 정보
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <strong>이름:</strong>
                        <span>{approval.applicantName || "정보 없음"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <strong>이메일:</strong>
                        <span>{approval.applicantEmail || "정보 없음"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <strong>연락처:</strong>
                        <span>{approval.applicantPhone || "정보 없음"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <strong>신청일시:</strong>
                        <span>{formatDateTime(approval.requestedAt)}</span>
                      </div>
                      
                      {approval.approvedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <strong>처리일시:</strong>
                          <span>{formatDateTime(approval.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 요금제 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      요금제 정보
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <strong>요금제:</strong>
                        <span>{approval.planName}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <strong>기간:</strong>
                        <Badge variant="secondary">
                          {getPeriodLabel(approval.period || "1month")}
                        </Badge>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <strong>금액:</strong>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(approval.amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <strong>결제방법:</strong>
                        {getPaymentMethodBadge(approval.paymentMethod)}
                      </div>

                      {/* 가격표 */}
                      {approval.price_1month && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs font-semibold mb-2 text-gray-600">
                            전체 가격표
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>기간</TableHead>
                                <TableHead className="text-right">금액</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className={approval.period === '1month' ? 'bg-blue-50' : ''}>
                                <TableCell className="font-medium">
                                  1개월
                                  {approval.period === '1month' && (
                                    <Badge variant="default" className="ml-2 text-xs">\u2b50 선택됨</Badge>
                                  )}
                                </TableCell>
                                <TableCell className={`text-right ${
                                  approval.period === '1month' ? 'font-bold text-blue-600' : ''
                                }`}>
                                  {formatCurrency(approval.price_1month)}
                                </TableCell>
                              </TableRow>
                              <TableRow className={approval.period === '6months' ? 'bg-green-50' : ''}>
                                <TableCell className="font-medium">
                                  6개월
                                  {approval.period === '6months' && (
                                    <Badge variant="default" className="ml-2 text-xs bg-green-600">\u2b50 선택됨</Badge>
                                  )}
                                </TableCell>
                                <TableCell className={`text-right ${
                                  approval.period === '6months' ? 'font-bold text-green-600' : ''
                                }`}>
                                  {formatCurrency(approval.price_6months)}
                                </TableCell>
                              </TableRow>
                              <TableRow className={approval.period === '12months' ? 'bg-purple-50' : ''}>
                                <TableCell className="font-medium">
                                  12개월 (연간)
                                  {approval.period === '12months' && (
                                    <Badge variant="default" className="ml-2 text-xs bg-purple-600">\u2b50 선택됨</Badge>
                                  )}
                                </TableCell>
                                <TableCell className={`text-right ${
                                  approval.period === '12months' ? 'font-bold text-purple-600' : ''
                                }`}>
                                  {formatCurrency(approval.price_12months)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 관리자 액션 */}
                {approval.status === "pending" && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedApproval === approval.id ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">거래 ID</label>
                            <Input
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="거래 ID 입력"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(approval.id)}
                                className="flex-1"
                                variant="default"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                승인하기
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedApproval(null);
                                  setTransactionId("");
                                }}
                                variant="outline"
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">거절 사유</label>
                            <Textarea
                              value={rejectedReason}
                              onChange={(e) => setRejectedReason(e.target.value)}
                              placeholder="거절 사유 입력"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReject(approval.id)}
                                className="flex-1"
                                variant="destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                거절하기
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedApproval(null);
                                  setRejectedReason("");
                                }}
                                variant="outline"
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Button
                          onClick={() => setSelectedApproval(approval.id)}
                          className="w-full"
                        >
                          처리하기
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {approval.transactionId && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                      <strong>거래 ID:</strong> {approval.transactionId}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
