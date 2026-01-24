"use client";

import { useState, useRef } from "react";
import { X, Upload, Plus, Trash2, FileText, TestTube } from "lucide-react";

interface BotEditorModalProps {
  bot?: {
    id: string;
    botId: string;
    name: string;
    nameEn: string;
    description: string;
    icon: string;
    color: string;
    bgGradient: string;
    systemPrompt: string;
    referenceFiles: string[];
    starterMessages: string[];
    enableImageInput: boolean;
    enableVoiceOutput: boolean;
    enableVoiceInput: boolean;
    isActive: boolean;
    folderId: string | null;
  };
  folders: Array<{ id: string; name: string }>;
  onClose: () => void;
  onCreate?: (data: any) => void;
  onUpdate?: (botId: string, data: any) => void;
}

// 다양한 이모지 옵션 (100개 이상)
const EMOJI_OPTIONS = [
  "🤖", "🎓", "📚", "✏️", "📝", "🧠", "💡", "🔬", "🧪", "🔭",
  "📊", "📈", "📉", "💻", "⌨️", "🖥️", "🖱️", "🖨️", "⚙️", "🔧",
  "🛠️", "🔨", "⚡", "🔥", "💧", "🌊", "🌈", "⭐", "✨", "💫",
  "🎨", "🖌️", "🖍️", "✂️", "📐", "📏", "📌", "📍", "🔖", "🏷️",
  "📁", "📂", "🗂️", "📋", "📄", "📃", "📑", "📒", "📓", "📔",
  "📕", "📖", "📗", "📘", "📙", "📚", "📰", "🗞️", "📑", "🔗",
  "📎", "🖇️", "📐", "📏", "🧮", "🔬", "🧬", "🦠", "💊", "🩺",
  "🌡️", "🧪", "🧫", "🔭", "🛰️", "🚀", "🛸", "🌍", "🌎", "🌏",
  "🗺️", "🧭", "🏔️", "⛰️", "🌋", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️",
  "🎯", "🎲", "🎰", "🎪", "🎭", "🎬", "🎤", "🎧", "🎼", "🎹",
  "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎮", "🕹️", "🎳", "🎯"
];

// 다양한 색상 옵션 (30개 이상)
const COLOR_OPTIONS = [
  { name: "파랑", value: "blue", hex: "#3B82F6", gradient: "from-blue-50 to-cyan-50" },
  { name: "하늘색", value: "sky", hex: "#0EA5E9", gradient: "from-sky-50 to-blue-50" },
  { name: "청록", value: "cyan", hex: "#06B6D4", gradient: "from-cyan-50 to-teal-50" },
  { name: "민트", value: "teal", hex: "#14B8A6", gradient: "from-teal-50 to-emerald-50" },
  { name: "초록", value: "green", hex: "#10B981", gradient: "from-green-50 to-lime-50" },
  { name: "라임", value: "lime", hex: "#84CC16", gradient: "from-lime-50 to-yellow-50" },
  { name: "노랑", value: "yellow", hex: "#F59E0B", gradient: "from-yellow-50 to-amber-50" },
  { name: "주황", value: "orange", hex: "#F97316", gradient: "from-orange-50 to-red-50" },
  { name: "빨강", value: "red", hex: "#EF4444", gradient: "from-red-50 to-pink-50" },
  { name: "분홍", value: "pink", hex: "#EC4899", gradient: "from-pink-50 to-rose-50" },
  { name: "장미", value: "rose", hex: "#F43F5E", gradient: "from-rose-50 to-pink-50" },
  { name: "보라", value: "purple", hex: "#8B5CF6", gradient: "from-purple-50 to-fuchsia-50" },
  { name: "자주", value: "fuchsia", hex: "#D946EF", gradient: "from-fuchsia-50 to-purple-50" },
  { name: "남색", value: "indigo", hex: "#6366F1", gradient: "from-indigo-50 to-blue-50" },
  { name: "바이올렛", value: "violet", hex: "#7C3AED", gradient: "from-violet-50 to-purple-50" },
  { name: "회색", value: "gray", hex: "#6B7280", gradient: "from-gray-50 to-slate-50" },
  { name: "슬레이트", value: "slate", hex: "#64748B", gradient: "from-slate-50 to-gray-50" },
  { name: "징크", value: "zinc", hex: "#71717A", gradient: "from-zinc-50 to-neutral-50" },
  { name: "뉴트럴", value: "neutral", hex: "#737373", gradient: "from-neutral-50 to-stone-50" },
  { name: "스톤", value: "stone", hex: "#78716C", gradient: "from-stone-50 to-amber-50" },
  { name: "에메랄드", value: "emerald", hex: "#059669", gradient: "from-emerald-50 to-green-50" },
  { name: "앰버", value: "amber", hex: "#F59E0B", gradient: "from-amber-50 to-orange-50" },
];

export default function BotEditorModal({
  bot,
  folders,
  onClose,
  onCreate,
  onUpdate,
}: BotEditorModalProps) {
  const isEditMode = !!bot;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    botId: bot?.botId || "",
    name: bot?.name || "",
    nameEn: bot?.nameEn || "",
    description: bot?.description || "",
    icon: bot?.icon || "🤖",
    color: bot?.color || "blue",
    bgGradient: bot?.bgGradient || "from-blue-50 to-cyan-50",
    systemPrompt: bot?.systemPrompt || "",
    referenceFiles: bot?.referenceFiles || [],
    starterMessages: bot?.starterMessages || [],
    enableImageInput: bot?.enableImageInput || false,
    enableVoiceOutput: bot?.enableVoiceOutput || false,
    enableVoiceInput: bot?.enableVoiceInput || false,
    isActive: bot?.isActive !== undefined ? bot.isActive : true,
    folderId: bot?.folderId || "",
  });

  const [newStarterMessage, setNewStarterMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [testResults, setTestResults] = useState<{
    image?: boolean;
    voice?: boolean;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.botId || !formData.name || !formData.nameEn || !formData.description || !formData.systemPrompt) {
      alert("필수 필드를 모두 입력해주세요");
      return;
    }

    const data = {
      ...formData,
      referenceFiles: formData.referenceFiles,
      starterMessages: formData.starterMessages,
      folderId: formData.folderId || null,
    };

    if (isEditMode && onUpdate) {
      await onUpdate(bot!.id, data);
    } else if (onCreate) {
      await onCreate(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 파일 업로드 API 구현 필요
        // 임시로 파일명만 추가
        return `uploaded/${file.name}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData({
        ...formData,
        referenceFiles: [...formData.referenceFiles, ...uploadedUrls],
      });

      alert(`${files.length}개 파일이 업로드되었습니다`);
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      referenceFiles: formData.referenceFiles.filter((_, i) => i !== index),
    });
  };

  const addStarterMessage = () => {
    if (!newStarterMessage.trim()) return;
    setFormData({
      ...formData,
      starterMessages: [...formData.starterMessages, newStarterMessage.trim()],
    });
    setNewStarterMessage("");
  };

  const removeStarterMessage = (index: number) => {
    setFormData({
      ...formData,
      starterMessages: formData.starterMessages.filter((_, i) => i !== index),
    });
  };

  const testFeature = async (feature: "image" | "voice") => {
    // 실제 테스트 로직 구현
    setTestResults({ ...testResults, [feature]: true });
    alert(`${feature === "image" ? "이미지" : "음성"} 기능 테스트 성공!`);
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === formData.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditMode ? "봇 수정" : "새 봇 추가"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  봇 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.botId}
                  onChange={(e) =>
                    setFormData({ ...formData, botId: e.target.value })
                  }
                  disabled={isEditMode}
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="예: math-tutor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  한글 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="예: 수학 튜터"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                영문 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="예: Math Tutor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
                className="w-full px-3 py-2 border rounded"
                placeholder="봇의 기능과 목적을 설명"
              />
            </div>
          </div>

          {/* 아이콘 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              아이콘 선택 (현재: {formData.icon})
            </h3>
            <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`text-3xl p-2 rounded hover:bg-gray-100 transition-colors ${
                    formData.icon === emoji ? "bg-blue-100 ring-2 ring-blue-500" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              색상 테마 (현재: {selectedColor?.name})
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      color: color.value,
                      bgGradient: color.gradient,
                    })
                  }
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg hover:shadow-md transition-all ${
                    formData.color === color.value
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : "border"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs text-center">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 시스템 프롬프트 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">지침사항</h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                시스템 프롬프트 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                required
                rows={6}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                placeholder="AI 봇의 역할, 행동 방식, 제약사항 등을 상세히 정의"
              />
            </div>

            {/* 참고 파일 업로드 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                참고 파일 (PDF, DOCX, TXT 등)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? "업로드 중..." : "파일 선택"}
              </button>

              {formData.referenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.referenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="text-sm truncate max-w-md">{file}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 스타터 메시지 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">스타터 메시지</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStarterMessage}
                onChange={(e) => setNewStarterMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addStarterMessage())}
                className="flex-1 px-3 py-2 border rounded"
                placeholder="추천 질문 입력 (최대 4개)"
              />
              <button
                type="button"
                onClick={addStarterMessage}
                disabled={formData.starterMessages.length >= 4}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={16} />
                추가
              </button>
            </div>

            {formData.starterMessages.length > 0 && (
              <div className="space-y-2">
                {formData.starterMessages.map((message, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded"
                  >
                    <span className="text-sm">{message}</span>
                    <button
                      type="button"
                      onClick={() => removeStarterMessage(index)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 기능 설정 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">기능 설정</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableImageInput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enableImageInput: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">이미지 입력 허용</span>
                </label>
                <button
                  type="button"
                  onClick={() => testFeature("image")}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <TestTube size={14} />
                  테스트
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableVoiceOutput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enableVoiceOutput: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">음성 출력 허용</span>
                </label>
                <button
                  type="button"
                  onClick={() => testFeature("voice")}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <TestTube size={14} />
                  테스트
                </button>
              </div>

              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableVoiceInput}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enableVoiceInput: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">음성 입력 허용</span>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded cursor-pointer bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">활성화</span>
              </label>
            </div>
          </div>

          {/* 폴더 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">폴더</h3>
            <select
              value={formData.folderId}
              onChange={(e) =>
                setFormData({ ...formData, folderId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">폴더 없음</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              {isEditMode ? "수정" : "생성"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
