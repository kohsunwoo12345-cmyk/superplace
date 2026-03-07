'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  email: string;
  classId?: string;
  className?: string;
  academyId?: string;
}

interface AttendanceRecord {
  id?: string;
  userId: string;
  userName: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  reason?: string;
}

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }

    // 오늘 날짜로 초기화
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (currentUser && selectedDate) {
      fetchStudents();
      fetchAttendanceRecords();
    }
  }, [currentUser, selectedDate]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('학생 목록 조회 실패:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/attendance/records?date=${selectedDate}&academyId=${currentUser.academyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.records || []);
      }
    } catch (error) {
      console.error('출석 기록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    userId: string,
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
    reason?: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/manual-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          date: selectedDate,
          status,
          reason,
          updatedBy: currentUser?.id || 'manual'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.record?.userName || ''}님의 출석 상태가 "${getStatusText(status)}"로 변경되었습니다`);
        fetchAttendanceRecords();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error('출석 처리 오류:', error);
      alert('출석 처리 중 오류가 발생했습니다');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '출석';
      case 'LATE': return '지각';
      case 'ABSENT': return '결석';
      case 'EXCUSED': return '예외';
      default: return '미처리';
    }
  };

  const getStudentStatus = (studentId: string): string => {
    const record = attendanceRecords.find(r => r.userId === studentId);
    return record?.status || 'NONE';
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
            <h1 className="text-3xl font-bold">출석 관리</h1>
            <p className="text-gray-600">학생들의 출석 상태를 수동으로 관리합니다</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/attendance')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="w-4 h-4" />
          출석 페이지
        </Button>
      </div>

      {/* 날짜 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            날짜 선택
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-4 py-2"
            />
            <Button onClick={fetchAttendanceRecords}>
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 학생 목록 및 출석 처리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            학생 목록 ({students.length}명)
          </CardTitle>
          <CardDescription>
            각 학생의 출석 상태를 클릭하여 변경할 수 있습니다 (출석 / 지각 / 결석)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              학생이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const currentStatus = getStudentStatus(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {student.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.email} {student.className && `· ${student.className}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(currentStatus)}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                          onClick={() => handleStatusUpdate(student.id, 'PRESENT')}
                          className={`text-sm px-4 py-2 ${
                            currentStatus === 'PRESENT' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'border-green-300 hover:bg-green-50 text-green-700'
                          }`}
                        >
                          ✅ 출석
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'LATE' ? 'default' : 'outline'}
                          onClick={() => handleStatusUpdate(student.id, 'LATE')}
                          className={`text-sm px-4 py-2 ${
                            currentStatus === 'LATE' 
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                              : 'border-yellow-300 hover:bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          ⏰ 지각
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'ABSENT' ? 'default' : 'outline'}
                          onClick={() => handleStatusUpdate(student.id, 'ABSENT')}
                          className={`text-sm px-4 py-2 ${
                            currentStatus === 'ABSENT' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'border-red-300 hover:bg-red-50 text-red-700'
                          }`}
                        >
                          ❌ 결석
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-blue-900">
            <p className="font-semibold">📌 출석 관리 안내</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>✅ 출석</strong>: 정상 출석 처리 (수업 시간 내 출석)</li>
              <li><strong>⏰ 지각</strong>: 수업 시작 시간 이후 출석</li>
              <li><strong>❌ 결석</strong>: 출석하지 않음</li>
            </ul>
            <p className="mt-4 text-blue-700 bg-blue-100 p-3 rounded">
              💡 <strong>자동 처리</strong>: 매일 밤 11시에 출석하지 않은 학생은 자동으로 결석 처리됩니다
            </p>
            <p className="mt-2 text-blue-700 bg-blue-100 p-3 rounded">
              ✏️ <strong>수정 가능</strong>: 학원장과 선생님은 언제든지 자동 출석 기록을 수정할 수 있습니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
