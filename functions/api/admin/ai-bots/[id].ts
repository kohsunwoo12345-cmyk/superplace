interface Env {
  DB: D1Database;
}

// AI 봇 상세 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;

    const result = await DB.prepare(`
      SELECT * FROM ai_bots WHERE id = ?
    `).bind(botId).first();

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Bot not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ bot: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot get error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to get AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// AI 봇 수정 (활성화/비활성화, 음성 설정 등)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;
    const body = await context.request.json() as any;

    const { isActive, voiceIndex, name, description } = body;

    // 동적으로 UPDATE 쿼리 생성
    const updates: string[] = [];
    const values: any[] = [];

    if (isActive !== undefined) {
      updates.push("isActive = ?");
      values.push(isActive ? 1 : 0);
    }

    if (voiceIndex !== undefined) {
      updates.push("voiceIndex = ?");
      values.push(voiceIndex);
    }

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    updates.push("updatedAt = datetime('now')");
    values.push(botId);

    await DB.prepare(`
      UPDATE ai_bots 
      SET ${updates.join(", ")}
      WHERE id = ?
    `).bind(...values).run();

    return new Response(
      JSON.stringify({ success: true, message: "AI bot updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot update error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// AI 봇 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const botId = context.params.id as string;

    await DB.prepare(`
      DELETE FROM ai_bots WHERE id = ?
    `).bind(botId).run();

    return new Response(
      JSON.stringify({ success: true, message: "AI bot deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI bot deletion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete AI bot",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
