import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Dream } from "@shared/schema";

interface DreamDetailProps {
  dreamId: number;
  onBack: () => void;
}

export default function DreamDetail({ dreamId, onBack }: DreamDetailProps) {
  const { data: dream, isLoading } = useQuery<Dream>({
    queryKey: [`/api/dreams/${dreamId}`],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--cosmic-200))] border-t-transparent rounded-full" />
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
          <h1 className="text-xl font-bold cosmic-text-50">Dream Not Found</h1>
          <div className="w-6" />
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold cosmic-text-50 text-center flex-1 px-4">
          {dream.title}
        </h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Dream Content */}
        <div className="glass-effect rounded-xl p-6">
          <p className="cosmic-text-100 leading-relaxed text-lg">{dream.content}</p>
        </div>

        {/* Date */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center cosmic-text-300 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{format(new Date(dream.createdAt), 'MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}