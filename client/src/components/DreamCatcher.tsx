import { Mic, MicOff } from "lucide-react";

interface DreamCatcherProps {
  isRecording?: boolean;
  voiceEnabled?: boolean;
  isTranscribing?: boolean;
  onToggleRecording?: () => void;
}

export default function DreamCatcher({ 
  isRecording = false, 
  voiceEnabled = true, 
  isTranscribing = false,
  onToggleRecording 
}: DreamCatcherProps) {
  return (
    <div 
      className={`mx-auto mb-6 w-24 h-24 relative dreamcatcher-glow animate-float cursor-pointer transition-all duration-200 hover:scale-105 ${
        isRecording ? 'recording-pulse' : ''
      } ${!voiceEnabled || isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (voiceEnabled && !isTranscribing && onToggleRecording) {
          onToggleRecording();
        }
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer Circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="30" 
          fill="none" 
          stroke={isRecording ? "#FFD700" : "hsl(var(--cosmic-200))"} 
          strokeWidth={isRecording ? "3" : "2"}
          className="transition-all duration-200"
        />
        
        {/* Inner Web Pattern */}
        <g stroke={isRecording ? "#FFD700" : "hsl(var(--cosmic-200))"} strokeWidth="1" fill="none" className="transition-all duration-200">
          {/* Petal pattern */}
          <path d="M 50 20 Q 35 35 50 50 Q 65 35 50 20"/>
          <path d="M 80 50 Q 65 35 50 50 Q 65 65 80 50"/>
          <path d="M 50 80 Q 65 65 50 50 Q 35 65 50 80"/>
          <path d="M 20 50 Q 35 65 50 50 Q 35 35 20 50"/>
          {/* Center circle with microphone icon */}
          <circle cx="50" cy="50" r="8" fill={isRecording ? "#FFD700" : "hsl(var(--cosmic-200))"} fillOpacity="0.2"/>
        </g>
        
        {/* Microphone Icon in Center */}
        <foreignObject x="42" y="42" width="16" height="16">
          {isRecording ? (
            <MicOff className="w-4 h-4 text-gold" />
          ) : (
            <Mic className="w-4 h-4 text-cosmic-200" />
          )}
        </foreignObject>
        
        {/* Feathers */}
        <g fill={isRecording ? "#FFD700" : "hsl(var(--cosmic-200))"} className="transition-all duration-200">
          <ellipse cx="50" cy="88" rx="2" ry="8" opacity="0.8"/>
          <ellipse cx="43" cy="86" rx="1.5" ry="6" opacity="0.6"/>
          <ellipse cx="57" cy="86" rx="1.5" ry="6" opacity="0.6"/>
        </g>
      </svg>
      
      {/* Recording status indicator */}
      {isRecording && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-gold font-semibold animate-pulse">REC</div>
        </div>
      )}
      
      {isTranscribing && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-cosmic-200 font-semibold">...</div>
        </div>
      )}
    </div>
  );
}
