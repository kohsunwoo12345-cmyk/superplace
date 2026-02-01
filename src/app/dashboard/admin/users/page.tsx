"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  approved: boolean;
  academyId: string | null;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  phone?: string;
  grade?: string;
  studentId?: string;
  parentPhone?: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // 즉시 사용자 목록 로드 (인증 체크 제거)
    console.log("🔥 EMERGENCY MODE: Loading users without auth check");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users...");
      const response = await fetch("/api/admin/users");
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        setUsers(data.users || []);
        console.log("Users loaded:", data.users?.length);
      } else {
        const errorMsg = `에러 ${response.status}: ${data.error || data.message || '알 수 없는 오류'}`;
        setError(errorMsg);
        console.error("API Error:", data);
      }
    } catch (error: any) {
      const errorMsg = `네트워크 오류: ${error.message}`;
      setError(errorMsg);
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "approved" && user.approved) ||
      (filter === "pending" && !user.approved) ||
      (filter === user.role);

    const matchesSearch = 
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "최고 관리자",
      DIRECTOR: "학원장",
      TEACHER: "선생님",
      STUDENT: "학생",
    };
    return roleMap[role] || role;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">사용자 관리</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">사용자 관리</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <button
          onClick={fetchUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 새로고침
        </button>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm">전체 사용자</p>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm">승인된 사용자</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.approved).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm">승인 대기</p>
          <p className="text-2xl font-bold text-yellow-600">
            {users.filter(u => !u.approved).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm">학생</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === "STUDENT").length}
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded ${
                filter === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              승인됨
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              대기중
            </button>
            <button
              onClick={() => setFilter("STUDENT")}
              className={`px-4 py-2 rounded ${
                filter === "STUDENT"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              학생
            </button>
            <button
              onClick={() => setFilter("TEACHER")}
              className={`px-4 py-2 rounded ${
                filter === "TEACHER"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              선생님
            </button>
          </div>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI 기능
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  포인트
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 로그인
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      )}
                      {user.studentId && (
                        <div className="text-xs text-blue-600">학번: {user.studentId}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {user.approved ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                        ✓ 승인됨
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                        ⏳ 승인 대기
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {user.aiChatEnabled && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded" title="AI 채팅">
                          💬
                        </span>
                      )}
                      {user.aiHomeworkEnabled && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded" title="AI 숙제">
                          📝
                        </span>
                      )}
                      {user.aiStudyEnabled && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded" title="AI 학습">
                          📚
                        </span>
                      )}
                      {!user.aiChatEnabled && !user.aiHomeworkEnabled && !user.aiStudyEnabled && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-gray-900">{user.points}P</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(user.lastLoginAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              <p>등록된 사용자가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 결과 요약 */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {users.length}명 중 {filteredUsers.length}명 표시
        </div>
      )}
    </div>
  );
}
