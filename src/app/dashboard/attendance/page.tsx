'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  grade: string | null;
}

interface Class {
  id: string;
  name: string;
  grade: string | null;
}

interface Attendance {
  id: string;
  userId: string;
  date: string;
  status: string;
  notes: string | null;
  user: {
    name: string;
    studentId: string | null;
  };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  presentRate: number;
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (!['DIRECTOR', 'TEACHER', 'SUPER_ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // 수업 목록 로드
  useEffect(() => {
    if (session) {
      loadClasses();
    }
  }, [session]);

  // 학생 및 출석 로드
  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
      loadAttendances();
      loadStats();
    }
  }, [selectedClassId, selectedDate]);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/academy/classes');
      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/classes/${selectedClassId}/students`);
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data.map((sc: any) => sc.student));
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendances = async () => {
    try {
      const res = await fetch(
        `/api/academy/attendance?classId=${selectedClassId}&date=${selectedDate}`
      );
      if (!res.ok) throw new Error('Failed to load attendances');
      const data = await res.json();
      setAttendances(data);
    } catch (error) {
      console.error('Error loading attendances:', error);
      setAttendances([]);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(
        `/api/academy/attendance/stats?classId=${selectedClassId}`
      );
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/academy/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentId,
          classId: selectedClassId,
          date: selectedDate,
          status,
        }),
      });
      if (!res.ok) throw new Error('Failed to mark attendance');
      await loadAttendances();
      await loadStats();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('출석 체크에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const attendance = attendances.find((a) => a.userId === studentId);
    return attendance?.status || null;
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ABSENT':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'LATE':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'EXCUSED':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return '출석';
      case 'ABSENT':
        return '결석';
      case 'LATE':
        return '지각';
      case 'EXCUSED':
        return '조퇴';
      default:
        return '미체크';
    }
  };

  if (loading && !classes.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">출석 관리</h1>
          <p className="text-gray-500 mt-1">학생들의 출석을 체크하고 관리합니다</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          엑셀 다운로드
        </Button>
      </div>

      {/* 통계 대시보드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 학생</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">출석</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">결석</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">지각</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">출석률</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.presentRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 수업 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 선택
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">수업을 선택하세요</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.grade && `(${cls.grade})`}
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              날짜 선택
            </label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => changeDate(-1)}
                variant="outline"
                className="px-3 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => changeDate(1)}
                variant="outline"
                className="px-3 py-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                variant="outline"
              >
                오늘
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 출석 체크 */}
      {selectedClassId && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">
            출석 체크 - {new Date(selectedDate).toLocaleDateString('ko-KR')}
          </h2>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>등록된 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const currentStatus = getAttendanceStatus(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          {student.studentId || student.email}
                          {student.grade && ` · ${student.grade}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentStatus && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${getStatusColor(currentStatus)}`}>
                          {getStatusIcon(currentStatus)}
                          <span className="text-sm font-medium">
                            {getStatusText(currentStatus)}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                          disabled={saving || currentStatus === 'PRESENT'}
                          variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                          className="px-3 py-1.5 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleMarkAttendance(student.id, 'LATE')}
                          disabled={saving || currentStatus === 'LATE'}
                          variant={currentStatus === 'LATE' ? 'default' : 'outline'}
                          className="px-3 py-1.5 text-sm"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleMarkAttendance(student.id, 'EXCUSED')}
                          disabled={saving || currentStatus === 'EXCUSED'}
                          variant={currentStatus === 'EXCUSED' ? 'default' : 'outline'}
                          className="px-3 py-1.5 text-sm"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                          disabled={saving || currentStatus === 'ABSENT'}
                          variant={currentStatus === 'ABSENT' ? 'default' : 'outline'}
                          className="px-3 py-1.5 text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
