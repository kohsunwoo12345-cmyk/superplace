"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Lock, User, Key } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportNotifications, setReportNotifications] = useState(true);
  const [trendAlerts, setTrendAlerts] = useState(false);

  const handleSave = () => {
    toast({
      title: "설정 저장 완료",
      description: "설정이 성공적으로 저장되었습니다.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-2">
          계정 및 알림 설정을 관리하세요
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 설정
          </CardTitle>
          <CardDescription>
            기본 프로필 정보를 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={session?.user?.email || ""}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              defaultValue={session?.user?.name || ""}
            />
          </div>

          <Button onClick={handleSave}>저장</Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            보안 설정
          </CardTitle>
          <CardDescription>
            비밀번호 및 보안 설정을 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">현재 비밀번호</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="현재 비밀번호"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="새 비밀번호"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="새 비밀번호 확인"
            />
          </div>

          <Button>비밀번호 변경</Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API 키 관리
          </CardTitle>
          <CardDescription>
            외부 서비스 연동을 위한 API 키를 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>네이버 API</Label>
            <div className="flex gap-2">
              <Input placeholder="Client ID" />
              <Input placeholder="Client Secret" type="password" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>OpenAI API</Label>
            <Input placeholder="API Key" type="password" />
            <p className="text-xs text-muted-foreground">
              AI 기능을 사용하려면 OpenAI API 키가 필요합니다
            </p>
          </div>

          <div className="space-y-2">
            <Label>YouTube API</Label>
            <Input placeholder="API Key" type="password" />
          </div>

          <Button onClick={handleSave}>API 키 저장</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
          <CardDescription>
            알림 수신 방법을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>이메일 알림</Label>
              <p className="text-sm text-muted-foreground">
                중요한 업데이트를 이메일로 받습니다
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>리포트 알림</Label>
              <p className="text-sm text-muted-foreground">
                새로운 리포트가 생성되면 알림을 받습니다
              </p>
            </div>
            <Switch
              checked={reportNotifications}
              onCheckedChange={setReportNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>트렌드 알림</Label>
              <p className="text-sm text-muted-foreground">
                새로운 마케팅 트렌드 발견 시 알림을 받습니다
              </p>
            </div>
            <Switch
              checked={trendAlerts}
              onCheckedChange={setTrendAlerts}
            />
          </div>

          <Button onClick={handleSave}>알림 설정 저장</Button>
        </CardContent>
      </Card>
    </div>
  );
}
