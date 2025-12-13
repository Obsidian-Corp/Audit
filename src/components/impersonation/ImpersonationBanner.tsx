import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImpersonation } from '@/hooks/useImpersonation';

export function ImpersonationBanner() {
  const { session, endImpersonation, isImpersonating } = useImpersonation();
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(session.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        endImpersonation('timeout');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, endImpersonation]);

  if (!session || !isImpersonating) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full ml-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-amber-900">
            Impersonating: {session.target_name}
          </span>
          <span className="text-sm text-amber-700">
            Type: {session.target_type === 'organization' ? 'Organization' : 'User'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Clock className="h-3 w-3" />
            <span>Expires in {timeRemaining}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => endImpersonation('manual')}
            className="border-amber-300 hover:bg-amber-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
