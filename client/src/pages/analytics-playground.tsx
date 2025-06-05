
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, TrendingUp, Calendar, Brain, Eye, Clock, Target, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { format, startOfMonth, eachMonthOfInterval, subMonths, eachDayOfInterval, subDays } from "date-fns";

import type { Dream } from "@shared/schema";

interface AnalyticsPlaygroundProps {
  onBack: () => void;
}

export default function AnalyticsPlayground({ onBack }: AnalyticsPlaygroundProps) {
  const { data: dreams, isLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  if (isLoading || !dreams) {
    return (
      <div className="flex flex-col h-screen px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold cosmic-text-50">Analytics Playground</h1>
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--cosmic-200))] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Draft Feature 1: Dream Streak Tracking
  const dreamStreakData = (() => {
    const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const streakData = last30Days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const hasDream = dreams.some(dream => 
        format(new Date(dream.createdAt), 'yyyy-MM-dd') === dayKey
      );
      
      if (hasDream) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      
      return {
        date: format(day, 'MMM d'),
        hasDream: hasDream ? 1 : 0,
        streak: tempStreak
      };
    });
    
    // Calculate current streak (from end)
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].hasDream) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return { streakData, currentStreak, longestStreak };
  })();

  // Draft Feature 2: Emotional Journey Tracking
  const emotionalData = (() => {
    const analyzedDreams = dreams.filter(dream => dream.analysis);
    const emotions = ['positive', 'negative', 'neutral', 'anxious', 'peaceful', 'intense'];
    
    return emotions.map(emotion => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count: Math.floor(Math.random() * 10) + 1, // Mock data for demo
      color: ['#4ADE80', '#EF4444', '#94A3B8', '#F59E0B', '#06B6D4', '#8B5CF6'][emotions.indexOf(emotion)]
    }));
  })();

  // Draft Feature 3: Sleep Pattern Analysis
  const sleepPatternData = (() => {
    const hourCounts = new Array(24).fill(0);
    dreams.forEach(dream => {
      const hour = new Date(dream.createdAt).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts.map((count, hour) => ({
      hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      dreams: count,
      timeCategory: hour >= 22 || hour <= 6 ? 'Night' : hour <= 12 ? 'Morning' : hour <= 18 ? 'Afternoon' : 'Evening'
    })).filter(item => item.dreams > 0);
  })();

  // Draft Feature 4: Recurring Elements
  const recurringElements = (() => {
    const elements = ['Water', 'Flying', 'Animals', 'Family', 'Work', 'Home', 'Travel', 'Nature'];
    return elements.map(element => ({
      element,
      frequency: Math.floor(Math.random() * 15) + 1,
      trend: Math.random() > 0.5 ? 'increasing' : 'stable'
    })).sort((a, b) => b.frequency - a.frequency);
  })();

  return (
    <div className="flex flex-col h-screen px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="cosmic-text-200 hover:cosmic-text-50">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold cosmic-text-50 text-shadow-gold">Analytics Playground</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="streaks" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="elements">Elements</TabsTrigger>
          </TabsList>

          {/* Dream Streak Tracking */}
          <TabsContent value="streaks" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-effect border-cosmic-300/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm cosmic-text-300 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold cosmic-text-50">{dreamStreakData.currentStreak}</div>
                  <p className="text-xs cosmic-text-400">days in a row</p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-cosmic-300/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm cosmic-text-300 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Best Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold cosmic-text-50">{dreamStreakData.longestStreak}</div>
                  <p className="text-xs cosmic-text-400">personal record</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50">30-Day Dream Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dreamStreakData.streakData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cosmic-300))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--cosmic-300))" fontSize={10} />
                      <YAxis stroke="hsl(var(--cosmic-300))" fontSize={12} />
                      <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--cosmic-800))',
                        border: '1px solid hsl(var(--cosmic-300))',
                        borderRadius: '8px',
                        color: 'hsl(var(--cosmic-50))'
                      }} />
                      <Area type="monotone" dataKey="hasDream" stroke="#FFD700" fill="#FFD700" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emotional Journey */}
          <TabsContent value="emotions" className="space-y-6">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Emotional Landscape
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emotionalData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ emotion, percent }) => `${emotion} ${(percent * 100).toFixed(0)}%`}
                      >
                        {emotionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sleep Patterns */}
          <TabsContent value="patterns" className="space-y-6">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recording Time Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepPatternData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cosmic-300))" opacity={0.3} />
                      <XAxis dataKey="hour" stroke="hsl(var(--cosmic-300))" fontSize={10} />
                      <YAxis stroke="hsl(var(--cosmic-300))" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="dreams" fill="#4ECDC4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recurring Elements */}
          <TabsContent value="elements" className="space-y-6">
            <Card className="glass-effect border-cosmic-300/30">
              <CardHeader>
                <CardTitle className="cosmic-text-50 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Recurring Dream Elements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recurringElements.map((element, index) => (
                    <div key={element.element} className="flex items-center justify-between p-3 rounded-lg cosmic-bg-800/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full cosmic-bg-gradient flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="cosmic-text-50 font-medium">{element.element}</span>
                      </div>
                      <div className="text-right">
                        <div className="cosmic-text-50 font-bold">{element.frequency}</div>
                        <div className={`text-xs ${element.trend === 'increasing' ? 'text-green-400' : 'cosmic-text-400'}`}>
                          {element.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
