import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    // Brand & Slogan
    tagline: '10-Minute Grocery Delivery',
    freshness: 'Daily Needs, Delivered Fresh.',

    // Navigation & Header
    home: 'Home',
    categories: 'Categories',
    search: 'Search',
    cart: 'Cart',
    myCart: 'My Cart',
    orders: 'Orders',
    account: 'Account',
    signIn: 'Sign in',
    signOut: 'Sign out',
    welcomeBack: 'Welcome back',
    helloSignIn: 'Hello, sign in',
    deliveryIn: 'Delivery in',
    deliveryPaused: 'Delivery Paused',
    selectAddress: 'Select delivery address',
    searchPlaceholder: 'Search for milk, fruits, snacks…',
    seeAll: 'See all',

    // Product & Cart
    items: 'items',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    onlyLeft: 'Only {count} left',
    off: 'OFF',
    add: 'ADD',
    addedToBasket: 'Added to your basket',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    freeDelivery: 'FREE Delivery',
    totalPayable: 'Total Payable',
    proceedToCheckout: 'Proceed to Checkout',
    emptyCart: 'Your cart is empty',
    startShopping: 'Start shopping',

    // Home Sections
    shopByCategory: 'Shop by category',
    bestSellers: 'Best sellers',
    topPicks: 'Top picks',
    recommended: 'Recommended for you',
    specialOffers: 'Special offers',
    recentlyViewed: 'Recently viewed',
    comingSoon: 'Coming Soon',

    // Admin Sidebar & Navigation
    dashboard: 'Dashboard',
    productsManage: 'Products Catalog',
    bulkImport: 'Bulk Product Import',
    categoriesManage: 'Categories',
    ordersManage: 'Customer Orders',
    deliveryAssignments: 'Delivery Fleet',
    deliveryHub: 'Delivery Hub',
    storeOperations: 'Store Operations',
    emergencyPause: 'Emergency Pause',
    productRanking: 'Product Ranking',
    securityStaffRole: 'Security & Staff',
    policiesManage: 'Policies & CMS',
    deliveryVerifications: 'Delivery Verification',
    codSettlements: 'COD Cash Settlements',
    customersManage: 'Customer Directory',
    inventoryManage: 'Live Inventory & Stock',
    marketingManage: 'Marketing & Promos',
    bannersManage: 'Store Banners',
    homepageRanking: 'Homepage Ranking',
    schedulingManage: 'Delivery Hours & Slots',
    deliveryZones: 'Delivery Radius & Zones',
    emergencyCenter: 'Emergency Center',
    securityStaff: 'Security & Staff Roles',
    storeSettings: 'Store Settings',
    customerSupport: 'Customer Support Tickets',

    // Common Actions
    save: 'Save',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    close: 'Close',
    back: 'Back',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading…',
    success: 'Success',
    error: 'Error',
    language: 'Language',
    hindi: 'हिंदी',
    english: 'English',

    // Launch Announcement
    launchTitle: 'Service Begins on 10th November 2026!',
    launchSubtitle: '10-Minute Grocery Delivery Coming to Hathua & Gopalganj',
    launchMessage: 'Welcome to R2Cart! Our 10-minute grocery delivery operations will officially begin on 10th November 2026. You can currently explore our 20+ fresh categories, products, and prices.',
    launchAction: 'Explore Store & Products',
    launchNote: 'Orders will be accepted starting 10 November.'
  },

  hi: {
    // Brand & Slogan
    tagline: '10-मिनट में ग्रॉसरी डिलीवरी',
    freshness: 'ताज़ा रोज़मर्रा का सामान, सीधे आपके घर।',

    // Navigation & Header
    home: 'होम',
    categories: 'कैटेगरी',
    search: 'सर्च',
    cart: 'कार्ट',
    myCart: 'मेरी कार्ट',
    orders: 'ऑर्डर्स',
    account: 'अकाउंट',
    signIn: 'लॉग इन करें',
    signOut: 'लॉग आउट',
    welcomeBack: 'स्वागत है',
    helloSignIn: 'नमस्ते, लॉग इन करें',
    deliveryIn: 'डिलीवरी समय',
    deliveryPaused: 'डिलीवरी रुकी हुई है',
    selectAddress: 'डिलीवरी पता चुनें',
    searchPlaceholder: 'दूध, फल, स्नैक्स खोजें…',
    seeAll: 'सभी देखें',

    // Product & Cart
    items: 'सामान',
    inStock: 'उपलब्ध है',
    outOfStock: 'स्टॉक में नहीं है',
    onlyLeft: 'केवल {count} बचे हैं',
    off: 'छूट',
    add: 'जोड़ें',
    addedToBasket: 'कार्ट में जोड़ दिया गया',
    subtotal: 'कुल राशि',
    deliveryFee: 'डिलीवरी शुल्क',
    freeDelivery: 'मुफ़्त डिलीवरी',
    totalPayable: 'कुल भुगतान',
    proceedToCheckout: 'चेकआउट के लिए आगे बढ़ें',
    emptyCart: 'आपकी कार्ट खाली है',
    startShopping: 'खरीदारी शुरू करें',

    // Home Sections
    shopByCategory: 'कैटेगरी के अनुसार खरीदें',
    bestSellers: 'सर्वाधिक बिकने वाले',
    topPicks: 'खास आपके लिए',
    recommended: 'सुझाए गए उत्पाद',
    specialOffers: 'विशेष बचत ऑफर्स',
    recentlyViewed: 'हाल ही में देखे गए',
    comingSoon: 'जल्द आ रहा है',

    // Admin Sidebar & Navigation
    dashboard: 'डैशबोर्ड',
    productsManage: 'प्रोडक्ट्स कैटलॉग',
    bulkImport: 'बल्क प्रोडक्ट इम्पोर्ट',
    categoriesManage: 'कैटेगरी प्रबंधन',
    ordersManage: 'ग्राहक ऑर्डर्स',
    deliveryAssignments: 'डिलीवरी टीम',
    deliveryHub: 'डिलीवरी हब',
    storeOperations: 'स्टोर ऑपरेशन्स',
    emergencyPause: 'इमरजेंसी पॉज़',
    productRanking: 'प्रोडक्ट रैंकिंग',
    securityStaffRole: 'सुरक्षा व स्टाफ',
    policiesManage: 'नीतियां व सीएमएस',
    deliveryVerifications: 'डिलीवरी सत्यापन',
    codSettlements: 'सीओडी कैश सेटलमेंट',
    customersManage: 'ग्राहक डायरेक्टरी',
    inventoryManage: 'लाइव स्टॉक व इन्वेंटरी',
    marketingManage: 'मार्केटिंग व ऑफर्स',
    bannersManage: 'स्टोर बैनर्स',
    homepageRanking: 'होमपेज रैंकिंग',
    schedulingManage: 'डिलीवरी समय व स्लॉट',
    deliveryZones: 'डिलीवरी एरिया व जोन',
    emergencyCenter: 'आपातकालीन सेंटर',
    securityStaff: 'सुरक्षा व स्टाफ रोल्स',
    storeSettings: 'स्टोर सेटिंग्स',
    customerSupport: 'हेल्प व सपोर्ट टिकट्स',

    // Common Actions
    save: 'सेव करें',
    saveChanges: 'बदलाव सेव करें',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    view: 'देखें',
    close: 'बंद करें',
    back: 'पीछे जाएं',
    status: 'स्थिति',
    active: 'सक्रिय (Active)',
    inactive: 'निष्क्रिय (Inactive)',
    loading: 'लोड हो रहा है…',
    success: 'सफल',
    error: 'त्रुटि',
    language: 'भाषा',
    hindi: 'हिंदी',
    english: 'English',

    // Launch Announcement
    launchTitle: '10 नवम्बर 2026 से सेवा शुरू होगी!',
    launchSubtitle: 'हथुआ और गोपालगंज में 10-मिनट ग्रॉसरी डिलीवरी',
    launchMessage: 'नमस्ते! R2Cart पर आपका स्वागत है। हमारी 10-मिनट की डिलीवरी सेवा 10 नवम्बर से आपके क्षेत्र में पूरी तरह शुरू हो जाएगी। अभी आप हमारे 20+ श्रेणियां, प्रोडक्ट्स और रियायती कीमतें देख सकते हैं।',
    launchAction: 'स्टोर व प्रोडक्ट्स देखें',
    launchNote: '10 नवम्बर से सभी ऑर्डर्स लिए जाएंगे।'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('r2cart_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (newLang) => {
    const valid = newLang === 'hi' ? 'hi' : 'en';
    setLangState(valid);
    try {
      localStorage.setItem('r2cart_lang', valid);
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const t = (key, fallback = '') => {
    const dict = translations[lang] || translations.en;
    if (dict[key] !== undefined) return dict[key];
    const enDict = translations.en;
    if (enDict[key] !== undefined) return enDict[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback = '') => fallback || key
    };
  }
  return ctx;
}
