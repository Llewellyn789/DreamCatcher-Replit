import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, TrendingUp, Calendar, Brain, Eye, Clock, Folder, Home } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

import type { Dream } from "@shared/schema";

interface DreamAnalyticsProps {
  onBack: () => void;
  onNavigateToSavedDreams?: () => void;
  onNavigateHome?: () => void;
}

interface MonthlyData {
  month: string;
  dreams: number;
}

interface ThemeData {
  theme: string;
  count: number;
  color: string;
}

export default function DreamAnalytics({ onBack, onNavigateToSavedDreams, onNavigateHome }: DreamAnalyticsProps) {
  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });



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
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Dream Analytics</h1>
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[hsl(var(--cosmic-300))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="cosmic-text-300">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dreams || dreams.length === 0) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Dream Analytics</h1>
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Brain className="w-16 h-16 cosmic-text-300 mx-auto mb-4" />
            <h3 className="cosmic-text-50 text-lg font-semibold mb-2">No Dreams Yet</h3>
            <p className="cosmic-text-300">Record some dreams to see your analytics</p>
          </div>
        </div>
      </div>
    );
  }

  // Process monthly dream frequency
  const monthlyData: MonthlyData[] = (() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
    
    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const dreamsInMonth = dreams.filter(dream => 
        format(new Date(dream.createdAt), 'yyyy-MM') === monthKey
      ).length;
      
      return {
        month: format(month, 'MMM'),
        dreams: dreamsInMonth
      };
    });
  })();

  // Extract common themes from analyzed dreams
  const themeAnalysis: ThemeData[] = (() => {
    const analyzedDreams = dreams.filter(dream => dream.analysis);
    const themeMap = new Map<string, number>();
    
    analyzedDreams.forEach(dream => {
      if (dream.analysis) {
        try {
          const analysis = JSON.parse(dream.analysis);
          
          // Extract themes from symbols section
          const symbols = analysis.symbols?.toLowerCase() || '';
          const archetypes = analysis.archetypes?.toLowerCase() || '';
          
          // Common dream themes to look for
          const themeKeywords = [
            'water', 'flying', 'falling', 'animals', 'family', 'work', 
            'death', 'love', 'fear', 'home', 'travel', 'nature', 'fire',
            'darkness', 'light', 'childhood', 'transformation', 'chase'
          ];
          
          themeKeywords.forEach(theme => {
            if (symbols.includes(theme) || archetypes.includes(theme)) {
              themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
            }
          });
        } catch (e) {
          console.error('Error parsing dream analysis:', e);
        }
      }
    });
    
    const colors = [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'
    ];
    
    return Array.from(themeMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, count], index) => ({
        theme: theme.charAt(0).toUpperCase() + theme.slice(1),
        count,
        color: colors[index % colors.length]
      }));
  })();

  // Calculate statistics
  const totalDreams = dreams.length;
  const analyzedDreams = dreams.filter(dream => dream.analysis).length;
  const averageDreamsPerMonth = totalDreams > 0 ? (totalDreams / 6).toFixed(1) : '0';
  const analysisRate = totalDreams > 0 ? Math.round((analyzedDreams / totalDreams) * 100) : 0;

  return (
    <div className="flex flex-col h-screen px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateToSavedDreams}
          className="cosmic-text-200 hover:cosmic-text-50"
        >
          <Folder className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Dream Analytics</h1>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/playground', '_blank')}
            className="cosmic-text-200 hover:cosmic-text-50 text-xs"
          >
            Draft Features
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateHome}
            className="cosmic-text-200 hover:cosmic-text-50"
          >
            <Home className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-effect border-cosmic-300/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm cosmic-text-300 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Total Dreams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cosmic-text-50">{totalDreams}</div>
              <p className="text-xs cosmic-text-400">{averageDreamsPerMonth}/month avg</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-cosmic-300/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm cosmic-text-300 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold cosmic-text-50">{analyzedDreams}</div>
              <p className="text-xs cosmic-text-400">{analysisRate}% analyzed</p>
            </CardContent>
          </Card>
        </div>

        {/* Dream Frequency Chart */}
        <Card className="glass-effect border-cosmic-300/30">
          <CardHeader>
            <CardTitle className="cosmic-text-50 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Dream Frequency (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cosmic-300))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--cosmic-300))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--cosmic-300))" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--cosmic-800))',
                      border: '1px solid hsl(var(--cosmic-300))',
                      borderRadius: '8px',
                      color: 'hsl(var(--cosmic-50))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="dreams" 
                    stroke="#FFD700" 
                    strokeWidth={2}
                    dot={{ fill: "#FFD700", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Common Themes */}
        {themeAnalysis.length > 0 && (
          <Card className="glass-effect border-cosmic-300/30">
            <CardHeader>
              <CardTitle className="cosmic-text-50 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Common Dream Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cosmic-300))" opacity={0.3} />
                    <XAxis 
                      dataKey="theme" 
                      stroke="hsl(var(--cosmic-300))" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="hsl(var(--cosmic-300))" 
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--cosmic-800))',
                        border: '1px solid hsl(var(--cosmic-300))',
                        borderRadius: '8px',
                        color: 'hsl(var(--cosmic-50))'
                      }}
                    />
                    <Bar dataKey="count">
                      {themeAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Theme Distribution Pie Chart */}
        {themeAnalysis.length > 0 && (
          <Card className="glass-effect border-cosmic-300/30">
            <CardHeader>
              <CardTitle className="cosmic-text-50 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Theme Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={themeAnalysis}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ theme, percent }) => `${theme} ${(percent * 100).toFixed(0)}%`}
                    >
                      {themeAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--cosmic-800))',
                        border: '1px solid hsl(var(--cosmic-300))',
                        borderRadius: '8px',
                        color: 'hsl(var(--cosmic-50))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}