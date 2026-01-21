"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  Users,
  TrendingUp,
  Star,
  Check,
  ShoppingCart,
  CreditCard,
  Shield,
  Zap,
  AlertCircle,
} from "lucide-react";

// 팔로워 패키지 정의
type FollowerPackage = {
  id: string;
  name: string;
  followers: number;
  price: number;
  deliveryTime: string;
  quality: "high" | "premium" | "ultra";
  features: string[];
  popular?: boolean;
  discount?: number;
};

const packages: FollowerPackage[] = [
  {
    id: "starter",
    name: "스타터",
    followers: 1000,
    price: 29000,
    deliveryTime: "24시간 이내",
    quality: "high",
    features: [
      "실제 계정 팔로워",
      "안전한 증가 속도",
      "24시간 고객 지원",
      "환불 보장",
    ],
  },
  {
    id: "growth",
    name: "그로스",
    followers: 5000,
    price: 129000,
    deliveryTime: "48시간 이내",
    quality: "premium",
    features: [
      "고품질 활성 팔로워",
      "자연스러운 증가",
      "프로필 최적화 팁",
      "우선 고객 지원",
      "7일 유지 보장",
    ],
    popular: true,
    discount: 10,
  },
  {
    id: "pro",
    name: "프로",
    followers: 10000,
    price: 239000,
    deliveryTime: "72시간 이내",
    quality: "ultra",
    features: [
      "프리미엄 활성 팔로워",
      "점진적 자연 증가",
      "콘텐츠 전략 컨설팅",
      "전담 매니저",
      "30일 유지 보장",
      "무료 재보충",
    ],
    discount: 15,
  },
  {
    id: "business",
    name: "비즈니스",
    followers: 50000,
    price: 990000,
    deliveryTime: "7일 이내",
    quality: "ultra",
    features: [
      "최상급 타겟 팔로워",
      "맞춤형 증가 계획",
      "인플루언서 매칭",
      "월간 성과 리포트",
      "90일 유지 보장",
      "무제한 재보충",
      "브랜드 협업 지원",
    ],
  },
];

export default function InstagramGrowthPage() {
  const { toast } = useToast();
  const [instagramHandle, setInstagramHandle] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pkg: FollowerPackage) => {
    if (!instagramHandle.trim()) {
      toast({
        title: "입력 오류",
        description: "Instagram 계정 아이디를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPackage(pkg.id);
    setIsProcessing(true);

    try {
      // 결제 처리 API 호출 (추후 구현)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "구매 완료!",
        description: `${pkg.name} 패키지를 성공적으로 구매했습니다. ${pkg.deliveryTime}에 팔로워가 증가하기 시작합니다.`,
      });

      // 폼 초기화
      setInstagramHandle("");
      setSelectedPackage(null);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "구매 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getQualityBadge = (quality: FollowerPackage["quality"]) => {
    const badges = {
      high: { text: "고품질", color: "bg-blue-500" },
      premium: { text: "프리미엄", color: "bg-purple-500" },
      ultra: { text: "울트라", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    };
    return badges[quality];
  };

  const calculateDiscountPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return Math.round(price * (1 - discount / 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Instagram className="h-8 w-8 text-pink-500" />
          Instagram 팔로워 구매
        </h1>
        <p className="text-gray-600 mt-2">
          안전하고 빠르게 팔로워를 늘려 계정의 영향력을 키우세요
        </p>
      </div>

      {/* Account Input */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle>Instagram 계정 정보</CardTitle>
          <CardDescription>팔로워를 늘릴 계정의 아이디를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram 아이디 *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  @
                </span>
                <Input
                  id="instagram"
                  placeholder="yourinstagram"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                예: yourinstagram (@ 없이 입력)
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-700">안전 보장</p>
                  <p className="text-gray-600">
                    Instagram 가이드라인을 준수하며, 계정 안전을 최우선으로 합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">50,000+</p>
                <p className="text-sm text-gray-600">만족한 고객</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-sm text-gray-600">팔로워 유지율</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.9/5</p>
                <p className="text-sm text-gray-600">고객 평점</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-2xl font-bold mb-4">패키지 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const qualityBadge = getQualityBadge(pkg.quality);
            const finalPrice = calculateDiscountPrice(pkg.price, pkg.discount);

            return (
              <Card
                key={pkg.id}
                className={`relative ${
                  pkg.popular
                    ? "border-2 border-purple-500 shadow-xl"
                    : "hover:shadow-lg"
                } transition-all`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Star className="mr-1 h-3 w-3" />
                      인기
                    </Badge>
                  </div>
                )}

                {pkg.discount && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-red-500 text-white px-3 py-1">
                      -{pkg.discount}%
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="space-y-2">
                    <Badge className={qualityBadge.color}>
                      {qualityBadge.text}
                    </Badge>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="flex items-baseline gap-2">
                      {pkg.discount && (
                        <span className="text-lg text-gray-400 line-through">
                          ₩{pkg.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-primary">
                        ₩{finalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {pkg.followers >= 1000
                        ? `${pkg.followers / 1000}K`
                        : pkg.followers}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">팔로워</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>{pkg.deliveryTime}</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    size="lg"
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg)}
                    disabled={
                      isProcessing ||
                      !instagramHandle.trim() ||
                      selectedPackage === pkg.id
                    }
                  >
                    {isProcessing && selectedPackage === pkg.id ? (
                      <>
                        <CreditCard className="mr-2 h-4 w-4 animate-pulse" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        구매하기
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-orange-900">주의사항</p>
              <ul className="space-y-1 text-orange-800">
                <li>• 계정이 비공개 상태면 팔로워 증가가 불가능합니다.</li>
                <li>• 구매 후 24시간 동안 계정 아이디 변경을 피해주세요.</li>
                <li>• 자연스러운 증가를 위해 점진적으로 팔로워가 늘어납니다.</li>
                <li>• 품질 높은 콘텐츠를 지속적으로 업로드하는 것이 중요합니다.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>자주 묻는 질문</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-1">Q. 안전한가요?</p>
            <p className="text-sm text-gray-600">
              A. Instagram 가이드라인을 준수하며, 실제 활성 계정의 팔로워만
              제공합니다. 봇이나 가짜 계정은 사용하지 않습니다.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Q. 얼마나 빨리 늘어나나요?</p>
            <p className="text-sm text-gray-600">
              A. 패키지에 따라 24-72시간 내에 시작되며, 자연스러운 증가를 위해
              점진적으로 늘어납니다.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Q. 팔로워가 줄어들 수 있나요?</p>
            <p className="text-sm text-gray-600">
              A. 실제 계정이므로 일부 팔로우 해제가 발생할 수 있지만, 유지율이
              98.5%로 매우 높으며 무료 재보충 서비스를 제공합니다.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Q. 환불이 가능한가요?</p>
            <p className="text-sm text-gray-600">
              A. 서비스 시작 전이라면 100% 환불 가능하며, 시작 후에도 합당한
              사유가 있다면 부분 환불이 가능합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
