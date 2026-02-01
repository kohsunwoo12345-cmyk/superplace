export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">✅ 테스트 페이지</h1>
        <p className="text-gray-600 mb-6">이 페이지가 보이면 라우팅이 정상입니다!</p>
        <a href="/homework-check" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          숙제 제출 페이지로 이동 →
        </a>
      </div>
    </div>
  );
}
