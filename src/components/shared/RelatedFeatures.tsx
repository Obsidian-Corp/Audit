import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface RelatedFeature {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
}

interface RelatedFeaturesProps {
  features: RelatedFeature[];
  title?: string;
}

/**
 * Related Features Panel - Shows contextual connections between features
 * Example: Show Stakeholders when viewing Projects, show Data Pipelines when viewing AI Agents
 */
export function RelatedFeatures({ features, title = "Related Features" }: RelatedFeaturesProps) {
  const navigate = useNavigate();

  if (features.length === 0) return null;

  return (
    <Card className="bg-surface-elevated border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-background border border-border hover:border-border-interactive transition-all cursor-pointer group"
            onClick={() => navigate(feature.path)}
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  {feature.badge && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        {features.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full justify-between group mt-2">
            View all connections
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
