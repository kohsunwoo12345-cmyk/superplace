"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, Upload, DollarSign, Plus, 
  Clock, CheckCircle, XCircle, RefreshCw
} from "lucide-react";

interface PointChargeRequest {
  id: string;
  requestedPoints: number;
  pointPrice: number;
  vat: number;
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

const POINT_PRICES = {
  1000: 11000,   // 1,000 포인트 = 10,000원 + VAT 1,000원 = 11,000원
  5000: 55000,   // 5,000 포인트 = 50,000원 + VAT 5,000원 = 55,000원
  10000: 110000, // 10,000 포인트 = 100,000원 + VAT 10,000원 = 110,000원
  50000: 550000, // 50,000 포인트 = 500,000원 + VAT 50,000원 = 550,000원
  100000: 1100000 // 100,000 포인트 = 1,000,000원 + VAT 100,000원 = 1,100,000원
};

export default function PointChargePage() {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [customPoints, setCustomPoints] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [depositBank, setDepositBank] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<PointChargeRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCurrentPoints();
    fetchMyRequests();
  }, []);

  const fetchCurrentPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/points', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Failed to fetch points:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/point-charge-requests/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const calculatePrice = (points: number) => {
    const basePrice = points * 10; // 1 포인트 = 10원
    const vat = basePrice * 0.1; // 부가세 10%
    const totalPrice = basePrice + vat;
    return { basePrice, vat, totalPrice };
  };

  const getPointsToCharge = () => {
    if (selectedPoints) return selectedPoints;
    if (customPoints) return parseInt(customPoints);
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pointsToCharge = getPointsToCharge();
    if (pointsToCharge < 1000) {
      alert('최소 1,000 포인트 이상 충전해야 합니다.');
      return;
    }

    if (!paymentMethod) {
      alert('결제 방법을 선택해주세요.');
      return;
    }

    if (!depositBank || !depositorName) {
      alert('입금 은행과 입금자명을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // 첨부 파일 업로드
      let attachmentUrl = '';
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url;
        }
      }

      const { basePrice, vat, totalPrice } = calculatePrice(pointsToCharge);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/point-charge-requests/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedPoints: pointsToCharge,
          pointPrice: basePrice,
          vat,
          totalPrice,
          paymentMethod,
          depositBank,
          depositorName,
          attachmentUrl,
          requestMessage
        })
      });

      if (!response.ok) throw new Error('Failed to submit request');

      alert('포인트 충전 신청이 완료되었습니다.\n관리자 승인 후 포인트가 지급됩니다.');
      
      // 폼 초기화
      setSelectedPoints(null);
      setCustomPoints('');
      setPaymentMethod('');
      setDepositBank('');
      setDepositorName('');
      setAttachmentFile(null);
      setRequestMessage('');
      
      fetchMyRequests();
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('포인트 충전 신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
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

  const priceInfo = getPointsToCharge() > 0 ? calculatePrice(getPointsToCharge()) : null;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-blue-600" />
          포인트 충전
        </h1>
        <p className="text-gray-600 mt-2">문자/카카오 발송을 위한 포인트를 충전할 수 있습니다</p>
      </div>

      {/* 현재 포인트 */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">현재 보유 포인트</p>
              <p className="text-4xl font-bold text-blue-600">{currentPoints.toLocaleString()} P</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCurrentPoints}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 충전 신청 폼 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                포인트 충전 신청
              </CardTitle>
              <CardDescription>
                포인트 충전 후 관리자 승인이 필요합니다 (1P = 10원 + VAT 10%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 포인트 선택 */}
                <div>
                  <Label>충전할 포인트 선택</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(POINT_PRICES).map(([points, price]) => (
                      <Button
                        key={points}
                        type="button"
                        variant={selectedPoints === parseInt(points) ? "default" : "outline"}
                        onClick={() => {
                          setSelectedPoints(parseInt(points));
                          setCustomPoints('');
                        }}
                        className="h-auto py-3 flex flex-col items-center"
                      >
                        <span className="font-bold">{parseInt(points).toLocaleString()} P</span>
                        <span className="text-xs opacity-80">{formatCurrency(price)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 직접 입력 */}
                <div>
                  <Label htmlFor="customPoints">직접 입력 (최소 1,000P)</Label>
                  <Input
                    id="customPoints"
                    type="number"
                    min="1000"
                    step="1000"
                    value={customPoints}
                    onChange={(e) => {
                      setCustomPoints(e.target.value);
                      setSelectedPoints(null);
                    }}
                    placeholder="1000"
                  />
                </div>

                {/* 가격 표시 */}
                {priceInfo && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">포인트 금액:</span>
                      <span className="font-medium">{formatCurrency(priceInfo.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">부가세 (10%):</span>
                      <span className="font-medium">{formatCurrency(priceInfo.vat)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>총 결제 금액:</span>
                      <span className="text-blue-600">{formatCurrency(priceInfo.totalPrice)}</span>
                    </div>
                  </div>
                )}

                {/* 결제 방법 */}
                <div>
                  <Label htmlFor="paymentMethod">결제 방법</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded-md p-2 mt-1"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="bank-transfer">무통장 입금</option>
                    <option value="card">신용카드</option>
                    <option value="virtual-account">가상계좌</option>
                  </select>
                </div>

                {/* 입금 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="depositBank">입금 은행</Label>
                    <Input
                      id="depositBank"
                      value={depositBank}
                      onChange={(e) => setDepositBank(e.target.value)}
                      placeholder="예: 국민은행"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="depositorName">입금자명</Label>
                    <Input
                      id="depositorName"
                      value={depositorName}
                      onChange={(e) => setDepositorName(e.target.value)}
                      placeholder="예: 홍길동"
                      required
                    />
                  </div>
                </div>

                {/* 첨부 파일 */}
                <div>
                  <Label htmlFor="attachment">입금 증빙 첨부 (선택)</Label>
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    입금 확인서, 영수증 등을 첨부하세요
                  </p>
                </div>

                {/* 신청 메시지 */}
                <div>
                  <Label htmlFor="requestMessage">신청 메시지 (선택)</Label>
                  <Textarea
                    id="requestMessage"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="관리자에게 전달할 메시지가 있으시면 입력하세요"
                    rows={3}
                  />
                </div>

                {/* 제출 버튼 */}
                <Button
                  type="submit"
                  disabled={loading || getPointsToCharge() < 1000}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      충전 신청하기
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 신청 내역 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>나의 충전 신청 내역</CardTitle>
              <CardDescription>최근 신청한 포인트 충전 내역을 확인할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>신청 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {myRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-lg">{request.requestedPoints.toLocaleString()} P</p>
                          <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          결제 금액: <span className="font-medium">{formatCurrency(request.totalPrice)}</span>
                        </p>
                        {request.status === 'APPROVED' && request.approvedAt && (
                          <p className="text-green-600">
                            승인 일시: {formatDate(request.approvedAt)}
                          </p>
                        )}
                        {request.status === 'REJECTED' && request.rejectionReason && (
                          <p className="text-red-600 text-xs p-2 bg-red-50 rounded mt-2">
                            거절 사유: {request.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 안내 사항 */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">포인트 충전 안내</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• 포인트는 문자(SMS) 및 카카오 알림톡 발송에 사용됩니다</p>
          <p>• SMS: 20P/건, 카카오톡: 15P/건</p>
          <p>• 최소 충전 금액은 1,000 포인트입니다</p>
          <p>• 부가세(VAT) 10%가 포함된 금액입니다</p>
          <p>• 신청 후 관리자 승인까지 1-2 영업일 소요됩니다</p>
          <p>• 입금 확인서를 첨부하시면 승인이 더 빠르게 처리됩니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
