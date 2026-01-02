import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = 
  | "en" 
  | "kn" 
  | "hi" 
  | "ta" 
  | "te" 
  | "ml" 
  | "mr" 
  | "gu" 
  | "bn" 
  | "ur";

export const languageNames: Record<Language, string> = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  ml: "മലയാളം",
  mr: "मराठी",
  gu: "ગુજરાતી",
  bn: "বাংলা",
  ur: "اردو",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Browser language detection
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split("-")[0].toLowerCase();
  
  const languageMap: Record<string, Language> = {
    en: "en",
    kn: "kn",
    hi: "hi",
    ta: "ta",
    te: "te",
    ml: "ml",
    mr: "mr",
    gu: "gu",
    bn: "bn",
    ur: "ur",
  };

  return languageMap[langCode] || "en";
};

interface LanguageProviderProps {
  children: ReactNode;
  translations: Record<Language, Record<string, string>>;
}

export const LanguageProvider = ({ children, translations }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("agrismart-language");
    if (saved && saved in languageNames) {
      return saved as Language;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem("agrismart-language", language);
    document.documentElement.lang = language;
    // Set RTL for Urdu
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const langTranslations = translations[language];
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    // Return key if no translation found
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
