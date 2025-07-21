import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Importera din översättningsfil (vi skapar den i nästa steg)
import translationSV from "./translations/sv.json";

const resources = {
  sv: {
    translation: translationSV,
  },
};

i18n
  .use(initReactI18next) // kopplar i18next till react
  .init({
    resources,
    lng: "sv", // standardspråk
    fallbackLng: "sv", // språk som används om en översättning saknas
    interpolation: {
      escapeValue: false, // React sköter redan detta
    },
  });

export default i18n;
