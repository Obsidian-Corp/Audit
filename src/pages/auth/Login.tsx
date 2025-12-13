import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ParticleBackground from '@/components/ParticleBackground';
import { Shield } from 'lucide-react';
import { z } from 'zod';
import obsidianLogo from '@/assets/obsidian-logo.svg';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = loginSchema.parse({ email, password });
      setLoading(true);

      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Obsidian Platform</title>
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
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-300">
                Enter your credentials to access your account
              </CardDescription>
            </div>
          </CardHeader>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 border-t-2 border-slate-700 bg-slate-800/50 p-6">
            <Link to="/auth/forgot-password" className="text-sm text-slate-300 hover:text-primary transition-colors font-medium">
              Forgot your password?
            </Link>
            <div className="text-sm text-slate-300">
              Need access? Contact your firm administrator for an invitation.
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
