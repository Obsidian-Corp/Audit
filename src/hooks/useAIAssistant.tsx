import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestion {
  recommendation: 'APPROVE' | 'DENY' | 'DEFER';
  confidence: number;
  reasoning: string;
  riskFactors: string[];
}

export const useAIAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeRequest = async (requestId: string, requestType: string): Promise<AISuggestion | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-approval-assistant', {
        body: { requestId, requestType },
      });

      if (error) throw error;

      return data.suggestion;
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Unable to get AI recommendation at this time",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeRequest,
    isAnalyzing,
  };
};
