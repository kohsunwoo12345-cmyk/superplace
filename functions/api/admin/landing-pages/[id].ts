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
  
  if (parts.length !== 3) {
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
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
}

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

    // ID 파라미터 추출
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Fetching landing page:', id);

    // 랜딩페이지 조회 - 새 스키마와 구 스키마 모두 지원
    const query = `
      SELECT 
        id, slug, 
        title, 
        subtitle, 
        description, 
        COALESCE(templateType, template_type, 'basic') as templateType,
        COALESCE(templateHtml, html_content) as templateHtml,
        COALESCE(customFields, content_json) as customFields,
        COALESCE(thumbnailUrl, thumbnail_url) as thumbnailUrl,
        COALESCE(qrCodeUrl, qr_code_url) as qrCodeUrl,
        COALESCE(metaTitle, og_title, title) as metaTitle,
        COALESCE(metaDescription, og_description) as metaDescription,
        metaKeywords,
        COALESCE(views, view_count, 0) as views,
        COALESCE(submissions, 0) as submissions,
        COALESCE(isActive, CASE WHEN status = 'active' THEN 1 ELSE 0 END, 1) as isActive,
        COALESCE(createdById, CAST(user_id AS TEXT)) as createdById,
        COALESCE(createdAt, created_at) as createdAt,
        COALESCE(updatedAt, updated_at) as updatedAt
      FROM landing_pages
      WHERE id = ?
    `;

    const result = await DB.prepare(query).bind(id).first();

    if (!result) {
      console.error('❌ Landing page not found:', id);
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Found landing page:', result.slug);

    // 권한 체크 (DIRECTOR는 자신의 페이지만 조회 가능)
    if (user.role === 'DIRECTOR') {
      // 새 스키마와 구 스키마 모두 확인
      const userIdHash = hashStringToInt(user.id);
      const createdByMatches = result.createdById === user.id || 
                               String(result.createdById) === String(userIdHash);
      
      if (!createdByMatches) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 응답 데이터 매핑 (프론트엔드 호환성)
    const landingPage = {
      id: result.id,
      slug: result.slug,
      title: result.title,
      subtitle: result.subtitle,
      template_type: result.templateType,
      html_content: result.templateHtml, // templateHtml을 html_content로 매핑
      content_json: result.customFields, // customFields를 content_json으로 매핑
      thumbnail_url: result.thumbnailUrl,
      qr_code_url: result.qrCodeUrl,
      og_title: result.metaTitle,
      og_description: result.metaDescription,
      status: result.isActive === 1 ? 'active' : 'inactive',
      created_at: result.createdAt,
      updated_at: result.updatedAt,
      views: result.views
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

    // ID 파라미터 추출
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 기존 페이지 조회 - 두 스키마 모두 지원
    const existingPage = await DB.prepare(`
      SELECT 
        id, 
        COALESCE(createdById, CAST(user_id AS TEXT)) as createdById
      FROM landing_pages 
      WHERE id = ?
    `).bind(id).first();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크 (DIRECTOR는 자신의 페이지만 수정 가능)
    if (user.role === 'DIRECTOR') {
      const userIdHash = hashStringToInt(user.id);
      const createdByMatches = existingPage.createdById === user.id || 
                               String(existingPage.createdById) === String(userIdHash);
      
      if (!createdByMatches) {
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

    const {
      title,
      subtitle,
      html_content,
      og_title,
      og_description,
      status,
      thumbnail_url,
    } = body;

    // 필수 필드 체크
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Updating landing page:', id);

    // 업데이트 쿼리 생성 - 새/구 스키마 모두 업데이트
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title.trim());
    }

    if (subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      updateValues.push(subtitle?.trim() || null);
    }

    if (html_content) {
      // 새 스키마와 구 스키마 모두 업데이트 시도
      updateFields.push('templateHtml = ?'); 
      updateFields.push('html_content = ?'); // 구 스키마 호환
      updateValues.push(html_content);
      updateValues.push(html_content);
    }

    if (og_title) {
      updateFields.push('metaTitle = ?');
      updateFields.push('og_title = ?'); // 구 스키마 호환
      updateValues.push(og_title.trim());
      updateValues.push(og_title.trim());
    }

    if (og_description !== undefined) {
      updateFields.push('metaDescription = ?');
      updateFields.push('og_description = ?'); // 구 스키마 호환
      updateValues.push(og_description?.trim() || null);
      updateValues.push(og_description?.trim() || null);
    }

    if (status) {
      updateFields.push('isActive = ?');
      updateFields.push('status = ?'); // 구 스키마 호환
      const statusValue = status === 'active' ? 1 : 0;
      updateValues.push(statusValue);
      updateValues.push(status);
    }

    if (thumbnail_url !== undefined) {
      updateFields.push('thumbnailUrl = ?');
      updateFields.push('thumbnail_url = ?'); // 구 스키마 호환
      updateValues.push(thumbnail_url?.trim() || null);
      updateValues.push(thumbnail_url?.trim() || null);
    }

    // updatedAt/updated_at 모두 업데이트
    updateFields.push('updatedAt = datetime(\'now\')');
    updateFields.push('updated_at = datetime(\'now\')');

    // ID 추가
    updateValues.push(id);

    const updateQuery = `
      UPDATE landing_pages
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await DB.prepare(updateQuery).bind(...updateValues).run();

    console.log('✅ Landing page updated:', id);

    // 업데이트된 페이지 조회 - 두 스키마 모두 지원
    const updatedPage = await DB.prepare(`
      SELECT 
        id, slug, title, subtitle, description,
        COALESCE(templateType, template_type, 'basic') as templateType,
        COALESCE(templateHtml, html_content) as templateHtml,
        COALESCE(customFields, content_json) as customFields,
        COALESCE(thumbnailUrl, thumbnail_url) as thumbnailUrl,
        COALESCE(qrCodeUrl, qr_code_url) as qrCodeUrl,
        COALESCE(metaTitle, og_title, title) as metaTitle,
        COALESCE(metaDescription, og_description) as metaDescription,
        metaKeywords,
        COALESCE(views, view_count, 0) as views,
        COALESCE(submissions, 0) as submissions,
        COALESCE(isActive, CASE WHEN status = 'active' THEN 1 ELSE 0 END, 1) as isActive,
        COALESCE(createdById, CAST(user_id AS TEXT)) as createdById,
        COALESCE(createdAt, created_at) as createdAt,
        COALESCE(updatedAt, updated_at) as updatedAt
      FROM landing_pages
      WHERE id = ?
    `).bind(id).first();

    // 응답 데이터 매핑
    const responseData = updatedPage ? {
      id: updatedPage.id,
      slug: updatedPage.slug,
      title: updatedPage.title,
      subtitle: updatedPage.subtitle,
      template_type: updatedPage.templateType,
      html_content: updatedPage.templateHtml,
      content_json: updatedPage.customFields,
      thumbnail_url: updatedPage.thumbnailUrl,
      qr_code_url: updatedPage.qrCodeUrl,
      og_title: updatedPage.metaTitle,
      og_description: updatedPage.metaDescription,
      status: updatedPage.isActive === 1 ? 'active' : 'inactive',
      created_at: updatedPage.createdAt,
      updated_at: updatedPage.updatedAt,
      views: updatedPage.views
    } : null;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Landing page updated successfully',
        landingPage: responseData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Landing page update error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update landing page',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

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

    // ID 파라미터 추출
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 기존 페이지 조회 - 두 스키마 모두 지원
    const existingPage = await DB.prepare(`
      SELECT 
        id,
        COALESCE(createdById, CAST(user_id AS TEXT)) as createdById
      FROM landing_pages 
      WHERE id = ?
    `).bind(id).first();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 권한 체크 (DIRECTOR는 자신의 페이지만 삭제 가능)
    if (user.role === 'DIRECTOR') {
      const userIdHash = hashStringToInt(user.id);
      const createdByMatches = existingPage.createdById === user.id || 
                               String(existingPage.createdById) === String(userIdHash);
      
      if (!createdByMatches) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 페이지 삭제
    await DB.prepare('DELETE FROM landing_pages WHERE id = ?').bind(id).run();

    console.log('🗑️ Landing page deleted:', id);

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
