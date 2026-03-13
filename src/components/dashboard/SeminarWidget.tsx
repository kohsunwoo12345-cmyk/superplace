"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  description: string;
  mainImage: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  locationType: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
}

export default function SeminarWidget() {
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/seminars?limit=3&status=upcoming", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeminars(data.seminars || []);
      }
    } catch (error) {
      console.error("Failed to fetch seminars:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (seminars.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">진행 예정인 세미나가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {seminars.map((seminar, index) => (
        <div
          key={seminar.id}
          className="relative border-2 border-indigo-100 rounded-xl overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-indigo-50"
          onClick={() => router.push(`/dashboard/seminars/detail?id=${seminar.id}`)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* NEW Badge - 신규 세미나 강조 */}
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              🎯 NEW
            </span>
          </div>

          <div className="flex gap-4">
            {/* 세미나 이미지 - 향상된 효과 */}
            {seminar.mainImage ? (
              <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden">
                <img
                  src={seminar.mainImage}
                  alt={seminar.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            ) : (
              <div className="w-40 h-40 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-white opacity-50" />
              </div>
            )}

            {/* 세미나 정보 - 향상된 레이아웃 */}
            <div className="flex-1 p-4 pr-20">
              <h3 className="font-bold text-xl mb-2 line-clamp-1 text-gray-900 group-hover:text-indigo-600 transition-colors">
                {seminar.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {seminar.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">{new Date(seminar.date).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">{seminar.time}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg col-span-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium line-clamp-1">{seminar.location}</span>
                </div>
              </div>

              {/* 신청률 프로그레스 바 - 향상된 디자인 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="font-semibold text-gray-700">신청 현황</span>
                  </div>
                  <span className="font-bold text-indigo-600">
                    {seminar.currentParticipants}/{seminar.maxParticipants}명 ({Math.round(
                      (seminar.currentParticipants / seminar.maxParticipants) * 100
                    )}%)
                  </span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-lg"
                    style={{
                      width: `${Math.min(
                        (seminar.currentParticipants / seminar.maxParticipants) * 100,
                        100
                      )}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Hover 상태 화살표 */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <span>자세히 보기</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
