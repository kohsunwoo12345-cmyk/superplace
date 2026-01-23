"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: bot.name,
    nameEn: bot.nameEn,
    description: bot.description,
    icon: bot.icon,
    color: bot.color,
    bgGradient: bot.bgGradient,
    systemPrompt: bot.systemPrompt,
    isActive: bot.isActive,
  });

  useEffect(() => {
    setFormData({
      name: bot.name,
      nameEn: bot.nameEn,
      description: bot.description,
      icon: bot.icon,
      color: bot.color,
      bgGradient: bot.bgGradient,
      systemPrompt: bot.systemPrompt,
      isActive: bot.isActive,
    });
  }, [bot]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 봇 수정</DialogTitle>
          <DialogDescription>
            봇 ID: {bot.botId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">한글 이름*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">아이콘*</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                required
              />
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
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isActive">활성화</Label>
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
