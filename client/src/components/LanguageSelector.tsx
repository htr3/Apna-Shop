import { useI18n } from "../i18n/I18nContext";
import { Language } from "../i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const languages: { value: Language; label: string; nativeLabel: string }[] = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { value: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { value: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <span>{lang.nativeLabel}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
