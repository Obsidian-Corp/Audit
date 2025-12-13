-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the firm_invitations table to remove the default that uses gen_random_bytes
ALTER TABLE public.firm_invitations
  ALTER COLUMN token DROP DEFAULT;

-- The token will now be generated in the create_firm_invitation function instead
