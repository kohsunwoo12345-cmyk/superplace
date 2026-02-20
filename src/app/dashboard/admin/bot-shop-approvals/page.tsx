"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Bot,
  User,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";

interface BotPurchaseRequest {
  id: string;
  academyId: string;
  academyName: string;
  botId: string;
  botName: string;
  botIcon: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  durationMonths: number;
  price: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  requestIp?: string;
  userAgent?: string;
  notes?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export default function BotShopApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [requests, setRequests] = useState<BotPurchaseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  // 상세 모달
  const [selectedRequest, setSelectedRequest] = useState<BotPurchaseRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    
    // 관리자 권한 체크
    if (!["SUPER_ADMIN", "ADMIN"].includes(userData.role)) {
      alert("관리자 권한이 필요합니다.");
      router.push("/dashboard/admin");
      return;
    }
    
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/bot-purchase-requests", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 봇 구매 요청 로드:', data.requests?.length || 0, '개');
        setRequests(data.requests || []);
      } else {
        console.error('봇 구매 요청 로드 실패:', response.status);
        setRequests([]);
      }
    } catch (error) {
      console.error("봇 구매 요청 로드 오류:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm("이 구매 요청을 승인하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bot-purchase-requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert("구매 요청이 승인되었습니다.");
        setShowDetailModal(false);
        fetchRequests();
      } else {
        const data = await response.json();
        alert(data.error || "승인 실패");
      }
    } catch (error) {
      console.error("승인 오류:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert("거절 사유를 입력해주세요.");
      return;
    }

    if (!confirm("이 구매 요청을 거절하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bot-purchase-requests/${requestId}/reject`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        alert("구매 요청이 거절되었습니다.");
        setShowDetailModal(false);
        setRejectionReason("");
        fetchRequests();
      } else {
        const data = await response.json();
        alert(data.error || "거절 실패");
      }
    } catch (error) {
      console.error("거절 오류:", error);
      alert("거절 중 오류가 발생했습니다.");
    }
  };

  const openDetailModal = (request: BotPurchaseRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setRejectionReason("");
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.academyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.botName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedByEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "PENDING").length,
    approved: requests.filter(r => r.status === "APPROVED").length,
    rejected: requests.filter(r => r.status === "REJECTED").length,
    totalRevenue: requests
      .filter(r => r.status === "APPROVED")
      .reduce((sum, r) => sum + r.price, 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">대기중</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-700 border-green-200">승인됨</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 border-red-200">거절됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-purple-600" />
            봇 쇼핑몰 결제 승인
          </h1>
          <p className="text-gray-600 mt-1">
            학원장들의 봇 구매 요청을 승인하거나 거절합니다
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin")}
        >
          대시보드로
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-600">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              승인됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              거절됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-3xl font-bold text-red-600">{stats.rejected}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="학원명, 봇 이름, 요청자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">상태 필터</label>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "ALL" ? "default" : "outline"}
                  onClick={() => setFilterStatus("ALL")}
                  className="flex-1"
                >
                  전체
                </Button>
                <Button
                  variant={filterStatus === "PENDING" ? "default" : "outline"}
                  onClick={() => setFilterStatus("PENDING")}
                  className="flex-1"
                >
                  대기중
                </Button>
                <Button
                  variant={filterStatus === "APPROVED" ? "default" : "outline"}
                  onClick={() => setFilterStatus("APPROVED")}
                  className="flex-1"
                >
                  승인됨
                </Button>
                <Button
                  variant={filterStatus === "REJECTED" ? "default" : "outline"}
                  onClick={() => setFilterStatus("REJECTED")}
                  className="flex-1"
                >
                  거절됨
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 요청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>구매 요청 목록</CardTitle>
          <CardDescription>
            총 {filteredRequests.length}개의 요청
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>구매 요청이 없습니다.</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openDetailModal(request)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{request.botIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{request.academyName}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Bot className="w-4 h-4" />
                          <span className="font-medium">{request.botName}</span>
                          <span className="text-gray-500">• {request.durationMonths}개월</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{request.requestedByName} ({request.requestedByEmail})</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(request.requestedAt)}</span>
                          </div>
                          {request.requestIp && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>IP: {request.requestIp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(request.price)}
                    </p>
                    {request.status === "PENDING" && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(request);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 상세 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
                구매 요청 상세
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(selectedRequest.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 학원 정보 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  학원 정보
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">학원명:</span>
                    <p className="font-semibold">{selectedRequest.academyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">학원 ID:</span>
                    <p className="font-mono text-sm">{selectedRequest.academyId}</p>
                  </div>
                </div>
              </div>

              {/* 봇 정보 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  봇 정보
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedRequest.botIcon}</span>
                    <div>
                      <p className="font-semibold text-lg">{selectedRequest.botName}</p>
                      <p className="text-sm text-gray-600">ID: {selectedRequest.botId}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-600">구독 기간:</span>
                    <p className="font-semibold text-lg text-blue-600">
                      {selectedRequest.durationMonths}개월
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">금액:</span>
                    <p className="font-semibold text-2xl text-green-600">
                      {formatCurrency(selectedRequest.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 요청자 정보 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  요청자 정보
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">이름:</span>
                    <p className="font-semibold">{selectedRequest.requestedByName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">이메일:</span>
                    <p className="font-mono text-sm">{selectedRequest.requestedByEmail}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">사용자 ID:</span>
                    <p className="font-mono text-sm">{selectedRequest.requestedBy}</p>
                  </div>
                </div>
              </div>

              {/* 요청 상세 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  요청 상세
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">요청 시간:</span>
                    <p className="font-semibold">{formatDate(selectedRequest.requestedAt)}</p>
                  </div>
                  {selectedRequest.requestIp && (
                    <div>
                      <span className="text-sm text-gray-600">요청 IP:</span>
                      <p className="font-mono text-sm">{selectedRequest.requestIp}</p>
                    </div>
                  )}
                  {selectedRequest.userAgent && (
                    <div>
                      <span className="text-sm text-gray-600">User Agent:</span>
                      <p className="font-mono text-xs text-gray-600 break-all">
                        {selectedRequest.userAgent}
                      </p>
                    </div>
                  )}
                  {selectedRequest.notes && (
                    <div>
                      <span className="text-sm text-gray-600">메모:</span>
                      <p className="text-sm">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 승인/거절 정보 */}
              {selectedRequest.status !== "PENDING" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    처리 정보
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedRequest.approvedAt && (
                      <>
                        <div>
                          <span className="text-sm text-gray-600">승인 시간:</span>
                          <p className="font-semibold">{formatDate(selectedRequest.approvedAt)}</p>
                        </div>
                        {selectedRequest.approvedBy && (
                          <div>
                            <span className="text-sm text-gray-600">승인자:</span>
                            <p className="font-mono text-sm">{selectedRequest.approvedBy}</p>
                          </div>
                        )}
                      </>
                    )}
                    {selectedRequest.rejectedAt && (
                      <>
                        <div>
                          <span className="text-sm text-gray-600">거절 시간:</span>
                          <p className="font-semibold">{formatDate(selectedRequest.rejectedAt)}</p>
                        </div>
                        {selectedRequest.rejectedBy && (
                          <div>
                            <span className="text-sm text-gray-600">거절자:</span>
                            <p className="font-mono text-sm">{selectedRequest.rejectedBy}</p>
                          </div>
                        )}
                        {selectedRequest.rejectionReason && (
                          <div>
                            <span className="text-sm text-gray-600">거절 사유:</span>
                            <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                              {selectedRequest.rejectionReason}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 거절 사유 입력 (PENDING 상태일 때만) */}
              {selectedRequest.status === "PENDING" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    거절 사유 (거절 시 필수)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="거절 사유를 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                  />
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.status === "PENDING" ? (
                  <>
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      승인
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedRequest.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      거절
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={closeDetailModal}
                    variant="outline"
                    className="flex-1"
                  >
                    닫기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
