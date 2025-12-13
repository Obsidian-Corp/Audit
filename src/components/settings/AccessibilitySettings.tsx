/**
 * ==================================================================
 * ACCESSIBILITY SETTINGS COMPONENT
 * ==================================================================
 * Color-blind modes, keyboard navigation shortcuts, screen reader support
 * Per UX critique issue #5 - Accessibility Fixes
 * ==================================================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Keyboard,
  Volume2,
  ZoomIn,
  Palette,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';

const COLOR_BLIND_MODES = [
  { value: 'none', label: 'None (Default)', description: 'Standard color scheme' },
  {
    value: 'protanopia',
    label: 'Protanopia',
    description: 'Red-blind (affects ~1% of males)',
  },
  {
    value: 'deuteranopia',
    label: 'Deuteranopia',
    description: 'Green-blind (affects ~1% of males)',
  },
  {
    value: 'tritanopia',
    label: 'Tritanopia',
    description: 'Blue-blind (rare, affects ~0.001%)',
  },
  {
    value: 'achromatopsia',
    label: 'Achromatopsia',
    description: 'Complete color blindness (monochrome)',
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open search' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['⌘', 'Shift', 'N'], description: 'New engagement' },
  { keys: ['⌘', 'Shift', 'P'], description: 'New procedure' },
  { keys: ['⌘', 'Shift', 'F'], description: 'New finding' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialog' },
  { keys: ['Tab'], description: 'Navigate forward' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
];

export function AccessibilitySettings() {
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(true);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [focusIndicators, setFocusIndicators] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setColorBlindMode(settings.colorBlindMode || 'none');
      setHighContrast(settings.highContrast || false);
      setReducedMotion(settings.reducedMotion || false);
      setLargeText(settings.largeText || false);
      setKeyboardNav(settings.keyboardNav ?? true);
      setScreenReaderOptimized(settings.screenReaderOptimized || false);
      setFocusIndicators(settings.focusIndicators ?? true);
    }

    // Apply saved settings
    applyAccessibilitySettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      colorBlindMode,
      highContrast,
      reducedMotion,
      largeText,
      keyboardNav,
      screenReaderOptimized,
      focusIndicators,
    };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applyAccessibilitySettings();
  }, [
    colorBlindMode,
    highContrast,
    reducedMotion,
    largeText,
    keyboardNav,
    screenReaderOptimized,
    focusIndicators,
  ]);

  const applyAccessibilitySettings = () => {
    const root = document.documentElement;

    // Color blind mode
    root.setAttribute('data-colorblind-mode', colorBlindMode);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Large text
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Enhanced focus indicators
    if (focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Screen reader optimizations
    if (screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  };

  const resetToDefaults = () => {
    setColorBlindMode('none');
    setHighContrast(false);
    setReducedMotion(false);
    setLargeText(false);
    setKeyboardNav(true);
    setScreenReaderOptimized(false);
    setFocusIndicators(true);
  };

  return (
    <div className="space-y-6">
      {/* Color Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Vision
          </CardTitle>
          <CardDescription>
            Adjust colors for color vision deficiencies (color blindness)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="colorblind-mode">Color Blind Mode</Label>
            <Select value={colorBlindMode} onValueChange={setColorBlindMode}>
              <SelectTrigger id="colorblind-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_BLIND_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{mode.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {mode.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast between text and background
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>

          {colorBlindMode !== 'none' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Color adjustments active</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Risk indicators and status badges are using patterns and symbols in addition
                    to colors for better visibility.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Preferences
          </CardTitle>
          <CardDescription>
            Adjust visual elements for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="large-text">Large Text</Label>
              <p className="text-sm text-muted-foreground">
                Increase base font size across the platform
              </p>
            </div>
            <Switch id="large-text" checked={largeText} onCheckedChange={setLargeText} />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="focus-indicators">Enhanced Focus Indicators</Label>
              <p className="text-sm text-muted-foreground">
                Show prominent outlines when navigating with keyboard
              </p>
            </div>
            <Switch
              id="focus-indicators"
              checked={focusIndicators}
              onCheckedChange={setFocusIndicators}
            />
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Navigation
          </CardTitle>
          <CardDescription>
            Navigate the platform using keyboard shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="keyboard-nav">Enable Keyboard Navigation</Label>
              <p className="text-sm text-muted-foreground">
                Use keyboard shortcuts for common actions
              </p>
            </div>
            <Switch id="keyboard-nav" checked={keyboardNav} onCheckedChange={setKeyboardNav} />
          </div>

          {keyboardNav && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Available Shortcuts</h4>
                <div className="space-y-2">
                  {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-1 text-xs bg-muted rounded border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Screen Reader Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Screen Reader Support
          </CardTitle>
          <CardDescription>
            Optimize the platform for screen reader users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="screen-reader">Screen Reader Optimizations</Label>
              <p className="text-sm text-muted-foreground">
                Add extra ARIA labels and announcements for screen readers
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReaderOptimized}
              onCheckedChange={setScreenReaderOptimized}
            />
          </div>

          {screenReaderOptimized && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-900 dark:text-green-100">
                  <p className="font-medium">Screen reader mode active</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
