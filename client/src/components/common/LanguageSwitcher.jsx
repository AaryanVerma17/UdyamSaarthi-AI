import { useTranslation } from "react-i18next";

const LANGUAGES = [
  {
    code: "en",
    label: "EN",
  },
  {
    code: "hi",
    label: "हिं",
  },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div
      className="lang-switch"
      role="group"
      aria-label="Language selection"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          className={
            i18n.language === language.code
              ? "active"
              : ""
          }
          aria-pressed={
            i18n.language === language.code
          }
          onClick={() =>
            i18n.changeLanguage(
              language.code
            )
          }
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}