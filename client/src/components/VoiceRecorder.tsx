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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize MediaRecorder for audio recording
  useEffect(() => {
    const initializeRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];
            
            // Send audio to Whisper API
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Transcription failed');
            }
            
            const { transcript } = await response.json();
            if (transcript.trim()) {
              setDreamText(prev => prev + (prev ? ' ' : '') + transcript.trim());
            }
          } catch (error) {
            console.error('Transcription failed:', error);
            toast({
              title: "Transcription Error",
              description: "Failed to convert speech to text. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
          }
        };

        setVoiceEnabled(true);
      } catch (error) {
        console.error('Failed to initialize microphone:', error);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to record your dream.",
          variant: "destructive",
        });
      }
    };

    initializeRecorder();
  }, [toast]);

  const createDreamMutation = useMutation({
    mutationFn: async (dreamData: { title: string; content: string; duration?: string }) => {
      const response = await apiRequest({
        url: "/api/dreams",
        method: "POST",
        body: dreamData,
      });
      return response;
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
    if (mediaRecorderRef.current && voiceEnabled) {
      try {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
      const analysisResponse = await apiRequest({
        url: `/api/dreams/${dreamResponse.id}/analyze`,
        method: "POST",
      });

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
    <div className="min-h-screen cosmic-gradient flex flex-col">
      {/* Header */}
      <div className="cosmic-header p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold cosmic-text-950">DreamCatcher</h1>
          <Button
            variant="ghost"
            onClick={onNavigateToSavedDreams}
            className="cosmic-text-700 hover:cosmic-text-950 flex items-center gap-2"
          >
            <span>View Dreams</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-8">
        {/* Voice Toggle */}
        <div className="flex items-center justify-center space-x-3">
          <span className="cosmic-text-700 text-sm">Manual Input</span>
          <Switch
            checked={voiceEnabled}
            onCheckedChange={setVoiceEnabled}
            disabled={!voiceEnabled}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
          />
          <span className="cosmic-text-700 text-sm">Voice Recording</span>
        </div>

        {/* Voice Recording Section */}
        {voiceEnabled && (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <p className="cosmic-text-600 text-lg">
                {isRecording ? "Recording your dream..." : 
                 isTranscribing ? "Converting speech to text..." : 
                 "Ready to capture your dream"}
              </p>
            </div>

            <Button
              onClick={toggleRecording}
              disabled={!voiceEnabled || isTranscribing}
              className={`w-full gradient-gold cosmic-text-950 font-semibold py-6 text-lg space-x-3 hover:shadow-lg transition-all duration-200 ${
                isRecording ? 'recording-pulse' : ''
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>
                {isRecording ? 'Stop Recording' : 
                 isTranscribing ? 'Processing...' : 
                 'Record Dream'}
              </span>
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
            disabled={isRecording || isTranscribing}
          />
        </div>

        {/* Interpret Button */}
        <div className="sticky bottom-6 z-10">
          <Button
            onClick={handleInterpretDream}
            disabled={!dreamText.trim() || isAnalyzing || isRecording || isTranscribing}
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
    </div>
  );
}