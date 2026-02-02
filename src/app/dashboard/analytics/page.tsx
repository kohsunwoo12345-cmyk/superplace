'use client';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">통계 분석</h1>
        <p className="text-gray-600 mt-2">학원 운영 데이터를 분석하세요</p>
      </div>

      {/* 기간 선택 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">이번 주</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            이번 달
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            이번 년도
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-2">총 수익</p>
          <p className="text-3xl font-bold text-blue-600">₩0</p>
          <p className="text-xs text-gray-500 mt-2">전주 대비 +0%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-2">신규 학생</p>
          <p className="text-3xl font-bold text-green-600">0명</p>
          <p className="text-xs text-gray-500 mt-2">전주 대비 +0%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-2">평균 출석률</p>
          <p className="text-3xl font-bold text-purple-600">0%</p>
          <p className="text-xs text-gray-500 mt-2">전주 대비 +0%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-2">만족도</p>
          <p className="text-3xl font-bold text-orange-600">0점</p>
          <p className="text-xs text-gray-500 mt-2">전주 대비 +0점</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">월별 수익 추이</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
            <p className="text-gray-400">차트 영역 (API 연동 후 활성화)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">학생 수 변화</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
            <p className="text-gray-400">차트 영역 (API 연동 후 활성화)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">과목별 인기도</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
            <p className="text-gray-400">차트 영역 (API 연동 후 활성화)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">출석 현황</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
            <p className="text-gray-400">차트 영역 (API 연동 후 활성화)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
