import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        naverBlog: {
          include: {
            posts: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 모든 블로그의 포스트를 평탄화
    const allPosts = user.naverBlog.flatMap(blog => blog.posts);

    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "포스트 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { title, content, naverBlogId } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        naverBlog: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 사용자의 첫 번째 네이버 블로그를 사용하거나 naverBlogId 사용
    let blogId = naverBlogId;
    if (!blogId && user.naverBlog.length > 0) {
      blogId = user.naverBlog[0].id;
    }

    if (!blogId) {
      return NextResponse.json(
        { error: "연결된 네이버 블로그가 없습니다" },
        { status: 400 }
      );
    }

    // BlogPost 생성 (실제 API 연동 시 네이버 API 호출 필요)
    const post = await prisma.blogPost.create({
      data: {
        naverBlogId: blogId,
        postId: `temp_${Date.now()}`, // 실제로는 네이버 API에서 받은 postId
        title,
        content,
        url: `https://blog.naver.com/temp/${Date.now()}`, // 실제 URL
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "포스트 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
