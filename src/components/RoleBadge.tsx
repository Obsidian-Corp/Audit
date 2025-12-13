import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  firm_administrator: "Admin",
  partner: "Partner",
  practice_leader: "Practice Leader",
  business_development: "BD",
  engagement_manager: "Manager",
  senior_auditor: "Senior",
  staff_auditor: "Staff",
  client_administrator: "Client Admin",
  client_user: "Client",
};

const roleColors: Record<AppRole, "default" | "secondary" | "destructive" | "outline"> = {
  firm_administrator: "destructive",
  partner: "destructive",
  practice_leader: "secondary",
  business_development: "secondary",
  engagement_manager: "secondary",
  senior_auditor: "default",
  staff_auditor: "default",
  client_administrator: "outline",
  client_user: "outline",
};

interface RoleBadgeProps {
  role: AppRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant={roleColors[role]} className={className}>
      {roleLabels[role]}
    </Badge>
  );
}
