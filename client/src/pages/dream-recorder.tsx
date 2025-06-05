import { useState, useEffect } from "react";
import DreamCatcher from "@/components/DreamCatcher";
import VoiceRecorder from "@/components/VoiceRecorder";
import DreamList from "@/components/DreamList";
import DreamDetail from "@/components/DreamDetail";
import DreamAnalytics from "@/components/DreamAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Folder, BarChart3 } from "lucide-react";

type Page = 'recording' | 'saved-dreams' | 'dream-detail' | 'analytics';

export default function DreamRecorder() {
  const [currentPage, setCurrentPage] = useState<Page>('recording');
  const [selectedDreamId, setSelectedDreamId] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const resetToHome = () => {
    setCurrentPage('recording');
    setSelectedDreamId(null);
    setResetKey(prev => prev + 1); // Force VoiceRecorder to reset
  };

  // Stars background
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
  }));

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage === 'recording') {
      setCurrentPage('saved-dreams');
    } else if (isLeftSwipe && currentPage === 'saved-dreams') {
      setCurrentPage('analytics');
    } else if (isRightSwipe && currentPage === 'saved-dreams') {
      setCurrentPage('recording');
    } else if (isRightSwipe && currentPage === 'analytics') {
      setCurrentPage('saved-dreams');
    }
  };

  const navigateToDetail = (dreamId: number) => {
    setSelectedDreamId(dreamId);
    setCurrentPage('dream-detail');
  };

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3,
  };

  return (
    <div 
      className="min-h-screen w-full gradient-cosmic relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Stars Background */}
      <div className="stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait" custom={currentPage}>
          {currentPage === 'recording' && (
            <motion.div
              key="recording"
              custom={0}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0"
            >
              {/* Analytics Icon - Fixed to top left */}
              <div className="absolute top-6 left-6 z-50">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage('analytics')}
                  className="cosmic-text-200 hover:cosmic-text-50 p-2"
                >
                  <BarChart3 className="w-6 h-6" />
                </Button>
              </div>

              {/* Folder Icon - Fixed to top right */}
              <div className="absolute top-6 right-6 z-50">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage('saved-dreams')}
                  className="cosmic-text-200 hover:cosmic-text-50 p-2"
                >
                  <Folder className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="flex flex-col h-screen px-6 py-8 overflow-y-auto">
                {/* Header - Title only */}
                <div className="text-center mb-6">
                  <h1 
                    className="text-2xl font-bold cosmic-text-50 text-shadow-gold cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={resetToHome}
                  >
                    DreamCatcher
                  </h1>
                </div>

                {/* Voice Recorder Component */}
                <div className="flex-1 flex flex-col min-h-0">
                  <VoiceRecorder 
                    key={resetKey}
                    onNavigateToSavedDreams={() => setCurrentPage('saved-dreams')} 
                    onViewDream={(dreamId) => {
                      setSelectedDreamId(dreamId);
                      setCurrentPage('dream-detail');
                    }}
                  />
                </div>
                
                {/* Bottom padding to ensure content is not hidden behind navigation */}
                <div className="h-16"></div>
              </div>
            </motion.div>
          )}

          {currentPage === 'saved-dreams' && (
            <motion.div
              key="saved-dreams"
              custom={1}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0"
            >
              <DreamList 
                onBack={() => setCurrentPage('recording')}
                onViewDream={navigateToDetail}
              />
            </motion.div>
          )}

          {currentPage === 'dream-detail' && selectedDreamId && (
            <motion.div
              key="dream-detail"
              custom={1}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0"
            >
              <DreamDetail 
                dreamId={selectedDreamId}
                onBack={() => setCurrentPage('saved-dreams')}
                onNavigateHome={() => setCurrentPage('recording')}
              />
            </motion.div>
          )}

          {currentPage === 'analytics' && (
            <motion.div
              key="analytics"
              custom={2}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0"
            >
              <DreamAnalytics 
                onBack={() => setCurrentPage('recording')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        <div 
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            currentPage === 'recording' ? 'cosmic-bg-200' : 'cosmic-bg-600'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            currentPage === 'saved-dreams' ? 'cosmic-bg-200' : 'cosmic-bg-600'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            currentPage === 'analytics' ? 'cosmic-bg-200' : 'cosmic-bg-600'
          }`}
        />
      </div>
    </div>
  );
}
