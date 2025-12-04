import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import PlantDetection from "./pages/PlantDetection";
import SoilAnalysis from "./pages/SoilAnalysis";
import Weather from "./pages/Weather";
import CropRecommendation from "./pages/CropRecommendation";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Farms from "./pages/Farms";
import CropHistory from "./pages/CropHistory";
import Analytics from "./pages/Analytics";
import MarketPrices from "./pages/MarketPrices";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/plant-detection" element={<Layout><PlantDetection /></Layout>} />
            <Route path="/soil-analysis" element={<Layout><SoilAnalysis /></Layout>} />
            <Route path="/weather" element={<Layout><Weather /></Layout>} />
            <Route path="/crop-recommendation" element={<Layout><CropRecommendation /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/farms" element={<Layout><Farms /></Layout>} />
            <Route path="/crops" element={<Layout><CropHistory /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/market-prices" element={<Layout><MarketPrices /></Layout>} />
            <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
            <Route path="/admin" element={<Layout><Admin /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
