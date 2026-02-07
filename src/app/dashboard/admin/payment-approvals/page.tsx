"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard,
  Building2,
  User,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";

interface PaymentApproval {
  id: number;
  academyId: string;
  academyName: string;
  academyPhone?: string;
  academyEmail?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  transactionId?: string;
  notes?: string;
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

  const [selectedApproval, setSelectedApproval] = useState<PaymentApproval | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    const role = userData.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/dashboard");
      return;
    }

    fetchApprovals();
  }, [router, statusFilter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/payment-approvals?status=${statusFilter}`);
      
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error("결제 승인 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: number) => {
    if (!transactionId.trim()) {
      alert("거래 ID를 입력해주세요.");
      return;
    }

    if (!confirm("이 결제를 승인하시겠습니까?")) return;

    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const response = await fetch(`/api/admin/payment-approvals?id=${approvalId}&action=approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: userData?.id,
          transactionId: transactionId.trim()
        })
      });

      if (response.ok) {
        alert("결제가 승인되었습니다.");
        setSelectedApproval(null);
        setTransactionId("");
        fetchApprovals();
      } else {
        alert("결제 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("결제 승인 실패:", error);
      alert("결제 승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (approvalId: number) => {
    if (!rejectedReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    if (!confirm("이 결제를 거부하시겠습니까?")) return;

    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const response = await fetch(`/api/admin/payment-approvals?id=${approvalId}&action=reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: userData?.id,
          rejectedReason: rejectedReason.trim()
        })
      });

      if (response.ok) {
        alert("결제가 거부되었습니다.");
        setSelectedApproval(null);
        setRejectedReason("");
        fetchApprovals();
      } else {
        alert("결제 거부에 실패했습니다.");
      }
    } catch (error) {
      console.error("결제 거부 실패:", error);
      alert("결제 거부 중 오류가 발생했습니다.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />승인됨</Badge>;
      case "rejected":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />거부됨</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "card":
        return <Badge variant="outline"><CreditCard className="w-3 h-3 mr-1" />카드</Badge>;
      case "transfer":
        return <Badge variant="outline">계좌이체</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">💳 결제 승인 관리</h1>
        <p className="text-gray-600">학원 구독 결제 요청을 승인하거나 거부합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}건</div>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.pendingAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}건</div>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.approvedAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">거부됨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}건</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setStatusFilter("all")}
              variant={statusFilter === "all" ? "default" : "outline"}
            >
              전체
            </Button>
            <Button
              onClick={() => setStatusFilter("pending")}
              variant={statusFilter === "pending" ? "default" : "outline"}
            >
              승인 대기
            </Button>
            <Button
              onClick={() => setStatusFilter("approved")}
              variant={statusFilter === "approved" ? "default" : "outline"}
            >
              승인 완료
            </Button>
            <Button
              onClick={() => setStatusFilter("rejected")}
              variant={statusFilter === "rejected" ? "default" : "outline"}
            >
              거부됨
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 승인 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 승인 요청 목록</CardTitle>
          <CardDescription>{approvals.length}개의 요청</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card key={approval.id} className="border-2">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{approval.academyName || approval.academyId}</h3>
                        {getStatusBadge(approval.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">{approval.academyId}</span>
                      </div>

                      {approval.userName && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{approval.userName} ({approval.userEmail})</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">신청: {formatDateTime(approval.requestedAt)}</span>
                      </div>

                      {approval.transactionId && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">거래ID: {approval.transactionId}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-3xl font-bold text-blue-600">
                          {formatCurrency(approval.amount)}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{approval.planName}</Badge>
                          {getPaymentMethodBadge(approval.paymentMethod)}
                        </div>
                      </div>

                      {approval.status === "pending" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="거래 ID 입력 (승인 시 필수)"
                            value={selectedApproval?.id === approval.id ? transactionId : ""}
                            onChange={(e) => {
                              setSelectedApproval(approval);
                              setTransactionId(e.target.value);
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(approval.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              승인
                            </Button>
                            <Button
                              onClick={() => setSelectedApproval(approval)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              거부
                            </Button>
                          </div>
                          {selectedApproval?.id === approval.id && (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="거부 사유 입력 (거부 시 필수)"
                                value={rejectedReason}
                                onChange={(e) => setRejectedReason(e.target.value)}
                                rows={3}
                              />
                              <Button
                                onClick={() => handleReject(approval.id)}
                                variant="destructive"
                                className="w-full"
                              >
                                거부 확정
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {approval.status === "approved" && approval.approvedAt && (
                        <div className="text-sm text-green-600">
                          승인 완료: {formatDateTime(approval.approvedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {approvals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>결제 승인 요청이 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
