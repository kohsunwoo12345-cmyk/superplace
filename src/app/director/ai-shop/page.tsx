'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, TrendingUp, Star, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  sales: number;
  description: string;
  image: string;
}

export default function AIShopPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'AI 수학 문제집 생성기',
      category: '수학',
      price: 50000,
      rating: 4.8,
      sales: 234,
      description: 'AI가 학생 수준에 맞춰 자동으로 수학 문제집을 생성합니다',
      image: '📚'
    },
    {
      id: '2',
      name: 'AI 영어 회화 튜터',
      category: '영어',
      price: 80000,
      rating: 4.9,
      sales: 189,
      description: '실시간 영어 회화 연습 및 발음 교정 AI',
      image: '🗣️'
    },
    {
      id: '3',
      name: 'AI 과학 실험 시뮬레이터',
      category: '과학',
      price: 120000,
      rating: 4.7,
      sales: 156,
      description: '가상 환경에서 안전하게 과학 실험을 진행',
      image: '🔬'
    },
    {
      id: '4',
      name: 'AI 한국사 학습 도우미',
      category: '사회',
      price: 45000,
      rating: 4.6,
      sales: 203,
      description: '역사 사건을 스토리텔링으로 쉽게 이해',
      image: '📜'
    },
    {
      id: '5',
      name: 'AI 코딩 교육 플랫폼',
      category: '코딩',
      price: 150000,
      rating: 5.0,
      sales: 298,
      description: '초보자부터 고급 개발자까지 단계별 코딩 교육',
      image: '💻'
    },
    {
      id: '6',
      name: 'AI 독서 감상문 분석기',
      category: '국어',
      price: 35000,
      rating: 4.5,
      sales: 167,
      description: '학생의 독서 감상문을 분석하고 피드백 제공',
      image: '📖'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const categories = ['전체', '수학', '영어', '과학', '사회', '코딩', '국어'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI 쇼핑몰</h1>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">대시보드로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 상품 수</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}개</div>
              <p className="text-xs text-muted-foreground">다양한 AI 교육 솔루션</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}점
              </div>
              <p className="text-xs text-muted-foreground">5점 만점 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 판매량</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + p.sales, 0)}건
              </div>
              <p className="text-xs text-muted-foreground">누적 판매 건수</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="상품 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl">{product.image}</div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">카테고리</span>
                    <span className="text-sm font-medium">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">판매량</span>
                    <span className="text-sm font-medium">{product.sales}건</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600">
                      ₩{product.price.toLocaleString()}
                    </span>
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      구매하기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
