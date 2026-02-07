export default function PaymentRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">결제 신청</h1>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-600 text-center">
            결제 신청 기능은 <a href="/pricing" className="text-blue-600 underline">요금제 페이지</a>에서 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
