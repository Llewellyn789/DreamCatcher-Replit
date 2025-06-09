
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { isDevelopment } from '@/lib/testing';

interface QAItem {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  checked: boolean;
}

const QA_CHECKLIST: QAItem[] = [
  // Audio Recording
  { id: 'audio-permission', category: 'Audio', description: 'Microphone permission request works', severity: 'critical', checked: false },
  { id: 'audio-recording', category: 'Audio', description: 'Audio recording starts/stops correctly', severity: 'critical', checked: false },
  { id: 'audio-playback', category: 'Audio', description: 'Recorded audio playback works', severity: 'high', checked: false },
  { id: 'audio-validation', category: 'Audio', description: 'Audio file size/format validation', severity: 'medium', checked: false },
  
  // API Integration
  { id: 'transcription-api', category: 'API', description: 'Audio transcription API works', severity: 'critical', checked: false },
  { id: 'analysis-api', category: 'API', description: 'Dream analysis API works', severity: 'critical', checked: false },
  { id: 'api-error-handling', category: 'API', description: 'API error responses handled gracefully', severity: 'high', checked: false },
  { id: 'api-loading-states', category: 'API', description: 'Loading states during API calls', severity: 'medium', checked: false },
  
  // Data Persistence
  { id: 'dream-save', category: 'Data', description: 'Dreams save to database correctly', severity: 'critical', checked: false },
  { id: 'dream-load', category: 'Data', description: 'Dreams load from database correctly', severity: 'critical', checked: false },
  { id: 'dream-delete', category: 'Data', description: 'Dream deletion works', severity: 'high', checked: false },
  
  // User Experience
  { id: 'mobile-responsive', category: 'UX', description: 'Mobile responsiveness tested', severity: 'high', checked: false },
  { id: 'offline-handling', category: 'UX', description: 'Offline scenarios handled', severity: 'medium', checked: false },
  { id: 'error-messages', category: 'UX', description: 'User-friendly error messages', severity: 'high', checked: false },
  { id: 'loading-indicators', category: 'UX', description: 'Loading indicators present', severity: 'medium', checked: false },
  
  // Performance
  { id: 'large-audio-files', category: 'Performance', description: 'Large audio files handled', severity: 'medium', checked: false },
  { id: 'memory-cleanup', category: 'Performance', description: 'Audio URLs cleaned up to prevent memory leaks', severity: 'high', checked: false },
];

export default function QAChecklist() {
  const [checklist, setChecklist] = useState(QA_CHECKLIST);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isDevelopment) return null;

  const categories = ['All', ...Array.from(new Set(checklist.map(item => item.category)))];
  const filteredChecklist = selectedCategory === 'All' 
    ? checklist 
    : checklist.filter(item => item.category === selectedCategory);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completionStats = checklist.reduce((acc, item) => {
    acc.total++;
    if (item.checked) acc.completed++;
    if (item.severity === 'critical' && !item.checked) acc.criticalRemaining++;
    return acc;
  }, { total: 0, completed: 0, criticalRemaining: 0 });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="m-4 border-2 border-dashed border-blue-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>QA Checklist</span>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline">
              {completionStats.completed}/{completionStats.total} Complete
            </Badge>
            {completionStats.criticalRemaining > 0 && (
              <Badge variant="destructive">
                {completionStats.criticalRemaining} Critical Issues
              </Badge>
            )}
          </div>
        </CardTitle>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded ${
                selectedCategory === category 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {filteredChecklist.map(item => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${item.checked ? 'line-through text-gray-500' : ''}`}>
                  {item.description}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(item.severity)}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
