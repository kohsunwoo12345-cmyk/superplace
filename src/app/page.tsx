export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            SuperPlace
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            학원 관리를 위한 통합 솔루션
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              로그인
            </a>
            <a
              href="/register"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              회원가입
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">학생 관리</h3>
            <p className="text-gray-600">
              학생 정보, 출석, 성적을 한 곳에서 관리하세요
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold mb-2">선생님 관리</h3>
            <p className="text-gray-600">
              강사 배정, 수업 스케줄을 효율적으로 관리하세요
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI 챗봇</h3>
            <p className="text-gray-600">
              학생들과 AI 기반 대화로 학습을 지원합니다
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">통계 분석</h3>
            <p className="text-gray-600">
              학원 운영 현황을 실시간으로 분석합니다
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">수강료 관리</h3>
            <p className="text-gray-600">
              납부 내역과 수익을 투명하게 관리하세요
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">모바일 지원</h3>
            <p className="text-gray-600">
              언제 어디서나 모바일로 접근 가능합니다
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-lg font-semibold">
            ✅ SuperPlace - 학원 관리 시스템이 정상적으로 배포되었습니다!
          </div>
          <p className="mt-4 text-gray-600">
            지금 바로 시작하세요 🚀
          </p>
        </div>
      </div>
    </main>
  );
}
