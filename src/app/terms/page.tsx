"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            서비스 이용약관
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 1 장 총 칙</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 1 조 (목적)</h3>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 주식회사 우리는 슈퍼플레이스다(이하 "회사"라 합니다)가 제공하는 학원 관리 플랫폼, AI 마케팅 자동화 솔루션, 문자 발송 서비스 및 기타 제반 서비스(이하 "서비스"라 합니다)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 2 조 (용어의 정의)</h3>
              <p className="text-gray-700 leading-relaxed mb-3">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>"서비스"라 함은 구현되는 단말기(PC, 휴대형 단말기 등)와 상관없이 회원이 이용할 수 있는 '슈퍼플레이스 아카데미' 및 관련 제반 서비스를 의미합니다.</li>
                <li>"회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객(학원장 및 학원 관계자)을 말합니다.</li>
                <li>"아이디(ID)"라 함은 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자와 숫자의 조합을 의미합니다.</li>
                <li>"비밀번호"라 함은 회원이 부여받은 ID와 일치된 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 의미합니다.</li>
                <li>"포인트"라 함은 서비스 내에서 문자 메시지(SMS/LMS) 발송 등을 이용하기 위해 회원이 유상으로 충전하거나 회사가 무상으로 지급하는 가상의 결제 수단을 의미합니다.</li>
                <li>"AI 결과물"이라 함은 회원이 입력한 데이터를 기반으로 인공지능(OpenAI 등) 알고리즘을 통해 생성된 리포트, 랜딩페이지, 텍스트 등을 의미합니다.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 3 조 (약관의 효력 및 변경)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 회사는 필요하다고 인정되는 경우 「약관의 규제에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ③ 회사가 약관을 변경할 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 전부터 공지합니다. 단, 회원에게 불리한 변경의 경우에는 30일 전부터 공지하고, 이메일이나 문자 등으로 개별 통지합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ④ 회원이 변경된 약관에 동의하지 않을 경우 이용계약을 해지(회원탈퇴)할 수 있으며, 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관의 변경사항에 동의한 것으로 간주합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 2 장 이용계약의 체결</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">제 4 조 (이용계약의 성립)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 약관의 내용에 대하여 동의를 한 다음 회원가입 신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ② 가입신청자는 만 14세 이상이어야 하며, 만 14세 미만 아동의 회원가입은 제한됩니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 5 조 (이용신청의 승낙과 제한)</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                ① 회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                <li>부정한 용도(스팸 문자 발송, 해킹 등)로 서비스를 이용하고자 하는 경우</li>
                <li>회원의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 3 장 계약 당사자의 의무</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">제 6 조 (회사의 의무)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회사는 관련 법령과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다하여 노력합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보호를 위해 보안 시스템을 갖추어야 하며 개인정보처리방침을 공시하고 준수합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ③ 회사는 AI 서비스 및 외부 API(네이버 등)의 기술적 한계나 오류가 발생할 경우, 이를 시정하거나 회원에게 고지하기 위해 노력합니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 7 조 (회원의 의무)</h3>
              <p className="text-gray-700 leading-relaxed mb-3">① 회원은 다음 행위를 하여서는 안 됩니다.</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>신청 또는 변경 시 허위내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경 또는 서비스 내 데이터(템플릿 등)의 무단 크롤링 및 복제</li>
                <li>회사의 동의 없이 영리 목적으로 서비스를 사용하는 행위 (단, 학원 운영 목적의 정상적 이용은 제외)</li>
                <li>정보통신망법을 위반하여 수신자의 동의 없는 광고성 정보(스팸 문자)를 전송하는 행위</li>
                <li>기타 불법적이거나 부당한 행위</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 4 장 서비스의 이용</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">제 8 조 (서비스의 제공 및 변경)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ② 회사는 AI 알고리즘 업데이트, 외부 제휴사(OpenAI, 네이버, 통신사)의 정책 변경, 기술적 필요에 따라 서비스의 내용을 변경하거나 중단할 수 있습니다. 이 경우 회사는 사전에 공지하며, 회사의 고의 또는 중과실이 없는 한 이로 인한 회원의 손해에 대해 책임지지 않습니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 9 조 (AI 서비스 이용 및 면책 특약) [중요]</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회사가 제공하는 AI 기반 서비스(랜딩페이지 생성, 학생 리포트 등)는 확률적 생성 모델을 기반으로 하므로, 결과물의 완전한 정확성, 적법성, 무결성을 보장하지 않습니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 회원은 AI가 생성한 결과물을 학부모 상담, 마케팅 등에 활용하기 전에 반드시 내용을 검수하여야 하며, 검수하지 않고 활용하여 발생한 문제(학습 정보 오류, 저작권 침해 등)에 대한 책임은 회원 본인에게 있습니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ③ 회사는 AI 서비스 이용 결과로 인한 회원의 영업 손실, 기대 수익 상실 등에 대하여 배상 책임을 지지 않습니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 10 조 (문자 발송 서비스 이용 및 스팸 방지) [중요]</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회원은 문자 메시지 발송 시 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 및 KISA의 스팸방지 가이드라인을 준수하여야 합니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 수신자의 사전 동의 없는 광고성 정보 전송으로 인해 발생하는 민·형사상 책임 및 과태료는 전적으로 회원이 부담하며, 회사는 이에 대해 면책됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ③ 회사는 회원이 불법 스팸을 전송하는 것으로 의심되거나 관계 기관의 요청이 있는 경우, 즉시 서비스 이용을 정지하고 잔여 포인트의 환불을 거부할 수 있습니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 11 조 (권리의 귀속 및 저작권)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 서비스에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 회원이 서비스를 이용하여 생성한 콘텐츠(랜딩페이지 등)의 저작권은 회원에게 있으나, 회사는 서비스 품질 개선, AI 모델 학습, 통계 작성 등을 위하여 회원의 데이터를 개인을 식별할 수 없는 익명화된 형태로 가공하여 영구적으로 사용(복제, 수정, 전송 등)할 수 있습니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ③ 회원은 회사가 제공하는 템플릿, 디자인 소스 등을 회사의 사전 허락 없이 외부로 유출하거나 재판매할 수 없습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 5 장 이용요금 및 환불</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">제 12 조 (유료 서비스 및 환불 규정)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회사가 제공하는 유료 서비스는 '정기 구독형'과 '포인트 충전형'으로 구분됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 디지털 콘텐츠(AI 리포트, 랜딩페이지 템플릿 등)의 경우: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 콘텐츠를 열람하거나 사용한(AI 생성 등) 경우 청약철회(환불)가 제한됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ③ 문자 발송 포인트의 경우: 회원은 충전 후 사용하지 않은 잔여 포인트에 대해 환불을 요청할 수 있습니다. 단, 이 경우 결제 수수료 및 위약금(잔액의 10% 또는 최소 1,000원)을 공제한 금액을 환불합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ④ 회원이 관계 법령 및 약관을 위반하여 이용이 정지된 경우, 잔여 이용기간 및 포인트에 대한 환불은 이루어지지 않습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제 6 장 손해배상 및 기타사항</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">제 13 조 (손해배상)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회사가 고의 또는 중과실로 회원에게 손해를 끼친 경우, 그 손해를 배상할 책임이 있습니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ② 회원은 이 약관을 위반하거나 불법행위로 인하여 회사에 손해를 끼친 경우, 그 손해를 배상하여야 합니다. (스팸 발송으로 인한 통신사 과태료 구상권 청구 등 포함)
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 14 조 (면책조항)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 회사는 천재지변, 디도스(DDoS) 공격, IDC 장애, 기간통신사업자의 회선 장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                ② 회사는 회원이 입력한 정보(학생 성적, 개인정보 등)의 부정확성으로 인해 발생하는 손해에 대하여 책임을 지지 않습니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ③ 회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">제 15 조 (재판권 및 준거법)</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                ① 서비스 이용과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는 회사의 본점 소재지를 관할하는 법원을 관할법원으로 합니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                ② 이 약관의 해석 및 분쟁의 해결에는 대한민국 법률을 적용합니다.
              </p>
            </section>

            <section className="mt-12 pt-8 border-t">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">부 칙</h3>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 2026년 1월 23일부터 시행합니다.
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
            <Link href="/privacy">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                개인정보처리방침 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
