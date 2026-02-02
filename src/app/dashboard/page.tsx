'use client';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">학원 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 학생</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">👨‍🎓</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">선생님</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">👨‍🏫</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">진행 중인 수업</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 달 수익</p>
              <p className="text-3xl font-bold text-gray-900">₩0</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근 등록 학생</h2>
          <div className="text-center py-8 text-gray-500">
            등록된 학생이 없습니다
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">오늘의 출석</h2>
          <div className="text-center py-8 text-gray-500">
            출석 기록이 없습니다
          </div>
        </div>
      </div>
    </div>
  );
}
