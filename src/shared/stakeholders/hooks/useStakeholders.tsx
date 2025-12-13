import { useState, useEffect } from 'react';
import { StakeholderService } from '../StakeholderService';
import { Stakeholder, StakeholderFilter } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useStakeholders(filter: StakeholderFilter = {}) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStakeholders = async () => {
    setIsLoading(true);
    const list = await StakeholderService.listStakeholders(filter);
    setStakeholders(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStakeholders();
  }, [JSON.stringify(filter)]);

  const createStakeholder = async (stakeholder: Partial<Stakeholder>) => {
    const result = await StakeholderService.createStakeholder(stakeholder);
    if (result) {
      toast({
        title: 'Stakeholder created',
        description: 'The stakeholder has been successfully added.',
      });
      loadStakeholders();
      return result;
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create stakeholder.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStakeholder = async (id: string, updates: Partial<Stakeholder>) => {
    const result = await StakeholderService.updateStakeholder(id, updates);
    if (result) {
      toast({
        title: 'Stakeholder updated',
        description: 'The stakeholder has been successfully updated.',
      });
      loadStakeholders();
      return result;
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update stakeholder.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteStakeholder = async (id: string) => {
    const success = await StakeholderService.deleteStakeholder(id);
    if (success) {
      toast({
        title: 'Stakeholder deleted',
        description: 'The stakeholder has been successfully removed.',
      });
      loadStakeholders();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete stakeholder.',
        variant: 'destructive',
      });
    }
  };

  return {
    stakeholders,
    isLoading,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    refresh: loadStakeholders,
  };
}
