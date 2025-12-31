/**
 * ==================================================================
 * CODEX VISUAL - Document Liberation Pipeline
 * ==================================================================
 * Shows paper → scan → recognition → structured data
 * ==================================================================
 */

import { useEffect, useState } from 'react';
import { FileText, Scan, Brain, Database } from 'lucide-react';

const stages = [
  { icon: FileText, label: 'Paper Archive', color: 'text-amber-400' },
  { icon: Scan, label: 'Digitization', color: 'text-blue-400' },
  { icon: Brain, label: 'Recognition', color: 'text-purple-400' },
  { icon: Database, label: 'Structured Data', color: 'text-primary' },
];

export function CodexVisual() {
  const [activeStage, setActiveStage] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');

  const sampleText = 'John Smith - $1,250.00';

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setActiveStage((s) => (s + 1) % 5);
    }, 2000);
    return () => clearInterval(stageInterval);
  }, []);

  useEffect(() => {
    if (activeStage === 2) {
      // Typewriter effect during recognition
      let i = 0;
      setRecognizedText('');
      const typeInterval = setInterval(() => {
        if (i < sampleText.length) {
          setRecognizedText(sampleText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 80);
      return () => clearInterval(typeInterval);
    }
  }, [activeStage]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Pipeline stages */}
      <div className="flex items-center justify-between">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i <= activeStage;
          const isCurrent = i === activeStage;

          return (
            <div key={i} className="relative flex-1">
              {/* Connector line */}
              {i > 0 && (
                <div className="absolute top-1/2 -left-1/2 w-full h-px">
                  <div
                    className={`h-full transition-all duration-700 ${
                      i <= activeStage ? 'bg-primary' : 'bg-white/10'
                    }`}
                    style={{
                      width: i <= activeStage ? '100%' : '0%',
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/5'
                  } ${isCurrent ? 'scale-110' : ''}`}
                >
                  <Icon
                    className={`w-6 h-6 transition-all duration-500 ${
                      isActive ? stage.color : 'text-white/20'
                    } ${isCurrent ? 'animate-pulse' : ''}`}
                    strokeWidth={1.5}
                  />
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-500 ${
                    isActive ? 'text-white' : 'text-white/30'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recognition preview */}
      <div className="mt-10 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Recognition Output
          </span>
        </div>

        <div className="font-mono text-sm min-h-[24px]">
          {activeStage >= 2 ? (
            <span className="text-primary">
              {recognizedText}
              {activeStage === 2 && <span className="animate-pulse">|</span>}
            </span>
          ) : (
            <span className="text-white/20">Awaiting input...</span>
          )}
        </div>

        {activeStage >= 3 && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Entity</span>
              <span className="text-white font-medium">John Smith</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-primary font-medium">$1,250.00</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-green-400 font-medium">98.7%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodexVisual;
