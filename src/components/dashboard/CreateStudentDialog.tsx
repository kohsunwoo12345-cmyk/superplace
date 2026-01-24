"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    parentPhone: "",
    school: "",
    grade: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/students/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "학생 생성에 실패했습니다.");
      }

      alert("학생 계정이 생성되었습니다.");
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        parentPhone: "",
        school: "",
        grade: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("학생 생성 오류:", error);
      setError(error instanceof Error ? error.message : "학생 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              학생 추가
            </DialogTitle>
            <DialogDescription>
              새로운 학생 계정을 생성합니다. 생성된 계정은 즉시 사용 가능합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="8자 이상"
                minLength={8}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">최소 8자 이상</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="school">학교</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="OO초등학교"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade">학년 *</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
                disabled={loading}
                required
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="초1">초등학교 1학년</SelectItem>
                  <SelectItem value="초2">초등학교 2학년</SelectItem>
                  <SelectItem value="초3">초등학교 3학년</SelectItem>
                  <SelectItem value="초4">초등학교 4학년</SelectItem>
                  <SelectItem value="초5">초등학교 5학년</SelectItem>
                  <SelectItem value="초6">초등학교 6학년</SelectItem>
                  <SelectItem value="중1">중학교 1학년</SelectItem>
                  <SelectItem value="중2">중학교 2학년</SelectItem>
                  <SelectItem value="중3">중학교 3학년</SelectItem>
                  <SelectItem value="고1">고등학교 1학년</SelectItem>
                  <SelectItem value="고2">고등학교 2학년</SelectItem>
                  <SelectItem value="고3">고등학교 3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">학생 연락처</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parentPhone">학부모 연락처</Label>
              <Input
                id="parentPhone"
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="010-9876-5432"
                disabled={loading}
              />
            </div>
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
              {loading ? "생성 중..." : "학생 추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
