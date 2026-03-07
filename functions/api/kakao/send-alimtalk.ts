// Solapi Send Alimtalk API

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Handle POST
export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { userId, channelId, solapiChannelId, templateCode, recipients, sendMode, scheduledAt } = body;

    if (!userId || !channelId || !solapiChannelId || !templateCode || !recipients) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, channelId, solapiChannelId, templateCode, recipients' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle scheduled send
    if (sendMode === 'scheduled') {
      if (!scheduledAt) {
        return new Response(
          JSON.stringify({ success: false, error: 'scheduledAt is required for scheduled sends' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(`
          INSERT INTO ScheduledAlimtalk (
            id, userId, channelId, channelName, solapiChannelId, 
            templateId, templateName, templateCode, 
            recipients, scheduledAt, status, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          scheduleId,
          userId,
          channelId,
          body.channelName || 'Unknown',
          solapiChannelId,
          body.templateId || '',
          body.templateName || 'Unknown',
          templateCode,
          JSON.stringify(recipients),
          scheduledAt,
          'PENDING',
          new Date().toISOString()
        ).run();
        
        return new Response(
          JSON.stringify({ 
            success: true,
            scheduleId,
            message: `${recipients.length}건의 알림톡이 예약되었습니다.`,
            scheduledAt
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (schedError) {
        console.error('Failed to schedule:', schedError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to schedule messages' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'recipients must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle trailing spaces in env var names
    const SOLAPI_API_KEY = env['SOLAPI_API_Key '] || env.SOLAPI_API_Key || env.SOLAPI_API_KEY;
    const SOLAPI_API_SECRET = env.SOLAPI_API_Secret || env.SOLAPI_API_SECRET;

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📤 Sending alimtalk:', {
      channelId: solapiChannelId,
      templateCode,
      recipientCount: recipients.length
    });

    // Create HMAC signature
    const dateTime = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hmacData = dateTime + salt;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SOLAPI_API_SECRET);
    const messageData = encoder.encode(hmacData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Prepare messages for Solapi
    const messages = recipients.map((recipient: any) => {
      const variables: any = {};
      
      // Add name variable (multiple formats for compatibility)
      if (recipient.name) {
        variables['name'] = recipient.name;        // #{name}
        variables['이름'] = recipient.name;          // #{이름}
        variables['학생이름'] = recipient.name;      // #{학생이름}
      }
      
      // Add landing page URL variable (multiple formats for compatibility)
      if (recipient.landingPageUrl) {
        variables['url'] = recipient.landingPageUrl;       // #{url}
        variables['URL'] = recipient.landingPageUrl;       // #{URL}
        variables['리포트URL'] = recipient.landingPageUrl; // #{리포트URL}
        variables['링크'] = recipient.landingPageUrl;      // #{링크}
      }
      
      // Add any other variables from recipient
      if (recipient.variables) {
        Object.assign(variables, recipient.variables);
      }

      console.log(`   📨 Recipient: ${recipient.name} (${recipient.phoneNumber}), variables:`, variables);

      return {
        to: recipient.phoneNumber,
        from: solapiChannelId,
        kakaoOptions: {
          pfId: solapiChannelId,
          templateId: templateCode,
          variables: variables
        }
      };
    });

    // Send via Solapi (batch send)
    const response = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signatureHex}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    console.log('📥 Solapi response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.errorMessage || 'Failed to send messages',
          details: data
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count success/fail
    let successCount = 0;
    let failCount = 0;

    if (data.groupId) {
      // Batch send successful
      successCount = recipients.length;
    } else if (Array.isArray(data)) {
      // Individual responses
      data.forEach((result: any) => {
        if (result.statusCode === '2000' || result.statusCode === '4000') {
          successCount++;
        } else {
          failCount++;
        }
      });
    } else {
      successCount = recipients.length;
    }

    // Deduct points from user (40 points per message)
    const totalCost = successCount * 40;
    console.log(`💰 Deducting ${totalCost} points from user ${userId}`);

    // Deduct points from user
    try {
      await env.DB.prepare(`
        UPDATE User SET points = COALESCE(points, 0) - ? WHERE id = ?
      `).bind(totalCost, userId).run();
      console.log(`✅ Points deducted successfully: ${totalCost} points`);
    } catch (pointError) {
      console.error('Failed to deduct points:', pointError);
      // Continue anyway - don't fail the entire operation
    }

    // Save send history
    try {
      const historyId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await env.DB.prepare(`
        INSERT INTO AlimtalkSendHistory (
          id, userId, channelId, channelName, templateId, templateName, templateCode,
          recipientCount, successCount, failCount, totalCost, groupId, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        historyId,
        userId,
        channelId,
        body.channelName || 'Unknown',
        body.templateId || '',
        body.templateName || 'Unknown',
        templateCode,
        recipients.length,
        successCount,
        failCount,
        totalCost,
        data.groupId || null,
        failCount === 0 ? 'COMPLETED' : (successCount > 0 ? 'PARTIAL' : 'FAILED'),
        new Date().toISOString()
      ).run();
    } catch (histError) {
      console.error('Failed to save history:', histError);
      // Continue anyway
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        successCount,
        failCount,
        totalCost,
        groupId: data.groupId || null,
        message: `${successCount}건 발송 완료, ${failCount}건 실패`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Send alimtalk error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
