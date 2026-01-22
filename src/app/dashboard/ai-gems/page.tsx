'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gems } from '@/lib/gems/data';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIGemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Gems
          </h1>
          <p className="text-muted-foreground mt-1">
            목적에 맞는 전문 AI 어시스턴트를 선택하세요
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          8개 전문 봇
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {gems.map((gem) => (
          <Link key={gem.id} href={`/dashboard/ai-gems/${gem.id}`}>
            <Card className={`hover:shadow-lg transition-shadow cursor-pointer h-full bg-gradient-to-br ${gem.bgGradient} border-2 hover:border-${gem.color}-300`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-5xl mb-2">{gem.icon}</div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="text-xl">{gem.name}</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  {gem.nameEn}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{gem.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Gems란?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>AI Gems</strong>는 Google Gemini의 특화된 봇 기능입니다. 각 Gem은 특정 역할에 최적화되어 있어
            더 전문적이고 맞춤화된 도움을 받을 수 있습니다.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">✨</span>
              <span><strong>전문화된 응답:</strong> 각 분야에 특화된 전문가 수준의 답변</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <span><strong>목적별 최적화:</strong> 학습, 작문, 수학 등 목적에 맞는 도움</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">💬</span>
              <span><strong>독립적인 대화:</strong> 각 Gem마다 별도의 대화 히스토리 유지</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
