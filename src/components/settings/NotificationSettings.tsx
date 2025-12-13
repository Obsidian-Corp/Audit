import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Bell, Mail, MessageSquare, Clock, Volume2 } from 'lucide-react';

export function NotificationSettings() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Email Notifications
    email_enabled: true,
    email_engagements: true,
    email_team_updates: true,
    email_client_activity: true,
    email_system_updates: true,
    email_security_alerts: true,
    email_weekly_digest: false,

    // In-App Notifications
    inapp_enabled: true,
    inapp_engagements: true,
    inapp_team_updates: true,
    inapp_client_activity: true,
    inapp_mentions: true,
    inapp_comments: true,

    // Push Notifications
    push_enabled: false,
    push_urgent_only: true,

    // Delivery Settings
    delivery_frequency: 'immediate',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',

    // Sound Settings
    sound_enabled: true,
  });

  useEffect(() => {
    if (currentOrg?.settings?.notifications) {
      setSettings({
        ...settings,
        ...currentOrg.settings.notifications,
      });
    }
  }, [currentOrg]);

  const handleSave = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('firms')
        .update({
          settings: {
            ...currentOrg.settings,
            notifications: settings,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrg.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Notification preferences have been updated.",
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

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled" className="text-base">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
            />
          </div>

          {settings.email_enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_engagements">Engagement Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      New engagements, status changes, and deadlines
                    </p>
                  </div>
                  <Switch
                    id="email_engagements"
                    checked={settings.email_engagements}
                    onCheckedChange={(checked) => updateSetting('email_engagements', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_team_updates">Team Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Team member assignments, completions, and updates
                    </p>
                  </div>
                  <Switch
                    id="email_team_updates"
                    checked={settings.email_team_updates}
                    onCheckedChange={(checked) => updateSetting('email_team_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_client_activity">Client Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Client logins, document uploads, and messages
                    </p>
                  </div>
                  <Switch
                    id="email_client_activity"
                    checked={settings.email_client_activity}
                    onCheckedChange={(checked) => updateSetting('email_client_activity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_system_updates">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Platform updates, new features, and maintenance
                    </p>
                  </div>
                  <Switch
                    id="email_system_updates"
                    checked={settings.email_system_updates}
                    onCheckedChange={(checked) => updateSetting('email_system_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_security_alerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Login attempts, password changes, and security notices
                    </p>
                  </div>
                  <Switch
                    id="email_security_alerts"
                    checked={settings.email_security_alerts}
                    onCheckedChange={(checked) => updateSetting('email_security_alerts', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_weekly_digest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary instead of individual emails
                    </p>
                  </div>
                  <Switch
                    id="email_weekly_digest"
                    checked={settings.email_weekly_digest}
                    onCheckedChange={(checked) => updateSetting('email_weekly_digest', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage notifications displayed within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp_enabled" className="text-base">Enable In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notification bell with alerts in the app
              </p>
            </div>
            <Switch
              id="inapp_enabled"
              checked={settings.inapp_enabled}
              onCheckedChange={(checked) => updateSetting('inapp_enabled', checked)}
            />
          </div>

          {settings.inapp_enabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp_engagements">Engagement Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates related to audits and engagements
                    </p>
                  </div>
                  <Switch
                    id="inapp_engagements"
                    checked={settings.inapp_engagements}
                    onCheckedChange={(checked) => updateSetting('inapp_engagements', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp_team_updates">Team Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Team member actions and updates
                    </p>
                  </div>
                  <Switch
                    id="inapp_team_updates"
                    checked={settings.inapp_team_updates}
                    onCheckedChange={(checked) => updateSetting('inapp_team_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp_client_activity">Client Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Messages and uploads from clients
                    </p>
                  </div>
                  <Switch
                    id="inapp_client_activity"
                    checked={settings.inapp_client_activity}
                    onCheckedChange={(checked) => updateSetting('inapp_client_activity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp_mentions">Mentions</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone mentions you in comments
                    </p>
                  </div>
                  <Switch
                    id="inapp_mentions"
                    checked={settings.inapp_mentions}
                    onCheckedChange={(checked) => updateSetting('inapp_mentions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp_comments">Comments & Replies</Label>
                    <p className="text-sm text-muted-foreground">
                      Replies to your comments and discussions
                    </p>
                  </div>
                  <Switch
                    id="inapp_comments"
                    checked={settings.inapp_comments}
                    onCheckedChange={(checked) => updateSetting('inapp_comments', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Browser Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive notifications even when the app is not open
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_enabled" className="text-base">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get browser notifications for important updates
              </p>
            </div>
            <Switch
              id="push_enabled"
              checked={settings.push_enabled}
              onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
            />
          </div>

          {settings.push_enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push_urgent_only">Urgent Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only receive push notifications for urgent items
                  </p>
                </div>
                <Switch
                  id="push_urgent_only"
                  checked={settings.push_urgent_only}
                  onCheckedChange={(checked) => updateSetting('push_urgent_only', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Delivery Preferences</CardTitle>
          </div>
          <CardDescription>
            Control when and how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="delivery_frequency">Notification Frequency</Label>
            <Select
              value={settings.delivery_frequency}
              onValueChange={(value) => updateSetting('delivery_frequency', value)}
            >
              <SelectTrigger id="delivery_frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate - As they happen</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest (9:00 AM)</SelectItem>
                <SelectItem value="weekly">Weekly Digest (Monday 9:00 AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quiet_hours_enabled" className="text-base">Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Mute non-urgent notifications during specific hours
                </p>
              </div>
              <Switch
                id="quiet_hours_enabled"
                checked={settings.quiet_hours_enabled}
                onCheckedChange={(checked) => updateSetting('quiet_hours_enabled', checked)}
              />
            </div>

            {settings.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_start">Start Time</Label>
                  <Select
                    value={settings.quiet_hours_start}
                    onValueChange={(value) => updateSetting('quiet_hours_start', value)}
                  >
                    <SelectTrigger id="quiet_hours_start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_end">End Time</Label>
                  <Select
                    value={settings.quiet_hours_end}
                    onValueChange={(value) => updateSetting('quiet_hours_end', value)}
                  >
                    <SelectTrigger id="quiet_hours_end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle>Sound Settings</CardTitle>
          </div>
          <CardDescription>
            Control notification sounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound_enabled" className="text-base">Notification Sounds</Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when you receive a notification
              </p>
            </div>
            <Switch
              id="sound_enabled"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
}
