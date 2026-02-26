'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Share2, ChevronRight } from 'lucide-react';
import BotPurchaseDialog from '@/components/BotPurchaseDialog';

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number;
  pricePerStudent: number;
  originalPrice: number;
  discountType: string;
  discountValue: number;
  badges: string;
  category: string;
  imageUrl: string;
  detailHtml: string;
  features: string;
  keywords: string;
}

// Static params generation for build time
export async function generateStaticParams() {
  // This will be called at build time to generate static pages
  // Return empty array to generate pages on-demand
  return [];
}

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  // 제품 이미지들 (메인 이미지 + 추가 이미지)
  const [productImages, setProductImages] = useState<string[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        console.log('📦 Loading product:', productId);
        const response = await fetch(`/api/admin/store-products?activeOnly=true`);
        
        if (response.ok) {
          const data = await response.json();
          const foundProduct = data.products?.find((p: any) => p.id === productId);
          
          if (foundProduct) {
            setProduct(foundProduct);
            
            // 이미지 배열 구성
            const images = [foundProduct.imageUrl || 'https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image'];
            setProductImages(images);
            
            console.log('✅ Product loaded:', foundProduct.name);
          } else {
            console.warn('⚠️ Product not found');
            alert('제품을 찾을 수 없습니다.');
            router.push('/store');
          }
        } else {
          console.error('❌ Failed to load products');
          router.push('/store');
        }
      } catch (error) {
        console.error('❌ Error loading product:', error);
        router.push('/store');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const calculateDiscountedPrice = () => {
    if (!product) return 0;
    const basePrice = product.pricePerStudent || product.monthlyPrice || product.price;
    
    if (product.discountType === 'percent') {
      return basePrice * (1 - product.discountValue / 100);
    } else if (product.discountType === 'fixed') {
      return basePrice - product.discountValue;
    }
    return basePrice;
  };

  const getDiscountRate = () => {
    if (!product || !product.originalPrice) return 0;
    const currentPrice = calculateDiscountedPrice();
    return Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100);
  };

  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  const parseBadges = () => {
    if (!product || !product.badges) return [];
    try {
      return product.badges.split(',').map(b => b.trim()).filter(Boolean);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">제품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">제품을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/store')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const discountedPrice = calculateDiscountedPrice();
  const discountRate = getDiscountRate();
  const badges = parseBadges();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[448px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/store')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">상품 상세</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[448px] mx-auto">
        {/* 이미지 슬라이더 */}
        <div className="relative bg-gray-100">
          <div className="aspect-square relative">
            <img
              src={productImages[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image';
              }}
            />
          </div>

          {/* 이미지 인디케이터 */}
          {productImages.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      currentImageIndex === idx ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* 이미지 네비게이션 */}
              {currentImageIndex > 0 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentImageIndex < productImages.length - 1 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="p-4 border-b border-gray-200">
          {/* 카테고리 */}
          <div className="text-sm text-gray-500 mb-2">
            {product.category === 'academy_operation' ? '학원 운영' 
             : product.category === 'marketing_blog' ? '마케팅 & 블로그'
             : product.category === 'expert' ? '전문가용' : product.category}
          </div>

          {/* 제품명 */}
          <h2 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h2>

          {/* 가격 정보 */}
          <div className="flex items-center gap-2 mb-3">
            {discountRate > 0 && (
              <span className="text-red-600 text-2xl font-bold">{discountRate}%</span>
            )}
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(discountedPrice)}
            </span>
            {product.pricePerStudent > 0 && (
              <span className="text-sm text-gray-500">/학생/월</span>
            )}
          </div>

          {product.originalPrice > 0 && discountRate > 0 && (
            <div className="text-sm text-gray-400 line-through mb-3">
              {formatPrice(product.originalPrice)}
            </div>
          )}

          {/* 배지 */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* 짧은 설명 */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* 배송 정보 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">배송</span>
            <span className="text-sm font-medium">즉시 SMS 발송</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">혜택</span>
            <span className="text-sm font-medium text-blue-600">평생 무료 업데이트</span>
          </div>
        </div>

        {/* Sticky 탭 메뉴 */}
        <div className="sticky top-[57px] z-40 bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'detail'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              상품상세
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              리뷰
            </button>
            <button
              onClick={() => setActiveTab('qna')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'qna'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              문의
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="pb-24">
          {activeTab === 'detail' && (
            <div className="p-4">
              {/* 상세 HTML 영역 */}
              {product.detailHtml ? (
                <div
                  id="productDetailHTML"
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.detailHtml }}
                />
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p className="mb-2">상세 설명이 준비 중입니다.</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-4">
              <div className="text-center py-12 text-gray-500">
                <p>아직 등록된 리뷰가 없습니다.</p>
                <p className="text-sm mt-2">첫 번째 리뷰를 남겨보세요!</p>
              </div>
            </div>
          )}

          {activeTab === 'qna' && (
            <div className="p-4">
              <div className="text-center py-12 text-gray-500">
                <p>문의사항이 있으시면</p>
                <p className="text-sm mt-2">
                  <a href="https://geru.kr/ln/40582" className="text-blue-600 hover:underline">
                    고객센터
                  </a>
                  로 연락주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 구매 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-[448px] mx-auto p-4">
          <button
            onClick={() => {
              if (product.pricePerStudent && product.pricePerStudent > 0) {
                setPurchaseDialogOpen(true);
              } else {
                alert('이 제품은 현재 구매 신청이 불가능합니다. 관리자에게 문의하세요.');
              }
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            구매하기
          </button>
        </div>
      </div>

      {/* 구매 신청 다이얼로그 */}
      {product.pricePerStudent > 0 && (
        <BotPurchaseDialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            pricePerStudent: product.pricePerStudent
          }}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
