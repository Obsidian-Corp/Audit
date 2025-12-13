import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Permission = string;

export const usePermission = (permission: Permission, resourceType?: string) => {
  const { hasPermission: checkPermission, user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkPerm = async () => {
      if (!user) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      const result = await checkPermission(permission, resourceType);
      
      if (mounted) {
        setHasPermission(result);
        setIsLoading(false);
      }
    };

    checkPerm();

    return () => {
      mounted = false;
    };
  }, [permission, resourceType, user]);

  return { hasPermission, isLoading };
};
