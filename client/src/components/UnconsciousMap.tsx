import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Brain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import cytoscape from "cytoscape";
// @ts-ignore
import coseBilkent from "cytoscape-cose-bilkent";

// Register the layout
cytoscape.use(coseBilkent);

interface UnconsciousMapProps {
  onBack: () => void;
  onNavigateHome?: () => void;
}

interface ThemeData {
  name: string;
  count: number;
  links: string[];
}

export default function UnconsciousMap({ onBack, onNavigateHome }: UnconsciousMapProps) {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dream themes data
  const { data: themes, isLoading, error } = useQuery<ThemeData[]>({
    queryKey: ["/api/themes"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !themes || themes.length === 0) return;

    // Clear existing instance
    if (cy) {
      cy.destroy();
    }

    // Create nodes from themes
    const nodes = themes.map(theme => ({
      data: {
        id: theme.name,
        label: theme.name,
        count: theme.count,
        size: Math.max(20, Math.min(100, theme.count * 10)) // Scale node size
      }
    }));

    // Create edges from theme links
    const edges: any[] = [];
    themes.forEach(theme => {
      theme.links.forEach(linkedTheme => {
        // Only create edge if both themes exist and avoid duplicates
        if (themes.some(t => t.name === linkedTheme) && theme.name < linkedTheme) {
          edges.push({
            data: {
              id: `${theme.name}-${linkedTheme}`,
              source: theme.name,
              target: linkedTheme
            }
          });
        }
      });
    });

    const cyInstance = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#FFD700',
            'border-color': '#FFA500',
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#1a1a1a',
            'font-size': '12px',
            'font-weight': 'bold',
            'width': 'data(size)',
            'height': 'data(size)',
            'text-wrap': 'wrap',
            'text-max-width': '60px',
            'overlay-padding': '6px'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'background-color': '#FFA500',
            'border-color': '#FF8C00',
            'border-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        {
          selector: 'edge:hover',
          style: {
            'width': 3,
            'line-color': '#FFD700',
            'target-arrow-color': '#FFD700',
            'opacity': 1
          }
        }
      ],
      layout: {
        name: 'cose-bilkent',
        nodeDimensionsIncludeLabels: true,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        nodeRepulsion: 4500,
        idealEdgeLength: 50,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        animate: 'end',
        animationDuration: 1000
      } as any,
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 3
    });

    // Add tooltip functionality
    let tooltip: HTMLDivElement | null = null;

    cyInstance.on('mouseover', 'node', (event) => {
      const node = event.target;
      const theme = node.data();
      
      // Remove existing tooltip
      if (tooltip) {
        tooltip.remove();
      }

      // Create new tooltip
      tooltip = document.createElement('div');
      tooltip.style.position = 'absolute';
      tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
      tooltip.style.color = '#FFD700';
      tooltip.style.padding = '8px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '14px';
      tooltip.style.zIndex = '1000';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.border = '1px solid #FFD700';
      tooltip.innerHTML = `<strong>${theme.label}</strong><br/>Frequency: ${theme.count}`;
      
      document.body.appendChild(tooltip);
    });

    cyInstance.on('mousemove', 'node', (event) => {
      if (tooltip) {
        tooltip.style.left = (event.originalEvent.pageX + 10) + 'px';
        tooltip.style.top = (event.originalEvent.pageY - 30) + 'px';
      }
    });

    cyInstance.on('mouseout', 'node', () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });

    setCy(cyInstance);

    // Cleanup function
    return () => {
      if (tooltip) {
        tooltip.remove();
      }
      cyInstance.destroy();
    };
  }, [themes]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full gradient-cosmic relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cosmic-200 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="cosmic-text-200 text-lg">Mapping your unconscious...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full gradient-cosmic relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Brain className="w-16 h-16 cosmic-text-200 mx-auto mb-4" />
            <p className="cosmic-text-200 text-lg mb-4">Unable to load unconscious map</p>
            <Button onClick={onBack} variant="outline" className="border-cosmic-200 text-cosmic-200">
              Return
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full gradient-cosmic relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={onBack}
          className="cosmic-text-200 hover:cosmic-text-50 p-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <h1 className="text-xl font-bold cosmic-text-50 text-shadow-gold">
          Map of Unconscious
        </h1>
        
        {onNavigateHome && (
          <Button
            variant="ghost"
            onClick={onNavigateHome}
            className="cosmic-text-200 hover:cosmic-text-50 p-2"
          >
            <Home className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Cytoscape Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 mt-16"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3">
          <p className="text-sm cosmic-text-200 text-center">
            Explore connections between dream themes • Hover for details • Pinch to zoom
          </p>
        </div>
      </div>
    </div>
  );
}