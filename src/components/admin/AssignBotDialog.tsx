'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AssignBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  director: {
    id: string;
    name: string;
    email: string;
  };
  bot: {
    id: string;
    name: string;
    icon: string;
  };
  onSuccess: () => void;
}

export function AssignBotDialog({
  open,
  onOpenChange,
  director,
  bot,
  onSuccess,
}: AssignBotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<string>('months');
  const [permanent, setPermanent] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch('/api/admin/assign-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: director.id,
          botId: bot.id,
          duration: permanent ? null : duration,
          durationUnit: permanent ? null : durationUnit,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to assign bot');

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning bot:', error);
      alert(error.message || 'AI 봇 할당에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI 봇 할당</DialogTitle>
          <DialogDescription>
            {director.name} 학원장에게 "{bot.name}" 봇을 할당합니다
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permanent"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="permanent" className="text-sm font-normal cursor-pointer">
                영구 할당 (만료일 없음)
              </Label>
            </div>

            {!permanent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">기간</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    required={!permanent}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationUnit">단위</Label>
                  <Select value={durationUnit} onValueChange={setDurationUnit}>
                    <SelectTrigger id="durationUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">일</SelectItem>
                      <SelectItem value="weeks">주</SelectItem>
                      <SelectItem value="months">개월</SelectItem>
                      <SelectItem value="years">년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              {permanent ? (
                <p>✅ 이 봇은 <strong>영구적으로</strong> 할당됩니다</p>
              ) : (
                <p>
                  ⏰ 이 봇은 <strong>{duration} {
                    durationUnit === 'days' ? '일' :
                    durationUnit === 'weeks' ? '주' :
                    durationUnit === 'months' ? '개월' : '년'
                  }</strong> 동안 사용 가능합니다
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  할당 중...
                </>
              ) : (
                '할당하기'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
