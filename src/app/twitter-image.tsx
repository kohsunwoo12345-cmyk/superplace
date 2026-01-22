import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = '슈퍼플레이스 스터디';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontSize: 80,
              marginRight: 20,
            }}
          >
            🎓
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
            }}
          >
            슈퍼플레이스 스터디
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          체계적인 학습 관리로 성적 향상을 실현하는
          <br />
          스마트 학습 관리 시스템
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
