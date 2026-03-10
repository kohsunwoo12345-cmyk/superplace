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
  Settings,
  Brain,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (추천)", description: "✅ 최신 2.5 모델, 빠르고 안정적", recommended: true },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "⚡ 경량화 모델, 빠른 응답", recommended: false },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "⚠️ 최고 성능이지만 안전 필터 엄격", recommended: false },
  
  // 🆕 DeepSeek OCR 모델 (ALL_AI_API_KEY)
  { value: "deepseek-ocr-2", label: "DeepSeek OCR 2", description: "🔍 강력한 OCR 및 문서 인식 (API 키 필요)", recommended: false },
  
  // 🆕 OpenAI GPT 모델 (OPENAI_API_KEY) - 검증된 모델만
  { value: "gpt-4o", label: "GPT-4o", description: "🚀 OpenAI 최신 멀티모달 모델 (API 키 필요)", recommended: false },
  { value: "gpt-4o-mini", label: "GPT-4o mini", description: "⚡ GPT-4o 경량 버전, 빠르고 효율적 (API 키 필요)", recommended: false },
];

interface KnowledgeFile {
  name: string;
  content: string;
  size: number;
}

export default function HomeworkGradingConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKnowledge, setUploadingKnowledge] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentActivePrompt, setCurrentActivePrompt] = useState<string>(''); // 실제 사용 중인 프롬프트

  const [formData, setFormData] = useState({
    systemPrompt: `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요 (문제에 정답이 표시되어 있거나, 일반적인 학습 지식으로 판단)
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
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`,
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 2000,
    topK: 40,
    topP: 0.95,
    enableRAG: 0,
    knowledgeBase: null as string | null,
  });

  // 인증 확인 및 현재 설정 불러오기
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // localStorage에서 사용자 정보 가져오기
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        const roleUpper = userData.role?.toUpperCase();
        
        if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN' && roleUpper !== 'DIRECTOR') {
          router.push('/dashboard');
          return;
        }
        
        setCurrentUser(userData);

        // 현재 설정 불러오기
        const configResponse = await fetch('/api/admin/homework-grading-config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.success && configData.config) {
            setFormData({
              systemPrompt: configData.config.systemPrompt,
              model: configData.config.model,
              temperature: configData.config.temperature,
              maxTokens: configData.config.maxTokens,
              topK: configData.config.topK,
              topP: configData.config.topP,
              enableRAG: configData.config.enableRAG,
              knowledgeBase: configData.config.knowledgeBase,
            });
            
            // 실제 사용 중인 프롬프트 저장
            setCurrentActivePrompt(configData.config.systemPrompt);

            // 지식 파일 파싱
            if (configData.config.knowledgeBase) {
              try {
                const parsedFiles = JSON.parse(configData.config.knowledgeBase);
                setKnowledgeFiles(parsedFiles);
              } catch (e) {
                console.error('Failed to parse knowledge files:', e);
              }
            }
          }
        }

      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // 지식 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingKnowledge(true);
    const newFiles: KnowledgeFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        
        newFiles.push({
          name: file.name,
          content: content,
          size: file.size,
        });
      }

      // 기존 파일에 새 파일 추가
      const updatedFiles = [...knowledgeFiles, ...newFiles];
      setKnowledgeFiles(updatedFiles);

      // RAG 업로드 처리
      for (const file of newFiles) {
        try {
          const uploadResponse = await fetch('/api/rag/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `homework-grading-${file.name}`,
              content: file.content,
              metadata: {
                type: 'homework_grading_knowledge',
                uploadedAt: new Date().toISOString(),
              }
            }),
          });

          if (!uploadResponse.ok) {
            console.error('Failed to upload knowledge to RAG:', await uploadResponse.text());
          } else {
            console.log('✅ Knowledge uploaded to RAG:', file.name);
          }
        } catch (error) {
          console.error('Error uploading to RAG:', error);
        }
      }

      setSaveMessage({ type: 'success', text: `${newFiles.length}개 파일이 업로드되었습니다.` });
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('Failed to upload files:', error);
      setSaveMessage({ type: 'error', text: '파일 업로드에 실패했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setUploadingKnowledge(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 파일 제거
  const removeFile = (index: number) => {
    const updated = knowledgeFiles.filter((_, i) => i !== index);
    setKnowledgeFiles(updated);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!formData.systemPrompt.trim()) {
      setSaveMessage({ type: 'error', text: '프롬프트를 입력해주세요.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const saveData = {
        ...formData,
        enableRAG: knowledgeFiles.length > 0 ? 1 : 0,
        knowledgeBase: knowledgeFiles.length > 0 ? JSON.stringify(knowledgeFiles) : null,
      };

      const response = await fetch('/api/admin/homework-grading-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({ type: 'success', text: '✅ 숙제 검사 AI 설정이 저장되었습니다!' });
        // 저장 후 실제 사용 중인 프롬프트 업데이트
        setCurrentActivePrompt(formData.systemPrompt);
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        throw new Error(data.error || 'Failed to save config');
      }

    } catch (error: any) {
      console.error('Failed to save config:', error);
      setSaveMessage({ type: 'error', text: `❌ 저장 실패: ${error.message}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          관리자 대시보드로 돌아가기
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">숙제 검사 AI 설정</h1>
        </div>
        <p className="text-gray-600">
          숙제 자동 채점에 사용되는 AI 프롬프트와 지식 자료를 관리합니다
        </p>
      </div>

      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{saveMessage.text}</span>
        </div>
      )}

      <div className="grid gap-6">
        {/* 현재 사용 중인 채점 지시사항 */}
        {currentActivePrompt && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="w-5 h-5" />
                현재 실행 중인 채점 지시사항
              </CardTitle>
              <CardDescription>
                학생들의 숙제 채점 시 실제로 사용되는 AI 프롬프트입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 max-h-96 overflow-y-auto">
{currentActivePrompt}
                </pre>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                <Brain className="w-4 h-4" />
                <span>이 프롬프트는 숙제 제출 시 AI 채점에 즉시 반영됩니다</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI 모델 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI 모델 설정
            </CardTitle>
            <CardDescription>
              숙제 채점에 사용할 AI 모델을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {GEMINI_MODELS.map((model) => (
                <div
                  key={model.value}
                  onClick={() => setFormData({ ...formData, model: model.value })}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.model === model.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{model.label}</p>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                    {model.recommended && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                        추천
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label>Temperature</Label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <Label>Max Tokens</Label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 프롬프트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              채점 프롬프트
            </CardTitle>
            <CardDescription>
              숙제 채점 시 AI에게 제공할 지시사항을 작성하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={20}
              className="font-mono text-sm"
              placeholder="채점 프롬프트를 입력하세요..."
            />
          </CardContent>
        </Card>

        {/* RAG 지식 파일 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              채점 기준 자료 (RAG)
            </CardTitle>
            <CardDescription>
              채점 기준, 모범 답안 등의 참고 자료를 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingKnowledge}
                variant="outline"
                className="w-full"
              >
                {uploadingKnowledge ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    파일 추가
                  </>
                )}
              </Button>

              {knowledgeFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    업로드된 파일 ({knowledgeFiles.length}개)
                  </p>
                  {knowledgeFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin')}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
