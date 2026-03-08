// Alimtalk Template Registration & Status Check API
// POST /api/kakao/templates/register - Solapi에 템플릿 등록 신청
// GET /api/kakao/templates/status?templateId=xxx - 승인 상태 조회

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Create HMAC signature for Solapi (동일한 서명 방식 사용)
async function createSolapiSignature(apiSecret: string) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const message = date + salt;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // ArrayBuffer를 hex 문자열로 변환
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('✅ 서명 생성 완료:', {
    signatureLength: signatureHex.length,
    signaturePreview: signatureHex.substring(0, 16) + '...',
  });

  return { date, salt, signature: signatureHex };
}

// 🆕 Solapi API에서 채널 목록 조회하여 pfId 찾기
async function fetchPfIdFromSolapi(
  channelName: string, 
  apiKey: string, 
  apiSecret: string
): Promise<string | null> {
  try {
    console.log('🔍 Solapi API에서 채널 조회 시작:', channelName);
    
    // 기존 서명 로직 사용 (date + salt)
    const { date, salt, signature } = await createSolapiSignature(apiSecret);
    const authHeader = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
    
    console.log('🔐 인증 헤더 생성:', {
      apiKeyPreview: apiKey.substring(0, 8) + '...',
      date,
      salt,
      signaturePreview: signature.substring(0, 16) + '...',
    });
    
    // ✅ Solapi API: GET https://api.solapi.com/kakao/v2/channels
    const response = await fetch('https://api.solapi.com/kakao/v2/channels', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📥 Solapi 응답:', {
      status: response.status,
      ok: response.ok,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Solapi 채널 목록 조회 실패:', {
        status: response.status,
        error: errorText,
      });
      return null;
    }
    
    const data = await response.json();
    console.log('📋 Solapi 채널 목록:', {
      totalChannels: data.channelList?.length || 0,
      channelsPreview: data.channelList?.slice(0, 3).map((c: any) => ({
        name: c.channelName || c.searchId,
        channelId: c.channelId, // ✅ pfId가 아닌 channelId
      })) || [],
    });
    
    // 채널명으로 channelId 찾기
    const channel = data.channelList?.find((c: any) => 
      c.channelName === channelName || 
      c.searchId === channelName
    );
    
    if (channel && channel.channelId) {
      console.log('✅ channelId 찾기 성공:', {
        channelName,
        channelId: channel.channelId, // ✅ Solapi의 channelId를 pfId로 사용
        length: channel.channelId.length,
      });
      return channel.channelId; // ✅ channelId 반환
    }
    
    console.warn('⚠️ 채널을 찾을 수 없음:', {
      searchName: channelName,
      availableChannels: data.channelList?.map((c: any) => 
        c.channelName || c.searchId
      ) || [],
    });
    return null;
  } catch (error: any) {
    console.error('❌ Solapi API 호출 에러:', error.message);
    return null;
  }
}

// POST: Solapi에 템플릿 등록 신청
export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      userId,
      channelId,
      templateCode: userTemplateCode, // 사용자 입력 템플릿 코드 (무시하고 자동 생성)
      templateName: userTemplateName,      // 사용자 입력 템플릿 이름 (무시하고 자동 생성)
      content,           // 템플릿 내용
      categoryCode,      // 카테고리 코드 (예: 008, 012 등)
      messageType,       // BA (기본형), EX (부가정보형), AD (광고추가형), MI (복합형)
      emphasizeType,     // NONE, TEXT, IMAGE
      buttons,           // 버튼 배열
      extra,             // 부가정보 (강조 유형일 때)
      securityFlag,      // 보안 템플릿 여부
      variables,         // 변수 목록 (배열)
    } = body;

    // 🔧 템플릿 코드 무조건 자동 생성 (사용자 입력 무시)
    // Solapi templateCode: 영문 소문자, 숫자, 언더스코어만 가능, 최대 40자
    // UUID v4 기반 완전 고유 코드 생성
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const finalTemplateCode = `alimtalk_${uuid}`; // 예: alimtalk_a1b2c3d4e5f67890
    
    // 🔧 템플릿 이름도 자동 생성
    const timestamp = Date.now().toString();
    const finalTemplateName = `report_${timestamp}`;
    
    console.log('📝 템플릿 등록 신청:', { 
      userId, 
      channelId, 
      userInputCode: userTemplateCode,
      generatedCode: finalTemplateCode,
      userInputName: userTemplateName,
      generatedName: finalTemplateName
    });

    // 필수 필드 검증 (templateName은 자동 생성되므로 체크 제외)
    if (!userId || !channelId || !content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: userId, channelId, content' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔍 핵심: DB에서 실제 pfId 조회 (채널 이름 → 32자리 pfId로 변환)
    let academyPhone = null;
    let realPfId = null; // 실제 Solapi pfId
    
    try {
      // 1. 사용자 전화번호 조회
      const userResult = await env.DB.prepare(`
        SELECT phone, academy_name FROM users WHERE id = ?
      `).bind(userId).first();
      
      if (userResult && userResult.phone) {
        academyPhone = userResult.phone;
        console.log('📞 학원장 전화번호 조회 성공:', academyPhone);
      }
      
      // 2. 카카오 채널 정보 조회 (channelId로 실제 pfId 찾기)
      const channelResult = await env.DB.prepare(`
        SELECT id, channelName, solapiChannelId, phoneNumber FROM KakaoChannel 
        WHERE id = ?
      `).bind(channelId).first();
      
      console.log('🔎 DB 조회 결과:', {
        channelId,
        found: !!channelResult,
        channelName: channelResult?.channelName,
        solapiChannelId: channelResult?.solapiChannelId,
      });
      
      if (channelResult) {
        // DB에 유효한 pfId(KA01PF로 시작하고 30자 이상)가 있으면 사용, 없으면 Solapi API에서 조회
        const isValidPfId = channelResult.solapiChannelId && 
                           channelResult.solapiChannelId.length >= 30 &&
                           channelResult.solapiChannelId.startsWith('KA01PF');
        
        if (isValidPfId) {
          realPfId = channelResult.solapiChannelId;
          console.log('✅ DB에서 pfId 조회 성공:', {
            pfId: realPfId.substring(0, 10) + '...',
            length: realPfId.length,
          });
        } else {
          console.warn('⚠️ DB에 유효한 pfId 없음, Solapi API에서 조회 시도...', {
            currentValue: channelResult.solapiChannelId,
            length: channelResult.solapiChannelId?.length || 0,
          });
          
          // Solapi credentials 먼저 가져오기
          const envAny = env as any;
          const SOLAPI_API_KEY = (envAny['SOLAPI_API_Key '] || envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY)?.trim();
          const SOLAPI_API_SECRET = (envAny.SOLAPI_API_SECRET || envAny.SOLAPI_API_Secret || envAny['SOLAPI_API_Secret'])?.trim();
          
          if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
            // Solapi API에서 pfId 조회
            const fetchedPfId = await fetchPfIdFromSolapi(
              channelResult.channelName,
              SOLAPI_API_KEY,
              SOLAPI_API_SECRET
            );
            
            if (fetchedPfId) {
              realPfId = fetchedPfId;
              console.log('✅ Solapi API에서 pfId 조회 성공:', {
                channelName: channelResult.channelName,
                pfId: realPfId.substring(0, 10) + '...',
                length: realPfId.length,
              });
              
              // DB에 pfId 업데이트
              try {
                await env.DB.prepare(`
                  UPDATE KakaoChannel 
                  SET solapiChannelId = ?, updatedAt = CURRENT_TIMESTAMP
                  WHERE id = ?
                `).bind(realPfId, channelId).run();
                console.log('💾 DB에 pfId 저장 완료');
              } catch (updateError: any) {
                console.warn('⚠️ DB 업데이트 실패 (계속 진행):', updateError.message);
              }
            } else {
              console.error('❌ Solapi API에서도 pfId를 찾을 수 없음');
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'Solapi에서 카카오 채널을 찾을 수 없습니다.',
                  details: `채널명: ${channelResult.channelName}. Solapi 콘솔에서 채널이 정상 연동되었는지 확인해주세요.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            console.error('❌ Solapi 자격 증명 없음');
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Solapi 자격 증명이 설정되지 않았습니다.',
                details: 'SOLAPI_API_Key와 SOLAPI_API_SECRET을 환경 변수에 등록해주세요.'
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        if (!academyPhone && channelResult.phoneNumber) {
          academyPhone = channelResult.phoneNumber;
          console.log('📞 채널 전화번호 조회 성공:', academyPhone);
        }
      } else {
        console.error('❌ 채널을 찾을 수 없습니다:', channelId);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '선택한 카카오 채널을 찾을 수 없습니다.',
            details: `channelId: ${channelId}`
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (dbError: any) {
      console.error('⚠️ 학원 정보 조회 실패:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DB 조회 실패',
          details: dbError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('🏫 최종 정보:', { 
      academyPhone, 
      realPfId: realPfId?.substring(0, 10) + '...', 
      pfIdLength: realPfId?.length,
      templateCode: finalTemplateCode,
      templateName: finalTemplateName
    });

    // Get Solapi credentials (여러 가능한 환경 변수명 시도)
    const envAny = env as any;
    const SOLAPI_API_KEY = (envAny['SOLAPI_API_Key '] || envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY)?.trim();
    const SOLAPI_API_SECRET = (envAny.SOLAPI_API_SECRET || envAny.SOLAPI_API_Secret || envAny['SOLAPI_API_Secret'])?.trim();

    console.log('🔑 Solapi 자격 증명:', {
      keyExists: !!SOLAPI_API_KEY,
      secretExists: !!SOLAPI_API_SECRET,
      keyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
    });

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured',
          details: {
            keyExists: !!SOLAPI_API_KEY,
            secretExists: !!SOLAPI_API_SECRET,
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create HMAC signature
    const { date, salt, signature } = await createSolapiSignature(SOLAPI_API_SECRET);

    // Prepare template data for Solapi
    // ✅ templateCode는 필수 - UUID 기반 완전 고유 코드
    const templateData: any = {
      pfId: realPfId, // DB에서 조회한 실제 32자리 pfId (channelId)
      templateCode: finalTemplateCode, // UUID 기반 고유 코드
      name: finalTemplateName, // 자동 생성된 템플릿 이름
      content: content,
      categoryCode: categoryCode || '008', // Default to 일반 카테고리
      messageType: messageType || 'BA',
      securityFlag: securityFlag || false
    };
    
    // ❌ senderKey 제거 - Solapi 템플릿 등록에는 필요없음
    // (알림톡 발송 시에만 사용)

    // Add buttons if provided
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      templateData.buttons = buttons.map((btn: any) => ({
        ordering: btn.ordering || 1,
        type: btn.type || 'WL', // WL (웹링크), AL (앱링크), BK (봇키워드), MD (메시지전달)
        name: btn.name,
        linkMo: btn.linkMo || btn.url,
        linkPc: btn.linkPc || btn.url,
        linkIos: btn.linkIos,
        linkAnd: btn.linkAnd
      }));
    }

    // Add emphasize type and extra if provided
    if (emphasizeType && emphasizeType !== 'NONE') {
      templateData.emphasizeType = emphasizeType;
      
      console.log('🔍 Emphasize 처리:', {
        emphasizeType,
        hasExtra: !!extra,
        extraType: typeof extra,
        extra: extra,
      });
      
      // ✅ Solapi 요구사항: emphasizeTitle과 emphasizeSubtitle 필드 사용
      if (extra && typeof extra === 'object') {
        templateData.emphasizeTitle = extra.title || extra.emphasizeTitle || '';
        templateData.emphasizeSubtitle = extra.description || extra.subtitle || extra.emphasizeSubtitle || '';
        
        console.log('✅ Emphasize 필드 설정:', {
          emphasizeTitle: templateData.emphasizeTitle,
          emphasizeSubtitle: templateData.emphasizeSubtitle,
        });
      } else if (extra && typeof extra === 'string') {
        // JSON 문자열인 경우 파싱
        try {
          const parsed = JSON.parse(extra);
          templateData.emphasizeTitle = parsed.title || parsed.emphasizeTitle || '';
          templateData.emphasizeSubtitle = parsed.description || parsed.subtitle || parsed.emphasizeSubtitle || '';
          
          console.log('✅ Emphasize 필드 설정 (파싱):', {
            emphasizeTitle: templateData.emphasizeTitle,
            emphasizeSubtitle: templateData.emphasizeSubtitle,
          });
        } catch (e) {
          console.warn('⚠️ extra JSON 파싱 실패:', extra);
        }
      } else {
        console.warn('⚠️ extra가 없거나 잘못된 형식:', { extra, type: typeof extra });
      }
    }

    console.log('🚀 Solapi API 호출:', templateData);
    console.log('🔐 인증 헤더:', {
      apiKeyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
      date,
      salt,
      signaturePreview: signature.substring(0, 16) + '...',
    });

    // Call Solapi API to register template
    const solapiResponse = await fetch('https://api.solapi.com/kakao/v1/templates', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });

    const solapiData = await solapiResponse.json();

    console.log('📥 Solapi 응답:', {
      status: solapiResponse.status,
      ok: solapiResponse.ok,
      data: solapiData
    });

    if (!solapiResponse.ok) {
      // Solapi API 에러 - 상세 정보 반환
      const errorMessages = [];
      
      if (solapiData.errorMessage) {
        errorMessages.push(solapiData.errorMessage);
      }
      
      if (solapiData.message) {
        errorMessages.push(solapiData.message);
      }
      
      // 검증 오류 메시지 파싱
      if (Array.isArray(solapiData.errors)) {
        errorMessages.push(...solapiData.errors);
      }
      
      console.error('❌ Solapi 템플릿 등록 실패:', {
        errorCode: solapiData.errorCode,
        errorMessages,
        fullResponse: solapiData
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessages.join(', ') || 'Solapi template registration failed',
          details: solapiData,
          code: solapiData.errorCode,
          validation: {
            pfId: realPfId,
            pfIdLength: realPfId?.length,
            templateId: finalTemplateCode,
            hasExtra: !!templateData.extra,
            extraType: typeof templateData.extra,
          }
        }),
        { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to local database
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO AlimtalkTemplate (
        id, userId, channelId, templateCode, templateName, content,
        categoryCode, messageType, emphasizeType, buttons, quickReplies, variables,
        solapiTemplateId, status, inspectionStatus, senderPhone, senderPfId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      channelId,
      finalTemplateCode, // 자동 생성된 코드 저장
      finalTemplateName, // 자동 생성된 이름 저장
      content,
      categoryCode || '008',
      messageType || 'BA',
      emphasizeType || 'NONE',
      buttons ? JSON.stringify(buttons) : null,
      null,
      variables ? JSON.stringify(variables) : null,
      finalTemplateCode, // solapiTemplateId
      'ACTIVE',
      solapiData.status || 'PENDING', // Solapi 응답의 상태 저장
      academyPhone, // 학원 전화번호 저장
      realPfId,  // 실제 Solapi pfId 저장
      now,
      now
    ).run();

    return new Response(
      JSON.stringify({ 
        success: true, 
        template: {
          id,
          templateCode: finalTemplateCode, // 자동 생성된 코드 반환
          templateName: finalTemplateName, // 자동 생성된 이름 반환
          status: solapiData.status,
          inspectionStatus: solapiData.inspectionStatus
        },
        solapi: solapiData,
        message: '템플릿이 Solapi에 등록 신청되었습니다. 카카오 승인 대기 중입니다.'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 템플릿 등록 오류:', error);
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

// GET: 템플릿 승인 상태 조회
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const templateId = url.searchParams.get('templateId'); // 템플릿 코드
    const pfId = url.searchParams.get('pfId');             // 카카오 채널 PF ID
    const userId = url.searchParams.get('userId');

    if (!templateId || !pfId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'templateId and pfId are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 템플릿 상태 조회:', { templateId, pfId });

    // Get Solapi credentials (여러 가능한 환경 변수명 시도)
    const envAny = env as any;
    const SOLAPI_API_KEY = (envAny['SOLAPI_API_Key '] || envAny['SOLAPI_API_Key'] || envAny.SOLAPI_API_Key || envAny.SOLAPI_API_KEY)?.trim();
    const SOLAPI_API_SECRET = (envAny.SOLAPI_API_SECRET || envAny.SOLAPI_API_Secret || envAny['SOLAPI_API_Secret'])?.trim();

    console.log('🔑 Solapi 자격 증명:', {
      keyExists: !!SOLAPI_API_KEY,
      secretExists: !!SOLAPI_API_SECRET,
      keyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
    });

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Solapi credentials not configured',
          details: {
            keyExists: !!SOLAPI_API_KEY,
            secretExists: !!SOLAPI_API_SECRET,
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create HMAC signature
    const { date, salt, signature } = await createSolapiSignature(SOLAPI_API_SECRET);

    console.log('🔍 템플릿 상태 조회 요청:', {
      templateId,
      pfId,
      apiKeyPreview: SOLAPI_API_KEY?.substring(0, 8) + '...',
      date,
      salt,
      signaturePreview: signature.substring(0, 16) + '...',
    });

    // Call Solapi API to get template status
    const solapiResponse = await fetch(
      `https://api.solapi.com/kakao/v1/templates/${pfId}/${templateId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
        }
      }
    );

    const solapiData = await solapiResponse.json();

    console.log('📥 Solapi 템플릿 상태:', solapiData);

    if (!solapiResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: solapiData.errorMessage || 'Failed to get template status',
          details: solapiData
        }),
        { status: solapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update local database with latest status
    if (userId) {
      try {
        await env.DB.prepare(`
          UPDATE AlimtalkTemplate
          SET inspectionStatus = ?, updatedAt = ?
          WHERE userId = ? AND templateCode = ?
        `).bind(
          solapiData.inspectionStatus || solapiData.status,
          new Date().toISOString(),
          userId,
          templateId
        ).run();
      } catch (dbError) {
        console.error('⚠️ DB 업데이트 실패:', dbError);
        // Continue anyway - DB update is not critical
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        template: solapiData,
        inspectionStatus: solapiData.inspectionStatus,
        status: solapiData.status,
        isApproved: solapiData.inspectionStatus === 'APR', // APR = 승인됨
        statusMessage: getStatusMessage(solapiData.inspectionStatus)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ 템플릿 상태 조회 오류:', error);
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

// 승인 상태 메시지
function getStatusMessage(status: string): string {
  const statusMap: { [key: string]: string } = {
    'REQ': '등록 대기',
    'REG': '검수 대기',
    'APR': '승인됨 ✅',
    'REJ': '반려됨 ❌',
    'REV': '재검수 요청',
    'PENDING': '검수 대기',
  };
  return statusMap[status] || status;
}
