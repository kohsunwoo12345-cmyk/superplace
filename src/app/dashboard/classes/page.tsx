'use client';

export default function ClassesPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">수업 관리</h1>
          <p className="text-gray-600 mt-2">수업 스케줄을 관리하세요</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          + 수업 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>전체 과목</option>
            <option>수학</option>
            <option>영어</option>
            <option>과학</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>전체 상태</option>
            <option>진행중</option>
            <option>종료</option>
          </select>
        </div>
      </div>

      {/* 수업 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500">등록된 수업이 없습니다</p>
          <button className="mt-4 text-blue-600 hover:underline">
            첫 수업 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
