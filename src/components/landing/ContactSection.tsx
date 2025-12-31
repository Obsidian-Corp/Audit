/**
 * ==================================================================
 * CONTACT SECTION - PALANTIR STYLE
 * ==================================================================
 * Start a Conversation - Request a Briefing
 * ==================================================================
 */

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ContactSection() {
  const navigate = useNavigate();

  return (
    <section className="py-32 px-4 bg-black relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-white">
          Start a Conversation
        </h2>

        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
          We work with institutions navigating genuine complexity—not
          organizations looking for commodity software. If you're facing
          information challenges that conventional approaches haven't solved,
          we should talk.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="group bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-medium"
            onClick={() => navigate('/contact')}
          >
            Request a Briefing
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base font-medium"
            onClick={() => navigate('/auth/login')}
          >
            Sign In to Platform
          </Button>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
