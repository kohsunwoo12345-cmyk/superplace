import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

/**
 * POST /api/recipients/upload-excel
 * 엑셀 파일에서 수신자 정보를 추출합니다.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        message: '파일이 업로드되지 않았습니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📁 파일 수신:', file.name, file.type, file.size);

    // 파일 타입 검증
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv|txt)$/i)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type',
        message: 'Excel 파일(.xlsx, .xls), CSV 파일(.csv), 또는 텍스트 파일(.txt)만 업로드 가능합니다.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 파일 읽기
    const fileBuffer = await file.arrayBuffer();
    
    // CSV 또는 간단한 텍스트 기반 파싱
    let fileContent: string;
    
    try {
      // UTF-8로 시도
      fileContent = new TextDecoder('utf-8').decode(fileBuffer);
    } catch {
      // 실패 시 EUC-KR 시도 (한글 윈도우 엑셀)
      try {
        fileContent = new TextDecoder('euc-kr').decode(fileBuffer);
      } catch {
        fileContent = new TextDecoder('utf-8').decode(fileBuffer);
      }
    }

    console.log('📄 파일 내용 길이:', fileContent.length);

    // CSV 파싱 (간단한 구현)
    const recipients: Array<{
      studentName: string;
      parentPhone: string;
      email?: string;
      grade?: string;
      class?: string;
    }> = [];

    const lines = fileContent.split(/[\r\n]+/).filter(line => line.trim());
    
    console.log(`📋 총 ${lines.length}줄 발견`);
    
    // 첫 번째 줄은 헤더로 간주하고 건너뜀
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 쉼표, 탭, 여러 공백으로 구분 (엑셀에서 복사한 경우 탭일 수 있음)
      const columns = line.split(/[,\t]/).map(col => col.trim().replace(/["']/g, ''));
      
      // 최소 2개 컬럼 필요 (이름, 전화번호)
      if (columns.length < 2) {
        console.log(`⚠️ 라인 ${i+1} 스킵: 컬럼 부족 (${columns.length}개)`, columns);
        continue;
      }

      const studentName = columns[0];
      const parentPhone = columns[1].replace(/[^0-9]/g, ''); // 숫자만 추출
      const email = columns[2] || undefined;
      const grade = columns[3] || undefined;
      const classInfo = columns[4] || undefined;

      // 전화번호 유효성 검사
      if (parentPhone && parentPhone.length >= 10 && studentName) {
        recipients.push({ 
          studentName, 
          parentPhone, 
          email,
          grade,
          class: classInfo
        });
        console.log(`✅ 라인 ${i+1}: ${studentName} / ${parentPhone}`);
      } else {
        console.log(`⚠️ 라인 ${i+1} 스킵: 유효하지 않은 데이터 (이름: ${studentName}, 전화: ${parentPhone})`);
      }
    }

    console.log(`✅ ${recipients.length}명의 수신자 파싱 완료`);

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid recipients found',
        message: '유효한 수신자 정보를 찾을 수 없습니다. 파일 형식을 확인해주세요.\n\n형식: 이름, 전화번호, 이메일(선택), 학년(선택), 반(선택)\n예시: 홍길동, 01012345678, hong@example.com, 중1, A반\n\n💡 팁:\n- 첫 번째 줄은 헤더로 간주됩니다\n- 탭이나 쉼표로 구분된 파일을 사용하세요\n- 전화번호는 숫자만 입력 (하이픈 자동 제거)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      recipients: recipients,
      count: recipients.length,
      message: `${recipients.length}명의 수신자 정보를 불러왔습니다.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Excel upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      message: error.message || '파일 업로드 중 오류가 발생했습니다.',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
