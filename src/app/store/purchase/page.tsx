'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  pricePerStudent?: number;
  monthlyPrice?: number;
  price?: number;
  imageUrl: string;
}

function PurchasePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [studentCount, setStudentCount] = useState('');
  const [months, setMonths] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/store-products?activeOnly=true`);
      if (response.ok) {
        const data = await response.json();
        const foundProduct = data.products?.find((p: any) => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const count = Number(studentCount) || 0;
    // 기본 가격 (monthlyPrice 또는 price)
    const basePrice = product.monthlyPrice || product.price || 0;
    // 학생당 가격
    const pricePerStudent = product.pricePerStudent || 0;
    // 총액 = (기본가격 + 학생당가격 × 학생수) × 개월수
    return (basePrice + (pricePerStudent * count)) * months;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    const count = Number(studentCount);
    
    // Validation
    if (!studentCount || count < 1) {
      alert('학생 수는 1명 이상이어야 합니다.');
      return;
    }
    
    if (months < 1 || months > 12) {
      alert('이용 기간은 1개월에서 12개월 사이여야 합니다.');
      return;
    }
    
    if (!email || !name || !academyName || !phoneNumber) {
      alert('모든 필수 정보를 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    // 전화번호 형식 검증 (숫자와 하이픈만)
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('올바른 전화번호 형식을 입력해주세요. (숫자와 하이픈만 가능)');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // Submit purchase request
      const purchaseData = {
        productId: product.id,
        productName: product.name,
        studentCount: count,
        months,
        pricePerStudent: product.pricePerStudent || 0,
        basePrice: product.monthlyPrice || product.price || 0,
        totalPrice: calculateTotal(),
        email,
        name,
        academyName,
        phoneNumber,
        requestMessage,
        paymentMethod,
      };

      const response = await fetch('/api/bot-purchase-requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Purchase success:', result);
        alert(`구매 신청이 완료되었습니다!\n\n총 결제 금액: ${calculateTotal().toLocaleString()}원\n\n입금 확인 후 관리자가 승인해드립니다.`);
        router.push('/dashboard');
      } else {
        const error = await response.json();
        console.error('❌ Purchase failed:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        const errorMessage = error.message || error.error || '구매 신청에 실패했습니다.';
        throw new Error(`[${response.status}] ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('💥 Purchase exception:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const displayMessage = error.message || '구매 신청 중 오류가 발생했습니다.';
      alert(`구매 신청 실패\n\n${displayMessage}\n\n자세한 내용은 콘솔(F12)을 확인하세요.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl mb-4">제품을 찾을 수 없습니다.</div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium">뒤로</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold">구매하기</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 pb-32">
        {/* Product Info */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex gap-4">
            <img
              src={product.imageUrl || 'https://placehold.co/100x100'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h2 className="font-bold text-lg mb-1">{product.name}</h2>
              <p className="text-blue-600 font-semibold">
                {product.pricePerStudent
                  ? `₩${product.pricePerStudent.toLocaleString()}/학생/월`
                  : `₩${(product.monthlyPrice || 0).toLocaleString()}/월`}
              </p>
            </div>
          </div>
        </div>

        {/* Purchase Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Count */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생 수 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              placeholder="학생 수를 입력하세요 (예: 10)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              이용할 학생 수를 입력하세요 (최소 1명)
            </p>
          </div>

          {/* Months */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이용 기간 (개월)
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}개월
                </option>
              ))}
            </select>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학원 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="슈퍼플레이스 학원"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                숫자와 하이픈(-)만 입력해주세요
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              결제 방법 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'CARD' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={(e) => setPaymentMethod('CARD')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">카드 결제</div>
                  <div className="text-xs text-gray-500 mt-1">승인 후 카드 결제 링크를 보내드립니다</div>
                </div>
              </label>
              
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'BANK_TRANSFER' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={(e) => setPaymentMethod('BANK_TRANSFER')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">계좌이체</div>
                  <div className="text-xs text-gray-500 mt-1">아래 계좌로 입금해주세요</div>
                </div>
              </label>
            </div>
            
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">입금 계좌 정보</div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="font-medium text-blue-600">하나은행 746-910023-17004</div>
                  <div>예금주: (주)우리는 슈퍼플레이스다</div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  입금자명을 신청자명과 동일하게 입력해주세요
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              요청사항 (선택)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
              placeholder="추가 요청사항이 있으시면 입력해주세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-gray-900 mb-3">요금 계산</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">기본 가격 (월)</span>
                <span className="font-medium">
                  ₩{((product.monthlyPrice || product.price || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">학생당 가격 (월)</span>
                <span className="font-medium">
                  ₩{(product.pricePerStudent || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>학생 수</span>
                <span>{studentCount || 0}명</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>이용 기간</span>
                <span>{months}개월</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="text-xs text-gray-600 mb-2">
                  계산식: (기본 ₩{((product.monthlyPrice || product.price || 0)).toLocaleString()} + 학생당 ₩{(product.pricePerStudent || 0).toLocaleString()} × {studentCount || 0}명) × {months}개월
                </div>
              </div>
            </div>
            <div className="border-t border-blue-300 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">총 결제 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                ₩{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">구매 안내</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>입금 확인 후 관리자가 승인합니다</li>
                  <li>승인 후 즉시 서비스를 이용하실 수 있습니다</li>
                  <li>문의사항은 고객센터로 연락주세요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? '처리 중...' : '구매 신청하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    }>
      <PurchasePageContent />
    </Suspense>
  );
}
