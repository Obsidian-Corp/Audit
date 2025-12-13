import { useState, useEffect } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Switch } from "./switch";
import { Label } from "./label";
import { Accessibility, Contrast, Type, Moon } from "lucide-react";

export function AccessibilityMenu() {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largerText, setLargerText] = useState(false);

  useEffect(() => {
    // Apply high contrast mode
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.style.setProperty("--animation-duration", "0.001ms");
    } else {
      document.documentElement.style.removeProperty("--animation-duration");
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Apply larger text
    if (largerText) {
      document.documentElement.classList.add("text-lg");
    } else {
      document.documentElement.classList.remove("text-lg");
    }
  }, [largerText]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-gold-lg bg-card border border-border hover:border-gold/50"
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" side="top">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-gold" />
              Accessibility Settings
            </h3>
            <p className="text-xs text-muted-foreground">
              Customize the interface to your needs
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="high-contrast" className="text-sm cursor-pointer">
                  High Contrast
                </Label>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="reduced-motion" className="text-sm cursor-pointer">
                  Reduced Motion
                </Label>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="larger-text" className="text-sm cursor-pointer">
                  Larger Text
                </Label>
              </div>
              <Switch
                id="larger-text"
                checked={largerText}
                onCheckedChange={setLargerText}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              For additional accessibility features, press{" "}
              <kbd className="px-2 py-1 bg-surface border border-border rounded text-xs font-mono">?</kbd>
              {" "}to view keyboard shortcuts
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
