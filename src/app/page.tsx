export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          SuperPlace
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          학원 관리 시스템
        </p>
        <div className="space-y-4">
          <p className="text-gray-700">
            ✅ Cloudflare Pages 배포 성공!
          </p>
          <p className="text-sm text-gray-500">
            최소 시스템으로 배포되었습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
