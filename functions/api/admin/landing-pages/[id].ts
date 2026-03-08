// Cloudflare Pages Function - Landing Page Detail API
interface Env {
  DB: D1Database;
}

// 토큰 파싱 함수
function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  // 토큰 형식: id|email|role|academyId|timestamp (5개 부분)
  // 또는 구버전: id|email|role (3개 부분)
  if (parts.length !== 3 && parts.length !== 5) {
    console.warn('⚠️ 잘못된 토큰 형식:', parts.length, 'parts');
    return null;
  }

  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
  };
}

// User.id(TEXT) → INTEGER 해시 변환 함수
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// GET - 랜딩페이지 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Fetching landing page:', id);
    console.log('🔍 User info:', { userId: user.id, role: user.role, email: user.email });

    // 구 스키마 직접 조회
    const result = await DB.prepare(`SELECT * FROM landing_pages WHERE id = ?`).bind(id).first();

    console.log('📊 Query result:', result ? 'Found' : 'Not found');
    
    if (result) {
      console.log('📊 Page data:', {
        id: result.id,
        slug: result.slug,
        title: result.title,
        user_id: result.user_id,
        status: result.status
      });
    }

    if (!result) {
      console.error('❌ Landing page not found:', id);
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크 (DIRECTOR는 자신의 페이지만 조회 가능)
    if (user.role === 'DIRECTOR') {
      const userIdHash = hashStringToInt(user.id);
      if (result.user_id !== userIdHash) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 응답 데이터 (구 스키마 그대로)
    const landingPage = {
      id: result.id,
      slug: result.slug,
      title: result.title,
      subtitle: result.subtitle || '',
      template_type: result.template_type || 'basic',
      html_content: result.html_content || '',
      content_json: result.content_json || '{}',
      thumbnail_url: result.thumbnail_url || null,
      qr_code_url: result.qr_code_url || null,
      og_title: result.og_title || result.title,
      og_description: result.og_description || '',
      status: result.status || 'active',
      created_at: result.created_at,
      updated_at: result.updated_at,
      views: result.views || result.view_count || 0,
      user_id: result.user_id
    };

    console.log('📤 Sending landing page data, html_content length:', landingPage.html_content?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        landingPage: landingPage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Landing page fetch error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch landing page',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT - 랜딩페이지 수정
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 기존 페이지 조회
    const existingPage = await DB.prepare(`SELECT id, user_id FROM landing_pages WHERE id = ?`).bind(id).first();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크
    if (user.role === 'DIRECTOR') {
      const userIdHash = hashStringToInt(user.id);
      if (existingPage.user_id !== userIdHash) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 요청 본문 파싱
    const body = await context.request.json() as {
      title?: string;
      subtitle?: string;
      html_content?: string;
      og_title?: string;
      og_description?: string;
      status?: string;
      thumbnail_url?: string;
    };

    const { title, subtitle, html_content, og_title, og_description, status, thumbnail_url } = body;

    console.log('📝 Updating landing page:', id);
    console.log('📝 Request body:', JSON.stringify(body).substring(0, 500));

    // 업데이트 쿼리 생성
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // D1은 undefined를 허용하지 않으므로 명시적으로 체크
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return new Response(JSON.stringify({ error: 'Title cannot be empty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateFields.push('title = ?');
      updateValues.push(trimmedTitle);
    }

    if (subtitle !== undefined) {
      // subtitle 컬럼은 실제 DB에 없음 - 스킵
      console.log('⚠️ Skipping subtitle - column does not exist in DB');
    }

    if (html_content !== undefined) {
      // 실제 컬럼명: html_content (존재함!)
      updateFields.push('html_content = ?');
      updateValues.push(html_content || null);
    }

    if (og_title !== undefined) {
      // og_title 컬럼은 DB에 없음 - 스킵
      console.log('⚠️ Skipping og_title - column does not exist in DB');
    }

    if (og_description !== undefined) {
      // og_description 컬럼은 DB에 없음 - 스킵
      console.log('⚠️ Skipping og_description - column does not exist in DB');
    }

    if (status !== undefined) {
      // 실제 컬럼명: status (TEXT 타입! - 'active', 'draft' 등 문자열)
      updateFields.push('status = ?');
      updateValues.push(status || 'draft');
    }

    if (thumbnail_url !== undefined) {
      // thumbnail_url 컬럼은 DB에 없음 - 스킵
      console.log('⚠️ Skipping thumbnail_url - column does not exist in DB');
    }

    // updatedAt 컬럼이 실제 DB에 없을 수 있으므로 제거
    // updateFields.push("updatedAt = datetime('now')");

    // 업데이트할 필드가 없으면 에러
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ID 추가
    updateValues.push(id);

    const updateQuery = `UPDATE landing_pages SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('📝 Update query:', updateQuery);
    console.log('📝 Update values length:', updateValues.length);
    console.log('📝 Update fields:', updateFields);

    try {
      const result = await DB.prepare(updateQuery).bind(...updateValues).run();
      console.log('✅ Update result:', result);
    } catch (dbError: any) {
      console.error('❌ DB Update Error:', dbError);
      console.error('❌ Query:', updateQuery);
      console.error('❌ Values:', updateValues);
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    console.log('✅ Landing page updated:', id);

    // 업데이트된 페이지 조회
    const updatedPage = await DB.prepare(`SELECT * FROM landing_pages WHERE id = ?`).bind(id).first();

    if (!updatedPage) {
      throw new Error('Failed to retrieve updated page');
    }

    // 응답 데이터
    const landingPage = {
      id: updatedPage.id,
      slug: updatedPage.slug,
      title: updatedPage.title,
      subtitle: updatedPage.subtitle || '',
      template_type: updatedPage.template_type || 'basic',
      html_content: updatedPage.html_content || '',
      content_json: updatedPage.content_json || '{}',
      thumbnail_url: updatedPage.thumbnail_url || null,
      qr_code_url: updatedPage.qr_code_url || null,
      og_title: updatedPage.og_title || updatedPage.title,
      og_description: updatedPage.og_description || '',
      status: updatedPage.status || 'active',
      created_at: updatedPage.created_at,
      updated_at: updatedPage.updated_at,
      views: updatedPage.views || updatedPage.view_count || 0,
      user_id: updatedPage.user_id
    };

    return new Response(
      JSON.stringify({
        success: true,
        landingPage: landingPage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Landing page update error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: 'Failed to update landing page',
        details: error.message,
        stack: error.stack,
        errorName: error.name,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE - 랜딩페이지 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 기존 페이지 조회
    const existingPage = await DB.prepare(`SELECT id, user_id FROM landing_pages WHERE id = ?`).bind(id).first();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크
    if (user.role === 'DIRECTOR') {
      const userIdHash = hashStringToInt(user.id);
      if (existingPage.user_id !== userIdHash) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('🗑️ Deleting landing page:', id);

    await DB.prepare(`DELETE FROM landing_pages WHERE id = ?`).bind(id).run();

    console.log('✅ Landing page deleted:', id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Landing page deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Landing page delete error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete landing page',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
