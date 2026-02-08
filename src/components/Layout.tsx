import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Leaf, Camera, FlaskConical, CloudSun, Sprout, Store, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ChatBot } from "@/components/ChatBot";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  const mainNavItems = [
    { to: "/dashboard", label: t('nav.dashboard'), icon: Leaf },
    { to: "/plant-detection", label: t('nav.plantDetection'), icon: Camera },
    { to: "/soil-analysis", label: t('nav.soilAnalysis'), icon: FlaskConical },
    { to: "/weather", label: t('nav.weather'), icon: CloudSun },
    { to: "/crop-recommendation", label: t('nav.cropGuide'), icon: Sprout },
  ];

  const mobileNavItems = [
    { to: "/dashboard", label: t('nav.home'), icon: Leaf },
    { to: "/plant-detection", label: t('nav.plants'), icon: Camera },
    { to: "/soil-analysis", label: t('nav.soil'), icon: FlaskConical },
    { to: "/weather", label: t('nav.weather'), icon: CloudSun },
    { to: "/market-prices", label: t('nav.market'), icon: Store },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-primary">
                    <Leaf className="h-5 w-5" />
                    {t('app.name')}
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  {mainNavItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        location.pathname === to
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  <Link to="/market-prices" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <Store className="h-4 w-4" /> {t('nav.marketPrices')}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/dashboard" className="flex items-center gap-2 font-display text-xl font-bold text-primary transition-opacity hover:opacity-80">
              <Leaf className="h-6 w-6" />
              <span className="hidden sm:inline">{t('app.name')}</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {mainNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/market-prices">
              <Button variant="ghost" size="icon">
                <Store className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                location.pathname === to
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <ChatBot />
    </div>
  );
};
