import { useState, useEffect } from "react";
import DreamCatcher from "@/components/DreamCatcher";
import VoiceRecorder from "@/components/VoiceRecorder";
import DreamList from "@/components/DreamList";
import DreamDetail from "@/components/DreamDetail";
import { motion, AnimatePresence } from "framer-motion";

type Page = 'recording' | 'saved-dreams' | 'dream-detail';

export default function DreamRecorder() {
  const [currentPage, setCurrentPage] = useState<Page>('recording');
  const [selectedDreamId, setSelectedDreamId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
    } else if (isRightSwipe && currentPage === 'saved-dreams') {
      setCurrentPage('recording');
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
              <div className="flex flex-col h-screen px-6 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <DreamCatcher />
                  <h1 className="text-2xl font-bold cosmic-text-50 mb-2 text-shadow-gold">DreamCatcher</h1>
                  <p className="cosmic-text-100 text-base px-4 leading-relaxed">
                    Share your dream and receive a Jungian interpretation
                  </p>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center mb-8">
                  <div className="flex space-x-6">
                    <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center cosmic-text-950 font-semibold text-sm">1</div>
                    <div className="w-8 h-8 rounded-full border-2 border-opacity-50 border-[hsl(var(--cosmic-300))] flex items-center justify-center cosmic-text-300 font-semibold text-sm">2</div>
                    <div className="w-8 h-8 rounded-full border-2 border-opacity-50 border-[hsl(var(--cosmic-300))] flex items-center justify-center cosmic-text-300 font-semibold text-sm">3</div>
                  </div>
                </div>

                {/* Voice Recorder Component */}
                <VoiceRecorder onNavigateToSavedDreams={() => setCurrentPage('saved-dreams')} />
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
      </div>
    </div>
  );
}
