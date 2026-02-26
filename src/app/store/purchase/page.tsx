'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  pricePerStudent?: number;
  monthlyPrice?: number;
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
  const [studentCount, setStudentCount] = useState(10);
  const [months, setMonths] = useState(1);
  const [depositBank, setDepositBank] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

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
    const basePrice = product.pricePerStudent || product.monthlyPrice || 0;
    return studentCount * months * basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    // Validation
    if (studentCount < 1) {
      alert('학생 수는 1명 이상이어야 합니다.');
      return;
    }
    
    if (months < 1 || months > 12) {
      alert('이용 기간은 1개월에서 12개월 사이여야 합니다.');
      return;
    }
    
    if (!depositBank || !depositorName) {
      alert('입금 정보를 모두 입력해주세요.');
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

      // Upload file if exists
      let attachmentUrl = '';
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url || '';
        }
      }

      // Submit purchase request
      const purchaseData = {
        productId: product.id,
        productName: product.name,
        studentCount,
        months,
        pricePerStudent: product.pricePerStudent || product.monthlyPrice || 0,
        totalPrice: calculateTotal(),
        depositBank,
        depositorName,
        attachmentUrl,
        requestMessage,
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
        alert(`구매 신청이 완료되었습니다!\n\n총 결제 금액: ${calculateTotal().toLocaleString()}원\n\n입금 확인 후 관리자가 승인해드립니다.`);
        router.push('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || '구매 신청에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.message || '구매 신청 중 오류가 발생했습니다.');
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
              학생 수
            </label>
            <input
              type="number"
              min="1"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              이용할 학생 수를 입력하세요
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

          {/* Deposit Info */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금 은행
              </label>
              <input
                type="text"
                value={depositBank}
                onChange={(e) => setDepositBank(e.target.value)}
                placeholder="예: 국민은행"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금자명
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금 확인 파일 (선택)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                입금 확인증 스크린샷을 첨부하시면 더 빠르게 처리됩니다
              </p>
            </div>
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
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">학생 수</span>
              <span className="font-medium">{studentCount}명</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">이용 기간</span>
              <span className="font-medium">{months}개월</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">월 단가</span>
              <span className="font-medium">
                ₩{(product.pricePerStudent || product.monthlyPrice || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-blue-200 my-2"></div>
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
