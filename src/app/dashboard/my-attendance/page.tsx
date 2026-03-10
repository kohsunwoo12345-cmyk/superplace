'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  CreditCard,
  Copy,
  Check,
  QrCode,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  reason?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export default function MyAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myCode, setMyCode] = useState<string>('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // 현재 월로 초기화 (YYYY-MM 형식)
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(month);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyCode();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id && selectedMonth) {
      fetchMyAttendance();
    }
  }, [currentUser, selectedMonth]);

  const fetchMyCode = async () => {
    setCodeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/attendance-code?userId=${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyCode(data.code);
      } else {
        console.error('코드 조회 실패');
      }
    } catch (error) {
      console.error('코드 조회 오류:', error);
    } finally {
      setCodeLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/attendance/my-records?userId=${currentUser.id}&month=${selectedMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.records || []);
        calculateStats(data.records || []);
      }
    } catch (error) {
      console.error('출석 기록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: AttendanceRecord[]) => {
    const totalDays = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const excusedCount = records.filter(r => r.status === 'EXCUSED').length;
    const attendanceRate = totalDays > 0 
      ? Math.round(((presentCount + lateCount) / totalDays) * 100) 
      : 0;

    setStats({
      totalDays,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      attendanceRate
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      alert('코드 복사에 실패했습니다');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />출석</Badge>;
      case 'LATE':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />지각</Badge>;
      case 'ABSENT':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />결석</Badge>;
      case 'EXCUSED':
        return <Badge className="bg-blue-500"><AlertTriangle className="w-3 h-3 mr-1" />예외</Badge>;
      default:
        return <Badge variant="outline">미처리</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold">내 출석</h1>
            <p className="text-gray-600">나의 출석 코드와 출석 기록을 확인합니다</p>
          </div>
        </div>
      </div>

      {/* 내 출석 코드 카드 */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="bg-blue-100/50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CreditCard className="w-6 h-6" />
            내 출석 코드
          </CardTitle>
          <CardDescription className="text-blue-700">
            이 코드는 나만의 고유한 출석 코드입니다. 출석 시 이 코드를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {codeLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">코드 조회 중...</p>
            </div>
          ) : myCode ? (
            <div className="space-y-4">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-blue-200">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">{currentUser?.name}</p>
                  <p className="text-sm text-gray-600">{currentUser?.email}</p>
                </div>
              </div>

              {/* 코드 표시 */}
              <div className="relative">
                <div className="flex items-center justify-center p-8 bg-white rounded-xl border-4 border-blue-300 shadow-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">나의 출석 코드</p>
                    <div className="text-6xl font-mono font-bold text-blue-600 tracking-wider">
                      {myCode.split('').map((digit, index) => (
                        <span key={index} className="inline-block mx-1">
                          {digit}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      ⚠️ 이 코드를 다른 사람에게 알려주지 마세요
                    </p>
                  </div>
                </div>

                {/* 복사 버튼 */}
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-blue-300 hover:bg-blue-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>코드 복사</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  📱 <strong>출석하는 방법:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-sm text-blue-800 ml-2">
                  <li>학원에 도착하면 출석 페이지로 이동하세요</li>
                  <li>위의 6자리 코드를 입력하세요</li>
                  <li>출석이 자동으로 기록됩니다!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              코드를 불러올 수 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 출석 통계 */}
      {stats && (
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Calendar className="w-6 h-6" />
              출석 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays}일</p>
                <p className="text-sm text-gray-600">전체</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.presentCount}일</p>
                <p className="text-sm text-gray-600">출석</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}일</p>
                <p className="text-sm text-gray-600">지각</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.absentCount}일</p>
                <p className="text-sm text-gray-600">결석</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
                <p className="text-sm text-gray-600">출석률</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            기간 선택
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-4 py-2"
            />
            <Button onClick={fetchMyAttendance}>
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 출석 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            출석 기록
          </CardTitle>
          <CardDescription>
            선택한 기간의 출석 기록입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              출석 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="font-medium">{formatDate(record.date)}</p>
                      {record.checkInTime && (
                        <p className="text-xs text-gray-500">
                          {formatTime(record.checkInTime)}
                        </p>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                  {record.reason && (
                    <p className="text-sm text-gray-600 italic">
                      사유: {record.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-yellow-900">
            <p className="font-semibold">📌 출석 코드 안내</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>코드 보안</strong>: 출석 코드는 본인만 볼 수 있으며, 다른 사람에게 공유하지 마세요</li>
              <li><strong>출석 시간</strong>: 정해진 수업 시간 내에 출석해야 '출석' 처리됩니다</li>
              <li><strong>지각 처리</strong>: 수업 시작 시간 이후 출석 시 '지각'으로 기록됩니다</li>
              <li><strong>문의사항</strong>: 출석 기록이 잘못되었다면 선생님께 문의하세요</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
