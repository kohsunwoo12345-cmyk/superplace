"use client";
// AI 쇼핑몰 구매 승인 관리 페이지 (구독 시스템)

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  Bot,
  User,
  Search,
  AlertCircle,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";

interface BotPurchaseRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  academyId: string;
  academyName: string;
  productId: string;
  productName: string;
  studentCount: number;
  months: number;
  pricePerStudent: number;
  totalPrice: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  depositBank: string;
  depositorName: string;
  attachmentUrl?: string;
  requestMessage?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
}

export default function BotShopApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [requests, setRequests] = useState<BotPurchaseRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  // 상세 모달
  const [selectedRequest, setSelectedRequest] = useState<BotPurchaseRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [approvedStudentCount, setApprovedStudentCount] = useState<number>(0);

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
      router.push("/dashboard");
      return;
    }
    
    fetchRequests();
  }, [router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bot-purchase-requests/list?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 구매 요청 로드:', result.data.requests?.length || 0, '개');
        setRequests(result.data.requests || []);
        setStats(result.data.stats || stats);
      } else {
        console.error('구매 요청 로드 실패:', response.status);
        setRequests([]);
      }
    } catch (error) {
      console.error("구매 요청 로드 오류:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [filterStatus]);

  const handleApprove = async (requestId: string) => {
    if (!approvedStudentCount || approvedStudentCount <= 0) {
      alert("승인할 학생 수를 입력해주세요.");
      return;
    }

    if (!confirm(`이 구매 요청을 승인하시겠습니까?\n\n학생 슬롯: ${approvedStudentCount}개\n\n승인 시 학원에 구독 슬롯이 할당됩니다.`)) {
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bot-purchase-requests/approve`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          requestId,
          studentCount: approvedStudentCount  // 관리자가 수정한 학생 수 전달
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ 구매 요청이 승인되었습니다!\n\n학생 슬롯 ${result.data.subscription.totalStudentSlots}개가 할당되었습니다.`);
        setShowDetailModal(false);
        fetchRequests();
      } else {
        const data = await response.json();
        alert(`❌ 승인 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("승인 오류:", error);
      alert(`❌ 승인 중 오류 발생: ${error.message}`);
    } finally {
      setProcessing(false);
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

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bot-purchase-requests/reject`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, rejectionReason })
      });

      if (response.ok) {
        alert("✅ 구매 요청이 거절되었습니다.");
        setShowDetailModal(false);
        setRejectionReason("");
        fetchRequests();
      } else {
        const data = await response.json();
        alert(`❌ 거절 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("거절 오류:", error);
      alert(`❌ 거절 중 오류 발생: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openDetailModal = (request: BotPurchaseRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setRejectionReason("");
    setApprovedStudentCount(request.studentCount); // 요청된 학생 수로 초기화
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
  };

  const filteredRequests = requests.filter((request) => {
    if (!request) return false;
    
    const matchesSearch = 
      (request.academyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> 대기중</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> 승인됨</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> 거절됨</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">구매 요청 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI 쇼핑몰 구매 승인</h1>
          </div>
          <p className="text-gray-600">학원장의 AI 봇 구독 신청을 검토하고 승인/거절하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                전체 요청
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                대기중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                승인됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                거절됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                총 매출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="학원명, 제품명, 신청자 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 w-full md:w-[400px]">
                  <TabsTrigger value="ALL">전체</TabsTrigger>
                  <TabsTrigger value="PENDING">대기중</TabsTrigger>
                  <TabsTrigger value="APPROVED">승인됨</TabsTrigger>
                  <TabsTrigger value="REJECTED">거절됨</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* 요청 목록 */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>구매 요청이 없습니다.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* 왼쪽: 요청 정보 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900">{request.productName}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{request.academyName || '학원 정보 없음'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700"><strong>{request.studentCount}명</strong> (학생)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700"><strong>{request.months}개월</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{formatCurrency(request.pricePerStudent)}/학생/월</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-blue-600">{formatCurrency(request.totalPrice)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{request.userName} ({request.userEmail})</span>
                      </div>

                      <div className="text-xs text-gray-500">
                        신청일: {formatDate(request.createdAt)}
                      </div>
                    </div>

                    {/* 오른쪽: 액션 버튼 */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        onClick={() => openDetailModal(request)}
                        variant="outline"
                        className="flex-1 md:flex-none"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      
                      {request.status === "PENDING" && (
                        <>
                          <Button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                            disabled={processing}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            승인
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              구매 요청 상세
            </DialogTitle>
            <DialogDescription>
              구매 요청의 상세 정보를 확인하고 승인 또는 거절하세요
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* 상태 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">현재 상태</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* 제품 정보 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  제품 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">제품명</span>
                    <p className="font-medium">{selectedRequest.productName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">학생당 가격</span>
                    <p className="font-medium">{formatCurrency(selectedRequest.pricePerStudent)}/월</p>
                  </div>
                </div>
              </div>

              {/* 구독 정보 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  구독 정보
                </h4>
                <div className="grid grid-cols-3 gap-3 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">학생 수</span>
                    <p className="font-medium text-xl">{selectedRequest.studentCount}명</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">구독 기간</span>
                    <p className="font-medium text-xl">{selectedRequest.months}개월</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">총 금액</span>
                    <p className="font-bold text-xl text-blue-600">{formatCurrency(selectedRequest.totalPrice)}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  💡 계산식: {selectedRequest.studentCount}명 × {selectedRequest.months}개월 × {formatCurrency(selectedRequest.pricePerStudent)} = {formatCurrency(selectedRequest.totalPrice)}
                </div>
              </div>

              {/* 학원 및 신청자 정보 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  학원 및 신청자 정보
                </h4>
                <div className="grid grid-cols-1 gap-3 p-4 bg-green-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">학원명</span>
                    <p className="font-medium">{selectedRequest.academyName || '정보 없음'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">신청자</span>
                    <p className="font-medium">{selectedRequest.userName} ({selectedRequest.userEmail})</p>
                  </div>
                </div>
              </div>

              {/* 입금 정보 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  입금 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">입금 은행</span>
                    <p className="font-medium">{selectedRequest.depositBank}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">입금자명</span>
                    <p className="font-medium">{selectedRequest.depositorName}</p>
                  </div>
                </div>
                {selectedRequest.attachmentUrl && (
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="text-sm text-gray-600 block mb-2">입금 확인 첨부파일</span>
                    <a
                      href={selectedRequest.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      첨부파일 보기
                    </a>
                  </div>
                )}
              </div>

              {/* 요청 메시지 */}
              {selectedRequest.requestMessage && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">요청 메시지</h4>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedRequest.requestMessage}
                  </div>
                </div>
              )}

              {/* 거절 사유 (거절된 경우) */}
              {selectedRequest.status === "REJECTED" && selectedRequest.rejectionReason && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    거절 사유
                  </h4>
                  <div className="p-4 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
                    {selectedRequest.rejectionReason}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {selectedRequest.status === "PENDING" && (
                <div className="space-y-4 pt-4 border-t">
                  {/* 승인할 학생 수 수정 */}
                  <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      승인할 학생 슬롯 수 (수정 가능)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={approvedStudentCount}
                      onChange={(e) => setApprovedStudentCount(parseInt(e.target.value) || 0)}
                      placeholder="학생 수 입력"
                      className="text-lg font-semibold"
                    />
                    <p className="text-xs text-gray-600">
                      💡 요청된 학생 수: {selectedRequest.studentCount}명 → 관리자가 수정하여 승인할 수 있습니다.
                    </p>
                    {approvedStudentCount !== selectedRequest.studentCount && (
                      <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        요청된 학생 수와 다릅니다! ({selectedRequest.studentCount}명 → {approvedStudentCount}명)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      거절 사유 (거절 시 필수)
                    </label>
                    <Textarea
                      placeholder="거절 사유를 입력해주세요..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={processing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processing ? '처리 중...' : '승인'}
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedRequest.id)}
                      variant="destructive"
                      className="flex-1"
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {processing ? '처리 중...' : '거절'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
