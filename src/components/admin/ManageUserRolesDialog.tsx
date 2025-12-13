import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUserDetails, useUpdateUserRoles } from '@/hooks/useUsers';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Briefcase } from 'lucide-react';

interface ManageUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const ROLE_CATEGORIES = {
  leadership: {
    title: 'Leadership & Administration',
    icon: Shield,
    roles: [
      { value: 'firm_administrator', label: 'Firm Administrator', description: 'Full system access and configuration' },
      { value: 'partner', label: 'Partner', description: 'Firm leadership and strategic oversight' },
      { value: 'practice_leader', label: 'Practice Leader', description: 'Practice area management' },
    ],
  },
  operations: {
    title: 'Operations & Delivery',
    icon: Briefcase,
    roles: [
      { value: 'engagement_manager', label: 'Engagement Manager', description: 'Lead and manage client audits' },
      { value: 'senior_auditor', label: 'Senior Auditor', description: 'Execute audits and supervise staff' },
      { value: 'staff_auditor', label: 'Staff Auditor', description: 'Execute assigned audit procedures' },
    ],
  },
  business: {
    title: 'Business Development',
    icon: Users,
    roles: [
      { value: 'business_development', label: 'Business Development', description: 'Client acquisition and CRM' },
    ],
  },
};

export function ManageUserRolesDialog({ open, onOpenChange, userId }: ManageUserRolesDialogProps) {
  const { data: user, isLoading } = useUserDetails(userId);
  const updateRoles = useUpdateUserRoles();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user?.user_roles) {
      // Get only internal roles (exclude client roles)
      const internalRoles = user.user_roles
        .filter(r => !r.role.startsWith('client_'))
        .map(r => r.role);
      setSelectedRoles(internalRoles);
    }
  }, [user]);

  const handleRoleToggle = (role: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const currentRoles = user.user_roles
      .filter(r => !r.role.startsWith('client_'))
      .map(r => r.role);

    const rolesToAdd = selectedRoles
      .filter(r => !currentRoles.includes(r))
      .map(r => ({ role: r }));

    const rolesToRemove = currentRoles.filter(r => !selectedRoles.includes(r));

    await updateRoles.mutateAsync({
      userId,
      rolesToAdd,
      rolesToRemove,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            {user?.full_name && (
              <span>
                Managing roles for <strong>{user.full_name}</strong> ({user.email})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Current Client Roles (if any) */}
            {user?.user_roles?.some(r => r.role.startsWith('client_')) && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Client Roles (Read-Only)</Label>
                <div className="flex flex-wrap gap-2">
                  {user.user_roles
                    .filter(r => r.role.startsWith('client_'))
                    .map((ur, index) => (
                      <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                        {ur.role.replace('_', ' ')}
                        {ur.clients && <span className="ml-1">({ur.clients.client_name})</span>}
                      </Badge>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Client roles are managed separately and cannot be modified here
                </p>
                <Separator className="my-4" />
              </div>
            )}

            {/* Internal Roles */}
            <div className="space-y-6">
              {Object.entries(ROLE_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">{category.title}</Label>
                    </div>
                    <div className="space-y-3 pl-6">
                      {category.roles.map((role) => (
                        <div key={role.value} className="flex items-start space-x-3">
                          <Checkbox
                            id={role.value}
                            checked={selectedRoles.includes(role.value)}
                            onCheckedChange={(checked) =>
                              handleRoleToggle(role.value, checked as boolean)
                            }
                          />
                          <div className="grid gap-1 leading-none">
                            <label
                              htmlFor={role.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {role.label}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRoles.length === 0 && (
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> This user will have no internal roles. They will only have access if they have client roles assigned.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateRoles.isPending || isLoading}>
            {updateRoles.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
