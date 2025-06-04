import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  onNavigateToSavedDreams: () => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false; // Use short bursts instead
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const result = event.results[0];
          if (result.isFinal) {
            const transcript = result[0].transcript.trim();
            if (transcript) {
              setDreamText(prev => prev + (prev ? ' ' : '') + transcript);
            }
          }
        };

        recognitionRef.current.onend = () => {
          // Auto-restart if still recording
          if (isRecording && recognitionRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                try {
                  recognitionRef.current.start();
                } catch (error) {
                  console.log('Recognition restart failed:', error);
                  // If restart fails, set recording to false
                  setIsRecording(false);
                }
              }
            }, 200);
          }
        };

        recognitionRef.current.onspeechend = () => {
          // Don't stop on speech end, let onend handle restart
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          
          // Only stop recording for serious errors, not network issues
          if (event.error === 'not-allowed' || event.error === 'no-speech') {
            setIsRecording(false);
            toast({
              title: "Recording Error",
              description: "There was an issue with voice recording. Please try again.",
              variant: "destructive",
            });
          } else {
            // For other errors, try to restart
            if (isRecording && recognitionRef.current) {
              restartTimeoutRef.current = setTimeout(() => {
                if (recognitionRef.current && isRecording) {
                  try {
                    recognitionRef.current.start();
                  } catch (error) {
                    console.log('Recognition restart after error failed:', error);
                    setIsRecording(false);
                  }
                }
              }, 500);
            }
          }
        };
      }
    }
  }, [toast]);

  const createDreamMutation = useMutation({
    mutationFn: async (dreamData: { title: string; content: string; duration?: string }) => {
      const response = await apiRequest("POST", "/api/dreams", dreamData);
      return response.json();
    },
    onSuccess: async (dream) => {
      // Analyze the dream immediately after creation
      setIsAnalyzing(true);
      try {
        await apiRequest("POST", `/api/dreams/${dream.id}/analyze`);
        queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
        toast({
          title: "Dream Recorded & Analyzed",
          description: "Your dream has been saved and analyzed successfully.",
        });
        onNavigateToSavedDreams();
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: "Dream saved but analysis failed. You can try again later.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your dream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    setIsRecording(false);
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleInterpret = async () => {
    if (!dreamText.trim()) {
      toast({
        title: "No Content",
        description: "Please record or type your dream first.",
        variant: "destructive",
      });
      return;
    }

    // Generate a title from the first few words
    const title = dreamText.trim().split(' ').slice(0, 4).join(' ') + '...';
    
    createDreamMutation.mutate({
      title,
      content: dreamText.trim(),
      duration: isRecording ? "Recording" : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Voice Recording Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-3">
          <Mic className="cosmic-text-200 w-5 h-5" />
          <h2 className="cosmic-text-100 text-lg font-medium italic">Record your dream with your voice</h2>
        </div>
        
        {/* Voice Commands Toggle */}
        <div className="flex items-center justify-center space-x-3">
          <span className="cosmic-text-200 text-sm">Voice Commands</span>
          <Switch
            checked={voiceEnabled}
            onCheckedChange={setVoiceEnabled}
            className="data-[state=checked]:bg-[hsl(var(--cosmic-200))]"
          />
        </div>

        {/* Start Recording Button */}
        <Button
          onClick={handleRecordToggle}
          disabled={createDreamMutation.isPending || isAnalyzing}
          className={`w-full gradient-gold cosmic-text-950 font-semibold py-6 text-lg space-x-3 hover:shadow-lg transition-all duration-200 ${
            isRecording ? 'recording-pulse' : ''
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
        </Button>
      </div>

      {/* Manual Input Section */}
      <div className="flex-1 flex flex-col space-y-4">
        <h3 className="cosmic-text-100 text-lg font-medium italic text-center">
          Or type your dream directly:
        </h3>
        
        <div className="glass-effect rounded-xl p-4 overflow-hidden flex-1">
          <Textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="Type your dream here..."
            className="bg-transparent cosmic-text-50 placeholder:cosmic-text-300 border-none resize-none focus:ring-0 h-full w-full mobile-textarea"
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflow: 'auto'
            }}
          />
        </div>

        <Button
          onClick={handleInterpret}
          disabled={!dreamText.trim() || createDreamMutation.isPending || isAnalyzing}
          className={`w-full font-semibold py-6 text-lg transition-all duration-200 disabled:opacity-50 ${
            dreamText.trim() 
              ? 'gradient-gold cosmic-text-950 hover:shadow-lg' 
              : 'cosmic-bg-800 cosmic-text-200 border border-[hsl(var(--cosmic-300))] hover:cosmic-bg-700'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              <span className="shimmer-text">Analyzing your dream...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span>🔮 Interpret Dream</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
