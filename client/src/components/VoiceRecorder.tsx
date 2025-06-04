import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, Folder } from "lucide-react";
import DreamCatcher from "@/components/DreamCatcher";

interface VoiceRecorderProps {
  onNavigateToSavedDreams: () => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript.trim()) {
            const newText = finalTranscript.trim();
            
            // Only add if it's actually new content
            if (newText !== lastTranscriptRef.current) {
              lastTranscriptRef.current = newText;
              
              setDreamText(prev => {
                // Prevent adding if the new text is already contained at the end
                if (prev.endsWith(newText)) {
                  return prev;
                }
                
                return prev + (prev ? ' ' : '') + newText;
              });
            }
          }
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Recognition restart failed');
              setIsRecording(false);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setIsRecording(false);
            toast({
              title: "Microphone Access Required",
              description: "Please allow microphone access to record your dream.",
              variant: "destructive",
            });
          }
        };

        setVoiceEnabled(true);
      }
    }
  }, [isRecording, toast]);

  const createDreamMutation = useMutation({
    mutationFn: async (dreamData: { title: string; content: string; duration?: string }) => {
      const response = await apiRequest("POST", "/api/dreams", dreamData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      toast({
        title: "Dream Saved",
        description: "Your dream has been successfully recorded.",
      });
      setDreamText("");
    },
    onError: (error) => {
      console.error("Failed to save dream:", error);
      toast({
        title: "Save Error",
        description: "Failed to save your dream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = () => {
    if (recognitionRef.current && voiceEnabled) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to start voice recording. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setHasRecorded(true);
      lastTranscriptRef.current = ""; // Reset for next recording
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleInterpretDream = async () => {
    if (!dreamText.trim()) {
      toast({
        title: "No Dream Content",
        description: "Please record or type your dream before interpreting.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const title = dreamText.substring(0, 50) + (dreamText.length > 50 ? "..." : "");
      
      // Create the dream first
      const dreamResponse = await createDreamMutation.mutateAsync({
        title,
        content: dreamText,
      });

      // Then analyze it
      const analysisResponse = await apiRequest("POST", `/api/dreams/${dreamResponse.id}/analyze`, {});

      toast({
        title: "Dream Analyzed",
        description: "Your dream has been interpreted using Jungian analysis.",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your dream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Center section - Large dreamcatcher icon or text area */}
      <div className="flex-1 flex items-center justify-center px-6">
        {!(dreamText || hasRecorded) ? (
          // Show large dreamcatcher icon when no recording has been made
          <div className="text-center transform scale-[3]">
            <DreamCatcher />
          </div>
        ) : (
          // Show text area after recording
          <div className="w-full max-w-2xl space-y-4">
            <Textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="Your recorded dream will appear here, or you can type manually..."
              className="min-h-[300px] glass-card border-0 cosmic-text-800 placeholder:cosmic-text-500 text-base leading-relaxed resize-none"
              disabled={isRecording}
            />
            
            {/* Interpret Button - only show when there's text */}
            {dreamText.trim() && (
              <Button
                onClick={handleInterpretDream}
                disabled={isAnalyzing || isRecording}
                className="w-full gradient-cosmic cosmic-text-50 font-semibold py-4 text-lg hover:shadow-xl transition-all duration-300"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Interpreting Dream...</span>
                  </div>
                ) : (
                  <span>Interpret Dream</span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bottom section - Record button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {voiceEnabled && (
          <Button
            onClick={toggleRecording}
            disabled={!voiceEnabled}
            className={`w-16 h-16 rounded-full gradient-gold cosmic-text-950 font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center ${
              isRecording ? 'recording-pulse' : ''
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
        )}
      </div>
    </div>
  );
}