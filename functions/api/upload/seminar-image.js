// Seminar Image Upload API - R2 Storage
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Check R2 bucket
    const bucket = env.SMS_DOCUMENTS || env.SENDER_NUMBER_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'R2 bucket not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const parts = token.split('|');
    if (parts.length < 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = parts[2]?.toUpperCase();
    
    // Only SUPER_ADMIN can upload seminar images
    if (role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File size exceeds 10MB limit'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `seminars/${timestamp}-${randomStr}.${ext}`;

    console.log(`📤 Uploading seminar image: ${filename} (${file.size} bytes)`);

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    console.log(`✅ Successfully uploaded: ${filename}`);

    // Generate public URL (assuming custom domain or R2.dev domain)
    // For Cloudflare Pages, you'll need to configure R2 public access or use a custom domain
    const publicUrl = `https://pub-5c8cea82b5ac42fcb002e7e3c3e4acf0.r2.dev/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      filename: filename,
      url: publicUrl,
      size: file.size,
      type: file.type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error uploading seminar image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
