import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PlantDetection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [detectDisease, setDetectDisease] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-plant', {
        body: { 
          image: selectedImage,
          detectDisease: detectDisease 
        },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: detectDisease ? "Plant and disease analysis complete" : "Plant identified successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the image. Please try again.",
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
          Plant Identification
        </h1>
        <p className="text-muted-foreground">
          Take a photo or upload an image to identify plant species
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Capture or Upload
            </CardTitle>
            <CardDescription>
              Use your camera or choose an existing image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected plant"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload className="h-12 w-12" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
              <Label htmlFor="disease-toggle" className="text-sm font-medium">
                Include Disease Detection
              </Label>
              <Switch
                id="disease-toggle"
                checked={detectDisease}
                onCheckedChange={setDetectDisease}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="camera-input"
                />
                <label htmlFor="camera-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Camera className="mr-2 h-4 w-4" />
                      Camera
                    </span>
                  </Button>
                </label>
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <Button
              onClick={analyzeImage}
              disabled={!selectedImage || isAnalyzing}
              className="w-full bg-gradient-primary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {detectDisease ? "Analyze Plant & Disease" : "Identify Plant"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              Plant identification and disease diagnosis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <p className="text-center text-sm">
                  Upload an image and click "Analyze Plant" to see results
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-lg bg-accent/10 p-4">
                  <h3 className="mb-2 font-semibold text-accent">Plant Species</h3>
                  <p className="text-lg font-bold text-foreground">{result.species || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : "N/A"}
                  </p>
                </div>

                {result.disease && (
                  <>
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Disease Detected
                      </h3>
                      <p className="mb-2 text-lg font-bold text-foreground">{result.disease}</p>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Symptoms:</span>
                          <p className="text-muted-foreground">{result.symptoms || "Not available"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-primary/10 p-4">
                      <h3 className="mb-2 font-semibold text-primary">Treatment</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{result.cure || "Consult with agricultural expert"}</p>
                      
                      {result.pesticides && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">Recommended Pesticides:</span>
                          <p className="text-sm text-muted-foreground">{result.pesticides}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!result.disease && (
                  <div className="rounded-lg bg-accent/10 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-accent">
                      <CheckCircle className="h-4 w-4" />
                      Healthy Plant
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No diseases detected. Your plant appears to be healthy!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Capture the leaf in good lighting conditions</p>
          <p>• Ensure the leaf fills most of the frame</p>
          <p>• Focus on diseased areas if visible</p>
          <p>• Avoid blurry or dark images</p>
          <p>• Use images under 5MB in size</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantDetection;
