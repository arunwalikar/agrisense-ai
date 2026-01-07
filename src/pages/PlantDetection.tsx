import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PlantDetection = () => {
  const { t } = useTranslation();
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
          title: t('plantDetection.errors.fileTooLarge'),
          description: t('plantDetection.errors.fileTooLargeDesc'),
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
        title: t('plantDetection.analysisComplete'),
        description: detectDisease ? t('plantDetection.plantAndDiseaseComplete') : t('plantDetection.plantIdentified'),
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: t('plantDetection.errors.analysisFailed'),
        description: error.message || t('plantDetection.errors.analysisFailedDesc'),
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
          {t('plantDetection.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('plantDetection.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t('plantDetection.captureOrUpload')}
            </CardTitle>
            <CardDescription>
              {t('plantDetection.captureOrUploadDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={t('plantDetection.selectedPlant')}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload className="h-12 w-12" />
                  <p className="text-sm">{t('plantDetection.noImageSelected')}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
              <Label htmlFor="disease-toggle" className="text-sm font-medium">
                {t('plantDetection.includeDiseaseDetection')}
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
                      {t('common.camera')}
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
                      {t('common.upload')}
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
                  {t('common.analyzing')}
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {detectDisease ? t('plantDetection.analyzePlantAndDisease') : t('plantDetection.identifyPlant')}
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
              {t('plantDetection.analysisResults')}
            </CardTitle>
            <CardDescription>
              {t('plantDetection.analysisResultsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <p className="text-center text-sm">
                  {t('plantDetection.uploadToSeeResults')}
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
                  <h3 className="mb-2 font-semibold text-accent">{t('plantDetection.plantSpecies')}</h3>
                  <p className="text-lg font-bold text-foreground">{result.species || t('common.unknown')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('common.confidence')}: {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : t('common.notAvailable')}
                  </p>
                </div>

                {result.disease && (
                  <>
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {t('plantDetection.diseaseDetected')}
                      </h3>
                      <p className="mb-2 text-lg font-bold text-foreground">{result.disease}</p>
                      
                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <span className="font-medium">{t('plantDetection.symptoms')}:</span>
                          <p className="text-muted-foreground">{result.symptoms || t('common.notAvailable')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-primary/10 p-4">
                      <h3 className="mb-2 font-semibold text-primary">{t('plantDetection.treatment')}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{result.cure || t('plantDetection.consultExpert')}</p>
                      
                      {result.pesticides && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">{t('plantDetection.recommendedPesticides')}:</span>
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
                      {t('plantDetection.healthyPlant')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('plantDetection.noDiseasesDetected')}
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
          <CardTitle className="text-lg">{t('plantDetection.tipsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• {t('plantDetection.tips.lighting')}</p>
          <p>• {t('plantDetection.tips.frame')}</p>
          <p>• {t('plantDetection.tips.focus')}</p>
          <p>• {t('plantDetection.tips.clarity')}</p>
          <p>• {t('plantDetection.tips.size')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantDetection;
