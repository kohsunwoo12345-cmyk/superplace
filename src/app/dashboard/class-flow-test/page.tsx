"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Eye,
  Plus
} from "lucide-react";

export default function ClassFlowTestPage() {
  const [user, setUser] = useState<any>(null);
  const [testClassName, setTestClassName] = useState("테스트클래스_" + Date.now());
  const [testGrade, setTestGrade] = useState("중1");
  const [flowSteps, setFlowSteps] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const addStep = (step: string, status: 'pending' | 'success' | 'error', data?: any) => {
    setFlowSteps(prev => [...prev, { 
      step, 
      status, 
      data, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setFlowSteps([]);

    try {
      const token = localStorage.getItem("token");
      
      // Step 1: 사용자 정보 확인
      addStep("1️⃣ 사용자 정보 확인", 'pending');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!user) {
        addStep("1️⃣ 사용자 정보 확인", 'error', { error: "로컬스토리지에 사용자 정보 없음" });
        return;
      }
      
      const academyId = user.academyId || user.academy_id || user.id;
      addStep("1️⃣ 사용자 정보 확인", 'success', {
        email: user.email,
        role: user.role,
        academyId: academyId,
        academyIdType: typeof academyId
      });

      // Step 2: 생성 전 클래스 목록 조회
      addStep("2️⃣ 생성 전 클래스 목록 조회", 'pending');
      const beforeResponse = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const beforeData = await beforeResponse.json();
      addStep("2️⃣ 생성 전 클래스 목록 조회", 'success', {
        count: beforeData.classes?.length || 0,
        classes: beforeData.classes?.map((c: any) => ({
          id: c.id,
          name: c.name,
          academyId: c.academyId
        }))
      });

      // Step 3: 클래스 생성
      addStep("3️⃣ 클래스 생성 API 호출", 'pending');
      const createPayload = {
        academyId: academyId,
        name: testClassName,
        grade: testGrade,
        subject: "테스트",
        description: "플로우 테스트용 클래스",
        teacherId: user.id,
        color: "#3B82F6",
        schedules: [{
          dayOfWeek: [1, 3, 5],
          startTime: "14:00",
          endTime: "16:00"
        }],
        studentIds: []
      };

      console.log('📤 Creating class with payload:', createPayload);

      const createResponse = await fetch('/api/classes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      });

      const createData = await createResponse.json();
      
      if (!createResponse.ok) {
        addStep("3️⃣ 클래스 생성 API 호출", 'error', {
          status: createResponse.status,
          error: createData
        });
        return;
      }

      addStep("3️⃣ 클래스 생성 API 호출", 'success', {
        classId: createData.classId,
        response: createData
      });

      const createdClassId = createData.classId;

      // Wait a bit for DB to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: DB에서 직접 조회
      addStep("4️⃣ DB 직접 조회 (diagnostic API)", 'pending');
      const diagnosticResponse = await fetch('/api/classes/diagnostic', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const diagnosticData = await diagnosticResponse.json();
      
      const createdClass = diagnosticData.classes?.all?.find((c: any) => c.id === createdClassId);
      
      addStep("4️⃣ DB 직접 조회 (diagnostic API)", createdClass ? 'success' : 'error', {
        found: !!createdClass,
        classData: createdClass,
        allClassesCount: diagnosticData.classes?.all?.length || 0,
        userAcademyId: diagnosticData.user?.academyId,
        matchingCount: diagnosticData.classes?.matchingCount || 0
      });

      // Step 5: 생성 후 클래스 목록 조회
      addStep("5️⃣ 생성 후 클래스 목록 조회", 'pending');
      const afterResponse = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const afterData = await afterResponse.json();
      
      const isNewClassVisible = afterData.classes?.some((c: any) => c.id === createdClassId);
      
      addStep("5️⃣ 생성 후 클래스 목록 조회", isNewClassVisible ? 'success' : 'error', {
        count: afterData.classes?.length || 0,
        newClassVisible: isNewClassVisible,
        classes: afterData.classes?.map((c: any) => ({
          id: c.id,
          name: c.name,
          academyId: c.academyId
        }))
      });

      // Step 6: 타입 비교 분석
      addStep("6️⃣ 타입 비교 분석", 'pending');
      if (createdClass) {
        const userAcademyIdValue = academyId;
        const classAcademyIdValue = createdClass.academy_id;
        
        const looseMatch = classAcademyIdValue == userAcademyIdValue;
        const strictMatch = classAcademyIdValue === userAcademyIdValue;
        const intMatch = parseInt(String(classAcademyIdValue)) === parseInt(String(userAcademyIdValue));
        
        addStep("6️⃣ 타입 비교 분석", looseMatch ? 'success' : 'error', {
          userAcademyId: {
            value: userAcademyIdValue,
            type: typeof userAcademyIdValue,
            string: String(userAcademyIdValue)
          },
          classAcademyId: {
            value: classAcademyIdValue,
            type: typeof classAcademyIdValue,
            string: String(classAcademyIdValue)
          },
          comparisons: {
            'loose (==)': looseMatch,
            'strict (===)': strictMatch,
            'parseInt match': intMatch
          }
        });
      }

      // Final Summary
      const summary = {
        beforeCount: beforeData.classes?.length || 0,
        afterCount: afterData.classes?.length || 0,
        difference: (afterData.classes?.length || 0) - (beforeData.classes?.length || 0),
        classCreated: !!createdClassId,
        classFoundInDB: !!createdClass,
        classVisibleInList: isNewClassVisible
      };

      addStep("✅ 테스트 완료", 'success', summary);

    } catch (error: any) {
      addStep("❌ 테스트 실패", 'error', {
        error: error.message,
        stack: error.stack
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔬 클래스 생성 플로우 테스트</h1>
        <p className="text-gray-600">
          클래스 생성부터 조회까지 전체 과정을 추적하고 문제를 진단합니다
        </p>
      </div>

      {/* User Info */}
      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">현재 사용자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">이메일:</span>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-600">역할:</span>
                <Badge>{user.role}</Badge>
              </div>
              <div>
                <span className="text-gray-600">academyId:</span>
                <Badge variant={user.academyId ? "default" : "destructive"}>
                  {user.academyId || user.academy_id || user.id || "NULL"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">타입:</span>
                <code className="text-xs">{typeof (user.academyId || user.academy_id || user.id)}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Config */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">테스트 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="className">클래스 이름</Label>
              <Input
                id="className"
                value={testClassName}
                onChange={(e) => setTestClassName(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="grade">학년</Label>
              <Input
                id="grade"
                value={testGrade}
                onChange={(e) => setTestGrade(e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>
          <Button 
            onClick={runFullTest} 
            disabled={isRunning || !user}
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                테스트 실행 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                전체 플로우 테스트 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Flow Steps */}
      {flowSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">테스트 진행 과정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flowSteps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{step.step}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
                        </span>
                      </div>
                      
                      {step.data && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              상세 데이터 보기
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {flowSteps.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 테스트 절차</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>현재 클래스 목록을 조회합니다</li>
              <li>새로운 테스트 클래스를 생성합니다</li>
              <li>DB에서 생성된 클래스를 직접 확인합니다</li>
              <li>클래스 목록 API를 다시 호출하여 새 클래스가 보이는지 확인합니다</li>
              <li>academyId 타입 비교를 수행합니다</li>
              <li>전체 결과를 요약합니다</li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900">
                💡 이 테스트를 통해 클래스 생성 후 목록에 표시되지 않는 정확한 원인을 파악할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
