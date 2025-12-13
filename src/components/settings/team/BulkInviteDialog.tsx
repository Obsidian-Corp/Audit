import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CsvUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  isValid: boolean;
  errors: string[];
}

const VALID_ROLES = [
  'partner',
  'practice_leader',
  'business_development',
  'engagement_manager',
  'senior_auditor',
  'staff_auditor',
];

export function BulkInviteDialog({ open, onOpenChange }: BulkInviteDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvUsers, setCsvUsers] = useState<CsvUser[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const downloadTemplate = () => {
    const csvContent = [
      'email,firstName,lastName,role,department',
      'john.doe@example.com,John,Doe,senior_auditor,Audit',
      'jane.smith@example.com,Jane,Smith,staff_auditor,Tax',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-invite-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUser = (user: Partial<CsvUser>): CsvUser => {
    const errors: string[] = [];

    if (!user.email || !validateEmail(user.email)) {
      errors.push('Invalid email address');
    }
    if (!user.firstName || user.firstName.trim().length === 0) {
      errors.push('First name is required');
    }
    if (!user.lastName || user.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }
    if (!user.role || !VALID_ROLES.includes(user.role.toLowerCase())) {
      errors.push(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    return {
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role?.toLowerCase() || '',
      department: user.department,
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseCsv = (content: string): CsvUser[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIndex = headers.indexOf('email');
    const firstNameIndex = headers.findIndex(h => h.includes('first'));
    const lastNameIndex = headers.findIndex(h => h.includes('last'));
    const roleIndex = headers.indexOf('role');
    const departmentIndex = headers.indexOf('department');

    if (emailIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1 || roleIndex === -1) {
      throw new Error('CSV must contain email, firstName, lastName, and role columns');
    }

    const users: CsvUser[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const user = validateUser({
        email: values[emailIndex],
        firstName: values[firstNameIndex],
        lastName: values[lastNameIndex],
        role: values[roleIndex],
        department: departmentIndex !== -1 ? values[departmentIndex] : undefined,
      });
      users.push(user);
    }

    return users;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const users = parseCsv(content);
        setCsvUsers(users);
        toast({
          title: "CSV parsed",
          description: `Found ${users.length} users. Review and send invitations.`,
        });
      } catch (error: any) {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSendInvitations = async () => {
    const validUsers = csvUsers.filter(u => u.isValid);
    if (validUsers.length === 0) {
      toast({
        title: "No valid users",
        description: "Please fix validation errors before sending invitations",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress({ total: validUsers.length, success: 0, failed: 0 });

    let successCount = 0;
    let failCount = 0;

    for (const user of validUsers) {
      try {
        const { data, error } = await supabase.rpc('create_employee_invitation', {
          p_email: user.email,
          p_first_name: user.firstName,
          p_last_name: user.lastName,
          p_role: user.role,
          p_department: user.department || null,
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Failed to create invitation');
        }

        successCount++;
      } catch (error) {
        console.error(`Failed to invite ${user.email}:`, error);
        failCount++;
      }

      setUploadProgress({ total: validUsers.length, success: successCount, failed: failCount });
    }

    setIsProcessing(false);

    toast({
      title: "Bulk invitation complete",
      description: `Successfully invited ${successCount} users. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      variant: failCount > 0 ? "destructive" : "default",
    });

    if (successCount > 0) {
      setTimeout(() => {
        handleReset();
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleReset = () => {
    setCsvUsers([]);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = csvUsers.filter(u => u.isValid).length;
  const invalidCount = csvUsers.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        handleReset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk User Invitation</DialogTitle>
          <DialogDescription>
            Upload a CSV file to invite multiple users at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Download */}
          {csvUsers.length === 0 && (
            <div className="text-center space-y-4">
              <div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Fill out the template with user information
                </p>
              </div>

              {/* File Upload */}
              <div
                className="border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> email, firstName, lastName, role
                  <br />
                  <strong>Optional columns:</strong> department
                  <br />
                  <strong>Valid roles:</strong> {VALID_ROLES.join(', ')}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Preview Table */}
          {csvUsers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{validCount} Valid</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium">{invalidCount} Invalid</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {user.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <div className="text-xs text-destructive">
                                {user.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={user.isValid ? "secondary" : "destructive"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Progress */}
          {uploadProgress && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Sending invitations: {uploadProgress.success} / {uploadProgress.total} completed
                {uploadProgress.failed > 0 && ` (${uploadProgress.failed} failed)`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          {csvUsers.length > 0 && (
            <Button
              onClick={handleSendInvitations}
              disabled={isProcessing || validCount === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send ${validCount} Invitation${validCount !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
