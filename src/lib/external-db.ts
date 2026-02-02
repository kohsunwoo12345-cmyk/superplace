import { PrismaClient } from '@prisma/client';

/**
 * 외부 DB 연결 클라이언트
 * Cloudflare를 통해 다른 웹사이트와 공유하는 데이터베이스
 */

// 외부 DB URL 환경 변수 확인
const EXTERNAL_DB_URL = process.env.EXTERNAL_DATABASE_URL;

const globalForExternalDB = globalThis as unknown as {
  externalDB: PrismaClient | undefined;
};

export const externalDB = EXTERNAL_DB_URL
  ? (globalForExternalDB.externalDB ??
    new PrismaClient({
      datasources: {
        db: {
          url: EXTERNAL_DB_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && externalDB) {
  globalForExternalDB.externalDB = externalDB;
}

/**
 * 외부 DB 연결 상태 확인
 */
export async function checkExternalDBConnection(): Promise<boolean> {
  if (!externalDB) {
    console.warn('⚠️ EXTERNAL_DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    return false;
  }

  try {
    await externalDB.$queryRaw`SELECT 1`;
    console.log('✅ 외부 DB 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ 외부 DB 연결 실패:', error);
    return false;
  }
}

/**
 * 외부 DB가 활성화되어 있는지 확인
 */
export function isExternalDBEnabled(): boolean {
  return externalDB !== null;
}
