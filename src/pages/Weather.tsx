import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudSun, Droplets, Wind, ThermometerSun, Loader2, MapPin, Calendar, CloudRain, Sun, Cloud, CloudSnow, AlertTriangle, Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WeatherCurrent {
  temperature: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  uv_index: number;
}

interface ForecastDay {
  day: string;
  temp: number;
  temp_min?: number;
  temp_max?: number;
  condition: string;
  rainfall_chance?: number;
}

interface IrrigationRecommendation {
  status: 'required' | 'optional' | 'not_needed';
  message: string;
  schedule?: string;
}

interface WeatherData {
  location: string;
  current: WeatherCurrent;
  forecast: ForecastDay[];
  farming_advice: string[];
  irrigation_recommendation?: IrrigationRecommendation;
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className="h-6 w-6 text-blue-500" />;
  }
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return <Sun className="h-6 w-6 text-yellow-500" />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className="h-6 w-6 text-gray-500" />;
  }
  if (lowerCondition.includes('snow')) {
    return <CloudSnow className="h-6 w-6 text-blue-300" />;
  }
  return <CloudSun className="h-6 w-6 text-primary" />;
};

const Weather = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const { toast } = useToast();

  const getIrrigationStatus = (data: WeatherData): IrrigationRecommendation => {
    const { current, forecast } = data;
    
    const upcomingRain = forecast.some(day => 
      day.condition.toLowerCase().includes('rain') || 
      (day.rainfall_chance && day.rainfall_chance > 50)
    );
    
    if (current.rainfall > 5 || (current.humidity > 80 && upcomingRain)) {
      return {
        status: 'not_needed',
        message: t('weather.irrigation.notNeeded'),
        schedule: t('weather.irrigation.skipSchedule')
      };
    }
    
    if (current.temperature > 30 && current.humidity < 50 && !upcomingRain) {
      return {
        status: 'required',
        message: t('weather.irrigation.required'),
        schedule: t('weather.irrigation.requiredSchedule')
      };
    }
    
    if (current.humidity < 60 && !upcomingRain) {
      return {
        status: 'optional',
        message: t('weather.irrigation.optional'),
        schedule: t('weather.irrigation.optionalSchedule')
      };
    }
    
    return {
      status: 'not_needed',
      message: t('weather.irrigation.adequate'),
      schedule: t('weather.irrigation.monitorSchedule')
    };
  };

  const fetchWeather = async (loc?: string) => {
    const searchLocation = loc || location;
    if (!searchLocation && !loc) {
      toast({
        title: t('weather.errors.locationRequired'),
        description: t('weather.errors.locationRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location: searchLocation },
      });

      if (error) throw error;

      const enrichedData = {
        ...data,
        irrigation_recommendation: getIrrigationStatus(data)
      };

      setWeatherData(enrichedData);
      toast({
        title: t('weather.updated'),
        description: t('weather.showingFor', { location: data.location }),
      });
    } catch (error: any) {
      console.error("Weather fetch error:", error);
      toast({
        title: t('weather.errors.fetchFailed'),
        description: error.message || t('weather.errors.fetchFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        () => {
          toast({
            title: t('weather.errors.locationError'),
            description: t('weather.errors.locationErrorDesc'),
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: t('weather.errors.notSupported'),
        description: t('weather.errors.notSupportedDesc'),
        variant: "destructive",
      });
    }
  };

  const irrigationStatusColor = {
    required: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    optional: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
    not_needed: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t('weather.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('weather.subtitle')}
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('weather.location')}
          </CardTitle>
          <CardDescription>
            {t('weather.locationDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('weather.enterCity')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
            />
            <Button
              onClick={() => fetchWeather()}
              disabled={isLoading}
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.search')
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {t('weather.useCurrentLocation')}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardContent className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{t('weather.fetching')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {weatherData && !isLoading && (
        <>
          {/* Current Weather */}
          <Card className="border-primary/20 bg-gradient-hero shadow-strong text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl">{weatherData.location}</span>
                <CloudSun className="h-8 w-8" />
              </CardTitle>
              <CardDescription className="text-white/80">
                {new Date().toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold">
                    {weatherData.current?.temperature}°C
                  </div>
                  <p className="mt-2 text-xl text-white/90">
                    {weatherData.current?.condition}
                  </p>
                </div>
                <div className="text-right text-sm text-white/80">
                  <p>{t('weather.feelsLike')} {weatherData.current?.feels_like}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Details Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <Droplets className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('weather.humidity')}</p>
                    <p className="text-2xl font-bold">{weatherData.current?.humidity}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-3">
                    <Wind className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('weather.windSpeed')}</p>
                    <p className="text-2xl font-bold">{weatherData.current?.wind_speed} km/h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <CloudRain className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('weather.rainfall')}</p>
                    <p className="text-2xl font-bold">{weatherData.current?.rainfall || 0} mm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <ThermometerSun className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('weather.uvIndex')}</p>
                    <p className="text-2xl font-bold">{weatherData.current?.uv_index || t('common.notAvailable')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Irrigation Recommendation */}
          {weatherData.irrigation_recommendation && (
            <Card className={`border shadow-soft ${irrigationStatusColor[weatherData.irrigation_recommendation.status]}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  {t('weather.irrigationRecommendation')}
                  {weatherData.irrigation_recommendation.status === 'required' && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                      {t('weather.actionNeeded')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">
                  {weatherData.irrigation_recommendation.message}
                </p>
                {weatherData.irrigation_recommendation.schedule && (
                  <p className="text-sm opacity-80">
                    <strong>{t('weather.schedule')}:</strong> {weatherData.irrigation_recommendation.schedule}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Weather Alerts */}
          {weatherData.current?.uv_index > 7 && (
            <Card className="border-yellow-500/30 bg-yellow-500/10 shadow-soft">
              <CardContent className="flex items-center gap-3 pt-6">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">{t('weather.highUvAlert')}</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    {t('weather.highUvAlertDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Farming Recommendations */}
          {weatherData.farming_advice && weatherData.farming_advice.length > 0 && (
            <Card className="border-accent/20 bg-accent/5 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Sprout className="h-5 w-5" />
                  {t('weather.farmingRecommendations')}
                </CardTitle>
                <CardDescription>
                  {t('weather.farmingRecommendationsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {weatherData.farming_advice.map((advice: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 7-Day Forecast */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('weather.sevenDayForecast')}
                </CardTitle>
                <CardDescription>
                  {t('weather.sevenDayForecastDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {weatherData.forecast.slice(0, 7).map((day: ForecastDay, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 text-center transition-all hover:scale-105 ${
                        idx === 0 
                          ? 'bg-primary/10 ring-2 ring-primary/30' 
                          : 'bg-muted/50 hover:bg-muted/70'
                      }`}
                    >
                      <p className={`text-sm font-medium ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {idx === 0 ? t('weather.today') : day.day}
                      </p>
                      <div className="my-3 flex justify-center">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <p className="text-xl font-bold">{day.temp}°</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {day.condition}
                      </p>
                      {day.rainfall_chance !== undefined && day.rainfall_chance > 0 && (
                        <p className="mt-1 text-xs text-blue-500">
                          {day.rainfall_chance}% {t('weather.rain')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Weather;
