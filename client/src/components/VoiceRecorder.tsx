import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Folder } from "lucide-react";

interface VoiceRecorderProps {
  onNavigateToSavedDreams: () => void;
}

export default function VoiceRecorder({ onNavigateToSavedDreams }: VoiceRecorderProps) {
  const [title, setTitle] = useState("");
  const [dreamText, setDreamText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDreamMutation = useMutation({
    mutationFn: async (dreamData: { title: string; content: string }) => {
      const response = await apiRequest("POST", "/api/dreams", dreamData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      toast({
        title: "Dream Saved",
        description: "Your dream has been successfully recorded.",
      });
      setTitle("");
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

  const handleSaveDream = async () => {
    if (!dreamText.trim()) {
      toast({
        title: "No Dream Content",
        description: "Please describe your dream before saving.",
        variant: "destructive",
      });
      return;
    }

    const dreamTitle = title.trim() || dreamText.substring(0, 50) + (dreamText.length > 50 ? "..." : "");

    createDreamMutation.mutate({
      title: dreamTitle,
      content: dreamText,
    });
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Header with Folder Icon */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold cosmic-text-50">Record Your Dream</h2>
        <Button
          variant="ghost"
          onClick={onNavigateToSavedDreams}
          className="cosmic-text-200 hover:cosmic-text-50 p-2"
        >
          <Folder className="w-6 h-6" />
        </Button>
      </div>

      {/* Dream Title Input */}
      <div className="space-y-2">
        <label className="cosmic-text-200 text-sm font-medium">Dream Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your dream a title..."
          className="glass-card border-0 cosmic-text-800 placeholder:cosmic-text-500"
        />
      </div>

      {/* Dream Content Input */}
      <div className="space-y-2 flex-1">
        <label className="cosmic-text-200 text-sm font-medium">Describe Your Dream</label>
        <Textarea
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder="Tell me about your dream in detail..."
          className="min-h-[300px] glass-card border-0 cosmic-text-800 placeholder:cosmic-text-500 text-base leading-relaxed resize-none"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveDream}
        disabled={!dreamText.trim() || createDreamMutation.isPending}
        className="w-full gradient-gold cosmic-text-950 font-semibold py-4 text-lg hover:shadow-xl transition-all duration-300"
      >
        {createDreamMutation.isPending ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Saving Dream...</span>
          </div>
        ) : (
          <span>Save Dream</span>
        )}
      </Button>
    </div>
  );
}