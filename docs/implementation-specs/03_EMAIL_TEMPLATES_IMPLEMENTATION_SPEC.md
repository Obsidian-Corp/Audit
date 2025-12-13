# Email Template Management - Implementation Specification

**Module**: Email Templates
**Priority**: MEDIUM
**Estimated Effort**: 2 weeks
**Status**: NOT STARTED

---

## Technical Architecture

### Database Schema

#### Step 1: Create Email Template Tables

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_email_templates.sql`

```sql
-- Email Templates
CREATE TABLE IF NOT EXISTS platform_admin.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('transactional', 'billing', 'security', 'platform', 'marketing')),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Template Versions (for rollback)
CREATE TABLE IF NOT EXISTS platform_admin.email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES platform_admin.email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version)
);

-- Email Sent Log
CREATE TABLE IF NOT EXISTS public.email_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Email Analytics
CREATE TABLE IF NOT EXISTS platform_admin.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT,
  date DATE DEFAULT CURRENT_DATE,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  UNIQUE(template_key, date)
);

-- Create indexes
CREATE INDEX idx_email_templates_key ON platform_admin.email_templates(template_key);
CREATE INDEX idx_email_templates_category ON platform_admin.email_templates(category);
CREATE INDEX idx_email_sent_log_recipient ON email_sent_log(recipient_email);
CREATE INDEX idx_email_sent_log_template ON email_sent_log(template_key);
CREATE INDEX idx_email_sent_log_sent_at ON email_sent_log(sent_at);
CREATE INDEX idx_email_analytics_template_date ON platform_admin.email_analytics(template_key, date);

-- RLS Policies
ALTER TABLE platform_admin.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.email_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage email templates"
  ON platform_admin.email_templates FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view template versions"
  ON platform_admin.email_template_versions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));
```

#### Step 2: Seed Default Templates

```sql
-- Insert default email templates
INSERT INTO platform_admin.email_templates (template_key, category, subject, html_body, text_body, variables, is_system) VALUES

-- Transactional
('welcome_email', 'transactional', 'Welcome to {{platform.name}}!',
'<html><body><h1>Welcome {{user.name}}!</h1><p>Thanks for joining {{platform.name}}.</p></body></html>',
'Welcome {{user.name}}! Thanks for joining {{platform.name}}.',
'["user.name", "user.email", "platform.name", "platform.url"]'::jsonb,
true),

('password_reset', 'transactional', 'Reset Your Password',
'<html><body><h1>Password Reset</h1><p>Click here to reset: <a href="{{reset.url}}">Reset Password</a></p></body></html>',
'Password Reset: {{reset.url}}',
'["user.name", "reset.url", "reset.expires"]'::jsonb,
true),

-- Billing
('payment_successful', 'billing', 'Payment Received - Thank You!',
'<html><body><h1>Payment Successful</h1><p>Amount: {{payment.amount}}</p></body></html>',
'Payment successful for {{payment.amount}}',
'["user.name", "payment.amount", "payment.date", "invoice.url"]'::jsonb,
true),

('payment_failed', 'billing', 'Payment Failed - Action Required',
'<html><body><h1>Payment Failed</h1><p>Your payment of {{payment.amount}} failed. Please update your payment method.</p></body></html>',
'Payment failed for {{payment.amount}}. Please update payment method.',
'["user.name", "payment.amount", "failure.reason", "update.url"]'::jsonb,
true),

('trial_expiring', 'billing', 'Your Trial Expires in {{trial.days_left}} Days',
'<html><body><h1>Trial Expiring Soon</h1><p>Your trial expires in {{trial.days_left}} days.</p></body></html>',
'Your trial expires in {{trial.days_left}} days.',
'["user.name", "trial.days_left", "upgrade.url"]'::jsonb,
true),

-- Security
('suspicious_login', 'security', 'Unusual Login Detected',
'<html><body><h1>Unusual Login</h1><p>Location: {{login.location}}<br>Time: {{login.time}}</p></body></html>',
'Unusual login from {{login.location}} at {{login.time}}',
'["user.name", "login.location", "login.time", "login.ip"]'::jsonb,
true);
```

---

## Edge Functions

### Step 3: Email Sending Function

#### Function: send-email

**File**: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

serve(async (req) => {
  try {
    const { templateKey, to, variables } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    // Render template with variables
    const subject = renderTemplate(template.subject, variables);
    const htmlBody = renderTemplate(template.html_body, variables);
    const textBody = renderTemplate(template.text_body, variables);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Platform <noreply@platform.com>',
      to,
      subject,
      html: htmlBody,
      text: textBody,
    });

    if (error) throw error;

    // Log sent email
    await supabase
      .from('email_sent_log')
      .insert({
        template_key: templateKey,
        recipient_email: to,
        subject,
        status: 'sent',
        provider_message_id: data.id,
        metadata: { variables },
      });

    // Update analytics
    await supabase.rpc('increment_email_analytics', {
      _template_key: templateKey,
      _metric: 'sent_count',
    });

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function renderTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return '';

  return template.replace(/\{\{(\w+\.?\w+)\}\}/g, (match, key) => {
    const keys = key.split('.');
    let value: any = variables;

    for (const k of keys) {
      value = value?.[k];
    }

    return value !== undefined && value !== null ? String(value) : match;
  });
}
```

---

## Frontend Components

### Step 4: Email Template Manager

#### Component 1: Email Template Manager

**File**: `src/components/platform-admin/EmailTemplateManager.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Mail, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateEditor } from './EmailTemplateEditor';

export function EmailTemplateManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('template_key', { ascending: true });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredTemplates = templates?.filter(template =>
    template.template_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      transactional: 'bg-blue-100 text-blue-800',
      billing: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      platform: 'bg-purple-100 text-purple-800',
      marketing: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Templates</CardTitle>
            <Button onClick={() => { setSelectedTemplate(null); setEditorOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
          <div className="pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="transactional">Transactional</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="platform">Platform</TabsTrigger>
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTemplates?.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{template.template_key}</span>
                      <Badge className={getCategoryColor(template.category)} variant="secondary">
                        {template.category}
                      </Badge>
                      {template.is_system && (
                        <Badge variant="outline">System</Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold">{template.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Version {template.version} • Last updated {new Date(template.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmailTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
      />
    </>
  );
}
```

#### Component 2: Email Template Editor

**File**: `src/components/platform-admin/EmailTemplateEditor.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Send, Eye } from 'lucide-react';

interface EmailTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null;
}

export function EmailTemplateEditor({ open, onOpenChange, template }: EmailTemplateEditorProps) {
  const [templateKey, setTemplateKey] = useState('');
  const [category, setCategory] = useState('transactional');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (template) {
      setTemplateKey(template.template_key);
      setCategory(template.category);
      setSubject(template.subject);
      setHtmlBody(template.html_body);
      setTextBody(template.text_body);
      setVariables(template.variables || []);
    } else {
      // Reset for new template
      setTemplateKey('');
      setCategory('transactional');
      setSubject('');
      setHtmlBody('');
      setTextBody('');
      setVariables([]);
    }
  }, [template]);

  const availableVariables = [
    'user.name',
    'user.email',
    'org.name',
    'platform.name',
    'platform.url',
    'action.url',
    'date',
  ];

  const insertVariable = (variable: string) => {
    setHtmlBody(prev => prev + `{{${variable}}}`);
  };

  const renderPreview = (content: string) => {
    let rendered = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    return rendered;
  };

  const handleSave = async () => {
    // TODO: Implement save logic
    console.log('Saving template...', {
      templateKey,
      category,
      subject,
      htmlBody,
      textBody,
      variables,
    });
  };

  const handleSendTest = async () => {
    // TODO: Implement test email send
    console.log('Sending test email...');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-key">Template Key</Label>
              <Input
                id="template-key"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                placeholder="welcome_email"
                disabled={!!template?.is_system}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Welcome to {{platform.name}}!"
            />
          </div>

          {/* Editor Tabs */}
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder="<html><body>...</body></html>"
                rows={15}
                className="font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Plain text version..."
                rows={15}
              />
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click to insert variables into your template:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => insertVariable(variable)}
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-2">Test Data for Preview:</p>
                  <div className="space-y-2">
                    {availableVariables.map((variable) => (
                      <div key={variable} className="grid grid-cols-2 gap-2">
                        <Label className="text-sm">{variable}</Label>
                        <Input
                          size={1}
                          value={previewData[variable] || ''}
                          onChange={(e) => setPreviewData({
                            ...previewData,
                            [variable]: e.target.value,
                          })}
                          placeholder={`Enter ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Subject:</Label>
                      <p className="font-semibold">{renderPreview(subject)}</p>
                    </div>
                    <div>
                      <Label>HTML Body:</Label>
                      <div
                        className="border rounded p-4 mt-2"
                        dangerouslySetInnerHTML={{ __html: renderPreview(htmlBody) }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSendTest}>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation Checklist

### Phase 1: Database (Week 1, Days 1-2)
- [ ] Create email templates migration
- [ ] Seed default templates
- [ ] Test template rendering

### Phase 2: Backend (Week 1, Days 3-5)
- [ ] Create send-email function
- [ ] Integrate with Resend
- [ ] Test email sending

### Phase 3: Frontend (Week 2)
- [ ] EmailTemplateManager component
- [ ] EmailTemplateEditor component
- [ ] Preview functionality
- [ ] Test email sending from UI
- [ ] Email analytics dashboard

---

## Success Criteria

- [ ] Platform admins can create/edit templates
- [ ] Templates support variable substitution
- [ ] Preview works correctly
- [ ] Test emails can be sent
- [ ] Analytics track email performance
