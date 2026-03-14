interface Env {
  SMS_DOCUMENTS: R2Bucket;
}

// POST: 이미지를 R2에 업로드
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const { SMS_DOCUMENTS } = env;

    if (!SMS_DOCUMENTS) {
      return new Response(JSON.stringify({ 
        error: "R2 bucket not configured" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📤 Image upload API called");

    // multipart/form-data 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ 
        error: "No file provided" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📁 File info:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 파일 크기 체크 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ 
        error: "File too large",
        message: `파일 크기가 너무 큽니다. 최대 ${MAX_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`,
        currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 파일 확장자 확인
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: "Invalid file type",
        message: "이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WebP)",
        fileType: file.type
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `store-products/${timestamp}-${randomStr}.${extension}`;

    console.log("💾 Uploading to R2:", fileName);

    // R2에 업로드
    const arrayBuffer = await file.arrayBuffer();
    await SMS_DOCUMENTS.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    console.log("✅ Upload successful");

    // 공개 URL 생성 (Cloudflare R2 public URL)
    // 형식: https://pub-ACCOUNT_ID.r2.dev/BUCKET_NAME/FILE_PATH
    // 또는 커스텀 도메인 사용
    const publicUrl = `https://superplacestudy.pages.dev/api/r2-image/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Image upload error:", error);
    return new Response(JSON.stringify({
      error: "Failed to upload image",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
