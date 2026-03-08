"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Phone,
  Upload,
  FileSpreadsheet,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import * as XLSX from 'xlsx';

interface RecipientRow {
  parentPhone: string;
  studentId: string;
  studentName: string;
  landingPageUrl?: string;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  academyId?: string;
  academyName?: string;
}

const SMS_COST = 20; // 20 포인트/건

export default function MessageSendPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 메시지 설정
  const [senderNumber, setSenderNumber] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [senderNumbers, setSenderNumbers] = useState<string[]>([]);

  // 엑셀 업로드
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // 발신번호 목록 로드
        try {
          const sendersRes = await fetch("/api/sender-numbers/approved", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (sendersRes.ok) {
            const data = await sendersRes.json();
            setSenderNumbers(data.senderNumbers || []);
            if (data.senderNumbers?.length > 0) {
              setSenderNumber(data.senderNumbers[0]);
            }
          }
        } catch (error) {
          console.error("발신번호 로딩 실패:", error);
        }

        setLoading(false);
      } catch (error) {
        console.error("페이지 초기화 실패:", error);
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 엑셀 데이터:', jsonData);

      // 엑셀 데이터를 RecipientRow 형식으로 변환
      const parsedRecipients: RecipientRow[] = jsonData.map((row: any) => {
        // 전화번호 정규화: 숫자만 추출 후 010 형식으로 변환
        let phoneRaw = String(row['학부모연락처'] || row['연락처'] || row['전화번호'] || '').trim();
        
        // 숫자만 추출
        let phoneDigits = phoneRaw.replace(/[^0-9]/g, '');
        
        // 길이별 처리
        if (phoneDigits.length === 11) {
          // 11자리: 이미 완전한 번호 (010-XXXX-XXXX)
          // 그대로 사용
        } else if (phoneDigits.length === 10) {
          // 10자리: 
          // - 010으로 시작 → 그대로 (잘못된 번호지만 그대로 전달)
          // - 010으로 시작 안함 → 010 추가
          if (!phoneDigits.startsWith('010')) {
            phoneDigits = '010' + phoneDigits;
          }
        } else if (phoneDigits.length === 9) {
          // 9자리: 1XXXXXXXX → 0101XXXXXXXX
          phoneDigits = '010' + phoneDigits;
        } else if (phoneDigits.length === 8) {
          // 8자리: 지역번호 없는 경우 → 010 추가
          phoneDigits = '010' + phoneDigits;
        }
        
        // 하이픈 추가 (010-XXXX-XXXX 형식)
        let formattedPhone = '';
        if (phoneDigits.length === 11) {
          formattedPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7, 11)}`;
        } else if (phoneDigits.length === 10) {
          formattedPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
        } else {
          // 비정상적인 길이는 그대로
          formattedPhone = phoneDigits;
        }
        
        const recipient = {
          studentName: row['학생이름'] || row['이름'] || row['name'] || '',
          studentId: row['학생아이디'] || row['학생ID'] || row['studentId'] || '',
          parentPhone: formattedPhone,
        };
        console.log('📝 파싱된 행:', { 
          raw: row, 
          phoneRaw, 
          phoneDigits, 
          phoneLength: phoneDigits.length,
          formattedPhone,
          parsed: recipient 
        });
        return recipient;
      }).filter(r => {
        const valid = r.parentPhone && r.studentName;
        if (!valid) {
          console.warn('⚠️ 필터링된 행:', r, '(연락처 또는 이름 없음)');
        }
        return valid;
      });

      console.log('✅ 파싱된 수신자:', parsedRecipients);
      console.log('📊 수신자 수:', parsedRecipients.length);

      // 메시지에 {랜딩페이지URL} 변수가 있을 때만 랜딩페이지 조회
      const needsLandingPage = messageContent.includes('{랜딩페이지URL}');
      const token = localStorage.getItem('token');
      
      let enrichedRecipients = parsedRecipients;
      
      if (needsLandingPage) {
        console.log('🔍 랜딩페이지 URL 조회 시작...');
        enrichedRecipients = await Promise.all(
          parsedRecipients.map(async (recipient) => {
            if (recipient.studentId) {
              try {
                const res = await fetch(`/api/landing-pages/latest?studentId=${recipient.studentId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const data = await res.json();
                  recipient.landingPageUrl = data.url || '';
                }
              } catch (error) {
                console.error('랜딩페이지 조회 실패:', recipient.studentId, error);
              }
            }
            return recipient;
          })
        );
      } else {
        console.log('ℹ️ 랜딩페이지URL 변수 없음, 조회 생략');
      }

      setRecipients(enrichedRecipients);
      alert(`✅ ${enrichedRecipients.length}명의 수신자를 불러왔습니다.`);
    } catch (error) {
      console.error('엑셀 파싱 실패:', error);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 실제 학생 데이터 가져오기
      const response = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const students = data.students || [];
        
        if (students.length > 0) {
          // 실제 학생 데이터로 템플릿 생성 (학부모연락처는 빈 칸)
          const template = students.map((student: any) => ({
            '학생이름': student.name || '',
            '학생아이디': student.id || '',
            '학부모연락처': '', // 빈 칸으로 남김
          }));
          
          const worksheet = XLSX.utils.json_to_sheet(template);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
          XLSX.writeFile(workbook, '문자발송_템플릿.xlsx');
          
          alert(`✅ ${students.length}명의 학생 데이터로 템플릿이 생성되었습니다.`);
        } else {
          // 학생이 없으면 샘플 템플릿 제공
          const template = [
            { '학생이름': '홍길동', '학생아이디': 'student-001', '학부모연락처': '' },
            { '학생이름': '김철수', '학생아이디': 'student-002', '학부모연락처': '' },
          ];
          
          const worksheet = XLSX.utils.json_to_sheet(template);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
          XLSX.writeFile(workbook, '문자발송_템플릿.xlsx');
          
          alert('ℹ️ 등록된 학생이 없어 샘플 템플릿을 제공합니다.');
        }
      } else {
        throw new Error('학생 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
      
      // 오류 시 샘플 템플릿 제공
      const template = [
        { '학생이름': '홍길동', '학생아이디': 'student-001', '학부모연락처': '' },
        { '학생이름': '김철수', '학생아이디': 'student-002', '학부모연락처': '' },
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(template);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '수신자목록');
      XLSX.writeFile(workbook, '문자발송_템플릿.xlsx');
      
      alert('⚠️ 학생 데이터 로딩 실패. 샘플 템플릿을 제공합니다.');
    }
  };

  const replaceVariables = (message: string, recipient: RecipientRow): string => {
    return message
      .replace(/\{학생이름\}/g, recipient.studentName)
      .replace(/\{학생아이디\}/g, recipient.studentId)
      .replace(/\{랜딩페이지URL\}/g, recipient.landingPageUrl || '(랜딩페이지 없음)')
      .replace(/\{학원이름\}/g, user?.academyName || '학원')
      .replace(/\{학부모연락처\}/g, recipient.parentPhone);
  };

  const handleSend = async () => {
    console.log('🚀 발송 버튼 클릭됨!');
    console.log('📊 현재 상태:', {
      senderNumber,
      messageContent: messageContent.substring(0, 50) + '...',
      recipientsCount: recipients.length,
      recipients: recipients,
    });
    
    if (!senderNumber) {
      console.error('❌ 발신번호 없음');
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (!messageContent.trim()) {
      console.error('❌ 메시지 내용 없음');
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (recipients.length === 0) {
      console.error('❌ 수신자 없음:', recipients);
      alert("엑셀 파일을 업로드하여 수신자를 추가해주세요.");
      return;
    }

    console.log('✅ 발송 조건 충족, confirm 대화상자 표시');
    const confirmed = confirm(
      `총 ${recipients.length}명에게 SMS 발송\n` +
      `예상 비용: ${recipients.length * SMS_COST}P\n\n` +
      `발송하시겠습니까?`
    );
    
    console.log('📋 사용자 확인 결과:', confirmed ? '확인' : '취소');

    if (!confirmed) return;

    setSending(true);

    try {
      const token = localStorage.getItem("token");
      
      // 각 수신자에게 변수를 치환한 메시지 발송
      const messages = recipients.map(recipient => ({
        to: recipient.parentPhone,
        from: senderNumber,
        text: replaceVariables(messageContent, recipient),
        studentId: recipient.studentId,
        studentName: recipient.studentName,
      }));

      console.log('📤 발송할 메시지:', messages);
      console.log('📊 메시지 수:', messages.length);

      const response = await fetch("/api/messages/send-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
      });

      const result = await response.json();
      
      // 상세 응답 로깅
      console.log('📬 서버 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        result,
      });

      if (result.success) {
        let message = `✅ ${result.successCount}건 발송 완료!`;
        
        if (result.failCount > 0) {
          message += `\n❌ ${result.failCount}건 실패`;
          
          // 실패한 메시지 상세 정보 표시
          if (result.failedMessages && result.failedMessages.length > 0) {
            message += '\n\n실패 상세:';
            result.failedMessages.forEach((failed: any) => {
              message += `\n- ${failed.studentName} (${failed.to}): ${failed.error}`;
            });
          }
        }
        
        message += `\n\n차감된 포인트: ${result.pointsDeducted}P`;
        message += `\n남은 포인트: ${result.remainingPoints}P`;
        
        alert(message);
        
        if (result.successCount > 0) {
          setRecipients([]);
          setMessageContent("");
          setExcelFile(null);
        }
      } else {
        // 에러 상세 정보 표시
        const errorMsg = result.message || result.error || result.details || JSON.stringify(result);
        console.error('❌ 발송 실패:', result);
        alert(`발송 실패: ${errorMsg}`);
      }
    } catch (error) {
      console.error("발송 오류:", error);
      alert("발송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Phone className="w-8 h-8" />
          문자 발송
        </h1>
        <p className="text-gray-600 mt-2">
          학부모 DB를 엑셀로 업로드하여 변수 치환 메시지를 발송하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 발신 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>📤 발신 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 발신번호 선택 */}
            <div>
              <Label>발신번호</Label>
              {senderNumbers.length > 0 ? (
                <select
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg"
                >
                  {senderNumbers.map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>
              ) : (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    승인된 발신번호가 없습니다. 먼저 발신번호를 등록하고 승인받으세요.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* 메시지 작성 */}
            <div>
              <Label>메시지 내용</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="안녕하세요, {학생이름} 학부모님&#10;{학원이름}입니다.&#10;&#10;최신 랜딩페이지: {랜딩페이지URL}"
                rows={8}
                className="mt-1"
              />
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-semibold">사용 가능한 변수:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li><code>{"{학생이름}"}</code> - 엑셀의 학생이름</li>
                  <li><code>{"{학생아이디}"}</code> - 엑셀의 학생아이디</li>
                  <li><code>{"{랜딩페이지URL}"}</code> - 학생의 최신 랜딩페이지</li>
                  <li><code>{"{학원이름}"}</code> - 현재 학원 이름</li>
                  <li><code>{"{학부모연락처}"}</code> - 수신자 전화번호</li>
                </ul>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {messageContent.length}자 / {Math.ceil(messageContent.length / 90)}건
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 수신자 관리 */}
        <Card>
          <CardHeader>
            <CardTitle>📥 수신자 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 템플릿 다운로드 */}
            <div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                엑셀 템플릿 다운로드
              </Button>
            </div>

            {/* 엑셀 업로드 */}
            <div>
              <Label>엑셀 파일 업로드</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                필수 컬럼: 학부모연락처, 학생아이디, 학생이름
              </p>
            </div>

            {/* 업로드된 수신자 목록 */}
            {recipients.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>수신자 목록 ({recipients.length}명)</Label>
                  <Badge variant="outline">
                    예상 비용: {recipients.length * SMS_COST}P
                  </Badge>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{recipient.studentName}</p>
                        <p className="text-sm text-gray-600">{recipient.parentPhone}</p>
                        {recipient.landingPageUrl && (
                          <p className="text-xs text-blue-600 truncate">
                            📄 {recipient.landingPageUrl}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 발송 버튼 */}
      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSend}
              disabled={sending || !senderNumber || !messageContent || recipients.length === 0}
              className="w-full h-14 text-lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {recipients.length}명에게 문자 발송
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
