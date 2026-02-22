"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Check, X, Download, FileText, CreditCard, 
  Clock, CheckCircle, XCircle, DollarSign, User
} from "lucide-react";

interface PointChargeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedPoints: number;
  pointPrice: number;
  vat: number;
  totalPrice: number;
  paymentMethod?: string;
  depositBank?: string;
  depositorName?: string;
  attachmentUrl?: string;
  requestMessage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function PointApprovalsPage() {
  const [requests, setRequests] = useState<PointChargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/point-charge-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch point charge requests:', error);
      alert('포인트 충전 신청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('포인트 충전을 승인하시겠습니까?')) return;

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      console.log('🔄 Approving request:', requestId);
      
      const response = await fetch('/api/admin/point-charge-requests/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();
      console.log('✅ Approval response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to approve');
      }

      alert(`포인트 충전이 승인되었습니다.\n승인된 포인트: ${data.points || 0}P`);
      fetchRequests();
    } catch (error: any) {
      console.error('❌ Failed to approve:', error);
      alert(`승인 처리에 실패했습니다.\n${error.message || '알 수 없는 오류'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = rejectionReason[requestId];
    if (!reason || !reason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    if (!confirm('포인트 충전 신청을 거절하시겠습니까?')) return;

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/point-charge-requests/reject', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, reason })
      });

      if (!response.ok) throw new Error('Failed to reject');

      alert('포인트 충전 신청이 거절되었습니다.');
      setRejectionReason({ ...rejectionReason, [requestId]: '' });
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('거절 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const downloadAttachment = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" /> 대기 중
        </Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" /> 승인됨
        </Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="w-3 h-3 mr-1" /> 거절됨
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-blue-600" />
          포인트 충전 승인 관리
        </h1>
        <p className="text-gray-600 mt-2">학원장의 포인트 충전 신청을 검토하고 승인/거절할 수 있습니다</p>
      </div>

      {/* 대기 중인 신청 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-yellow-600" />
          대기 중인 신청 ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>대기 중인 포인트 충전 신청이 없습니다</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-2 border-yellow-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {request.userName}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.userEmail} • {formatDate(request.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {request.requestedPoints.toLocaleString()} P
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatCurrency(request.totalPrice)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-2">결제 정보</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-600">포인트 금액:</span> <span className="font-medium">{formatCurrency(request.pointPrice)}</span></p>
                        <p><span className="text-gray-600">부가세 (10%):</span> <span className="font-medium">{formatCurrency(request.vat)}</span></p>
                        <p><span className="text-gray-600">총 금액:</span> <span className="font-bold text-blue-600">{formatCurrency(request.totalPrice)}</span></p>
                        {request.paymentMethod && <p><span className="text-gray-600">결제 방법:</span> {request.paymentMethod}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-2">입금 정보</h4>
                      <div className="space-y-1 text-sm">
                        {request.depositBank && <p><span className="text-gray-600">입금 은행:</span> {request.depositBank}</p>}
                        {request.depositorName && <p><span className="text-gray-600">입금자명:</span> {request.depositorName}</p>}
                        {request.attachmentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAttachment(request.attachmentUrl!, `증빙서류_${request.userName}.pdf`)}
                            className="mt-2"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            입금 증빙 다운로드
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.requestMessage && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">신청 메시지</h4>
                      <p className="text-sm text-gray-700">{request.requestMessage}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        거절 사유 (거절 시 필수)
                      </label>
                      <Textarea
                        value={rejectionReason[request.id] || ''}
                        onChange={(e) => setRejectionReason({ ...rejectionReason, [request.id]: e.target.value })}
                        placeholder="거절 사유를 입력하세요..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        승인
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        거절
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 처리 완료된 신청 */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">처리 완료된 신청 ({processedRequests.length})</h2>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {request.userName}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.userEmail} • {formatDate(request.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {request.requestedPoints.toLocaleString()} P
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatCurrency(request.totalPrice)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    {request.status === 'APPROVED' && request.approvedAt && (
                      <p>승인 일시: {formatDate(request.approvedAt)}</p>
                    )}
                    {request.status === 'REJECTED' && request.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded">
                        <p className="font-medium text-red-700">거절 사유:</p>
                        <p className="text-red-600">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
