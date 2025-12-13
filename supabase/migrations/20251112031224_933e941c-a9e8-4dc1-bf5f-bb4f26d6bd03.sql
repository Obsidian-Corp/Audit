-- Enable realtime for audit tables to support real-time dashboard updates

-- Enable REPLICA IDENTITY FULL for complete row data during updates
ALTER TABLE public.audits REPLICA IDENTITY FULL;
ALTER TABLE public.audit_findings REPLICA IDENTITY FULL;

-- Add audits table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.audits;

-- Add audit_findings table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_findings;