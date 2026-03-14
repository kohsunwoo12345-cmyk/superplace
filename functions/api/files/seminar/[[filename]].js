// Serve seminar images from R2 bucket
export async function onRequestGet(context) {
  try {
    const { request, env, params } = context;
    const filename = params.filename;

    if (!filename || filename.length === 0) {
      return new Response('Filename is required', { status: 400 });
    }

    // Join array filename parts if nested path
    const fullPath = Array.isArray(filename) ? filename.join('/') : filename[0] || filename;
    const objectKey = `seminars/${fullPath}`;

    console.log(`📥 Fetching seminar image: ${objectKey}`);

    const bucket = env.SMS_DOCUMENTS || env.SENDER_NUMBER_BUCKET;
    if (!bucket) {
      console.error('❌ R2 bucket not configured');
      return new Response('Storage not configured', { status: 500 });
    }

    const object = await bucket.get(objectKey);

    if (!object) {
      console.log(`❌ Object not found: ${objectKey}`);
      return new Response('File not found', { status: 404 });
    }

    console.log(`✅ Serving image: ${objectKey} (${object.size} bytes)`);

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    headers.set('Content-Length', object.size.toString());

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ Error serving seminar image:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
