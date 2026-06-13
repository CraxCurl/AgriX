import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// These are initial automated translations for demonstration.
const resources = {
  en: {
    translation: {
      nav: {
        voice_command: "Voice Command",
        settings: "Settings",
        logout: "Logout",
      },
      dashboard: {
        weather: "WEATHER",
        irrigation_advice: "Irrigation Advice",
        forecast_3day: "3-Day Forecast",
        market_price: "MARKET PRICE",
        market_desc: "AI prediction based on current market trends and historical data.",
        view_report: "View Full Report",
        current_price: "Current Price",
        next_month: "Next Month (Est)",
        qtl: "Qtl",
        scan_crop: "SCAN CROP",
        scan_desc: "Upload leaf image to analyze disease",
        analyze: "Analyze Now",
        analyzing: "Analyzing...",
        drop_image: "Drop image here or click to browse",
      },
      settings: {
        title: "FARMER SETTINGS",
        language: "Language",
        land_size: "Land Size Unit",
        primary_crop: "Primary Crop",
        save: "Save Preferences",
      },
    },
  },
  hi: {
    translation: {
      nav: {
        voice_command: "वॉयस कमांड",
        settings: "सेटिंग्स",
        logout: "लॉगआउट",
      },
      dashboard: {
        weather: "मौसम",
        irrigation_advice: "सिंचाई सलाह",
        forecast_3day: "3-दिन का पूर्वानुमान",
        market_price: "बाजार मूल्य",
        market_desc: "वर्तमान बाजार प्रवृत्तियों और ऐतिहासिक डेटा के आधार पर एआई भविष्यवाणी।",
        view_report: "पूरी रिपोर्ट देखें",
        current_price: "वर्तमान मूल्य",
        next_month: "अगले महीने (अनुमान)",
        qtl: "क्विंटल",
        scan_crop: "फसल स्कैन",
        scan_desc: "बीमारी का विश्लेषण करने के लिए पत्ती की छवि अपलोड करें",
        analyze: "अभी विश्लेषण करें",
        analyzing: "विश्लेषण कर रहा है...",
        drop_image: "छवि यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
      },
      settings: {
        title: "किसान सेटिंग्स",
        language: "भाषा",
        land_size: "भूमि का आकार",
        primary_crop: "मुख्य फसल",
        save: "सेटिंग्स सहेजें",
      },
    },
  },
  mr: {
    translation: {
      nav: { voice_command: "व्हॉइस कमांड", settings: "सेटिंग्ज", logout: "लॉगआउट" },
      dashboard: { weather: "हवामान", market_price: "बाजारभाव", qtl: "क्विंटल" }
    }
  },
  pa: {
    translation: {
      nav: { voice_command: "ਵਾਇਸ ਕਮਾਂਡ", settings: "ਸੈਟਿੰਗਾਂ", logout: "ਲਾਗਆਉਟ" },
      dashboard: { weather: "ਮੌਸਮ", market_price: "ਮਾਰਕੀਟ ਕੀਮਤ", qtl: "ਕੁਇੰਟਲ" }
    }
  },
  te: {
    translation: {
      nav: { voice_command: "వాయిస్ కమాండ్", settings: "సెట్టింగులు", logout: "లాగ్అవుట్" },
      dashboard: { weather: "వాతావరణం", market_price: "మార్కెట్ ధర", qtl: "క్వింటాల్" }
    }
  },
  ta: {
    translation: {
      nav: { voice_command: "குரல் கட்டளை", settings: "அமைப்புகள்", logout: "வெளியேறு" },
      dashboard: { weather: "வானிலை", market_price: "சந்தை விலை", qtl: "குவிண்டால்" }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
