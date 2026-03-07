import { NextRequest, NextResponse } from 'next/server';
import { 
  getTemplates, 
  getTemplate, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  requestInspection,
  cancelInspection 
} from '@/lib/solapi';

export const dynamic = 'force-dynamic';

// GET: 템플릿 목록 조회 또는 단일 템플릿 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (templateId) {
      // 단일 템플릿 조회
      const template = await getTemplate(templateId);
      return NextResponse.json({ success: true, data: template });
    } else {
      // 목록 조회
      const params: any = {};
      
      const limit = searchParams.get('limit');
      const startKey = searchParams.get('startKey');
      const name = searchParams.get('name');
      const channelId = searchParams.get('channelId');
      const status = searchParams.get('status');
      const isHidden = searchParams.get('isHidden');

      if (limit) params.limit = parseInt(limit);
      if (startKey) params.startKey = startKey;
      if (name) params.name = name;
      if (channelId) params.channelId = channelId;
      if (status) params.status = status;
      if (isHidden) params.isHidden = isHidden === 'true';

      const templates = await getTemplates(params);
      return NextResponse.json({ success: true, data: templates });
    }
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch templates' 
      },
      { status: 500 }
    );
  }
}

// POST: 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = await createTemplate(body);
    return NextResponse.json({ 
      success: true, 
      data: template,
      message: '템플릿이 생성되었습니다.' 
    });
  } catch (error: any) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create template' 
      },
      { status: 500 }
    );
  }
}

// PUT: 템플릿 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, ...templateData } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      );
    }

    const template = await updateTemplate(templateId, templateData);
    return NextResponse.json({ 
      success: true, 
      data: template,
      message: '템플릿이 수정되었습니다.' 
    });
  } catch (error: any) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update template' 
      },
      { status: 500 }
    );
  }
}

// DELETE: 템플릿 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      );
    }

    await deleteTemplate(templateId);
    return NextResponse.json({ 
      success: true, 
      message: '템플릿이 삭제되었습니다.' 
    });
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete template' 
      },
      { status: 500 }
    );
  }
}
