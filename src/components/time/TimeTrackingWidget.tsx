/**
 * ==================================================================
 * TIME TRACKING WIDGET
 * ==================================================================
 * Omnipresent time tracking widget for tracking billable hours
 * ==================================================================
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Play, Square, Pause } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';

type TimerStatus = 'idle' | 'running' | 'paused';

interface TimeEntry {
  id: string;
  description: string;
  engagementId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  status: TimerStatus;
}

export function TimeTrackingWidget() {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedEngagement, setSelectedEngagement] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = new Date();
    setStatus('running');
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    setStatus('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    setStatus('running');
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    setStatus('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Save time entry (in a real app, this would go to the database)
    if (elapsed > 0) {
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        description: description || 'Untitled',
        engagementId: selectedEngagement || undefined,
        startTime: startTimeRef.current!,
        endTime: new Date(),
        duration: elapsed,
        status: 'idle',
      };
      console.log('Time entry saved:', entry);
      // TODO: Save to database
    }

    setElapsed(0);
    setDescription('');
    startTimeRef.current = null;
  }, [elapsed, description, selectedEngagement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={status === 'running' ? 'default' : 'ghost'}
          size="sm"
          className={status === 'running' ? 'animate-pulse' : ''}
        >
          <Clock className="h-4 w-4 mr-2" />
          {status === 'idle' ? (
            'Track Time'
          ) : (
            <span className="font-mono">{formatTime(elapsed)}</span>
          )}
          {status === 'running' && (
            <Badge variant="secondary" className="ml-2 h-2 w-2 p-0 rounded-full bg-green-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">
              {formatTime(elapsed)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {status === 'idle' && 'Ready to track'}
              {status === 'running' && 'Timer running'}
              {status === 'paused' && 'Timer paused'}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {status === 'idle' && (
              <Button onClick={startTimer} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            )}
            {status === 'running' && (
              <>
                <Button onClick={pauseTimer} variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopTimer} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            {status === 'paused' && (
              <>
                <Button onClick={resumeTimer} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button onClick={stopTimer} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Engagement</Label>
            <Select value={selectedEngagement} onValueChange={setSelectedEngagement}>
              <SelectTrigger>
                <SelectValue placeholder="Select engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No engagement</SelectItem>
                {/* TODO: Load engagements from context/props */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TimeTrackingWidget;
