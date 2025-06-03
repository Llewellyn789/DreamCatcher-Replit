export default function DreamCatcher() {
  return (
    <div className="mx-auto mb-6 w-24 h-24 relative dreamcatcher-glow animate-float">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer Circle */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--cosmic-200))" strokeWidth="2"/>
        
        {/* Inner Web Pattern */}
        <g stroke="hsl(var(--cosmic-200))" strokeWidth="1" fill="none">
          {/* Petal pattern */}
          <path d="M 50 20 Q 35 35 50 50 Q 65 35 50 20"/>
          <path d="M 80 50 Q 65 35 50 50 Q 65 65 80 50"/>
          <path d="M 50 80 Q 65 65 50 50 Q 35 65 50 80"/>
          <path d="M 20 50 Q 35 65 50 50 Q 35 35 20 50"/>
          {/* Center circle */}
          <circle cx="50" cy="50" r="6" fill="none" stroke="hsl(var(--cosmic-200))"/>
        </g>
        
        {/* Feathers */}
        <g fill="hsl(var(--cosmic-200))">
          <ellipse cx="50" cy="88" rx="2" ry="8" opacity="0.8"/>
          <ellipse cx="43" cy="86" rx="1.5" ry="6" opacity="0.6"/>
          <ellipse cx="57" cy="86" rx="1.5" ry="6" opacity="0.6"/>
        </g>
      </svg>
    </div>
  );
}
