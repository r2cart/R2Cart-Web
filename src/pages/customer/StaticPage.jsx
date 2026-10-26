import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {
 Shield,FileText,RotateCcw,XCircle,Truck,AlertCircle,Phone,Cookie,Store,
 Mail,MapPin,Clock,Send,CheckCircle2,Info,Building2,UserCheck
} from 'lucide-react';
import {Button} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {BRAND} from '../../config/brand';
import {catalogService} from '../../services/catalog.service';

export const policyNav=[
 {type:'privacy',path:'/privacy',label:'Privacy Policy',icon:Shield},
 {type:'terms',path:'/terms',label:'Terms & Conditions',icon:FileText},
 {type:'refund',path:'/refund-policy',label:'Return & Refund',icon:RotateCcw},
 {type:'cancellation',path:'/cancellation-policy',label:'Cancellation',icon:XCircle},
 {type:'delivery',path:'/delivery-info',label:'Shipping & Delivery',icon:Truck},
 {type:'grievance',path:'/grievance',label:'Grievance Redressal',icon:AlertCircle},
 {type:'cookies',path:'/cookie-policy',label:'Cookie Policy',icon:Cookie},
 {type:'contact',path:'/contact',label:'Contact Us',icon:Phone},
 {type:'about',path:'/about',label:'About Us',icon:Store}
];

export function getPolicyContent(s){
 return {
  privacy:{
   eyebrow:'LEGAL & DATA PRIVACY',
   title:'Privacy Policy',
   intro:`At ${s.storeName}, we are committed to safeguarding your personal information and handling your data with transparency, integrity, and strict legal compliance in accordance with the Information Technology Act, 2000 and Digital Personal Data Protection (DPDP) Act, 2023.`,
   metaTags:['Effective Date: 1 October 2026',`Entity: ${s.legalName}`,'Jurisdiction: India'],
   sections:[
    {
     title:'1. Information We Collect',
     text:`We collect only the essential personal information required to process your grocery orders, deliver them to your doorstep, and provide a seamless shopping experience.`,
     bullets:[
      'Personal Identification: Your full name, verified 10-digit mobile number, and email address provided during registration or checkout.',
      'Delivery Information: Complete delivery address including house/flat number, building name, street, locality, landmark, city, and 6-digit postal PIN code.',
      'Transaction & Cart Data: Items ordered, pack sizes, order value, payment method (Cash on Delivery), order history, and discount coupons utilized.',
      'Device & Log Information: IP address, browser type, operating system, app diagnostic logs, and access timestamps to ensure account security and fraud prevention.'
     ],
     callout:{type:'blue',text:`${s.storeName} never sells, rents, or trades your personal information to third-party marketing brokers. Your data is used exclusively for order fulfillment and platform improvements.`}
    },
    {
     title:'2. Location Data & Serviceability',
     text:'To deliver fresh groceries within our promised 15–30 minute delivery window, we access your device locality and delivery address.',
     bullets:[
      'Hyper-Local Verification: Location coordinates are used solely to confirm that your delivery address falls within our active 5 km service radius.',
      `Nearest Store Assignment: Your location routes your order to the nearest ${s.storeName} fulfillment hub for minimal transit time.`,
      'No Persistent Background Tracking: We do not track your location in the background when the app or website is not actively in use.'
     ]
    },
    {
     title:'3. OTP Verification & Account Security',
     text:'We implement robust authentication protocols to ensure your account remains safe and protected from unauthorized access.',
     bullets:[
      'Mobile OTP Verification: A One-Time Password (OTP) is sent via SMS/Email to verify ownership during account login, signup, and sensitive updates.',
      'Bcrypt Password Hashing: Account passwords are encrypted using high-strength salted bcrypt algorithms and are never stored or accessible in plain text.',
      'Secure JSON Web Tokens (JWT): User sessions are authenticated using encrypted, tamper-resistant tokens with automated session expiration.'
     ]
    },
    {
     title:'4. Third-Party Service Providers',
     text:'We partner with certified, compliant third-party infrastructure providers who adhere to strict data security standards:',
     bullets:[
      'Cloud Image CDN: Cloudinary for secure storage and optimized delivery of product catalog images.',
      'Communication & SMS Gateways: Automated transactional SMS and SMTP email services for sending order confirmations, OTPs, and invoices.',
      'Payment Infrastructure: Authorized banking partners for secure Cash on Delivery and doorstep UPI verification.'
     ]
    },
    {
     title:'5. Data Retention & Archival',
     text:'We retain your personal data only as long as your customer account remains active or as required by applicable Indian commercial and tax laws (e.g., GST Act, Companies Act) for financial auditing and legal record-keeping.'
    },
    {
     title:'6. User Rights & Data Control',
     text:`As a valued ${s.storeName} shopper, you maintain complete ownership and control over your personal data under Indian privacy laws:`,
     bullets:[
      'Right to Access & Review: You can inspect your profile, saved addresses, and past orders anytime via the My Account section.',
      'Right to Rectify: Easily update or correct your name, mobile number, and delivery locations.',
      `Right to Erasure / Deletion: You may request account deactivation and personal data deletion by contacting our privacy desk at ${s.email} or submitting a support ticket.`
     ],
     callout:{type:'green',text:`To exercise any data rights or submit inquiries regarding privacy, write to our Data Privacy Officer at ${s.email}. All requests are acknowledged within 48 hours.`}
    }
   ]
  },

  terms:{
   eyebrow:'TERMS OF SERVICE',
   title:'Terms & Conditions',
   intro:`Please read these Terms & Conditions carefully. By accessing, browsing, or purchasing products on ${s.storeName}, you agree to be bound by these Terms and all applicable laws and regulations of India.`,
   metaTags:['Last Revised: 1 October 2026',`Legal Entity: ${s.legalName}`,'Governing Law: India'],
   sections:[
    {
     title:'1. Account Eligibility & Responsibilities',
     text:`To register an account and place orders on ${s.storeName}, you must meet our eligibility criteria:`,
     bullets:[
      'Age Requirement: You must be at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872.',
      'Accurate Information: You agree to provide true, accurate, and current information, including a valid 10-digit mobile number and genuine delivery address.',
      'Account Security: You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.'
     ]
    },
    {
     title:'2. Order Placement & Contract Acceptance',
     text:'Placing an order on the platform constitutes an offer to purchase the selected items.',
     bullets:[
      'Order Acceptance: An order is confirmed when you receive an official order confirmation notification displaying your unique Order Number (e.g. GR...).',
      `Right to Refuse: ${s.storeName} reserves the right to decline or cancel orders in cases of stock unavailability, pricing errors, suspicious account activity, or unserviceable delivery locations.`
     ]
    },
    {
     title:'3. Pricing, Taxes & Discounts',
     text:'We are dedicated to transparent, honest grocery pricing with zero hidden surcharges.',
     bullets:[
      'Inclusive Pricing: All displayed prices are in Indian Rupees (₹ INR) and include all applicable Goods and Services Tax (GST).',
      'MRP vs. Selling Price: We clearly display both the manufacturer’s Maximum Retail Price (MRP) and our discounted Selling Price for complete clarity.',
      'Coupon Redemption: Promotional coupons and discounts must be applied prior to checkout. Coupons are subject to minimum order criteria and usage limits.'
     ]
    },
    {
     title:'4. Payment Terms & Cash on Delivery (COD)',
     text:`Currently, ${s.storeName} provides convenient Cash on Delivery (COD) as well as direct UPI handover payment options.`,
     bullets:[
      'Payment Handover: Payment is due immediately upon the physical arrival and handover of your grocery order.',
      'Cash & UPI Accepted: Delivery executives carry UPI QR codes for instantaneous contactless digital payment at your doorstep, as well as accept physical cash currency.',
      'Exact Change Encouraged: Please keep appropriate currency ready to ensure speedy delivery handover.'
     ]
    },
    {
     title:'5. Real-Time Stock & Inventory Management',
     text:`${s.storeName} operates a live, synchronous database inventory system linked directly to our store shelves.`,
     bullets:[
      'Instant Deduction: When an order is placed, stock quantities are deducted immediately in the backend to prevent overselling.',
      'Cancellation Stock Return: If an order is canceled, all item quantities are automatically restored to available inventory in real time.',
      'Out of Stock Guard: Items with zero stock cannot be added to cart or checked out.'
     ]
    },
    {
     title:'6. Platform Misuse & Account Suspension',
     text:`${s.storeName} reserves the right to suspend or terminate accounts that engage in fraudulent behavior, intentional non-acceptance of repeated COD deliveries, or abusive communication with delivery personnel.`
    },
    {
     title:'7. Governing Law & Dispute Resolution',
     text:`These Terms are governed by the laws of India. Any legal dispute arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Patna, Bihar.`
    }
   ]
  },

  refund:{
   eyebrow:'CUSTOMER SATISFACTION & RETURNS',
   title:'Return & Refund Policy',
   intro:`At ${s.storeName}, your complete satisfaction with the freshness and quality of your groceries is our top priority. If any item fails to meet your expectations, our hassle-free return and refund policy has you covered.`,
   metaTags:['6h Perishables Window','24h Packaged Goods','Instant Doorstep Handover Check'],
   sections:[
    {
     title:'1. Two-Tier Return Window by Product Category',
     text:'Because groceries contain diverse product categories with differing shelf lives, we maintain clear, fair return windows:',
     bullets:[
      '🥬 Perishable Items (6-Hour Window): Fresh fruits, leafy vegetables, dairy products, bakery goods, paneer, and eggs must be reported within 6 hours of delivery delivery handover.',
      '📦 Packaged Staples & FMCG (24-Hour Window): Atta, rice, pulses, cooking oils, snacks, packaged foods, and household essentials must be reported within 24 hours of delivery.'
     ],
     callout:{type:'green',text:'Inspect your groceries upon handover: If an item is visibly broken, leaking, or past its expiration date, hand it back to our delivery partner right away for an immediate adjustment.'}
    },
    {
     title:'2. Valid Return Grounds',
     text:'Returns and refunds are accepted under the following verified conditions:',
     bullets:[
      'Quality Concerns: Produce is spoiled, bruised, damaged, stale, or smells foul.',
      'Expiry Concerns: Packaged item has crossed or is within 24 hours of its best-before / expiration date.',
      'Damaged Packaging: Factory seal broken, bag torn, or container punctured during transit.',
      'Incorrect or Missing Item: You received a product different from what was shown in your order summary, or an item is absent from your delivered bag.'
     ]
    },
    {
     title:'3. Non-Returnable Goods',
     text:'Certain categories cannot be returned once delivered for food hygiene and personal safety reasons:',
     bullets:[
      'Perishable products reported after the 6-hour handover period.',
      'Items with broken seals or partially consumed contents, unless deemed defective from manufacturer.',
      'Personal hygiene, grooming, and sanitary supplies once outer protective film has been removed.'
     ]
    },
    {
     title:'4. Refund Modes & Timelines',
     text:'Refunds are processed promptly upon verification by our support team:',
     bullets:[
      'Instant In-App / UPI Reversal: For UPI or online transactions, refunds reflect in your bank account within 2 to 24 hours.',
      'COD Refund Assistance: For Cash on Delivery orders, refunds are credited directly to your registered UPI ID or provided bank account within 24 hours of approval.',
      'Transparent Status: Track your support ticket and refund progress directly from the My Orders or Support section.'
     ]
    }
   ]
  },

  cancellation:{
   eyebrow:'ORDER FLEXIBILITY & CANCELLATION',
   title:'Cancellation Policy',
   intro:`We understand that plans can change. ${s.storeName} provides a flexible cancellation window designed to accommodate your needs while respecting our fast packing and dispatch timelines.`,
   metaTags:['Zero Fee Before Dispatch','Doorstep Handover Inspection','Immediate Credit'],
   sections:[
    {
     title:'1. Cancellation Prior to Dispatch',
     text:'You may cancel your grocery order free of charge while it is in the "PENDING" or "CONFIRMED" stage:',
     bullets:[
      'Self-Service Cancel: Visit My Account → My Orders, open the active order, and tap "Cancel Order".',
      'Instant Stock Restoration: All items from your canceled order are returned to our store catalog instantly.',
      'Zero Penalty: No cancellation fee or deduction applies before the order leaves our dark-store.'
     ]
    },
    {
     title:'2. Cancellation Once Out for Delivery',
     text:'Once an order transitions to "OUT_FOR_DELIVERY", our delivery partner is actively in transit with fresh perishables:',
     bullets:[
      'Transit Cancellation: Self-service cancellation is disabled once the driver is en route to protect fresh food integrity.',
      'Emergency Cancellation: Contact our support helpline if you must cancel due to an emergency.',
      'Repeated Refusals: Repeated doorstep rejections without genuine defect may result in COD restriction on the customer account.'
     ]
    },
    {
     title:'3. Doorstep Handover Refusal',
     text:'You have the right to inspect your order bag at the time of doorstep handover. If any item is damaged, thawed, or leaking, you may refuse that specific item while accepting the remainder of your basket.'
    },
    {
     title:`4. Cancellation by ${s.storeName}`,
     text:`On rare occasions, ${s.storeName} may cancel an order due to unforeseen circumstances:`,
     bullets:[
      'Unforeseen Stock Shortage: If farm supply fails quality inspection prior to packing.',
      'Severe Weather / Road Inaccessibility: Heavy rains, flooding, or roadblocks that jeopardize delivery safety.',
      'Unreachable Customer: If customer cannot be reached at destination after 3 calls and 10 minutes waiting time.'
     ]
    }
   ]
  },

  delivery:{
   eyebrow:'LOGISTICS & FULFILLMENT',
   title:'Shipping & Delivery Policy',
   intro:`${s.storeName} operates a dedicated hyper-local fulfillment network delivering farm-fresh produce and daily grocery essentials straight to your doorstep in minutes.`,
   metaTags:[`Strict ${s.globalRadius || 5} km Service Radius`,`${s.estimatedDelivery || '15–30 Mins'} Instant Delivery`,'Scheduled Time Slots Available'],
   sections:[
    {
     title:`1. Hyper-Local ${s.globalRadius || 5} km Service Area`,
     text:`To guarantee maximum freshness and meet our ${s.estimatedDelivery || '15–30 minute'} speed commitment, ${s.storeName} operates within a strict ${s.globalRadius || 5} km radius from our local fulfillment hubs.`,
     bullets:[
      `Coverage Zones: Currently servicing ${s.fulfillmentHub}. Check your delivery address at checkout to confirm serviceability.`,
      `Why ${s.globalRadius || 5} km? Keeping our delivery radius within ${s.globalRadius || 5} kilometers ensures fresh dairy, leafy greens, and produce spend minimal time on the road, arriving chilled and fresh.`
     ],
     callout:{type:'green',text:`We do not service addresses outside our active ${s.globalRadius || 5} km boundary. Enter your locality during address creation to see live delivery availability.`}
    },
    {
     title:'2. Delivery Options & Estimates',
     text:'We offer two flexible delivery modes tailored to your daily schedule:',
     bullets:[
      `⚡ Instant Delivery: Handpicked, packed, and delivered to your door in ${s.estimatedDelivery || '15 to 30 minutes'} from the moment of order confirmation.`,
      '📅 Scheduled Delivery: Choose any future delivery date (up to 3 days in advance) and select a convenient 3-hour time slot (e.g. 07:00 AM – 10:00 AM, 10:00 AM – 01:00 PM, 01:00 PM – 04:00 PM, 04:00 PM – 07:00 PM, 07:00 PM – 10:00 PM).'
     ]
    },
    {
     title:'3. Delivery Fees & Free Delivery Threshold',
     text:'Our delivery pricing is transparent and affordable:',
     bullets:[
      Number(s.freeDeliveryThreshold) > 0
        ? `Free Delivery: Orders with a cart value meeting our free delivery threshold (₹${s.freeDeliveryThreshold} and above) are delivered completely FREE.`
        : 'Free Delivery: All orders qualify for completely FREE delivery.',
      `Standard Delivery Fee: A nominal delivery fee of ₹${s.deliveryFee} applies to orders below the free delivery threshold. Minimum order value is ₹${s.minimumOrder}.`,
      'Zero Surge Pricing: We do not charge surge fees, rain fees, or peak-hour convenience surcharges.'
     ],
     callout:{
      type:'green',
      text:`Live Store Rates: Free Delivery on orders ₹${s.freeDeliveryThreshold}+ | Standard Delivery Fee: ₹${s.deliveryFee} | Minimum Order Value: ₹${s.minimumOrder}`
     }
    },
    {
     title:'4. Failed Delivery & Customer Unreachability',
     text:'To ensure fair operations for our delivery partners, please adhere to our handover guidelines:',
     bullets:[
      'Contact Protocol: Upon reaching your address, our delivery executive will attempt to contact you via phone call up to 3 times.',
      'Waiting Period: The maximum waiting window at your delivery location is 10 minutes.',
      'Unreachable Orders: If the customer remains unreachable or premises are inaccessible after 10 minutes, the order will be returned to the store. Re-delivery may incur an additional delivery charge.'
     ]
    }
   ]
  },

  grievance:{
   eyebrow:'CONSUMER PROTECTION & REDRESSAL',
   title:'Grievance Redressal Policy',
   intro:`In compliance with the Information Technology Act, 2000, the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020, ${s.storeName} has established a dedicated, transparent mechanism to address and resolve consumer complaints efficiently.`,
   metaTags:['Statutory Compliance','Acknowledgment: Within 48 Hours','Resolution: Within 15 Working Days'],
   sections:[
    {
     title:'1. Two-Tier Grievance Mechanism',
     text:'We provide a structured, escalating resolution procedure to ensure every customer concern is resolved fairly and promptly.'
    },
    {
     title:'2. Tier 1: Customer Support Helpdesk',
     text:'For day-to-day inquiries, order queries, product quality concerns, or delivery status, please contact our Level 1 support team first:',
     bullets:[
      'In-App Support Ticket: Submit an issue directly from the Help & Support page on our website.',
      `Support Email: ${s.email}`,
      `Helpline Number: ${s.phone} (Available ${s.hours})`,
      'Response Time: Most tickets are resolved within 2 to 4 hours.'
     ]
    },
    {
     title:'3. Tier 2: Grievance Redressal Officer Escalation',
     text:'If your complaint has not been addressed satisfactorily at Tier 1, or for statutory legal, privacy, and consumer protection grievances, you may escalate directly to our designated Grievance Officer.',
     callout:{type:'blue',text:'Statutory Timelines: The Grievance Officer will acknowledge your complaint within 48 hours of receipt and redresses the grievance within 15 working days.'}
    }
   ]
  },

  contact:{
   eyebrow:'CUSTOMER ASSISTANCE & OFFICES',
   title:'Contact Us',
   intro:`Have questions about your order, want to partner with us, or have feedback? The ${s.storeName} team is here to assist you 7 days a week.`,
   metaTags:[`Entity: ${s.legalName}`,`Support: ${s.hours}`,`Email: ${s.email}`],
   sections:[
    {
     title:'1. Registered & Operational Office',
     text:`${s.legalName} operates dedicated fulfillment hubs delivering fresh groceries across ${s.fulfillmentHub}.`,
     bullets:[
      `Corporate Legal Entity: ${s.legalName}`,
      `Brand Name: ${s.storeName}`,
      `Registered Office: ${s.address}`,
      `Fulfillment Hubs: ${s.fulfillmentHub}`
     ]
    },
    {
     title:'2. Official Communication Channels',
     text:'Reach us through any of our dedicated communication channels below:',
     bullets:[
      `Customer Care Email: ${s.email}`,
      `Grievance Redressal Email: ${s.grievanceEmail}`,
      `Customer Support Helpline: ${s.phone}`,
      `Working Hours: ${s.hours}`
     ]
    }
   ]
  },

  cookies:{
   eyebrow:'TRANSPARENCY & TRACKING',
   title:'Cookie Policy',
   intro:`This Cookie Policy explains how ${s.storeName} uses cookies and browser storage technologies when you use our website. We believe in minimal, purposeful data storage with zero invasive cross-site ad tracking.`,
   metaTags:['Zero Cross-Site Ad Trackers','Essential Session Storage','Full User Control'],
   sections:[
    {
     title:'1. What Are Cookies & Local Storage?',
     text:'Cookies and local browser storage are small text elements stored securely in your web browser. They allow our website to remember your session, keep items in your shopping basket, and present local stock for your neighborhood.'
    },
    {
     title:'2. Essential Cookies (Strictly Necessary)',
     text:`These cookies and storage keys are fundamental to the operation of ${s.storeName} and cannot be disabled without breaking website functionality:`,
     bullets:[
      'Authentication Token (r2cart-access-token): Securely stores your encrypted login session so you stay signed in.',
      'Shopping Basket Cache: Remembers products added to your cart even if you refresh or switch pages.',
      'Service Locality Preference: Stores your chosen delivery address locality so product pricing and live stock correspond to your area.',
      'Security & CSRF Tokens: Protect against automated cross-site forgery attacks.'
     ]
    },
    {
     title:'3. Performance & Diagnostic Analytics',
     text:'We use lightweight, privacy-focused diagnostic telemetry to understand page load times, detect broken links, and optimize product search speed. All diagnostic data is aggregated, anonymized, and never connected to personal banking or identification data.'
    },
    {
     title:'4. Third-Party Advertising & Trackers',
     text:`${s.storeName} does NOT utilize third-party advertising tracking pixels, cross-device behavioral tracking cookies, or sell customer browsing activities to advertising brokerages.`
    },
    {
     title:'5. Managing & Disabling Cookies',
     text:`You can easily manage, clear, or block cookies through your browser settings (Chrome, Safari, Firefox, Edge). Please note that disabling essential cookies will prevent you from logging in and placing orders on ${s.storeName}.`
    }
   ]
  },

  about:{
   eyebrow:`ABOUT ${s.storeName.toUpperCase()}`,
   title:'Daily Needs, Delivered Fresh.',
   intro:`${s.storeName} was founded with a clear purpose: to bridge the gap between quality farm produce and Indian households with dependable 15–30 minute doorstep delivery, fair pricing, and uncompromising freshness.`,
   metaTags:['Hyper-Local Delivery','Farm Fresh Quality','Zero Food Waste Initiative'],
   sections:[
    {
     title:'1. Our Story & Purpose',
     text:`Grocery shopping shouldn’t require long supermarket queues, dealing with wilting produce, or waiting hours for a delivery van. ${s.storeName} brings neighborhood dark-stores within 5 km of residential clusters to deliver crisp vegetables, farm eggs, daily milk, and pantry staples in minutes.`
    },
    {
     title:`2. The 5 Pillars of ${s.storeName}`,
     text:'Every decision we make is guided by five foundational commitments to our customers:',
     bullets:[
      '🌱 Freshness First: Direct morning sourcing from verified regional farmers and certified suppliers. Crisp greens and fresh dairy every single day.',
      '⚡ 15–30 Minute Speed: Hyper-local delivery within a strict 5 km radius ensures groceries reach your kitchen without unnecessary delay.',
      '💰 Honest & Fair Value: Clear MRP and discounted selling prices with no artificial markups or hidden surcharges.',
      '🔍 Multi-Point Quality Checks: Every product batch is inspected for freshness, tamper-proof packaging, and valid expiry dates before packing.',
      '🤝 Customer-First Guarantee: Hassle-free 6-hour perishables window with instant refunds if anything is not up to standard.'
     ]
    },
    {
     title:'3. Technology & Sustainability',
     text:'By optimizing our delivery radius to 5 km, we minimize transit fuel emissions, utilize energy-efficient cold storage, and implement intelligent inventory planning to achieve near-zero food wastage across our fulfillment hubs.'
    }
   ]
  }
 };
}

export function StaticPage({type}){
 const {notify,storeSettings,refreshDelivery,user}=useApp();
 const [contactForm,setContactForm]=useState({name:user?.name||'',email:user?.email||'',phone:user?.mobile||'',subject:'',message:''});
 const [sending,setSending]=useState(false);

 useEffect(()=>{
  if(!storeSettings && refreshDelivery){
   refreshDelivery();
  }
 },[storeSettings,refreshDelivery]);

 useEffect(()=>{
  if(user?.name||user?.email||user?.mobile){
   setContactForm(prev=>({
    ...prev,
    name:prev.name||user.name||'',
    email:prev.email||user.email||'',
    phone:prev.phone||user.mobile||''
   }));
  }
 },[user?.name,user?.email,user?.mobile]);

 const formatTime=t=>{
  if(!t)return '';
  const [h,m]=t.split(':').map(Number);
  if(isNaN(h))return t;
  const ampm=h>=12?'PM':'AM';
  const h12=h%12||12;
  return `${String(h12).padStart(2,'0')}:${String(m||0).padStart(2,'0')} ${ampm}`;
 };

 const formattedHours=(storeSettings?.openingTime&&storeSettings?.closingTime)
  ?`${formatTime(storeSettings.openingTime)} – ${formatTime(storeSettings.closingTime)} IST (Daily)`
  :null;

 const storeName=storeSettings?.storeName?.trim()||BRAND.name;
 const legalName=storeSettings?.policies?.legalName?.trim()||`${storeName} Retail Pvt. Ltd.`;
 const phone=storeSettings?.policies?.supportPhone?.trim()||storeSettings?.contactNumber?.trim()||BRAND.phone||'+91 80000 10001';
 const email=storeSettings?.policies?.supportEmail?.trim()||storeSettings?.email?.trim()||BRAND.email||'support@r2cart.in';
 const hours=storeSettings?.policies?.supportHours?.trim()||formattedHours||'07:00 AM – 11:00 PM IST (Daily)';
 const address=storeSettings?.policies?.officeAddress?.trim()||storeSettings?.address?.trim()||BRAND.address||'Bailey Road, Patna, Bihar — 800001, India';
 const fulfillmentHub=storeSettings?.policies?.fulfillmentHub?.trim()||(address?`${storeName} Hub (${address.split(',')[0]})`:`${storeName} Central Hub`);

 const grievanceEmail=storeSettings?.policies?.grievanceOfficerEmail?.trim()||email;
 const grievancePhone=storeSettings?.policies?.grievanceOfficerPhone?.trim()||phone;
 const grievanceName=storeSettings?.policies?.grievanceOfficerName?.trim()||'Grievance Redressal Officer';
 const grievanceRole=storeSettings?.policies?.grievanceOfficerRole?.trim()||'Operations & Grievance Lead';
 const grievanceAddress=storeSettings?.policies?.grievanceOfficerAddress?.trim()||address;

 const storeInfo={
  storeName,
  legalName,
  phone,
  email,
  hours,
  address,
  fulfillmentHub,
  grievanceName,
  grievanceRole,
  grievanceEmail,
  grievancePhone,
  grievanceAddress,
  deliveryFee:storeSettings?.deliveryFee != null ? Number(storeSettings.deliveryFee) : 30,
  freeDeliveryThreshold:storeSettings?.freeDeliveryThreshold != null ? Number(storeSettings.freeDeliveryThreshold) : 499,
  minimumOrder:storeSettings?.minimumOrder != null ? Number(storeSettings.minimumOrder) : 150,
  globalRadius:storeSettings?.globalDeliveryRadius != null ? Number(storeSettings.globalDeliveryRadius) : 5.0,
  estimatedDelivery:storeSettings?.estimatedDelivery || '15–30 minutes',
 };

 const allPolicies=getPolicyContent(storeInfo);
 const base=allPolicies[type]||allPolicies.about;
 const custom=storeSettings?.policies?.customPages?.[type]||{};

 const interpolate=text=>{
  if(typeof text!=='string')return text;
  return text
   .replace(/{storeName}/g,storeInfo.storeName)
   .replace(/{legalName}/g,storeInfo.legalName)
   .replace(/{email}/g,storeInfo.email)
   .replace(/{phone}/g,storeInfo.phone)
   .replace(/{hours}/g,storeInfo.hours)
   .replace(/{address}/g,storeInfo.address)
   .replace(/{fulfillmentHub}/g,storeInfo.fulfillmentHub);
 };

 const customMetaList = custom.metaTags !== undefined && custom.metaTags !== null && custom.metaTags !== ''
  ? (Array.isArray(custom.metaTags) ? custom.metaTags : String(custom.metaTags).split(',').map(s => s.trim()).filter(Boolean))
  : null;

 const resolvedSections = (Array.isArray(custom.sections) && custom.sections.length > 0)
  ? custom.sections.map(sec => ({
      title: interpolate(sec.title || ''),
      text: interpolate(sec.text || ''),
      bullets: Array.isArray(sec.bullets)
        ? sec.bullets.map(interpolate).filter(Boolean)
        : (typeof sec.bullets === 'string' ? sec.bullets.split('\n').map(s => interpolate(s.trim())).filter(Boolean) : undefined),
      callout: sec.callout ? { ...sec.callout, text: interpolate(sec.callout.text || '') } : undefined
    }))
  : (base.sections || []);

 const content={
  eyebrow:custom.eyebrow ? interpolate(custom.eyebrow) : base.eyebrow,
  title:custom.title ? interpolate(custom.title) : base.title,
  intro:custom.intro ? interpolate(custom.intro) : base.intro,
  metaTags:customMetaList ? customMetaList.map(interpolate) : (base.metaTags || []),
  customText:custom.customText ? interpolate(custom.customText) : '',
  sections:resolvedSections
 };

 const handleContactSubmit=async e=>{
  e.preventDefault();
  setSending(true);
  try{
   const res=await catalogService.sendContactMessage(contactForm);
   const ticketNo=res?.ticketNumber||'';
   notify(ticketNo?`Message sent! Support Ticket #${ticketNo} created. We will get back to you shortly.`:'Thank you! Your message has been sent successfully.');
   setContactForm({name:user?.name||'',email:user?.email||'',phone:user?.mobile||'',subject:'',message:''});
  }catch(error){
   notify(error.message||'Failed to send message. Please try again.','error');
  }finally{
   setSending(false);
  }
 };

 return (
  <div className="policy-page-wrap">
   {/* Quick Policy Navigation Strip */}
   <div className="policy-nav-strip">
    <div className="container">
     <nav className="policy-nav-scroll" aria-label="Policies Navigation">
      {policyNav.map(item=>{
       const Icon=item.icon;
       const isActive=item.type===type;
       return (
        <Link key={item.type} to={item.path} className={`policy-nav-pill ${isActive?'active':''}`}>
         <Icon size={14}/>
         <span>{item.label}</span>
        </Link>
       );
      })}
     </nav>
    </div>
   </div>

   <div className="container">
    {/* Hero Banner */}
    <div className="policy-hero-card">
     <span className="policy-eyebrow">
      <Building2 size={13}/> {content.eyebrow}
     </span>
     <h1>{content.title}</h1>
     <p>{content.intro}</p>
     {content.metaTags&&(
      <div className="policy-meta-tags">
       {content.metaTags.map((tag,index)=>(
        <span key={index} className="policy-meta-tag">
         <CheckCircle2 size={12}/> {tag}
        </span>
       ))}
      </div>
     )}
    </div>

    {/* Grievance Officer Highlight Card on Grievance Page */}
    {type==='grievance'&&(
     <div className="officer-card">
      <div className="officer-avatar">{storeInfo.grievanceName.split(' ').map(x=>x[0]).filter(Boolean).slice(0,2).join('')||'GR'}</div>
      <div className="officer-details">
       <span className="badge badge-green" style={{width:'fit-content'}}>Designated Statutory Officer</span>
       <b>{storeInfo.grievanceName}</b>
       <span>{storeInfo.grievanceRole}</span>
       <span>{storeInfo.legalName} · {storeInfo.address}</span>
       <div className="officer-contact-row">
        <span>Email: <a href={`mailto:${storeInfo.grievanceEmail}`}>{storeInfo.grievanceEmail}</a> (CC: <a href={`mailto:${storeInfo.email}`}>{storeInfo.email}</a>)</span>
        <span>·</span>
        <span>Phone: <a href={`tel:${storeInfo.grievancePhone}`}>{storeInfo.grievancePhone}</a></span>
       </div>
      </div>
     </div>
    )}

    {/* Contact Cards on Contact Page */}
    {type==='contact'&&(
     <div className="contact-grid-cards">
      <div className="contact-info-card">
       <div className="contact-icon-bubble"><Phone size={22}/></div>
       <h3>Customer Helpline</h3>
       <a href={`tel:${storeInfo.phone}`} className="contact-main-link">{storeInfo.phone}</a>
       <p className="contact-timing-pill">{storeInfo.hours}</p>
      </div>
      <div className="contact-info-card">
       <div className="contact-icon-bubble"><Mail size={22}/></div>
       <h3>Official Support Email</h3>
       <a href={`mailto:${storeInfo.email}`} className="contact-main-link">{storeInfo.email}</a>
       <p className="contact-sub-text">Standard response within 2–4 hours</p>
      </div>
      <div className="contact-info-card">
       <div className="contact-icon-bubble"><MapPin size={22}/></div>
       <h3>Registered Office</h3>
       <b style={{fontSize:'14px',color:'var(--ink)'}}>{storeInfo.legalName}</b>
       <p className="contact-sub-text">{storeInfo.address}</p>
      </div>
     </div>
    )}

    {/* Custom Policy Notice Card if Admin Added Specific Clauses */}
    {content.customText&&(
     <article className="policy-card custom-policy-card" style={{marginTop:'22px'}}>
      <div className="policy-card-head">
       <span className="policy-num">★</span>
       <h2>{type==='contact'?'Customer Support Notice':'Official Store Policy Notice & Terms'}</h2>
      </div>
      <div className="policy-card-body">
       <p style={{whiteSpace:'pre-line',margin:0,fontSize:'14px',lineHeight:'1.7'}}>{content.customText}</p>
      </div>
     </article>
    )}

    {/* Policy Structured Sections */}
    <div className="policy-layout">
     {content.sections.map((sec,i)=>(
      <article className="policy-card" key={i}>
       <div className="policy-card-head">
        <span className="policy-num">{String(i+1).padStart(2,'0')}</span>
        <h2>{sec.title}</h2>
       </div>
       <div className="policy-card-body">
        <p>{sec.text}</p>
        {sec.bullets&&(
         <ul className="policy-bullets">
          {sec.bullets.map((b,bIdx)=>(
           <li key={bIdx}>
            <span className="policy-bullet-dot"/>
            <span>{b}</span>
           </li>
          ))}
         </ul>
        )}
        {sec.callout&&(
         <div className={`policy-callout ${sec.callout.type||''}`}>
          <div className="row gap" style={{alignItems:'flex-start'}}>
           <Info size={16} style={{flexShrink:0,marginTop:2}}/>
           <span>{sec.callout.text}</span>
          </div>
         </div>
        )}
       </div>
      </article>
     ))}
    </div>

    {/* Interactive Message Form on Contact Page */}
    {type==='contact'&&(
     <div className="contact-form-card">
      <div className="contact-form-header">
       <span className="contact-form-badge">
        <Send size={13}/> Direct Customer Desk
       </span>
       <h2>Send Us a Message</h2>
       <p className="contact-form-subtitle">Have an inquiry, feedback, or need help with an order? Send a message and our support team will respond within 2 to 4 hours.</p>
      </div>
      <form onSubmit={handleContactSubmit} className="contact-form-element">
       <div className="contact-form-grid">
        <div className="contact-field-group">
         <label htmlFor="contact-name" className="contact-field-label">
          <span>Full Name</span> <i className="required-star">*</i>
         </label>
         <input
          id="contact-name"
          required
          placeholder="e.g. Rahul Sharma"
          value={contactForm.name}
          onChange={e=>setContactForm(prev=>({...prev,name:e.target.value}))}
         />
        </div>
        <div className="contact-field-group">
         <label htmlFor="contact-phone" className="contact-field-label">
          <span>Mobile Number</span> <i className="required-star">*</i>
         </label>
         <input
          id="contact-phone"
          required
          type="tel"
          placeholder="e.g. 9876543210"
          value={contactForm.phone}
          onChange={e=>setContactForm(prev=>({...prev,phone:e.target.value}))}
         />
        </div>
       </div>
       <div className="contact-field-group">
        <label htmlFor="contact-email" className="contact-field-label">
         <span>Email Address</span> <i className="required-star">*</i>
        </label>
        <input
         id="contact-email"
         required
         type="email"
         placeholder="name@example.com"
         value={contactForm.email}
         onChange={e=>setContactForm(prev=>({...prev,email:e.target.value}))}
        />
       </div>
       <div className="contact-field-group">
        <label htmlFor="contact-subject" className="contact-field-label">
         <span>Subject</span> <i className="required-star">*</i>
        </label>
        <input
         id="contact-subject"
         required
         placeholder="e.g. Inquiry regarding order, service area, or product request"
         value={contactForm.subject}
         onChange={e=>setContactForm(prev=>({...prev,subject:e.target.value}))}
        />
       </div>
       <div className="contact-field-group">
        <label htmlFor="contact-message" className="contact-field-label">
         <span>Your Message</span> <i className="required-star">*</i>
        </label>
        <textarea
         id="contact-message"
         required
         placeholder="Describe your inquiry, order ID (if any), or feedback in detail…"
         value={contactForm.message}
         onChange={e=>setContactForm(prev=>({...prev,message:e.target.value}))}
        />
       </div>
       <div className="contact-submit-row">
        <div className="contact-security-note">
         <Shield size={14}/>
         <span>Your contact details are encrypted and kept confidential.</span>
        </div>
        <Button disabled={sending} type="submit" style={{minWidth:'200px',height:'48px'}}>
         {sending?'Sending message…':<><Send size={16}/> Send Message</>}
        </Button>
       </div>
      </form>
     </div>
    )}
   </div>
  </div>
 );
}
