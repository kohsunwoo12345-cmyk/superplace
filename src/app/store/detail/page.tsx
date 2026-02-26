'use client';

import { useState, useEffect } from 'react';
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
}

export default function ProductDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'qna'>('detail');
  const [liked, setLiked] = useState(false);

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
    if (!product || !product.originalPrice) return null;
    
    let discountedPrice = product.pricePerStudent || product.monthlyPrice || product.price;
    
    if (product.discountType === 'PERCENTAGE' && product.discountValue) {
      return Math.round((product.originalPrice - discountedPrice) / product.originalPrice * 100);
    } else if (product.discountType === 'AMOUNT' && product.discountValue) {
      return Math.round((product.originalPrice - discountedPrice) / product.originalPrice * 100);
    }
    
    return null;
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
  const badges = parseBadges(product.badges);
  const displayPrice = product.pricePerStudent 
    ? `${formatPrice(product.pricePerStudent)}/학생/월`
    : product.monthlyPrice 
      ? `${formatPrice(product.monthlyPrice)}/월`
      : formatPrice(product.price);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Price Section */}
          <div className="mb-4">
            {product.originalPrice && discountPercent && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-xl font-bold text-red-500">
                  {discountPercent}%
                </span>
              </div>
            )}
            <div className="text-3xl font-bold text-gray-900">
              {displayPrice}
            </div>
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
