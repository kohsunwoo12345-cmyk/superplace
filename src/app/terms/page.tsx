'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">이용약관</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관은 SuperPlace(이하 "회사"라 함)가 제공하는 학원 관리 시스템 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>"서비스"란 회사가 제공하는 학원 관리, 학생 관리, 출석 관리, 성적 관리 등의 온라인 플랫폼 서비스를 의미합니다.</li>
              <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
              <li>"회원"이란 회사와 서비스 이용계약을 체결하고 이용자 아이디(ID)를 부여받은 자를 의미합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (약관의 게시와 개정)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              ② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (서비스의 제공)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사가 제공하는 서비스는 다음과 같습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>학원 관리 서비스</li>
              <li>학생 정보 관리 서비스</li>
              <li>출석 관리 서비스</li>
              <li>성적 관리 서비스</li>
              <li>학습 자료 제공 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (회원가입)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              ② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (개인정보의 보호)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 이용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>회원은 관계 법령, 본 약관, 이용안내 및 서비스와 관련하여 공지한 주의사항 등을 준수해야 합니다.</li>
              <li>회원은 회사의 사전 승낙 없이 서비스를 이용하여 영업활동을 할 수 없습니다.</li>
              <li>회원은 서비스 이용과 관련하여 다음 각 호의 행위를 해서는 안 됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (서비스 이용의 제한 및 중지)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (책임제한)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제10조 (준거법 및 관할법원)</h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국의 법을 적용하며, 본 약관에 관한 소송은 민사소송법상의 관할법원에 제소합니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            <strong>시행일:</strong> 2024년 1월 1일
          </p>
          <div className="flex justify-center">
            <a 
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
