import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, Folder, BarChart3 } from "lucide-react";
import DreamCatcher from "@/components/DreamCatcher";

interface VoiceRecorderProps {
  onNavigateToSavedDreams: () => void;
  onViewDream: (dreamId: number) => void;
  onNavigateToAnalytics?: () => void;
  onReset?: () => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams, onViewDream, onNavigateToAnalytics, onReset }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Initialize MediaRecorder and check permissions
  useEffect(() => {
    const checkMicrophoneAccess = async () => {
      try {
        // Check if navigator.mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('getUserMedia not supported');
          setVoiceEnabled(false);
          return;
        }

        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        setVoiceEnabled(true);
      } catch (error) {
        console.error('Microphone access error:', error);
        setVoiceEnabled(false);
        
        // Show user-friendly message based on error type
        const err = error as any;
        if (err?.name === 'NotAllowedError') {
          toast({
            title: "Microphone Access Needed",
            description: "Please allow microphone access to record dreams",
            variant: "destructive",
          });
        } else if (err?.name === 'NotFoundError') {
          // Don't show error toast for no microphone - just disable voice
          console.log('No microphone detected - switching to text input mode');
        } else {
          // Don't show error toast for permission denied - just disable voice
          console.log('Microphone access denied - switching to text input mode');
        }
      }
    };

    checkMicrophoneAccess();
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, // Lower sample rate for faster processing
          channelCount: 1,   // Mono audio
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;
      
      // Try different mime types for better compatibility and compression
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000 // Lower bitrate for faster upload
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start with time slicing for chunked data
      mediaRecorder.start(1000); // 1 second chunks
      setIsRecording(true);
      setHasRecorded(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      // Silent error handling - no toasts as requested
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Add timeout for mobile optimization
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setDreamText(prev => prev + (prev ? ' ' : '') + data.transcript);
    } catch (error) {
      console.error('Transcription error:', error);
      // Silent error handling - no toasts as requested
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const createDreamMutation = useMutation({
    mutationFn: async (dreamData: { title: string; content: string; duration?: string }) => {
      const response = await apiRequest("POST", "/api/dreams", dreamData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      setDreamText("");
    },
    onError: (error) => {
      console.error("Failed to save dream:", error);
    },
  });

  const generateTitleMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/generate-title", { content });
      return await response.json();
    },
  });

  const saveDream = async () => {
    if (!dreamText.trim()) return;

    try {
      // Generate title first
      const titleResponse = await generateTitleMutation.mutateAsync(dreamText);
      
      // Then save dream with generated title
      await createDreamMutation.mutateAsync({
        title: titleResponse.title,
        content: dreamText,
        duration: undefined
      });
      
      setHasRecorded(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const resetToHome = () => {
    // Stop any ongoing recording
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear all states
    setIsTranscribing(false);
    setIsAnalyzing(false);
    setDreamText("");
    setHasRecorded(false);
    
    // Clean up audio chunks
    audioChunksRef.current = [];
    
    // Call parent reset if provided
    if (onReset) {
      onReset();
    }
  };

  const interpretDream = async () => {
    if (!dreamText.trim()) return;

    try {
      setIsAnalyzing(true);
      
      // Generate title first
      const titleResponse = await generateTitleMutation.mutateAsync(dreamText);
      
      // Save dream with generated title
      const dreamResponse = await createDreamMutation.mutateAsync({
        title: titleResponse.title,
        content: dreamText,
        duration: undefined
      });

      // Then analyze it
      const analysisResponse = await apiRequest("POST", `/api/dreams/${dreamResponse.id}/analyze`, {});

      // Navigate to dream detail view after successful analysis
      onViewDream(dreamResponse.id);
      setDreamText("");
      setHasRecorded(false);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Loading overlay for dream interpretation */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[hsl(var(--cosmic-300))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="cosmic-text-50 text-lg font-semibold mb-2">Interpreting Dream</h3>
            <p className="cosmic-text-200 text-sm">Analyzing with Jungian psychology...</p>
          </div>
        </div>
      )}

      {/* Transcription overlay */}
      {isTranscribing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[hsl(var(--cosmic-300))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="cosmic-text-50 text-lg font-semibold mb-2">Transcribing Audio</h3>
            <p className="cosmic-text-200 text-sm">Converting speech to text...</p>
          </div>
        </div>
      )}

      {(dreamText || hasRecorded) ? (
        // Show text area when there's content or recording has been made
        <div className="flex-1 flex flex-col px-6">
          {/* Back button */}
          <div className="flex justify-start pt-4 pb-2">
            <Button
              variant="ghost"
              onClick={resetToHome}
              className="cosmic-text-200 hover:cosmic-text-50 p-2"
            >
              ← Back
            </Button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
            <Textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={isRecording ? "Recording your dream..." : isTranscribing ? "Transcribing..." : "Describe your dream here..."}
              className="glass-effect cosmic-text-50 placeholder-cosmic-300 border-cosmic-300/30 resize-none min-h-[200px] text-base leading-relaxed"
              disabled={isRecording || isTranscribing}
            />
            
            {/* Recording controls and action buttons */}
            <div className="flex flex-col items-center mt-4 space-y-3">
              {/* Stop recording button - show when actively recording */}
              {isRecording && (
                <Button
                  onClick={stopRecording}
                  className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white font-semibold transition-all duration-200 z-50 relative"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {/* Interpret dream button - show when not recording and has text */}
              {!isRecording && (
                <Button
                  onClick={interpretDream}
                  disabled={!dreamText.trim() || isAnalyzing}
                  className="w-full max-w-xs gradient-gold cosmic-text-950 font-semibold hover:opacity-90 transition-all duration-200"
                >
                  {isAnalyzing ? "Analyzing..." : "Interpret Dream"}
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>
      ) : (
        // Home page layout: Title at top, large dreamcatcher in center, microphone at bottom
        <>
          {/* Title at top */}
          <div className="text-center pt-8 pb-4">
            <h1 className="text-gold glow-gold font-bold tracking-wide text-4xl md:text-5xl">
              DreamCatcher
            </h1>
          </div>

          {/* Large floating dreamcatcher in center */}
          <div className="flex-1 flex items-center justify-center">
            <DreamCatcher 
              isRecording={isRecording}
              voiceEnabled={voiceEnabled}
              isTranscribing={isTranscribing}
              onToggleRecording={undefined}
            />
          </div>

          {/* Microphone button at bottom */}
          <div className="pb-8 px-6">
            <div className="flex justify-center">
              <button
                aria-label="Record"
                onClick={voiceEnabled ? toggleRecording : () => setHasRecorded(true)}
                disabled={isTranscribing}
                className={`relative h-16 w-16 rounded-full flex items-center justify-center text-white
                           transition-transform duration-150 ease-out
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70
                           hover:scale-105 active:scale-95 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gradient-to-b from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dark)] btn-glow'
                }`}
              >
                {voiceEnabled ? (
                  isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
                {!isRecording && (
                  <span className="absolute -z-10 inset-0 rounded-full blur-2xl bg-yellow-400/20" />
                )}
              </button>
            </div>
            
            {/* Status text */}
            <div className="text-center mt-3">
              <p className="text-sm cosmic-text-200">
                {isRecording 
                  ? "Recording..." 
                  : isTranscribing 
                    ? "Transcribing..." 
                    : voiceEnabled 
                      ? "Tap to record your dream" 
                      : "Tap to write your dream"
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}