'use client';

import { useEffect, useState } from 'react';

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 API 테스트 시작...');
      
      const response = await fetch('/api/admin/bots-unified?search=&folderId=all&sortBy=createdAt&sortOrder=desc', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('📡 응답 상태:', response.status);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

      const text = await response.text();
      console.log('📄 응답 본문 (텍스트):', text.substring(0, 500));

      try {
        const data = JSON.parse(text);
        console.log('✅ JSON 파싱 성공:', data);
        
        if (response.ok) {
          setResult(data);
        } else {
          setError(`HTTP ${response.status}: ${JSON.stringify(data, null, 2)}`);
        }
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        setError(`JSON 파싱 오류: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error('❌ 네트워크 오류:', err);
      setError(`네트워크 오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>🧪 API 테스트 페이지</h1>
      <p>엔드포인트: <code>/api/admin/bots-unified</code></p>

      <button 
        onClick={testAPI} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '20px',
        }}
      >
        {loading ? '테스트 중...' : '다시 테스트'}
      </button>

      {loading && (
        <div style={{ marginTop: '20px', color: 'blue' }}>
          ⏳ API 호출 중...
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fee', border: '1px solid red' }}>
          <h2 style={{ color: 'red' }}>❌ 오류 발생</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{error}</pre>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#efe', border: '1px solid green' }}>
          <h2 style={{ color: 'green' }}>✅ 성공</h2>
          <h3>통계:</h3>
          <pre>{JSON.stringify(result.stats, null, 2)}</pre>
          
          <h3>봇 목록 ({result.bots?.length || 0}개):</h3>
          <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
            {JSON.stringify(result.bots, null, 2)}
          </pre>
          
          <h3>폴더 목록 ({result.folders?.length || 0}개):</h3>
          <pre>{JSON.stringify(result.folders, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}>
        <h3>💡 디버깅 팁</h3>
        <ol>
          <li>브라우저 개발자 도구의 콘솔 탭을 열어주세요 (F12)</li>
          <li>위 버튼을 클릭하여 API를 테스트하세요</li>
          <li>콘솔에서 상세한 로그를 확인하세요</li>
          <li>네트워크 탭에서 실제 요청/응답을 확인하세요</li>
        </ol>
      </div>
    </div>
  );
}
