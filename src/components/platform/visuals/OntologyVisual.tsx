/**
 * ==================================================================
 * ONTOLOGY VISUAL - Entity Resolution Animation
 * ==================================================================
 * Shows entities from different sources being unified
 * ==================================================================
 */

import { useEffect, useState } from 'react';

export function OntologyVisual() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Central unified node */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 transition-all duration-700 ${
          phase >= 2
            ? 'border-primary bg-primary/20 scale-110'
            : 'border-white/20 bg-white/5'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-mono transition-colors duration-700 ${phase >= 2 ? 'text-primary' : 'text-white/40'}`}>
            ENTITY
          </span>
        </div>
        {phase >= 2 && (
          <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping" />
        )}
      </div>

      {/* Source 1 - CRM */}
      <div
        className={`absolute top-4 left-1/4 -translate-x-1/2 transition-all duration-700 ${
          phase >= 1 ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="w-16 h-16 rounded-lg border border-blue-500/50 bg-blue-500/10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-blue-400">CRM</span>
          <span className="text-[8px] text-blue-300 mt-1">"Acme Inc"</span>
        </div>
        {/* Connection line */}
        <svg className="absolute top-full left-1/2 -translate-x-1/2 w-px h-20 overflow-visible">
          <line
            x1="0"
            y1="0"
            x2="20"
            y2="60"
            className={`transition-all duration-700 ${
              phase >= 1 ? 'stroke-primary' : 'stroke-white/20'
            }`}
            strokeWidth="1"
            strokeDasharray={phase >= 1 ? '0' : '4'}
          />
        </svg>
      </div>

      {/* Source 2 - ERP */}
      <div
        className={`absolute top-4 right-1/4 translate-x-1/2 transition-all duration-700 ${
          phase >= 1 ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="w-16 h-16 rounded-lg border border-green-500/50 bg-green-500/10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-green-400">ERP</span>
          <span className="text-[8px] text-green-300 mt-1">"ACME Corp"</span>
        </div>
        <svg className="absolute top-full left-1/2 -translate-x-1/2 w-px h-20 overflow-visible">
          <line
            x1="0"
            y1="0"
            x2="-20"
            y2="60"
            className={`transition-all duration-700 ${
              phase >= 1 ? 'stroke-primary' : 'stroke-white/20'
            }`}
            strokeWidth="1"
            strokeDasharray={phase >= 1 ? '0' : '4'}
          />
        </svg>
      </div>

      {/* Source 3 - Support */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-700 ${
          phase >= 1 ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="w-16 h-16 rounded-lg border border-purple-500/50 bg-purple-500/10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono text-purple-400">SUPPORT</span>
          <span className="text-[8px] text-purple-300 mt-1">"Acme"</span>
        </div>
      </div>

      {/* Relationship lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {phase >= 3 && (
          <>
            {/* Outgoing relationship indicators */}
            <circle cx="50%" cy="35%" r="3" className="fill-primary animate-pulse" />
            <circle cx="35%" cy="55%" r="3" className="fill-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
            <circle cx="65%" cy="55%" r="3" className="fill-primary animate-pulse" style={{ animationDelay: '0.6s' }} />
          </>
        )}
      </svg>

      {/* Status indicator */}
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {phase === 0 && 'Discovering sources...'}
          {phase === 1 && 'Resolving entities...'}
          {phase === 2 && 'Entity unified'}
          {phase === 3 && 'Relationships mapped'}
        </span>
      </div>
    </div>
  );
}

export default OntologyVisual;
