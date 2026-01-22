import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            개인정보처리방침
          </h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <p className="text-gray-700 leading-relaxed mb-6">
                슈퍼플레이스(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 
                개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 
                관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">1. 수집하는 개인정보의 항목</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">가. 회원가입 시</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>필수항목: 이메일, 비밀번호, 이름, 역할(학원장/선생님/학생)</li>
                    <li>선택항목: 전화번호</li>
                    <li>학원장: 학원명</li>
                    <li>선생님/학생: 학원 코드</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">나. 서비스 이용 시</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>서비스 이용기록, 접속 로그, IP 주소</li>
                    <li>학습 활동 기록, 출석 정보, 성적 정보</li>
                    <li>AI 봇 대화 기록</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">2. 개인정보의 수집 및 이용목적</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">가. 회원 관리</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>회원제 서비스 제공, 개인 식별, 회원자격 유지·관리</li>
                    <li>서비스 부정이용 방지, 비인가 사용 방지</li>
                    <li>가입의사 확인, 연령 확인, 불만처리 등 민원처리</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">나. 서비스 제공</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>학습 관리 및 콘텐츠 제공</li>
                    <li>AI 기반 학습 지원 서비스 제공</li>
                    <li>출석, 성적 관리 서비스 제공</li>
                    <li>맞춤형 서비스 제공</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">다. 서비스 개선</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>신규 서비스 개발 및 기존 서비스 개선</li>
                    <li>서비스 이용 통계 분석</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">3. 개인정보의 보유 및 이용기간</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  회사는 회원가입일로부터 서비스를 제공하는 기간 동안 이용자의 개인정보를 보유 및 이용합니다.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>회원 탈퇴 시:</strong> 지체없이 파기합니다. 
                    단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 일정기간 보존합니다.
                  </li>
                  <li>
                    <strong>법령에 따른 보존:</strong>
                    <ul className="list-circle pl-6 mt-2 space-y-1">
                      <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                      <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                      <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                      <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">4. 개인정보의 제3자 제공</h2>
              <p className="text-gray-700 leading-relaxed">
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
                다만, 다음의 경우는 예외로 합니다:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">5. 개인정보의 파기절차 및 방법</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">가. 파기절차</h3>
                  <p>
                    회원이 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 
                    내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">나. 파기방법</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                    <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">6. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
                <li>이용자는 언제든지 개인정보 제공에 대한 동의철회/회원가입해지를 요청할 수 있습니다.</li>
                <li>
                  이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 
                  정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">7. 개인정보 보호를 위한 기술적·관리적 대책</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">가. 기술적 대책</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>개인정보는 비밀번호에 의해 보호되며, 파일 및 전송 데이터를 암호화합니다.</li>
                    <li>백신 프로그램을 이용하여 컴퓨터 바이러스에 의한 피해를 방지합니다.</li>
                    <li>해킹 등 외부 침입에 대비하여 보안시스템을 운영합니다.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">나. 관리적 대책</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>개인정보 관련 취급 직원을 최소화하고 교육을 실시합니다.</li>
                    <li>개인정보를 취급하는 직원에 대한 수시 교육을 통하여 개인정보처리방침의 준수를 강조합니다.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">8. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 
                  이용자의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
                </p>
                <div>
                  <h3 className="font-semibold mb-2">가. 쿠키의 사용 목적</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>로그인 상태 유지</li>
                    <li>맞춤형 서비스 제공</li>
                    <li>서비스 이용 통계 분석</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">나. 쿠키 설정 거부 방법</h3>
                  <p>
                    웹브라우저 상단의 도구 → 인터넷 옵션 → 개인정보 메뉴에서 쿠키 설정을 거부할 수 있습니다. 
                    단, 쿠키 설정을 거부하는 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">9. 개인정보 보호책임자</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
                  개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>개인정보 보호책임자</strong></p>
                  <ul className="list-none space-y-1 pl-4">
                    <li>• 이메일: privacy@superplace.com</li>
                    <li>• 문의: 서비스 내 문의하기 기능 이용</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">10. 개인정보처리방침의 변경</h2>
              <p className="text-gray-700 leading-relaxed">
                본 개인정보처리방침은 시행일로부터 적용되며, 
                법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
                변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">11. 정보주체의 권익침해에 대한 구제방법</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                  <li>대검찰청 사이버범죄수사단: (국번없이) 1301 (cybercid.spo.go.kr)</li>
                  <li>경찰청 사이버안전국: (국번없이) 182 (cyberbureau.police.go.kr)</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-gray-500 mb-4">
              공고일자: 2024년 1월 1일<br />
              시행일자: 2024년 1월 1일
            </p>
            <Link 
              href="/auth/signup" 
              className="text-blue-600 hover:underline font-medium"
            >
              회원가입으로 돌아가기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
