// Force rebuild: 2026-02-13 16:18:01
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Users,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Loader2,
  School,
} from "lucide-react";

interface AIBot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Academy {
  id: string;
  name: string;
  code: string;
  address?: string;
  directorName?: string;
}

interface AcademySubscription {
  id: string;
  academyId: string;
  academyName: string;
  botId: string;
  botName: string;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  startDate?: string;
  expiresAt: string;
  isActive: boolean;
}

interface Assignment {
  id: string;
  botId: string;
  botName: string;
  userId: number;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit: string;
  status: string;
  createdAt: string;
}

export default function AIBotAssignPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 데이터
  const [bots, setBots] = useState<AIBot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [academySubscriptions, setAcademySubscriptions] = useState<AcademySubscription[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // 폼 상태
  const [assignType, setAssignType] = useState<"user" | "academy">("user");
  const [selectedBot, setSelectedBot] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // 다중 선택
  const [selectedAcademy, setSelectedAcademy] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [studentLimit, setStudentLimit] = useState("30");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState("day");
  const [dailyUsageLimit, setDailyUsageLimit] = useState("15"); // 🆕 일일 사용 한도
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setCurrentUser(userData);
    
    console.log("📋 User data:", userData);
    console.log("✅ AI Bot Assign page access granted");

    // 권한 체크
    const role = userData.role?.toUpperCase();
    if (!['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'TEACHER'].includes(role)) {
      alert('AI 봇 할당 권한이 없습니다.');
      router.push('/dashboard');
      return;
    }

    // userData를 직접 전달
    fetchData(userData);
  }, [router]);

  const fetchData = async (userData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log('🔍 Current user:', userData);
      console.log('🔍 Academy ID:', userData?.academyId);
      
      // 학원장/선생님은 자신의 학원에 할당된 봇만 조회
      const role = userData?.role?.toUpperCase();
      let botsEndpoint = "/api/admin/ai-bots";
      
      if (role === 'DIRECTOR' || role === 'TEACHER') {
        // 학원장/선생님: 자신의 학원에 할당된 봇만
        let academyId = userData?.academyId;
        
        // 🔧 academyId가 없으면 자동 수정 시도
        if (!academyId && role === 'DIRECTOR') {
          console.log('🔧 DIRECTOR academyId 없음 - 자동 수정 시도');
          try {
            const fixResponse = await fetch('/api/admin/fix-director-academy', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (fixResponse.ok) {
              const fixData = await fixResponse.json();
              console.log('✅ academyId 자동 수정 성공:', fixData);
              
              if (fixData.success && fixData.user?.academyId) {
                academyId = fixData.user.academyId;
                
                // localStorage 업데이트
                const updatedUser = { ...userData, academyId: academyId };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
                
                alert(`✅ 학원 정보가 자동으로 연결되었습니다!\n\n학원: ${fixData.academy?.name || '알 수 없음'}`);
              }
            } else {
              console.error('❌ academyId 자동 수정 실패');
            }
          } catch (fixError) {
            console.error('❌ academyId 자동 수정 오류:', fixError);
          }
        }
        
        if (!academyId) {
          alert('학원 정보가 없습니다.\n\n다시 로그인하거나 관리자에게 문의하세요.');
          setLoading(false);
          return;
        }
        botsEndpoint = `/api/user/ai-bots?academyId=${academyId}`;
        console.log('🔒 DIRECTOR/TEACHER: Using assigned bots only from', botsEndpoint);
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        // 관리자: 모든 봇
        console.log('🔓 ADMIN: Using all bots from', botsEndpoint);
      } else {
        alert('AI 봇 할당 권한이 없습니다.');
        router.push('/dashboard');
        return;
      }
      
      // AI 봇 목록 조회
      const botsResponse = await fetch(botsEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        console.log('✅ Bots loaded:', botsData);
        setBots(botsData.bots || []);
        
        if ((botsData.bots || []).length === 0) {
          alert('할당된 AI 봇이 없습니다.\n관리자에게 봇 할당을 요청하세요.');
        }
      } else {
        const errorData = await botsResponse.json().catch(() => ({}));
        console.error('❌ Failed to load bots:', errorData);
        alert(`봇 목록 로드 실패: ${errorData.error || errorData.message || '알 수 없는 오류'}`);
      }

      // 사용자 목록 조회
      let usersEndpoint = "/api/admin/users";
      if (role === 'DIRECTOR' || role === 'TEACHER') {
        // 학원장/선생님: 자신의 학원 학생만 조회
        const academyId = userData?.academyId;
        if (academyId) {
          usersEndpoint = `/api/admin/users?academyId=${academyId}&role=STUDENT`;
          console.log('🔒 DIRECTOR/TEACHER: Loading only students from academy', academyId);
        }
      }
      
      const usersResponse = await fetch(usersEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Users loaded:', usersData);
        setUsers(usersData.users || []);
      } else {
        console.error('❌ Failed to load users');
      }

      // 기존 할당 목록 조회
      const assignmentsResponse = await fetch("/api/admin/ai-bots/assignments", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log('✅ Assignments loaded:', assignmentsData);
        setAssignments(assignmentsData.assignments || []);
      } else {
        console.error('❌ Failed to load assignments');
      }

      // 관리자인 경우 학원 목록 조회
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        const academiesResponse = await fetch("/api/admin/academies", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (academiesResponse.ok) {
          const academiesData = await academiesResponse.json();
          console.log('✅ Academies loaded:', academiesData);
          setAcademies(academiesData.academies || []);
        } else {
          console.error('❌ Failed to load academies');
        }

        // 관리자: 모든 학원 구독 정보 조회
        const subscriptionsResponse = await fetch("/api/admin/academy-bot-subscriptions", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          console.log('✅ Academy subscriptions loaded:', subscriptionsData);
          console.log('📊 Subscription count:', subscriptionsData.subscriptions?.length || 0);
          console.log('📊 Subscription details:', JSON.stringify(subscriptionsData.subscriptions, null, 2));
          setAcademySubscriptions(subscriptionsData.subscriptions || []);
        } else {
          const errorText = await subscriptionsResponse.text();
          console.error('❌ Failed to load academy subscriptions:', subscriptionsResponse.status, errorText);
        }
      } else if (role === 'DIRECTOR' || role === 'TEACHER') {
        // 학원장/선생님: 자신의 학원 구독 정보 조회
        const academyId = userData?.academyId;
        if (academyId) {
          const subscriptionsResponse = await fetch(`/api/user/academy-bot-subscriptions?academyId=${academyId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (subscriptionsResponse.ok) {
            const subscriptionsData = await subscriptionsResponse.json();
            console.log('✅ My academy subscriptions loaded:', subscriptionsData);
            console.log('📊 Subscription count:', subscriptionsData.subscriptions?.length || 0);
            console.log('📊 Subscription details:', JSON.stringify(subscriptionsData.subscriptions, null, 2));
            setAcademySubscriptions(subscriptionsData.subscriptions || []);
          } else {
            const errorText = await subscriptionsResponse.text();
            console.error('❌ Failed to load my academy subscriptions:', subscriptionsResponse.status, errorText);
          }
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      alert(`데이터 로드 실패: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    // 유효성 검증
    if (!selectedBot) {
      alert("AI 봇을 선택해주세요.");
      return;
    }
    
    // 학원 할당은 기간 필수
    if (assignType === "academy" && !duration) {
      alert("학원 할당 시 구독 기간을 선택해주세요.");
      return;
    }

    if (assignType === "user" && selectedUsers.length === 0) {
      alert("할당할 학생을 최소 1명 이상 선택해주세요.");
      return;
    }

    if (assignType === "academy") {
      if (!selectedAcademy) {
        alert("할당할 학원을 선택해주세요.");
        return;
      }
      if (!studentLimit || parseInt(studentLimit) < 1) {
        alert("학생 수 제한을 1명 이상으로 설정해주세요.");
        return;
      }
    }

    const durationNumber = parseInt(duration);
    if (isNaN(durationNumber) || durationNumber < 1) {
      alert("기간은 1 이상의 숫자여야 합니다.");
      return;
    }

    // 최대 기간 검증
    if (durationUnit === "day" && durationNumber > 36500) {
      alert("일 단위는 최대 36,500일(100년)까지 가능합니다.");
      return;
    }
    if (durationUnit === "month" && durationNumber > 1200) {
      alert("월 단위는 최대 1,200개월(100년)까지 가능합니다.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      if (assignType === "academy") {
        // 학원 전체 할당
        
        // 날짜 계산
        const startDate = new Date();
        const endDate = new Date();
        
        if (durationUnit === "day") {
          endDate.setDate(endDate.getDate() + durationNumber);
        } else {
          endDate.setMonth(endDate.getMonth() + durationNumber);
        }
        
        const payload = {
          academyId: selectedAcademy,
          productId: selectedBot,
          studentCount: parseInt(studentLimit),
          subscriptionStart: startDate.toISOString().split('T')[0],
          subscriptionEnd: endDate.toISOString().split('T')[0],
          pricePerStudent: 0,
          memo: `Duration: ${durationNumber} ${durationUnit}`,
        };
        
        console.log('📤 학원 할당 요청:', payload);
        console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'null');
        
        const response = await fetch("/api/admin/academy-bot-subscriptions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        console.log('📥 응답 상태:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📥 응답 데이터:', data);

        if (response.ok && data.success) {
          const academy = (academies || []).find(a => a.id === selectedAcademy);
          const bot = (bots || []).find(b => b.id === selectedBot);
          
          alert(`✅ 학원에 AI 봇이 할당되었습니다!\n\n학원: ${academy?.name || '알 수 없음'}\n봇: ${bot?.name || '알 수 없음'}\n학생 수 제한: ${studentLimit}명\n기간: ${durationNumber}${durationUnit === 'day' ? '일' : '개월'}`);
          
          // 폼 초기화
          setSelectedBot("");
          setSelectedAcademy("");
          setStudentLimit("30");
          setDuration("1");
          setDurationUnit("day");
          
          // 데이터 새로고침
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            fetchData(userData);
          }
        } else {
          const errorMessage = data.message || data.error || data.details || "알 수 없는 오류";
          console.error('❌ 할당 실패:', { status: response.status, data });
          alert(`❌ 학원 할당 실패\n\n상태 코드: ${response.status}\n오류: ${errorMessage}`);
        }
      } else {
        // 개별 사용자 다중 할당
        
        console.log('🔍 [할당 시작] 현재 상태:', {
          currentUserRole: currentUser?.role,
          selectedBot,
          selectedUsersCount: selectedUsers.length,
          totalSubscriptions: academySubscriptions.length,
          subscriptions: academySubscriptions.map(s => ({
            id: s.id,
            botId: s.botId,
            botName: s.botName,
            academyId: s.academyId,
            expiresAt: s.expiresAt,
            totalSlots: s.totalSlots,
            remainingSlots: s.remainingSlots
          }))
        });
        
        // 🚨 디버깅: 사용자에게 현재 상태 표시
        const debugInfo = `📊 디버깅 정보:\n\n` +
          `선택한 봇 ID: ${selectedBot}\n` +
          `봇 ID 타입: ${typeof selectedBot}\n\n` +
          `총 구독 수: ${academySubscriptions.length}\n\n` +
          `구독 목록:\n${academySubscriptions.map((s, i) => 
            `${i+1}. botId: ${s.botId} (타입: ${typeof s.botId})\n   봇명: ${s.botName}\n   남은슬롯: ${s.remainingSlots}\n   만료일: ${s.expiresAt}`
          ).join('\n\n')}`;
        
        console.log('🚨 디버깅 정보:', debugInfo);
        
        // 임시: 사용자에게 보여주기
        if (confirm(`${debugInfo}\n\n계속 진행하시겠습니까? (확인=예, 취소=중단)`)) {
          console.log('✅ 사용자가 계속 진행을 선택함');
        } else {
          console.log('❌ 사용자가 중단을 선택함');
          return;
        }
        
        // 🔥 학원 구독 정보 확인 (학원장/선생님/관리자 모두)
        let subscription = null;
        const now = new Date();
        
        if (currentUser?.role === 'DIRECTOR' || currentUser?.role === 'TEACHER') {
          // 학원장/선생님: 자신의 학원 구독만 (날짜 기반 검증)
          console.log('🔍 [DIRECTOR/TEACHER] 구독 검색 중...', {
            selectedBot,
            totalSubs: academySubscriptions.length
          });
          
          subscription = (academySubscriptions || []).find(sub => {
            console.log('🔍 [검사] 구독:', {
              subBotId: sub.botId,
              subBotIdType: typeof sub.botId,
              selectedBot,
              selectedBotType: typeof selectedBot,
              strictMatch: sub.botId === selectedBot,
              looseMatch: sub.botId == selectedBot,
              stringMatch: String(sub.botId) === String(selectedBot),
              expiresAt: sub.expiresAt,
              expiresAtParsed: new Date(sub.expiresAt),
              now,
              isValid: new Date(sub.expiresAt) >= now
            });
            
            // 문자열로 변환하여 비교 (타입 불일치 방지)
            if (String(sub.botId) !== String(selectedBot)) return false;
            const expiresAt = new Date(sub.expiresAt);
            return expiresAt >= now; // 만료일이 현재 이후
          });
          
          console.log('🔍 [DIRECTOR/TEACHER] 찾은 구독:', subscription);
        } else if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
          // 관리자: 첫 번째 학생의 학원 구독 찾기 (날짜 기반 검증)
          const firstTargetUser = users.find(u => u.id.toString() === selectedUsers[0]);
          if (firstTargetUser && (firstTargetUser as any).academyId) {
            subscription = (academySubscriptions || []).find(sub => {
              if (String(sub.botId) !== String(selectedBot)) return false;
              if (sub.academyId !== (firstTargetUser as any).academyId) return false;
              const expiresAt = new Date(sub.expiresAt);
              return expiresAt >= now; // 만료일이 현재 이후
            });
          }
        }
        
        if (!subscription) {
          // 🚨 구독을 찾지 못한 이유 분석
          const matchingBotIds = academySubscriptions
            .filter(sub => String(sub.botId) === String(selectedBot))
            .map(sub => ({
              botId: sub.botId,
              expiresAt: sub.expiresAt,
              isExpired: new Date(sub.expiresAt) < now
            }));
          
          const expiredSubs = matchingBotIds.filter(s => s.isExpired);
          const validSubs = matchingBotIds.filter(s => !s.isExpired);
          
          let errorMsg = '❌ 이 봇에 대한 구독을 찾을 수 없습니다.\n\n';
          
          if (matchingBotIds.length === 0) {
            errorMsg += `🔍 원인: 선택한 봇 ID(${selectedBot})와 일치하는 구독이 없습니다.\n\n`;
            errorMsg += `📋 현재 구독 중인 봇:\n`;
            academySubscriptions.forEach((sub, i) => {
              errorMsg += `${i+1}. ${sub.botName} (ID: ${sub.botId})\n`;
            });
            if (academySubscriptions.length === 0) {
              errorMsg += '(구독 없음)\n';
            }
          } else if (expiredSubs.length > 0 && validSubs.length === 0) {
            errorMsg += `🔍 원인: 구독이 만료되었습니다.\n\n`;
            errorMsg += `만료일: ${expiredSubs[0].expiresAt}\n`;
          }
          
          errorMsg += '\n💡 해결방법:\n';
          errorMsg += '• 구매하지 않은 경우: 관리자에게 봇 구매를 요청하세요.\n';
          errorMsg += '• 구독 만료된 경우: 관리자에게 구독 연장을 요청하세요.';
          
          console.error('❌ 구독 없음:', {
            selectedBot,
            totalSubs: academySubscriptions.length,
            matchingBotIds,
            expiredSubs,
            validSubs
          });
          
          alert(errorMsg);
          return;
        }
        
        // 슬롯 확인 - 선택한 학생 수만큼 필요
        const requiredSlots = selectedUsers.length;
        if (subscription.remainingSlots < requiredSlots) {
          alert(`❌ 남은 슬롯이 부족합니다.\n\n필요한 슬롯: ${requiredSlots}명\n남은 슬롯: ${subscription.remainingSlots}명\n\n사용 가능: ${subscription.totalSlots}명\n이미 사용: ${subscription.usedSlots}명\n\n💡 해결방법:\n• 미사용 학생의 할당을 취소하여 슬롯을 확보하거나\n• 관리자에게 추가 슬롯 구매를 요청하세요.`);
          return;
        }
        
        // 🔥 학원 구독 만료일 확인 (이중 체크)
        const subscriptionEndDate = new Date(subscription.expiresAt);
        if (subscriptionEndDate < now) {
          alert(`❌ 학원의 봇 구독이 만료되었습니다.\n\n만료일: ${subscriptionEndDate.toLocaleDateString('ko-KR')}\n\n관리자에게 구독 연장을 요청하세요.`);
          return;
        }
        
        console.log('📅 학원 구독 정보:', {
          subscriptionEnd: subscription.expiresAt,
          totalSlots: subscription.totalSlots,
          usedSlots: subscription.usedSlots,
          remainingSlots: subscription.remainingSlots,
          requiredSlots
        });
        
        // 🔥 다중 할당 처리
        const successList = [];
        const failList = [];
        
        for (const userId of selectedUsers) {
          try {
            const response = await fetch("/api/admin/ai-bots/assign", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                botId: selectedBot,
                userId: userId,
                dailyUsageLimit: parseInt(dailyUsageLimit) || 15, // 🆕 일일 사용 한도
              }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
              const targetUser = users.find(u => u.id.toString() === userId);
              successList.push(targetUser?.name || userId);
            } else {
              const targetUser = users.find(u => u.id.toString() === userId);
              failList.push({
                name: targetUser?.name || userId,
                error: data.message || data.error || "알 수 없는 오류"
              });
            }
          } catch (e) {
            const targetUser = users.find(u => u.id.toString() === userId);
            failList.push({
              name: targetUser?.name || userId,
              error: "네트워크 오류"
            });
          }
        }
        
        // 결과 표시
        let resultMessage = '';
        
        if (successList.length > 0) {
          resultMessage += `✅ 성공적으로 할당되었습니다 (${successList.length}명)\n\n`;
          resultMessage += successList.join(', ');
          resultMessage += `\n\n봇: ${(bots || []).find(b => b.id === selectedBot)?.name || selectedBot}`;
          resultMessage += `\n종료일: ${new Date(subscription.expiresAt).toLocaleDateString('ko-KR')}`;
        }
        
        if (failList.length > 0) {
          resultMessage += `\n\n❌ 할당 실패 (${failList.length}명)\n\n`;
          resultMessage += failList.map(f => `• ${f.name}: ${f.error}`).join('\n');
        }
        
        alert(resultMessage);
        
        // 폼 초기화
        setSelectedBot("");
        setSelectedUsers([]);
        
        // 할당 목록 새로고침
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchData(userData);
        }
      }
    } catch (error) {
      console.error("할당 오류:", error);
      alert("할당 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    if (!confirm("정말 이 할당을 취소하시겠습니까?\n\n취소하면 구독 슬롯이 복원되어 다른 학생에게 재할당할 수 있습니다.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/ai-bots/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ 할당이 취소되었습니다.\n\n구독 슬롯이 복원되어 다른 학생에게 재할당할 수 있습니다.");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchData(userData);
        }
      } else {
        const errorMessage = data.message || data.error || "알 수 없는 오류";
        alert(`❌ 취소 실패\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error("취소 오류:", error);
      alert("취소 중 오류가 발생했습니다.");
    }
  };

  // 역할별로 사용자 필터링 (안전한 배열 처리)
  const safeUsers = users || [];
  const filteredUsers = selectedRole === "all" 
    ? safeUsers 
    : safeUsers.filter(user => {
        if (selectedRole === "ACADEMY") return user.role === "DIRECTOR" || user.role === "member";
        if (selectedRole === "TEACHER") return user.role === "TEACHER" || user.role === "user";
        if (selectedRole === "STUDENT") return user.role === "STUDENT";
        return false;
      });

  // 역할별 사용자 수 (안전한 배열 처리)
  const roleStats = {
    all: safeUsers.length,
    academy: safeUsers.filter(u => u.role === "DIRECTOR" || u.role === "member").length,
    teacher: safeUsers.filter(u => u.role === "TEACHER" || u.role === "user").length,
    student: safeUsers.filter(u => u.role === "STUDENT").length,
  };

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/ai-bots")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-blue-600" />
              AI 봇 할당
            </h1>
            <p className="text-gray-600 mt-1">
              사용자에게 AI 봇을 할당하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 할당 폼 */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            새 봇 할당
          </CardTitle>
          <CardDescription>
            사용자를 선택하고 AI 봇을 할당하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 할당 방식 선택 (ADMIN/SUPER_ADMIN만 표시) */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Label className="text-base font-semibold mb-3 block">할당 방식 선택</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="user"
                    checked={assignType === "user"}
                    onChange={(e) => setAssignType(e.target.value as "user" | "academy")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">개별 사용자</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    value="academy"
                    checked={assignType === "academy"}
                    onChange={(e) => setAssignType(e.target.value as "user" | "academy")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">학원 전체 (여러 학생 할당 가능)</span>
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {assignType === "user" 
                  ? "특정 사용자 한 명에게만 봇을 할당합니다." 
                  : "학원에 봇을 할당하면, 해당 학원장이 정해진 학생 수만큼 학생들에게 재할당할 수 있습니다."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI 봇 선택 */}
            <div className="space-y-2">
              <Label htmlFor="bot">AI 봇 선택</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger id="bot">
                  <SelectValue placeholder="봇을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {(bots || []).filter(bot => bot.isActive).map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                활성화된 봇만 표시됩니다 ({(bots || []).filter(b => b.isActive).length}개)
              </p>
              
              {/* 학원장/선생님: 선택한 봇의 슬롯 정보 표시 */}
              {(currentUser?.role === 'DIRECTOR' || currentUser?.role === 'TEACHER') && selectedBot && (
                (() => {
                  // 디버깅 로그
                  console.log('🔍 Bot selection debug:', {
                    selectedBot,
                    totalSubscriptions: academySubscriptions.length,
                    subscriptions: academySubscriptions.map(s => ({
                      botId: s.botId,
                      botName: s.botName,
                      expiresAt: s.expiresAt,
                      totalSlots: s.totalSlots,
                      remainingSlots: s.remainingSlots
                    }))
                  });
                  
                  // 날짜 기반 유효성 검증 (isActive 제거)
                  const now = new Date();
                  const subscription = (academySubscriptions || []).find(sub => {
                    console.log('🔍 Checking subscription:', {
                      botId: sub.botId,
                      botIdType: typeof sub.botId,
                      selectedBot,
                      selectedBotType: typeof selectedBot,
                      strictMatch: sub.botId === selectedBot,
                      stringMatch: String(sub.botId) === String(selectedBot),
                      expiresAt: sub.expiresAt,
                      expiresAtDate: new Date(sub.expiresAt),
                      isValid: new Date(sub.expiresAt) >= now
                    });
                    
                    // 문자열로 변환하여 비교
                    if (String(sub.botId) !== String(selectedBot)) return false;
                    const expiresAt = new Date(sub.expiresAt);
                    return expiresAt >= now; // 만료일이 현재 이후인 구독만
                  });
                  
                  console.log('🔍 Found subscription:', subscription);
                  
                  if (subscription) {
                    const expiresAt = new Date(subscription.expiresAt);
                    const isExpired = expiresAt < now;
                    const hasSlots = subscription.remainingSlots > 0;
                    
                    return (
                      <div className={`mt-2 p-3 border rounded-md ${
                        !hasSlots ? 'bg-red-50 border-red-200' : 
                        isExpired ? 'bg-yellow-50 border-yellow-200' : 
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <p className="text-xs font-semibold mb-1">할당 가능 슬롯 정보</p>
                        <div className="text-xs space-y-1">
                          <p>• 총 슬롯: <span className="font-semibold">{subscription.totalSlots}명</span></p>
                          <p>• 사용 중: <span className="font-semibold">{subscription.usedSlots}명</span></p>
                          <p>• 남은 슬롯: <span className={`font-semibold ${hasSlots ? 'text-green-600' : 'text-red-600'}`}>
                            {subscription.remainingSlots}명
                          </span></p>
                          <p>• 종료일: <span className="font-semibold">{expiresAt.toLocaleDateString('ko-KR')}</span></p>
                        </div>
                        {!hasSlots && (
                          <p className="text-xs text-red-700 mt-2">⚠️ 남은 슬롯이 없습니다. 구독을 연장하거나 추가 구매하세요.</p>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800">⚠️ 이 봇은 귀하의 학원에 할당되지 않았습니다.</p>
                        <p className="text-xs text-yellow-700 mt-1">관리자에게 봇 구매 또는 할당을 요청하세요.</p>
                      </div>
                    );
                  }
                })()
              )}
            </div>

            {/* 개별 사용자 할당 필드 */}
            {assignType === "user" && (
              <>
                {/* 역할 필터 - ADMIN/SUPER_ADMIN만 표시 */}
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                  <div className="space-y-2">
                    <Label htmlFor="role-filter">사용자 역할 필터</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger id="role-filter">
                        <SelectValue placeholder="역할을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          전체 ({roleStats.all}명)
                        </SelectItem>
                        <SelectItem value="ACADEMY">
                          학원 원장 ({roleStats.academy}명)
                        </SelectItem>
                        <SelectItem value="TEACHER">
                          선생님 ({roleStats.teacher}명)
                        </SelectItem>
                        <SelectItem value="STUDENT">
                          학생 ({roleStats.student}명)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      역할별로 사용자를 필터링합니다
                    </p>
                  </div>
                )}

                {/* DIRECTOR/TEACHER용 안내 메시지 */}
                {(currentUser?.role === 'DIRECTOR' || currentUser?.role === 'TEACHER') && (
                  <div className="md:col-span-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        📌 귀하의 학원 학생들에게만 AI 봇을 할당할 수 있습니다. (퇴원생 제외)
                      </p>
                    </div>
                  </div>
                )}

                {/* 사용자 다중 선택 */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="users">학생 선택 (다중 선택 가능)</Label>
                  <div className="border rounded-md p-3 max-h-64 overflow-y-auto bg-white">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">선택 가능한 학생이 없습니다</p>
                    ) : (
                      <div className="space-y-2">
                        {/* 전체 선택/해제 */}
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer border-b">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(filteredUsers.map(u => u.id.toString()));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            전체 선택 ({selectedUsers.length}/{filteredUsers.length})
                          </span>
                        </label>
                        
                        {/* 개별 학생 */}
                        {filteredUsers.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id.toString()]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{user.role}</Badge>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedUsers.length}명 선택됨 / 총 {filteredUsers.length}명
                  </p>
                </div>
              </>
            )}

            {/* 🆕 일일 사용 한도 - 사용자 할당 시 표시 */}
            {assignType === "user" && (
              <div className="space-y-2">
                <Label htmlFor="dailyUsageLimit">일일 사용 한도 (회)</Label>
                <Input
                  id="dailyUsageLimit"
                  type="number"
                  min="1"
                  max="1000"
                  value={dailyUsageLimit}
                  onChange={(e) => setDailyUsageLimit(e.target.value)}
                  placeholder="예: 15"
                />
                <p className="text-xs text-gray-500">
                  학생이 하루에 이 봇을 사용할 수 있는 최대 횟수입니다 (기본값: 15회)
                </p>
              </div>
            )}

            {/* 학원 할당 필드 */}
            {assignType === "academy" && (
              <>
                {/* 학원 선택 */}
                <div className="space-y-2">
                  <Label htmlFor="academy">학원 선택</Label>
                  <Select value={selectedAcademy} onValueChange={setSelectedAcademy}>
                    <SelectTrigger id="academy">
                      <SelectValue placeholder="학원을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {(academies || []).map((academy) => (
                        <SelectItem key={academy.id} value={academy.id}>
                          {academy.name} ({academy.code}){academy.address ? ` - ${academy.address}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {(academies || []).length}개의 학원
                  </p>
                </div>

                {/* 학생 수 제한 */}
                <div className="space-y-2">
                  <Label htmlFor="studentLimit">학생 수 제한 (명)</Label>
                  <Input
                    id="studentLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={studentLimit}
                    onChange={(e) => setStudentLimit(e.target.value)}
                    placeholder="예: 30"
                  />
                  <p className="text-xs text-gray-500">
                    학원장이 이 봇을 할당할 수 있는 최대 학생 수입니다
                  </p>
                </div>
              </>
            )}

            {/* 기간 입력 - 학원 할당에만 표시 */}
            {assignType === "academy" && (
              <div className="space-y-2">
                <Label htmlFor="duration">학원 구독 기간</Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max={durationUnit === "day" ? "36500" : "1200"}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="기간"
                    className="flex-1"
                  />
                  <Select value={durationUnit} onValueChange={setDurationUnit}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">일</SelectItem>
                      <SelectItem value="month">개월</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-500">
                  {durationUnit === "day"
                    ? "최대 36,500일(100년) 가능"
                    : "최대 1,200개월(100년) 가능"}
                </p>
              </div>
            )}
            
            {/* 개별 사용자 할당 시 안내 메시지 */}
            {assignType === "user" && selectedBot && (
              <div className="md:col-span-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📅 사용 기간 안내</p>
                  <p className="text-sm text-blue-800">
                    학생의 AI 봇 사용 기간은 <span className="font-bold">학원 구독 기간과 자동으로 동일</span>하게 설정됩니다.
                    별도로 기간을 선택할 필요가 없습니다.
                  </p>
                  {(() => {
                    const now = new Date();
                    const subscription = (academySubscriptions || []).find(sub => {
                      // 문자열로 변환하여 비교
                      if (String(sub.botId) !== String(selectedBot)) return false;
                      const expiresAt = new Date(sub.expiresAt);
                      return expiresAt >= now; // 만료일이 현재 이후인 구독만
                    });
                    if (subscription) {
                      const endDate = new Date(subscription.expiresAt).toLocaleDateString('ko-KR');
                      return (
                        <p className="text-sm text-blue-800 mt-2">
                          ✅ 학원 구독 만료일: <span className="font-bold">{endDate}</span>
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            {/* 할당 버튼 */}
            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={
                  submitting || 
                  !selectedBot || 
                  (assignType === "user" && selectedUsers.length === 0) ||
                  (assignType === "academy" && (!selectedAcademy || !studentLimit))
                }
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    할당 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    봇 할당하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 학원 구독 목록 (쇼핑몰 구매 내역) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            학원 AI 봇 구독 현황
          </CardTitle>
          <CardDescription>
            봇 쇼핑몰에서 구매하거나 관리자에게 할당받은 AI 봇 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(academySubscriptions || []).length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">구독 중인 봇이 없습니다</p>
              <p className="text-sm text-gray-400 mt-2">
                관리자에게 봇 할당을 요청하거나 봇 쇼핑몰에서 구매하세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(academySubscriptions || []).map((subscription) => {
                const now = new Date();
                const expiresAt = new Date(subscription.expiresAt);
                const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
                const isExpired = expiresAt < now;
                const hasSlots = subscription.remainingSlots > 0;
                const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={subscription.id}
                    className={`border rounded-lg p-4 ${
                      isExpired ? 'bg-gray-50 border-gray-300' : 
                      !hasSlots ? 'bg-red-50 border-red-200' :
                      'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-semibold text-base">
                            {subscription.botName || '알 수 없음'}
                          </Badge>
                          <Badge variant={isExpired ? "secondary" : hasSlots ? "default" : "destructive"}>
                            {isExpired ? "만료됨" : hasSlots ? "사용 가능" : "슬롯 부족"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          학원: {subscription.academyName || currentUser?.academyName || '알 수 없음'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">총 슬롯</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {subscription.totalSlots}명
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">사용 중</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {subscription.usedSlots}명
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">남은 슬롯</p>
                        <p className={`text-lg font-semibold ${
                          hasSlots ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {subscription.remainingSlots}명
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          {isExpired ? '만료일' : '남은 기간'}
                        </p>
                        <p className={`text-lg font-semibold ${
                          isExpired ? 'text-red-600' : 
                          daysLeft <= 7 ? 'text-orange-600' : 
                          'text-blue-600'
                        }`}>
                          {isExpired ? '만료됨' : `${daysLeft}일`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        시작: {startDate ? startDate.toLocaleDateString('ko-KR') : '알 수 없음'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        종료: {expiresAt.toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    
                    {!hasSlots && !isExpired && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700">
                          ⚠️ 남은 슬롯이 없습니다. 미사용 학생의 할당을 취소하거나 관리자에게 추가 구매를 요청하세요.
                        </p>
                      </div>
                    )}
                    
                    {isExpired && (
                      <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded">
                        <p className="text-xs text-gray-700">
                          ⏰ 구독이 만료되었습니다. 관리자에게 구독 연장을 요청하세요.
                        </p>
                      </div>
                    )}
                    
                    {!isExpired && hasSlots && daysLeft <= 7 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-700">
                          ⚠️ 구독 만료가 {daysLeft}일 남았습니다. 연장을 고려하세요.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 기존 할당 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            할당 목록
          </CardTitle>
          <CardDescription>현재 활성화된 AI 봇 할당</CardDescription>
        </CardHeader>
        <CardContent>
          {(assignments || []).length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">할당된 봇이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(assignments || []).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-semibold">
                        {assignment.botName}
                      </Badge>
                      <span className="text-sm text-gray-600">→</span>
                      <p className="font-semibold">{assignment.userName}</p>
                      <span className="text-sm text-gray-500">
                        ({assignment.userEmail})
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {assignment.duration}
                        {assignment.durationUnit === "day" ? "일" : "개월"}
                      </span>
                      <span>
                        시작: {assignment.startDate}
                      </span>
                      <span>
                        종료: {assignment.endDate}
                      </span>
                      <Badge
                        variant={
                          assignment.status === "active" ? "default" : "secondary"
                        }
                      >
                        {assignment.status === "active" ? "활성" : "만료"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevoke(assignment.id)}
                  >
                    취소
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
