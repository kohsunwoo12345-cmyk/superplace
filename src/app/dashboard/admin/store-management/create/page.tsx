"use client";
// AI 쇼핑몰 제품 추가 페이지 (Cloudflare Pages Deployment: 2026-02-18)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ArrowLeft,
  Save,
  Eye,
  Code,
  Package,
  DollarSign,
  Star,
  Image as ImageIcon,
} from "lucide-react";

export default function CreateStoreProductPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableBots, setAvailableBots] = useState<any[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    section: string;
    description: string;
    shortDescription: string;
    price: number | string;
    monthlyPrice: number | string;
    yearlyPrice: number | string;
    pricePerStudent: number | string;      // 🆕 학생당 월 가격
    features: string;
    detailHtml: string;
    imageUrl: string;
    botId: string;
    isActive: number;
    isFeatured: number;
    displayOrder: number | string;
    keywords: string;
  }>({
    name: "",
    category: "academy_operation",
    section: "academy_bots",
    description: "",
    shortDescription: "",
    price: "",
    monthlyPrice: "",
    yearlyPrice: "",
    pricePerStudent: "",                   // 🆕 학생당 월 가격 초기값
    features: "",
    detailHtml: "",
    imageUrl: "",
    botId: "",
    isActive: 1,
    isFeatured: 0,
    displayOrder: "",
    keywords: "",
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
    fetchBots();
  }, [router]);

  const fetchBots = async () => {
    try {
      // TODO: Cloudflare Worker API 연결
      const response = await fetch("/api/admin/ai-bots");
      if (response.ok) {
        const data = await response.json();
        setAvailableBots(data.bots || []);
      }
    } catch (error) {
      console.error("Error fetching bots:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData((prev) => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert("제품명과 설명은 필수 입력 사항입니다.");
      return;
    }

    setLoading(true);

    try {
      // localStorage에 제품 저장 (임시 솔루션)
      const existingProducts = localStorage.getItem("storeProducts");
      const products = existingProducts ? JSON.parse(existingProducts) : [];
      
      const newProduct = {
        id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        price: formData.price === "" ? 0 : Number(formData.price),
        monthlyPrice: formData.monthlyPrice === "" ? 0 : Number(formData.monthlyPrice),
        yearlyPrice: formData.yearlyPrice === "" ? 0 : Number(formData.yearlyPrice),
        pricePerStudent: formData.pricePerStudent === "" ? 0 : Number(formData.pricePerStudent), // 🆕
        displayOrder: formData.displayOrder === "" ? 0 : Number(formData.displayOrder),
        features: formData.features ? formData.features.split("\n").filter((f) => f.trim()) : [],
        createdById: user?.id || "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      products.push(newProduct);
      localStorage.setItem("storeProducts", JSON.stringify(products));
      
      alert("제품이 성공적으로 생성되었습니다!");
      router.push("/dashboard/admin/store-management");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseInt(value) || 0) : value,
    }));
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      academy_operation: "학원 운영",
      marketing_blog: "마케팅 & 블로그",
      expert: "전문가",
    };
    return labels[category] || category;
  };

  if (!user) {
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
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/admin/store-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              신규 제품 추가
            </h1>
            <p className="text-gray-600 mt-1">쇼핑몰에 판매할 새로운 AI 봇 제품을 추가합니다</p>
          </div>
        </div>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
        >
          {showPreview ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showPreview ? "편집 모드" : "미리보기"}
        </Button>
      </div>

      {showPreview ? (
        // 미리보기 모드
        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <CardDescription>고객이 보게 될 화면입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 제품 이미지 */}
              {formData.imageUrl && (
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 제품 정보 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge>{getCategoryLabel(formData.category)}</Badge>
                  {formData.isFeatured === 1 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      추천
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-bold mb-4">{formData.name || "제품명"}</h2>
                <p className="text-gray-600 text-lg mb-6">
                  {formData.shortDescription || "간단한 설명"}
                </p>

                {/* 가격 정보 */}
                <div className="flex gap-6 mb-6 flex-wrap">
                  {Number(formData.pricePerStudent) > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg flex-1 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">학생당 월 가격</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Number(formData.pricePerStudent).toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500 mt-1">학생 × 개월 수로 계산</p>
                    </div>
                  )}
                  {Number(formData.monthlyPrice) > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg flex-1 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">월간 구독</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Number(formData.monthlyPrice).toLocaleString()}원
                      </p>
                    </div>
                  )}
                  {Number(formData.yearlyPrice) > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg flex-1 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">연간 구독</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Number(formData.yearlyPrice).toLocaleString()}원
                      </p>
                    </div>
                  )}
                </div>

                {/* 주요 기능 */}
                {formData.features && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">주요 기능</h3>
                    <ul className="space-y-2">
                      {formData.features.split("\n").filter((f) => f.trim()).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 상세 HTML */}
                {formData.detailHtml && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">상세 설명</h3>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.detailHtml }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // 편집 모드
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>제품의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  제품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 학교/학년 별 내신 대비 봇"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">카테고리</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="academy_operation">학원 운영</option>
                    <option value="marketing_blog">마케팅 & 블로그</option>
                    <option value="expert">전문가</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">섹션</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="academy_bots">학원 운영 봇</option>
                    <option value="blog_bots">블로그 & 마케팅 봇</option>
                    <option value="expert_bots">전문가 봇</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  간단한 설명 (목록용)
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="한 줄로 제품을 설명하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  상세 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="제품에 대한 자세한 설명을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">제품 이미지</label>
                
                {/* 이미지 미리보기 */}
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="제품 이미지 미리보기"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl && !imagePreview ? formData.imageUrl : ""}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="또는 이미지 URL 입력"
                    disabled={!!imagePreview}
                  />
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {imagePreview ? "변경" : "업로드"}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                        setFormData((prev) => ({ ...prev, imageUrl: "" }));
                      }}
                    >
                      삭제
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  이미지 파일을 업로드하거나 URL을 입력하세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  연결된 AI 봇
                </label>
                <select
                  name="botId"
                  value={formData.botId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택 안함</option>
                  {availableBots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 가격 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                가격 정보
              </CardTitle>
              <CardDescription>구독 기간별 가격을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">기본 가격</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    🆕 학생당 월 가격 (원)
                    <span className="text-xs text-gray-500 ml-2">예: 990</span>
                  </label>
                  <input
                    type="number"
                    name="pricePerStudent"
                    value={formData.pricePerStudent}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="990"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    학원장이 구매 시: 학생 수 × 개월 수 × 이 금액
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">월간 가격 (1개월)</label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">연간 가격 (12개월)</label>
                  <input
                    type="number"
                    name="yearlyPrice"
                    value={formData.yearlyPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주요 기능 */}
          <Card>
            <CardHeader>
              <CardTitle>주요 기능</CardTitle>
              <CardDescription>
                제품의 주요 기능을 한 줄씩 입력하세요 (줄바꿈으로 구분)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={"24시간 AI 학습 도우미\n학년별 맞춤 교육 과정\n음성 및 텍스트 질문 지원\n자동 숙제 검사 및 피드백"}
              />
            </CardContent>
          </Card>

          {/* 상세 HTML */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                상세 페이지 HTML
              </CardTitle>
              <CardDescription>
                제품 상세 페이지에 표시될 HTML 콘텐츠를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                name="detailHtml"
                value={formData.detailHtml}
                onChange={handleChange}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`<h2>제품 소개</h2>
<p>이 제품은...</p>
<h3>주요 특징</h3>
<ul>
  <li>특징 1</li>
  <li>특징 2</li>
</ul>`}
              />
            </CardContent>
          </Card>

          {/* 추가 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>추가 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  검색 키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 내신, 학원, AI봇, 교육"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">노출 순서</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked ? 1 : 0 }))
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    활성화
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isFeatured: e.target.checked ? 1 : 0 }))
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium">
                    추천 제품
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/admin/store-management")}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  제품 생성
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
