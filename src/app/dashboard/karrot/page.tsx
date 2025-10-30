"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ShoppingBag, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function KarrotPage() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [productName, setProductName] = useState("");
  const [condition, setCondition] = useState("중고");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!productName.trim() || !price.trim() || !category.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/platforms/karrot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          condition,
          price: Number(price),
          category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: "생성 완료",
          description: data.isRealAI
            ? "AI가 판매글을 성공적으로 생성했습니다!"
            : "샘플 판매글입니다. OPENAI_API_KEY를 설정하면 실제 AI 생성을 받을 수 있습니다.",
        });
      } else {
        throw new Error("생성 실패");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast({
        title: "오류",
        description: "판매글 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">당근마켓 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI로 효과적인 판매글을 자동 생성하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 판매글 생성기
          </CardTitle>
          <CardDescription>
            상품 정보를 입력하면 AI가 매력적인 판매글을 작성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-name">상품명 *</Label>
              <Input
                id="product-name"
                placeholder="예: 아이폰 13 Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Input
                id="category"
                placeholder="예: 디지털기기"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="condition">상태 *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="새상품">새상품</SelectItem>
                  <SelectItem value="거의 새것">거의 새것</SelectItem>
                  <SelectItem value="중고">중고</SelectItem>
                  <SelectItem value="사용감 있음">사용감 있음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">가격 (원) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="예: 800000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 판매글을 생성하는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 판매글 생성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.isRealAI ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                생성된 판매글
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                {result.isRealAI ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">실제 AI 생성</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700 font-medium">샘플 판매글</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>제목</Label>
                <Button onClick={() => copyToClipboard(result.title)} size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="font-medium">{result.title}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>상세 설명</Label>
                <Button onClick={() => copyToClipboard(result.description)} size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm">{result.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>판매 팁</Label>
              <div className="bg-white border rounded-lg p-4">
                <ul className="space-y-2">
                  {result.tips.map((tip: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-500 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-orange-700">당근마켓 미리보기</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold">{result.title}</p>
                  <p className="text-sm text-muted-foreground">{category} • {condition}</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{Number(price).toLocaleString()}원</p>
                <p className="text-sm whitespace-pre-wrap">{result.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">당근마켓 판매 팁</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 깔끔하고 밝은 사진을 여러 장 올리세요 (최소 3장 이상)</p>
          <p>• 가격은 시세보다 약간 높게 설정하고 네고 여부를 명시하세요</p>
          <p>• 거래 희망 장소를 구체적으로 적으세요 (역, 랜드마크 등)</p>
          <p>• 빠른 답변으로 신뢰도를 높이세요</p>
        </CardContent>
      </Card>
    </div>
  );
}
