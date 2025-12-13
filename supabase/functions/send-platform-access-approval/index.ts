import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  company_name: string;
  request_id: string;
  invitation_token?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "send-platform-access-approval",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { email, company_name, request_id, invitation_token }: ApprovalEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const appUrl = Deno.env.get("VITE_SUPABASE_URL")?.replace(".supabase.co", "") || "https://app.obsidian.com";
    const invitationLink = invitation_token 
      ? `${appUrl}/auth/join/${invitation_token}`
      : `${appUrl}/auth/create-organization`;

    // Send approval email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Obsidian Platform <noreply@obsidian.com>",
        to: [email],
        subject: "Platform Access Approved - Welcome to Obsidian",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  line-height: 1.6;
                  color: #e5e7eb;
                  background-color: #000000;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 40px 20px;
                }
                .header {
                  text-align: center;
                  padding: 40px 0;
                  border-bottom: 1px solid #1f2937;
                }
                .logo {
                  font-size: 24px;
                  font-weight: 700;
                  color: #3b82f6;
                  font-family: monospace;
                }
                .content {
                  padding: 40px 0;
                }
                .title {
                  font-size: 28px;
                  font-weight: 600;
                  margin-bottom: 16px;
                  color: #f9fafb;
                }
                .message {
                  font-size: 16px;
                  color: #9ca3af;
                  margin-bottom: 32px;
                }
                .cta-button {
                  display: inline-block;
                  padding: 16px 32px;
                  background-color: #3b82f6;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  transition: background-color 0.2s;
                }
                .cta-button:hover {
                  background-color: #2563eb;
                }
                .info-box {
                  background-color: #111827;
                  border: 1px solid #1f2937;
                  border-radius: 8px;
                  padding: 24px;
                  margin: 32px 0;
                }
                .info-label {
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: #6b7280;
                  margin-bottom: 8px;
                }
                .info-value {
                  font-size: 16px;
                  font-family: monospace;
                  color: #f9fafb;
                }
                .footer {
                  text-align: center;
                  padding: 32px 0;
                  border-top: 1px solid #1f2937;
                  color: #6b7280;
                  font-size: 14px;
                }
                .button-container {
                  text-align: center;
                  margin: 32px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">OBSIDIAN</div>
                </div>
                
                <div class="content">
                  <h1 class="title">Access Approved</h1>
                  
                  <p class="message">
                    Congratulations! Your platform access request has been approved by our team.
                  </p>
                  
                  <div class="info-box">
                    <div class="info-label">Company</div>
                    <div class="info-value">${company_name}</div>
                  </div>
                  
                  <p class="message">
                    You can now create your organization and start building on Obsidian's connected intelligence platform.
                  </p>
                  
                  <div class="button-container">
                    <a href="${invitationLink}" class="cta-button">
                      Create Your Organization
                    </a>
                  </div>
                  
                  <p class="message" style="font-size: 14px; color: #6b7280;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <span style="color: #3b82f6; font-family: monospace;">${invitationLink}</span>
                  </p>
                </div>
                
                <div class="footer">
                  <p>
                    This is an automated message from Obsidian Platform.<br>
                    If you didn't request platform access, please ignore this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval email sent successfully",
        emailId: emailData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-platform-access-approval:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});