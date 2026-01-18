"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Send, Bot, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!image && !message) {
      toast({
        title: "입력 필요",
        description: "사진을 업로드하거나 질문을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const formData = new FormData();
      if (image) {
        formData.append("image", image);
      }
      formData.append("message", message);

      const res = await fetch("/api/ai/homework-check", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI 분석 중 오류가 발생했습니다.");
      }

      setResponse(data.response);
      
      toast({
        title: "분석 완료!",
        description: "AI가 숙제를 분석했습니다.",
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI 영어 숙제 도우미</h1>
        <p className="text-gray-600 mt-2">
          영어 지문 사진을 올리면 꾸메땅 로직으로 첨삭해드립니다! 🤖
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              숙제 제출
            </CardTitle>
            <CardDescription>
              영어 지문 사진을 업로드하고 질문해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                영어 지문 사진 업로드
              </label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="업로드된 이미지"
                      className="max-h-64 mx-auto rounded"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                    >
                      다시 선택
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      클릭하여 사진 업로드
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 질문 입력 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                질문 또는 추가 설명 (선택)
              </label>
              <Textarea
                placeholder="예: 이 문장에서 주어가 맞나요?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* 제출 버튼 */}
            <Button
              onClick={handleSubmit}
              disabled={loading || (!image && !message)}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  분석 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  AI에게 물어보기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 결과 영역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI 선생님의 첨삭
            </CardTitle>
            <CardDescription>
              꾸메땅 로직 기반 분석 결과
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-600">
                    AI가 열심히 분석하고 있어요...
                  </p>
                </div>
              </div>
            ) : response ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {response}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center space-y-2">
                  <Bot className="h-16 w-16 mx-auto opacity-50" />
                  <p>숙제를 제출하면 AI가 분석해드립니다!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 사용 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 방법</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>밑줄(주어), 동그라미(동사), 사선(종요소)이 표시된 영어 지문 사진을 업로드하세요</li>
            <li>궁금한 점이 있으면 질문을 추가로 입력하세요</li>
            <li>"AI에게 물어보기" 버튼을 클릭하세요</li>
            <li>AI 선생님이 꾸메땅 로직으로 첨삭해드립니다!</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>팁:</strong> 기호를 정확하게 표시할수록 더 정확한 첨삭을 받을 수 있어요!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
