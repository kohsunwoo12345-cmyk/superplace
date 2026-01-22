"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image as ImageIcon, Loader2, BookOpen, Camera, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
}

export default function GgumettangAIPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 저는 꾸메땅 AI 숙제 검사 조교입니다. 📚\n\n학생의 영어 지문 분석 사진을 업로드하시면, 꾸메땅 로직에 따라 기호와 해석이 올바른지 정밀하게 첨삭해드릴게요.\n\n**기호 체계:**\n- 밑줄(—): 주어(주요소)\n- 동그라미(○): 동사(주요소) 및 자릿값\n- 사선(/): 종요소(부사구/전명구)\n- 꾸미기([]): 형용사적 수식\n- 세모(△): 접속사/의문사\n\n사진을 업로드하거나 질문을 입력해주세요!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 권한 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 이미지 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 메시지 전송
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: "user",
      content: input || "이미지 분석 요청",
      image: imagePreview || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", input);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      formData.append("history", JSON.stringify(messages.map(m => ({
        role: m.role,
        content: m.content
      }))));

      const response = await fetch("/api/ai-bot/ggumettang", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("API 요청 실패");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      removeImage();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            꾸메땅 AI 숙제 검사 조교
          </h1>
        </div>
        <p className="text-gray-600">
          영어 지문 분석 사진을 업로드하면 꾸메땅 로직에 따라 정밀 첨삭해드립니다
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-blue-600" />
            채팅 및 이미지 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* 메시지 영역 */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="업로드된 이미지"
                      className="mb-3 rounded-lg max-w-full h-auto"
                    />
                  )}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                    {message.timestamp.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div className="px-6 py-3 border-t bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="h-20 w-20 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    이미지가 선택되었습니다
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedImage?.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-shrink-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="숙제 사진을 업로드하거나 질문을 입력하세요..."
                className="resize-none min-h-[60px] focus-visible:ring-blue-500"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Shift + Enter: 줄바꿈 | Enter: 전송
            </p>
          </form>
        </CardContent>
      </Card>

      {/* 안내 카드 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">사진 업로드</h3>
                <p className="text-xs text-gray-600">
                  학생의 영어 지문 분석 필기를 찍어 업로드하세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">정밀 첨삭</h3>
                <p className="text-xs text-gray-600">
                  꾸메땅 로직에 따라 기호와 해석을 정밀 검사합니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-pink-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">학습 보고서</h3>
                <p className="text-xs text-gray-600">
                  단어 성취도, 기호 정확도, AI 총평이 담긴 보고서 생성
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
