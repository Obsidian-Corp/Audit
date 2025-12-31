import { Button } from "@/components/ui/button";

const Hero = ({ onGetStarted }: { onGetStarted?: () => void }) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-8 relative">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Beta Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-muted/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Beta Release
          </span>
        </div>

        {/* Hero Heading */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight">
            <span className="block">Build on connected</span>
            <span className="block italic font-serif">intelligence</span>
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Single source of truth connecting projects, data and teams
        </p>

        {/* CTA Button */}
        <div className="pt-4">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest font-medium px-8 py-6 text-sm"
            onClick={onGetStarted || (() => window.location.href = '/auth/create-organization')}
          >
            Request Platform Access
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
