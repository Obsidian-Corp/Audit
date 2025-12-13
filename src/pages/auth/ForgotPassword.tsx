import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';
import { Shield } from 'lucide-react';
import obsidianLogo from '@/assets/obsidian-logo.svg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | Obsidian Platform</title>
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
                Reset Password
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-300">
                {sent
                  ? 'Check your email for the reset link'
                  : 'Enter your email to receive a reset link'}
              </CardDescription>
            </div>
          </CardHeader>
          {!sent && (
            <>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="border-t-2 border-slate-700 bg-slate-800/50 p-6">
                <Link to="/auth/login" className="text-sm text-slate-300 hover:text-primary transition-colors w-full text-center font-medium">
                  Back to login
                </Link>
              </CardFooter>
            </>
          )}
          {sent && (
            <CardFooter className="flex flex-col space-y-3 border-t-2 border-slate-700 bg-slate-800/50 p-6">
              <Link to="/auth/login" className="w-full">
                <Button className="w-full h-11 font-medium">Return to Login</Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}
