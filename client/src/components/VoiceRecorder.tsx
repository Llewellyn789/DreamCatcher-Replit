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
  onViewDream: (dreamId: number) => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams, onViewDream }: VoiceRecorderProps) {
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

  // Initialize MediaRecorder
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setVoiceEnabled(true);
      })
      .catch((error) => {
        console.error('Microphone access denied:', error);
        setVoiceEnabled(false);
      });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasRecorded(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record your dream.",
        variant: "destructive",
      });
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

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setDreamText(prev => prev + (prev ? ' ' : '') + data.transcript);
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Save Error",
        description: "Failed to save your dream. Please try again.",
        variant: "destructive",
      });
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

      {/* Center section - Large dreamcatcher icon or text area */}
      <div className="flex-1 flex items-center justify-center px-6">
        {!(dreamText || hasRecorded) ? (
          // Show large dreamcatcher icon when no recording has been made
          <div className="text-center transform scale-[3]">
            <DreamCatcher />
          </div>
        ) : (
          // Show text area when there's content or recording has been made
          <div className="w-full max-w-md">
            <Textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={isRecording ? "Recording your dream..." : isTranscribing ? "Transcribing..." : "Describe your dream here..."}
              className="glass-effect cosmic-text-50 placeholder-cosmic-300 border-cosmic-300/30 resize-none min-h-[200px] text-base leading-relaxed"
              disabled={isRecording || isTranscribing}
            />
            
            {/* Action buttons */}
            <div className="flex space-x-3 mt-4">
              <Button
                onClick={saveDream}
                disabled={!dreamText.trim() || createDreamMutation.isPending}
                className="flex-1 gradient-gold cosmic-text-950 font-semibold hover:opacity-90 transition-all duration-200"
              >
                {createDreamMutation.isPending ? "Saving..." : "Save Dream"}
              </Button>
              
              <Button
                onClick={interpretDream}
                disabled={!dreamText.trim() || isAnalyzing}
                className="flex-1 glass-effect cosmic-text-50 border border-cosmic-300/30 hover:border-cosmic-200/50 font-semibold transition-all duration-200"
              >
                {isAnalyzing ? "Analyzing..." : "Interpret Dream"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom section - Record button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {voiceEnabled && (
          <Button
            onClick={toggleRecording}
            disabled={!voiceEnabled || isTranscribing}
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