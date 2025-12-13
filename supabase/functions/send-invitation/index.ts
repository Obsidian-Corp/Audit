import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  roles: string[];
  organizationName: string;
  invitedBy: string;
  token: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "send-invitation",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const {
      email,
      roles,
      organizationName,
      invitedBy,
      token,
      message,
    }: InvitationRequest = await req.json();

    console.log("Sending invitation to:", email);

    // Determine accept URL based on invitation type
    const isPlatformAdmin = roles.includes("Platform Administrator");
    const acceptPath = isPlatformAdmin 
      ? `/platform-admin/accept-invite/${token}`
      : `/auth/join/${token}`;
    const acceptUrl = `${req.headers.get("origin")}${acceptPath}`;

    const emailResponse = await resend.emails.send({
      from: "Obsidian Platform <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .header h1 {
                color: white;
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e5e5;
                border-top: none;
              }
              .roles {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .role-badge {
                display: inline-block;
                background: #D4AF37;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                margin: 4px;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: #D4AF37;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 600;
              }
              .button:hover {
                background: #C5A028;
              }
              .message {
                background: #f0f7ff;
                border-left: 4px solid #D4AF37;
                padding: 15px;
                margin: 20px 0;
                font-style: italic;
              }
              .footer {
                color: #666;
                font-size: 12px;
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 You're Invited!</h1>
            </div>
            <div class="content">
              <p><strong>${invitedBy}</strong> has invited you to join <strong>${organizationName}</strong> on the Obsidian Platform.</p>
              
              <div class="roles">
                <p style="margin-top: 0;"><strong>Your assigned roles:</strong></p>
                ${roles.map(role => `<span class="role-badge">${role}</span>`).join('')}
              </div>

              ${message ? `<div class="message">"${message}"</div>` : ''}

              <p>Click the button below to accept your invitation and create your account:</p>
              
              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>

              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${acceptUrl}</p>

              <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Obsidian Platform. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
