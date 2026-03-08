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
  Clock, CheckCircle, XCircle, RefreshCw, Copy, Check, Sparkles, TrendingUp
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

interface PointTransaction {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

// 포인트 충전 금액 (1P = 1원, VAT 10% 별도)
const POINT_PRICES = {
  10000: 10000,    // 10,000원 → 실제 이체 11,000원 (VAT 포함) → 10,000P
  50000: 50000,    // 50,000원 → 실제 이체 55,000원 (VAT 포함) → 50,000P
  100000: 100000,  // 100,000원 → 실제 이체 110,000원 (VAT 포함) → 100,000P
  500000: 500000,  // 500,000원 → 실제 이체 550,000원 (VAT 포함) → 500,000P
  1000000: 1000000 // 1,000,000원 → 실제 이체 1,100,000원 (VAT 포함) → 1,000,000P
};

const BANK_ACCOUNT = "746-910023-17004";
const BANK_NAME = "국민은행";

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
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCurrentPoints();
    fetchMyRequests();
    fetchPointTransactions();
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

  const fetchPointTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔍 포인트 차감 내역 조회 중...');
      
      const response = await fetch('/api/user/point-transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 포인트 트랜잭션 데이터:', data);
        setPointTransactions(data.transactions || []);
      } else {
        console.error('❌ 포인트 트랜잭션 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch point transactions:', error);
    }
  };

  const calculatePrice = (points: number) => {
    // 요청한 포인트 = 충전될 포인트 (1P = 1원)
    const actualPoints = points;
    
    // 기본 금액 (포인트와 동일)
    const basePrice = points;
    
    // VAT 10%
    const vat = Math.floor(basePrice * 0.1);
    
    // 실제 이체해야 할 총 금액 (기본 금액 + VAT)
    const totalPrice = basePrice + vat;
    
    return { basePrice, vat, totalPrice, actualPoints };
  };

  const getPointsToCharge = () => {
    if (selectedPoints) return selectedPoints;
    if (customPoints) return parseInt(customPoints);
    return 0;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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

      const { basePrice, vat, totalPrice, actualPoints } = calculatePrice(pointsToCharge);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/point-charge-requests/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestedPoints: actualPoints, // 보너스 포함된 포인트
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">포인트 충전</h1>
          </div>
          <p className="text-gray-600">문자/카카오 발송을 위한 포인트를 충전하세요</p>
        </div>

        {/* Current Points */}
        <Card className="mb-8 border border-gray-200 shadow-sm">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  현재 보유 포인트
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gray-900">
                    {currentPoints.toLocaleString()}
                  </p>
                  <span className="text-2xl font-bold text-gray-600">P</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchCurrentPoints}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Info */}
        <Card className="mb-8 border border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
              입금 계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">{BANK_NAME}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-wide">
                  {BANK_ACCOUNT}
                </p>
                <p className="text-sm text-gray-500 mt-1">예금주: 슈퍼플레이스</p>
              </div>
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Charge Form */}
          <div>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                  포인트 충전 신청
                </CardTitle>
                <CardDescription className="text-sm flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  1P = 1원 (VAT 10% 별도)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Point Selection */}
                  <div>
                    <Label className="text-sm font-semibold">충전할 금액 선택</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(POINT_PRICES).map(([price, points]) => {
                        const { basePrice, vat, totalPrice } = calculatePrice(points);
                        return (
                          <Button
                            key={price}
                            type="button"
                            variant={selectedPoints === points ? "default" : "outline"}
                            onClick={() => {
                              setSelectedPoints(points);
                              setCustomPoints('');
                            }}
                            className={`h-auto py-4 flex flex-col items-center gap-1 transition-all ${
                              selectedPoints === points
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold">{points.toLocaleString()}</span>
                              <span className="text-sm font-semibold">P</span>
                            </div>
                            <div className="text-xs opacity-90">실제 이체: {formatCurrency(totalPrice)}</div>
                            <Badge className="bg-orange-500 text-white text-xs">VAT 포함</Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Input */}
                  <div>
                    <Label htmlFor="customPoints" className="text-sm font-semibold">직접 입력 (최소 1,000P)</Label>
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
                      className="mt-2"
                    />
                  </div>

                  {/* Price Display */}
                  {priceInfo && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">충전 포인트:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {priceInfo.actualPoints.toLocaleString()}
                          </span>
                          <span className="text-base font-semibold text-blue-600">P</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">기본 금액:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(priceInfo.basePrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">VAT (10%):</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(priceInfo.vat)}
                        </span>
                      </div>
                      <div className="border-t border-blue-300 pt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">실제 이체 금액:</span>
                        <span className="text-2xl font-bold text-red-600">
                          {formatCurrency(priceInfo.totalPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <Label htmlFor="paymentMethod" className="text-sm font-semibold">결제 방법</Label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-gray-200 rounded-md p-2 mt-2 focus:border-blue-500 outline-none"
                      required
                    >
                      <option value="">선택하세요</option>
                      <option value="bank-transfer">무통장 입금</option>
                      <option value="card">신용카드</option>
                      <option value="virtual-account">가상계좌</option>
                    </select>
                  </div>

                  {/* Bank Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="depositBank" className="text-sm font-semibold">입금 은행</Label>
                      <Input
                        id="depositBank"
                        value={depositBank}
                        onChange={(e) => setDepositBank(e.target.value)}
                        placeholder="예: 국민은행"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="depositorName" className="text-sm font-semibold">입금자명</Label>
                      <Input
                        id="depositorName"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>

                  {/* Attachment */}
                  <div>
                    <Label htmlFor="attachment" className="text-sm font-semibold">입금 증빙 첨부 (선택)</Label>
                    <Input
                      id="attachment"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      입금 확인서, 영수증 등을 첨부하세요
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="requestMessage" className="text-sm font-semibold">신청 메시지 (선택)</Label>
                    <Textarea
                      id="requestMessage"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="관리자에게 전달할 메시지가 있으시면 입력하세요"
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || getPointsToCharge() < 1000}
                    className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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

          {/* History */}
          <div>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-lg">나의 충전 신청 내역</CardTitle>
                <CardDescription className="text-sm">최근 신청한 포인트 충전 내역을 확인할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {myRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">신청 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {myRequests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <p className="text-2xl font-bold text-gray-900">
                                {request.requestedPoints.toLocaleString()}
                              </p>
                              <span className="text-lg font-semibold text-gray-600">P</span>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-700">
                            결제 금액: <span className="font-bold text-base">{formatCurrency(request.totalPrice)}</span>
                          </p>
                          {request.status === 'APPROVED' && request.approvedAt && (
                            <p className="text-green-600 text-xs">
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

        {/* Point Transactions History */}
        <Card className="mt-8 border border-red-200 shadow-sm">
          <CardHeader className="border-b bg-red-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              포인트 차감 내역
            </CardTitle>
            <CardDescription className="text-sm">문자 발송으로 차감된 포인트 내역을 확인할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {pointTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">차감 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pointTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <p className={`text-2xl font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                          </p>
                          <span className="text-lg font-semibold text-gray-600">P</span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <Badge variant={transaction.amount < 0 ? 'destructive' : 'default'}>
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-700">{transaction.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-8 border border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">포인트 충전 안내</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>포인트는 문자(SMS) 및 카카오 알림톡 발송에 사용됩니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>SMS: 40P/건, LMS: 95P/건</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                10% 보너스 제공! (예: 10,000원 충전 시 11,000P 지급)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>최소 충전 금액은 1,000 포인트입니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>신청 후 관리자 승인까지 1-2 영업일 소요됩니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>입금 확인서를 첨부하시면 승인이 더 빠르게 처리됩니다</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
