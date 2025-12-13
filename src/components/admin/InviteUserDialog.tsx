import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPLOYEE_ROLES = [
  { value: 'partner', label: 'Partner' },
  { value: 'practice_leader', label: 'Practice Leader' },
  { value: 'engagement_manager', label: 'Engagement Manager' },
  { value: 'senior_auditor', label: 'Senior Auditor' },
  { value: 'staff_auditor', label: 'Staff Auditor' },
  { value: 'business_development', label: 'Business Development' },
];

const CLIENT_ROLES = [
  { value: 'client_administrator', label: 'Client Administrator' },
  { value: 'client_user', label: 'Client User' },
];

const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Please select a role'),
  department: z.string().optional(),
  companyName: z.string().optional(),
  clientId: z.string().optional(),
});

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    department: '',
    companyName: '',
    clientId: '',
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, client_name')
        .order('client_name');
      return data || [];
    },
    enabled: open,
  });

  const isClientRole = formData.role === 'client_administrator' || formData.role === 'client_user';
  const isEmployeeRole = EMPLOYEE_ROLES.some(r => r.value === formData.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      const validated = invitationSchema.parse(formData);
      setLoading(true);

      if (isEmployeeRole) {
        // Create employee invitation
        const { data, error } = await supabase.rpc('create_employee_invitation', {
          p_email: validated.email,
          p_first_name: validated.firstName,
          p_last_name: validated.lastName,
          p_role: validated.role as any,
          p_department: validated.department || null,
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to create invitation');

        const invitationLink = `${window.location.origin}/auth/accept-invite/${data.token}`;

        toast({
          title: 'Employee Invitation Sent!',
          description: (
            <div className="space-y-2">
              <p>Invitation sent to {validated.email}</p>
              <div className="text-xs">
                <p className="font-medium mb-1">Invitation Link (expires in 7 days):</p>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {invitationLink}
                </code>
              </div>
            </div>
          ),
          duration: 10000,
        });
      } else if (isClientRole) {
        // Create client invitation
        const { data, error } = await supabase.rpc('create_client_invitation', {
          p_email: validated.email,
          p_first_name: validated.firstName,
          p_last_name: validated.lastName,
          p_company_name: validated.companyName || '',
          p_role: validated.role as any,
          p_client_id: validated.clientId || null,
          p_engagement_id: null,
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to create invitation');

        const invitationLink = `${window.location.origin}/client-portal/accept-invite/${data.token}`;

        toast({
          title: 'Client Invitation Sent!',
          description: (
            <div className="space-y-2">
              <p>Client portal invitation sent to {validated.email}</p>
              <div className="text-xs">
                <p className="font-medium mb-1">Invitation Link (expires in 14 days):</p>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {invitationLink}
                </code>
              </div>
            </div>
          ),
          duration: 10000,
        });
      }

      // Reset form and close dialog
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        department: '',
        companyName: '',
        clientId: '',
      });
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your firm or client portal. They'll receive a secure link to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-sm font-semibold">Employee Roles</div>
                {EMPLOYEE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-sm font-semibold border-t mt-2">Client Portal Roles</div>
                {CLIENT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isEmployeeRole
                ? 'Firm employee - Full platform access'
                : isClientRole
                ? 'Client portal access only - Limited to engagements'
                : 'Select the appropriate role'}
            </p>
          </div>

          {isEmployeeRole && (
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                placeholder="e.g., Audit, Tax, Advisory"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                disabled={loading}
              />
            </div>
          )}

          {isClientRole && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Client company name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Existing Client (Optional)</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Link to existing client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
