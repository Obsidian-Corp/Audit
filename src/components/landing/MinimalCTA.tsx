import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const MinimalCTA = ({ onGetStarted }: { onGetStarted?: () => void }) => {
  return (
    <section className="relative py-48 px-8 bg-black overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Main CTA */}
        <div className="text-center mb-16">
          <h2 className="text-7xl font-light tracking-tight mb-8">
            Enterprise Ontology Platform
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="border-primary hover:bg-primary/10 uppercase tracking-widest font-medium px-10 py-7 text-sm group"
            >
              Request Architecture Review
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest font-medium px-10 py-7 text-sm shadow-blue-lg group"
              onClick={onGetStarted || (() => window.location.href = '/auth/create-organization')}
            >
              Start Building
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className="h-px w-16 bg-border" />
          <div className="flex items-center gap-8 font-mono text-xs text-muted-foreground uppercase tracking-wider">
            <span>Security Cleared</span>
            <div className="w-px h-4 bg-border" />
            <span>SOC 2 Type II</span>
            <div className="w-px h-4 bg-border" />
            <span>GDPR Compliant</span>
          </div>
          <div className="h-px w-16 bg-border" />
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-12 text-sm text-muted-foreground font-mono">
          <div className="text-center">
            <div className="text-2xl text-primary mb-1">99.99%</div>
            <div className="text-xs">Uptime SLA</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-2xl text-data-secondary mb-1">24/7</div>
            <div className="text-xs">Enterprise Support</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <div className="text-2xl text-data-primary mb-1">14 Day</div>
            <div className="text-xs">Free Trial</div>
          </div>
        </div>

        {/* Grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(214, 30%, 15%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(214, 30%, 15%) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }} />
        </div>

        {/* Glow effect */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(214, 100%, 50%, 0.1), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>
    </section>
  );
};

export default MinimalCTA;
