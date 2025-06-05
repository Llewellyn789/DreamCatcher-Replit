import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Share, Quote, Brain, Calendar, Clock, Mic, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Dream, JungianAnalysis } from "@shared/schema";

interface DreamDetailProps {
  dreamId: number;
  onBack: () => void;
  onNavigateHome?: () => void;
}

export default function DreamDetail({ dreamId, onBack, onNavigateHome }: DreamDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dream, isLoading } = useQuery<Dream>({
    queryKey: [`/api/dreams/${dreamId}`],
  });

  const analyzeDreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/dreams/${dreamId}/analyze`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dreams/${dreamId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
    },
    onError: () => {
      console.error("Failed to analyze dream");
    },
  });

  const deleteDreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/dreams/${dreamId}`);
      if (!response.ok) {
        throw new Error('Failed to delete dream');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      queryClient.removeQueries({ queryKey: [`/api/dreams/${dreamId}`] });
      onBack(); // Navigate back to the dreams list
    },
    onError: (error) => {
      console.error("Failed to delete dream:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="animate-spin w-6 h-6 border-2 border-[hsl(var(--cosmic-200))] border-t-transparent rounded-full" />
          <div className="w-6" />
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold cosmic-text-50 text-shadow-gold">Dream Not Found</h1>
          <div className="w-6" />
        </div>
      </div>
    );
  }

  const analysis: JungianAnalysis | null = dream.analysis ? JSON.parse(dream.analysis) : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dream: ${dream.title}`,
          text: dream.content,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`Dream: ${dream.title}\n\n${dream.content}`);
        toast({
          title: "Copied",
          description: "Dream content copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Unable to share this dream.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="cosmic-text-200 hover:cosmic-text-50"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold cosmic-text-50 text-shadow-gold flex-1 text-center px-4">
          {dream.title}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="cosmic-text-200 hover:cosmic-text-50"
        >
          <Share className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Dream Text */}
        <div className="glass-effect rounded-xl p-6">
          <h3 className="cosmic-text-200 font-semibold mb-3 flex items-center text-lg">
            <Quote className="w-5 h-5 mr-2" />
            Your Dream
          </h3>
          <p className="cosmic-text-100 leading-relaxed">{dream.content}</p>
        </div>

        {/* Jungian Analysis */}
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="cosmic-text-200 font-semibold flex items-center text-lg">
              <Brain className="w-5 h-5 mr-2" />
              Jungian Analysis
            </h3>
            {!analysis && (
              <Button
                onClick={() => analyzeDreamMutation.mutate()}
                disabled={analyzeDreamMutation.isPending}
                className="gradient-gold cosmic-text-950 text-sm px-4 py-2"
              >
                {analyzeDreamMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze Dream'
                )}
              </Button>
            )}
          </div>
          
          {analysis ? (
            <div className="space-y-4">
              <div>
                <h4 className="cosmic-text-50 font-medium mb-2 gradient-gold bg-clip-text text-transparent">
                  Archetypes:
                </h4>
                <p className="cosmic-text-200 text-sm leading-relaxed">{analysis.archetypes}</p>
              </div>
              
              <div>
                <h4 className="cosmic-text-50 font-medium mb-2 gradient-gold bg-clip-text text-transparent">
                  Symbols:
                </h4>
                <p className="cosmic-text-200 text-sm leading-relaxed">{analysis.symbols}</p>
              </div>
              
              <div>
                <h4 className="cosmic-text-50 font-medium mb-2 gradient-gold bg-clip-text text-transparent">
                  Personal and Collective Unconscious:
                </h4>
                <p className="cosmic-text-200 text-sm leading-relaxed">{analysis.unconscious}</p>
              </div>
              
              <div>
                <h4 className="cosmic-text-50 font-medium mb-2 gradient-gold bg-clip-text text-transparent">
                  Psychological Insights:
                </h4>
                <p className="cosmic-text-200 text-sm leading-relaxed">{analysis.insights}</p>
              </div>
              
              <div>
                <h4 className="cosmic-text-50 font-medium mb-2 gradient-gold bg-clip-text text-transparent">
                  Integration Opportunities:
                </h4>
                <p className="cosmic-text-200 text-sm leading-relaxed">{analysis.integration}</p>
              </div>
            </div>
          ) : (
            <p className="cosmic-text-300 text-sm italic">
              Click "Analyze Dream" to get your Jungian psychological analysis.
            </p>
          )}
        </div>

        {/* Dream Metadata */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center justify-between cosmic-text-300 text-sm">
            <span className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(dream.createdAt), 'MMMM d, yyyy')}</span>
            </span>
            {dream.duration && (
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{dream.duration}</span>
              </span>
            )}

          </div>
        </div>

        {/* Delete button - bottom right */}
        <div className="fixed bottom-8 right-8 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={deleteDreamMutation.isPending}
                className="w-12 h-12 rounded-full glass-effect cosmic-text-300 hover:cosmic-text-50 border border-cosmic-300/30 hover:border-cosmic-200/50 transition-all duration-200 shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="cosmic-bg-800 border border-cosmic-300/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="cosmic-text-50">Delete Dream</AlertDialogTitle>
                <AlertDialogDescription className="cosmic-text-300">
                  Are you sure you want to delete this dream?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cosmic-text-300 border-cosmic-300/30 hover:cosmic-text-50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteDreamMutation.mutate()}
                  className="gradient-gold cosmic-text-950 hover:opacity-90"
                >
                  Delete Dream
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
