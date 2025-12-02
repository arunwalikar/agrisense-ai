import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import PlantDetection from "./pages/PlantDetection";
import SoilAnalysis from "./pages/SoilAnalysis";
import Weather from "./pages/Weather";
import CropRecommendation from "./pages/CropRecommendation";
import FieldMapping from "./pages/FieldMapping";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plant-detection" element={<PlantDetection />} />
            <Route path="/soil-analysis" element={<SoilAnalysis />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/field-mapping" element={<FieldMapping />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
