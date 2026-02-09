import { createContext, useContext, useState, ReactNode } from "react";
import { Language, getTranslation } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or browser language
    const saved = localStorage.getItem("language");
    if (saved && ["en", "hi", "mr", "gu"].includes(saved)) {
      return saved as Language;
    }

    const browserLang = navigator.language.split("-")[0];
    if (["en", "hi", "mr", "gu"].includes(browserLang)) {
      return browserLang as Language;
    }

    return "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string) => getTranslation(language, key);

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
