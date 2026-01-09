import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2, TrendingUp, Droplets, Sprout, MapPin, Camera, Upload, X, AlertTriangle, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const SoilAnalysis = () => {
  const { t, i18n } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"location" | "image">("location");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisMode("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => cameraInputRef.current?.click();
  const handleUpload = () => fileInputRef.current?.click();

  const clearImage = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const analyzeSoilImage = async () => {
    if (!selectedImage) {
      toast({ title: t('soilAnalysis.errors.noImage'), description: t('soilAnalysis.errors.noImageDesc'), variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-soil', { body: { image: selectedImage, useImageAnalysis: true, language: i18n.language } });
      if (error) throw error;
      setResult(data);
      toast({ title: t('soilAnalysis.analysisComplete'), description: t('soilAnalysis.imageAnalyzed') });
    } catch (error: any) {
      toast({ title: t('soilAnalysis.errors.failed'), description: error.message || t('soilAnalysis.errors.failedDesc'), variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDigitalSoilData = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setAnalysisMode("location");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lon: longitude });
      const { data, error } = await supabase.functions.invoke('analyze-soil', { body: { latitude, longitude, useDigitalData: true, language: i18n.language } });
      if (error) throw error;
      setResult(data);
      toast({ title: t('soilAnalysis.analysisComplete'), description: t('soilAnalysis.digitalDataFetched') });
    } catch (error: any) {
      if (error.code === 1) {
        toast({ title: t('soilAnalysis.errors.locationDenied'), description: t('soilAnalysis.errors.locationDeniedDesc'), variant: "destructive" });
      } else {
        toast({ title: t('soilAnalysis.errors.failed'), description: error.message || t('soilAnalysis.errors.failedDesc'), variant: "destructive" });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high": case "severe": return "bg-destructive text-destructive-foreground";
      case "medium": case "moderate": return "bg-orange-500 text-white";
      case "low": case "mild": return "bg-yellow-500 text-black";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">{t('soilAnalysis.title')}</h1>
        <p className="text-muted-foreground">{t('soilAnalysis.subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" />{t('soilAnalysis.options')}</CardTitle>
            <CardDescription>{t('soilAnalysis.optionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />

            {!selectedImage ? (
              <>
                <div className="rounded-lg bg-primary/10 p-4">
                  <h3 className="mb-2 font-semibold text-primary">{t('soilAnalysis.option1')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t('soilAnalysis.option1Desc')}</p>
                  <Button onClick={getDigitalSoilData} disabled={isAnalyzing} className="w-full bg-gradient-primary">
                    {isAnalyzing && analysisMode === "location" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('soilAnalysis.fetching')}</> : <><MapPin className="mr-2 h-4 w-4" />{t('soilAnalysis.getLocationData')}</>}
                  </Button>
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span></div></div>
                <div className="rounded-lg bg-accent/10 p-4">
                  <h3 className="mb-2 font-semibold text-accent">{t('soilAnalysis.option2')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t('soilAnalysis.option2Desc')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleCameraCapture} variant="outline" className="w-full"><Camera className="mr-2 h-4 w-4" />{t('common.camera')}</Button>
                    <Button onClick={handleUpload} variant="outline" className="w-full"><Upload className="mr-2 h-4 w-4" />{t('common.upload')}</Button>
                  </div>
                </div>
                {location && <div className="rounded-lg bg-secondary p-3"><p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{t('soilAnalysis.lastLocation')}:</span><br />Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}</p></div>}
              </>
            ) : (
              <>
                <div className="relative"><img src={selectedImage} alt={t('soilAnalysis.soilSample')} className="w-full rounded-lg border-2 border-primary/20" /><Button onClick={clearImage} size="icon" variant="destructive" className="absolute right-2 top-2"><X className="h-4 w-4" /></Button></div>
                <Button onClick={analyzeSoilImage} disabled={isAnalyzing} className="w-full bg-gradient-primary">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('soilAnalysis.analyzingImage')}</> : <><FlaskConical className="mr-2 h-4 w-4" />{t('soilAnalysis.analyzeSoilImage')}</>}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" />{t('soilAnalysis.soilReport')}</CardTitle>
            <CardDescription>{t('soilAnalysis.soilReportDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && <div className="flex h-96 items-center justify-center text-muted-foreground"><p className="text-center text-sm">{t('soilAnalysis.useLocationOrImage')}</p></div>}
            {isAnalyzing && <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {result && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                <div className="rounded-lg bg-primary/10 p-4">
                  <h3 className="mb-2 font-semibold text-primary">{t('soilAnalysis.soilCategory')}</h3>
                  <p className="text-lg font-bold text-foreground">{result.category || t('common.unknown')}</p>
                  <p className="text-sm text-muted-foreground">{t('soilAnalysis.overallQuality')}: {result.quality || t('common.notAvailable')}</p>
                </div>

                {(result.diseases_detected || result.fungal_infections) && (
                  <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-destructive"><Bug className="h-4 w-4" />{t('soilAnalysis.diseaseDetection')}</h3>
                    {result.diseases_detected?.length > 0 && <div className="mb-3"><p className="text-sm font-medium text-foreground mb-2">{t('soilAnalysis.diseasesDetected')}:</p><div className="space-y-2">{result.diseases_detected.map((disease: any, idx: number) => (<div key={idx} className="rounded bg-background/50 p-2"><div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{disease.name || disease}</span>{disease.severity && <Badge className={getSeverityColor(disease.severity)}>{disease.severity}</Badge>}</div>{disease.description && <p className="text-xs text-muted-foreground">{disease.description}</p>}</div>))}</div></div>}
                    {result.fungal_infections?.length > 0 && <div><p className="text-sm font-medium text-foreground mb-2">{t('soilAnalysis.fungalInfections')}:</p><div className="space-y-2">{result.fungal_infections.map((infection: any, idx: number) => (<div key={idx} className="rounded bg-background/50 p-2"><div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{infection.name || infection}</span>{infection.severity && <Badge className={getSeverityColor(infection.severity)}>{infection.severity}</Badge>}</div>{infection.description && <p className="text-xs text-muted-foreground">{infection.description}</p>}</div>))}</div></div>}
                    {result.treatment_recommendations && <div className="mt-3 pt-3 border-t border-destructive/20"><p className="text-sm font-medium text-foreground mb-1">{t('soilAnalysis.treatmentRecommendations')}:</p><p className="text-sm text-muted-foreground">{result.treatment_recommendations}</p></div>}
                  </div>
                )}

                {result.health_status && !result.diseases_detected?.length && !result.fungal_infections?.length && <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20"><h3 className="mb-2 flex items-center gap-2 font-semibold text-green-600"><Sprout className="h-4 w-4" />{t('soilAnalysis.soilHealthStatus')}</h3><p className="text-sm text-foreground">{result.health_status}</p></div>}

                <div className="rounded-lg bg-accent/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-accent"><Droplets className="h-4 w-4" />{t('soilAnalysis.nutrientLevels')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>{t('soilAnalysis.nitrogen')}:</span><span className="font-medium">{result.nitrogen_status || t('common.notAvailable')}</span></div>
                    <div className="flex justify-between"><span>{t('soilAnalysis.phosphorus')}:</span><span className="font-medium">{result.phosphorus_status || t('common.notAvailable')}</span></div>
                    <div className="flex justify-between"><span>{t('soilAnalysis.potassium')}:</span><span className="font-medium">{result.potassium_status || t('common.notAvailable')}</span></div>
                  </div>
                </div>

                {result.deficiencies?.length > 0 && <div className="rounded-lg bg-orange-500/10 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold text-orange-600"><AlertTriangle className="h-4 w-4" />{t('soilAnalysis.deficienciesDetected')}</h3><ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">{result.deficiencies.map((def: string, idx: number) => <li key={idx}>{def}</li>)}</ul></div>}

                <div className="rounded-lg bg-primary/10 p-4"><h3 className="mb-3 flex items-center gap-2 font-semibold text-primary"><Sprout className="h-4 w-4" />{t('soilAnalysis.suitableCrops')}</h3><div className="flex flex-wrap gap-2">{result.suitable_crops?.map((crop: string, idx: number) => <span key={idx} className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent">{crop}</span>) || <span className="text-sm text-muted-foreground">{t('common.noDataAvailable')}</span>}</div></div>

                <div className="rounded-lg bg-secondary p-4"><h3 className="mb-2 font-semibold text-foreground">{t('soilAnalysis.fertilizerRecommendations')}</h3><p className="text-sm text-muted-foreground">{result.fertilizer_recommendations || t('soilAnalysis.noSpecificRecommendations')}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader><CardTitle className="text-lg">{t('soilAnalysis.aboutTitle')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• {t('soilAnalysis.about.point1')}</p>
          <p>• {t('soilAnalysis.about.point2')}</p>
          <p>• {t('soilAnalysis.about.point3')}</p>
          <p>• {t('soilAnalysis.about.point4')}</p>
          <p>• {t('soilAnalysis.about.point5')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoilAnalysis;
