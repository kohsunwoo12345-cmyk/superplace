import { NextRequest, NextResponse } from 'next/server';
import { requestInspection, cancelInspection } from '@/lib/solapi';

export const dynamic = 'force-dynamic';

// POST: 검수 요청
export async function POST(request: NextRequest) {
  try {
    const { templateId, action } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      );
    }

    if (action === 'request') {
      // 검수 요청
      const result = await requestInspection(templateId);
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: '검수 요청이 완료되었습니다.' 
      });
    } else if (action === 'cancel') {
      // 검수 취소
      const result = await cancelInspection(templateId);
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: '검수가 취소되었습니다.' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "request" or "cancel"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Failed to process inspection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process inspection' 
      },
      { status: 500 }
    );
  }
}
