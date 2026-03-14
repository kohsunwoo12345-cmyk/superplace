'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Star, Sparkles, TrendingUp, Award, Grid3x3, List } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePerStudent?: number;
  numericPrice?: number;  // 숫자형 최종 가격
  numericOriginalPrice?: number;  // 숫자형 원가
  category: string;
  imageUrl: string;
  keywords: string[];
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  // 마케팅 필드
  originalPrice?: number;
  discountType?: string;
  discountValue?: number;
  promotionType?: string;
  promotionDescription?: string;
  badges?: string;
  isTimeDeal?: number;
  stockQuantity?: number;
  maxPurchasePerUser?: number;
}

const AIStorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // 각 섹션별 슬라이더 위치
  const [sliderPositions, setSliderPositions] = useState<{ [key: string]: number }>({});

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
    const loadProducts = async () => {
      try {
        console.log('🛒 Loading products from API...');
        const response = await fetch('/api/admin/store-products?activeOnly=true');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Products loaded:', data.products?.length || 0);
          
          const transformedProducts = (data.products || []).map((p: any) => {
            // 기본 가격 결정 (할인 전 원가)
            let basePrice = p.price || p.pricePerStudent || p.monthlyPrice || p.yearlyPrice || 0;
            
            // originalPrice가 있으면 이를 기본가로 사용
            if (p.originalPrice && p.originalPrice > 0) {
              basePrice = p.originalPrice;
            }
            
            // 할인 적용된 최종 가격 계산
            let finalPrice = basePrice;
            if (p.discountType === 'percentage' && p.discountValue > 0 && p.discountValue <= 100) {
              finalPrice = basePrice * (1 - p.discountValue / 100);
            } else if (p.discountType === 'fixed' && p.discountValue > 0) {
              finalPrice = Math.max(0, basePrice - p.discountValue);
            }
            
            return {
            id: p.id,
            name: p.name,
            description: p.shortDescription || p.description,
            price: p.pricePerStudent
              ? `₩${p.pricePerStudent.toLocaleString()}/학생/월`
              : p.monthlyPrice 
                ? `₩${p.monthlyPrice.toLocaleString()}/월` 
                : p.yearlyPrice 
                  ? `₩${p.yearlyPrice.toLocaleString()}/년`
                  : finalPrice > 0
                    ? `₩${Math.round(finalPrice).toLocaleString()}`
                    : '문의',
            pricePerStudent: p.pricePerStudent || 0,
            numericPrice: finalPrice,  // 숫자형 최종 가격
            numericOriginalPrice: basePrice,  // 숫자형 원가
            category: p.category === 'academy_operation' ? '학원 운영' 
                     : p.category === 'marketing_blog' ? '마케팅 & 블로그'
                     : p.category === 'expert' ? '전문가용' : p.category,
            imageUrl: p.imageUrl ? convertGoogleDriveUrl(p.imageUrl) : 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image',
            keywords: p.keywords ? p.keywords.split(',').map((k: string) => k.trim()) : [],
            featured: p.isFeatured === 1,
            rating: p.rating || 4.5,
            reviewCount: p.reviewCount || 0,
            // 마케팅 필드
            originalPrice: p.originalPrice,
            discountType: p.discountType,
            discountValue: p.discountValue,
            promotionType: p.promotionType,
            promotionDescription: p.promotionDescription,
            badges: p.badges,
            isTimeDeal: p.isTimeDeal,
            stockQuantity: p.stockQuantity,
            maxPurchasePerUser: p.maxPurchasePerUser,
          }));
          
          setProducts(transformedProducts);
          console.log('📦 Transformed products:', transformedProducts.length);
        }
      } catch (error) {
        console.error('❌ Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // 카테고리 목록
  const categories = useMemo(() => {
    const cats = [
      { id: 'all', name: '전체', icon: Grid3x3 },
      { id: '학원 운영', name: '학원 운영', icon: TrendingUp },
      { id: '마케팅 & 블로그', name: '마케팅 & 블로그', icon: Sparkles },
      { id: '전문가용', name: '전문가용', icon: Award },
    ];
    return cats;
  }, []);

  // 필터링된 상품
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // 섹션별 상품 그룹
  const sections = useMemo(() => [
    {
      id: 'section1',
      title: '학원 운영 봇',
      subtitle: '학원 운영의 효율성을 높이는 AI 봇',
      icon: TrendingUp,
      products: products.filter(p => p.category === '학원 운영'),
    },
    {
      id: 'section2',
      title: '마케팅 & 블로그 봇',
      subtitle: '비즈니스 성장을 위한 스마트 마케팅 도구',
      icon: Sparkles,
      products: products.filter(p => p.category === '마케팅 & 블로그'),
    },
    {
      id: 'section3',
      title: '전문가용 봇',
      subtitle: '고급 사용자를 위한 전문 솔루션',
      icon: Award,
      products: products.filter(p => p.category === '전문가용'),
    },
  ], [products]);

  // 자동 슬라이드
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    sections.forEach(section => {
      if (section.products.length > 3) {
        const maxPos = Math.ceil(section.products.length / 3) - 1;
        const interval = setInterval(() => {
          setSliderPositions(prev => {
            const currentPos = prev[section.id] || 0;
            const nextPos = currentPos >= maxPos ? 0 : currentPos + 1;
            return { ...prev, [section.id]: nextPos };
          });
        }, 5000); // 5초마다 자동 슬라이드
        
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [sections]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
    );

    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  const moveSlider = (sectionId: string, direction: 'left' | 'right') => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.products.length === 0) return;

    const itemsPerPage = 3; // 한 페이지에 3개 표시
    const maxPos = Math.max(0, Math.ceil(section.products.length / itemsPerPage) - 1);

    setSliderPositions(prev => {
      const currentPos = prev[sectionId] || 0;
      let newPos = currentPos;

      if (direction === 'left') {
        newPos = currentPos === 0 ? maxPos : currentPos - 1;
      } else {
        newPos = currentPos >= maxPos ? 0 : currentPos + 1;
      }

      return { ...prev, [sectionId]: newPos };
    });
  };

  const ProductCard = ({ product }: { product: Product }) => {
    // 배지 파싱
    const badges = product.badges ? product.badges.split(',').map(b => b.trim()).filter(b => b) : [];
    
    // 할인율 계산
    const getDiscountPercent = () => {
      if (product.discountType === 'percentage' && product.discountValue && product.discountValue <= 100) {
        return Math.round(product.discountValue);
      } else if (product.discountType === 'fixed' && product.numericOriginalPrice && product.discountValue) {
        const percent = (product.discountValue / product.numericOriginalPrice) * 100;
        return Math.round(Math.min(percent, 100));  // 최대 100%
      }
      return 0;
    };
    
    const discountPercent = getDiscountPercent();
    
    return (
    <div
      className={`group bg-white rounded-xl overflow-hidden transition-all hover:shadow-xl ${
        product.featured
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'border border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Image */}
      <div className="relative w-full pt-[65%] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {/* 배지 표시 */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
          {product.featured && (
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <Award className="w-3 h-3" />
              BEST
            </span>
          )}
          {badges.map((badge, idx) => (
            <span key={idx} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow">
              {badge}
            </span>
          ))}
          {product.isTimeDeal === 1 && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold shadow animate-pulse">
              ⏰ 타임딜
            </span>
          )}
        </div>
        
        {/* 할인율 표시 */}
        {discountPercent > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
              <div className="text-xl font-bold">{discountPercent}%</div>
              <div className="text-xs">할인</div>
            </div>
          </div>
        )}
        
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(product.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {product.rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-gray-500">
            ({product.reviewCount || 0})
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        {/* 프로모션 표시 */}
        {product.promotionDescription && product.promotionType && product.promotionType !== 'none' && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-semibold">
              🎁 {product.promotionDescription}
            </p>
          </div>
        )}

        {/* Price & Button */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            {product.numericOriginalPrice && product.numericOriginalPrice > 0 && discountPercent > 0 ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ₩{product.numericOriginalPrice.toLocaleString()}
                </span>
                <span className="text-xl font-bold text-red-600">
                  ₩{(product.numericPrice || 0).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {product.price}
              </span>
            )}
          </div>
          
          {/* 재고 정보 */}
          {product.stockQuantity !== undefined && product.stockQuantity >= 0 && (
            <p className="text-xs text-gray-500">
              {product.stockQuantity === 0 ? '품절' : `재고 ${product.stockQuantity}개`}
            </p>
          )}
          
          <Link
            href={`/store/detail?id=${product.id}`}
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg text-sm font-bold hover:shadow-lg hover:scale-105 transition-all text-center"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">SP</span>
              </div>
              <div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SUPER PLACE AI
                </div>
                <div className="text-xs text-gray-500 font-medium">AI 쇼핑몰</div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2 rounded-full text-sm text-gray-700 mb-8 shadow-lg border border-gray-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">신상품 입고</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI 학습 관리
            </span>
            <br />
            <span className="text-gray-800">솔루션</span>
          </h1>
          
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
            학원 운영을 스마트하게, AI로 더 쉽게 관리하세요
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full text-sm shadow-lg border border-gray-200">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-gray-800">4.8</span>
              <span className="text-gray-600">평균 별점</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full text-sm shadow-lg border border-gray-200">
              <span className="font-bold text-blue-600">{products.length}개</span>
              <span className="text-gray-600">상품</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full text-sm shadow-lg border border-gray-200">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-bold text-gray-800">1,000+</span>
              <span className="text-gray-600">고객사</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="어떤 AI 솔루션을 찾으시나요?"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg shadow-xl"
              />
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    검색 결과 {searchResults.length}개
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/store/detail?id=${product.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{product.price}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {product.rating?.toFixed(1)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-white/20'
                    : 'bg-gray-100'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {sections.map((section) => {
          const Icon = section.icon;
          const currentPos = sliderPositions[section.id] || 0;
          
          return section.products.length > 0 && (selectedCategory === 'all' || selectedCategory === section.products[0]?.category) && (
            <section key={section.id} className="relative">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600">{section.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Slider Container */}
              <div className="relative">
                {/* Slider */}
                <div className="overflow-hidden rounded-2xl">
                  <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentPos * 100}%)` }}
                  >
                    {Array.from({ length: Math.ceil(section.products.length / 3) }).map((_, pageIdx) => (
                      <div key={pageIdx} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                          {section.products.slice(pageIdx * 3, pageIdx * 3 + 3).map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {section.products.length > 3 && (
                  <>
                    <button
                      onClick={() => moveSlider(section.id, 'left')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all flex items-center justify-center group"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => moveSlider(section.id, 'right')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all flex items-center justify-center group"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {section.products.length > 3 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(section.products.length / 3) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSliderPositions(prev => ({ ...prev, [section.id]: idx }))}
                        className={`transition-all rounded-full ${
                          currentPos === idx
                            ? 'w-8 h-3 bg-gradient-to-r from-blue-600 to-purple-600'
                            : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SP</span>
              </div>
              <div>
                <div className="text-xl font-bold">SUPER PLACE AI</div>
                <div className="text-sm text-gray-400">© 2024 All rights reserved.</div>
              </div>
            </div>
            <div className="flex gap-8">
              <a href="https://geru.kr/ln/40779" className="text-gray-400 hover:text-white transition-colors">
                소개
              </a>
              <a href="https://geru.kr/ln/44060" className="text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
              <a href="https://geru.kr/ln/40582" className="text-gray-400 hover:text-white transition-colors">
                문의
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AIStorePage;
