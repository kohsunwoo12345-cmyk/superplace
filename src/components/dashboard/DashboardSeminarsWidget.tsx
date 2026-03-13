"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Presentation, 
  Calendar, 
  Users, 
  ArrowRight
} from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  date: string;
  time: string;
  maxParticipants: number;
  currentParticipants: number;
}

export default function DashboardSeminarsWidget() {
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      const response = await fetch('/api/seminars');
      const data = await response.json();
      
      if (data.success) {
        // 최신 3개만 표시
        const latest = (data.seminars || [])
          .filter((s: Seminar) => new Date(s.date) >= new Date())
          .slice(0, 3);
        setSeminars(latest);
      }
    } catch (error) {
      console.error('Failed to load seminars:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const isFull = (seminar: Seminar) => {
    return seminar.currentParticipants >= seminar.maxParticipants;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-blue-600" />
          교육 세미나
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : seminars.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            진행 예정인 세미나가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {seminars.map((seminar) => (
              <div
                key={seminar.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/seminars/${seminar.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-1 flex-1">
                    {seminar.title}
                  </h4>
                  {isFull(seminar) ? (
                    <Badge variant="destructive" className="text-xs shrink-0">마감</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500 text-xs shrink-0">모집중</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(seminar.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{seminar.currentParticipants}/{seminar.maxParticipants}</span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      isFull(seminar) ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min((seminar.currentParticipants / seminar.maxParticipants) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => router.push('/dashboard/seminars')}
            >
              전체 세미나 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
