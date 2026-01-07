import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, FlaskConical, CloudSun, Sprout, TrendingUp, Leaf } from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('features.plantDetection.title'),
      description: t('features.plantDetection.description'),
      icon: Camera,
      to: "/plant-detection",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: t('features.soilAnalysis.title'),
      description: t('features.soilAnalysis.description'),
      icon: FlaskConical,
      to: "/soil-analysis",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: t('features.weather.title'),
      description: t('features.weather.description'),
      icon: CloudSun,
      to: "/weather",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      title: t('features.cropRecommendations.title'),
      description: t('features.cropRecommendations.description'),
      icon: Sprout,
      to: "/crop-recommendation",
      gradient: "from-lime-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-white shadow-strong md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              {t('dashboard.hero.title')}
            </h1>
          </div>
          <p className="text-lg text-white/90">
            {t('dashboard.hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/plant-detection">
                <Camera className="mr-2 h-4 w-4" />
                {t('dashboard.hero.startDetection')}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link to="/weather">
                <CloudSun className="mr-2 h-4 w-4" />
                {t('dashboard.hero.checkWeather')}
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <Sprout className="h-full w-full" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.successRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">98.5%</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dashboard.stats.successRateDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.plantDatabase')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">500+</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dashboard.stats.plantDatabaseDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.weatherData')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">{t('dashboard.stats.live')}</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dashboard.stats.weatherDataDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
          {t('dashboard.exploreFeatures')}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map(({ title, description, icon: Icon, to, gradient }) => (
            <Link key={to} to={to} className="group">
              <Card className="h-full border-primary/20 bg-gradient-card shadow-soft transition-all hover:shadow-medium">
                <CardHeader>
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-medium`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl transition-colors group-hover:text-primary">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary">
                    {t('common.getStarted')}
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
