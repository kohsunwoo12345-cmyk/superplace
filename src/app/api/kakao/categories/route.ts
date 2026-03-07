import { NextResponse } from 'next/server';
import { getTemplateCategories } from '@/lib/solapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getTemplateCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Failed to fetch template categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch template categories' 
      },
      { status: 500 }
    );
  }
}
