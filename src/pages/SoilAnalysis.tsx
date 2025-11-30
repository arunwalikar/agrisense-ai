import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Loader2, TrendingUp, Droplets, Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SoilAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const [soilData, setSoilData] = useState({
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    moisture: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoilData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const analyzeSoil = async () => {
    if (!soilData.ph || !soilData.nitrogen || !soilData.phosphorus || !soilData.potassium) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required soil parameters",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-soil', {
        body: soilData,
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Soil report generated successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze soil data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Soil Analysis
        </h1>
        <p className="text-muted-foreground">
          Enter your soil parameters to get a detailed fertility report and recommendations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Soil Parameters
            </CardTitle>
            <CardDescription>
              Enter the test results from your soil sample
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ph">pH Level *</Label>
              <Input
                id="ph"
                name="ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                placeholder="e.g., 6.5"
                value={soilData.ph}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">Range: 0-14 (Acidic to Alkaline)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (N) mg/kg *</Label>
              <Input
                id="nitrogen"
                name="nitrogen"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 45"
                value={soilData.nitrogen}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (P) mg/kg *</Label>
              <Input
                id="phosphorus"
                name="phosphorus"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 30"
                value={soilData.phosphorus}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (K) mg/kg *</Label>
              <Input
                id="potassium"
                name="potassium"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 150"
                value={soilData.potassium}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moisture">Moisture % (Optional)</Label>
              <Input
                id="moisture"
                name="moisture"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g., 25"
                value={soilData.moisture}
                onChange={handleInputChange}
              />
            </div>

            <Button
              onClick={analyzeSoil}
              disabled={isAnalyzing}
              className="w-full bg-gradient-primary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Generate Report
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
          <CardTitle className="text-lg">How to Test Your Soil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Collect soil samples from multiple spots in your field</p>
          <p>• Mix samples together and send to a certified lab</p>
          <p>• Request NPK (Nitrogen, Phosphorus, Potassium) analysis</p>
          <p>• Also measure pH and moisture levels</p>
          <p>• Test soil at least once per growing season</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoilAnalysis;
