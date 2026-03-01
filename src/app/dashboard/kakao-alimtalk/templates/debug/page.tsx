"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKakaoAuth } from '@/hooks/useKakaoAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bug } from 'lucide-react';

export default function TemplateDebugPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useKakaoAuth();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [channelDebug, setChannelDebug] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.id) {
      router.push('/login');
      return;
    }
  }, [user, authLoading]);

  const testChannelsAPI = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      setChannelDebug(null);

      const response = await fetch(`/api/kakao/channels?userId=${user.id}`);
      
      const debug: any = {
        timestamp: new Date().toISOString(),
        userId: user.id,
        responseStatus: response.status,
        responseOk: response.ok,
        responseHeaders: Object.fromEntries(response.headers.entries())
      };

      let data;
      try {
        const text = await response.text();
        debug.responseText = text.substring(0, 1000);
        data = JSON.parse(text);
        debug.parsedData = data;
      } catch (e: any) {
        debug.parseError = e.message;
        setError(`Failed to parse response: ${e.message}`);
        setChannelDebug(debug);
        return;
      }

      if (data.success && data.channels) {
        debug.channelsCount = data.channels.length;
        debug.channels = data.channels;
      } else {
        debug.apiError = data.error || 'Unknown error';
        setError(data.error || 'API returned error');
      }

      setChannelDebug(debug);
    } catch (err: any) {
      console.error('Channel debug test failed:', err);
      setError(`Test failed: ${err.message}`);
      setChannelDebug({
        error: err.message,
        stack: err.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      const response = await fetch(`/api/kakao/templates?userId=${user.id}`);
      
      const debug: any = {
        timestamp: new Date().toISOString(),
        userId: user.id,
        responseStatus: response.status,
        responseOk: response.ok,
        responseHeaders: Object.fromEntries(response.headers.entries())
      };

      let data;
      try {
        const text = await response.text();
        debug.responseText = text.substring(0, 1000); // First 1000 chars
        data = JSON.parse(text);
        debug.parsedData = data;
      } catch (e: any) {
        debug.parseError = e.message;
        setError(`Failed to parse response: ${e.message}`);
        setDebugInfo(debug);
        return;
      }

      if (data.success && data.templates) {
        debug.templatesCount = data.templates.length;
        debug.firstTemplate = data.templates[0] || null;
        debug.templateFields = data.templates[0] ? Object.keys(data.templates[0]) : [];
        
        // Check for problematic fields
        debug.templateIssues = data.templates.map((t: any, i: number) => ({
          index: i,
          id: t.id,
          hasVariables: !!t.variables,
          variablesType: typeof t.variables,
          variablesValue: t.variables,
          hasChannelName: !!t.channelName,
          channelName: t.channelName
        }));
      } else {
        debug.apiError = data.error || 'Unknown error';
        setError(data.error || 'API returned error');
      }

      setDebugInfo(debug);
    } catch (err: any) {
      console.error('Debug test failed:', err);
      setError(`Test failed: ${err.message}`);
      setDebugInfo({
        error: err.message,
        stack: err.stack
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bug className="h-8 w-8 text-red-600" />
          템플릿 API 디버그
        </h1>
        <p className="text-gray-600">
          템플릿 API의 응답을 테스트하고 확인합니다
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ user }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Button onClick={testChannelsAPI} disabled={loading} className="mb-6 mr-4">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            테스트 중...
          </>
        ) : (
          '채널 API 테스트'
        )}
      </Button>

      <Button onClick={testAPI} disabled={loading} className="mb-6">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            테스트 중...
          </>
        ) : (
          '템플릿 API 테스트'
        )}
      </Button>

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800">
            <strong>오류:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {channelDebug && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>채널 API 디버그 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[600px] text-xs">
              {JSON.stringify(channelDebug, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>템플릿 API 디버그 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[600px] text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
