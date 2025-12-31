-- Fix RLS policies for demo data visibility
-- This allows authenticated users to read clients in their firm

-- First, check if RLS is enabled on clients table
-- If so, add permissive policies

-- Drop existing policies if any exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view clients in their firm" ON clients;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;

-- Create a permissive SELECT policy for clients
CREATE POLICY "Users can view clients in their firm" 
ON clients FOR SELECT
TO authenticated
USING (
  firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  )
);

-- Also ensure profiles table has proper policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view profiles in their firm" ON profiles;
CREATE POLICY "Users can view profiles in their firm"
ON profiles FOR SELECT
TO authenticated
USING (
  firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  )
);
