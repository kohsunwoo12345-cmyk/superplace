"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  grade?: string;
  studentCode?: string;
  points: number;
  approved: boolean;
  academy?: {
    id: string;
    name: string;
    code: string;
  } | null;
  aiChatEnabled: boolean;
  aiHomeworkEnabled: boolean;
  aiStudyEnabled: boolean;
  createdAt: Date | string;
  lastLoginAt?: Date | string | null;
}

interface ApiResponse {
  success: boolean;
  users: User[];
  meta?: {
    total: number;
    sources: {
      neon: number;
      d1: number;
    };
    stats: {
      SUPER_ADMIN: number;
      DIRECTOR: number;
      TEACHER: number;
      STUDENT: number;
    };
    d1Error?: string | null;
    processingTime: number;
  };
  error?: string;
  details?: any;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    console.log("🚀 컴포넌트 마운트 - 사용자 목록 로드 시작");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📡 API 호출: /api/public/all-users");
      const response = await fetch("/api/public/all-users");
      
      console.log("📥 응답 상태:", response.status);
      const data: ApiResponse = await response.json();
      
      console.log("📦 응답 데이터:", data);

      if (data.success && data.users) {
        setUsers(data.users);
        setMeta(data.meta || null);
        console.log(`✅ 사용자 ${data.users.length}명 로드 완료`);
      } else {
        const errorMsg = data.error || "알 수 없는 오류가 발생했습니다.";
        setError(errorMsg);
        console.error("❌ API 오류:", data);
      }
    } catch (err: any) {
      const errorMsg = `네트워크 오류: ${err.message}`;
      setError(errorMsg);
      console.error("❌ 네트워크 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링
  const filteredUsers = users.filter((user) => {
    // 역할 필터
    if (roleFilter !== "ALL" && user.role !== roleFilter) {
      return false;
    }

    // 검색어 필터
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.academy?.name?.toLowerCase().includes(search) ||
        user.studentCode?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // 역할 한글 변환
  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "시스템 관리자",
      DIRECTOR: "학원장",
      TEACHER: "선생님",
      STUDENT: "학생",
    };
    return roleMap[role] || role;
  };

  // 역할 색상
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      SUPER_ADMIN: "bg-red-100 text-red-800",
      DIRECTOR: "bg-purple-100 text-purple-800",
      TEACHER: "bg-blue-100 text-blue-800",
      STUDENT: "bg-green-100 text-green-800",
    };
    return colorMap[role] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            👥 사용자 관리
          </h1>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">사용자 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            👥 사용자 관리
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-red-800 mb-4">
              ⚠️ 오류 발생
            </h2>
            <p className="text-red-700 text-lg mb-6">{error}</p>
            <button
              onClick={fetchUsers}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              🔄 다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 사용자 관리
          </h1>
          <p className="text-gray-600">
            전체 사용자 목록을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        {meta && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">전체 사용자</div>
              <div className="text-3xl font-bold text-gray-900">{meta.total}</div>
              <div className="text-xs text-gray-500 mt-2">
                Neon: {meta.sources.neon} / D1: {meta.sources.d1}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg shadow p-6">
              <div className="text-sm text-purple-600 mb-1">학원장</div>
              <div className="text-3xl font-bold text-purple-900">
                {meta.stats.DIRECTOR}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="text-sm text-blue-600 mb-1">선생님</div>
              <div className="text-3xl font-bold text-blue-900">
                {meta.stats.TEACHER}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="text-sm text-green-600 mb-1">학생</div>
              <div className="text-3xl font-bold text-green-900">
                {meta.stats.STUDENT}
              </div>
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 검색
              </label>
              <input
                type="text"
                placeholder="이름, 이메일, 학원명, 학생코드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 역할 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 역할
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">전체</option>
                <option value="SUPER_ADMIN">시스템 관리자</option>
                <option value="DIRECTOR">학원장</option>
                <option value="TEACHER">선생님</option>
                <option value="STUDENT">학생</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {filteredUsers.length}명의 사용자가 검색되었습니다.
          </div>
        </div>

        {/* 사용자 목록 */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              다른 검색어나 필터를 시도해보세요.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학원
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            {user.studentCode && (
                              <div className="text-xs text-blue-600 mt-1">
                                코드: {user.studentCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.academy?.name || "-"}
                        </div>
                        {user.academy?.code && (
                          <div className="text-xs text-gray-500">
                            {user.academy.code}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.grade && (
                            <div className="mb-1">📚 {user.grade}</div>
                          )}
                          <div className="text-blue-600">💎 {user.points}점</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {user.approved ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              ✅ 승인됨
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              ⏳ 승인 대기
                            </span>
                          )}
                          {user.aiChatEnabled && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              🤖 AI 채팅
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 메타 정보 */}
        {meta && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>처리 시간:</strong> {meta.processingTime}ms
              </div>
              <div>
                <strong>타임스탬프:</strong> {meta.timestamp}
              </div>
              {meta.d1Error && (
                <div className="col-span-2 text-yellow-700">
                  <strong>D1 경고:</strong> {meta.d1Error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
