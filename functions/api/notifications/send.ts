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
    } = body;

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

    if (filterType === "all") {
      // All students
      recipientQuery = `
        SELECT id, name, email, academyId 
        FROM users 
        WHERE UPPER(role) = 'STUDENT'
      `;
      const result = await DB.prepare(recipientQuery).all();
      recipients = result.results || [];
    } else if (filterType === "academy" && selectedAcademies?.length > 0) {
      // Students from selected academies
      const placeholders = selectedAcademies.map(() => "?").join(",");
      recipientQuery = `
        SELECT id, name, email, academyId 
        FROM users 
        WHERE UPPER(role) = 'STUDENT' 
        AND academyId IN (${placeholders})
      `;
      const result = await DB.prepare(recipientQuery).bind(...selectedAcademies).all();
      recipients = result.results || [];
    } else if (filterType === "student" && selectedStudents?.length > 0) {
      // Specific students
      const placeholders = selectedStudents.map(() => "?").join(",");
      recipientQuery = `
        SELECT id, name, email, academyId 
        FROM users 
        WHERE id IN (${placeholders})
      `;
      const result = await DB.prepare(recipientQuery).bind(...selectedStudents).all();
      recipients = result.results || [];
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

    // Create notification record
    await DB.prepare(`
      INSERT INTO notifications (
        id, title, message, type, filterType, 
        recipientCount, createdAt, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationId,
      title,
      message,
      type,
      filterType,
      recipients.length,
      timestamp,
      "sent"
    ).run();

    // Create notification_recipients records for each recipient
    for (const recipient of recipients) {
      const recipientId = `notif-recipient-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await DB.prepare(`
        INSERT INTO notification_recipients (
          id, notificationId, userId, userName, 
          userEmail, academyId, sentAt, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recipientId,
        notificationId,
        recipient.id,
        recipient.name,
        recipient.email,
        recipient.academyId || null,
        timestamp,
        "sent"
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationId,
        recipientCount: recipients.length,
        recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email })),
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
