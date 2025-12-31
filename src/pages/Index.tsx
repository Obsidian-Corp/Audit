import Hero from "@/components/Hero";
import ParticleBackground from "@/components/ParticleBackground";
import DataIntelligenceNetwork from "@/components/landing/DataIntelligenceNetwork";
import IsometricArchitecture from "@/components/landing/IsometricArchitecture";
import DataLineagePipeline from "@/components/landing/DataLineagePipeline";
import ScaleMetrics from "@/components/landing/ScaleMetrics";
import LiveCodeEditor from "@/components/landing/LiveCodeEditor";
import InfrastructureDiagram from "@/components/landing/InfrastructureDiagram";
// Palantir-style narrative sections
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProductsSection } from "@/components/landing/ProductsSection";
import { ApproachSection } from "@/components/landing/ApproachSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Navigation } from "@/components/layout/Navigation";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // DEMO MODE: Disabled auto-redirect for demo
  // TODO: Re-enable for production
  // Redirect authenticated users to dashboard
  // Enterprise B2B users should never see the marketing landing page
  // useEffect(() => {
  //   if (user) {
  //     navigate('/dashboard', { replace: true });
  //   }
  // }, [user, navigate]);

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
        <title>Obsidian - Infrastructure for Institutional Coherence</title>
        <meta name="description" content="Purpose-built systems for complex enterprises. Ontology, Audit, Codex, and Forge—software that transforms fragmented information into coordinated action." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Helmet>
      
      <div className="min-h-screen bg-black text-foreground overflow-hidden">
        {/* Navigation */}
        <Navigation />

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

        <main className="bg-black">
          {/* Technical Visualizations - Existing */}
          <DataIntelligenceNetwork />

          {/* Palantir-Style Narrative Sections */}
          <ProblemSection />
          <ProductsSection />

          {/* More Technical Visualizations */}
          <IsometricArchitecture />
          <DataLineagePipeline />

          {/* How We Build */}
          <ApproachSection />

          {/* Metrics & Infrastructure */}
          <ScaleMetrics />
          <LiveCodeEditor />
          <InfrastructureDiagram />

          {/* Trust & CTA */}
          <TrustSection />
          <ContactSection />
        </main>
      </div>
    </>
  );
};

export default Index;
