"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, FileText } from "lucide-react";

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const colorOptions = [
  { value: "blue", label: "파란색", gradient: "from-blue-50 to-cyan-50" },
  { value: "purple", label: "보라색", gradient: "from-purple-50 to-pink-50" },
  { value: "green", label: "초록색", gradient: "from-green-50 to-emerald-50" },
  { value: "indigo", label: "남색", gradient: "from-indigo-50 to-blue-50" },
  { value: "teal", label: "청록색", gradient: "from-teal-50 to-cyan-50" },
  { value: "pink", label: "분홍색", gradient: "from-pink-50 to-rose-50" },
  { value: "amber", label: "호박색", gradient: "from-amber-50 to-yellow-50" },
  { value: "violet", label: "제비꽃색", gradient: "from-violet-50 to-purple-50" },
  { value: "orange", label: "주황색", gradient: "from-orange-50 to-amber-50" },
];

export function CreateBotDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState({
    botId: "",
    name: "",
    nameEn: "",
    description: "",
    icon: "🤖",
    color: "blue",
    bgGradient: "from-blue-50 to-cyan-50",
    systemPrompt: "",
    referenceFiles: [] as string[],
    isActive: true,
  });

  // 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFiles(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/bot-files", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          const error = await response.json();
          alert(`파일 업로드 실패: ${error.error}`);
        }
      }

      setFormData({
        ...formData,
        referenceFiles: [...formData.referenceFiles, ...uploadedUrls],
      });
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다");
    } finally {
      setUploadingFiles(false);
    }
  };

  // 파일 제거
  const removeFile = (url: string) => {
    setFormData({
      ...formData,
      referenceFiles: formData.referenceFiles.filter((f) => f !== url),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.botId || !formData.name || !formData.nameEn || !formData.description || !formData.systemPrompt) {
      alert("모든 필수 필드를 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai-bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("AI 봇이 생성되었습니다");
        onSuccess();
        onOpenChange(false);
        // 폼 초기화
        setFormData({
          botId: "",
          name: "",
          nameEn: "",
          description: "",
          icon: "🤖",
          color: "blue",
          bgGradient: "from-blue-50 to-cyan-50",
          systemPrompt: "",
          referenceFiles: [],
          isActive: true,
        });
      } else {
        const data = await response.json();
        alert(data.error || "봇 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("봇 생성 오류:", error);
      alert("봇 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (color: string) => {
    const selectedColor = colorOptions.find((c) => c.value === color);
    if (selectedColor) {
      setFormData({
        ...formData,
        color,
        bgGradient: selectedColor.gradient,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 AI 봇 추가</DialogTitle>
          <DialogDescription>
            새로운 AI 봇을 생성하고 지침사항을 입력하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 봇 ID */}
            <div className="space-y-2">
              <Label htmlFor="botId">봇 ID (영문)*</Label>
              <Input
                id="botId"
                placeholder="예: history-teacher"
                value={formData.botId}
                onChange={(e) =>
                  setFormData({ ...formData, botId: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500">
                영문 소문자, 하이픈만 사용 가능
              </p>
            </div>

            {/* 아이콘 */}
            <div className="space-y-2">
              <Label htmlFor="icon">아이콘 (이모지)*</Label>
              <Input
                id="icon"
                placeholder="🤖"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 한글 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">한글 이름*</Label>
              <Input
                id="name"
                placeholder="예: 한국사 선생님"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* 영문 이름 */}
            <div className="space-y-2">
              <Label htmlFor="nameEn">영문 이름*</Label>
              <Input
                id="nameEn"
                placeholder="예: History Teacher"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* 색상 */}
          <div className="space-y-2">
            <Label htmlFor="color">색상 테마</Label>
            <Select value={formData.color} onValueChange={handleColorChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded bg-gradient-to-br ${option.gradient}`}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명*</Label>
            <Textarea
              id="description"
              placeholder="이 봇이 어떤 역할을 하는지 간단히 설명해주세요"
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* 시스템 프롬프트 (지침사항) */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">시스템 프롬프트 (지침사항)*</Label>
            <Textarea
              id="systemPrompt"
              placeholder="AI 봇의 역할, 말투, 행동 방식 등을 상세히 작성해주세요"
              rows={8}
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              예시: "당신은 한국사 전문 선생님입니다. 역사적 사건을 생생한
              스토리텔링으로 설명하고..."
            </p>
          </div>

          {/* 참고 파일 업로드 */}
          <div className="space-y-2">
            <Label>참고 파일 (선택사항)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadingFiles ? "업로드 중..." : "파일을 클릭하거나 드래그하세요"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOCX, XLSX, PPTX, TXT, CSV (최대 10MB)
                </span>
              </label>
            </div>

            {/* 업로드된 파일 목록 */}
            {formData.referenceFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium">업로드된 파일:</p>
                {formData.referenceFiles.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm truncate max-w-[300px]">
                        {url.split("/").pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 활성화 */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isActive">즉시 활성화</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "봇 생성"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
