"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              개인정보처리방침
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-8">
              주식회사 우리는 슈퍼플레이스다(이하 "회사"라 합니다)는 이용자의 개인정보를 중요시하며, 「개인정보보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다. 회사는 본 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 개인정보의 수집 항목 및 수집 방법</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">가. 수집하는 개인정보의 항목</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                회사는 회원가입, 원활한 고객상담, 서비스 제공(AI 리포트, 문자 발송 등)을 위해 아래와 같은 개인정보를 수집하고 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>[필수항목]</strong> 아이디, 비밀번호, 성명, 휴대전화번호, 이메일 주소, 학원명, 학원 주소</li>
                <li><strong>[유료 결제 시]</strong> 카드사명, 카드번호(일부), 은행계좌 정보, 사업자등록번호</li>
                <li><strong>[서비스 이용 과정]</strong> 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보, 결제 기록, 불량 이용 기록</li>
                <li><strong>[AI 서비스 이용 시]</strong> 회원이 입력하는 학습 데이터(학생 이름(식별 불가 처리 권장), 성적, 평가 내용 등)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">나. 수집방법</h3>
              <p className="text-gray-700 leading-relaxed">
                홈페이지(회원가입, 게시판, 결제창), 서면 양식, 전화/팩스, 생성형 AI 서비스 이용 과정
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 개인정보의 이용목적</h2>
              <p className="text-gray-700 leading-relaxed mb-3">회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>서비스 제공 및 계약 이행:</strong> AI 기반 콘텐츠(리포트, 랜딩페이지) 생성, 문자 메시지(SMS/LMS) 발송, 네이버 검색량 조회, 요금 결제 및 정산</li>
                <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량 회원의 부정 이용 방지, 가입 의사 확인, 민원 처리, 고지사항 전달</li>
                <li><strong>마케팅 및 광고 (동의 시):</strong> 신규 서비스(Gems) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 개인정보의 제3자 제공</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>이용자들이 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 개인정보 처리의 위탁 <span className="text-red-600">(중요 ⭐)</span></h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 서비스 향상 및 원활한 계약 이행을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다. (이 내용은 반드시 포함되어야 과태료를 피할 수 있습니다.)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">수탁업체</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">위탁 업무 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3">OpenAI, L.L.C., Google AI (미국)</td>
                      <td className="border border-gray-300 px-4 py-3">AI 기반 리포트 및 랜딩페이지 생성을 위한 데이터 처리</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3">(주)길컴퍼니 또는 알리고</td>
                      <td className="border border-gray-300 px-4 py-3">문자 메시지(SMS/LMS) 발송 시스템 운영</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3">Cloudflare / Vercel</td>
                      <td className="border border-gray-300 px-4 py-3">서비스 데이터 호스팅 및 보안 서버 운영</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 개인정보의 보유 및 이용기간</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                <li>웹사이트 방문 기록(로그): 3개월 (통신비밀보호법)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 개인정보의 파기절차 및 방법</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">가. 파기절차</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                이용자의 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">나. 파기방법</h3>
              <p className="text-gray-700 leading-relaxed">
                전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
              <p className="text-gray-700 leading-relaxed">
                이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지를 요청할 수 있습니다. 개인정보 조회/수정을 위해서는 '개인정보변경'(또는 '회원정보수정')을, 가입 해지를 위해서는 '회원탈퇴'를 클릭하여 본인 확인 절차를 거친 후 직접 열람, 정정 또는 탈퇴가 가능합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 개인정보 자동 수집 장치의 설치/운영 및 거부에 관한 사항</h2>
              <p className="text-gray-700 leading-relaxed">
                회사는 이용자에게 특화된 맞춤서비스를 제공하기 위해서 이용자들의 정보를 수시로 저장하고 찾아내는 '쿠키(cookie)' 등을 운용합니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 개인정보의 기술적/관리적 보호 대책</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                회사는 이용자의 개인정보를 처리함에 있어 분실, 도난, 유출, 변조 또는 훼손되지 않도록 다음과 같은 대책을 강구하고 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>암호화:</strong> 비밀번호와 중요 데이터는 암호화되어 저장 및 관리됩니다.</li>
                <li><strong>해킹 대비:</strong> 해킹이나 컴퓨터 바이러스 등에 의한 피해를 방지하기 위해 보안 프로그램을 설치하고 주기적인 갱신·점검을 하며, 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                <li><strong>취급 직원의 최소화:</strong> 개인정보를 처리하는 직원을 최소한으로 지정하고 담당자에 대한 수시 교육을 통해 본 정책의 준수를 강조하고 있습니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. 개인정보보호책임자 및 연락처</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 회원의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-800"><strong>개인정보보호책임자(CPO):</strong> 고희준 (대표)</p>
                <p className="text-gray-800"><strong>연락처:</strong> 01087399697</p>
                <p className="text-gray-800"><strong>이메일:</strong> <a href="mailto:wangholy1@naver.com" className="text-blue-600 hover:underline">wangholy1@naver.com</a></p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4 mb-3">
                기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>개인정보침해신고센터 (<a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy.kisa.or.kr</a> / 118)</li>
                <li>대검찰청 사이버수사과 (<a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.spo.go.kr</a> / 1301)</li>
                <li>경찰청 사이버수사국 (<a href="https://ecrm.police.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ecrm.police.go.kr</a> / 182)</li>
              </ul>
            </section>

            <section className="mt-12 pt-8 border-t bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">11. 고지의 의무</h3>
              <p className="text-gray-700 leading-relaxed">
                이 개인정보처리방침은 <strong className="text-blue-600">2026년 1월 23일</strong>부터 적용됩니다. 내용의 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일 전부터 홈페이지의 '공지사항'을 통해 고지할 것입니다.
              </p>
            </section>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-12 pt-8 border-t flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                홈으로
              </Button>
            </Link>
            <Link href="/terms">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                이용약관 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
