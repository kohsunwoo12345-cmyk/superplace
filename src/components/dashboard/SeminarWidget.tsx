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
      {seminars.map((seminar) => (
        <div
          key={seminar.id}
          className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/dashboard/seminars/detail?id=${seminar.id}`)}
        >
          <div className="flex gap-4">
            {/* 세미나 이미지 */}
            {seminar.mainImage && (
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={seminar.mainImage}
                  alt={seminar.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 세미나 정보 */}
            <div className="flex-1 p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                {seminar.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {seminar.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(seminar.date).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{seminar.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{seminar.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {seminar.currentParticipants}/{seminar.maxParticipants}명
                  </span>
                </div>
              </div>

              {/* 신청률 프로그레스 바 */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">신청 현황</span>
                  <span className="font-medium text-indigo-600">
                    {Math.round(
                      (seminar.currentParticipants / seminar.maxParticipants) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (seminar.currentParticipants / seminar.maxParticipants) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
