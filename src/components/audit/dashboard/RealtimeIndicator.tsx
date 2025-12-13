import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Monitor channel status
    const channel = supabase.channel('connection-monitor');
    
    channel
      .on('system', { event: 'connected' }, () => {
        setIsConnected(true);
        setLastUpdate(new Date());
      })
      .on('system', { event: 'disconnected' }, () => {
        setIsConnected(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant={isConnected ? 'default' : 'destructive'} 
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            Live
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </Badge>
      {isConnected && (
        <span className="text-muted-foreground">
          Updated: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
