"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, Upload, X, FileText, Plus, Trash2 } from "lucide-react";

// 이모지 카테고리별 목록
const emojiCategories = {
  교육: [
    "📚", "📖", "✏️", "📝", "📕", "📗", "📘", "📙", "📓", "📔",
    "📒", "📃", "📄", "📰", "🗞️", "📑", "🔖", "🏷️", "💼", "📊",
    "📈", "📉", "🗂️", "📅", "📆", "🗓️", "📇", "🗃️", "🗄️", "📋"
  ],
  과학기술: [
    "🔬", "🔭", "🧪", "🧬", "🧫", "💉", "💊", "🩺", "🩹", "🩼",
    "🔧", "🔩", "⚙️", "🛠️", "⚗️", "🧰", "🗜️", "⚡", "🔋", "🔌",
    "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶"
  ],
  예술창작: [
    "🎨", "🖌️", "🖍️", "🖊️", "🖋️", "✒️", "✍️", "📐", "📏", "📌",
    "📍", "🎭", "🎪", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷",
    "🎺", "🎸", "🪕", "🎻", "🪘", "🎲", "🎯", "🎰", "🎮", "🕹️"
  ],
  언어문학: [
    "📚", "📖", "📝", "✍️", "📜", "📃", "📄", "📋", "📑", "🔤",
    "🔡", "🔠", "🔣", "💬", "💭", "🗨️", "🗯️", "💡", "🧠", "🤔",
    "📢", "📣", "📯", "🔔", "🔕", "📻", "📱", "💻", "⌨️", "🖥️"
  ],
  수학통계: [
    "🔢", "➕", "➖", "✖️", "➗", "🟰", "💯", "📊", "📈", "📉",
    "📐", "📏", "🧮", "🔺", "🔻", "🔶", "🔷", "🔸", "🔹", "🔳",
    "🔲", "⬛", "⬜", "◼️", "◻️", "◾", "◽", "▪️", "▫️", "🟥"
  ],
  스포츠건강: [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
    "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
    "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "⛷️", "🏂", "🪂", "🏋️"
  ],
  자연환경: [
    "🌱", "🌿", "☘️", "🍀", "🎋", "🎍", "🌾", "🌵", "🌴", "🌳",
    "🌲", "🌰", "🌻", "🌺", "🌸", "🌼", "🌷", "🥀", "🌹", "🏵️",
    "💐", "🌾", "🍁", "🍂", "🍃", "🪴", "🪵", "🌊", "💧", "💦"
  ],
  동물: [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
    "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛"
  ],
  음식요리: [
    "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
    "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬",
    "🥒", "🌶️", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐"
  ],
  여행교통: [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
    "🛻", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵",
    "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟"
  ],
  사물도구: [
    "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
    "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️",
    "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️"
  ],
  표정감정: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "🫠", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️",
    "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗"
  ],
  별모양: [
    "⭐", "🌟", "💫", "✨", "🌠", "🌌", "🔥", "💥", "⚡", "✴️",
    "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️",
    "❄️", "☃️", "⛄", "🌬️", "💨", "☔", "💧", "💦", "🌊", "🫧"
  ]
};

interface AIBot {
  id: string;
  botId: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  systemPrompt: string;
  referenceFiles?: string[];
  starterMessages?: string[];
  enableImageInput?: boolean;
  enableVoiceOutput?: boolean;
  enableVoiceInput?: boolean;
  isActive: boolean;
}

interface EditBotDialogProps {
  bot: AIBot;
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

export function EditBotDialog({
  bot,
  open,
  onOpenChange,
  onSuccess,
}: EditBotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: bot.name,
    nameEn: bot.nameEn,
    description: bot.description,
    icon: bot.icon,
    color: bot.color,
    bgGradient: bot.bgGradient,
    systemPrompt: bot.systemPrompt,
    referenceFiles: bot.referenceFiles || [],
    starterMessages: bot.starterMessages || [],
    enableImageInput: bot.enableImageInput || false,
    enableVoiceOutput: bot.enableVoiceOutput || false,
    enableVoiceInput: bot.enableVoiceInput || false,
    isActive: bot.isActive,
  });

  const [newStarterMessage, setNewStarterMessage] = useState("");

  useEffect(() => {
    setFormData({
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      referenceFiles: bot.referenceFiles || [],
      starterMessages: bot.starterMessages || [],
      enableImageInput: bot.enableImageInput || false,
      enableVoiceOutput: bot.enableVoiceOutput || false,
      enableVoiceInput: bot.enableVoiceInput || false,
      isActive: bot.isActive,
    });
  }, [bot]);

  // 이모지 피커 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/ai-bots/${bot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("AI 봇이 수정되었습니다");
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        alert(data.error || "봇 수정에 실패했습니다");
      }
    } catch (error) {
      console.error("봇 수정 오류:", error);
      alert("봇 수정 중 오류가 발생했습니다");
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

  const handleEmojiSelect = (emoji: string) => {
    setFormData({ ...formData, icon: emoji });
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFiles(true);
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          console.error('파일 업로드 실패:', file.name);
        }
      }

      setFormData(prev => ({
        ...prev,
        referenceFiles: [...prev.referenceFiles, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceFiles: prev.referenceFiles.filter((_, i) => i !== index),
    }));
  };

  const addStarterMessage = () => {
    if (newStarterMessage.trim() && formData.starterMessages.length < 4) {
      setFormData(prev => ({
        ...prev,
        starterMessages: [...prev.starterMessages, newStarterMessage.trim()],
      }));
      setNewStarterMessage("");
    }
  };

  const removeStarterMessage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      starterMessages: prev.starterMessages.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 봇 수정</DialogTitle>
          <DialogDescription>
            봇 ID: {bot.botId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">한글 이름*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="예: 한국사 선생님"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">영문 이름*</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                required
                placeholder="예: History Teacher"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="icon">아이콘 (이모지)*</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-16 h-16 text-3xl"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {formData.icon}
                </Button>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  required
                  placeholder="🤖"
                  className="flex-1"
                />
              </div>

              {/* 이모지 선택 팝업 */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute z-50 mt-2 w-full max-w-md bg-white border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto"
                >
                  <div className="space-y-4">
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          {category}
                        </h4>
                        <div className="grid grid-cols-8 gap-2">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className={`text-2xl hover:bg-gray-100 rounded p-1 transition-colors ${
                                formData.icon === emoji ? 'bg-blue-100' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명*</Label>
            <Textarea
              id="description"
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              placeholder="이 봇이 어떤 역할을 하는지 설명해주세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">시스템 프롬프트 (지침사항)*</Label>
            <Textarea
              id="systemPrompt"
              rows={10}
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              required
              className="font-mono text-sm"
              placeholder="AI 봇의 역할, 톤, 응답 방식 등을 자세히 설명해주세요"
            />
          </div>

          {/* 참고 파일 업로드 */}
          <div className="space-y-2">
            <Label>참고 파일 (PDF, DOCX 등)</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                className="w-full"
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </>
                )}
              </Button>
              {formData.referenceFiles.length > 0 && (
                <div className="space-y-1">
                  {formData.referenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">{file.split('/').pop()}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 스타터 메시지 */}
          <div className="space-y-2">
            <Label>스타터 메시지 (최대 4개)</Label>
            <p className="text-sm text-gray-500">
              채팅 시작 시 사용자에게 추천할 질문을 입력하세요
            </p>
            <div className="flex gap-2">
              <Input
                value={newStarterMessage}
                onChange={(e) => setNewStarterMessage(e.target.value)}
                placeholder="예: 이 개념을 쉽게 설명해주세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStarterMessage();
                  }
                }}
                disabled={formData.starterMessages.length >= 4}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addStarterMessage}
                disabled={!newStarterMessage.trim() || formData.starterMessages.length >= 4}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.starterMessages.length > 0 && (
              <div className="space-y-1">
                {formData.starterMessages.map((message, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded"
                  >
                    <span className="text-sm flex-1">{message}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStarterMessage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 멀티모달 기능 설정 */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm">멀티모달 기능 설정</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableImageInput">이미지 입력 활성화</Label>
                <p className="text-xs text-gray-500">사용자가 이미지를 첨부할 수 있습니다</p>
              </div>
              <Switch
                id="enableImageInput"
                checked={formData.enableImageInput}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableImageInput: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableVoiceOutput">음성 출력 활성화</Label>
                <p className="text-xs text-gray-500">봇 응답을 음성으로 재생합니다</p>
              </div>
              <Switch
                id="enableVoiceOutput"
                checked={formData.enableVoiceOutput}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableVoiceOutput: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableVoiceInput">음성 입력 활성화</Label>
                <p className="text-xs text-gray-500">사용자가 음성을 녹음하여 입력할 수 있습니다</p>
              </div>
              <Switch
                id="enableVoiceInput"
                checked={formData.enableVoiceInput}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableVoiceInput: checked })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">봇 활성화</Label>
              <p className="text-xs text-gray-500">비활성화 시 사용자에게 표시되지 않습니다</p>
            </div>
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
                  수정 중...
                </>
              ) : (
                "수정 완료"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
