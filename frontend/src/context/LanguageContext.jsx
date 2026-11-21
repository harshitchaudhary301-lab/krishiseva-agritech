import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appName: "KrishiSeva",
    tagline: "खेती की हर जरूरत, एक जगह।",
    subTagline: "The Farm Operations Coordination Platform",
    heroHeading: "Every Farm Need, in One Connected Platform.",
    heroSub: "Coordinate verified agricultural workers, tractor mechanics, tubewell technicians, and machinery rentals with transparent pricing and complete farm project management.",
    findServices: "Find Services",
    joinProvider: "Join as Provider",
    quickDemo: "One-Click Demo Logins",
    villageSelect: "Select Village / Area",
    voiceSearch: "Voice Search (Coming Soon)",
    categoriesTitle: "Agricultural Services Ecosystem",
    categoriesSub: "Instant booking for core farming operations. Seamless coordination from sowing to harvesting.",
    activeBadge: "Available Now",
    upcomingBadge: "Upcoming",
    howItWorks: "How KrishiSeva Works",
    step1Title: "1. Create Service Request",
    step1Desc: "Tell us what you need—labour, tractor repair, tubewell fix, or harvester rental—along with your village and date.",
    step2Title: "2. Compare Transparent Quotes",
    step2Desc: "Nearby verified providers and workers submit competitive quotes. Compare ratings, distance, and prices with zero hidden charges.",
    step3Title: "3. Confirm & Track Operations",
    step3Desc: "Providers confirm availability. Track milestones, avoid double-booking, and access backup providers automatically if needed.",
    coreUSPTitle: "Complete Farm Task Management",
    coreUSPSub: "Coordinate multiple essential services within a single agricultural operation like Wheat Harvesting.",
    wheatProjectExample: "Wheat Harvesting Project (20 Acres)",
    farmerBenefits: "For Farmers",
    workerBenefits: "For Agricultural Workers",
    providerBenefits: "For Mechanics & Machinery Owners",
    faqTitle: "Frequently Asked Questions",
    footerCopyright: "KrishiSeva — Founded by Harshit Chaudhary. Empowering Indian Agriculture.",
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "Dashboard",
    myFarm: "My Farm",
    myRequests: "My Requests",
    myBookings: "My Bookings",
    farmProjects: "Farm Projects",
    calendar: "Calendar",
    helpSupport: "Help & Support",
    settings: "Settings",
    overview: "Overview",
    earnings: "Earnings",
    jobRequests: "Job Requests",
    profile: "Profile",
    services: "Services",
    about: "About",
    intro: {
      act1Title: "Farming Problems",
      act1Kicker: "THE RURAL CHALLENGE",
      act2Title: "One Connected Solution",
      act2Kicker: "A NEW ERA FOR AGRICULTURE",
      find: "Find",
      findSub: "Verified Providers",
      connect: "Connect",
      connectSub: "Transparent Quotes",
      grow: "Grow",
      growSub: "Synchronized Success",
      brand: "KrishiSeva",
      tagline: "Every Farming Need. One Connected Platform.",
      subTagline: "The Farm Operations Coordination Platform",
      skip: "Skip Intro",
      skipKey: "Esc",
      replay: "Replay Intro",
      watchIntro: "Cinematic Intro"
    },
    status: {
      open: "Open for Quotes",
      quote_accepted: "Quote Accepted (Awaiting Confirmation)",
      confirmed: "Confirmed",
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      cancelled_by_farmer: "Cancelled by Farmer",
      cancelled_by_provider: "Cancelled by Provider"
    }
  },
  hi: {
    appName: "कृषि सेवा",
    tagline: "खेती की हर जरूरत, एक जगह।",
    subTagline: "कृषि कार्य समन्वय एवं सेवा मंच",
    heroHeading: "खेती की हर जरूरत, एक जगह।",
    heroSub: "कुशल कृषि श्रमिक, ट्रैक्टर मैकेनिक, ट्यूबवेल कारीगर और कंबाइन हार्वेस्टर किराए पर लें — पारदर्शी कोटेशन और संपूर्ण फसल प्रोजेक्ट प्रबंधन के साथ।",
    findServices: "सेवाएं खोजें",
    joinProvider: "सेवा प्रदाता बनें",
    quickDemo: "एक-क्लिक डेमो लॉगिन",
    villageSelect: "गाँव / क्षेत्र चुनें",
    voiceSearch: "बोलकर खोजें (जल्द आ रहा है)",
    categoriesTitle: "कृषि सेवा पारिस्थितिकी तंत्र",
    categoriesSub: "बुवाई से लेकर कटाई तक हर काम के लिए सत्यापित ग्रामीण सेवा प्रदाता और श्रमिक।",
    activeBadge: "उपलब्ध सेवा",
    upcomingBadge: "जल्द आ रहा है",
    howItWorks: "कृषि सेवा कैसे काम करती है?",
    step1Title: "1. सेवा अनुरोध बनाएं",
    step1Desc: "श्रमिक, ट्रैक्टर मरम्मत, ट्यूबवेल या हार्वेस्टर की जरूरत, गाँव और तारीख दर्ज करें।",
    step2Title: "2. कोटेशन की तुलना करें",
    step2Desc: "पास के सत्यापित प्रदाता और श्रमिक अपनी दरें भेजते हैं। रेटिंग, दूरी और मूल्य देखकर चुनें।",
    step3Title: "3. बुकिंग पक्की करें और ट्रैक करें",
    step3Desc: "प्रदाता सहमति देते हैं और समय पर कार्य शुरू होता है। किसी भी समस्या पर तुरंत बैकअप प्रदाता उपलब्ध।",
    coreUSPTitle: "संपूर्ण फार्म प्रोजेक्ट प्रबंधन",
    coreUSPSub: "गेहूं कटाई जैसे पूरे कृषि कार्य के लिए श्रमिक, मशीनरी और मैकेनिक एक साथ व्यवस्थित करें।",
    wheatProjectExample: "गेहूं कटाई प्रोजेक्ट (20 एकड़)",
    farmerBenefits: "किसानों के लिए लाभ",
    workerBenefits: "कृषि श्रमिकों के लिए लाभ",
    providerBenefits: "मैकेनिक व मशीनरी मालिकों के लिए लाभ",
    faqTitle: "अक्सर पूछे जाने वाले सवाल",
    footerCopyright: "कृषि सेवा — संस्थापक: हर्षित चौधरी। भारतीय किसानों को समर्पित।",
    login: "लॉगिन करें",
    register: "पंजीकरण करें",
    logout: "लॉगआउट",
    dashboard: "डैशबोर्ड",
    myFarm: "मेरा खेत",
    myRequests: "मेरी मांगें",
    myBookings: "मेरी बुकिंग्स",
    farmProjects: "फार्म प्रोजेक्ट्स",
    calendar: "कैलेंडर",
    helpSupport: "सहायता केंद्र",
    settings: "सेटिंग्स",
    overview: "अवलोकन",
    earnings: "कमाई",
    jobRequests: "उपलब्ध कार्य",
    profile: "प्रोफाइल",
    services: "सेवाएं",
    about: "हमारे बारे में",
    intro: {
      act1Title: "खेती की चुनौतियाँ",
      act1Kicker: "ग्रामीण कृषि संकट",
      act2Title: "एक एकीकृत समाधान",
      act2Kicker: "भारतीय कृषि का नया सवेरा",
      find: "खोजें",
      findSub: "सत्यापित प्रदाता",
      connect: "जुड़ें",
      connectSub: "पारदर्शी कोटेशन",
      grow: "बढ़ें",
      growSub: "सफल फसल संचालन",
      brand: "कृषि सेवा",
      tagline: "खेती की हर जरूरत, एक जगह।",
      subTagline: "कृषि कार्य समन्वय एवं सेवा मंच",
      skip: "स्किप करें",
      skipKey: "Esc",
      replay: "इंट्रो दोबारा देखें",
      watchIntro: "सिनेमैटिक इंट्रो"
    },
    status: {
      open: "कोटेशन के लिए खुला",
      quote_accepted: "कोटेशन स्वीकृत (सहमति प्रतीक्षारत)",
      confirmed: "बुकिंग पक्की",
      scheduled: "शेड्यूल किया गया",
      in_progress: "कार्य प्रगति पर",
      completed: "पूर्ण हुआ",
      cancelled: "रद्द किया गया",
      cancelled_by_farmer: "किसान द्वारा रद्द",
      cancelled_by_provider: "प्रदाता द्वारा रद्द"
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('krishi_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    localStorage.setItem('krishi_lang', nextLang);
  };

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
