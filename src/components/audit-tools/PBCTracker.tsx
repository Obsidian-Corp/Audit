/**
 * ==================================================================
 * PBC (PROVIDED BY CLIENT) TRACKER
 * ==================================================================
 * Manage client document requests and track status
 * - Add/Edit PBC items
 * - Track status (pending, received, overdue)
 * - Priority levels
 * - Due date management
 * - Email reminders (future)
 * ==================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { usePBCItems, useCreatePBCItem, useUpdatePBCItem } from '@/hooks/useAuditTools';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PBCTrackerProps {
  engagementId: string;
}

export function PBCTracker({ engagementId }: PBCTrackerProps) {
  const { toast } = useToast();
  const { data: pbcItems, isLoading } = usePBCItems(engagementId);
  const createItem = useCreatePBCItem();
  const updateItem = useUpdatePBCItem();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  // Reset form
  const resetForm = () => {
    setItemName('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
  };

  // Handle create
  const handleCreate = async () => {
    if (!itemName || !dueDate) {
      toast({
        title: 'Validation Error',
        description: 'Please provide item name and due date',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createItem.mutateAsync({
        engagement_id: engagementId,
        item_name: itemName,
        description,
        due_date: dueDate,
        priority,
        status: 'pending',
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create PBC item',
        variant: 'destructive',
      });
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateItem.mutateAsync({
        id,
        updates: { status: newStatus },
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';

    if (status === 'received') {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600',
      high: 'bg-orange-600',
      medium: 'bg-yellow-600',
      low: 'bg-blue-600',
    };

    return (
      <Badge className={colors[priority] || 'bg-gray-600'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: pbcItems?.length || 0,
    pending: pbcItems?.filter((i) => i.status === 'pending').length || 0,
    received: pbcItems?.filter((i) => i.status === 'received').length || 0,
    overdue: pbcItems?.filter((i) => {
      return i.status === 'pending' && new Date(i.due_date) < new Date();
    }).length || 0,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PBC Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PBC Tracker
            </CardTitle>
            <CardDescription>Track client-provided documents and information requests</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add PBC Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add PBC Item</DialogTitle>
                <DialogDescription>Create a new client document request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Bank Statements - December 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description of what is needed..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createItem.isPending}>
                  Create PBC Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.received}</div>
              <div className="text-xs text-muted-foreground mt-1">Received</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground mt-1">Overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for overdue items */}
        {stats.overdue > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
              <AlertCircle className="h-5 w-5" />
              {stats.overdue} Item{stats.overdue > 1 ? 's' : ''} Overdue
            </div>
            <p className="text-sm text-red-700">
              Please follow up with the client to obtain overdue documents.
            </p>
          </div>
        )}

        {/* PBC Items Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pbcItems || pbcItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No PBC items yet</p>
                    <p className="text-sm mt-2">Click "Add PBC Item" to create a document request</p>
                  </TableCell>
                </TableRow>
              ) : (
                pbcItems.map((item) => {
                  const isOverdue = new Date(item.due_date) < new Date() && item.status === 'pending';
                  return (
                    <TableRow key={item.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                      <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(item.due_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status, item.due_date)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleStatusUpdate(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
