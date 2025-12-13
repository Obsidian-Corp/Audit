import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, Phone, Mail, MapPin, FileText, Plus, Trash2 } from "lucide-react";

export function OrganizationSettings() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    settings: {
      // Basic Settings
      fiscal_year_end: '',
      primary_currency: 'USD',
      timezone: 'UTC',
      compliance_frameworks: [] as string[],

      // Contact Information
      primary_phone: '',
      primary_email: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',

      // Legal Information
      legal_name: '',
      tax_id: '',
      registration_number: '',
      incorporation_date: '',
      business_type: '',

      // Operational Settings
      business_hours_start: '09:00',
      business_hours_end: '17:00',
      retention_policy_years: 7,

      // Office Locations
      offices: [] as Array<{
        id: string;
        name: string;
        address: string;
        is_primary: boolean;
      }>,
    }
  });

  useEffect(() => {
    if (currentOrg) {
      const settings = currentOrg.settings || {};
      setFormData({
        name: currentOrg.name || '',
        slug: currentOrg.slug || '',
        settings: {
          // Basic Settings
          fiscal_year_end: settings.fiscal_year_end || '',
          primary_currency: settings.primary_currency || 'USD',
          timezone: settings.timezone || 'UTC',
          compliance_frameworks: settings.compliance_frameworks || [],

          // Contact Information
          primary_phone: settings.primary_phone || '',
          primary_email: settings.primary_email || '',
          website: settings.website || '',
          address_line1: settings.address_line1 || '',
          address_line2: settings.address_line2 || '',
          city: settings.city || '',
          state: settings.state || '',
          postal_code: settings.postal_code || '',
          country: settings.country || '',

          // Legal Information
          legal_name: settings.legal_name || '',
          tax_id: settings.tax_id || '',
          registration_number: settings.registration_number || '',
          incorporation_date: settings.incorporation_date || '',
          business_type: settings.business_type || '',

          // Operational Settings
          business_hours_start: settings.business_hours_start || '09:00',
          business_hours_end: settings.business_hours_end || '17:00',
          retention_policy_years: settings.retention_policy_years || 7,

          // Office Locations
          offices: settings.offices || [],
        }
      });
    }
  }, [currentOrg]);

  const addOffice = () => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        offices: [
          ...formData.settings.offices,
          {
            id: crypto.randomUUID(),
            name: '',
            address: '',
            is_primary: formData.settings.offices.length === 0,
          }
        ]
      }
    });
  };

  const removeOffice = (id: string) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        offices: formData.settings.offices.filter(office => office.id !== id)
      }
    });
  };

  const updateOffice = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        offices: formData.settings.offices.map(office =>
          office.id === id ? { ...office, [field]: value } : office
        )
      }
    });
  };

  const handleSave = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('firms')
        .update({
          name: formData.name,
          settings: formData.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrg.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Organization settings have been updated successfully.",
      });

      refreshOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>
            Core organization details and identification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <Input
                id="org-slug"
                value={formData.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Slug cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal-year">Fiscal Year End</Label>
              <Input
                id="fiscal-year"
                type="date"
                value={formData.settings.fiscal_year_end}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, fiscal_year_end: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Primary Currency</Label>
              <Select
                value={formData.settings.primary_currency}
                onValueChange={(value) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, primary_currency: value }
                })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.settings.timezone}
                onValueChange={(value) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, timezone: value }
                })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frameworks">Compliance Frameworks</Label>
              <Input
                id="frameworks"
                value={formData.settings.compliance_frameworks.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    compliance_frameworks: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                  }
                })}
                placeholder="SOX, IFRS, GAAP, GDPR, ISO 27001"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Contact Information</CardTitle>
          </div>
          <CardDescription>
            Primary contact details for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-phone">Primary Phone</Label>
              <Input
                id="primary-phone"
                type="tel"
                value={formData.settings.primary_phone}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, primary_phone: e.target.value }
                })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-email">Primary Email</Label>
              <Input
                id="primary-email"
                type="email"
                value={formData.settings.primary_email}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, primary_email: e.target.value }
                })}
                placeholder="contact@organization.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.settings.website}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, website: e.target.value }
                })}
                placeholder="https://www.organization.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={formData.settings.address_line1}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, address_line1: e.target.value }
                })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={formData.settings.address_line2}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, address_line2: e.target.value }
                })}
                placeholder="Suite 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.settings.city}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, city: e.target.value }
                })}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.settings.state}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, state: e.target.value }
                })}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal">Postal Code</Label>
              <Input
                id="postal"
                value={formData.settings.postal_code}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, postal_code: e.target.value }
                })}
                placeholder="10001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.settings.country}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, country: e.target.value }
                })}
                placeholder="United States"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Legal Information</CardTitle>
          </div>
          <CardDescription>
            Legal entity details and registration information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal-name">Legal Entity Name</Label>
              <Input
                id="legal-name"
                value={formData.settings.legal_name}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, legal_name: e.target.value }
                })}
                placeholder="Acme Audit Firm, LLC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-type">Business Type</Label>
              <Select
                value={formData.settings.business_type}
                onValueChange={(value) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, business_type: value }
                })}
              >
                <SelectTrigger id="business-type">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llc">Limited Liability Company (LLC)</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID / EIN</Label>
              <Input
                id="tax-id"
                value={formData.settings.tax_id}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, tax_id: e.target.value }
                })}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration">Registration Number</Label>
              <Input
                id="registration"
                value={formData.settings.registration_number}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, registration_number: e.target.value }
                })}
                placeholder="Registration or license number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incorporation-date">Incorporation Date</Label>
              <Input
                id="incorporation-date"
                type="date"
                value={formData.settings.incorporation_date}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, incorporation_date: e.target.value }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Operational Settings</CardTitle>
          </div>
          <CardDescription>
            Business hours and operational policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hours-start">Business Hours Start</Label>
              <Input
                id="hours-start"
                type="time"
                value={formData.settings.business_hours_start}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, business_hours_start: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-end">Business Hours End</Label>
              <Input
                id="hours-end"
                type="time"
                value={formData.settings.business_hours_end}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, business_hours_end: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Document Retention (Years)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="99"
                value={formData.settings.retention_policy_years}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, retention_policy_years: parseInt(e.target.value) || 7 }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Office Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Office Locations</CardTitle>
              </div>
              <CardDescription>
                Manage multiple office locations for your organization
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addOffice}>
              <Plus className="h-4 w-4 mr-2" />
              Add Office
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.settings.offices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No office locations added yet</p>
              <p className="text-sm mt-1">Click "Add Office" to add your first location</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.settings.offices.map((office, index) => (
                <div key={office.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Office {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOffice(office.id)}
                      disabled={office.is_primary}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Office Name</Label>
                      <Input
                        value={office.name}
                        onChange={(e) => updateOffice(office.id, 'name', e.target.value)}
                        placeholder="Main Office, Regional Office, etc."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address</Label>
                      <Textarea
                        value={office.address}
                        onChange={(e) => updateOffice(office.id, 'address', e.target.value)}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                  </div>
                  {office.is_primary && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Primary office location
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
