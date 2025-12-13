import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from '@/hooks/useUsers';
import { UserPlus, Search, Upload, Users as UsersIcon, Clock } from 'lucide-react';
import { InviteUserDialog } from './team/InviteUserDialog';
import { PendingInvitations } from './team/PendingInvitations';
import { ActiveUsersTable } from './team/ActiveUsersTable';
import { BulkInviteDialog } from './team/BulkInviteDialog';

export function TeamManagement() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const { data: users, isLoading } = useUsers();

  const activeUsers = users?.filter(u => u.status === 'active') || [];
  const inactiveUsers = users?.filter(u => u.status === 'inactive') || [];

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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Invite and manage team members, track pending invitations, and control user access
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkInviteDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Invite
              </Button>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{inactiveUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{invitations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Active Users / Pending Invitations */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Active Users ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Invitations ({invitations?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ActiveUsersTable users={users} searchTerm={searchTerm} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="pending">
          <PendingInvitations />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
      <BulkInviteDialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen} />
    </div>
  );
}
