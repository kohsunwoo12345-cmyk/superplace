import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function TermsPage() {
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
            이용약관
          </h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                본 약관은 슈퍼플레이스(이하 "회사")가 제공하는 학습 관리 시스템 서비스(이하 "서비스")의 이용조건 및 절차, 
                회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제2조 (정의)</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>"서비스"</strong>란 회사가 제공하는 학습 관리, AI 봇, 콘텐츠 관리 등의 모든 기능을 의미합니다.
                </li>
                <li>
                  <strong>"회원"</strong>이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 의미합니다.
                </li>
                <li>
                  <strong>"학원"</strong>이란 학원장이 생성한 학습 관리 조직 단위를 의미합니다.
                </li>
                <li>
                  <strong>"학원장"</strong>이란 학원을 생성하고 관리하는 권한을 가진 회원을 의미합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                <li>약관이 변경되는 경우 회사는 변경사항을 시행일자 7일 전부터 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제4조 (회원가입)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회원가입은 이용자가 본 약관에 동의하고 회사가 정한 가입 양식에 따라 필요한 정보를 기입함으로써 이루어집니다.</li>
                <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>타인의 명의를 도용한 경우</li>
                    <li>허위 정보를 기재한 경우</li>
                    <li>관련 법령 위반 또는 사회 질서와 미풍양속에 반하는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제5조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>학습 관리 및 콘텐츠 제공</li>
                    <li>AI 기반 학습 지원</li>
                    <li>출석 및 성적 관리</li>
                    <li>학원 운영 관리 도구</li>
                    <li>기타 회사가 추가 개발하는 서비스</li>
                  </ul>
                </li>
                <li>회사는 서비스의 내용을 변경할 수 있으며, 중요한 변경사항은 사전에 공지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제6조 (서비스 이용요금)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회사는 기본적으로 서비스를 무료로 제공하나, 일부 프리미엄 기능은 유료로 제공될 수 있습니다.</li>
                <li>유료 서비스의 이용요금은 서비스 화면에 명시됩니다.</li>
                <li>회원은 이용요금을 정해진 기간 내에 납부해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제7조 (회원의 의무)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회원은 다음 행위를 해서는 안 됩니다:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>허위 정보 기재</li>
                    <li>타인의 정보 도용</li>
                    <li>회사의 저작권 등 지적재산권 침해</li>
                    <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
                    <li>서비스의 정상적인 운영을 방해하는 행위</li>
                  </ul>
                </li>
                <li>회원은 관련 법령과 본 약관을 준수해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제8조 (회사의 의무)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회사는 관련 법령과 본 약관이 정하는 권리의 행사 및 의무의 이행을 신의에 따라 성실하게 합니다.</li>
                <li>회사는 회원의 개인정보를 보호하기 위해 노력합니다.</li>
                <li>회사는 서비스의 안정적 제공을 위해 최선을 다합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제9조 (회원 탈퇴 및 자격 상실)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회원은 언제든지 탈퇴를 요청할 수 있습니다.</li>
                <li>회사는 회원이 본 약관을 위반한 경우 서비스 이용을 제한하거나 회원 자격을 박탈할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제10조 (면책조항)</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>회사는 천재지변, 불가항력 등으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                <li>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</li>
                <li>회사는 회원 간 또는 회원과 제3자 간 발생한 분쟁에 대해 책임지지 않습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">제11조 (준거법 및 재판관할)</h2>
              <p className="text-gray-700 leading-relaxed">
                본 약관과 관련된 분쟁은 대한민국 법을 준거법으로 하며, 
                관할 법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-gray-500 mb-4">
              시행일: 2024년 1월 1일
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
