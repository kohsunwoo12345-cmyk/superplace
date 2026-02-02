"use client";

import { useState, useEffect } from "react";
import { X, Search, UserPlus, Calendar, CheckCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  academy?: {
    id: string;
    name: string;
  };
}

interface BotAssignModalProps {
  bot: {
    id: string;
    botId: string;
    name: string;
    nameEn: string;
    icon: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function BotAssignModal({ bot, onClose, onSuccess }: BotAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [directors, setDirectors] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  useEffect(() => {
    fetchDirectors();
  }, []);

  const fetchDirectors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/directors", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("학원장 목록을 불러올 수 없습니다");
      }

      const data = await response.json();
      setDirectors(data.directors || []);
    } catch (error) {
      console.error("학원장 조회 오류:", error);
      alert("학원장 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      alert("학원장을 선택해주세요");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/assign-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUserId,
          botId: bot.botId,
          duration,
          durationUnit,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "봇 할당에 실패했습니다");
      }

      alert("AI 봇이 성공적으로 할당되었습니다!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("봇 할당 오류:", error);
      alert(error instanceof Error ? error.message : "봇 할당 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const filteredDirectors = directors.filter(
    (director) =>
      director.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      director.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      director.academy?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{bot.icon}</div>
            <div>
              <h2 className="text-2xl font-bold">{bot.name} 할당</h2>
              <p className="text-sm text-gray-600">{bot.nameEn}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium mb-2">학원장 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 이메일, 학원명으로 검색"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 기간 설정 */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar size={16} />
              사용 기간
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min="1"
                className="px-3 py-2 border rounded-lg"
                placeholder="숫자 입력"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="days">일</option>
                <option value="weeks">주</option>
                <option value="months">개월</option>
                <option value="years">년</option>
              </select>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              만료일: {new Date(Date.now() + duration * (
                durationUnit === "days" ? 86400000 :
                durationUnit === "weeks" ? 604800000 :
                durationUnit === "months" ? 2592000000 :
                31536000000
              )).toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* 학원장 목록 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              할당 대상 학원장 ({filteredDirectors.length}명)
            </label>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">로딩 중...</p>
              </div>
            ) : filteredDirectors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "검색 결과가 없습니다" : "등록된 학원장이 없습니다"}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                {filteredDirectors.map((director) => (
                  <label
                    key={director.id}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                      selectedUserId === director.id
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <input
                      type="radio"
                      name="director"
                      value={director.id}
                      checked={selectedUserId === director.id}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{director.name}</div>
                      <div className="text-sm text-gray-600">{director.email}</div>
                      {director.academy && (
                        <div className="text-xs text-blue-600 mt-1">
                          🏫 {director.academy.name}
                        </div>
                      )}
                    </div>
                    {selectedUserId === director.id && (
                      <CheckCircle className="text-blue-500" size={24} />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              {loading ? "할당 중..." : "할당하기"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
