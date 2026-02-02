'use client';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-2">학원 정보 및 시스템 설정</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 사이드바 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                학원 정보
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                계정 설정
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                구독 관리
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                알림 설정
              </button>
            </nav>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">학원 정보</h2>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학원명
                </label>
                <input
                  type="text"
                  placeholder="학원 이름을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주소
                </label>
                <input
                  type="text"
                  placeholder="학원 주소를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처
                </label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="academy@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학원 소개
                </label>
                <textarea
                  rows={4}
                  placeholder="학원 소개를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  저장하기
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
