"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Package,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoreProduct {
  id: string;
  name: string;
  category: string;
  section: string;
  description: string;
  shortDescription?: string;
  price: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features?: string[];
  detailHtml?: string;
  imageUrl?: string;
  botId?: string;
  isActive: number;
  isFeatured: number;
  displayOrder: number;
  keywords?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoreManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== "SUPER_ADMIN" && userData.role !== "ADMIN") {
      alert("접근 권한이 없습니다.");
      router.push("/dashboard");
      return;
    }

    setUser(userData);
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: Cloudflare Worker API로 교체 필요
      // const response = await fetch("/api/admin/store/products");
      // if (response.ok) {
      //   const data = await response.json();
      //   setProducts(data.products || []);
      //   setFilteredProducts(data.products || []);
      //   calculateStats(data.products || []);
      // }
      
      // 임시 mock 데이터
      setProducts([]);
      setFilteredProducts([]);
      calculateStats([]);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsList: StoreProduct[]) => {
    const total = productsList.length;
    const active = productsList.filter((p) => p.isActive === 1).length;
    const featured = productsList.filter((p) => p.isFeatured === 1).length;
    const totalRevenue = 0; // TODO: Calculate from purchase requests

    setStats({ total, active, featured, totalRevenue });
  };

  useEffect(() => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          (p.keywords && p.keywords.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleDelete = async (productId: string) => {
    if (!confirm("정말로 이 제품을 삭제하시겠습니까?")) {
      return;
    }

    alert("API 구현이 필요합니다. Cloudflare Worker에서 구현 예정.");
    // TODO: Cloudflare Worker API 연결
    // const response = await fetch(`/api/admin/store/products/${productId}`, {
    //   method: "DELETE",
    // });
  };

  const toggleActive = async (productId: string, currentStatus: number) => {
    alert("API 구현이 필요합니다. Cloudflare Worker에서 구현 예정.");
    // TODO: Cloudflare Worker API 연결
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      academy_operation: "학원 운영",
      marketing_blog: "마케팅 & 블로그",
      expert: "전문가",
      all: "전체",
    };
    return labels[category] || category;
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            AI 봇 쇼핑몰 관리
          </h1>
          <p className="text-gray-600 mt-1">쇼핑몰 제품을 추가하고 관리합니다</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          onClick={() => router.push("/dashboard/admin/store-management/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          신규 제품 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 제품</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 제품</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">추천 제품</CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.featured}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 매출</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalRevenue.toLocaleString()}원
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="제품 이름, 설명, 키워드로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">전체 카테고리</option>
                <option value="academy_operation">학원 운영</option>
                <option value="marketing_blog">마케팅 & 블로그</option>
                <option value="expert">전문가</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제품 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">등록된 제품이 없습니다.</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/admin/store-management/create")}
              >
                첫 제품 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* 제품 이미지 */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 제품 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {product.name}
                          {product.isFeatured === 1 && (
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {getCategoryLabel(product.category)}
                          </Badge>
                          <Badge
                            variant={product.isActive === 1 ? "default" : "secondary"}
                          >
                            {product.isActive === 1 ? "활성" : "비활성"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/dashboard/admin/store-management/edit/${product.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.shortDescription || product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {product.monthlyPrice && (
                          <div>
                            <span className="text-sm text-gray-500">월간:</span>
                            <span className="ml-2 font-semibold text-lg">
                              {product.monthlyPrice.toLocaleString()}원
                            </span>
                          </div>
                        )}
                        {product.yearlyPrice && (
                          <div>
                            <span className="text-sm text-gray-500">연간:</span>
                            <span className="ml-2 font-semibold text-lg">
                              {product.yearlyPrice.toLocaleString()}원
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(product.id, product.isActive)}
                        >
                          {product.isActive === 1 ? "비활성화" : "활성화"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/store`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          쇼핑몰
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
