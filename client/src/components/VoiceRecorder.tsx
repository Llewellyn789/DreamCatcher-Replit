import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mic, MicOff, Folder } from "lucide-react";

interface VoiceRecorderProps {
  onNavigateToSavedDreams: () => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);
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
              finalTranscript += transcript + ' ';
            }
          }
          
          if (finalTranscript.trim()) {
            setDreamText(prev => {
              const newText = finalTranscript.trim();
              if (!prev.endsWith(newText.slice(0, 20))) {
                return prev + (prev ? ' ' : '') + newText;
              }
              return prev;
            });
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
    <div className="flex-1 flex flex-col space-y-8">
      {/* Voice Recording Section */}
      {voiceEnabled && (
        <div className="text-center space-y-6">
          <Button
            onClick={toggleRecording}
            disabled={!voiceEnabled}
            className={`w-full gradient-gold cosmic-text-950 font-semibold py-6 text-lg space-x-3 hover:shadow-lg transition-all duration-200 ${
              isRecording ? 'recording-pulse' : ''
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isRecording ? 'Stop Recording' : 'Record Dream'}</span>
          </Button>
        </div>
      )}

      {/* Manual Input Section */}
      <div className="space-y-4">
        <Textarea
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder={voiceEnabled ? "Your recorded dream will appear here, or you can type manually..." : "Describe your dream in detail..."}
          className="min-h-[200px] glass-card border-0 cosmic-text-800 placeholder:cosmic-text-500 text-base leading-relaxed resize-none"
          disabled={isRecording}
        />
      </div>

      {/* Interpret Button */}
      <div className="sticky bottom-6 z-10">
        <Button
          onClick={handleInterpretDream}
          disabled={!dreamText.trim() || isAnalyzing || isRecording}
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
      </div>
    </div>
  );
}