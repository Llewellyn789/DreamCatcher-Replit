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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setDreamText(prev => prev + finalTranscript + ' ');
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: "Recording Error",
            description: "There was an issue with voice recording. Please try again.",
            variant: "destructive",
          });
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
    <div className="flex-1 space-y-8">
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
      <div className="space-y-4">
        <h3 className="cosmic-text-100 text-lg font-medium italic text-center">
          Or type your dream directly:
        </h3>
        
        <div className="glass-effect rounded-xl p-4">
          <Textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="Type your dream here..."
            className="bg-transparent cosmic-text-50 placeholder:cosmic-text-300 border-none resize-none focus:ring-0 h-32"
          />
        </div>

        <Button
          onClick={handleInterpret}
          disabled={!dreamText.trim() || createDreamMutation.isPending || isAnalyzing}
          className="w-full cosmic-bg-800 cosmic-text-200 font-semibold py-4 border border-[hsl(var(--cosmic-300))] hover:cosmic-bg-700 transition-all duration-200 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span className="shimmer-text">Analyzing your dream...</span>
            </div>
          ) : (
            <>
              <span>Interpret Text</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
