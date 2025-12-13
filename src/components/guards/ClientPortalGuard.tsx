import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientPortalGuardProps {
  children: React.ReactNode;
}

export function ClientPortalGuard({ children }: ClientPortalGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isClientUser, setIsClientUser] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkClientAccess();
  }, []);

  const checkClientAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setIsClientUser(false);
        setIsChecking(false);
        return;
      }

      // Check if user has client_administrator or client_user role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['client_administrator', 'client_user']);

      if (rolesError) {
        console.error('Error checking client roles:', rolesError);
        setIsClientUser(false);
      } else {
        setIsClientUser(roles && roles.length > 0);
      }
    } catch (error) {
      console.error('Error in client portal guard:', error);
      setIsClientUser(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isClientUser) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access the client portal.',
      variant: 'destructive',
    });
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
