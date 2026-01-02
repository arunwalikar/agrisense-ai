import { Language } from "./LanguageContext";
import { en } from "./translations/en";
import { kn } from "./translations/kn";
import { hi } from "./translations/hi";

// For languages not yet fully translated, use English as fallback
export const translations: Record<Language, Record<string, string>> = {
  en,
  kn,
  hi,
  ta: { ...en, "nav.dashboard": "டாஷ்போர்டு", "nav.plantDetection": "தாவர கண்டறிதல்", "nav.soilAnalysis": "மண் பகுப்பாய்வு", "nav.weather": "வானிலை", "nav.cropGuide": "பயிர் வழிகாட்டி", "nav.marketPrices": "சந்தை விலைகள்", "dashboard.title": "ஸ்மார்ட் விவசாய தளம்" },
  te: { ...en, "nav.dashboard": "డాష్‌బోర్డ్", "nav.plantDetection": "మొక్క గుర్తింపు", "nav.soilAnalysis": "నేల విశ్లేషణ", "nav.weather": "వాతావరణం", "nav.cropGuide": "పంట గైడ్", "nav.marketPrices": "మార్కెట్ ధరలు", "dashboard.title": "స్మార్ట్ వ్యవసాయ వేదిక" },
  ml: { ...en, "nav.dashboard": "ഡാഷ്‌ബോർഡ്", "nav.plantDetection": "ചെടി തിരിച്ചറിയൽ", "nav.soilAnalysis": "മണ്ണ് വിശകലനം", "nav.weather": "കാലാവസ്ഥ", "nav.cropGuide": "വിള ഗൈഡ്", "nav.marketPrices": "വിപണി വിലകൾ", "dashboard.title": "സ്മാർട്ട് കൃഷി പ്ലാറ്റ്ഫോം" },
  mr: { ...en, "nav.dashboard": "डॅशबोर्ड", "nav.plantDetection": "वनस्पती ओळख", "nav.soilAnalysis": "माती विश्लेषण", "nav.weather": "हवामान", "nav.cropGuide": "पीक मार्गदर्शक", "nav.marketPrices": "बाजार भाव", "dashboard.title": "स्मार्ट शेती व्यासपीठ" },
  gu: { ...en, "nav.dashboard": "ડેશબોર્ડ", "nav.plantDetection": "છોડની ઓળખ", "nav.soilAnalysis": "જમીન વિશ્લેષણ", "nav.weather": "હવામાન", "nav.cropGuide": "પાક માર્ગદર્શિકા", "nav.marketPrices": "બજાર ભાવ", "dashboard.title": "સ્માર્ટ ખેતી પ્લેટફોર્મ" },
  bn: { ...en, "nav.dashboard": "ড্যাশবোর্ড", "nav.plantDetection": "উদ্ভিদ সনাক্তকরণ", "nav.soilAnalysis": "মাটি বিশ্লেষণ", "nav.weather": "আবহাওয়া", "nav.cropGuide": "ফসল গাইড", "nav.marketPrices": "বাজার দর", "dashboard.title": "স্মার্ট কৃষি প্ল্যাটফর্ম" },
  ur: { ...en, "nav.dashboard": "ڈیش بورڈ", "nav.plantDetection": "پودوں کی شناخت", "nav.soilAnalysis": "مٹی کا تجزیہ", "nav.weather": "موسم", "nav.cropGuide": "فصل گائیڈ", "nav.marketPrices": "مارکیٹ کی قیمتیں", "dashboard.title": "سمارٹ زراعت پلیٹ فارم" },
};
