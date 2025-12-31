/**
 * ==================================================================
 * CONTACT PAGE - PALANTIR STYLE
 * ==================================================================
 * Request a Briefing
 * ==================================================================
 */

import { ArrowLeft, Mail, Building, User, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import obsidianLogo from '@/assets/obsidian-logo.svg';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/layout/Navigation';

export function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Request Received",
      description: "We'll be in touch within 24 hours to schedule your briefing.",
    });

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Platform
          </Link>

          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
            Request a Briefing
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            We work with institutions navigating genuine complexity. If you're facing
            information challenges that conventional approaches haven't solved, we should talk.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-primary/60" />
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary/60" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@organization.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-white flex items-center gap-2">
                <Building className="h-4 w-4 text-primary/60" />
                Organization
              </Label>
              <Input
                id="organization"
                placeholder="Your organization"
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary/60" />
                What challenges are you facing?
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us about your information environment and the problems you're trying to solve..."
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary min-h-[150px]"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-white py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-8">
            We typically respond within 24 hours. For urgent matters, contact us directly.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img src={obsidianLogo} alt="Obsidian" className="h-6 w-auto opacity-60" />
            </Link>
            <span className="text-sm text-muted-foreground">
              Infrastructure for institutional coherence
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/platform/ontology" className="hover:text-white transition-colors">
              Ontology
            </Link>
            <Link to="/platform/audit" className="hover:text-white transition-colors">
              Audit
            </Link>
            <Link to="/platform/codex" className="hover:text-white transition-colors">
              Codex
            </Link>
            <Link to="/platform/forge" className="hover:text-white transition-colors">
              Forge
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default ContactPage;
