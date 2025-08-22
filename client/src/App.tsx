import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DreamRecorder from "@/pages/dream-recorder";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DreamRecorder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div key="app-v2" className="min-h-screen">
          <Toaster />
          <div className="mx-auto max-w-screen-md">
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
