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
        farm_overview: "FARM<br/>OVERVIEW",
        welcome: "Welcome back, Developer",
        location: "Location",
        loading_forecast: "Loading Local Forecast",
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
        save: "Save Preferences",
      },
      weather: {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast', 45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Rain Showers', 81: 'Heavy Showers', 82: 'Violent Showers', 95: 'Thunderstorm', 96: 'Thunderstorm With Hail', 99: 'Severe Thunderstorm'
      }
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
        farm_overview: "फार्म<br/>अवलोकन",
        welcome: "वापसी पर स्वागत है, डेवलपर",
        location: "स्थान",
        loading_forecast: "स्थानीय पूर्वानुमान लोड हो रहा है",
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
      weather: {
        0: 'साफ आसमान', 1: 'मुख्यतः साफ', 2: 'आंशिक रूप से बादल', 3: 'बादल छाए रहेंगे', 45: 'कोहरा', 48: 'घना कोहरा', 51: 'हल्की बूंदाबांदी', 53: 'बूंदाबांदी', 55: 'भारी बूंदाबांदी', 61: 'हल्की बारिश', 63: 'बारिश', 65: 'भारी बारिश', 71: 'हल्की बर्फबारी', 73: 'बर्फबारी', 75: 'भारी बर्फबारी', 80: 'बारिश की फुहारें', 81: 'भारी फुहारें', 82: 'भयंकर फुहारें', 95: 'आंधी तूफान', 96: 'ओलों के साथ आंधी', 99: 'भयंकर आंधी तूफान'
      }
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
