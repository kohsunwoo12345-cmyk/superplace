interface Env {
  DB: D1Database;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const {
      title,
      message,
      type,
      filterType,
      selectedAcademies,
      selectedStudents,
      selectedRoles, // 새로 추가: ['STUDENT', 'TEACHER', 'DIRECTOR']
    } = body;

    console.log('📤 Send notification request:', { title, filterType, selectedRoles, selectedAcademies, selectedStudents });

    // Validation
    if (!title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "제목과 메시지는 필수입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get recipients based on filter type
    let recipients: any[] = [];
    let recipientQuery = "";

    // 역할 필터 설정 (기본값: STUDENT만)
    const targetRoles = selectedRoles && selectedRoles.length > 0 
      ? selectedRoles 
      : ['STUDENT'];
    
    const rolePlaceholders = targetRoles.map(() => "UPPER(role) = ?").join(" OR ");
    const roleParams = targetRoles.map((r: string) => r.toUpperCase());

    if (filterType === "all") {
      // All users with selected roles
      recipientQuery = `
        SELECT id, name, email, role, academy_id as academyId 
        FROM users 
        WHERE (${rolePlaceholders})
      `;
      const result = await DB.prepare(recipientQuery).bind(...roleParams).all();
      recipients = result.results || [];
      console.log('✅ All users filter - found:', recipients.length);
    } else if (filterType === "academy" && selectedAcademies?.length > 0) {
      // Users from selected academies with selected roles
      const placeholders = selectedAcademies.map(() => "?").join(",");
      recipientQuery = `
        SELECT id, name, email, role, academy_id as academyId 
        FROM users 
        WHERE (${rolePlaceholders})
        AND academy_id IN (${placeholders})
      `;
      const result = await DB.prepare(recipientQuery)
        .bind(...roleParams, ...selectedAcademies)
        .all();
      recipients = result.results || [];
      console.log('✅ Academy filter - found:', recipients.length);
    } else if (filterType === "student" && selectedStudents?.length > 0) {
      // Specific users by ID
      const placeholders = selectedStudents.map(() => "?").join(",");
      recipientQuery = `
        SELECT id, name, email, role, academy_id as academyId 
        FROM users 
        WHERE id IN (${placeholders})
      `;
      const result = await DB.prepare(recipientQuery).bind(...selectedStudents).all();
      recipients = result.results || [];
      console.log('✅ Specific users filter - found:', recipients.length);
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "수신자가 없습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate notification ID
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Get Korean timestamp
    const now = new Date();
    const kstOffset = 9 * 60; // Korea is UTC+9
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const timestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    // Create notification records for each recipient (individual notifications per user)
    try {
      let successCount = 0;
      for (const recipient of recipients) {
        const recipientNotificationId = `${notificationId}-user${recipient.id}`;
        
        const insertResult = await DB.prepare(`
          INSERT INTO notifications (
            id, title, message, type, timestamp, userId, read
          ) VALUES (?, ?, ?, ?, ?, ?, 0)
        `).bind(
          recipientNotificationId,
          title,
          message,
          type || 'info',
          timestamp,
          recipient.id
        ).run();
        
        if (insertResult.success) {
          successCount++;
        }
      }
      
      console.log(`✅ Created ${successCount} notification records for ${recipients.length} recipients`);
      
      if (successCount === 0) {
        throw new Error('No notifications were created');
      }
    } catch (error: any) {
      console.error('❌ Notifications table insert failed:', error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "알림 저장 실패: " + error.message,
          details: error.toString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Notification sent to ${recipients.length} recipients`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationId,
        recipientCount: recipients.length,
        recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role })),
        sentAt: timestamp,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Notification send error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알림 전송 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
