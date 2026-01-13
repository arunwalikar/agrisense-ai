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
import MarketPrices from "./pages/MarketPrices";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/plant-detection" element={<ProtectedRoute><Layout><PlantDetection /></Layout></ProtectedRoute>} />
          <Route path="/soil-analysis" element={<ProtectedRoute><Layout><SoilAnalysis /></Layout></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><Layout><Weather /></Layout></ProtectedRoute>} />
          <Route path="/crop-recommendation" element={<ProtectedRoute><Layout><CropRecommendation /></Layout></ProtectedRoute>} />
          <Route path="/market-prices" element={<ProtectedRoute><Layout><MarketPrices /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
