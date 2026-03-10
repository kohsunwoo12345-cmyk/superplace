import { SolapiMessageService } from 'solapi';

// 솔라피 클라이언트 싱글톤
let solapiClient: SolapiMessageService | null = null;

export function getSolapiClient(): SolapiMessageService {
  if (!solapiClient) {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('SOLAPI_API_KEY and SOLAPI_API_SECRET must be set in environment variables');
    }

    solapiClient = new SolapiMessageService(apiKey, apiSecret);
  }

  return solapiClient;
}

// 템플릿 카테고리 조회
export async function getTemplateCategories() {
  const client = getSolapiClient();
  return await client.getKakaoAlimtalkTemplateCategories();
}

// 템플릿 생성
export async function createTemplate(templateData: any) {
  const client = getSolapiClient();
  return await client.createKakaoAlimtalkTemplate(templateData);
}

// 템플릿 목록 조회
export async function getTemplates(params?: any) {
  const client = getSolapiClient();
  return await client.getKakaoAlimtalkTemplates(params);
}

// 템플릿 단일 조회
export async function getTemplate(templateId: string) {
  const client = getSolapiClient();
  return await client.getKakaoAlimtalkTemplate(templateId);
}

// 템플릿 수정
export async function updateTemplate(templateId: string, templateData: any) {
  const client = getSolapiClient();
  return await client.updateKakaoAlimtalkTemplate(templateId, templateData);
}

// 템플릿 삭제
export async function deleteTemplate(templateId: string) {
  const client = getSolapiClient();
  return await client.removeKakaoAlimtalkTemplate(templateId);
}

// 템플릿 검수 요청
export async function requestInspection(templateId: string) {
  const client = getSolapiClient();
  return await client.requestInspectionKakaoAlimtalkTemplate(templateId);
}

// 템플릿 검수 취소
export async function cancelInspection(templateId: string) {
  const client = getSolapiClient();
  return await client.cancelInspectionKakaoAlimtalkTemplate(templateId);
}

// 알림톡 발송
export async function sendAlimtalk(params: {
  templateId: string;
  to: string;
  variables?: Record<string, string>;
  buttons?: any[];
}) {
  const client = getSolapiClient();
  
  const messageData = {
    to: params.to,
    from: process.env.SOLAPI_SENDER_NUMBER || '',
    kakaoOptions: {
      pfId: process.env.SOLAPI_CHANNEL_ID || '',
      templateId: params.templateId,
      variables: params.variables || {},
      buttons: params.buttons || [],
    },
  };

  return await client.send(messageData);
}
