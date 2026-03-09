"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  ArrowLeft,
  FileText,
  Upload,
  X,
  CheckCircle,
  BookOpen,
} from "lucide-react";

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (추천)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export default function HomeworkGradingConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<Array<{name: string, content: string, size: number}>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    systemPrompt: "",
    model: "gemini-2.5-flash",
    temperature: "0.7",
    maxTokens: "2000",
    enableRAG: false,
    knowledgeBase: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    // 현재 설정 불러오기
    loadConfig();
  }, [router]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/homework-grading-config");
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setFormData({
            systemPrompt: data.config.systemPrompt || "",
            model: data.config.model || "gemini-2.5-flash",
            temperature: String(data.config.temperature || 0.7),
            maxTokens: String(data.config.maxTokens || 2000),
            enableRAG: Boolean(data.config.enableRAG),
            knowledgeBase: data.config.knowledgeBase || "",
          });

          // 지식 베이스가 있으면 파일 목록에 추가
          if (data.config.knowledgeBase) {
            setKnowledgeFiles([{
              name: "기존 지식 베이스",
              content: data.config.knowledgeBase,
              size: data.config.knowledgeBase.length,
            }]);
          }
        }
      }
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      const file = files[0];
      const text = await file.text();
      
      setKnowledgeFiles([{
        name: file.name,
        content: text,
        size: text.length,
      }]);

      setFormData(prev => ({
        ...prev,
        knowledgeBase: text,
        enableRAG: true,
      }));

      alert("파일이 업로드되었습니다!");
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      knowledgeBase: "",
      enableRAG: false,
    }));
  };

  const handleSave = async () => {
    if (!formData.systemPrompt.trim()) {
      alert("시스템 프롬프트를 입력하세요.");
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch("/api/admin/homework-grading-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: formData.systemPrompt,
          model: formData.model,
          temperature: parseFloat(formData.temperature),
          maxTokens: parseInt(formData.maxTokens),
          enableRAG: formData.enableRAG ? 1 : 0,
          knowledgeBase: formData.knowledgeBase,
        }),
      });

      if (!response.ok) {
        throw new Error("저장 실패");
      }

      // RAG 지식 베이스가 있으면 Vectorize에 업로드
      if (formData.enableRAG && formData.knowledgeBase) {
        await uploadToVectorize();
      }

      alert("✅ 숙제 검사 AI 설정이 저장되었습니다!");
    } catch (error: any) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다: " + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const uploadToVectorize = async () => {
    try {
      console.log("📤 Uploading knowledge to Vectorize...");
      const response = await fetch("/api/rag/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: "homework-grading-knowledge.txt",
          content: formData.knowledgeBase,
          metadata: {
            type: "homework-grading",
            botId: "homework-grading-system",
            uploadedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        console.log("✅ Knowledge uploaded to Vectorize");
      } else {
        console.warn("⚠️ Vectorize upload failed, but config saved");
      }
    } catch (error) {
      console.error("Vectorize upload error:", error);
    }
  };

  const loadDefaultPrompt = () => {
    const defaultPrompt = `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요
4. 각 문제에 대한 피드백을 제공하세요

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true/false,
      "studentAnswer": "학생이 작성한 답",
      "correctAnswer": "정답",
      "explanation": "채점 근거 및 설명"
    }
  ],
  "feedback": "전반적인 피드백",
  "strengths": "잘한 점",
  "suggestions": "개선할 점"
}`;

    setFormData(prev => ({
      ...prev,
      systemPrompt: defaultPrompt,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/admin")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              숙제 검사 AI 설정
            </h1>
            <p className="text-gray-600 mt-1">
              숙제 자동 채점 시 사용할 AI 프롬프트와 지식 베이스를 관리합니다
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 설정 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 시스템 프롬프트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                채점 프롬프트
              </CardTitle>
              <CardDescription>
                AI가 숙제를 채점할 때 사용할 지시사항을 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>시스템 프롬프트</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadDefaultPrompt}
                  >
                    기본 프롬프트 로드
                  </Button>
                </div>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="채점 프롬프트를 입력하세요..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.systemPrompt.length} 자
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RAG 지식 베이스 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                참고 지식 (RAG)
              </CardTitle>
              <CardDescription>
                채점 시 참고할 추가 지식을 업로드하세요 (교과서, 정답지 등)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableRAG"
                  checked={formData.enableRAG}
                  onChange={(e) => setFormData({ ...formData, enableRAG: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enableRAG">RAG 활성화</Label>
              </div>

              {formData.enableRAG && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingFile ? "업로드 중..." : "파일 업로드"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {knowledgeFiles.length > 0 && (
                    <div className="space-y-2">
                      {knowledgeFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKnowledgeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 설정 */}
        <div className="space-y-6">
          {/* 모델 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 모델 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>모델</Label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  {GEMINI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Temperature: {formData.temperature}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Max Tokens</Label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                  className="w-full p-2 border rounded-lg mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={saveLoading || !formData.systemPrompt}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            {saveLoading ? "저장 중..." : "설정 저장"}
          </Button>

          {/* 안내 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm">💡 안내</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>• 프롬프트는 숙제 채점 시 AI에게 전달됩니다</p>
              <p>• RAG를 활성화하면 참고 지식이 채점에 활용됩니다</p>
              <p>• 설정은 즉시 적용됩니다</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
