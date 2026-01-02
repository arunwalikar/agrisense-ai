import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations } from "@/i18n";
import Dashboard from "./pages/Dashboard";
import PlantDetection from "./pages/PlantDetection";
import SoilAnalysis from "./pages/SoilAnalysis";
import Weather from "./pages/Weather";
import CropRecommendation from "./pages/CropRecommendation";
import MarketPrices from "./pages/MarketPrices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider translations={translations}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/plant-detection" element={<Layout><PlantDetection /></Layout>} />
          <Route path="/soil-analysis" element={<Layout><SoilAnalysis /></Layout>} />
          <Route path="/weather" element={<Layout><Weather /></Layout>} />
          <Route path="/crop-recommendation" element={<Layout><CropRecommendation /></Layout>} />
          <Route path="/market-prices" element={<Layout><MarketPrices /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </LanguageProvider>
);

export default App;
