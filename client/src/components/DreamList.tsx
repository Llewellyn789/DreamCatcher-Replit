import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Moon, Folder, BarChart3, Home, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getAllDreams, exportJSON, importJSON, type Dream } from "@/lib/dataManager";
import { useRef } from "react";

interface DreamListProps {
  onBack: () => void;
  onViewDream: (dreamId: string) => void;
  onNavigateToAnalytics?: () => void;
}

export default function DreamList({ onBack, onViewDream, onNavigateToAnalytics }: DreamListProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ["dreams"],
    queryFn: getAllDreams,
  });

  const handleExport = async () => {
    try {
      const jsonData = await exportJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dreams-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Dreams exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export dreams",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importJSON(file);
      toast({
        title: "Import successful",
        description: `Imported ${result.count} new dreams`,
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Import failed", 
        description: error instanceof Error ? error.message : "Failed to import dreams",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <Home className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Saved Dreams</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToAnalytics}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <BarChart3 className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--cosmic-200))] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="cosmic-text-200 hover:cosmic-text-50"
        >
          <Home className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Saved Dreams</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            className="cosmic-text-200 hover:cosmic-text-50"
            title="Export dreams"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="cosmic-text-200 hover:cosmic-text-50"
            title="Import dreams"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToAnalytics}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <BarChart3 className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

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

                <p className="cosmic-text-200 text-sm leading-relaxed mb-3 line-clamp-2">
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
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 mb-4 opacity-50" role="img" aria-label="Moon icon">
              <Moon className="w-full h-full cosmic-text-300" />
            </div>
            <p className="cosmic-text-300 mb-2 text-lg">No dreams recorded yet</p>
            <p className="cosmic-text-400 text-sm">Record your first dream to begin your journey</p>
          </div>
        )}
      </div>
    </div>
  );
}