import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Index from "./pages/Index";
import Discovery from "./pages/Discovery";
import DataIntake from "./pages/DataIntake";
import Validation from "./pages/Validation";
import Analysis from "./pages/Analysis";
import Decision from "./pages/Decision";
import Opportunities from "./pages/Opportunities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/intake" element={<DataIntake />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/decision" element={<Decision />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
