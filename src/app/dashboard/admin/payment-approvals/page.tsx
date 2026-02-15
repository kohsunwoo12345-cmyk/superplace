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
  AlertCircle,
  ShoppingCart,
  Package,
  Mail,
  Phone
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

interface PurchaseRequest {
  id: string;
  productId: string;
  productName: string;
  directorUserId: string;
  directorName: string;
  directorEmail: string;
  directorPhone: string;
  paymentMethod: string;
  subscriptionMonths: number;
  totalPrice: number;
  status: string;
  notes?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
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
  const [activeTab, setActiveTab] = useState<"subscriptions" | "store">("subscriptions");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvals, setApprovals] = useState<PaymentApproval[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });
  const [storeStats, setStoreStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });

  const [selectedApproval, setSelectedApproval] = useState<PaymentApproval | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequest | null>(null);
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

    if (activeTab === "subscriptions") {
      fetchApprovals();
    } else {
      fetchPurchaseRequests();
    }
  }, [router, statusFilter, activeTab]);

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

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true);
      // TODO: Cloudflare Worker API 연결
      // const response = await fetch(`/api/admin/purchase-approvals?status=${statusFilter}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setPurchaseRequests(data.purchaseRequests || []);
      //   setStoreStats(data.stats || {});
      // }
      setPurchaseRequests([]);
      setStoreStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        pendingAmount: 0,
        approvedAmount: 0,
      });
    } catch (error) {
      console.error("구매 요청 데이터 로드 실패:", error);
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

  const handleApprovePurchase = async (purchaseId: string) => {
    if (!confirm("이 구매 요청을 승인하시겠습니까? AI 봇이 자동으로 할당됩니다.")) return;

    alert("구매 승인 API가 Cloudflare Worker에서 구현되어야 합니다.");
    // TODO: Cloudflare Worker API 연결
  };

  const handleRejectPurchase = async (purchaseId: string) => {
    if (!rejectedReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    if (!confirm("이 구매 요청을 거부하시겠습니까?")) return;

    alert("구매 거부 API가 Cloudflare Worker에서 구현되어야 합니다.");
    // TODO: Cloudflare Worker API 연결
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

  const currentStats = activeTab === "subscriptions" ? stats : storeStats;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">💳 결제 승인 관리</h1>
        <p className="text-gray-600">학원 구독 및 AI 봇 쇼핑몰 구매 요청을 승인하거나 거부합니다</p>
      </div>

      {/* 탭 선택 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab("subscriptions")}
              variant={activeTab === "subscriptions" ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              학원 구독
              {stats.pending > 0 && (
                <Badge className="ml-2 bg-yellow-500">{stats.pending}</Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab("store")}
              variant={activeTab === "store" ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              AI 봇 쇼핑몰
              {storeStats.pending > 0 && (
                <Badge className="ml-2 bg-yellow-500">{storeStats.pending}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.total}건</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{currentStats.pending}건</div>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(currentStats.pendingAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentStats.approved}건</div>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(currentStats.approvedAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">거부됨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{currentStats.rejected}건</div>
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
          <CardTitle>
            {activeTab === "subscriptions" ? "학원 구독 결제 요청 목록" : "AI 봇 쇼핑몰 구매 요청 목록"}
          </CardTitle>
          <CardDescription>
            {activeTab === "subscriptions" ? `${approvals.length}개의 요청` : `${purchaseRequests.length}개의 요청`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "subscriptions" ? (
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
          ) : (
            /* AI 봇 쇼핑몰 구매 요청 목록 */
            <div className="space-y-4">
              {purchaseRequests.map((purchase) => (
                <Card key={purchase.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            <h3 className="text-xl font-bold">{purchase.productName}</h3>
                          </div>
                          {getStatusBadge(purchase.status.toLowerCase())}
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-semibold">{purchase.directorName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{purchase.directorEmail}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{purchase.directorPhone}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">신청: {formatDateTime(purchase.createdAt)}</span>
                        </div>

                        {purchase.notes && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-600">요청사항: {purchase.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-3xl font-bold text-purple-600">
                            {formatCurrency(purchase.totalPrice)}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{purchase.subscriptionMonths}개월 구독</Badge>
                            {getPaymentMethodBadge(purchase.paymentMethod)}
                          </div>
                        </div>

                        {purchase.status === "PENDING" && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprovePurchase(purchase.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                승인 (봇 자동 할당)
                              </Button>
                              <Button
                                onClick={() => setSelectedPurchase(purchase)}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                거부
                              </Button>
                            </div>
                            {selectedPurchase?.id === purchase.id && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="거부 사유 입력 (필수)"
                                  value={rejectedReason}
                                  onChange={(e) => setRejectedReason(e.target.value)}
                                  rows={3}
                                />
                                <Button
                                  onClick={() => handleRejectPurchase(purchase.id)}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  거부 확정
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {purchase.status === "APPROVED" && purchase.approvedAt && (
                          <div className="text-sm text-green-600">
                            승인 완료: {formatDateTime(purchase.approvedAt)}
                            {purchase.botAssignmentId && (
                              <p className="mt-1">봇 할당 ID: {purchase.botAssignmentId}</p>
                            )}
                          </div>
                        )}

                        {purchase.status === "REJECTED" && purchase.rejectionReason && (
                          <div className="bg-red-50 p-3 rounded">
                            <p className="text-sm text-red-600">거부 사유: {purchase.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {purchaseRequests.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI 봇 쇼핑몰 구매 요청이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
