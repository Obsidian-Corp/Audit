/**
 * ==================================================================
 * AUDIT VISUAL - Traceability Chain Animation
 * ==================================================================
 * Shows Evidence → Procedure → Conclusion flow
 * ==================================================================
 */

import { FileText, ClipboardCheck, CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
  { icon: FileText, label: 'Evidence', sublabel: 'Bank Statement' },
  { icon: ClipboardCheck, label: 'Procedure', sublabel: 'Cash Confirmation' },
  { icon: CheckCircle, label: 'Conclusion', sublabel: 'Verified' },
];

export function AuditVisual() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main flow */}
      <div className="flex items-center justify-between gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;

          return (
            <div key={i} className="flex items-center gap-4 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <Icon
                    className={`w-7 h-7 transition-colors duration-500 ${
                      isActive ? 'text-primary' : 'text-white/30'
                    }`}
                    strokeWidth={1.5}
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary animate-ping opacity-50" />
                  )}
                </div>
                <span
                  className={`mt-3 text-sm font-medium transition-colors duration-500 ${
                    isActive ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-xs transition-colors duration-500 ${
                    isActive ? 'text-primary/80' : 'text-white/20'
                  }`}
                >
                  {step.sublabel}
                </span>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div className="flex-shrink-0">
                  <ArrowRight
                    className={`w-5 h-5 transition-colors duration-500 ${
                      i < activeStep ? 'text-primary' : 'text-white/20'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trace back indicator */}
      {activeStep === 3 && (
        <div className="mt-8 flex items-center justify-center gap-2 animate-fade-in">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-primary" />
          <span className="text-xs font-mono text-primary px-3 py-1 rounded-full border border-primary/30 bg-primary/10">
            FULLY TRACEABLE
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/50 to-primary" />
        </div>
      )}

      {/* Status */}
      <div className="mt-6 text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {activeStep === 0 && 'Gathering evidence...'}
          {activeStep === 1 && 'Executing procedure...'}
          {activeStep === 2 && 'Forming conclusion...'}
          {activeStep === 3 && 'Audit trail complete'}
        </span>
      </div>
    </div>
  );
}

export default AuditVisual;
