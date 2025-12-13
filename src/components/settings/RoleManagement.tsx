import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Users, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    category: string;
    actions: string[];
  }[];
  userCount: number;
}

const PREDEFINED_ROLES: Role[] = [
  {
    id: 'partner',
    name: 'Partner / Principal',
    description: 'Full access to all platform features including firm administration and financial management',
    permissions: [
      { category: 'Organization', actions: ['View', 'Edit', 'Delete'] },
      { category: 'Users', actions: ['View', 'Create', 'Edit', 'Delete', 'Invite'] },
      { category: 'Engagements', actions: ['View', 'Create', 'Edit', 'Delete', 'Approve'] },
      { category: 'Clients', actions: ['View', 'Create', 'Edit', 'Delete'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download', 'Delete'] },
      { category: 'Reports', actions: ['View', 'Create', 'Export'] },
      { category: 'Financials', actions: ['View', 'Edit'] },
    ],
    userCount: 3,
  },
  {
    id: 'practice_leader',
    name: 'Practice Leader',
    description: 'Manages practice area, team members, and engagements within their department',
    permissions: [
      { category: 'Organization', actions: ['View'] },
      { category: 'Users', actions: ['View', 'Invite'] },
      { category: 'Engagements', actions: ['View', 'Create', 'Edit', 'Approve'] },
      { category: 'Clients', actions: ['View', 'Create', 'Edit'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download'] },
      { category: 'Reports', actions: ['View', 'Create', 'Export'] },
      { category: 'Financials', actions: ['View'] },
    ],
    userCount: 5,
  },
  {
    id: 'engagement_manager',
    name: 'Engagement Manager',
    description: 'Manages specific engagements and supervises audit staff',
    permissions: [
      { category: 'Organization', actions: ['View'] },
      { category: 'Users', actions: ['View'] },
      { category: 'Engagements', actions: ['View', 'Create', 'Edit'] },
      { category: 'Clients', actions: ['View', 'Edit'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download'] },
      { category: 'Reports', actions: ['View', 'Create', 'Export'] },
      { category: 'Financials', actions: ['View'] },
    ],
    userCount: 8,
  },
  {
    id: 'senior_auditor',
    name: 'Senior Auditor',
    description: 'Performs audit work and reviews staff auditor work',
    permissions: [
      { category: 'Organization', actions: ['View'] },
      { category: 'Users', actions: ['View'] },
      { category: 'Engagements', actions: ['View', 'Edit'] },
      { category: 'Clients', actions: ['View'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download'] },
      { category: 'Reports', actions: ['View', 'Create'] },
    ],
    userCount: 12,
  },
  {
    id: 'staff_auditor',
    name: 'Staff Auditor',
    description: 'Performs audit procedures and creates work papers',
    permissions: [
      { category: 'Organization', actions: ['View'] },
      { category: 'Users', actions: ['View'] },
      { category: 'Engagements', actions: ['View'] },
      { category: 'Clients', actions: ['View'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download'] },
      { category: 'Reports', actions: ['View'] },
    ],
    userCount: 18,
  },
  {
    id: 'business_development',
    name: 'Business Development',
    description: 'Manages client relationships and new business opportunities',
    permissions: [
      { category: 'Organization', actions: ['View'] },
      { category: 'Users', actions: ['View'] },
      { category: 'Engagements', actions: ['View', 'Create'] },
      { category: 'Clients', actions: ['View', 'Create', 'Edit'] },
      { category: 'Documents', actions: ['View', 'Upload', 'Download'] },
      { category: 'Reports', actions: ['View'] },
    ],
    userCount: 2,
  },
];

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role & Permission Management
              </CardTitle>
              <CardDescription>
                Configure roles and permissions for your organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              These are predefined roles for audit firms. Each role has specific permissions that determine what users can access and do in the platform.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PREDEFINED_ROLES.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {role.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{role.userCount} users</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRole(role)}
                    >
                      View Permissions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permission Details Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedRole?.name} - Permissions
            </DialogTitle>
            <DialogDescription>
              {selectedRole?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{selectedRole?.userCount} users currently assigned this role</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource Category</TableHead>
                    <TableHead>Allowed Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRole?.permissions.map((perm) => (
                    <TableRow key={perm.category}>
                      <TableCell className="font-medium">{perm.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {perm.actions.map((action) => (
                            <Badge key={action} variant="secondary">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These are the default permissions for this role. Custom role creation and permission modification will be available in a future update.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
