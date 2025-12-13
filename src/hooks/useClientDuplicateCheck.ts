/**
 * Client Duplicate Validation Hook
 * Addresses ISSUE-006: Add client duplicate validation
 *
 * Checks for potential duplicate clients before creation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PotentialDuplicate {
  id: string;
  client_name: string;
  industry: string | null;
  website: string | null;
  fiscal_year_end: string | null;
  matchScore: number;
  matchReasons: string[];
}

export interface DuplicateCheckResult {
  hasPotentialDuplicates: boolean;
  duplicates: PotentialDuplicate[];
  isLoading: boolean;
}

/**
 * Check for duplicate clients based on name, website, and other attributes
 */
export function useClientDuplicateCheck(
  clientName: string,
  website?: string,
  firmId?: string,
  enabled: boolean = true
): DuplicateCheckResult {
  const { data, isLoading } = useQuery({
    queryKey: ['client-duplicate-check', clientName, website, firmId],
    queryFn: async () => {
      if (!clientName || clientName.trim().length < 3) {
        return [];
      }

      // Query for potential duplicates
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, client_name, industry, website, fiscal_year_end')
        .eq('firm_id', firmId || '')
        .neq('status', 'archived');

      if (error) {
        console.error('Error checking for duplicates:', error);
        return [];
      }

      // Calculate match scores for each client
      const potentialDuplicates: PotentialDuplicate[] = [];

      for (const client of clients || []) {
        const matchReasons: string[] = [];
        let matchScore = 0;

        // Exact name match (case-insensitive)
        if (client.client_name.toLowerCase() === clientName.toLowerCase()) {
          matchScore += 100;
          matchReasons.push('Exact name match');
        }
        // Similar name (contains or is contained)
        else if (
          client.client_name.toLowerCase().includes(clientName.toLowerCase()) ||
          clientName.toLowerCase().includes(client.client_name.toLowerCase())
        ) {
          matchScore += 80;
          matchReasons.push('Similar name');
        }
        // Name similarity using Levenshtein-like logic
        else {
          const similarity = calculateSimilarity(
            client.client_name.toLowerCase(),
            clientName.toLowerCase()
          );
          if (similarity > 0.7) {
            matchScore += Math.floor(similarity * 60);
            matchReasons.push('Very similar name');
          } else if (similarity > 0.5) {
            matchScore += Math.floor(similarity * 40);
            matchReasons.push('Somewhat similar name');
          }
        }

        // Website match
        if (website && client.website) {
          const cleanWebsite1 = cleanURL(website);
          const cleanWebsite2 = cleanURL(client.website);
          if (cleanWebsite1 === cleanWebsite2) {
            matchScore += 50;
            matchReasons.push('Same website');
          }
        }

        // Only include if match score is significant
        if (matchScore >= 50) {
          potentialDuplicates.push({
            ...client,
            matchScore,
            matchReasons,
          });
        }
      }

      // Sort by match score (highest first)
      return potentialDuplicates.sort((a, b) => b.matchScore - a.matchScore);
    },
    enabled: enabled && !!clientName && clientName.trim().length >= 3,
    staleTime: 30000, // 30 seconds
  });

  return {
    hasPotentialDuplicates: (data?.length || 0) > 0,
    duplicates: data || [],
    isLoading,
  };
}

/**
 * Calculate similarity between two strings (0-1 scale)
 * Simple algorithm based on common characters
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Tokenize and compare words
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let commonWords = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word1 === word2)) {
      commonWords++;
    }
  }

  const similarity = (2 * commonWords) / (words1.length + words2.length);
  return similarity;
}

/**
 * Clean and normalize URL for comparison
 */
function cleanURL(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '') // Remove protocol and www
    .replace(/\/$/, '') // Remove trailing slash
    .trim();
}

/**
 * Validate client uniqueness (throws error if duplicate found)
 */
export async function validateClientUniqueness(
  clientName: string,
  firmId: string,
  website?: string
): Promise<{ isUnique: boolean; duplicateId?: string; message?: string }> {
  // Check for exact name match
  const { data: exactMatch, error } = await supabase
    .from('clients')
    .select('id, client_name')
    .eq('firm_id', firmId)
    .ilike('client_name', clientName)
    .neq('status', 'archived')
    .limit(1);

  if (error) {
    console.error('Error validating client uniqueness:', error);
    return { isUnique: true }; // Allow creation if check fails
  }

  if (exactMatch && exactMatch.length > 0) {
    return {
      isUnique: false,
      duplicateId: exactMatch[0].id,
      message: `A client with the name "${exactMatch[0].client_name}" already exists.`
    };
  }

  // Check for website match if provided
  if (website) {
    const cleanedWebsite = cleanURL(website);
    const { data: websiteMatches } = await supabase
      .from('clients')
      .select('id, client_name, website')
      .eq('firm_id', firmId)
      .neq('status', 'archived');

    if (websiteMatches) {
      for (const client of websiteMatches) {
        if (client.website && cleanURL(client.website) === cleanedWebsite) {
          return {
            isUnique: false,
            duplicateId: client.id,
            message: `A client "${client.client_name}" with the same website already exists.`
          };
        }
      }
    }
  }

  return { isUnique: true };
}
