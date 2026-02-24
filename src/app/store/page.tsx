'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import BotPurchaseDialog from '@/components/BotPurchaseDialog';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePerStudent?: number;  // 🆕 학생당 월 가격
  category: string;
  imageUrl: string;
  keywords: string[];
  featured?: boolean;
}

const AIStorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sliderPositions, setSliderPositions] = useState<{ [key: string]: number }>({
    section1: 0,
    section2: 0,
    section3: 0,
  });
  const [viewAll, setViewAll] = useState<{ [key: string]: boolean }>({
    section1: false,
    section2: false,
    section3: false,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);  // 🆕
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);           // 🆕

  // API에서 제품 로드 (D1 database)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🛒 Loading products from API...');
        const response = await fetch('/api/admin/store-products?activeOnly=true');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Products loaded:', data.products?.length || 0);
          
          // Transform products to match display format
          const transformedProducts = (data.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.shortDescription || p.description,
            price: p.pricePerStudent
              ? `₩${p.pricePerStudent.toLocaleString()}/학생/월`
              : p.monthlyPrice 
                ? `₩${p.monthlyPrice.toLocaleString()}/월` 
                : p.yearlyPrice 
                  ? `₩${p.yearlyPrice.toLocaleString()}/년`
                  : '문의',
            pricePerStudent: p.pricePerStudent || 0,  // 🆕 추가
            category: p.category === 'academy_operation' ? '학원 운영' 
                     : p.category === 'marketing_blog' ? '마케팅 & 블로그'
                     : p.category === 'expert' ? '전문가용' : p.category,
            imageUrl: p.imageUrl || 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image',
            keywords: p.keywords ? p.keywords.split(',').map((k: string) => k.trim()) : [],
            featured: p.isFeatured === 1,
          }));
          
          setProducts(transformedProducts);
          console.log('📦 Transformed products:', transformedProducts.length);
          console.log('📦 Products by category:', {
            '학원 운영': transformedProducts.filter(p => p.category === '학원 운영').length,
            '마케팅 & 블로그': transformedProducts.filter(p => p.category === '마케팅 & 블로그').length,
            '전문가용': transformedProducts.filter(p => p.category === '전문가용').length,
          });
        } else {
          console.warn('⚠️ Failed to load products from API, using fallback');
          // Fallback to default products
          setProducts([
            {
              id: '1',
              name: '학교/학년 별 내신 대비 봇',
              description: '학년별로 맞춤화된 내신 대비 학습 지원',
              price: '문의',
              category: '학원 운영',
              imageUrl: 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image',
              keywords: ['내신', '학교', '학년', '시험'],
            },
            {
              id: '2',
              name: '영어 내신 클리닉 마스터 봇',
              description: '학년별 영어내신 클리닉 마스터 - 24시간 AI 숙제 도우미 & 음성 튜터',
              price: '문의',
              category: '학원 운영',
              imageUrl: 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image',
              keywords: ['영어', '내신', '클리닉', '숙제', '튜터'],
              featured: true,
            },
            {
              id: '3',
              name: '블로그 SEO 사진 제작 봇',
              description: '네이버 블로그 상위노출을 위한 AI 사진 생성',
              price: '문의',
              category: '마케팅 & 블로그',
              imageUrl: 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image',
              keywords: ['블로그', 'SEO', '사진', '네이버', '상위노출'],
              featured: true,
            },
          ]);
        }
      } catch (error) {
        console.error('❌ Error loading products:', error);
        // Load minimal fallback products on error
        setProducts([
          {
            id: '1',
            name: '학교/학년 별 내신 대비 봇',
            description: '학년별로 맞춤화된 내신 대비 학습 지원',
            price: '문의',
            category: '학원 운영',
            imageUrl: '/api/placeholder/400/480',
            keywords: ['내신', '학교', '학년', '시험'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const sections = [
    {
      id: 'section1',
      title: '학원 운영 봇',
      subtitle: '학원 운영의 효율성을 높이는 AI 봇',
      products: products.filter(p => p.category === '학원 운영'),
    },
    {
      id: 'section2',
      title: '마케팅 & 블로그 봇',
      subtitle: '비즈니스 성장을 위한 스마트 마케팅 도구',
      products: products.filter(p => p.category === '마케팅 & 블로그'),
    },
    {
      id: 'section3',
      title: '전문가용 봇',
      subtitle: '맞춤형 AI 솔루션으로 경쟁력 강화',
      products: products.filter(p => p.category === '전문가용'),
    },
  ];

  // 검색 기능
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = products.filter(p => {
      const lowerQuery = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      );
    });

    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  // 슬라이더 이동
  const slideMove = (sectionId: string, direction: 'left' | 'right') => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const currentPos = sliderPositions[sectionId] || 0;
    const maxSlides = section.products.length;
    
    let newPos = currentPos;
    if (direction === 'left' && currentPos > 0) {
      newPos = currentPos - 1;
    } else if (direction === 'right' && currentPos < maxSlides - 1) {
      newPos = currentPos + 1;
    }

    setSliderPositions(prev => ({ ...prev, [sectionId]: newPos }));
  };

  // 전체보기 토글
  const toggleView = (sectionId: string) => {
    setViewAll(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">
            SUPER PLACE <span className="text-gray-900">AI</span>
          </div>
          <nav className="flex gap-4">
            <a href="https://geru.kr/ln/40779" className="text-sm text-gray-600 hover:text-gray-900">소개</a>
            <a href="https://geru.kr/ln/44060" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            <a href="https://geru.kr/ln/40582" className="text-sm text-gray-600 hover:text-gray-900">문의</a>
          </nav>
        </div>
      </header>

      {/* Banner */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI 교육 봇 쇼핑</h1>
          <p className="text-gray-600 mb-6">학원의 효율성을 높이는 스마트한 AI 솔루션</p>
          
          {/* Search Box */}
          <div className="relative max-w-md mx-auto">
            <div className="flex bg-white border-2 border-blue-600 rounded overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                placeholder="찾는 봇을 검색해보세요"
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map(product => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                    >
                      <div className="font-semibold text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.description}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {sections.map((section) => (
          <section key={section.id} className="mb-16">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-gray-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-400">{section.subtitle}</p>
              </div>
              <button
                onClick={() => toggleView(section.id)}
                className="text-sm text-gray-900 flex items-center gap-1 hover:text-blue-600"
              >
                <span>{viewAll[section.id] ? '접기' : '전체보기'}</span>
                <span>→</span>
              </button>
            </div>

            {/* Products */}
            {!viewAll[section.id] ? (
              /* Slider View */
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${(sliderPositions[section.id] || 0) * 100}%)`,
                    }}
                  >
                    {section.products.map((product) => (
                      <div key={product.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2">
                        <div className={`bg-white rounded border overflow-hidden transition-all h-full flex flex-direction-column ${
                          product.featured ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:shadow-lg'
                        }`}>
                          <div className="relative w-full pt-[120%] bg-gray-100">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="absolute top-0 left-0 w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null; // Prevent infinite loop
                                target.src = 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="p-3 flex-grow">
                            <h3 className="font-semibold text-sm text-gray-900 mb-2">{product.name}</h3>
                            <p className="text-xs text-gray-600 mb-3 min-h-[36px]">{product.description}</p>
                            <div className="text-lg font-bold text-blue-600 mb-3">{product.price}</div>
                            <button 
                              onClick={() => {
                                if (product.pricePerStudent && product.pricePerStudent > 0) {
                                  setSelectedProduct(product);
                                  setPurchaseDialogOpen(true);
                                } else {
                                  alert('이 제품은 현재 구매 신청이 불가능합니다. 관리자에게 문의하세요.');
                                }
                              }}
                              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700"
                            >
                              구매하기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slider Controls */}
                {section.products.length > 1 && (
                  <>
                    <button
                      onClick={() => slideMove(section.id, 'left')}
                      disabled={(sliderPositions[section.id] || 0) === 0}
                      className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => slideMove(section.id, 'right')}
                      disabled={(sliderPositions[section.id] || 0) >= section.products.length - 1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {section.products.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSliderPositions(prev => ({ ...prev, [section.id]: idx }))}
                      className={`w-2 h-2 rounded-full transition-all ${
                        (sliderPositions[section.id] || 0) === idx
                          ? 'bg-blue-600 w-4'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.products.map((product) => (
                  <div key={product.id} className={`bg-white rounded border overflow-hidden transition-all ${
                    product.featured ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:shadow-lg'
                  }`}>
                    <div className="relative w-full pt-[120%] bg-gray-100">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null; // Prevent infinite loop
                          target.src = 'https://placehold.co/400x480/e2e8f0/94a3b8?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-3 min-h-[36px]">{product.description}</p>
                      <div className="text-lg font-bold text-blue-600 mb-3">{product.price}</div>
                      <button 
                        onClick={() => {
                          if (product.pricePerStudent && product.pricePerStudent > 0) {
                            setSelectedProduct(product);
                            setPurchaseDialogOpen(true);
                          } else {
                            alert('이 제품은 현재 구매 신청이 불가능합니다. 관리자에게 문의하세요.');
                          }
                        }}
                        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700"
                      >
                        구매하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-lg font-bold mb-2">SUPER PLACE AI</div>
          <p className="text-sm text-gray-400">© 2024 SUPER PLACE. All rights reserved.</p>
        </div>
      </footer>

      {/* 🆕 구매 신청 다이얼로그 */}
      {selectedProduct && selectedProduct.pricePerStudent && (
        <BotPurchaseDialog
          open={purchaseDialogOpen}
          onClose={() => {
            setPurchaseDialogOpen(false);
            setSelectedProduct(null);
          }}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            pricePerStudent: selectedProduct.pricePerStudent
          }}
        />
      )}
    </div>
  );
};

export default AIStorePage;
