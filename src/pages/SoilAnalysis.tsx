import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2, TrendingUp, Droplets, Sprout, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SoilAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const { toast } = useToast();

  const getDigitalSoilData = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lon: longitude });

      // Fetch digital soil data based on location
      const { data, error } = await supabase.functions.invoke('analyze-soil', {
        body: {
          latitude,
          longitude,
          useDigitalData: true,
        },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Digital soil data fetched successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      if (error.code === 1) {
        toast({
          title: "Location Permission Denied",
          description: "Please allow location access to get digital soil data.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to fetch soil data. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Digital Soil Analysis
        </h1>
        <p className="text-muted-foreground">
          Get instant soil data based on your location using digital soil mapping
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Location Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location-Based Analysis
            </CardTitle>
            <CardDescription>
              Automatically fetch soil data for your current location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <h3 className="mb-2 font-semibold text-primary">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Click "Get Soil Data" below</li>
                <li>• Allow location access when prompted</li>
                <li>• Digital soil data is fetched automatically</li>
                <li>• Get instant analysis and recommendations</li>
              </ul>
            </div>

            {location && (
              <div className="rounded-lg bg-accent/10 p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Current Location:</span>
                  <br />
                  Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
                </p>
              </div>
            )}

            <Button
              onClick={getDigitalSoilData}
              disabled={isAnalyzing}
              className="w-full bg-gradient-primary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Soil Data...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Get Soil Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Soil Report
            </CardTitle>
            <CardDescription>
              Detailed analysis and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                <p className="text-center text-sm">
                  Enter soil parameters and click "Generate Report" to see results
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 p-4">
                  <h3 className="mb-2 font-semibold text-primary">Soil Category</h3>
                  <p className="text-lg font-bold text-foreground">{result.category || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">Overall Quality: {result.quality || "N/A"}</p>
                </div>

                <div className="rounded-lg bg-accent/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-accent">
                    <Droplets className="h-4 w-4" />
                    Nutrient Levels
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nitrogen (N):</span>
                      <span className="font-medium">{result.nitrogen_status || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phosphorus (P):</span>
                      <span className="font-medium">{result.phosphorus_status || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potassium (K):</span>
                      <span className="font-medium">{result.potassium_status || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {result.deficiencies && result.deficiencies.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <h3 className="mb-2 font-semibold text-destructive">Deficiencies Detected</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {result.deficiencies.map((def: string, idx: number) => (
                        <li key={idx}>{def}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg bg-primary/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                    <Sprout className="h-4 w-4" />
                    Suitable Crops
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.suitable_crops?.map((crop: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent"
                      >
                        {crop}
                      </span>
                    )) || <span className="text-sm text-muted-foreground">No data available</span>}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <h3 className="mb-2 font-semibold text-foreground">Fertilizer Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.fertilizer_recommendations || "No specific recommendations"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">About Digital Soil Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Digital soil mapping uses satellite and sensor data</p>
          <p>• Provides instant soil information without lab testing</p>
          <p>• Data includes NPK levels, pH, and soil texture</p>
          <p>• Updated regularly with latest agricultural research</p>
          <p>• Accurate for most agricultural planning purposes</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoilAnalysis;
