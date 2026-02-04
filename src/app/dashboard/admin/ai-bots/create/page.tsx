"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Save,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function CreateAIBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    welcomeMessage: "",
    model: "gpt-4",
    temperature: "0.7",
    maxTokens: "2000",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.systemPrompt) {
      alert("봇 이름과 시스템 프롬프트는 필수입니다.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/ai-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          temperature: parseFloat(formData.temperature),
          maxTokens: parseInt(formData.maxTokens),
        }),
      });

      if (response.ok) {
        alert("AI 봇이 생성되었습니다!");
        router.push("/dashboard/admin/ai-bots");
      } else {
        const error = await response.json();
        alert(error.message || "봇 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("봇 생성 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-green-600" />
            AI 봇 만들기
          </h1>
          <p className="text-gray-600 mt-1">
            새로운 AI 챗봇을 생성합니다
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin/ai-bots")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              기본 정보
            </CardTitle>
            <CardDescription>
              봇의 기본 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">봇 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 학습 도우미 봇"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="이 봇에 대한 간단한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="welcomeMessage">환영 메시지</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                placeholder="사용자가 처음 대화를 시작할 때 표시할 메시지"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              AI 설정
            </CardTitle>
            <CardDescription>
              AI 모델과 동작 방식을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="systemPrompt">시스템 프롬프트 *</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="AI의 역할과 동작 방식을 정의하세요. 예: 당신은 학습을 도와주는 친절한 AI 선생님입니다..."
                rows={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                이 프롬프트는 AI의 성격과 응답 방식을 결정합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="model">AI 모델</Label>
                <select
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-4">GPT-4 (추천)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                </select>
              </div>

              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  창의성 (0-2, 낮을수록 일관적)
                </p>
              </div>

              <div>
                <Label htmlFor="maxTokens">최대 토큰</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  step="100"
                  min="100"
                  max="4000"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  응답 최대 길이
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/ai-bots")}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "생성 중..." : "AI 봇 생성"}
          </Button>
        </div>
      </form>

      {/* 도움말 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">
            💡 팁: 효과적인 시스템 프롬프트 작성법
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• <strong>명확한 역할 정의:</strong> "당신은 ~입니다" 형식으로 시작</p>
          <p>• <strong>구체적인 지침:</strong> 해야 할 것과 하지 말아야 할 것을 명시</p>
          <p>• <strong>톤과 스타일:</strong> 친근한, 전문적인, 격식있는 등의 톤 지정</p>
          <p>• <strong>제약 사항:</strong> 답변 형식, 길이 제한 등을 명시</p>
          <p>• <strong>예시 포함:</strong> 원하는 응답 형식의 예시를 제공</p>
        </CardContent>
      </Card>
    </div>
  );
}
