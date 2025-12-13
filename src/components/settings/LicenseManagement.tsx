import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Users, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LicenseStats {
  total: number;
  used: number;
  available: number;
  byType: {
    fullUser: number;
    readOnly: number;
    clientPortal: number;
  };
}

export function LicenseManagement() {
  const { profile } = useAuth();

  // Fetch active users count
  const { data: users } = useQuery({
    queryKey: ['users-count', profile?.firm_id],
    queryFn: async () => {
      if (!profile?.firm_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('firm_id', profile.firm_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.firm_id,
  });

  // Fetch pending invitations count
  const { data: invitations } = useQuery({
    queryKey: ['pending-invitations-count', profile?.firm_id],
    queryFn: async () => {
      if (!profile?.firm_id) return [];

      const { data, error } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('firm_id', profile.firm_id)
        .is('accepted_at', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.firm_id,
  });

  // Mock license data (would come from subscription info in production)
  const licenseStats: LicenseStats = {
    total: 50,
    used: (users?.length || 0) + (invitations?.length || 0),
    available: 50 - ((users?.length || 0) + (invitations?.length || 0)),
    byType: {
      fullUser: users?.length || 0,
      readOnly: 0,
      clientPortal: 0,
    },
  };

  const usagePercentage = (licenseStats.used / licenseStats.total) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 90;

  return (
    <div className="space-y-6">
      {/* License Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{licenseStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Professional plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Licenses Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{licenseStats.used}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users?.length || 0} active + {invitations?.length || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{licenseStats.available}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((licenseStats.available / licenseStats.total) * 100)}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>License Usage</CardTitle>
          <CardDescription>
            Track license allocation across your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Usage</span>
              <span className="text-muted-foreground">
                {licenseStats.used} / {licenseStats.total} ({Math.round(usagePercentage)}%)
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={
                isAtLimit ? "bg-red-100 [&>div]:bg-red-600" :
                isNearLimit ? "bg-orange-100 [&>div]:bg-orange-600" :
                "bg-green-100 [&>div]:bg-green-600"
              }
            />
          </div>

          {isNearLimit && (
            <Alert variant={isAtLimit ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isAtLimit
                  ? "You are approaching your license limit. Consider upgrading your plan to invite more users."
                  : "You are using over 80% of your available licenses. Plan to upgrade soon."
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline">View Pricing</Button>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* License Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>License Types</CardTitle>
          <CardDescription>
            Distribution of licenses by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead className="text-right">Cost per User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge>Full User</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Complete access to create and edit engagements, manage documents
                </TableCell>
                <TableCell>
                  <span className="font-medium">{licenseStats.byType.fullUser}</span>
                  <span className="text-muted-foreground ml-1">/ {licenseStats.total}</span>
                </TableCell>
                <TableCell className="text-right font-medium">$49/mo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Read-Only</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  View-only access to engagements and reports
                </TableCell>
                <TableCell>
                  <span className="font-medium">{licenseStats.byType.readOnly}</span>
                  <span className="text-muted-foreground ml-1">/ {licenseStats.total}</span>
                </TableCell>
                <TableCell className="text-right font-medium">$19/mo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Client Portal</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  External client access to their documents and communications
                </TableCell>
                <TableCell>
                  <span className="font-medium">{licenseStats.byType.clientPortal}</span>
                  <span className="text-muted-foreground ml-1">/ Unlimited</span>
                </TableCell>
                <TableCell className="text-right font-medium">Free</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              License types are automatically assigned based on user roles. Full User licenses are assigned to Partners, Managers, and Auditors. Read-Only licenses can be assigned to administrative staff or observers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>
            License usage over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { month: 'November 2025', users: licenseStats.used, change: '+2' },
              { month: 'October 2025', users: licenseStats.used - 2, change: '+3' },
              { month: 'September 2025', users: licenseStats.used - 5, change: '-1' },
              { month: 'August 2025', users: licenseStats.used - 4, change: '+5' },
              { month: 'July 2025', users: licenseStats.used - 9, change: '+2' },
              { month: 'June 2025', users: licenseStats.used - 11, change: '+1' },
            ].map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{item.users} users</span>
                  <Badge variant={item.change.startsWith('+') ? 'default' : 'secondary'} className="w-16 justify-center">
                    {item.change}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
