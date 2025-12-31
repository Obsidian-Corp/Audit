/**
 * ==================================================================
 * NAVIGATION - PALANTIR STYLE
 * ==================================================================
 * Consistent navigation for all pages
 * Logo left, product links center, CTA right
 * ==================================================================
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/UserMenu';
import obsidianLogo from '@/assets/obsidian-logo.svg';
import { cn } from '@/lib/utils';

interface NavigationProps {
  variant?: 'fixed' | 'sticky' | 'absolute';
  className?: string;
}

export function Navigation({ variant = 'fixed', className }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const productLinks = [
    { href: '/platform/ontology', label: 'Ontology' },
    { href: '/platform/audit', label: 'Audit' },
    { href: '/platform/codex', label: 'Codex' },
    { href: '/platform/forge', label: 'Forge' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header
      className={cn(
        'top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/5',
        variant === 'fixed' && 'fixed',
        variant === 'sticky' && 'sticky',
        variant === 'absolute' && 'absolute',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img src={obsidianLogo} alt="Obsidian" className="h-7 w-auto" />
            </Link>
          </div>

          {/* Product Links - Center */}
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center gap-8">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm transition-colors',
                    isActive(link.href)
                      ? 'text-white font-medium'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side - CTA/Login */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-white hover:bg-transparent"
              onClick={() => navigate('/contact')}
            >
              Contact
            </Button>
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
        </div>
      </div>
    </header>
  );
}

export default Navigation;
