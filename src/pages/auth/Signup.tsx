import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ParticleBackground from '@/components/ParticleBackground';
import { Shield, Building2, User, CheckCircle2, ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import obsidianLogo from '@/assets/obsidian-logo.svg';

// Multi-step form schema
const firmInfoSchema = z.object({
  firmName: z.string().min(2, 'Firm name must be at least 2 characters'),
  firmType: z.enum(['solo', 'small', 'regional', 'national', 'international'], {
    required_error: 'Please select a firm type',
  }),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  practicingSince: z.string().optional(),
  partnerCount: z.string().optional(),
  staffCount: z.string().optional(),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
});

const userInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  jobTitle: z.string().min(1, 'Job title is required'),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const preferencesSchema = z.object({
  primaryUseCase: z.string().optional(),
  expectedTeamSize: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
});

type FirmInfo = z.infer<typeof firmInfoSchema>;
type UserInfo = z.infer<typeof userInfoSchema>;
type Preferences = z.infer<typeof preferencesSchema>;

const SPECIALIZATIONS = [
  'Financial Auditing',
  'IT Auditing',
  'Internal Auditing',
  'Compliance',
  'Risk Management',
  'Forensic Auditing',
  'Operational Auditing',
  'Quality Assurance',
];

const FIRM_TYPES = [
  { value: 'solo', label: 'Solo Practice' },
  { value: 'small', label: 'Small Firm (2-10)' },
  { value: 'regional', label: 'Regional Firm (11-50)' },
  { value: 'national', label: 'National Firm (51-200)' },
  { value: 'international', label: 'International Firm (200+)' },
];

const JOB_TITLES = [
  'Managing Partner',
  'Partner',
  'Practice Leader',
  'Engagement Manager',
  'Senior Auditor',
  'IT Manager',
  'Director',
  'Other',
];

const USE_CASES = [
  'Audit planning & execution',
  'Risk assessment',
  'Compliance management',
  'Quality control',
  'Client collaboration',
  'All of the above',
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [firmInfo, setFirmInfo] = useState<Partial<FirmInfo>>({
    specializations: [],
  });
  const [userInfo, setUserInfo] = useState<Partial<UserInfo>>({});
  const [preferences, setPreferences] = useState<Partial<Preferences>>({
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    try {
      if (step === 1) {
        firmInfoSchema.parse(firmInfo);
      } else if (step === 2) {
        userInfoSchema.parse(userInfo);
      }
      setStep(step + 1);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      preferencesSchema.parse(preferences);
      setLoading(true);

      // Step 1: Sign up the user first
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userInfo.email!,
        password: userInfo.password!,
        options: {
          data: {
            first_name: userInfo.firstName,
            last_name: userInfo.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      // Step 2: Wait for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Complete firm signup using secure function
      // This creates the firm, assigns the firm_administrator role, and updates profile
      const { data: signupResult, error: signupError } = await supabase.rpc(
        'complete_firm_administrator_signup',
        {
          p_user_id: userId,
          p_firm_name: firmInfo.firmName!,
          p_firm_type: firmInfo.firmType!,
          p_country: firmInfo.country!,
          p_city: firmInfo.city!,
          p_specializations: firmInfo.specializations!,
          p_first_name: userInfo.firstName!,
          p_last_name: userInfo.lastName!,
          p_email: userInfo.email!,
          p_job_title: userInfo.jobTitle!,
          p_phone: userInfo.phone!,
          p_partner_count: firmInfo.partnerCount ? parseInt(firmInfo.partnerCount) : 0,
          p_staff_count: firmInfo.staffCount ? parseInt(firmInfo.staffCount) : 0,
          p_practicing_since: firmInfo.practicingSince ? new Date(firmInfo.practicingSince).toISOString() : null,
          p_primary_use_case: preferences.primaryUseCase || null,
          p_expected_team_size: preferences.expectedTeamSize || null,
        }
      );

      if (signupError || (signupResult && !signupResult.success)) {
        throw new Error(
          signupResult?.error || signupError?.message || 'Firm creation failed'
        );
      }

      toast({
        title: 'Welcome to Obsidian!',
        description: 'Your account has been created successfully.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'An error occurred during registration',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    const current = firmInfo.specializations || [];
    if (current.includes(spec)) {
      setFirmInfo({
        ...firmInfo,
        specializations: current.filter((s) => s !== spec),
      });
    } else {
      setFirmInfo({
        ...firmInfo,
        specializations: [...current, spec],
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Firm Administrator Signup | Obsidian Platform</title>
      </Helmet>

      <ParticleBackground />

      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl bg-slate-900 border-2 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <CardHeader className="space-y-6 border-b-2 border-slate-700 pb-8">
            {/* Logo */}
            <div className="flex items-center justify-center">
              <img src={obsidianLogo} alt="Obsidian" className="h-12 w-auto" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl text-center font-semibold tracking-tight text-white">
                Create Your Firm Account
              </CardTitle>
              <CardDescription className="text-center text-base text-slate-300">
                For firm owners and administrators only
              </CardDescription>
            </div>
            <div className="bg-slate-800 border-2 border-slate-700 p-4">
              <p className="text-sm text-slate-200 text-center leading-relaxed">
                <span className="font-semibold text-white">Note:</span> This signup creates a new firm account.
                Firm employees should be invited by their administrator.{' '}
                <Link to="/auth/login" className="text-primary hover:text-primary/90 transition-colors font-semibold">
                  Already have an account?
                </Link>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-1.5 bg-slate-800" />
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Step {step} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between items-center px-8">
              <div className="flex flex-col items-center flex-1 gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    step >= 1
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-slate-800/50 text-slate-600 border-2 border-slate-700/50'
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${step >= 1 ? 'text-slate-200' : 'text-slate-500'}`}>
                  Firm Details
                </span>
              </div>
              <div className={`flex-1 h-px mx-4 transition-colors ${step >= 2 ? 'bg-primary/50' : 'bg-slate-700/50'}`} />
              <div className="flex flex-col items-center flex-1 gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    step >= 2
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-slate-800/50 text-slate-600 border-2 border-slate-700/50'
                  }`}
                >
                  {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${step >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>
                  Admin User
                </span>
              </div>
              <div className={`flex-1 h-px mx-4 transition-colors ${step >= 3 ? 'bg-primary/50' : 'bg-slate-700/50'}`} />
              <div className="flex flex-col items-center flex-1 gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    step >= 3
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-slate-800/50 text-slate-600 border-2 border-slate-700/50'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${step >= 3 ? 'text-slate-200' : 'text-slate-500'}`}>
                  Preferences
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-[500px] p-8">
            {/* Step 1: Firm Information */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in-50 duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100">
                      Firm Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="firmName">
                        Firm Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firmName"
                        placeholder="e.g., Smith & Associates Audit Firm"
                        value={firmInfo.firmName || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, firmName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firmType">
                        Firm Size <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={firmInfo.firmType}
                        onValueChange={(value: any) =>
                          setFirmInfo({ ...firmInfo, firmType: value })
                        }
                      >
                        <SelectTrigger id="firmType">
                          <SelectValue placeholder="Select firm size" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIRM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="country"
                        placeholder="e.g., United States"
                        value={firmInfo.country || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, country: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        placeholder="e.g., New York"
                        value={firmInfo.city || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, city: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="practicingSince">Practicing Since</Label>
                      <Input
                        id="practicingSince"
                        type="number"
                        placeholder="e.g., 2010"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={firmInfo.practicingSince || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, practicingSince: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="partnerCount">Number of Partners</Label>
                      <Input
                        id="partnerCount"
                        type="number"
                        placeholder="e.g., 5"
                        min="0"
                        value={firmInfo.partnerCount || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, partnerCount: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staffCount">Number of Staff</Label>
                      <Input
                        id="staffCount"
                        type="number"
                        placeholder="e.g., 20"
                        min="0"
                        value={firmInfo.staffCount || ''}
                        onChange={(e) =>
                          setFirmInfo({ ...firmInfo, staffCount: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>
                        Firm Specializations <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select all areas your firm specializes in
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALIZATIONS.map((spec) => (
                          <Badge
                            key={spec}
                            variant={
                              firmInfo.specializations?.includes(spec)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer hover:bg-primary/80 transition-colors"
                            onClick={() => toggleSpecialization(spec)}
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button onClick={handleNext} size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Admin User Details */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in-50 duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100">
                      Administrator Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={userInfo.firstName || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, firstName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={userInfo.lastName || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, lastName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">
                        Work Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.smith@yourfirm.com"
                        value={userInfo.email || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">
                        Job Title <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={userInfo.jobTitle}
                        onValueChange={(value) =>
                          setUserInfo({ ...userInfo, jobTitle: value })
                        }
                      >
                        <SelectTrigger id="jobTitle">
                          <SelectValue placeholder="Select your title" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TITLES.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={userInfo.phone || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={userInfo.password || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, password: e.target.value })
                        }
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
                        placeholder="••••••••"
                        value={userInfo.confirmPassword || ''}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-4">
                  <Button onClick={handleBack} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Confirmation */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in-50 duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100">
                      Preferences & Confirmation
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryUseCase">Primary Use Case</Label>
                      <Select
                        value={preferences.primaryUseCase}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, primaryUseCase: value })
                        }
                      >
                        <SelectTrigger id="primaryUseCase">
                          <SelectValue placeholder="What will you primarily use this platform for?" />
                        </SelectTrigger>
                        <SelectContent>
                          {USE_CASES.map((useCase) => (
                            <SelectItem key={useCase} value={useCase}>
                              {useCase}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedTeamSize">Expected Team Size</Label>
                      <Select
                        value={preferences.expectedTeamSize}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, expectedTeamSize: value })
                        }
                      >
                        <SelectTrigger id="expectedTeamSize">
                          <SelectValue placeholder="How many users will be using this platform?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5 users</SelectItem>
                          <SelectItem value="6-15">6-15 users</SelectItem>
                          <SelectItem value="16-50">16-50 users</SelectItem>
                          <SelectItem value="51-100">51-100 users</SelectItem>
                          <SelectItem value="100+">100+ users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border border-slate-700/50 rounded-lg p-6 space-y-4 bg-slate-800/30">
                      <h4 className="font-semibold text-slate-200">Review Your Information</h4>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Firm Name</p>
                          <p className="font-medium">{firmInfo.firmName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Firm Type</p>
                          <p className="font-medium">
                            {FIRM_TYPES.find((t) => t.value === firmInfo.firmType)?.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">
                            {firmInfo.city}, {firmInfo.country}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Administrator</p>
                          <p className="font-medium">
                            {userInfo.firstName} {userInfo.lastName}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-1">Specializations</p>
                          <div className="flex flex-wrap gap-1">
                            {firmInfo.specializations?.map((spec) => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          className="mt-1"
                          checked={preferences.agreeToTerms || false}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              agreeToTerms: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="agreeToTerms" className="font-normal cursor-pointer">
                          I agree to the{' '}
                          <a href="#" className="text-primary hover:underline">
                            Terms of Service
                          </a>{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agreeToPrivacy"
                          className="mt-1"
                          checked={preferences.agreeToPrivacy || false}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              agreeToPrivacy: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="agreeToPrivacy" className="font-normal cursor-pointer">
                          I agree to the{' '}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-4">
                  <Button onClick={handleBack} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} size="lg" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {!loading && <CheckCircle2 className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <div className="px-8 py-6 border-t border-slate-800/50 bg-slate-900/30">
            <div className="text-sm text-slate-400 text-center">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
