import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// Token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    name: parts[3] || ''
  };
}

/**
 * GET /api/store/reviews?productId=xxx
 * 제품 리뷰 목록 조회
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!productId) {
      return new Response(JSON.stringify({ 
        error: 'productId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get reviews
    const { results: reviews } = await env.DB.prepare(`
      SELECT * FROM ProductReviews 
      WHERE productId = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `).bind(productId, limit, offset).all();

    // Get total count
    const { results: countResults } = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM ProductReviews WHERE productId = ?
    `).bind(productId).all();
    const total = (countResults[0] as any)?.total || 0;

    // Get rating summary
    const { results: ratingResults } = await env.DB.prepare(`
      SELECT 
        AVG(rating) as avgRating,
        COUNT(*) as totalReviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star1
      FROM ProductReviews 
      WHERE productId = ?
    `).bind(productId).all();
    const ratingSummary = ratingResults[0] || {};

    // Check if user has reviewed (if userId provided)
    let userReview = null;
    if (userId) {
      const { results: userReviewResults } = await env.DB.prepare(`
        SELECT * FROM ProductReviews WHERE productId = ? AND userId = ?
      `).bind(productId, userId).all();
      userReview = userReviewResults[0] || null;
    }

    return new Response(JSON.stringify({
      success: true,
      reviews,
      total,
      ratingSummary,
      userReview,
      pagination: {
        limit,
        offset,
        hasMore: offset + reviews.length < total
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch reviews:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch reviews',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * POST /api/store/reviews
 * 리뷰 작성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      productId,
      productName,
      rating,
      title,
      content,
      images = ''
    } = body;

    if (!productId || !rating || !content) {
      return new Response(JSON.stringify({ 
        error: 'productId, rating, and content are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ 
        error: 'rating must be between 1 and 5' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already reviewed this product
    const { results: existing } = await env.DB.prepare(`
      SELECT id FROM ProductReviews WHERE productId = ? AND userId = ?
    `).bind(productId, tokenData.id).all();

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'You have already reviewed this product' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if verified purchase (has bought the product)
    const { results: purchases } = await env.DB.prepare(`
      SELECT id FROM BotPurchaseRequests 
      WHERE userId = ? AND botId = ? AND status = 'approved'
    `).bind(tokenData.id, productId).all();
    const isVerifiedPurchase = purchases.length > 0 ? 1 : 0;

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO ProductReviews (
        id, productId, productName, userId, userName, userEmail,
        rating, title, content, images, isVerifiedPurchase,
        helpfulCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      reviewId, productId, productName, tokenData.id, 
      tokenData.name, tokenData.email, rating, title || '', 
      content, images, isVerifiedPurchase, now, now
    ).run();

    console.log('✅ Review created:', reviewId);

    return new Response(JSON.stringify({
      success: true,
      reviewId,
      isVerifiedPurchase: isVerifiedPurchase === 1
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create review:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create review',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/store/reviews?id=xxx
 * 리뷰 삭제
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const reviewId = url.searchParams.get('id');

    if (!reviewId) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check ownership or admin
    const { results: reviews } = await env.DB.prepare(`
      SELECT userId FROM ProductReviews WHERE id = ?
    `).bind(reviewId).all();

    if (reviews.length === 0) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const review = reviews[0] as any;
    if (review.userId !== tokenData.id && 
        tokenData.role !== 'SUPER_ADMIN' && 
        tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        error: 'You can only delete your own reviews' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete review
    await env.DB.prepare(`DELETE FROM ProductReviews WHERE id = ?`).bind(reviewId).run();
    
    // Delete helpful records
    await env.DB.prepare(`DELETE FROM ReviewHelpful WHERE reviewId = ?`).bind(reviewId).run();

    console.log('✅ Review deleted:', reviewId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to delete review:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete review',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
