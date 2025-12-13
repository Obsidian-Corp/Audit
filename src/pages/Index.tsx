import Hero from "@/components/Hero";
import ParticleBackground from "@/components/ParticleBackground";
import DataIntelligenceNetwork from "@/components/landing/DataIntelligenceNetwork";
import IsometricArchitecture from "@/components/landing/IsometricArchitecture";
import DataLineagePipeline from "@/components/landing/DataLineagePipeline";
import ScaleMetrics from "@/components/landing/ScaleMetrics";
import LiveCodeEditor from "@/components/landing/LiveCodeEditor";
import InfrastructureDiagram from "@/components/landing/InfrastructureDiagram";
import MinimalCTA from "@/components/landing/MinimalCTA";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import obsidianLogo from "@/assets/obsidian-logo.svg";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  // Enterprise B2B users should never see the marketing landing page
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth/signup');
    }
  };

  return (
    <>
      <Helmet>
        <title>Skal - Enterprise Ontology Platform</title>
        <meta name="description" content="Single source of truth connecting projects, data and teams" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Helmet>
      
      <div className="min-h-screen bg-black text-foreground overflow-hidden">
        <div className="relative min-h-screen">
          <ParticleBackground />
          <Hero onGetStarted={handleGetStarted} />
          
          {/* Gradient Fade Overlay */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 60%, rgb(0,0,0) 100%)'
            }}
          />
        </div>
        
        {/* Logo */}
        <div className="fixed top-0 left-0 z-50 px-8 py-6">
          <a href="/" className="block hover:opacity-80 transition-opacity">
            <img src={obsidianLogo} alt="Obsidian" className="h-8 w-auto" />
          </a>
        </div>

        {/* Sign In Button */}
        <div className="fixed top-0 right-0 z-50 px-8 py-6">
          {user ? (
            <UserMenu />
          ) : (
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80 hover:bg-transparent uppercase tracking-wider text-sm font-medium"
              onClick={() => navigate('/auth/login')}
            >
              Sign In
            </Button>
          )}
        </div>

        <main className="bg-black">
          <DataIntelligenceNetwork />
          <IsometricArchitecture />
          <DataLineagePipeline />
          <ScaleMetrics />
          <LiveCodeEditor />
          <InfrastructureDiagram />
          <MinimalCTA onGetStarted={() => navigate('/portal')} />
        </main>
      </div>
    </>
  );
};

export default Index;
