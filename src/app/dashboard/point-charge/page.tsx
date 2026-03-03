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

// 10,000원 = 11,000P (10% 보너스)
const POINT_PRICES = {
  1000: 10000,    // 10,000원 = 11,000P
  5000: 50000,    // 50,000원 = 55,000P  
  10000: 100000,  // 100,000원 = 110,000P
  50000: 500000,  // 500,000원 = 550,000P
  100000: 1000000 // 1,000,000원 = 1,100,000P
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
  const [copied, setCopied] = useState(false);

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
    // 실제 충전될 포인트 (10% 보너스 포함)
    const actualPoints = Math.floor(points * 1.1); // 10% 보너스
    
    // 결제 금액 (포인트 / 1.1 * 10원)
    const basePrice = points * 10;
    const vat = 0; // VAT 제거
    const totalPrice = basePrice;
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 container mx-auto p-8 max-w-6xl">
        {/* Premium Header */}
        <Card className="mb-8 border-0 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10 pb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl ring-2 ring-white/30">
                <CreditCard className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight drop-shadow-lg">포인트 충전</h1>
                <p className="text-white/95 mt-2 text-xl font-medium drop-shadow">문자/카카오 발송을 위한 포인트를 충전하세요</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Points - Premium Design */}
        <Card className="mb-8 border-0 shadow-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white overflow-hidden relative transform hover:scale-[1.01] transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <CardContent className="py-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-lg font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  현재 보유 포인트
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-7xl font-black drop-shadow-2xl bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent animate-pulse">
                    {currentPoints.toLocaleString()}
                  </p>
                  <span className="text-4xl font-black drop-shadow-lg">P</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={fetchCurrentPoints}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Info - Premium */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
            <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-black">
              <DollarSign className="w-7 h-7 text-amber-600" />
              입금 계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-6 bg-white rounded-2xl border-3 border-amber-200 shadow-lg">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-1">{BANK_NAME}</p>
                <p className="text-4xl font-black text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text tracking-widest">
                  {BANK_ACCOUNT}
                </p>
                <p className="text-sm text-gray-500 mt-1">예금주: 슈퍼플레이스</p>
              </div>
              <Button
                onClick={copyToClipboard}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-6 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    복사됨!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    계좌번호 복사
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Charge Form - Premium */}
          <div>
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
                  <Plus className="w-7 h-7 text-blue-600" />
                  포인트 충전 신청
                </CardTitle>
                <CardDescription className="text-base font-semibold flex items-center gap-2 mt-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  10% 보너스 포인트 제공! (10,000원 = 11,000P)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Point Selection - Premium */}
                  <div>
                    <Label className="text-base font-bold">충전할 금액 선택</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {Object.entries(POINT_PRICES).map(([points, price]) => {
                        const actualPoints = Math.floor(parseInt(points) * 1.1);
                        return (
                          <Button
                            key={points}
                            type="button"
                            variant={selectedPoints === parseInt(points) ? "default" : "outline"}
                            onClick={() => {
                              setSelectedPoints(parseInt(points));
                              setCustomPoints('');
                            }}
                            className={`h-auto py-6 flex flex-col items-center gap-2 rounded-2xl border-3 transition-all duration-200 ${
                              selectedPoints === parseInt(points)
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl scale-105 border-blue-500'
                                : 'hover:border-blue-400 hover:shadow-lg hover:scale-105'
                            }`}
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black">{actualPoints.toLocaleString()}</span>
                              <span className="text-xl font-black">P</span>
                            </div>
                            <div className="text-sm opacity-95 font-black">{formatCurrency(price)}</div>
                            <Badge className="bg-amber-500 text-white text-xs">+10% 보너스</Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Input */}
                  <div>
                    <Label htmlFor="customPoints" className="text-base font-bold">직접 입력 (최소 1,000P)</Label>
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
                      className="mt-2 py-6 text-lg font-bold border-3 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>

                  {/* Price Display - Premium */}
                  {priceInfo && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-3 border-blue-200 shadow-inner space-y-3">
                      <div className="flex items-center justify-between text-base">
                        <span className="text-gray-700 font-semibold">충전 포인트:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {getPointsToCharge().toLocaleString()}
                          </span>
                          <span className="text-xl font-black text-blue-600">P</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-base bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border-2 border-amber-400 shadow-lg">
                        <span className="text-amber-800 font-black flex items-center gap-2">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          보너스 (+10%):
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            +{Math.floor(getPointsToCharge() * 0.1).toLocaleString()}
                          </span>
                          <span className="text-xl font-black text-amber-600">P</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-base bg-gradient-to-r from-emerald-100 to-green-100 p-4 rounded-xl border-3 border-emerald-400 shadow-xl">
                        <span className="text-green-900 font-black text-lg">실제 충전 포인트:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">
                            {priceInfo.actualPoints.toLocaleString()}
                          </span>
                          <span className="text-2xl font-black text-emerald-600">P</span>
                        </div>
                      </div>
                      <div className="border-t-3 border-blue-400 pt-4 mt-2 flex items-center justify-between bg-white/50 p-4 rounded-xl">
                        <span className="text-xl font-black text-gray-900">결제 금액:</span>
                        <span className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                          {formatCurrency(priceInfo.totalPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <Label htmlFor="paymentMethod" className="text-base font-bold">결제 방법</Label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border-3 border-gray-200 rounded-xl p-4 mt-2 font-semibold focus:border-blue-500 outline-none"
                      required
                    >
                      <option value="">선택하세요</option>
                      <option value="bank-transfer">무통장 입금</option>
                      <option value="card">신용카드</option>
                      <option value="virtual-account">가상계좌</option>
                    </select>
                  </div>

                  {/* Bank Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="depositBank" className="text-base font-bold">입금 은행</Label>
                      <Input
                        id="depositBank"
                        value={depositBank}
                        onChange={(e) => setDepositBank(e.target.value)}
                        placeholder="예: 국민은행"
                        className="mt-2 py-6 border-3 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="depositorName" className="text-base font-bold">입금자명</Label>
                      <Input
                        id="depositorName"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="mt-2 py-6 border-3 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Attachment */}
                  <div>
                    <Label htmlFor="attachment" className="text-base font-bold">입금 증빙 첨부 (선택)</Label>
                    <Input
                      id="attachment"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      className="mt-2 border-3 rounded-xl"
                    />
                    <p className="text-sm text-gray-500 mt-2 font-semibold">
                      입금 확인서, 영수증 등을 첨부하세요
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="requestMessage" className="text-base font-bold">신청 메시지 (선택)</Label>
                    <Textarea
                      id="requestMessage"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="관리자에게 전달할 메시지가 있으시면 입력하세요"
                      rows={3}
                      className="mt-2 border-3 rounded-xl"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || getPointsToCharge() < 1000}
                    className="w-full py-7 text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 rounded-2xl"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mr-2" />
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
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-black">
                  나의 충전 신청 내역
                </CardTitle>
                <CardDescription className="text-base font-semibold">최근 신청한 포인트 충전 내역을 확인할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {myRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-lg">신청 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {myRequests.map((request) => (
                      <div key={request.id} className="p-5 border-3 rounded-2xl hover:shadow-lg transition-all bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <p className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {request.requestedPoints.toLocaleString()}
                              </p>
                              <span className="text-2xl font-black text-gray-900">P</span>
                            </div>
                            <p className="text-sm text-gray-500 font-semibold">{formatDate(request.createdAt)}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-700 font-semibold">
                            결제 금액: <span className="font-black text-lg">{formatCurrency(request.totalPrice)}</span>
                          </p>
                          {request.status === 'APPROVED' && request.approvedAt && (
                            <p className="text-green-600 font-bold">
                              승인 일시: {formatDate(request.approvedAt)}
                            </p>
                          )}
                          {request.status === 'REJECTED' && request.rejectionReason && (
                            <p className="text-red-600 text-sm p-3 bg-red-50 rounded-xl mt-2 font-semibold">
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

        {/* Info Card - Premium */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b border-indigo-200">
            <CardTitle className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">
              포인트 충전 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-base text-gray-700 space-y-3 font-semibold">
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span>포인트는 문자(SMS) 및 카카오 알림톡 발송에 사용됩니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span>SMS: 20P/건, 카카오톡: 15P/건</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                10% 보너스 제공! (예: 10,000원 충전 시 11,000P 지급)
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span>최소 충전 금액은 1,000 포인트입니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span>신청 후 관리자 승인까지 1-2 영업일 소요됩니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              <span>입금 확인서를 첨부하시면 승인이 더 빠르게 처리됩니다</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
