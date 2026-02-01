'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  UserCog,
  ArrowRightLeft,
  Users,
  GraduationCap,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

interface ActiveSwitch {
  isActive: boolean;
  data?: {
    switchId: string;
    originalRole: string;
    targetUser: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
    };
    expiresAt: string;
    switchedAt: string;
  };
}

export default function AccountSwitchButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSwitch, setActiveSwitch] = useState<ActiveSwitch | null>(null);
  const [checkingSwitch, setCheckingSwitch] = useState(true);

  const userRole = session?.user?.role;

  // 계정 전환 권한 체크
  const canSwitch = userRole === 'DIRECTOR' || userRole === 'TEACHER';

  // 현재 활성화된 계정 전환 확인
  useEffect(() => {
    if (status === 'authenticated' && canSwitch) {
      checkActiveSwitch();
    } else {
      setCheckingSwitch(false);
    }
  }, [status, canSwitch]);

  // 검색 필터
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const checkActiveSwitch = async () => {
    try {
      setCheckingSwitch(true);
      const res = await fetch('/api/account-switch', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setActiveSwitch(data);
      }
    } catch (error) {
      console.error('계정 전환 확인 오류:', error);
    } finally {
      setCheckingSwitch(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint =
        userRole === 'DIRECTOR'
          ? '/api/director/users'
          : '/api/teacher/students';

      const res = await fetch(endpoint, {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '사용자 목록을 불러올 수 없습니다.');
      }

      const data = await res.json();
      const userList = data.users || data.students || [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error: any) {
      console.error('사용자 목록 조회 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (targetUserId: string) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const res = await fetch('/api/account-switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '계정 전환에 실패했습니다.');
      }

      setMessage(`${data.data.targetUser.name} 계정으로 전환되었습니다.`);
      
      // 전환 완료 후 페이지 새로고침
      setTimeout(() => {
        setOpen(false);
        router.refresh();
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error: any) {
      console.error('계정 전환 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBack = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/account-switch', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '계정 복귀에 실패했습니다.');
      }

      setMessage('원래 계정으로 복귀했습니다.');
      
      // 복귀 완료 후 페이지 새로고침
      setTimeout(() => {
        router.refresh();
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error: any) {
      console.error('계정 복귀 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      DIRECTOR: {
        text: '학원장',
        color: 'bg-blue-100 text-blue-800',
        icon: Users,
      },
      TEACHER: {
        text: '선생님',
        color: 'bg-green-100 text-green-800',
        icon: UserCog,
      },
      STUDENT: {
        text: '학생',
        color: 'bg-purple-100 text-purple-800',
        icon: GraduationCap,
      },
    };
    return badges[role] || badges.STUDENT;
  };

  if (!canSwitch || checkingSwitch) {
    return null;
  }

  // 활성화된 전환이 있으면 복귀 버튼 표시
  if (activeSwitch?.isActive && activeSwitch.data) {
    const targetUser = activeSwitch.data.targetUser;
    const badge = getRoleBadge(targetUser.role);
    const Icon = badge.icon;

    return (
      <div className="flex items-center gap-2">
        <Alert className="flex items-center gap-2 py-2 px-3">
          <Icon className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{targetUser.name}</span>
            <Badge variant="secondary" className="text-xs">
              {badge.text}
            </Badge>
            계정으로 전환됨
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchBack}
          disabled={loading}
          className="whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-1" />
              원래 계정으로
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(true);
            fetchUsers();
          }}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          계정 전환
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            계정 전환
          </DialogTitle>
          <DialogDescription>
            {userRole === 'DIRECTOR'
              ? '선생님 또는 학생 계정으로 전환할 수 있습니다.'
              : '학생 계정으로 전환할 수 있습니다.'}
          </DialogDescription>
        </DialogHeader>

        {/* 메시지 */}
        {message && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* 에러 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 사용자 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? '검색 결과가 없습니다.' : '전환 가능한 계정이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredUsers.map((user) => {
              const badge = getRoleBadge(user.role);
              const Icon = badge.icon;

              return (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSwitchAccount(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Badge className={badge.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {badge.text}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
