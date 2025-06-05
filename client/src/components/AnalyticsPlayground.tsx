import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Play, RefreshCw, BarChart3, Brain, Calendar, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Dream } from "@shared/schema";

interface AnalyticsPlaygroundProps {
  onBack: () => void;
}

export default function AnalyticsPlayground({ onBack }: AnalyticsPlaygroundProps) {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  // Test dream creation mutation
  const createTestDreamMutation = useMutation({
    mutationFn: async (testDream: any) => {
      return apiRequest("POST", "/api/dreams", testDream);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
    }
  });

  // Analytics test scenarios
  const testScenarios = [
    {
      id: "dream-frequency",
      title: "Dream Frequency Analysis",
      description: "Test temporal patterns and recording frequency",
      icon: <Calendar className="w-5 h-5" />,
      color: "#4ECDC4"
    },
    {
      id: "symbol-analysis",
      title: "Symbol Pattern Recognition",
      description: "Test Jungian symbol extraction and categorization",
      icon: <Brain className="w-5 h-5" />,
      color: "#FF6B6B"
    },
    {
      id: "emotional-trends",
      title: "Emotional Trend Mapping",
      description: "Test sentiment analysis and mood tracking",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "#FFD700"
    },
    {
      id: "ai-insights",
      title: "AI Interpretation Quality",
      description: "Test depth and accuracy of AI analysis",
      icon: <Sparkles className="w-5 h-5" />,
      color: "#96CEB4"
    }
  ];

  // Sample test dreams for comprehensive analytics testing
  const generateTestDreams = async () => {
    const testDreams = [
      {
        title: "Ocean Journey",
        content: "I was swimming in a vast ocean with dolphins. The water was crystal clear and I could breathe underwater. There was a golden palace beneath the waves with ancient symbols carved into its walls.",
        analysis: JSON.stringify({
          archetypes: ["The Self", "The Wise Old Man", "The Great Mother"],
          symbols: ["water", "ocean", "dolphins", "palace", "gold"],
          personalUnconsciousElements: ["freedom", "exploration", "hidden knowledge"],
          collectiveUnconsciousElements: ["oceanic consciousness", "ancient wisdom", "spiritual transformation"],
          psychologicalInsights: "The ocean represents the unconscious mind, while breathing underwater suggests integration with unconscious content.",
          integrationOpportunities: "Explore creative expression and spiritual practices to integrate the wisdom symbolized by the underwater palace."
        })
      },
      {
        title: "Forest Guardian",
        content: "Walking through a dark forest, I encountered a massive wolf with golden eyes. Instead of fear, I felt protected. The wolf led me to a clearing where an old tree stood with faces carved in its bark.",
        analysis: JSON.stringify({
          archetypes: ["The Shadow", "The Wise Old Man", "The Self"],
          symbols: ["forest", "wolf", "tree", "eyes", "faces"],
          personalUnconsciousElements: ["instinct", "protection", "ancient wisdom"],
          collectiveUnconsciousElements: ["nature spirit", "ancestral knowledge", "shamanic journey"],
          psychologicalInsights: "The wolf represents instinctual wisdom and protection from the unconscious.",
          integrationOpportunities: "Connect with nature and explore meditation practices to access inner wisdom."
        })
      },
      {
        title: "Flying Above Cities",
        content: "I was flying high above a futuristic city with crystalline towers. People below looked up and waved. I felt completely free and could control my direction with thought alone.",
        analysis: JSON.stringify({
          archetypes: ["The Hero", "The Magician", "The Self"],
          symbols: ["flying", "city", "crystal", "towers", "sky"],
          personalUnconsciousElements: ["freedom", "control", "transcendence"],
          collectiveUnconsciousElements: ["spiritual ascension", "technological harmony", "human potential"],
          psychologicalInsights: "Flying dreams often represent liberation from limiting beliefs and expanded consciousness.",
          integrationOpportunities: "Pursue goals that align with your highest aspirations and explore creative visualization techniques."
        })
      }
    ];

    setActiveTest("generating");
    for (const dream of testDreams) {
      await createTestDreamMutation.mutateAsync(dream);
    }
    setActiveTest(null);
  };

  // Calculate analytics data
  const analyticsData = dreams ? {
    totalDreams: dreams.length,
    analyzedDreams: dreams.filter(d => d.analysis).length,
    avgAnalysisLength: dreams.filter(d => d.analysis).reduce((acc, d) => {
      try {
        const analysis = JSON.parse(d.analysis!);
        return acc + (analysis.psychologicalInsights?.length || 0);
      } catch { return acc; }
    }, 0) / Math.max(dreams.filter(d => d.analysis).length, 1),
    
    symbolFrequency: dreams.reduce((acc: any, dream) => {
      if (dream.analysis) {
        try {
          const analysis = JSON.parse(dream.analysis);
          analysis.symbols?.forEach((symbol: string) => {
            acc[symbol] = (acc[symbol] || 0) + 1;
          });
        } catch {}
      }
      return acc;
    }, {}),
    
    archetypeFrequency: dreams.reduce((acc: any, dream) => {
      if (dream.analysis) {
        try {
          const analysis = JSON.parse(dream.analysis);
          analysis.archetypes?.forEach((archetype: string) => {
            acc[archetype] = (acc[archetype] || 0) + 1;
          });
        } catch {}
      }
      return acc;
    }, {})
  } : null;

  const symbolChartData = analyticsData ? Object.entries(analyticsData.symbolFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 8)
    .map(([symbol, count], index) => ({
      symbol: symbol.charAt(0).toUpperCase() + symbol.slice(1),
      count,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'][index]
    })) : [];

  const archetypeChartData = analyticsData ? Object.entries(analyticsData.archetypeFrequency)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 6)
    .map(([archetype, count]) => ({
      archetype: archetype.replace('The ', ''),
      count,
      fullMark: Math.max(...Object.values(analyticsData.archetypeFrequency).map(v => Number(v)))
    })) : [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="cosmic-text-200 hover:cosmic-text-50">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Analytics Playground</h1>
          <div className="w-6" />
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
        <Button variant="ghost" size="icon" onClick={onBack} className="cosmic-text-200 hover:cosmic-text-50">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Analytics Playground</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dreams"] })}
          className="cosmic-text-200 hover:cosmic-text-50"
        >
          <RefreshCw className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Current Data Overview */}
        <Card className="glass-effect border-cosmic-300/30">
          <CardHeader>
            <CardTitle className="cosmic-text-50 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Current Analytics Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold cosmic-text-50">{analyticsData?.totalDreams || 0}</div>
                <div className="text-sm cosmic-text-400">Total Dreams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold cosmic-text-50">{analyticsData?.analyzedDreams || 0}</div>
                <div className="text-sm cosmic-text-400">Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold cosmic-text-50">{Object.keys(analyticsData?.symbolFrequency || {}).length}</div>
                <div className="text-sm cosmic-text-400">Unique Symbols</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold cosmic-text-50">{Object.keys(analyticsData?.archetypeFrequency || {}).length}</div>
                <div className="text-sm cosmic-text-400">Archetypes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Data Generation */}
        <Card className="glass-effect border-cosmic-300/30">
          <CardHeader>
            <CardTitle className="cosmic-text-50 flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Test Data Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="cosmic-text-300 mb-4">
              Generate sample dreams with comprehensive AI analysis to test all analytics features
            </p>
            <Button
              onClick={generateTestDreams}
              disabled={createTestDreamMutation.isPending || activeTest === "generating"}
              className="gradient-gold cosmic-text-950 font-semibold"
            >
              {activeTest === "generating" ? "Generating..." : "Generate Test Dreams"}
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Visualizations */}
        <Tabs defaultValue="symbols" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-effect">
            <TabsTrigger value="symbols" className="cosmic-text-200">Symbol Analysis</TabsTrigger>
            <TabsTrigger value="archetypes" className="cosmic-text-200">Archetypes</TabsTrigger>
            <TabsTrigger value="insights" className="cosmic-text-200">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="symbols" className="space-y-4">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50">Dream Symbol Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                {symbolChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={symbolChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cosmic-400))" />
                      <XAxis dataKey="symbol" stroke="hsl(var(--cosmic-200))" />
                      <YAxis stroke="hsl(var(--cosmic-200))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--cosmic-950))', 
                          border: '1px solid hsl(var(--cosmic-300))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 cosmic-text-400">
                    No symbol data available. Generate test dreams to see analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archetypes" className="space-y-4">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50">Jungian Archetype Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {archetypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={archetypeChartData}>
                      <PolarGrid stroke="hsl(var(--cosmic-400))" />
                      <PolarAngleAxis dataKey="archetype" tick={{ fontSize: 12, fill: 'hsl(var(--cosmic-200))' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={false} />
                      <Radar name="Frequency" dataKey="count" stroke="#FFD700" fill="#FFD700" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 cosmic-text-400">
                    No archetype data available. Generate test dreams to see analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50">AI Analysis Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 glass-effect rounded-lg">
                    <div className="text-lg font-semibold cosmic-text-50 mb-2">Analysis Coverage</div>
                    <div className="text-3xl font-bold text-gold">
                      {analyticsData ? Math.round((analyticsData.analyzedDreams / analyticsData.totalDreams) * 100) : 0}%
                    </div>
                    <div className="text-sm cosmic-text-400">Dreams with AI analysis</div>
                  </div>
                  <div className="p-4 glass-effect rounded-lg">
                    <div className="text-lg font-semibold cosmic-text-50 mb-2">Average Insight Length</div>
                    <div className="text-3xl font-bold text-gold">
                      {analyticsData ? Math.round(analyticsData.avgAnalysisLength) : 0}
                    </div>
                    <div className="text-sm cosmic-text-400">Characters per analysis</div>
                  </div>
                </div>

                {dreams && dreams.filter(d => d.analysis).length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold cosmic-text-50 mb-3">Recent Analysis Sample</h4>
                    {dreams.filter(d => d.analysis).slice(-1).map(dream => {
                      try {
                        const analysis = JSON.parse(dream.analysis!);
                        return (
                          <div key={dream.id} className="p-4 glass-effect rounded-lg">
                            <div className="font-semibold cosmic-text-50 mb-2">{dream.title}</div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm cosmic-text-300">Archetypes: </span>
                                {analysis.archetypes?.map((archetype: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="mr-1 text-xs">
                                    {archetype}
                                  </Badge>
                                ))}
                              </div>
                              <div>
                                <span className="text-sm cosmic-text-300">Key Symbols: </span>
                                {analysis.symbols?.slice(0, 5).map((symbol: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="mr-1 text-xs">
                                    {symbol}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm cosmic-text-400 italic">
                                "{analysis.psychologicalInsights?.substring(0, 120)}..."
                              </div>
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Scenarios */}
        <Card className="glass-effect border-cosmic-300/30">
          <CardHeader>
            <CardTitle className="cosmic-text-50">Analytics Test Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testScenarios.map(scenario => (
                <div 
                  key={scenario.id}
                  className="p-4 glass-effect rounded-lg border border-cosmic-300/20 hover:border-cosmic-300/40 transition-all cursor-pointer"
                  onClick={() => setActiveTest(activeTest === scenario.id ? null : scenario.id)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div style={{ color: scenario.color }}>
                      {scenario.icon}
                    </div>
                    <div className="font-semibold cosmic-text-50">{scenario.title}</div>
                  </div>
                  <div className="text-sm cosmic-text-400">{scenario.description}</div>
                  {activeTest === scenario.id && (
                    <div className="mt-3 p-3 bg-cosmic-900/50 rounded">
                      <div className="text-xs cosmic-text-300">
                        Test scenario active - analyzing {scenario.title.toLowerCase()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}