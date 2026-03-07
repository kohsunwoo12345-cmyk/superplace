import { NextRequest, NextResponse } from 'next/server';
import { sendAlimtalk } from '@/lib/solapi';
import { getTemplate } from '@/lib/solapi';

export const dynamic = 'force-dynamic';

// POST: 알림톡 발송
export async function POST(request: NextRequest) {
  try {
    const { templateId, to, variables } = await request.json();

    if (!templateId || !to) {
      return NextResponse.json(
        { success: false, error: 'templateId and to are required' },
        { status: 400 }
      );
    }

    // 템플릿 조회 - 검수 완료 상태 확인
    const template = await getTemplate(templateId);
    
    if (template.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          success: false, 
          error: '검수 완료된 템플릿만 발송할 수 있습니다.',
          currentStatus: template.status 
        },
        { status: 400 }
      );
    }

    // 알림톡 발송 (템플릿 내용은 변경 불가, 변수만 치환)
    const result = await sendAlimtalk({
      templateId,
      to,
      variables: variables || {},
      buttons: template.buttons || [],
    });

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: '알림톡이 발송되었습니다.' 
    });
  } catch (error: any) {
    console.error('Failed to send alimtalk:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send alimtalk' 
      },
      { status: 500 }
    );
  }
}
