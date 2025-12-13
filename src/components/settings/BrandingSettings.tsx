import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Upload, X, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BrandingSettings() {
  const { toast } = useToast();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    logoUrl: '',
  });

  useEffect(() => {
    if (currentOrg?.settings) {
      setFormData({
        primaryColor: currentOrg.settings.primary_color || '#3b82f6',
        secondaryColor: currentOrg.settings.secondary_color || '#10b981',
        accentColor: currentOrg.settings.accent_color || '#f59e0b',
        logoUrl: currentOrg.settings.logo_url || '',
      });
    }
  }, [currentOrg]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, or SVG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrg?.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('firm-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, create it (for development)
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: "Storage bucket may need to be configured",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('firm-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logoUrl: urlData.publicUrl });

      toast({
        title: "Logo uploaded",
        description: "Don't forget to save your changes",
      });
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
  };

  const handleSave = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('firms')
        .update({
          settings: {
            ...currentOrg.settings,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            accent_color: formData.accentColor,
            logo_url: formData.logoUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrg.id);

      if (error) throw error;

      toast({
        title: "Branding updated",
        description: "Your branding settings have been saved successfully",
      });

      refreshOrganizations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save branding settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle>Logo</CardTitle>
          </div>
          <CardDescription>
            Upload your organization's logo to appear on reports and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Organization logo"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Recommended: 512x512px PNG with transparent background
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  {formData.logoUrl && (
                    <Button
                      variant="ghost"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              <Alert>
                <AlertDescription>
                  Your logo will appear on engagement letters, reports, and email communications. For best results, use a square image with transparent background.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Color Palette</CardTitle>
          </div>
          <CardDescription>
            Customize the colors used throughout your organization's interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Color */}
            <div className="space-y-3">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons, links, and primary actions
              </p>
            </div>

            {/* Secondary Color */}
            <div className="space-y-3">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-3">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#10b981"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for success states and confirmations
              </p>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  placeholder="#f59e0b"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for highlights and warnings
              </p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="border rounded-lg p-6">
            <h4 className="font-medium mb-4">Preview</h4>
            <div className="flex gap-3">
              <Button style={{ backgroundColor: formData.primaryColor, borderColor: formData.primaryColor }}>
                Primary Button
              </Button>
              <Button
                variant="outline"
                style={{ color: formData.secondaryColor, borderColor: formData.secondaryColor }}
              >
                Secondary Button
              </Button>
              <Button
                variant="outline"
                style={{ color: formData.accentColor, borderColor: formData.accentColor }}
              >
                Accent Button
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              These colors will be applied to your reports, email templates, and client-facing documents. Ensure sufficient contrast for readability.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </div>
  );
}
