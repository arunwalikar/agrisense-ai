import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, Loader2, Calendar, TrendingUp, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CropRecommendation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    soilType: "",
    ph: "",
    temperature: "",
    rainfall: "",
    season: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCropRecommendations = async () => {
    if (!formData.soilType || !formData.ph || !formData.temperature || !formData.season) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('recommend-crops', {
        body: formData,
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Recommendations Ready",
        description: "Best crops identified for your conditions",
      });
    } catch (error: any) {
      console.error("Recommendation error:", error);
      toast({
        title: "Failed to Get Recommendations",
        description: error.message || "Could not generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Crop Recommendations
        </h1>
        <p className="text-muted-foreground">
          Get personalized crop suggestions based on your soil, climate, and season
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Farm Conditions
            </CardTitle>
            <CardDescription>
              Provide details about your farming conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="soilType">Soil Type *</Label>
              <Select
                value={formData.soilType}
                onValueChange={(value) => handleInputChange("soilType", value)}
              >
                <SelectTrigger id="soilType">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="silty">Silty</SelectItem>
                  <SelectItem value="peaty">Peaty</SelectItem>
                  <SelectItem value="chalky">Chalky</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ph">Soil pH *</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                placeholder="e.g., 6.5"
                value={formData.ph}
                onChange={(e) => handleInputChange("ph", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Average Temperature (°C) *</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="e.g., 25"
                value={formData.temperature}
                onChange={(e) => handleInputChange("temperature", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rainfall">Annual Rainfall (mm)</Label>
              <Input
                id="rainfall"
                type="number"
                step="1"
                placeholder="e.g., 800"
                value={formData.rainfall}
                onChange={(e) => handleInputChange("rainfall", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Growing Season *</Label>
              <Select
                value={formData.season}
                onValueChange={(value) => handleInputChange("season", value)}
              >
                <SelectTrigger id="season">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="autumn">Autumn/Fall</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                  <SelectItem value="monsoon">Monsoon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={getCropRecommendations}
              disabled={isLoading}
              className="w-full bg-gradient-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sprout className="mr-2 h-4 w-4" />
                  Get Recommendations
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
              Recommended Crops
            </CardTitle>
            <CardDescription>
              Best crops for your conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isLoading && (
              <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                <p className="text-center text-sm">
                  Fill in the form and click "Get Recommendations" to see suitable crops
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex h-[500px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-lg bg-accent/10 p-4">
                  <h3 className="mb-3 font-semibold text-accent">Top Recommendations</h3>
                  <div className="space-y-3">
                    {result.crops?.map((crop: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{crop.name}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {crop.description}
                            </p>
                          </div>
                          <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                            {crop.suitability}% Match
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                            Growth: {crop.growth_period}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                            Yield: {crop.expected_yield}
                          </span>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No crops available</p>}
                  </div>
                </div>

                {result.selected_crop && (
                  <>
                    <div className="rounded-lg bg-primary/10 p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                        <Calendar className="h-4 w-4" />
                        Monthly Farming Plan: {result.selected_crop}
                      </h3>
                      <div className="space-y-2">
                        {result.farming_plan?.map((month: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border-l-4 border-accent bg-card p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{month.month}</span>
                              <span className="text-sm text-accent">{month.phase}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {month.activities}
                            </p>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No plan available</p>}
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-500/10 p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-600">
                        <Droplets className="h-4 w-4" />
                        Water Requirements
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.water_requirements || "Standard irrigation practices apply"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-secondary p-4">
                      <h3 className="mb-2 font-semibold text-foreground">Additional Tips</h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {result.tips?.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        )) || <li>Consult with local agricultural experts</li>}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Factors Affecting Crop Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <h4 className="mb-1 font-medium text-foreground">Soil Conditions</h4>
            <p>pH levels, nutrient content, drainage, and soil texture</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">Climate</h4>
            <p>Temperature range, rainfall patterns, and seasonal variations</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">Water Availability</h4>
            <p>Irrigation facilities and natural water sources</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">Market Demand</h4>
            <p>Local market prices and crop profitability</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CropRecommendation;
