import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import Footer from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LockGuard } from "./components/LockGuard";
import { ProductTour, useTour } from "./components/ProductTour";
import { FirstRunPrompt } from "./components/FirstRunPrompt";
import Home from "./pages/Home";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Decision from "./pages/Decision";
import Integrations from "./pages/Integrations";
import Settings from "./components/Settings";
import NotFound from "./pages/NotFound";
import Lock from "./pages/Lock";

// Lazy load heavy routes
const Score = lazy(() => import("./pages/Score"));
const DataIntakeV2 = lazy(() => import("./pages/DataIntakeV2"));
const SourcingPacket = lazy(() => import("./pages/SourcingPacket"));
const Help = lazy(() => import("./pages/Help"));

// Initialize axe in development
if (import.meta.env.DEV) {
  import('./utils/axe');
}

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOpen, hasSeenTour, startTour, closeTour, completeTour } = useTour();

  // Show first-run prompt for new users
  useEffect(() => {
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        // Only show if user hasn't already started the tour
        const tourElement = document.querySelector('[data-tour]');
        if (tourElement && !isOpen) {
          // Show first-run prompt after a delay
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, isOpen]);

  return (
    <LockGuard>
      <div className="min-h-screen flex flex-col">
        
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
        <header>
          <Navigation />
        </header>
        <main id="main-content" className="flex-1" tabIndex={-1}>
          <Routes>
            {/* Lock screen route - accessible without protection */}
            <Route path="/lock" element={<Lock />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Home />} />
            <Route 
              path="/score" 
              element={
                <ErrorBoundary fallbackTitle="Scoring Error">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
                    <Score />
                  </Suspense>
                </ErrorBoundary>
              } 
            />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/opportunities/:id/decision" element={<Decision />} />
            <Route 
              path="/opportunities/:id/packet" 
              element={
                <ErrorBoundary fallbackTitle="Sourcing Packet Error">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
                    <SourcingPacket />
                  </Suspense>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/import" 
              element={
                <ErrorBoundary fallbackTitle="Import Error" fallbackMessage="There was a problem with the import feature. Please check your data and try again.">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
                    <DataIntakeV2 />
                  </Suspense>
                </ErrorBoundary>
              } 
            />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Help route - accessible without full protection */}
            <Route 
              path="/help" 
              element={
                <ErrorBoundary fallbackTitle="Help Error">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading help...</div>}>
                    <Help />
                  </Suspense>
                </ErrorBoundary>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer>
          <Footer />
        </footer>

        {/* Product Tour */}
        <ProductTour 
          isOpen={isOpen}
          onClose={closeTour}
          onComplete={completeTour}
        />

        {/* First Run Prompt */}
        {!hasSeenTour && !isOpen && (
          <FirstRunPrompt
            onStartTour={startTour}
            onDismiss={completeTour}
          />
        )}
      </div>
    </LockGuard>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
