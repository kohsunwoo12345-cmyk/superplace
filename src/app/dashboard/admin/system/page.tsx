"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Save,
  Database,
  Mail,
  Shield,
  Bell,
  Globe,
} from "lucide-react";

export default function AdminSystemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    // 일반 설정
    siteName: "슈퍼플레이스 스터디",
    siteDescription: "체계적인 학습 관리 시스템",
    supportEmail: "support@superplace.com",
    supportPhone: "010-8739-9697",
    
    // 이메일 설정
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    
    // 알림 설정
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    
    // 보안 설정
    passwordMinLength: "8",
    sessionTimeout: "24",
    maxLoginAttempts: "5",
    
    // API 설정
    openaiApiKey: "",
    maxApiCallsPerDay: "1000",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...settings, ...data.settings });
        }
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  };

  const handleSave = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, settings }),
      });

      if (response.ok) {
        alert("설정이 저장되었습니다.");
      } else {
        alert("설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-gray-600" />
            시스템 설정
          </h1>
          <p className="text-gray-600 mt-1">
            시스템 전역 설정을 관리합니다
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin")}>
          대시보드로
        </Button>
      </div>

      {/* 설정 탭 */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Globe className="w-4 h-4 mr-2" />
            일반
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            이메일
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            알림
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            보안
          </TabsTrigger>
          <TabsTrigger value="api">
            <Database className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
        </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>
                사이트 기본 정보를 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">사이트 이름</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="siteDescription">사이트 설명</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="supportEmail">고객지원 이메일</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="supportPhone">고객지원 전화번호</Label>
                <Input
                  id="supportPhone"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                />
              </div>

              <Button onClick={() => handleSave("general")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이메일 설정 */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>이메일 설정</CardTitle>
              <CardDescription>
                SMTP 서버 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtpHost">SMTP 호스트</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <Label htmlFor="smtpPort">SMTP 포트</Label>
                <Input
                  id="smtpPort"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="smtpUser">SMTP 사용자명</Label>
                <Input
                  id="smtpUser"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="smtpPassword">SMTP 비밀번호</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                />
              </div>

              <Button onClick={() => handleSave("email")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>
                알림 수신 방법을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">이메일 알림</h3>
                  <p className="text-sm text-gray-600">
                    중요한 알림을 이메일로 받습니다
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({ ...settings, emailNotifications: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">SMS 알림</h3>
                  <p className="text-sm text-gray-600">
                    긴급 알림을 SMS로 받습니다
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) =>
                      setSettings({ ...settings, smsNotifications: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">푸시 알림</h3>
                  <p className="text-sm text-gray-600">
                    브라우저 푸시 알림을 받습니다
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      setSettings({ ...settings, pushNotifications: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <Button onClick={() => handleSave("notifications")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 설정 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>보안 설정</CardTitle>
              <CardDescription>
                시스템 보안 정책을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) =>
                    setSettings({ ...settings, passwordMinLength: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sessionTimeout">세션 타임아웃 (시간)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionTimeout: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, maxLoginAttempts: e.target.value })
                  }
                />
              </div>

              <Button onClick={() => handleSave("security")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API 설정 */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API 설정</CardTitle>
              <CardDescription>
                외부 API 연동 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  value={settings.openaiApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, openaiApiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
              </div>

              <div>
                <Label htmlFor="maxApiCallsPerDay">일일 최대 API 호출 수</Label>
                <Input
                  id="maxApiCallsPerDay"
                  type="number"
                  value={settings.maxApiCallsPerDay}
                  onChange={(e) =>
                    setSettings({ ...settings, maxApiCallsPerDay: e.target.value })
                  }
                />
              </div>

              <Button onClick={() => handleSave("api")} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
