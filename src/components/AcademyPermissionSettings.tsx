"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Zap, 
  Brain, 
  BookOpen,
  Clock,
  TrendingUp
} from "lucide-react";

interface AcademyPermissions {
  dailyLimit: number;
  aiAnalysisEnabled: boolean;
  conceptAnalysisEnabled: boolean;
  homeworkCheckEnabled: boolean;
  attendanceTrackingEnabled: boolean;
  reportGenerationEnabled: boolean;
  smsNotificationEnabled: boolean;
  landingPageEnabled: boolean;
}

interface AcademyPermissionSettingsProps {
  academyId: string;
  academyName: string;
  currentPlan: string;
}

export default function AcademyPermissionSettings({
  academyId,
  academyName,
  currentPlan
}: AcademyPermissionSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<AcademyPermissions>({
    dailyLimit: 100,
    aiAnalysisEnabled: true,
    conceptAnalysisEnabled: true,
    homeworkCheckEnabled: true,
    attendanceTrackingEnabled: true,
    reportGenerationEnabled: true,
    smsNotificationEnabled: false,
    landingPageEnabled: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/academies/${academyId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissions),
      });

      if (response.ok) {
        alert("권한 설정이 저장되었습니다.");
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      console.error("권한 설정 저장 실패:", error);
      alert("권한 설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("기본 설정으로 초기화하시겠습니까?")) {
      setPermissions({
        dailyLimit: 100,
        aiAnalysisEnabled: true,
        conceptAnalysisEnabled: true,
        homeworkCheckEnabled: true,
        attendanceTrackingEnabled: true,
        reportGenerationEnabled: true,
        smsNotificationEnabled: false,
        landingPageEnabled: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{academyName} 권한 설정</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{currentPlan} 플랜</Badge>
                  <span className="text-xs text-gray-500">학원 ID: {academyId}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={saving}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 일일 사용 한도 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            일일 사용 한도
          </CardTitle>
          <CardDescription>
            하루에 사용할 수 있는 AI 요청 횟수를 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="dailyLimit">하루 최대 요청 수</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="0"
                max="10000"
                value={permissions.dailyLimit}
                onChange={(e) => 
                  setPermissions({ ...permissions, dailyLimit: parseInt(e.target.value) || 0 })
                }
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{permissions.dailyLimit}</div>
              <div className="text-sm text-gray-500">요청/일</div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>권장 설정:</strong> Basic 플랜 50-100회, Standard 플랜 200-500회, Premium 플랜 무제한(10,000)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI 기능 권한 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI 기반 분석 기능
          </CardTitle>
          <CardDescription>
            AI 역량 분석 및 개념 분석 기능 활성화
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <Label htmlFor="aiAnalysis" className="text-base font-medium cursor-pointer">
                  AI 기반 역량 분석
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학생의 학습 패턴을 분석하여 강점과 약점을 파악합니다
                </p>
              </div>
            </div>
            <Switch
              id="aiAnalysis"
              checked={permissions.aiAnalysisEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, aiAnalysisEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <div>
                <Label htmlFor="conceptAnalysis" className="text-base font-medium cursor-pointer">
                  개념 분석 실행
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학습한 개념의 이해도를 분석하고 취약점을 찾습니다
                </p>
              </div>
            </div>
            <Switch
              id="conceptAnalysis"
              checked={permissions.conceptAnalysisEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, conceptAnalysisEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 학습 관리 기능 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            학습 관리 기능
          </CardTitle>
          <CardDescription>
            숙제, 출석, 리포트 생성 기능 권한
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-green-500" />
              <div>
                <Label htmlFor="homeworkCheck" className="text-base font-medium cursor-pointer">
                  숙제 체크 기능
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  AI가 학생의 숙제를 자동으로 검사하고 피드백을 제공합니다
                </p>
              </div>
            </div>
            <Switch
              id="homeworkCheck"
              checked={permissions.homeworkCheckEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, homeworkCheckEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <Label htmlFor="attendanceTracking" className="text-base font-medium cursor-pointer">
                  출석 관리
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학생 출석을 자동으로 추적하고 통계를 생성합니다
                </p>
              </div>
            </div>
            <Switch
              id="attendanceTracking"
              checked={permissions.attendanceTrackingEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, attendanceTrackingEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <Label htmlFor="reportGeneration" className="text-base font-medium cursor-pointer">
                  학습 리포트 생성
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학생별 학습 리포트를 자동으로 생성하고 학부모에게 전송합니다
                </p>
              </div>
            </div>
            <Switch
              id="reportGeneration"
              checked={permissions.reportGenerationEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, reportGenerationEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 마케팅 & 알림 기능 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            마케팅 & 알림 기능
          </CardTitle>
          <CardDescription>
            SMS 알림 및 랜딩 페이지 생성 권한
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-teal-500" />
              <div>
                <Label htmlFor="smsNotification" className="text-base font-medium cursor-pointer">
                  SMS 문자 발송
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학부모에게 학습 리포트 및 공지사항을 문자로 발송합니다
                </p>
              </div>
            </div>
            <Switch
              id="smsNotification"
              checked={permissions.smsNotificationEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, smsNotificationEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-indigo-500" />
              <div>
                <Label htmlFor="landingPage" className="text-base font-medium cursor-pointer">
                  랜딩 페이지 생성
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  학생별 학습 데이터를 학부모에게 공유할 랜딩 페이지를 생성합니다
                </p>
              </div>
            </div>
            <Switch
              id="landingPage"
              checked={permissions.landingPageEnabled}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, landingPageEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 (하단) */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={saving}
          size="lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          초기화
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "저장 중..." : "변경사항 저장"}
        </Button>
      </div>
    </div>
  );
}
