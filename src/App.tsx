import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Navigation } from "./components/Navigation";
import Footer from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Score from "./pages/Score";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Decision from "./pages/Decision";
import Integrations from "./pages/Integrations";
import Settings from "./components/Settings";
import NotFound from "./pages/NotFound";

// Lazy load heavy routes
const Import = lazy(() => import("./pages/Import"));
const SourcingPacket = lazy(() => import("./pages/SourcingPacket"));

// Initialize axe in development
if (import.meta.env.DEV) {
  import('./utils/axe');
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <header>
            <Navigation />
          </header>
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <Routes>
              <Route path="/" element={<Score />} />
              <Route path="/score" element={<Score />} />
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
                      <Import />
                    </Suspense>
                  </ErrorBoundary>
                } 
              />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer>
            <Footer />
          </footer>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
