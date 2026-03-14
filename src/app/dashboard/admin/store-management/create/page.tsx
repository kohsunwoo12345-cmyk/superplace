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
    dailyChatLimit: number | string;       // 🆕 하루 채팅 제한 (학생별)
    // 🆕 마케팅 필드
    originalPrice: number | string;        // 원가 (할인 전 가격)
    discountType: string;                  // none, percentage, fixed
    discountValue: number | string;        // 할인율(%) 또는 할인금액(원)
    promotionType: string;                 // none, 1plus1, 2plus1, gift
    promotionDescription: string;          // 프로모션 설명
    promotionStartDate: string;            // 프로모션 시작일
    promotionEndDate: string;              // 프로모션 종료일
    badges: string;                        // 배지 (JSON array)
    isTimeDeal: number;                    // 타임딜 여부
    stockQuantity: number | string;        // 재고 수량 (-1: 무제한)
    maxPurchasePerUser: number | string;   // 1인당 최대 구매 수량
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
    dailyChatLimit: "15",                   // 🆕 하루 채팅 제한 (기본 15개)
    // 🆕 마케팅 필드 초기값
    originalPrice: "",
    discountType: "none",
    discountValue: "",
    promotionType: "none",
    promotionDescription: "",
    promotionStartDate: "",
    promotionEndDate: "",
    badges: "",
    isTimeDeal: 0,
    stockQuantity: "-1",
    maxPurchasePerUser: "-1",
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        alert(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.\n현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      setImageFile(file);
      
      // 로컬 미리보기용 Base64 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
      
      // R2에 업로드
      try {
        console.log("📤 Uploading image to R2...");
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        
        const uploadResponse = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log("✅ Image uploaded to R2:", uploadResult.url);
          
          // R2 URL을 formData에 저장
          setFormData((prev) => ({ ...prev, imageUrl: uploadResult.url }));
          alert("이미지가 업로드되었습니다!");
        } else {
          const errorData = await uploadResponse.json();
          console.error("❌ Upload failed:", errorData);
          alert(`이미지 업로드 실패: ${errorData.message || errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Upload error:", error);
        alert("이미지 업로드 중 오류가 발생했습니다.");
      }
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert("제품명과 설명은 필수 입력 사항입니다.");
      return;
    }

    // 크기 체크 (프론트엔드에서 미리 검증)
    const MAX_TEXT_SIZE = 500000; // 500KB
    const MAX_HTML_SIZE = 800000; // 800KB
    // 이미지는 R2에 저장되므로 URL만 저장 (크기 체크 불필요)
    
    if (formData.description.length > MAX_TEXT_SIZE) {
      alert(`설명이 너무 깁니다. 현재: ${Math.round(formData.description.length / 1000)}KB, 최대: 500KB`);
      return;
    }
    
    if (formData.detailHtml && formData.detailHtml.length > MAX_HTML_SIZE) {
      alert(`상세 HTML이 너무 큽니다. 현재: ${Math.round(formData.detailHtml.length / 1000)}KB, 최대: 800KB`);
      return;
    }
    
    // 이미지는 R2에 저장되므로 URL만 체크 (크기 체크 불필요)

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/admin/store-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price === "" ? 0 : Number(formData.price),
          monthlyPrice: formData.monthlyPrice === "" ? 0 : Number(formData.monthlyPrice),
          yearlyPrice: formData.yearlyPrice === "" ? 0 : Number(formData.yearlyPrice),
          pricePerStudent: formData.pricePerStudent === "" ? 0 : Number(formData.pricePerStudent),
          dailyChatLimit: formData.dailyChatLimit === "" ? 15 : Number(formData.dailyChatLimit),
          originalPrice: formData.originalPrice === "" ? 0 : Number(formData.originalPrice),
          discountValue: formData.discountValue === "" ? 0 : Number(formData.discountValue),
          stockQuantity: formData.stockQuantity === "" ? -1 : Number(formData.stockQuantity),
          maxPurchasePerUser: formData.maxPurchasePerUser === "" ? -1 : Number(formData.maxPurchasePerUser),
          displayOrder: formData.displayOrder === "" ? 0 : Number(formData.displayOrder),
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.message || errorData.error || "제품 생성에 실패했습니다.");
      }

      const data = await response.json();
      console.log("✅ Product created:", data.productId);
      
      alert("제품이 성공적으로 생성되었습니다!");
      router.push("/dashboard/admin/store-management");
    } catch (error) {
      console.error("Error creating product:", error);
      const errorMessage = error instanceof Error ? error.message : "제품 생성 중 오류가 발생했습니다.";
      alert(`제품 생성 실패:\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue = type === "number" ? (value === "" ? "" : parseInt(value) || 0) : value;
    
    // imageUrl 필드인 경우 Google Drive URL 자동 변환
    if (name === "imageUrl" && typeof finalValue === "string") {
      finalValue = convertGoogleDriveUrl(finalValue);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
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
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge>{getCategoryLabel(formData.category)}</Badge>
                  {formData.isFeatured === 1 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      추천
                    </Badge>
                  )}
                  {/* 🆕 마케팅 배지 */}
                  {formData.badges && formData.badges.split(",").map((badge, idx) => (
                    <Badge key={idx} className="bg-red-500 text-white">
                      {badge.trim()}
                    </Badge>
                  ))}
                  {formData.isTimeDeal === 1 && (
                    <Badge className="bg-orange-500 text-white animate-pulse">
                      ⏰ 타임딜
                    </Badge>
                  )}
                  {formData.discountType !== 'none' && Number(formData.discountValue) > 0 && (
                    <Badge className="bg-pink-500 text-white">
                      🎉 {formData.discountType === 'percentage' 
                        ? `${formData.discountValue}% 할인` 
                        : `${Number(formData.discountValue).toLocaleString()}원 할인`
                      }
                    </Badge>
                  )}
                  {formData.promotionType !== 'none' && (
                    <Badge className="bg-purple-500 text-white">
                      {formData.promotionType === '1plus1' && '🎁 1+1'}
                      {formData.promotionType === '2plus1' && '🎁 2+1'}
                      {formData.promotionType === 'gift' && '🎁 사은품'}
                      {formData.promotionType === 'bundle' && '📦 묶음할인'}
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-bold mb-4">{formData.name || "제품명"}</h2>
                <p className="text-gray-600 text-lg mb-6">
                  {formData.shortDescription || "간단한 설명"}
                </p>

                {/* 🆕 프로모션 설명 */}
                {formData.promotionType !== 'none' && formData.promotionDescription && (
                  <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mb-6 border-2 border-purple-300">
                    <p className="text-purple-800 font-semibold flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      {formData.promotionDescription}
                    </p>
                    {formData.promotionStartDate && formData.promotionEndDate && (
                      <p className="text-sm text-purple-600 mt-2">
                        기간: {formData.promotionStartDate} ~ {formData.promotionEndDate}
                      </p>
                    )}
                  </div>
                )}

                {/* 가격 정보 (할인 적용) */}
                <div className="flex gap-6 mb-6 flex-wrap">
                  {Number(formData.pricePerStudent) > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg flex-1 min-w-[200px] relative">
                      {formData.discountType !== 'none' && Number(formData.originalPrice) > 0 && Number(formData.discountValue) > 0 && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            {formData.discountType === 'percentage' 
                              ? `${formData.discountValue}% 할인` 
                              : `${Number(formData.discountValue).toLocaleString()}원 할인`
                            }
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mb-1">학생당 월 가격</p>
                      {formData.discountType !== 'none' && Number(formData.originalPrice) > 0 && Number(formData.discountValue) > 0 ? (
                        <>
                          <p className="text-lg text-gray-400 line-through">
                            {Number(formData.originalPrice).toLocaleString()}원
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formData.discountType === 'percentage'
                              ? (Number(formData.originalPrice) * (1 - Number(formData.discountValue) / 100)).toLocaleString()
                              : (Number(formData.originalPrice) - Number(formData.discountValue)).toLocaleString()
                            }원
                          </p>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-green-600">
                          {Number(formData.pricePerStudent).toLocaleString()}원
                        </p>
                      )}
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

              {/* 🆕 하루 채팅 제한 필드 */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">
                  🆕 한 명당 하루 채팅 제한 (개)
                  <span className="text-xs text-gray-500 ml-2">학생별 개별 제한</span>
                </label>
                <input
                  type="number"
                  name="dailyChatLimit"
                  value={formData.dailyChatLimit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  이 봇을 구매한 학원의 각 학생은 하루에 최대 이 개수만큼 채팅할 수 있습니다 (기본: 15개)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 🎁 마케팅 & 프로모션 */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <span className="text-2xl">🎁</span>
                마케팅 & 프로모션
              </CardTitle>
              <CardDescription>
                할인, 쿠폰, 프로모션 등 마케팅 요소를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 할인 설정 */}
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💰</span> 할인 설정
                </h4>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">할인 유형</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="none">할인 없음</option>
                      <option value="percentage">정률 할인 (%)</option>
                      <option value="fixed">정액 할인 (원)</option>
                    </select>
                  </div>

                  {formData.discountType !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {formData.discountType === 'percentage' ? '할인율 (%)' : '할인 금액 (원)'}
                        </label>
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder={formData.discountType === 'percentage' ? '10' : '10000'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">원가 (할인 전)</label>
                        <input
                          type="number"
                          name="originalPrice"
                          value={formData.originalPrice}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="100000"
                        />
                      </div>
                    </>
                  )}
                </div>

                {formData.discountType !== 'none' && Number(formData.discountValue) > 0 && Number(formData.originalPrice) > 0 && (
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800">
                      💡 할인 계산: 
                      {formData.discountType === 'percentage' 
                        ? ` ${formData.originalPrice}원 - ${formData.discountValue}% = ${(Number(formData.originalPrice) * (1 - Number(formData.discountValue) / 100)).toLocaleString()}원`
                        : ` ${formData.originalPrice}원 - ${Number(formData.discountValue).toLocaleString()}원 = ${(Number(formData.originalPrice) - Number(formData.discountValue)).toLocaleString()}원`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* 프로모션 설정 */}
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎉</span> 프로모션 설정
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">프로모션 유형</label>
                    <select
                      name="promotionType"
                      value={formData.promotionType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="none">프로모션 없음</option>
                      <option value="1plus1">1+1 (하나 사면 하나 더)</option>
                      <option value="2plus1">2+1 (두개 사면 하나 더)</option>
                      <option value="gift">사은품 증정</option>
                      <option value="bundle">묶음 할인</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <input
                        type="checkbox"
                        name="isTimeDeal"
                        checked={formData.isTimeDeal === 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, isTimeDeal: e.target.checked ? 1 : 0 }))}
                        className="mr-2"
                      />
                      타임딜 (⏰ 시간 제한 특가)
                    </label>
                  </div>
                </div>

                {formData.promotionType !== 'none' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">프로모션 설명</label>
                      <input
                        type="text"
                        name="promotionDescription"
                        value={formData.promotionDescription}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="3개월 구매 시 1개월 무료 추가!"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">프로모션 시작일</label>
                        <input
                          type="date"
                          name="promotionStartDate"
                          value={formData.promotionStartDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">프로모션 종료일</label>
                        <input
                          type="date"
                          name="promotionEndDate"
                          value={formData.promotionEndDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 배지 설정 */}
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏷️</span> 배지 설정
                </h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">배지 (쉼표로 구분)</label>
                  <input
                    type="text"
                    name="badges"
                    value={formData.badges}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="NEW, HOT, BEST, 인기"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    예시: NEW, HOT, BEST, 추천, 인기, 한정판
                  </p>
                </div>
              </div>

              {/* 재고 및 구매 제한 */}
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📦</span> 재고 & 구매 제한
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">재고 수량</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="-1 (무제한)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      -1: 무제한 / 0: 품절 / 양수: 재고 수량
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">1인당 최대 구매 수량</label>
                    <input
                      type="number"
                      name="maxPurchasePerUser"
                      value={formData.maxPurchasePerUser}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="-1 (무제한)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      -1: 무제한 / 양수: 최대 구매 수량
                    </p>
                  </div>
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
