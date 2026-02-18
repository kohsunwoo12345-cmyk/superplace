import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    let query = 'SELECT * FROM store_products WHERE 1=1';

    if (activeOnly) {
      query += ' AND isActive = 1';
    }

    query += ' ORDER BY isFeatured DESC, displayOrder ASC, createdAt DESC';

    const result = await db.prepare(query).all();

    return NextResponse.json({
      products: result.results || [],
      count: result.results?.length || 0
    });
  } catch (error: any) {
    console.error('❌ Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products', 
        details: error.message,
        products: [] // Return empty array as fallback
      },
      { status: 500 }
    );
  }
}
