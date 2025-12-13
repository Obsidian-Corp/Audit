-- Create email template for firm invitations
-- This template will be used to send branded invitation emails to firm administrators

INSERT INTO platform_admin.email_templates (
  template_key,
  category,
  subject,
  html_body,
  text_body,
  variables,
  is_active,
  is_system
) VALUES (
  'firm_invitation',
  'platform',
  'Welcome to Obsidian - Set Up Your Firm Account',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Obsidian</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #334155; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 2px solid #334155;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid #60a5fa;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
                </svg>
              </div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Obsidian
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                Enterprise Audit Platform
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #ffffff;">
                You''ve Been Invited to Join Obsidian
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                Hello {{admin_first_name}} {{admin_last_name}},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                You have been selected to set up and administer <strong style="color: #60a5fa;">{{firm_name}}</strong> on the Obsidian platform. As a Firm Administrator, you will have full control over your organization''s audit operations, team management, and client engagements.
              </p>

              <!-- Key Features Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background: #1e293b; border: 2px solid #334155; border-radius: 8px; padding: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 1px;">
                      What You''ll Get Access To
                    </h3>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #cbd5e1; font-size: 15px; line-height: 1.8;">
                      <li style="margin-bottom: 8px;">Complete audit management suite</li>
                      <li style="margin-bottom: 8px;">Team collaboration tools</li>
                      <li style="margin-bottom: 8px;">Client portal management</li>
                      <li style="margin-bottom: 8px;">Advanced reporting and analytics</li>
                      <li style="margin-bottom: 8px;">Enterprise-grade security and compliance</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{invitation_url}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; border: 2px solid #60a5fa; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);">
                      Set Up Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #fca5a5;">
                      <strong style="color: #ef4444;">⚠️ Security Notice:</strong><br/>
                      This invitation expires in <strong>30 days</strong> ({{expires_at}}).
                      If you did not expect this invitation, please disregard this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                If the button above doesn''t work, copy and paste this link into your browser:<br/>
                <a href="{{invitation_url}}" style="color: #60a5fa; word-break: break-all;">{{invitation_url}}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #0f172a; border-top: 2px solid #334155;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; text-align: center;">
                This is an automated message from the Obsidian platform.
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569; text-align: center;">
                © 2025 Obsidian. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Welcome to Obsidian - Set Up Your Firm Account

Hello {{admin_first_name}} {{admin_last_name}},

You have been invited to set up and administer {{firm_name}} on the Obsidian platform.

As a Firm Administrator, you will have full control over your organization''s audit operations, team management, and client engagements.

WHAT YOU''LL GET ACCESS TO:
• Complete audit management suite
• Team collaboration tools
• Client portal management
• Advanced reporting and analytics
• Enterprise-grade security and compliance

SET UP YOUR ACCOUNT:
Click the link below to get started:
{{invitation_url}}

SECURITY NOTICE:
This invitation expires in 30 days ({{expires_at}}). If you did not expect this invitation, please disregard this email.

---
This is an automated message from the Obsidian platform.
© 2025 Obsidian. All rights reserved.',
  '["admin_first_name", "admin_last_name", "firm_name", "invitation_url", "expires_at"]'::jsonb,
  true,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  category = EXCLUDED.category,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  is_system = EXCLUDED.is_system,
  updated_at = now();
