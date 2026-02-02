'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
        
        <div className="space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed mb-4">
              SuperPlace(이하 "회사"라 함)는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (개인정보의 처리 목적)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지</li>
              <li><strong>서비스 제공:</strong> 학원 관리, 학생 정보 관리, 출석 관리, 성적 관리, 학습 자료 제공</li>
              <li><strong>마케팅 및 광고:</strong> 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (개인정보의 처리 및 보유 기간)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지</li>
              <li><strong>결제 정보:</strong> 전자상거래법에 따라 5년</li>
              <li><strong>접속 로그:</strong> 통신비밀보호법에 따라 3개월</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (처리하는 개인정보의 항목)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 다음의 개인정보 항목을 처리하고 있습니다.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. 회원가입</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>필수항목: 이름, 이메일, 비밀번호, 학원명</li>
                  <li>선택항목: 전화번호, 주소</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. 서비스 이용</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>자동수집: IP주소, 쿠키, 서비스 이용 기록, 접속 로그</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (개인정보처리의 위탁)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>현재 개인정보 처리 위탁 업체 없음</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (개인정보의 파기)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              ② 개인정보 파기의 절차 및 방법은 다음과 같습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
              <li><strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (개인정보 보호책임자)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>개인정보 보호책임자</strong></p>
              <p className="text-gray-700">이메일: privacy@superplace.com</p>
              <p className="text-gray-700">전화: 010-8739-9697</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (개인정보 처리방침 변경)</h2>
            <p className="text-gray-700 leading-relaxed">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
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
