"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Mail,
  Phone,
  Package
} from "lucide-react";

interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  academyId?: string;
  planId: string;
  planName: string;
  period: string;
  paymentMethod: string;
  originalPrice: number;
  discountedPrice: number;
  finalPrice: number;
  paymentInfo?: string;
  status: string;
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
  approvedBy?: string;
  approvedByEmail?: string;
  planInfo?: {
    name: string;
    price_1month: number;
    price_6months: number;
    price_12months: number;
    correctPrice: number;
  };
}

export default function SubscriptionApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

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

    fetchRequests();
  }, [router, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/subscription-approvals?status=${statusFilter}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Subscription requests:', data);
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("요금제 신청 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("이 요금제 신청을 승인하시겠습니까?")) return;

    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const response = await fetch(`/api/admin/subscription-approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId,
          action: 'approve',
          adminName: userData?.name || 'Admin',
          adminEmail: userData?.email || 'admin@superplace.co.kr',
          adminNote: adminNote.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ 요금제 신청이 승인되었습니다.");
        setSelectedRequest(null);
        setAdminNote("");
        fetchRequests();
      } else {
        alert(`❌ 승인 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("승인 실패:", error);
      alert("❌ 승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!adminNote.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    if (!confirm("이 요금제 신청을 거부하시겠습니까?")) return;

    try {
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;

      const response = await fetch(`/api/admin/subscription-approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId,
          action: 'reject',
          adminName: userData?.name || 'Admin',
          adminEmail: userData?.email || 'admin@superplace.co.kr',
          adminNote: adminNote.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ 요금제 신청이 거부되었습니다.");
        setSelectedRequest(null);
        setAdminNote("");
        fetchRequests();
      } else {
        alert(`❌ 거부 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("거부 실패:", error);
      alert("❌ 거부 중 오류가 발생했습니다.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '1month':
        return '1개월';
      case '6months':
        return '6개월';
      case '12months':
        return '12개월 (1년)';
      default:
        return period;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />승인 대기</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />승인 완료</Badge>;
      case "rejected":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />거부됨</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
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
        <h1 className="text-3xl font-bold mb-2">📝 요금제 신청 승인</h1>
        <p className="text-gray-600">학원 요금제 신청을 승인하거나 거부합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 신청</CardTitle>
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
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}건</div>
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

      {/* 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>요금제 신청 목록</CardTitle>
          <CardDescription>{requests.length}개의 신청</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-2">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 왼쪽: 신청자 정보 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{request.userName}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{request.userEmail}</span>
                      </div>

                      {request.userPhone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{request.userPhone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">신청: {formatDateTime(request.requestedAt)}</span>
                      </div>

                      {request.processedAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">처리: {formatDateTime(request.processedAt)}</span>
                        </div>
                      )}

                      {request.adminNote && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">관리자 메모</p>
                          <p className="text-sm">{request.adminNote}</p>
                        </div>
                      )}
                    </div>

                    {/* 오른쪽: 요금제 정보 */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <h4 className="text-lg font-semibold">{request.planInfo?.name || request.planName}</h4>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {getPeriodLabel(request.period)}
                        </Badge>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">결제 금액</p>
                        <div className="text-3xl font-bold text-blue-600">
                          {request.planInfo?.correctPrice 
                            ? formatCurrency(request.planInfo.correctPrice)
                            : formatCurrency(request.finalPrice)}
                        </div>
                        {request.planInfo && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>• 1개월: {formatCurrency(request.planInfo.price_1month)}</p>
                            <p>• 6개월: {formatCurrency(request.planInfo.price_6months)}</p>
                            <p>• 12개월: {formatCurrency(request.planInfo.price_12months)}</p>
                          </div>
                        )}
                      </div>

                      {request.paymentMethod && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            결제 방법: {request.paymentMethod === 'card' ? '카드' : 
                                       request.paymentMethod === 'transfer' ? '계좌이체' : 
                                       request.paymentMethod}
                          </span>
                        </div>
                      )}

                      {request.status === "pending" && (
                        <div className="space-y-2 mt-4">
                          <Textarea
                            placeholder="관리자 메모 (선택사항)"
                            value={selectedRequest?.id === request.id ? adminNote : ""}
                            onChange={(e) => {
                              setSelectedRequest(request);
                              setAdminNote(e.target.value);
                            }}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              승인
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              거부
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>요금제 신청이 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
