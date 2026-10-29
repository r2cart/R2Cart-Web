import { createContext, useContext, useState, useEffect } from 'react';
import { getCachedHindi, translateToHindi } from '../utils/translator';

const LanguageContext = createContext(null);

export const categoryTranslations = {
  'Vegetables & Fruits': 'फल और सब्जियां',
  'Fruits & Vegetables': 'फल और सब्जियां',
  'Dairy, Bread & Eggs': 'दूध, ब्रेड और अंडे',
  'Atta, Rice, Dal & Oil': 'आटा, चावल, दाल और तेल',
  'Masalas & Dry Fruits': 'मसाले और सूखे मेवे',
  'Cold Drinks & Juices': 'कोल्ड ड्रिंक्स और जूस',
  'Snacks & Munchies': 'स्नैक्स और नमकीन',
  'Snacks': 'स्नैक्स और नमकीन',
  'Biscuits & Bakery': 'बिस्कुट और बेकरी',
  'Sweet Tooth': 'मिठाई और चॉकलेट',
  'Sweets & Chocolates': 'मिठाई और चॉकलेट',
  'Instant Food': 'नूडल्स व इंस्टेंट फूड',
  'Tea, Coffee & More': 'चाय, कॉफी व हेल्थ ड्रिंक्स',
  'Cleaning Essentials': 'सफाई और किचन का सामान',
  'Cleaning & Kitchen': 'सफाई और किचन का सामान',
  'Personal Care': 'पर्सनल केयर',
  'Pooja Needs': 'पूजा सामग्री',
  'Baby Care': 'बेबी केयर',
  'Jewellery': 'ज्वेलरी व आभूषण',
  'Paan Corner': 'पान कॉर्नर',
  'Pharma & Wellness': 'दवा और वेलनेस',
  'Stationery & Utilities': 'स्टेशनरी व उपयोगी सामान'
};

export const productTranslations = {
  // Fresh Produce
  "Fresh Red Onion": "ताज़ा लाल प्याज",
  "Farm Fresh Potato": "फार्म ताज़ा आलू",
  "Desi Hybrid Tomato": "देसी हाइब्रिड टमाटर",
  "Fresh Green Peas (Matar)": "ताज़ा हरी मटर",
  "Fresh Ginger (Adrak)": "ताज़ा अदरक",
  "Desi Garlic (Lahsun)": "देसी लहसुन",
  "Spicy Green Chilli": "तीखी हरी मिर्च",
  "Fresh Coriander (Dhaniya)": "ताज़ा हरा धनिया",
  "Green Capsicum (Shimla Mirch)": "हरी शिमला मिर्च",
  "Juicy Yellow Lemon (Nimbu)": "ताज़ा पीला नींबू",
  "Robusta Ripe Banana": "रोबस्टा पका केला",
  "Robusta Banana": "रोबस्टा केला",
  "Royal Gala Sweet Apple": "रॉयल गाला मीठा सेब",
  "Royal Gala Apple": "रॉयल गाला सेब",
  "Nagpur Sweet Orange": "नागपुर संतरा",
  "Ruby Red Pomegranate (Anar)": "ताज़ा लाल अनार",
  "Fresh Tomato": "ताज़ा टमाटर",
  "Fresh Onion": "ताज़ा प्याज",

  // Dairy & Breakfast
  "Amul Gold Full Cream Milk": "अमूल गोल्ड फुल क्रीम दूध",
  "Amul Taaza Toned Milk": "अमूल ताज़ा टोन्ड दूध",
  "Amul Taaza Milk": "अमूल ताज़ा दूध",
  "Mother Dairy Cow Fresh Milk": "मदर डेयरी गाय का दूध",
  "Amul Fresh Malai Paneer": "अमूल ताज़ा मलाई पनीर",
  "Amul Pasteurized Salted Butter": "अमूल बटर (मक्खन)",
  "Amul Masti Dahi": "अमूल मस्ती दही",
  "Amul Cheese Block": "अमूल चीज़ ब्लॉक",
  "Amul Pure Cow Ghee": "अमूल शुद्ध गाय का घी",
  "Mother Dairy Shuddh Desi Ghee": "मदर डेयरी शुद्ध देसी घी",
  "Britannia Processed Cheese Slices": "ब्रिटानिया चीज़ स्लाइस",
  "Farm Fresh White Eggs": "फार्म ताज़ा सफेद अंडे",
  "Farm Fresh Eggs": "फार्म ताज़ा अंडे",
  "Epigamia Greek Yogurt Strawberry": "एपिगामिया स्ट्रॉबेरी योगर्ट",
  "Epigamia Greek Yogurt Blueberry": "एपिगामिया ब्लूबेरी योगर्ट",
  "Quaker 100% Rolled Wholegrain Oats": "क्वेकर रोल्ड होल ग्रेन ओट्स",
  "Saffola Masala Oats Classic": "सफ़ोला मसाला ओट्स क्लासिक",
  "FunFoods Creamy Peanut Butter": "फनफूड्स क्रीमी पीनट बटर",
  "Nutella Hazelnut Cocoa Spread": "न्यूटेला हेज़लनट कोको स्प्रेड",
  "Veeba Truly Eggless Mayonnaise": "वीबा एगलेस मेयोनेज़",

  // Bakery & Breads
  "Harvest Gold 100% Whole Wheat Bread": "हार्वेस्ट गोल्ड होल व्हीट ब्रेड",
  "Harvest Gold Regular White Bread": "हार्वेस्ट गोल्ड व्हाइट ब्रेड",
  "Harvest Gold Sweet Milk Bread": "हार्वेस्ट गोल्ड मिल्क ब्रेड",
  "Whole Wheat Bread": "होल व्हीट ब्रेड",
  "English Oven Soft Brown Bread": "इंग्लिश ओवन ब्राउन ब्रेड",
  "English Oven Multigrain Bread": "इंग्लिश ओवन मल्टीग्रेन ब्रेड",
  "English Oven Fresh Pav Buns": "इंग्लिश ओवन ताज़ा पाव",
  "English Oven Soft Burger Buns": "इंग्लिश ओवन बर्गर बन्स",
  "English Oven Garlic Herb Loaf": "इंग्लिश ओवन गार्लिक ब्रेड",
  "Bonn Whole Wheat Pizza Base": "बॉन होल व्हीट पिज़्ज़ा बेस",
  "Bauli Moonfils Chocolate Croissant": "बाउली मूनफिल्स चॉकलेट क्रोइसैन्ट",
  "Britannia Chocolate Muffins": "ब्रिटानिया चॉकलेट मफिन्स",
  "Britannia Fresh Fruit Cake Slice": "ब्रिटानिया फ्रूट केक स्लाइस",
  "Winkies Vanilla Swiss Roll": "विंकीज़ वैनिला स्विस रोल",
  "Elite Butter Rusk Toast": "एलीट बटर रस्क टोस्ट",

  // Atta, Rice, Dal & Oil
  "Aashirvaad Shudh Chakki Atta": "आशीर्वाद शुद्ध चक्की आटा",
  "Aashirvaad Atta": "आशीर्वाद आटा",
  "Fortune Chakki Fresh Atta": "फॉर्च्यून चक्की फ्रेश आटा",
  "India Gate Feast Rozzana Basmati Rice": "इंडिया गेट रोज़ाना बासमती चावल",
  "India Gate Basmati Rice": "इंडिया गेट बासमती चावल",
  "Fortune Biryani Special Basmati Rice": "फॉर्च्यून बिरयानी बासमती चावल",
  "Wada Kolam Daily Steam Rice": "वाडा कोलम स्टीम चावल",
  "Tata Sampann Unpolished Toor Dal": "टाटा सम्पन्न अनपॉलिश तूर दाल",
  "Tata Sampann Toor Dal": "टाटा सम्पन्न तूर दाल",
  "Tata Sampann Desi Chana Dal": "टाटा सम्पन्न देसी चना दाल",
  "Tata Sampann Yellow Moong Dal Dhuli": "टाटा सम्पन्न मूंग दाल धुली",
  "Tata Sampann Whole Kali Urad Dal": "टाटा सम्पन्न साबुत काली उड़द",
  "Tata Sampann Desi Brown Kala Chana": "टाटा सम्पन्न देसी काला चना",
  "Tata Sampann Big Kabuli Chana": "टाटा सम्पन्न काबुली चना",
  "Himalayan Rajma Chitra": "हिमालयन राजमा चित्रा",
  "Pure Roasted Sooji Rava": "शुद्ध रोस्टेड सूजी रवा",
  "Fortune Sunlite Refined Sunflower Oil": "फॉर्च्यून सनलाइट रिफाइंड सनफ्लावर ऑयल",
  "Fortune Sunlite Oil": "फॉर्च्यून सनलाइट ऑयल",
  "Fortune Kachi Ghani Mustard Oil": "फॉर्च्यून कच्ची घानी सरसों का तेल",
  "Saffola Gold Pro Healthy Heart Oil": "सफ़ोला गोल्ड प्रो कुकिंग ऑयल",

  // Snacks & Munchies
  "Haldiram's Classic Bhujia Sev": "हल्दीराम क्लासिक भुजिया सेव",
  "Haldiram's Aloo Bhujia": "हल्दीराम आलू भुजिया",
  "Haldiram's All-in-One Mixture": "हल्दीराम ऑल-इन-वन नमकीन",
  "Kurkure Masala Munch Crunchy Snack": "कुरकुरे मसाला मंच स्नैक",
  "Doritos Cheese Supreme Tortilla Chips": "डोरिटोस चीज़ टॉर्टिला चिप्स",
  "Classic Salted Chips": "क्लासिक सॉल्टेड चिप्स",
  "Parle-G Original Gluco Biscuits": "पारले-जी ग्लूको बिस्कुट",
  "Parle-G Biscuits": "पारले-जी बिस्कुट",
  "Britannia Good Day Butter Cookies": "ब्रिटानिया गुड डे बटर कुकीज़",
  "Britannia Bourbon Chocolate Cream": "ब्रिटानिया बॉर्बन चॉकलेट क्रीम बिस्कुट",
  "Oreo Original Vanilla Cream Biscuits": "ओरियो वैनिला क्रीम बिस्कुट",

  // Beverages & Juices
  "Coca-Cola Sparkling Soft Drink": "कोका-कोला कोल्ड ड्रिंक",
  "Coca-Cola Soft Drink": "कोका-कोला कोल्ड ड्रिंक",
  "Thums Up Charged Strong Cola": "थम्स अप स्ट्रॉन्ग कोला",
  "Sprite Crisp Lemon-Lime Soda": "स्प्राइट लेमन-लाइम सोडा",
  "Frooti Fresh Mango Drink": "फ्रूटी मैंगो ड्रिंक",
  "Maaza Real Mango Pulp Drink": "माज़ा मैंगो पल्प ड्रिंक",
  "Real Fruit Power Mixed Fruit Juice": "रियल फ्रूट पावर मिक्स्ड फ्रूट जूस",
  "Real Mixed Fruit Juice": "रियल मिक्स्ड फ्रूट जूस",
  "Real Fruit Power Pomegranate Juice": "रियल फ्रूट पावर अनार जूस",
  "Bisleri Packaged Drinking Water": "बिसलेरी मिनरल वाटर",
  "Tata Tea Gold Premium Assam Blend": "टाटा टी गोल्ड प्रीमियम चाय",
  "Brooke Bond Red Label Natural Care": "रेड लेबल नेचुरल केयर चाय",
  "Nescafe Classic Instant Coffee": "नेस्कैफे क्लासिक इंस्टेंट कॉफी",

  // Instant Food & Spices
  "Maggi 2-Minute Masala Instant Noodles": "मैगी 2-मिनट मसाला नूडल्स",
  "Maggi Masala Noodles": "मैगी मसाला नूडल्स",
  "Sunfeast Yippee Magic Masala Noodles": "यिप्पी मैजिक मसाला नूडल्स",
  "Ching’s Secret Hakka Noodles": "चिंग्स सीक्रेट हक्का नूडल्स",
  "Ching’s Secret Schezwan Chutney": "चिंग्स सीक्रेट शेज़वान चटनी",
  "Kissan Fresh Tomato Ketchup": "किसान फ्रेश टोमैटो केचप",
  "Everest Super Garam Masala": "एवरेस्ट सुपर गरम मसाला",
  "Everest Chhole Masala": "एवरेस्ट छोले मसाला",
  "MDH Deggi Mirch Natural Red": "एमडीएच देगी मिर्च",
  "Catch Turmeric Powder (Haldi)": "कैच हल्दी पाउडर",
  "Catch Red Chilli Powder (Lal Mirch)": "कैच लाल मिर्च पाउडर",
  "Catch Coriander Powder (Dhaniya)": "कैच धनिया पाउडर",
  "Tata Salt Vacuum Evaporated Iodised": "टाटा नमक आयोडीन युक्त",
  "Tata Salt Lite 15% Low Sodium": "टाटा सॉल्ट लाइट",

  // Household & Cleaning
  "Ariel Complete Washing Powder": "एरियल कम्प्लीट वॉशिंग पाउडर",
  "Surf Excel Easy Wash Detergent Powder": "सर्फ एक्सेल ईज़ी वॉश डिटर्जेंट",
  "Surf Excel Matic Front Load Liquid": "सर्फ एक्सेल मैटिक लिक्विड",
  "Surf Excel Matic": "सर्फ एक्सेल मैटिक",
  "Tide Plus Double Power Lemon & Mint": "टाइड प्लस डबल पावर डिटर्जेंट",
  "Comfort After Wash Morning Fresh": "कंफर्ट आफ्टर वॉश फैब्रिक कंडीशनर",
  "Vim Dishwash Gel with Lemon": "विम डिशवॉश जेल (नींबू)",
  "Vim Lemon Dishwash Gel with Easy Dispenser": "विम लेमन डिशवॉश डिस्पेंसर जेल",
  "Vim Dishwash Bar with Polycoat": "विम डिशवॉश साबुन",
  "Harpic Power Plus 10x Disinfectant Toilet Cleaner": "हार्पिक पावर प्लस टॉयलेट क्लीनर",
  "Harpic Power Plus Disinfectant Toilet Cleaner": "हार्पिक पावर प्लस टॉयलेट क्लीनर",
  "Lizol Citrus Disinfectant Floor Cleaner": "लायज़ोल सिट्रस फ्लोर क्लीनर",
  "Lizol Disinfectant Floor Cleaner Citrus": "लायज़ोल फ्लोर क्लीनर",
  "Colin Glass & Household Surface Cleaner Spray": "कोलिन ग्लास व सरफेस क्लीनर स्प्रे",
  "Colin Glass and Surface Cleaner Spray": "कोलिन ग्लास क्लीनर स्प्रे",
  "Scotch-Brite Heavy Duty Scrub Sponge": "स्कॉच-ब्राइट स्क्रब स्पंज",
  "Good Knight Gold Flash Liquid Mosquito Refill": "गुड नाइट गोल्ड फ्लैश लिक्विड रिफिल",
  "All Out Ultra Power+ Liquid Refill": "ऑल आउट अल्ट्रा लिक्विड रिफिल",
  "Freshwrapp Food Grade Aluminium Foil": "फ्रेश रैप एल्युमिनियम फॉयल",
  "Origami 2-Ply Kitchen Paper Towel Roll": "ओरिगामी किचन पेपर टॉवल",
  "Clean Pro Heavy Duty Garbage Bags (Medium)": "क्लीन प्रो गारबेज बैग्स",

  // Personal Care & Hygiene
  "Colgate Strong Teeth Calcium Toothpaste": "कोलगेट स्ट्रॉन्ग टीथ कैल्शियम टूथपेस्ट",
  "Colgate MaxFresh Spicy Fresh Toothpaste": "कोलगेट मैक्सफ्रेश टूथपेस्ट",
  "Sensodyne Fresh Mint Sensitive Toothpaste": "सेंसोडाइन फ्रेश मिंट टूथपेस्ट",
  "Dettol Original Germ Protection Bath Soap": "डेटॉल ओरिजिनल बाथिंग सोप",
  "Dettol Antiseptic Disinfectant Liquid": "डेटॉल एंटीसेप्टिक लिक्विड",
  "Dettol Skincare Liquid Handwash Refill": "डेटॉल स्किनकेयर हैंडवॉश रिफिल",
  "Dove Cream Beauty Bathing Bar": "डव क्रीम ब्यूटी सोप",
  "Dove Cream Beauty Bar": "डव ब्यूटी सोप",
  "Dove Daily Shine Shampoo": "डव शैम्पू",
  "Pears Pure & Gentle Glycerin Soap": "पियर्स प्योर एंड जेंटल ग्लिसरीन सोप",
  "Head & Shoulders Anti-Dandruff Shampoo": "हेड एंड शोल्डर्स एंटी-डैंड्रफ शैम्पू",
  "Pantene Advanced Hairfall Control Shampoo": "पैंटीन हेयरफॉल कंट्रोल शैम्पू",
  "Nivea Soft Light Moisturiser Cream": "निविया सॉफ्ट लाइट मॉइस्चराइज़र",
  "Vaseline Deep Moisture Body Lotion": "वैसलीन डीप मॉइस्चर बॉडी लोशन",

  // Baby Care
  "Pampers All Round Protection Diaper Pants (L)": "पैम्पर्स ऑल राउंड डायपर पैंट्स (L)",
  "MamyPoko Extra Absorb Diaper Pants (XL)": "मैमीपोको एक्स्ट्रा एब्सॉर्ब डायपर (XL)",
  "Huggies Wonder Pants Diapers (M)": "हगीज़ वंडर पैंट्स डायपर (M)",
  "Chicco Baby Moments Gentle Body Wash & Shampoo": "चिको बेबी बॉडी वॉश व शैम्पू",
  "Sebamed Baby Gentle Cleansing Bar": "सेबामेड बेबी क्लींजिंग बार",
  "Nestlé Cerelac Wheat Apple Baby Cereal with Milk": "नेस्ले सेरेलक व्हीट एप्पल बेबी फूड",

  // Pharma & Wellness
  "Vicks Vaporub Ayurvedic Cold & Cough Relief Balm": "विक़्स वेपोरब सर्दी-खांसी बाम",
  "Iodex Multi-Purpose Fast Relief Balm": "आयोडैक्स फास्ट रिलीफ बाम",
  "Volini Maxx Instant Pain Relief Spray": "वोलिनी मैक्स दर्द निवारक स्प्रे",
  "Digene Acidity & Gas Relief Gel Orange Flavor": "डाइजीन एसिडिटी रिलीफ जेल",
  "Eno Fast Relief Fruit Salt Regular Lemon": "इनो फ्रूट सॉल्ट लेमन",
  "Hansaplast Regular Washproof Bandages": "हंसाप्लास्ट वॉशप्रूफ बैंडेज",
  "Revital H Daily Health Supplement Capsules": "रिवाइटल एच हेल्थ कैप्सूल्स",

  // Paan Corner
  "Rajnigandha Flavored Pan Masala Premium Zipper": "रजनीगंधा पान मसाला प्रीमियम ज़िपर",
  "Baba Elaichi Silver Coated Cardamom Seeds": "बाबा इलायची सिल्वर कोटेड",
  "Pass Pass Sweet Mint Herbal Mouth Freshener": "पास पास हर्बल माउथ फ्रेशनर",
  "Center Fresh Spearmint Chewing Gum Stick": "सेंटर फ्रेश च्युइंग गम",
  "Orbit Spearmint Sugarfree Chewing Gum Bottle": "ऑर्बिट शुगरफ्री च्युइंग गम",
  "Tic Tac Fresh Spearmint Flavored Mints": "टिक टैक फ्रेश मिंट्स",
  "Churan Goli Pachak Digestive Hing Candy": "पाचक हींग गोली व चूर्ण",

  // Jewellery
  "18K Rose Gold Plated Crystal Solitaire Ring": "18K रोज़ गोल्ड क्रिस्टल सॉलिटेयर रिंग",
  "Traditional Kundan Pearl Choker Necklace Set": "पारंपरिक कुंदन मोती चोकर नेकलेस सेट",
  "Pearl Drop Elegant Dangler Jhumka Earrings": "मोती झुमका डैंगलर इयररिंग्स",
  "Antique Brass Traditional Temple Bangles": "एंटीक ब्रास पारंपरिक मंदिर चूड़ियां",
  "Sterling Silver 925 Infinity Link Bracelet": "स्टर्लिंग सिल्वर 925 इन्फिनिटी ब्रेसलेट",
  "Minimalist Layered Gold Chain with Pendant": "मिनिमलिस्ट गोल्ड चेन व पेंडेंट",
  "Sparkling Zircon Adjustable Traditional Anklet": "ज़िरकॉन एडजस्टेबल पारंपरिक पायल",
  "Tanishq Gold Plated Floral Stud Earrings": "गोल्ड प्लेटेड फ्लोरल स्टड इयररिंग्स",

  // Utilities & Stationery
  "Classmate Spiral Bound Soft Cover Long Notebook": "क्लासमेट लॉन्ग नोटबुक",
  "Cello Butterflow Classic Blue Ballpoint Pens": "सेलो बटरफ्लो क्लासिक पेन",
  "Fevistik All Round Non-Toxic Glue Stick": "फेविस्टिक ग्लू स्टिक",
  "Scotch Magic Invisible Mending Tape with Dispenser": "स्कॉच मैजिक टेप",
  "Philips Stellar Bright 9W B22 Cool Day White Bulb": "फिलिप्स 9W LED बल्ब",
  "Duracell Ultra AA High Drain Alkaline Batteries": "ड्यूरासेल अल्ट्रा AA बैटरी",
  "Duracell Chota Power AAA Alkaline Batteries": "ड्यूरासेल AAA बैटरी",
  "Eveready Digiled Compact LED Flashlight Torch": "एवरेडी एलईडी टॉर्च"
};

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
    storeClosed: 'Store Closed',
    scheduleOpen: 'Schedule Open',
    selectAddress: 'Select delivery address',
    searchPlaceholder: 'Search for milk, fruits, snacks…',
    seeAll: 'See all',
    offers: 'Offers',
    new: 'NEW',

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
    done: 'Done',

    // Home Sections
    shopByCategory: 'Shop by category',
    bestSellers: 'Best sellers',
    topPicks: 'Top picks',
    recommended: 'Recommended for you',
    specialOffers: 'Special offers',
    recentlyViewed: 'Recently viewed',
    comingSoon: 'Coming Soon',
    shopNow: 'Shop now',
    freshPicks: 'Fresh picks · Honest prices · Fast delivery',
    freshnessGuaranteed: 'Freshness guaranteed',
    handpickedDaily: 'Handpicked every day',
    qualityTrust: 'Quality you can trust',
    easyReturns: 'Easy returns & support',
    doorstepDelivery: 'From store to doorstep',
    bannerTitleDefault: 'Mornings made delicious.',
    bannerSubDefault: 'Milk, eggs, bread and more in minutes',

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
    launchSubtitle: '10-Minute Grocery Delivery in Hathua',
    launchMessage: 'Welcome to R2Cart! Our 10-minute instant delivery service will be fully live across Hathua starting 10th November 2026. Real store prices and fresh stock will be updated on 1st November. Currently, items and prices shown are for preview and testing.',
    launchAction: 'Explore Store & Products',
    launchNote: 'Official delivery orders start from 10th November 2026.'
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
    storeClosed: 'दुकान बंद है',
    scheduleOpen: 'शेड्यूल उपलब्ध',
    selectAddress: 'डिलीवरी पता चुनें',
    searchPlaceholder: 'दूध, फल, स्नैक्स खोजें…',
    seeAll: 'सभी देखें',
    offers: 'ऑफ़र्स',
    new: 'नया',

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
    done: 'पूर्ण',

    // Home Sections
    shopByCategory: 'कैटेगरी के अनुसार खरीदें',
    bestSellers: 'सर्वाधिक बिकने वाले',
    topPicks: 'खास आपके लिए',
    recommended: 'सुझाए गए उत्पाद',
    specialOffers: 'विशेष बचत ऑफर्स',
    recentlyViewed: 'हाल ही में देखे गए',
    comingSoon: 'जल्द आ रहा है',
    shopNow: 'अभी खरीदें',
    freshPicks: 'ताज़ा उत्पाद · सही दाम · सुपरफास्ट डिलीवरी',
    freshnessGuaranteed: 'ताज़गी की 100% गारंटी',
    handpickedDaily: 'प्रतिदिन चुनिंदा और शुद्ध',
    qualityTrust: 'भरोसेमंद सर्वोत्तम गुणवत्ता',
    easyReturns: 'आसान सहायता व वापसी',
    doorstepDelivery: 'स्टोर से सीधे आपके दरवाज़े तक',
    bannerTitleDefault: 'स्वादिष्ट और ताज़ा शुरुआत।',
    bannerSubDefault: 'दूध, अंडे, ब्रेड व ताज़ा सामान कुछ ही मिनटों में',

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
    launchSubtitle: 'हथुआ में 10-मिनट ग्रॉसरी डिलीवरी',
    launchMessage: 'नमस्ते! R2Cart पर आपका स्वागत है। वर्तमान में दिखाई गई कीमतें और प्रोडक्ट्स टेस्टिंग व डेमो के लिए हैं। 1 नवम्बर से असली कीमतें लाइव होंगी और 10 नवम्बर से हथुआ में 10-मिनट की डिलीवरी सेवा पूरी तरह शुरू हो जाएगी।',
    launchAction: 'स्टोर व प्रोडक्ट्स देखें',
    launchNote: '10 नवम्बर से सभी ऑर्डर्स लिए जाएंगे।'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('r2cart_lang');
      return saved === 'hi' ? 'hi' : 'en'; // Strict default: English
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

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

  const tCat = (name) => {
    if (!name) return '';
    if (lang !== 'hi') return name;
    return categoryTranslations[name] || categoryTranslations[name.trim()] || name;
  };

  const tEta = (eta) => {
    if (!eta) return lang === 'hi' ? '15–20 मिनट' : '15–20 mins';
    if (lang !== 'hi') return eta;
    return String(eta)
      .replace(/minutes/gi, 'मिनट')
      .replace(/minute/gi, 'मिनट')
      .replace(/mins/gi, 'मिनट')
      .replace(/min/gi, 'मिनट')
      .replace(/delivery in/gi, 'डिलीवरी समय');
  };

  const [, setRerenderTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRerenderTick(t => t + 1);
    window.addEventListener('r2cart:translation-updated', handleUpdate);
    return () => window.removeEventListener('r2cart:translation-updated', handleUpdate);
  }, []);

  const tProd = (input) => {
    if (!input) return '';
    const name = typeof input === 'object' ? (input.nameHi || input.metadata?.nameHi || input.name || '') : String(input);
    if (lang !== 'hi') return typeof input === 'object' ? input.name || '' : name;

    if (typeof input === 'object' && (input.nameHi || input.metadata?.nameHi)) {
      return input.nameHi || input.metadata?.nameHi;
    }

    if (productTranslations[name]) return productTranslations[name];
    const trimmed = name.trim();
    if (productTranslations[trimmed]) return productTranslations[trimmed];
    for (const [enName, hiName] of Object.entries(productTranslations)) {
      if (trimmed.toLowerCase() === enName.toLowerCase()) return hiName;
    }

    const autoCached = getCachedHindi(trimmed);
    if (autoCached) return autoCached;

    // Asynchronously translate new product to Hindi and cache it
    translateToHindi(trimmed);

    return name;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tCat, tEta, tProd }}>
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
      t: (key, fallback = '') => fallback || key,
      tCat: (name) => name || '',
      tEta: (eta) => eta || '',
      tProd: (name) => name || ''
    };
  }
  return ctx;
}
