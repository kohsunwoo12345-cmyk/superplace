'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Share2, Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  pricePerStudent?: number;
  originalPrice?: number;
  discountType?: string;
  discountValue?: number;
  promotionType?: string;
  promotionDescription?: string;
  promotionStartDate?: string;
  promotionEndDate?: string;
  badges?: string;
  isTimeDeal?: boolean;
  category: string;
  imageUrl: string;
  detailHtml?: string;
  features?: string;
  keywords?: string;
  rating?: number;        // 평균 별점 (0-5)
  reviewCount?: number;   // 리뷰 개수
}

function ProductDetailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'qna'>('detail');
  const [liked, setLiked] = useState(false);

  // Google Drive URL을 직접 이미지 URL로 변환
  const convertGoogleDriveUrl = (url: string): string => {
    if (!url) return url;
    
    // Google Drive 공유 링크 패턴: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const driveMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      // 직접 다운로드 가능한 URL로 변환
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url;
  };

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
      // 조회 로그 기록
      logProductView(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/store-products?activeOnly=true`);
      if (response.ok) {
        const data = await response.json();
        const foundProduct = data.products?.find((p: any) => p.id === id);
        if (foundProduct) {
          // Google Drive URL 변환 적용
          if (foundProduct.imageUrl) {
            foundProduct.imageUrl = convertGoogleDriveUrl(foundProduct.imageUrl);
          }
          setProduct(foundProduct);
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const logProductView = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/store/log-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id }),
      });
    } catch (error) {
      console.error('Failed to log view:', error);
    }
  };

  const calculateDiscount = () => {
    if (!product) return null;
    
    // 기본 가격 결정
    let basePrice = product.originalPrice || product.price || product.pricePerStudent || product.monthlyPrice || 0;
    
    // 할인 계산 (유효성 검사 포함)
    if (product.discountType === 'percentage' && product.discountValue && product.discountValue > 0 && product.discountValue <= 100) {
      return Math.round(product.discountValue);
    } else if (product.discountType === 'fixed' && product.discountValue && basePrice > 0 && product.discountValue < basePrice) {
      const percent = (product.discountValue / basePrice) * 100;
      return Math.round(Math.min(percent, 100));  // 최대 100%
    }
    
    // 무효한 할인인 경우 null 반환
    return null;
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    
    // 기본 가격 (원가)
    let basePrice = product.originalPrice || product.price || product.pricePerStudent || product.monthlyPrice || 0;
    
    // 할인 적용 (유효성 검사 포함)
    if (product.discountType === 'percentage' && product.discountValue && product.discountValue > 0 && product.discountValue <= 100) {
      return Math.round(basePrice * (1 - product.discountValue / 100));
    } else if (product.discountType === 'fixed' && product.discountValue && product.discountValue > 0 && product.discountValue < basePrice) {
      return Math.max(0, Math.round(basePrice - product.discountValue));
    }
    
    // 무효한 할인인 경우 원가 반환
    return basePrice;
  };

  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  const parseBadges = (badges?: string) => {
    if (!badges) return [];
    try {
      return JSON.parse(badges);
    } catch {
      return [];
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
        <Link href="/store" className="text-blue-600 hover:underline">
          쇼핑몰로 돌아가기
        </Link>
      </div>
    );
  }

  const discountPercent = calculateDiscount();
  const finalPrice = calculateFinalPrice();
  const basePrice = product.originalPrice || product.price || product.pricePerStudent || product.monthlyPrice || 0;
  const badges = parseBadges(product.badges);
  const displayPrice = product.pricePerStudent 
    ? `${formatPrice(finalPrice)}/학생/월`
    : product.monthlyPrice 
      ? `${formatPrice(finalPrice)}/월`
      : formatPrice(finalPrice);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium">뒤로</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-full ${liked ? 'text-red-500' : 'text-gray-400'} hover:bg-gray-100`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-4xl mx-auto pb-24">
        {/* Product Image */}
        <div className="bg-white">
          <img
            src={product.imageUrl || 'https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image'}
            alt={product.name}
            className="w-full aspect-square object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = 'https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image';
            }}
          />
        </div>

        {/* Product Info */}
        <div className="bg-white px-4 py-6 border-b-8 border-gray-100">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded"
                >
                  {badge}
                </span>
              ))}
              {product.isTimeDeal && (
                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                  타임딜
                </span>
              )}
            </div>
          )}

          {/* Product Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {product.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-sm text-gray-500">
              ({product.reviewCount || 0}개 리뷰)
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            {basePrice > 0 && discountPercent && discountPercent > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(basePrice)}
                </span>
                <span className="text-xl font-bold text-red-500">
                  {discountPercent}%
                </span>
              </div>
            )}
            <div className="text-3xl font-bold text-gray-900">
              {displayPrice}
            </div>
            
            {/* 학생당 가격 정보 표시 */}
            {product.pricePerStudent && product.pricePerStudent > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      💡 학생당 가격 안내
                    </p>
                    <p className="text-xs text-blue-700">
                      학생 1명당 월 {formatPrice(product.pricePerStudent)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      총 가격 = (기본 가격 {product.monthlyPrice ? formatPrice(product.monthlyPrice) : formatPrice(product.price || 0)} + 학생당 가격 × 학생 수) × 개월 수
                    </p>
                    <p className="text-xs text-gray-600 mt-2 italic">
                      예: 기본 {formatPrice(product.monthlyPrice || product.price || 0)} + {formatPrice(product.pricePerStudent)} × 10명 × 3개월 = {formatPrice((product.monthlyPrice || product.price || 0) * 3 + product.pricePerStudent * 10 * 3)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Promotion Banner */}
          {product.promotionType && product.promotionDescription && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                  {product.promotionType === 'FREE_GIFT' ? '사은품' : '특가'}
                </span>
                <p className="text-sm text-gray-700 flex-1">
                  {product.promotionDescription}
                </p>
              </div>
              {product.promotionEndDate && (
                <p className="text-xs text-gray-500 mt-2">
                  종료: {new Date(product.promotionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-gray-600 leading-relaxed mb-4">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white sticky top-[57px] z-40 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'detail'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              상세정보
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              리뷰
            </button>
            <button
              onClick={() => setActiveTab('qna')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'qna'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              문의
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white px-4 py-6">
          {activeTab === 'detail' && (
            <div>
              {product.detailHtml ? (
                <div dangerouslySetInnerHTML={{ __html: product.detailHtml }} />
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-3">제품 설명</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                  
                  {product.features && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">주요 기능</h3>
                      <ul className="space-y-2">
                        {JSON.parse(product.features).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12 text-gray-500">
              <p>아직 등록된 리뷰가 없습니다.</p>
              <p className="text-sm mt-2">첫 번째 리뷰를 남겨보세요!</p>
            </div>
          )}

          {activeTab === 'qna' && (
            <div className="text-center py-12 text-gray-500">
              <p>문의사항이 있으시면</p>
              <p className="text-sm mt-2">
                <a
                  href="https://geru.kr/ln/40582"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  고객센터
                </a>
                로 연락주세요.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/store/purchase?id=${product.id}`}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            구매하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    }>
      <ProductDetailPageContent />
    </Suspense>
  );
}
