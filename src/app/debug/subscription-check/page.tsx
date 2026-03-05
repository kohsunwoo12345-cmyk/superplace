"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionDebugPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [debugData, setDebugData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [botsData, setBotsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const checkDebugAPI = async () => {
    if (!user?.academyId || !token) {
      setError("User or token not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/debug/check-subscriptions?academyId=${user.academyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setDebugData(data);
      console.log("🔍 Debug API Response:", data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionsAPI = async () => {
    if (!user?.academyId || !token) {
      setError("User or token not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user/academy-bot-subscriptions?academyId=${user.academyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSubscriptionData(data);
      console.log("✅ Subscriptions API Response:", data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkBotsAPI = async () => {
    if (!user?.academyId || !token) {
      setError("User or token not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user/ai-bots?academyId=${user.academyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setBotsData(data);
      console.log("🤖 Bots API Response:", data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAll = async () => {
    await checkDebugAPI();
    await checkSubscriptionsAPI();
    await checkBotsAPI();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Subscription Debug Tool</CardTitle>
          <CardDescription>디버깅을 위한 구독 정보 확인 도구</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">👤 Current User</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkAll} disabled={loading || !user}>
              전체 확인
            </Button>
            <Button onClick={checkDebugAPI} disabled={loading || !user} variant="outline">
              Debug API
            </Button>
            <Button onClick={checkSubscriptionsAPI} disabled={loading || !user} variant="outline">
              Subscriptions API
            </Button>
            <Button onClick={checkBotsAPI} disabled={loading || !user} variant="outline">
              Bots API
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ Error:</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Debug Data */}
          {debugData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2">🔍 Debug API Response</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Academy:</strong> {debugData.academy?.name || 'N/A'}</p>
                  <p><strong>Academy ID:</strong> {debugData.academy?.id || 'N/A'}</p>
                  <p><strong>Subscription Count:</strong> {debugData.subscriptionCount}</p>
                  <p><strong>Bot Count:</strong> {debugData.botCount}</p>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Raw Data</summary>
                  <pre className="text-xs overflow-auto mt-2 p-2 bg-white rounded">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Raw Subscriptions */}
              {debugData.rawSubscriptions && debugData.rawSubscriptions.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold mb-2">📋 Raw Subscriptions from DB</h3>
                  {debugData.rawSubscriptions.map((sub: any, idx: number) => (
                    <div key={idx} className="mb-3 p-3 bg-white rounded border">
                      <p className="text-sm"><strong>ID:</strong> {sub.id}</p>
                      <p className="text-sm"><strong>Bot ID:</strong> {sub.botId}</p>
                      <p className="text-sm"><strong>Product ID:</strong> {sub.productId || 'N/A'}</p>
                      <p className="text-sm"><strong>Academy ID:</strong> {sub.academyId}</p>
                      <p className="text-sm"><strong>Total Slots:</strong> {sub.totalStudentSlots}</p>
                      <p className="text-sm"><strong>Used Slots:</strong> {sub.usedStudentSlots}</p>
                      <p className="text-sm"><strong>Remaining:</strong> {sub.remainingStudentSlots}</p>
                      <p className="text-sm"><strong>Start:</strong> {sub.subscriptionStart}</p>
                      <p className="text-sm"><strong>End:</strong> {sub.subscriptionEnd}</p>
                      <p className="text-sm"><strong>Active:</strong> {sub.isActive ? '✅' : '❌'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Bots */}
              {debugData.activeBots && debugData.activeBots.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold mb-2">🤖 Active Bots</h3>
                  {debugData.activeBots.map((bot: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 bg-white rounded border text-sm">
                      <p><strong>ID:</strong> {bot.id}</p>
                      <p><strong>Name:</strong> {bot.name}</p>
                      <p><strong>Active:</strong> {bot.isActive ? '✅' : '❌'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscriptions API Data */}
          {subscriptionData && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">✅ Subscriptions API Response</h3>
              <p className="text-sm mb-2"><strong>Count:</strong> {subscriptionData.count}</p>
              {subscriptionData.subscriptions && subscriptionData.subscriptions.length > 0 ? (
                subscriptionData.subscriptions.map((sub: any, idx: number) => (
                  <div key={idx} className="mb-3 p-3 bg-white rounded border">
                    <p className="text-sm"><strong>Bot ID:</strong> {sub.botId}</p>
                    <p className="text-sm"><strong>Bot Name:</strong> {sub.botName}</p>
                    <p className="text-sm"><strong>Academy:</strong> {sub.academyName}</p>
                    <p className="text-sm"><strong>Total Slots:</strong> {sub.totalSlots}</p>
                    <p className="text-sm"><strong>Remaining:</strong> {sub.remainingSlots}</p>
                    <p className="text-sm"><strong>Expires:</strong> {sub.expiresAt}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No subscriptions found</p>
              )}
            </div>
          )}

          {/* Bots API Data */}
          {botsData && (
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold mb-2">🤖 Bots API Response</h3>
              <p className="text-sm mb-2"><strong>Count:</strong> {botsData.count}</p>
              {botsData.bots && botsData.bots.length > 0 ? (
                botsData.bots.map((bot: any, idx: number) => (
                  <div key={idx} className="mb-2 p-2 bg-white rounded border text-sm">
                    <p><strong>ID:</strong> {bot.id}</p>
                    <p><strong>Name:</strong> {bot.name}</p>
                    <p><strong>Active:</strong> {bot.isActive ? '✅' : '❌'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No bots found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
