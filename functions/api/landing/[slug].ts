interface Env {
  DB: D1Database;
}

// GET: slug로 랜딩페이지 HTML 반환
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1]; // 마지막 세그먼트가 slug
    const studentId = url.searchParams.get('studentId'); // 학생 ID from query param

    if (!DB) {
      return new Response("Database not configured", {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (!slug) {
      return new Response("Landing page not found", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 랜딩페이지 조회
    const landingPage = await DB.prepare(`
      SELECT * FROM landing_pages WHERE slug = ?
    `).bind(slug).first();

    if (!landingPage) {
      return new Response("Landing page not found or inactive", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 조회수 증가
    try {
      await DB.prepare(`
        UPDATE landing_pages SET views = COALESCE(views, 0) + 1 WHERE id = ?
      `).bind(landingPage.id).run();
      console.log(`✅ 조회수 증가: ${slug}`);
    } catch (viewError) {
      console.error('⚠️ 조회수 업데이트 실패:', viewError);
    }

    // HTML 컨텐츠 가져오기
    let html = (landingPage.html_content as string) || '';

    // 기본 변수 설정
    const replacements: Record<string, string> = {
      '{{title}}': (landingPage.title as string) || '',
      '{{subtitle}}': (landingPage.subtitle as string) || '',
      '{{landing_page_id}}': String(landingPage.id),
      '{{meta_pixel}}': '',
      '{{custom_script}}': '',
      // 기본값 설정 (학생 데이터 없을 때)
      '{{studentName}}': '학생',
      '{{period}}': '이번 달',
      '{{attendanceRate}}': '0',
      '{{totalDays}}': '0',
      '{{presentDays}}': '0',
      '{{absentDays}}': '0',
      '{{tardyDays}}': '0',
      '{{aiChatCount}}': '0',
      '{{homeworkRate}}': '0',
      '{{homeworkCompleted}}': '0',
      '{{homeworkTotal}}': '0',
      '{{weakConcepts}}': '',
      '{{improvements}}': '',
      '{{studyDirection}}': ''
    };

    // 학생 ID가 있으면 학생 데이터 가져오기
    if (studentId) {
      try {
        // 학생 기본 정보
        const student = await DB.prepare(`
          SELECT u.name, u.email, s.phone 
          FROM users u
          LEFT JOIN Student s ON u.id = s.user_id
          WHERE u.id = ?
        `).bind(studentId).first();

        if (student) {
          replacements['{{studentName}}'] = (student.name as string) || '학생';
        }

        // 출석 통계 (최근 30일)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const attendanceStats = await DB.prepare(`
          SELECT 
            COUNT(*) as totalDays,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentDays,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absentDays,
            SUM(CASE WHEN status = 'tardy' THEN 1 ELSE 0 END) as tardyDays
          FROM attendance
          WHERE student_id = ? AND date >= ?
        `).bind(studentId, thirtyDaysAgo).first();

        if (attendanceStats) {
          const totalDays = Number(attendanceStats.totalDays) || 0;
          const presentDays = Number(attendanceStats.presentDays) || 0;
          const absentDays = Number(attendanceStats.absentDays) || 0;
          const tardyDays = Number(attendanceStats.tardyDays) || 0;
          const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          replacements['{{totalDays}}'] = String(totalDays);
          replacements['{{presentDays}}'] = String(presentDays);
          replacements['{{absentDays}}'] = String(absentDays);
          replacements['{{tardyDays}}'] = String(tardyDays);
          replacements['{{attendanceRate}}'] = String(attendanceRate);
          replacements['{{period}}'] = '최근 30일';
        }

        // AI 채팅 횟수
        const aiChatCount = await DB.prepare(`
          SELECT COUNT(*) as count
          FROM ai_chat_history
          WHERE user_id = ? AND created_at >= ?
        `).bind(studentId, thirtyDaysAgo).first();

        if (aiChatCount) {
          replacements['{{aiChatCount}}'] = String(aiChatCount.count || 0);
        }

        // 숙제 통계
        const homeworkStats = await DB.prepare(`
          SELECT 
            COUNT(*) as totalHomework,
            SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completedHomework
          FROM homework_submissions
          WHERE student_id = ? AND submitted_at >= ?
        `).bind(studentId, thirtyDaysAgo).first();

        if (homeworkStats) {
          const totalHomework = Number(homeworkStats.totalHomework) || 0;
          const completedHomework = Number(homeworkStats.completedHomework) || 0;
          const homeworkRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;

          replacements['{{homeworkTotal}}'] = String(totalHomework);
          replacements['{{homeworkCompleted}}'] = String(completedHomework);
          replacements['{{homeworkRate}}'] = String(homeworkRate);
        }

        // 부족한 개념 분석 데이터 (캐시된 데이터 사용)
        const weakConceptsData = await DB.prepare(`
          SELECT analysis_result, analyzed_at
          FROM student_weak_concepts_cache
          WHERE student_id = ?
          ORDER BY analyzed_at DESC
          LIMIT 1
        `).bind(studentId).first();

        if (weakConceptsData && weakConceptsData.analysis_result) {
          try {
            const analysisResult = JSON.parse(weakConceptsData.analysis_result as string);
            
            // 부족한 개념 목록
            if (analysisResult.weakConcepts && analysisResult.weakConcepts.length > 0) {
              const concepts = analysisResult.weakConcepts
                .slice(0, 5) // 상위 5개
                .map((c: any, idx: number) => `${idx + 1}. ${c.concept}: ${c.description}`)
                .join('\n');
              replacements['{{weakConcepts}}'] = concepts;
            }

            // 학습 방향 및 개선점
            if (analysisResult.learningDirection) {
              replacements['{{studyDirection}}'] = analysisResult.learningDirection;
            }

            // 개선 사항 (recommendations)
            if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
              const improvements = analysisResult.recommendations
                .slice(0, 3) // 상위 3개
                .map((r: any, idx: number) => `${idx + 1}. ${r.concept}: ${r.action}`)
                .join('\n');
              replacements['{{improvements}}'] = improvements;
            }
          } catch (parseError) {
            console.error('❌ Failed to parse weak concepts data:', parseError);
          }
        }

      } catch (studentDataError) {
        console.error('⚠️ Error fetching student data:', studentDataError);
        // 에러 발생해도 페이지는 표시 (기본값 사용)
      }
    }

    // 메타 픽셀 추가
    if (landingPage.meta_pixel_id) {
      replacements['{{meta_pixel}}'] = `
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${landingPage.meta_pixel_id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${landingPage.meta_pixel_id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
      `.trim();
    }

    // 커스텀 스크립트 추가
    if (landingPage.custom_script) {
      replacements['{{custom_script}}'] = landingPage.custom_script as string;
    }

    // 모든 변수 치환
    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return new Response(html, {
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60" // 학생 데이터는 1분 캐시
      },
    });
  } catch (error: any) {
    console.error("Landing page view error:", error);
    return new Response(`Error loading landing page: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};
