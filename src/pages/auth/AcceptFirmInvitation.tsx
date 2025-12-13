import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';
import { Shield, Loader2, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import obsidianLogo from '@/assets/obsidian-logo.svg';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.object({
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AcceptFirmInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_firm_invitation_details', {
        p_token: token,
      });

      if (error) throw error;

      if (!data.success) {
        setError(data.error || 'Invalid invitation');
        return;
      }

      setInvitation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse({ password, confirmPassword });
      setSubmitting(true);

      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.admin_email,
        password: password,
        options: {
          data: {
            first_name: invitation.admin_first_name,
            last_name: invitation.admin_last_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      // Step 2: Auto-confirm email (they proved ownership by clicking invitation link)
      const { error: confirmError } = await supabase.rpc('confirm_invited_user_email', {
        p_user_id: userId,
      });

      if (confirmError) {
        console.error('Failed to auto-confirm email:', confirmError);
        // Don't throw - let them confirm manually if this fails
      }

      // Step 3: Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Complete firm signup using secure function
      const { data: signupResult, error: signupError } = await supabase.rpc(
        'complete_firm_administrator_signup',
        {
          p_user_id: userId,
          p_firm_name: invitation.firm_name,
          p_firm_type: invitation.firm_type,
          p_country: '', // Will be filled in settings later
          p_city: '', // Will be filled in settings later
          p_specializations: [], // Will be filled in settings later
          p_first_name: invitation.admin_first_name || '',
          p_last_name: invitation.admin_last_name || '',
          p_email: invitation.admin_email,
          p_job_title: invitation.admin_job_title || 'Managing Partner',
          p_phone: '', // Will be filled in settings later
        }
      );

      if (signupError || (signupResult && !signupResult.success)) {
        throw new Error(
          signupResult?.error || signupError?.message || 'Firm creation failed'
        );
      }

      // Step 5: Mark invitation as accepted
      const { error: markError } = await supabase.rpc('mark_firm_invitation_accepted', {
        p_token: token,
        p_firm_id: signupResult.firm_id,
      });

      if (markError) {
        console.error('Failed to mark invitation as accepted:', markError);
      }

      toast({
        title: 'Welcome to Obsidian!',
        description: `${invitation.firm_name} has been successfully set up.`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Failed to accept invitation',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Invitation | Obsidian Platform</title>
        </Helmet>
        <ParticleBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-2 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-slate-300">Loading invitation...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Invalid Invitation | Obsidian Platform</title>
        </Helmet>
        <ParticleBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-2 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-center text-white">Invalid Invitation</CardTitle>
              <CardDescription className="text-center text-slate-300">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Accept Firm Invitation | Obsidian Platform</title>
      </Helmet>

      <ParticleBackground />

      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900 border-2 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <CardHeader className="space-y-6 border-b-2 border-slate-700">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <img src={obsidianLogo} alt="Obsidian" className="h-12 w-auto" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl text-center font-semibold tracking-tight text-white">
                You've Been Invited!
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-200">
                Set up your firm administrator account for{' '}
                <span className="font-bold text-primary">{invitation.firm_name}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-800 border-2 border-slate-700 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-white">Firm Details</span>
                </div>
                <div className="text-sm space-y-1 pl-7">
                  <p>
                    <span className="text-slate-300">Firm Name:</span>{' '}
                    <span className="font-semibold text-white">{invitation.firm_name}</span>
                  </p>
                  <p>
                    <span className="text-slate-300">Your Email:</span>{' '}
                    <span className="font-semibold text-white">{invitation.admin_email}</span>
                  </p>
                  <p>
                    <span className="text-slate-300">Your Role:</span>{' '}
                    <span className="font-semibold text-white">Firm Administrator</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Create Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="Min. 12 characters"
                />
                <p className="text-xs text-slate-400">
                  Must be at least 12 characters for security
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full h-11 font-medium" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up {invitation.firm_name}...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Accept & Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <div className="border-t-2 border-slate-700 bg-slate-800/50 p-6">
            <p className="text-sm text-center text-slate-300">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary hover:text-primary/90 transition-colors font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
