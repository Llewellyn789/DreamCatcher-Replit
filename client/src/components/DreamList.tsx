import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Moon, BarChart3, Home, Mic } from "lucide-react";
import { format } from "date-fns";
import { getAllDreams, type Dream } from "@/lib/dataManager";
import { useEffect } from "react";
import { track } from "@/analytics";

interface DreamListProps {
  onBack: () => void;
  onViewDream: (dreamId: string) => void;
  onNavigateToAnalytics?: () => void;
}

export default function DreamList({ onBack, onViewDream, onNavigateToAnalytics }: DreamListProps) {
  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ["dreams"],
    queryFn: getAllDreams,
  });

  useEffect(() => {
    track('dream_log_opened');
  }, []);


  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen px-4 sm:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cosmic-text-200 hover:cosmic-text-50 min-h-[44px] min-w-[44px]"
          >
            <Home className="w-6 h-6" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold cosmic-text-50 text-shadow-gold text-center">Saved Dreams</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToAnalytics}
            className="cosmic-text-200 hover:cosmic-text-50 min-h-[44px] min-w-[44px]"
          >
            <BarChart3 className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-effect rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen px-4 sm:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="cosmic-text-200 hover:cosmic-text-50 min-h-[44px] min-w-[44px]"
        >
          <Home className="w-6 h-6" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold cosmic-text-50 text-shadow-gold text-center">Saved Dreams</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateToAnalytics}
          className="cosmic-text-200 hover:cosmic-text-50 min-h-[44px] min-w-[44px]"
        >
          <BarChart3 className="w-6 h-6" />
        </Button>
      </div>

      {/* Dreams List */}
      <div className="flex-1 overflow-y-auto">
        {dreams && dreams.length > 0 ? (
          <div className="space-y-4">
            {dreams.map((dream) => (
              <div
                key={dream.id}
                onClick={() => onViewDream(dream.id)}
                className="glass-effect rounded-xl p-4 hover:bg-opacity-10 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="cosmic-text-50 font-semibold text-lg">{dream.title}</h3>
                  <span className="cosmic-text-300 text-sm">
                    {formatDate(dream.createdAt)}
                  </span>
                </div>

                <p className="cosmic-text-200 text-base leading-relaxed mb-3 line-clamp-2">
                  {truncateText(dream.content)}
                </p>

                <div className="flex items-center space-x-4 cosmic-text-300 text-xs">
                  {dream.duration && (
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{dream.duration}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="w-20 h-20 mb-6 opacity-60" role="img" aria-label="Moon icon">
              <Moon className="w-full h-full cosmic-text-300" />
            </div>
            <h2 className="cosmic-text-50 text-xl font-semibold mb-3">No dreams yet</h2>
            <p className="cosmic-text-300 text-base mb-8 leading-relaxed max-w-sm">
              Record your first dream to begin your journey of self-discovery and unlock the insights within your subconscious mind.
            </p>
            <Button
              onClick={onBack}
              className="gradient-gold cosmic-text-950 text-base px-6 py-3 h-12 min-w-[140px] font-medium"
            >
              <Mic className="w-5 h-5 mr-2" />
              Record Dream
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}