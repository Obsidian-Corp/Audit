import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import obsidianLogo from '@/assets/obsidian-logo.svg';

const acceptanceSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_invitation_details', {
        p_token: token,
      });

      if (error) throw error;

      if (!data.success) {
        setError(data.error || 'Invalid invitation');
        return;
      }

      if (data.is_expired) {
        setError('This invitation has expired');
        return;
      }

      if (data.is_accepted) {
        setError('This invitation has already been accepted');
        return;
      }

      setInvitation(data);

      // Pre-fill names if available
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      acceptanceSchema.parse(formData);
      setSubmitting(true);

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName || invitation.first_name,
            last_name: formData.lastName || invitation.last_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Wait for profile creation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Accept the invitation (this assigns role and firm)
      const { data: acceptData, error: acceptError } = await supabase.rpc(
        'accept_employee_invitation',
        {
          p_token: token,
          p_password: formData.password,
          p_first_name: formData.firstName || invitation.first_name || null,
          p_last_name: formData.lastName || invitation.last_name || null,
        }
      );

      if (acceptError) throw acceptError;

      if (!acceptData.success) {
        throw new Error(acceptData.error || 'Failed to accept invitation');
      }

      toast({
        title: 'Welcome to the team!',
        description: `You've successfully joined ${invitation.firm_name}`,
      });

      // Navigate to dashboard
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
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading invitation...</p>
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
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-center">Invalid Invitation</CardTitle>
              <CardDescription className="text-center">
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
        <title>Accept Invitation | Obsidian Platform</title>
      </Helmet>

      <ParticleBackground />

      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900 border-2 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <CardHeader className="space-y-6 border-b-2 border-slate-700">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <img src={obsidianLogo} alt="Obsidian" className="h-10 w-auto" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-center font-semibold tracking-tight text-white">
                You've Been Invited!
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-200">
                Join <span className="font-bold text-primary">{invitation.firm_name}</span> as{' '}
                <span className="font-bold text-primary capitalize">{invitation.role.replace(/_/g, ' ')}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-800 border-2 border-slate-700 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-white">Invitation Details</span>
                </div>
                <div className="text-sm space-y-1 pl-7">
                  <p>
                    <span className="text-slate-300">Email:</span>{' '}
                    <span className="font-semibold text-white">{invitation.email}</span>
                  </p>
                  <p>
                    <span className="text-slate-300">Role:</span>{' '}
                    <span className="font-semibold text-white capitalize">
                      {invitation.role.replace(/_/g, ' ')}
                    </span>
                  </p>
                  {invitation.department && (
                    <p>
                      <span className="text-slate-300">Department:</span>{' '}
                      <span className="font-semibold text-white">{invitation.department}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={submitting}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={submitting}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Create Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full h-11 font-medium" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining {invitation.firm_name}...
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
        </Card>
      </div>
    </>
  );
}
