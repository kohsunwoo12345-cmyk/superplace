"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Upload, Camera, Save, Key } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // 프로필 상태
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // 비밀번호 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 로딩 상태
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setProfileImage(session.user.image || "");
    }
  }, [session]);

  // 프로필 사진 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "5MB 이하의 이미지만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("이미지 업로드 실패");
      }

      const data = await response.json();
      setProfileImage(data.url);
      
      toast({
        title: "이미지 업로드 성공",
        description: "프로필 사진이 업로드되었습니다. 저장 버튼을 클릭하세요.",
      });
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // 프로필 정보 저장
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "이름 입력 필요",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          image: profileImage,
        }),
      });

      if (!response.ok) {
        throw new Error("프로필 업데이트 실패");
      }

      // 세션 업데이트
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          image: profileImage,
        },
      });

      toast({
        title: "저장 완료",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "입력 필요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "비밀번호 길이",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "비밀번호 변경 실패");
      }

      toast({
        title: "변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });

      // 입력 필드 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("비밀번호 변경 오류:", error);
      toast({
        title: "변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">프로필 설정</h1>
        <p className="text-muted-foreground mt-2">
          개인 정보 및 보안 설정을 관리하세요
        </p>
      </div>

      {/* 프로필 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 정보
          </CardTitle>
          <CardDescription>
            이름과 프로필 사진을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로필 사진 */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="프로필 사진"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200">
                  {name ? name[0].toUpperCase() : "U"}
                </div>
              )}
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Camera className="h-5 w-5" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">프로필 사진</h3>
              <p className="text-sm text-muted-foreground mb-3">
                JPG, PNG 형식 (최대 5MB)
              </p>
              {uploading && (
                <p className="text-sm text-blue-600">업로드 중...</p>
              )}
            </div>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              이 이름이 웹사이트 전체에서 표시됩니다
            </p>
          </div>

          {/* 역할 (읽기 전용) */}
          <div className="space-y-2">
            <Label htmlFor="role">역할</Label>
            <Input
              id="role"
              value={
                session?.user?.role === "SUPER_ADMIN"
                  ? "관리자"
                  : session?.user?.role === "DIRECTOR"
                  ? "원장님"
                  : session?.user?.role === "TEACHER"
                  ? "선생님"
                  : "학생"
              }
              disabled
              className="bg-gray-50"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingProfile ? "저장 중..." : "프로필 저장"}
          </Button>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            비밀번호 변경
          </CardTitle>
          <CardDescription>
            보안을 위해 정기적으로 비밀번호를 변경하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">현재 비밀번호 *</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">새 비밀번호 *</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="새 비밀번호 (최소 6자)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">새 비밀번호 확인 *</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Key className="mr-2 h-4 w-4" />
            {changingPassword ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
