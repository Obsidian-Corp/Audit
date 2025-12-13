import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useCreateInformationRequest } from '@/hooks/useInformationRequests';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEngagementId?: string;
}

export function CreateRequestDialog({ open, onOpenChange, defaultEngagementId }: CreateRequestDialogProps) {
  const [formData, setFormData] = useState({
    engagement_id: defaultEngagementId || '',
    request_title: '',
    description: '',
    items_requested: [''],
    assigned_to: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const createRequest = useCreateInformationRequest();

  // Fetch active engagements
  const { data: engagements } = useQuery({
    queryKey: ['active-engagements-for-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('id, audit_title, audit_number, client_id, clients(id, client_name)')
        .in('workflow_status', ['active', 'fieldwork', 'planned'])
        .order('audit_title');

      if (error) throw error;
      return data;
    },
  });

  // Fetch client users for the selected engagement
  const { data: clientUsers } = useQuery({
    queryKey: ['client-users', formData.engagement_id],
    queryFn: async () => {
      if (!formData.engagement_id) return [];

      const engagement = engagements?.find(e => e.id === formData.engagement_id);
      if (!engagement?.client_id) return [];

      // Get client users with client_administrator or client_user roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles!user_roles_user_id_fkey(id, full_name, email)')
        .in('role', ['client_administrator', 'client_user']);

      if (error) throw error;
      return data.map(ur => ur.profiles);
    },
    enabled: !!formData.engagement_id && !!engagements,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredItems = formData.items_requested.filter(item => item.trim() !== '');

    const requestData = {
      ...formData,
      items_requested: filteredItems,
    };

    await createRequest.mutateAsync(requestData);

    // Reset form
    setFormData({
      engagement_id: defaultEngagementId || '',
      request_title: '',
      description: '',
      items_requested: [''],
      assigned_to: '',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
    });

    onOpenChange(false);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items_requested: [...formData.items_requested, ''],
    });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...formData.items_requested];
    newItems[index] = value;
    setFormData({
      ...formData,
      items_requested: newItems,
    });
  };

  const removeItem = (index: number) => {
    if (formData.items_requested.length > 1) {
      setFormData({
        ...formData,
        items_requested: formData.items_requested.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Information Request</DialogTitle>
          <DialogDescription>
            Request information or documents from the client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="engagement">Engagement *</Label>
            <Select
              value={formData.engagement_id}
              onValueChange={(value) => setFormData({ ...formData, engagement_id: value, assigned_to: '' })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select engagement" />
              </SelectTrigger>
              <SelectContent>
                {engagements?.map((engagement) => (
                  <SelectItem key={engagement.id} value={engagement.id}>
                    {engagement.clients.client_name} - {engagement.audit_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={formData.request_title}
              onChange={(e) => setFormData({ ...formData, request_title: e.target.value })}
              placeholder="e.g., Q1 2024 Access Control Documentation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about what you need and why..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items Requested *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items_requested.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder="e.g., Password policy document"
                    required={index === 0}
                  />
                  {formData.items_requested.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to (Client User)</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client user" />
                </SelectTrigger>
                <SelectContent>
                  {clientUsers?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select an engagement first to see client users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" disabled={createRequest.isPending}>
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={createRequest.isPending}
              onClick={() => setFormData({ ...formData, status: 'sent' as any })}
            >
              {createRequest.isPending ? 'Creating...' : 'Create & Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
