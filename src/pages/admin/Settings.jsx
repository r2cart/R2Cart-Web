import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {
 BellRing,Building2,Clock3,Eye,EyeOff,FileText,Image as ImageIcon,
 KeyRound,LoaderCircle,RefreshCcw,Save,ShieldCheck,Store,Trash2,
 Upload,ExternalLink,RotateCcw,Truck,XCircle,AlertCircle,Cookie,Phone,CheckCircle2,
 LayoutTemplate,ArrowUp,ArrowDown,Sliders,Sparkles,Layers,Grid,ShoppingBag,
 Tag,Check,MoveUp,MoveDown,Info,ShieldAlert,AlertOctagon,CalendarClock,Plus,
 Smartphone,Search,ChevronDown,ChevronUp,SlidersHorizontal,Flame,Star,HelpCircle,Crown,Medal,Award
} from 'lucide-react';
import {Button} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import {mediaUrl} from '../../utils/media';
import {policyNav,getPolicyContent} from '../customer/StaticPage';
import {BRAND} from '../../config/brand';
import {defaultHomeSections,defaultHomeLayout,normalizeHomeLayout} from '../../config/homeLayout';
import {EmergencyPauseManager} from '../../components/admin/EmergencyPauseManager';

const defaultPolicies={
 legalName:'R2Cart Retail Pvt. Ltd.',
 supportPhone:'+91 80000 10001',
 supportEmail:'support@r2cart.in',
 supportHours:'07:00 AM – 11:00 PM IST (Daily)',
 officeAddress:'Bailey Road, Patna, Bihar — 800001, India',
 fulfillmentHub:'Hathua Service Zone & Patna Central Hub',
 grievanceOfficerName:'Mr. Nadeem Ahmad',
 grievanceOfficerRole:'Grievance Redressal Officer & Operations Lead',
 grievanceOfficerEmail:'grievance@r2cart.in',
 grievanceOfficerPhone:'+91 80000 10001',
 grievanceOfficerAddress:'Bailey Road, Patna, Bihar — 800001, India',
 customPages:{
  privacy:{
   title:'Privacy Policy',
   eyebrow:'LEGAL & DATA PRIVACY',
   intro:'At R2Cart, we are committed to safeguarding your personal information and handling your data with transparency, integrity, and strict legal compliance in accordance with the Information Technology Act, 2000 and Digital Personal Data Protection (DPDP) Act, 2023.',
   metaTags:'Effective Date: 1 October 2026, Entity: R2Cart Retail Pvt. Ltd., Jurisdiction: India',
   customText:''
  },
  terms:{
   title:'Terms & Conditions',
   eyebrow:'TERMS OF SERVICE',
   intro:'Please read these Terms & Conditions carefully. By accessing, browsing, or purchasing products on R2Cart, you agree to be bound by these Terms and all applicable laws and regulations of India.',
   metaTags:'Last Revised: 1 October 2026, Legal Entity: R2Cart Retail Pvt. Ltd., Governing Law: India',
   customText:''
  },
  refund:{
   title:'Return & Refund Policy',
   eyebrow:'CUSTOMER SATISFACTION & RETURNS',
   intro:'At R2Cart, your complete satisfaction with the freshness and quality of your groceries is our top priority. If any item fails to meet your expectations, our hassle-free return and refund policy has you covered.',
   metaTags:'6h Perishables Window, 24h Packaged Goods, Instant Doorstep Handover Check',
   customText:''
  },
  cancellation:{
   title:'Cancellation Policy',
   eyebrow:'ORDER FLEXIBILITY & CANCELLATION',
   intro:'We understand that plans can change. R2Cart provides a flexible cancellation window designed to accommodate your needs while respecting our fast packing and dispatch timelines.',
   metaTags:'Zero Fee Before Dispatch, Doorstep Handover Inspection, Immediate Credit',
   customText:''
  },
  delivery:{
   title:'Shipping & Delivery Policy',
   eyebrow:'LOGISTICS & FULFILLMENT',
   intro:'R2Cart operates a dedicated hyper-local fulfillment network delivering farm-fresh produce and daily grocery essentials straight to your doorstep in minutes.',
   metaTags:'Strict 5 km Service Radius, 15–30 Mins Instant Delivery, Scheduled Time Slots Available',
   customText:''
  },
  grievance:{
   title:'Grievance Redressal Policy',
   eyebrow:'CONSUMER PROTECTION & REDRESSAL',
   intro:'In compliance with the Information Technology Act, 2000, the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020, R2Cart has established a dedicated, transparent mechanism to address and resolve consumer complaints efficiently.',
   metaTags:'Statutory Compliance, Acknowledgment: Within 48 Hours, Resolution: Within 15 Working Days',
   customText:''
  },
  contact:{
   title:'Contact Us',
   eyebrow:'CUSTOMER ASSISTANCE & OFFICES',
   intro:'Have questions about your order, want to partner with us, or have feedback? Our team is here to assist you 7 days a week.',
   metaTags:'',
   customText:''
  },
  cookies:{
   title:'Cookie Policy',
   eyebrow:'TRANSPARENCY & TRACKING',
   intro:'This Cookie Policy explains how R2Cart uses cookies and browser storage technologies when you use our website. We believe in minimal, purposeful data storage with zero invasive cross-site ad tracking.',
   metaTags:'Zero Cross-Site Ad Trackers, Essential Session Storage, Full User Control',
   customText:''
  },
  about:{
   title:'Daily Needs, Delivered Fresh.',
   eyebrow:'ABOUT R2CART',
   intro:'R2Cart was founded with a clear purpose: to bridge the gap between quality farm produce and Indian households with dependable 15–30 minute doorstep delivery, fair pricing, and uncompromising freshness.',
   metaTags:'Hyper-Local Delivery, Farm Fresh Quality, Zero Food Waste Initiative',
   customText:''
  }
 },
 homeLayout:defaultHomeLayout
};

const blank={
 storeName:'',
 logo:'',
 contactNumber:'',
 email:'',
 address:'',
 openingTime:'',
 closingTime:'',
 currency:'INR',
 minimumOrder:150,
 deliveryFee:30,
 freeDeliveryThreshold:499,
 estimatedDelivery:'15–30 minutes',
 globalDeliveryRadius:5.0,
 notifications:{orders:false,stock:false,customers:false},
 policies:defaultPolicies
};

const normalize=value=>{
 const rawPol=value?.policies&&typeof value.policies==='object'?value.policies:{};
 const rawCustom=rawPol.customPages&&typeof rawPol.customPages==='object'?rawPol.customPages:{};
 const rawLayout=rawPol.homeLayout&&typeof rawPol.homeLayout==='object'?rawPol.homeLayout:{};
 return {
  ...blank,
  ...value,
  logo:mediaUrl(value?.logo||''),
  minimumOrder:value?.minimumOrder!=null?value.minimumOrder:150,
  deliveryFee:value?.deliveryFee!=null?value.deliveryFee:30,
  freeDeliveryThreshold:value?.freeDeliveryThreshold!=null?value.freeDeliveryThreshold:499,
  estimatedDelivery:value?.estimatedDelivery||'15–30 minutes',
  globalDeliveryRadius:value?.globalDeliveryRadius!=null?Number(value.globalDeliveryRadius):5.0,
  notifications:{...blank.notifications,...(value?.notifications||{})},
  policies:{
   ...defaultPolicies,
   ...rawPol,
   legalName:rawPol.legalName||(value?.storeName?`${value.storeName} Retail Pvt. Ltd.`:defaultPolicies.legalName),
   supportPhone:rawPol.supportPhone||value?.contactNumber||defaultPolicies.supportPhone,
   supportEmail:rawPol.supportEmail||value?.email||defaultPolicies.supportEmail,
   supportHours:rawPol.supportHours||(value?.openingTime&&value?.closingTime?`${value.openingTime} – ${value.closingTime} IST (Daily)`:defaultPolicies.supportHours),
   officeAddress:rawPol.officeAddress||value?.address||defaultPolicies.officeAddress,
   fulfillmentHub:rawPol.fulfillmentHub||(value?.storeName?`${value.storeName} Central Hub`:defaultPolicies.fulfillmentHub),
   grievanceOfficerName:rawPol.grievanceOfficerName||defaultPolicies.grievanceOfficerName,
   grievanceOfficerRole:rawPol.grievanceOfficerRole||defaultPolicies.grievanceOfficerRole,
   grievanceEmail:rawPol.grievanceOfficerEmail||value?.email||defaultPolicies.grievanceOfficerEmail,
   grievancePhone:rawPol.grievanceOfficerPhone||value?.contactNumber||defaultPolicies.grievanceOfficerPhone,
   grievanceOfficerAddress:rawPol.grievanceOfficerAddress||value?.address||defaultPolicies.grievanceOfficerAddress,
   customPages:policyNav.reduce((acc,item)=>{
    const pKey=item.type;
    const rawPage=rawCustom[pKey]||{};
    const fallbackTemplate=getPolicyContent({
     storeName:value?.storeName||BRAND.name,
     legalName:rawPol.legalName||(value?.storeName?`${value.storeName} Retail Pvt. Ltd.`:defaultPolicies.legalName),
     email:value?.email||defaultPolicies.supportEmail,
     phone:value?.contactNumber||defaultPolicies.supportPhone,
     hours:rawPol.supportHours||defaultPolicies.supportHours,
     address:value?.address||defaultPolicies.officeAddress,
     fulfillmentHub:rawPol.fulfillmentHub||defaultPolicies.fulfillmentHub,
     grievanceName:rawPol.grievanceOfficerName||defaultPolicies.grievanceOfficerName,
     grievanceRole:rawPol.grievanceOfficerRole||defaultPolicies.grievanceOfficerRole,
     grievanceEmail:rawPol.grievanceOfficerEmail||defaultPolicies.grievanceOfficerEmail,
     grievancePhone:rawPol.grievanceOfficerPhone||defaultPolicies.grievanceOfficerPhone,
     grievanceAddress:rawPol.grievanceOfficerAddress||defaultPolicies.grievanceOfficerAddress
    })[pKey]||{};

    acc[pKey]={
     title:rawPage.title||defaultPolicies.customPages[pKey]?.title||fallbackTemplate.title||'',
     eyebrow:rawPage.eyebrow||defaultPolicies.customPages[pKey]?.eyebrow||fallbackTemplate.eyebrow||'',
     intro:rawPage.intro||defaultPolicies.customPages[pKey]?.intro||fallbackTemplate.intro||'',
     metaTags:rawPage.metaTags!==undefined
      ?(Array.isArray(rawPage.metaTags)?rawPage.metaTags.join(', '):rawPage.metaTags)
      :(defaultPolicies.customPages[pKey]?.metaTags||(Array.isArray(fallbackTemplate.metaTags)?fallbackTemplate.metaTags.join(', '):'')),
     customText:rawPage.customText||'',
     sections:Array.isArray(rawPage.sections)&&rawPage.sections.length>0
      ?rawPage.sections
      :(fallbackTemplate.sections?JSON.parse(JSON.stringify(fallbackTemplate.sections)):[])
    };
    return acc;
   },{}),
   homeLayout:normalizeHomeLayout(rawLayout)
  }
 };
};

const Field=({label,hint,...props})=><label><span>{label}</span><input {...props}/>{hint&&<small>{hint}</small>}</label>;
const PasswordField=({label,hint,show,onToggle,...props})=><label><span>{label}</span><div style={{position:'relative',display:'flex',alignItems:'center'}}><input {...props} type={show?'text':'password'} style={{width:'100%',paddingRight:'2.5rem'}}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={onToggle} style={{position:'absolute',right:'0.75rem',background:'none',border:'none',cursor:'pointer',padding:'0.25rem',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{hint&&<small>{hint}</small>}</label>;
const SectionTitle=({icon:Icon,title,text})=><div className="settings-section-title"><i><Icon/></i><div><h3>{title}</h3><p>{text}</p></div></div>;

const SECTION_META = {
 heroBanners: {
  icon: '🎠',
  badge: 'Hero Slider',
  concept: 'Full-width visual banners with action buttons rotating at the top of the customer homepage.',
  customerLabel: 'Top Hero Banners Carousel'
 },
 campaignOffers: {
  icon: '🏷️',
  badge: 'Offers Rail',
  concept: 'Horizontal card rail highlighting discounts, coupons, and seasonal campaigns ("Offers picked for you").',
  customerLabel: 'Offers Picked For You Rail'
 },
 shopCategories: {
  icon: '🗂️',
  badge: 'Category Grid',
  concept: 'Circular category icons and capsules (Fruits, Dairy, Snacks) allowing fast catalog browsing.',
  customerLabel: 'Shop by Category Grid'
 },
 recommended: {
  icon: '💡',
  badge: 'Personalized',
  concept: 'Personalized product recommendations dynamically tailored to customer browsing and buying history.',
  customerLabel: 'Recommended For You'
 },
 bestSellers: {
  icon: '🔥',
  badge: 'Top Sellers',
  concept: 'Trending high-volume grocery essentials and customer favorites with fast turnaround.',
  customerLabel: 'Best Sellers Product Rail'
 },
 topPicks: {
  icon: '⭐',
  badge: 'Curated Picks',
  concept: 'Staff-selected premium and high-margin products featured for quick conversion.',
  customerLabel: 'Top Picks Product Rail'
 },
 promoStrip: {
  icon: '🎁',
  badge: 'Promo Banner',
  concept: 'High-contrast promotional strip ("Stock up. Save more") directing shoppers to deals and coupons.',
  customerLabel: 'Savings Promo Banner'
 },
 categoryRails: {
  icon: '📦',
  badge: 'Category Shelves',
  concept: 'Dedicated product aisles grouped per category (Vegetables, Dairy & Beverages rails).',
  customerLabel: 'Category Product Rails'
 },
 specialOffers: {
  icon: '⚡',
  badge: 'Special Deals',
  concept: 'Deeply discounted products, clearance specials, and limited-time price drops.',
  customerLabel: 'Special Offers Rail'
 },
 recentlyViewed: {
  icon: '🕒',
  badge: 'Browsing History',
  concept: 'Products recently inspected by the shopper, optimized for 1-click repeat reordering.',
  customerLabel: 'Recently Viewed Products'
 },
 promise: {
  icon: '🛡️',
  badge: 'Trust Badges',
  concept: 'Trust guarantee badges (15-min delivery, 100% quality assurance, easy refunds) at page bottom.',
  customerLabel: 'Quality & Delivery Promise'
 }
};

let cachedSettingsData=null;
let cachedSavedData=null;
let cachedBanners=null;
let cachedCategories=null;
let cachedAdminEmail=null;
let lastSettingsFetch=0;

function SettingsSkeleton(){
 return (
  <div style={{animation:'fadeIn 0.2s ease-in'}}>
   <div className="admin-title" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',marginBottom:'20px'}}>
    <div>
     <div className="r2c-skeleton-box" style={{width:'340px',height:'32px',borderRadius:'8px',marginBottom:'10px'}}/>
     <div className="r2c-skeleton-box" style={{width:'480px',height:'16px',borderRadius:'6px'}}/>
    </div>
    <div className="r2c-skeleton-box" style={{width:'140px',height:'28px',borderRadius:'20px'}}/>
   </div>

   <div className="tabs admin-tabs" style={{marginBottom:'20px',overflowX:'hidden',display:'flex',gap:'8px'}}>
    {[190, 205, 220, 200, 150, 210].map((width, idx)=>(
     <div
      key={idx}
      className="r2c-skeleton-box"
      style={{
       width:`${width}px`,
       height:'42px',
       borderRadius:'10px',
       flexShrink:0
      }}
     />
    ))}
   </div>

   <section className="admin-card" style={{padding:'24px',borderRadius:'16px',border:'1px solid #e2e8f0',background:'#ffffff',marginBottom:'24px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'26px',paddingBottom:'18px',borderBottom:'1px solid #f1f5f9'}}>
     <div className="r2c-skeleton-box" style={{width:'44px',height:'44px',borderRadius:'12px',flexShrink:0}}/>
     <div style={{flex:1}}>
      <div className="r2c-skeleton-box" style={{width:'240px',height:'20px',borderRadius:'6px',marginBottom:'8px'}}/>
      <div className="r2c-skeleton-box" style={{width:'380px',height:'14px',borderRadius:'4px'}}/>
     </div>
    </div>

    <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'28px',paddingBottom:'24px',borderBottom:'1px solid #f1f5f9',flexWrap:'wrap'}}>
     <div className="r2c-skeleton-box" style={{width:'108px',height:'108px',borderRadius:'18px',flexShrink:0}}/>
     <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      <div className="r2c-skeleton-box" style={{width:'130px',height:'18px',borderRadius:'6px'}}/>
      <div className="r2c-skeleton-box" style={{width:'260px',height:'13px',borderRadius:'4px'}}/>
      <div style={{display:'flex',gap:'10px',marginTop:'6px'}}>
       <div className="r2c-skeleton-box" style={{width:'130px',height:'38px',borderRadius:'8px'}}/>
       <div className="r2c-skeleton-box" style={{width:'95px',height:'38px',borderRadius:'8px'}}/>
      </div>
     </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'20px',marginBottom:'28px'}}>
     {Array.from({length:6}).map((_, i)=>(
      <div key={i} style={{display:'flex',flexDirection:'column',gap:'8px'}}>
       <div className="r2c-skeleton-box" style={{width:'130px',height:'14px',borderRadius:'4px'}}/>
       <div className="r2c-skeleton-box" style={{width:'100%',height:'44px',borderRadius:'10px'}}/>
      </div>
     ))}
    </div>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'18px',borderTop:'1px solid #f1f5f9'}}>
     <div className="r2c-skeleton-box" style={{width:'180px',height:'16px',borderRadius:'4px'}}/>
     <div style={{display:'flex',gap:'10px'}}>
      <div className="r2c-skeleton-box" style={{width:'95px',height:'38px',borderRadius:'10px'}}/>
      <div className="r2c-skeleton-box" style={{width:'135px',height:'38px',borderRadius:'10px'}}/>
     </div>
    </div>
   </section>
  </div>
 );
}

export function AdminSettings(){
 const {notify}=useApp();
 const location=useLocation();
 const [activeTab,setActiveTab]=useState(()=>{
  if(location.pathname.includes('/storefront'))return 'storefront';
  if(location.pathname.includes('/policies'))return 'policies';
  return 'general';
 });
 const [policyKey,setPolicyKey]=useState('privacy');

 const [storefrontTab,setStorefrontTab]=useState('sections');
 const [expandedSectionId,setExpandedSectionId]=useState(null);
 const [catSearch,setCatSearch]=useState('');
 const [sectionFilter,setSectionFilter]=useState('all');

 const [settings,setSettings]=useState(()=>cachedSettingsData);
 const [saved,setSaved]=useState(()=>cachedSavedData);
 const [loading,setLoading]=useState(()=>!cachedSettingsData);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState(false);

 const [bannersList,setBannersList]=useState(()=>cachedBanners||[]);
 const [categoriesList,setCategoriesList]=useState(()=>cachedCategories||[]);

 const [adminEmail,setAdminEmail]=useState(()=>cachedAdminEmail||'r2cartsupport@gmail.com');
 const [initialAdminEmail,setInitialAdminEmail]=useState(()=>cachedAdminEmail||'r2cartsupport@gmail.com');
 const [currentPassword,setCurrentPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [pwdSaving,setPwdSaving]=useState(false);
 const [showCurrent,setShowCurrent]=useState(false);
 const [showNew,setShowNew]=useState(false);
 const [showConfirm,setShowConfirm]=useState(false);
 const fileRef=useRef(null);

 useEffect(()=>{
  if(location.pathname.includes('/storefront'))setActiveTab('storefront');
  else if(location.pathname.includes('/policies'))setActiveTab('policies');
 },[location.pathname]);

 const load=async(silent=false)=>{
  if(!silent&&!cachedSettingsData)setLoading(true);
  try{
   const [data,bans,cats]=await Promise.all([
    adminService.settings().then(normalize),
    adminService.banners().catch(()=>[]),
    adminService.categories().catch(()=>[])
   ]);
   cachedSettingsData=data;
   cachedSavedData=data;
   cachedBanners=bans;
   cachedCategories=cats;
   lastSettingsFetch=Date.now();
   setSettings(data);
   setSaved(data);
   setBannersList(bans);
   setCategoriesList(cats);
   try{
    const prof=await adminService.getProfile();
    if(prof?.email){
     cachedAdminEmail=prof.email;
     setAdminEmail(prof.email);
     setInitialAdminEmail(prof.email);
    }
   }catch{}
  }catch(error){
   if(!cachedSettingsData)notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 useEffect(()=>{
  if(cachedSettingsData){
   setLoading(false);
   if(Date.now()-lastSettingsFetch>60000){
    load(true);
   }
  }else{
   load(false);
  }
 },[]);

 const updateCredentials=async()=>{
  const emailChanged = adminEmail.trim().toLowerCase() !== initialAdminEmail.toLowerCase();
  const passwordChanging = Boolean(newPassword || confirmPassword);

  if (!emailChanged && !passwordChanging) {
   return notify('No changes made to email or password.', 'error');
  }

  if (!currentPassword) {
   return notify('Please enter your current password to authorize this update.', 'error');
  }

  if (emailChanged) {
   const email = adminEmail.trim().toLowerCase();
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return notify('Please enter a valid email address.', 'error');
   }
  }

  if (passwordChanging) {
   if (newPassword.length < 8) {
    return notify('New password must be at least 8 characters long with letters & numbers.', 'error');
   }
   if (newPassword !== confirmPassword) {
    return notify('New password and confirmation password do not match.', 'error');
   }
   if (newPassword === currentPassword) {
    return notify('New password must be different from current password.', 'error');
   }
  }

  setPwdSaving(true);
  try{
   const updatedParts = [];

   // 1. Update email if changed
   if (emailChanged) {
    const updated = await adminService.updateProfile({
     email: adminEmail.trim().toLowerCase(),
     currentPassword
    });
    const savedEmail = updated?.email || adminEmail.trim().toLowerCase();
    setInitialAdminEmail(savedEmail);
    setAdminEmail(savedEmail);
    updatedParts.push('Login Email (ID)');

    try {
     const storedUser = localStorage.getItem('r2cart-admin-user');
     if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.email = savedEmail;
      localStorage.setItem('r2cart-admin-user', JSON.stringify(parsed));
     }
    } catch {}
   }

   // 2. Update password if changed
   if (passwordChanging) {
    await adminService.changePassword(currentPassword, newPassword);
    updatedParts.push('Password');
   }

   notify(`${updatedParts.join(' & ')} updated successfully! Keep your new credentials safe.`);
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  }catch(err){
   notify(err.message || 'Failed to update credentials', 'error');
  }finally{
   setPwdSaving(false);
  }
 };

 const dirty=useMemo(()=>settings&&saved&&JSON.stringify(settings)!==JSON.stringify(saved),[settings,saved]);

 const change=(key,value)=>setSettings(current=>{
  const next={...current,[key]:value};
  if(key==='contactNumber'&&(!current.policies?.supportPhone||current.policies.supportPhone==='+91 80000 10001')){
   next.policies={...next.policies,supportPhone:value};
  }
  if(key==='email'&&(!current.policies?.supportEmail||current.policies.supportEmail==='support@r2cart.in')){
   next.policies={...next.policies,supportEmail:value};
  }
  if(key==='address'&&(!current.policies?.officeAddress||current.policies.officeAddress==='Bailey Road, Patna, Bihar — 800001, India')){
   next.policies={...next.policies,officeAddress:value};
  }
  if(key==='storeName'&&(!current.policies?.legalName||current.policies.legalName==='R2Cart Retail Pvt. Ltd.')){
   next.policies={...next.policies,legalName:`${value} Retail Pvt. Ltd.`};
  }
  return next;
 });
 const toggle=key=>setSettings(current=>({...current,notifications:{...current.notifications,[key]:!current.notifications[key]}}));

 const changePolicyTop=(field,val)=>{
  setSettings(curr=>({
   ...curr,
   policies:{
    ...curr.policies,
    [field]:val
   }
  }));
 };

 const changePolicyPage=(pKey,field,val)=>{
  setSettings(curr=>({
   ...curr,
   policies:{
    ...curr.policies,
    customPages:{
     ...curr.policies.customPages,
     [pKey]:{
      ...(curr.policies.customPages?.[pKey]||defaultPolicies.customPages[pKey]||{}),
      [field]:val
     }
    }
   }
  }));
 };

 const updatePolicySection=(pKey,secIndex,field,val)=>{
  setSettings(curr=>{
   const page=curr.policies.customPages?.[pKey]||{};
   const sections=[...(page.sections||[])];
   if(!sections[secIndex])return curr;
   sections[secIndex]={...sections[secIndex],[field]:val};
   return {
    ...curr,
    policies:{
     ...curr.policies,
     customPages:{
      ...curr.policies.customPages,
      [pKey]:{
       ...page,
       sections
      }
     }
    }
   };
  });
 };

 const addPolicySection=pKey=>{
  setSettings(curr=>{
   const page=curr.policies.customPages?.[pKey]||{};
   const sections=[...(page.sections||[])];
   sections.push({
    title:`${sections.length + 1}. New Policy Clause`,
    text:'Enter the clause explanation or detailed terms here…',
    bullets:[]
   });
   return {
    ...curr,
    policies:{
     ...curr.policies,
     customPages:{
      ...curr.policies.customPages,
      [pKey]:{
       ...page,
       sections
      }
     }
    }
   };
  });
 };

 const removePolicySection=(pKey,secIndex)=>{
  setSettings(curr=>{
   const page=curr.policies.customPages?.[pKey]||{};
   const sections=(page.sections||[]).filter((_,idx)=>idx!==secIndex);
   return {
    ...curr,
    policies:{
     ...curr.policies,
     customPages:{
      ...curr.policies.customPages,
      [pKey]:{
       ...page,
       sections
      }
     }
    }
   };
  });
 };

 const movePolicySection=(pKey,secIndex,direction)=>{
  setSettings(curr=>{
   const page=curr.policies.customPages?.[pKey]||{};
   const sections=[...(page.sections||[])];
   const target=secIndex+direction;
   if(target<0||target>=sections.length)return curr;
   const temp=sections[secIndex];
   sections[secIndex]=sections[target];
   sections[target]=temp;
   return {
    ...curr,
    policies:{
     ...curr.policies,
     customPages:{
      ...curr.policies.customPages,
      [pKey]:{
       ...page,
       sections
      }
     }
    }
   };
  });
 };

 const savePolicyNow=async pKey=>{
  setSaving(true);
  try{
   const payload={
    storeName:settings.storeName,
    logo:settings.logo,
    contactNumber:settings.contactNumber,
    email:settings.email,
    address:settings.address,
    openingTime:settings.openingTime,
    closingTime:settings.closingTime,
    currency:settings.currency,
    minimumOrder:Number(settings.minimumOrder),
    deliveryFee:Number(settings.deliveryFee),
    freeDeliveryThreshold:Number(settings.freeDeliveryThreshold),
    estimatedDelivery:settings.estimatedDelivery,
    globalDeliveryRadius:Number(settings.globalDeliveryRadius),
    notifications:settings.notifications,
    policies:settings.policies
   };
   const data=normalize(await adminService.saveSettings(payload));
   cachedSettingsData=data;
   cachedSavedData=data;
   lastSettingsFetch=Date.now();
   setSettings(data);
   setSaved(data);
   window.dispatchEvent(new CustomEvent('r2cart:settings-updated', { detail: { policies: data.policies, settings: data } }));
   window.dispatchEvent(new Event('r2cart:delivery-updated'));
   const navObj=policyNav.find(p=>p.type===pKey);
   notify(`Saved and published ${navObj?.label || pKey} live!`);
  }catch(error){
   notify(error.message,'error');
  }finally{
   setSaving(false);
  }
 };

 const resetPolicyPage=pKey=>{
  const storeInfo={
   storeName:settings.storeName||BRAND.name,
   legalName:settings.policies.legalName||defaultPolicies.legalName,
   phone:settings.contactNumber||settings.policies.supportPhone||defaultPolicies.supportPhone,
   email:settings.email||settings.policies.supportEmail||defaultPolicies.supportEmail,
   hours:settings.policies.supportHours||defaultPolicies.supportHours,
   address:settings.address||settings.policies.officeAddress||defaultPolicies.officeAddress,
   fulfillmentHub:settings.policies.fulfillmentHub||defaultPolicies.fulfillmentHub,
   grievanceName:settings.policies.grievanceOfficerName||defaultPolicies.grievanceOfficerName,
   grievanceRole:settings.policies.grievanceOfficerRole||defaultPolicies.grievanceOfficerRole,
   grievanceEmail:settings.policies.grievanceOfficerEmail||defaultPolicies.grievanceOfficerEmail,
   grievancePhone:settings.policies.grievanceOfficerPhone||defaultPolicies.grievanceOfficerPhone,
   deliveryFee:settings.deliveryFee!=null?Number(settings.deliveryFee):30,
   freeDeliveryThreshold:settings.freeDeliveryThreshold!=null?Number(settings.freeDeliveryThreshold):499,
   minimumOrder:settings.minimumOrder!=null?Number(settings.minimumOrder):150,
   globalRadius:settings.globalDeliveryRadius!=null?Number(settings.globalDeliveryRadius):5.0,
   estimatedDelivery:settings.estimatedDelivery||'15–30 minutes',
  };
  const standard=getPolicyContent(storeInfo)[pKey]||{};
  setSettings(curr=>({
   ...curr,
   policies:{
    ...curr.policies,
    customPages:{
     ...curr.policies.customPages,
     [pKey]:{
      title:standard.title||'',
      eyebrow:standard.eyebrow||'',
      intro:standard.intro||'',
      metaTags:Array.isArray(standard.metaTags)?standard.metaTags.join(', '):(standard.metaTags||''),
      customText:'',
      sections:standard.sections?JSON.parse(JSON.stringify(standard.sections)):[]
     }
    }
   }
  }));
  const navObj=policyNav.find(p=>p.type===pKey);
  notify(`Reset ${navObj?.label || pKey} page to verified legal template`);
 };

 // Storefront & Home Layout Modifiers
 const changeHomeLayout=updater=>{
  setSettings(curr=>{
   const currentLayout=curr.policies?.homeLayout||defaultHomeLayout;
   const nextLayout=typeof updater==='function'?updater(currentLayout):updater;
   return {
    ...curr,
    policies:{
     ...curr.policies,
     homeLayout:nextLayout
    }
   };
  });
 };

 const moveSection=(index,direction)=>{
  const sections=[...(settings.policies?.homeLayout?.sections||defaultHomeSections)];
  const target=index+direction;
  if(target<0||target>=sections.length)return;
  const temp=sections[index];
  sections[index]=sections[target];
  sections[target]=temp;
  sections.forEach((s,idx)=>{s.order=idx+1});
  changeHomeLayout(layout=>({...layout,sections}));
 };

 const setSectionOrder=(id,newOrder)=>{
  const num=Math.max(1,parseInt(newOrder,10)||1);
  const sections=[...(settings.policies?.homeLayout?.sections||defaultHomeSections)];
  const sec=sections.find(s=>s.id===id);
  if(!sec)return;
  sec.order=num;
  sections.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  sections.forEach((s,idx)=>{s.order=idx+1});
  changeHomeLayout(layout=>({...layout,sections}));
 };

 const toggleSection=id=>{
  const sections=(settings.policies?.homeLayout?.sections||defaultHomeSections).map(s=>{
   if(s.id!==id)return s;
   return {...s,enabled:!s.enabled};
  });
  changeHomeLayout(layout=>({...layout,sections}));
 };

 const toggleSectionComingSoon=id=>{
  const sections=(settings.policies?.homeLayout?.sections||defaultHomeSections).map(s=>{
   if(s.id!==id)return s;
   return {...s,comingSoon:!s.comingSoon};
  });
  changeHomeLayout(layout=>({...layout,sections}));
 };

 const toggleCategoryComingSoon=slug=>{
  const currentSet=new Set(settings.policies?.homeLayout?.comingSoonCategories||[]);
  if(currentSet.has(slug)){
   currentSet.delete(slug);
  }else{
   currentSet.add(slug);
  }
  changeHomeLayout(layout=>({...layout,comingSoonCategories:Array.from(currentSet)}));
 };

 const updateSectionField=(id,field,value)=>{
  const sections=(settings.policies?.homeLayout?.sections||defaultHomeSections).map(s=>{
   if(s.id!==id)return s;
   return {...s,[field]:value};
  });
  changeHomeLayout(layout=>({...layout,sections}));
 };

 const setBannerPlacement=(bannerId,placement)=>{
  changeHomeLayout(layout=>({
   ...layout,
   bannerPlacements:{
    ...(layout.bannerPlacements||{}),
    [bannerId]:placement
   }
  }));
 };

 const getFullCategoryOrder=()=>{
  const currentCats=categoriesList.length?categoriesList:[];
  const validSlugs = new Set(currentCats.map(c => c.slug).filter(Boolean));
  // Filter out any stale/deleted category slugs so currentOrder is 1:1 with real categories
  const savedOrder = (settings.policies?.homeLayout?.categoryOrder || []).filter(s => validSlugs.has(s));
  const fullOrder = [...savedOrder];
  currentCats.forEach(c=>{
   if(c.slug && !fullOrder.includes(c.slug)){
    fullOrder.push(c.slug);
   }
  });
  return fullOrder;
 };

 const moveCategory=(slugOrIndex,direction)=>{
  const currentOrder=getFullCategoryOrder();
  let fromIdx = -1;
  if (typeof slugOrIndex === 'string') {
   fromIdx = currentOrder.indexOf(slugOrIndex);
  } else if (typeof slugOrIndex === 'number') {
   fromIdx = slugOrIndex;
  }
  if(fromIdx===-1)return;
  const target=fromIdx+direction;
  if(target<0||target>=currentOrder.length)return;
  const temp=currentOrder[fromIdx];
  currentOrder[fromIdx]=currentOrder[target];
  currentOrder[target]=temp;
  changeHomeLayout(layout=>({...layout,categoryOrder:currentOrder}));
 };

 const setCategoryPosition=(slug,targetIdx)=>{
  const currentOrder=getFullCategoryOrder();
  const fromIdx=currentOrder.indexOf(slug);
  if(fromIdx===-1)return;
  const clampedTarget=Math.max(0,Math.min(targetIdx,currentOrder.length-1));
  const [removed]=currentOrder.splice(fromIdx,1);
  currentOrder.splice(clampedTarget,0,removed);
  changeHomeLayout(layout=>({...layout,categoryOrder:currentOrder}));
 };

 const sortCategoriesAlphabetical=()=>{
  const sortedSlugs=[...categoriesList].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>c.slug);
  changeHomeLayout(layout=>({...layout,categoryOrder:sortedSlugs}));
  notify('Categories sorted alphabetically (A to Z)');
 };

 const resetCategoryOrderToDefault=()=>{
  const defaultSlugs=categoriesList.map(c=>c.slug);
  changeHomeLayout(layout=>({...layout,categoryOrder:defaultSlugs}));
  notify('Category sequence reset to store default');
 };

 const resetToDefaultLayout=()=>{
  changeHomeLayout(defaultHomeLayout);
  notify('Reset storefront homepage layout to default sequence');
 };

 const applyPresetTemplate=templateType=>{
  let orderMap={};
  if(templateType==='standard'){
   orderMap={heroBanners:1,shopCategories:2,campaignOffers:3,bestSellers:4,recommended:5,promoStrip:6,categoryRails:7,topPicks:8,specialOffers:9,recentlyViewed:10,promise:11};
  }else if(templateType==='offers'){
   orderMap={campaignOffers:1,specialOffers:2,heroBanners:3,promoStrip:4,bestSellers:5,shopCategories:6,recommended:7,topPicks:8,categoryRails:9,recentlyViewed:10,promise:11};
  }else if(templateType==='fast'){
   orderMap={shopCategories:1,bestSellers:2,heroBanners:3,recommended:4,campaignOffers:5,topPicks:6,categoryRails:7,specialOffers:8,promoStrip:9,recentlyViewed:10,promise:11};
  }
  const sections=[...(settings.policies?.homeLayout?.sections||defaultHomeSections)].map(sec=>({
   ...sec,
   order:orderMap[sec.id]||sec.order||99,
   enabled:true
  }));
  sections.sort((a,b)=>(Number(a.order)||99)-(Number(b.order)||99));
  sections.forEach((s,idx)=>{s.order=idx+1});
  changeHomeLayout(layout=>({...layout,sections}));
  notify(`Applied ready-made "${templateType.toUpperCase()}" homepage layout!`);
 };

 const uploadLogo=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setUploading(true);
  try{
   const data=await adminService.uploadStoreLogo(file);
   change('logo',data.url);
   notify('Logo uploaded. Save changes to publish it.');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setUploading(false);
   event.target.value='';
  }
 };

 const submit=async event=>{
  event.preventDefault();
  setSaving(true);
  try{
   const payload={
    storeName:settings.storeName,
    logo:settings.logo,
    contactNumber:settings.contactNumber,
    email:settings.email,
    address:settings.address,
    openingTime:settings.openingTime,
    closingTime:settings.closingTime,
    currency:settings.currency,
    minimumOrder:Number(settings.minimumOrder),
    deliveryFee:Number(settings.deliveryFee),
    freeDeliveryThreshold:Number(settings.freeDeliveryThreshold),
    estimatedDelivery:settings.estimatedDelivery,
    globalDeliveryRadius:Number(settings.globalDeliveryRadius),
    notifications:settings.notifications,
    policies:settings.policies
   };
   const data=normalize(await adminService.saveSettings(payload));
   cachedSettingsData=data;
   cachedSavedData=data;
   lastSettingsFetch=Date.now();
   setSettings(data);
   setSaved(data);
   window.dispatchEvent(new CustomEvent('r2cart:settings-updated', { detail: { policies: data.policies, settings: data } }));
   window.dispatchEvent(new Event('r2cart:delivery-updated'));
   notify('Store settings, storefront layout and policy CMS saved');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setSaving(false);
  }
 };

 if(loading&&!settings)return <SettingsSkeleton/>;
 if(!settings)return <><Header/><div className="admin-card settings-loading"><b>Settings could not be loaded</b><small>Check the backend connection and try again.</small><Button type="button" variant="outline" onClick={()=>load(false)}><RefreshCcw/> Try again</Button></div></>;

 const currentPolicyPage=settings.policies.customPages?.[policyKey]||defaultPolicies.customPages[policyKey]||{};
 const currentSections=Array.isArray(currentPolicyPage.sections)?currentPolicyPage.sections:[];
 const selectedNavItem=policyNav.find(p=>p.type===policyKey)||policyNav[0];
 const currentHomeLayout=settings.policies?.homeLayout||defaultHomeLayout;
 const sectionsList=currentHomeLayout.sections||defaultHomeSections;
 const bannerPlacements=currentHomeLayout.bannerPlacements||{};

 return <>
  <Header action={<span className={`settings-sync ${dirty?'pending':'saved'}`}>{dirty?'Unsaved changes':'Synced with database'}</span>}/>

  {/* Top Navigation Tabs */}
  <div className="tabs admin-tabs" style={{marginBottom:'20px'}}>
   <button type="button" className={activeTab==='general'?'active':''} onClick={()=>setActiveTab('general')}>
    <Store size={16}/>
    <span>Store Profile & Branding</span>
   </button>
   <button type="button" className={activeTab==='storefront'?'active':''} onClick={()=>setActiveTab('storefront')}>
    <LayoutTemplate size={16}/>
    <span>Storefront & Home Layout</span>
   </button>
   <button type="button" className={activeTab==='legal'?'active':''} onClick={()=>setActiveTab('legal')}>
    <Building2 size={16}/>
    <span>Company & Grievance Details</span>
   </button>
   <button type="button" className={activeTab==='policies'?'active':''} onClick={()=>setActiveTab('policies')}>
    <FileText size={16}/>
    <span>Policy Pages CMS (9 Pages)</span>
   </button>
   <button type="button" className={activeTab==='security'?'active':''} onClick={()=>setActiveTab('security')}>
    <KeyRound size={16}/>
    <span>Admin Security</span>
   </button>
   <button type="button" className={activeTab==='emergency'?'active':''} onClick={()=>setActiveTab('emergency')} style={{color: settings.policies?.emergencyPause?.isPaused ? '#ef4444' : undefined}}>
    <ShieldAlert size={16}/>
    <span>Emergency Pause & Holidays {settings.policies?.emergencyPause?.isPaused ? '🔴' : ''}</span>
   </button>
  </div>

  <form className="settings-form proper-settings" onSubmit={submit}>

   {/* TAB 1: STORE PROFILE & BRAND IDENTITY */}
   {activeTab==='general'&&(
    <>
     <section className="admin-card">
      <SectionTitle icon={Store} title="Store Profile & Brand Identity" text="Logo, business name, customer support contact info, and dark-store operating address."/>
      <div className="settings-logo-row">
       <div className="settings-logo-preview">
        {settings.logo?<img src={settings.logo} alt="Store logo"/>:<><ImageIcon/><small>No logo</small></>}
       </div>
       <div>
        <b>Store logo</b>
        <p>Use a square JPG, PNG or WebP image up to 5 MB.</p>
        <div className="row gap">
         <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadLogo}/>
         <Button type="button" variant="outline" disabled={uploading} onClick={()=>fileRef.current?.click()}>
          {uploading?<LoaderCircle className="spin"/>:<Upload/>} {uploading?'Uploading…':'Choose logo'}
         </Button>
         {settings.logo&&<Button type="button" variant="ghost" className="text-danger" onClick={()=>change('logo','')}><Trash2/> Remove</Button>}
        </div>
       </div>
      </div>
      <div className="form-grid">
       <Field required label="Store name" value={settings.storeName} onChange={e=>change('storeName',e.target.value)} placeholder="e.g. R2Cart"/>
       <Field required label="Primary contact number" value={settings.contactNumber} onChange={e=>change('contactNumber',e.target.value)} placeholder="+91 80000 10001"/>
       <Field required type="email" label="Store email" value={settings.email} onChange={e=>change('email',e.target.value)} placeholder="support@r2cart.in"/>
       <label className="full">
        <span>Store operational address</span>
        <textarea required value={settings.address} onChange={e=>change('address',e.target.value)} placeholder="Complete operating dark-store address"/>
       </label>
      </div>
     </section>

     <section className="admin-card">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',marginBottom:'12px'}}>
       <div>
        <SectionTitle icon={Clock3} title="Standard Store Hours" text="Default opening and closing hours displayed on storefront contact & footer sections."/>
       </div>
       <Link
        to="/scheduling"
        style={{
         display:'inline-flex',
         alignItems:'center',
         gap:'6px',
         fontSize:'12px',
         fontWeight:700,
         color:'#059669',
         background:'#ecfdf5',
         border:'1px solid #a7f3d0',
         padding:'6px 12px',
         borderRadius:'8px',
         textDecoration:'none',
         boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
        }}
       >
        <CalendarClock size={14}/> Manage Delivery Slots & Capacity in Store Operations →
       </Link>
      </div>
      <div className="form-grid">
       <Field required type="time" label="Opening time" value={settings.openingTime} onChange={e=>change('openingTime',e.target.value)}/>
       <Field required type="time" label="Closing time" value={settings.closingTime} onChange={e=>change('closingTime',e.target.value)}/>
      </div>
      <div style={{fontSize:'12px',color:'#64748b',marginTop:'12px',background:'#f8fafc',padding:'10px 14px',borderRadius:'8px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'8px'}}>
       <Info size={14} style={{color:'#059669',flexShrink:0}}/>
       <span>
        To configure active delivery slots (e.g. 7-10 AM), order capacity limits, and cutoff minutes, visit <Link to="/scheduling" style={{color:'#059669',fontWeight:700}}>Store Operations</Link>.
       </span>
      </div>
     </section>

     <section className="admin-card">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',marginBottom:'12px'}}>
       <div>
        <SectionTitle icon={Truck} title="Global Delivery Charges & Order Thresholds" text="Live storewide delivery rates displayed across the storefront, cart, checkout, and official legal policy pages."/>
       </div>
       <Link
        to="/delivery"
        style={{
         display:'inline-flex',
         alignItems:'center',
         gap:'6px',
         fontSize:'12px',
         fontWeight:700,
         color:'#2563eb',
         background:'#eff6ff',
         border:'1px solid #bfdbfe',
         padding:'6px 12px',
         borderRadius:'8px',
         textDecoration:'none',
         boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
        }}
       >
        <Truck size={14}/> Zone & Village Overrides in Delivery Manager →
       </Link>
      </div>
      <div className="form-grid">
       <label>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
         <span style={{fontSize:'13px',fontWeight:600}}>Standard Delivery Fee</span>
         <span style={{fontSize:'11px',fontWeight:700,color:'#059669',background:'#ecfdf5',padding:'1px 6px',borderRadius:'4px'}}>₹ INR</span>
        </div>
        <input
         type="number"
         min="0"
         step="1"
         required
         value={settings.deliveryFee}
         onChange={e=>change('deliveryFee',e.target.value)}
         placeholder="e.g. 30"
        />
        <small style={{color:'#64748b',fontSize:'11px',marginTop:'4px',display:'block'}}>Nominal fee applied when cart value is below free threshold</small>
       </label>

       <label>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
         <span style={{fontSize:'13px',fontWeight:600}}>Free Delivery Threshold</span>
         <span style={{fontSize:'11px',fontWeight:700,color:'#059669',background:'#ecfdf5',padding:'1px 6px',borderRadius:'4px'}}>₹ INR</span>
        </div>
        <input
         type="number"
         min="0"
         step="1"
         required
         value={settings.freeDeliveryThreshold}
         onChange={e=>change('freeDeliveryThreshold',e.target.value)}
         placeholder="e.g. 499"
        />
        <small style={{color:'#64748b',fontSize:'11px',marginTop:'4px',display:'block'}}>Orders with cart value at or above this amount get FREE delivery</small>
       </label>

       <label>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
         <span style={{fontSize:'13px',fontWeight:600}}>Minimum Order Value</span>
         <span style={{fontSize:'11px',fontWeight:700,color:'#059669',background:'#ecfdf5',padding:'1px 6px',borderRadius:'4px'}}>₹ INR</span>
        </div>
        <input
         type="number"
         min="0"
         step="1"
         required
         value={settings.minimumOrder}
         onChange={e=>change('minimumOrder',e.target.value)}
         placeholder="e.g. 150"
        />
        <small style={{color:'#64748b',fontSize:'11px',marginTop:'4px',display:'block'}}>Minimum subtotal required for a customer to checkout</small>
       </label>

       <label>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
         <span style={{fontSize:'13px',fontWeight:600}}>Service Delivery Radius</span>
         <span style={{fontSize:'11px',fontWeight:700,color:'#059669',background:'#ecfdf5',padding:'1px 6px',borderRadius:'4px'}}>km</span>
        </div>
        <input
         type="number"
         min="0.5"
         step="0.5"
         required
         value={settings.globalDeliveryRadius}
         onChange={e=>change('globalDeliveryRadius',e.target.value)}
         placeholder="e.g. 5.0"
        />
        <small style={{color:'#64748b',fontSize:'11px',marginTop:'4px',display:'block'}}>Default operational service radius from dark-store hub</small>
       </label>

       <label className="full">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
         <span style={{fontSize:'13px',fontWeight:600}}>Estimated Delivery Time</span>
         <span style={{fontSize:'11px',fontWeight:700,color:'#64748b',background:'#f1f5f9',padding:'1px 6px',borderRadius:'4px'}}>Customer SLA</span>
        </div>
        <input
         type="text"
         required
         value={settings.estimatedDelivery}
         onChange={e=>change('estimatedDelivery',e.target.value)}
         placeholder="e.g. 15–30 minutes"
        />
        <small style={{color:'#64748b',fontSize:'11px',marginTop:'4px',display:'block'}}>Standard delivery promise displayed across header, cart & policy page</small>
       </label>
      </div>

      <div style={{fontSize:'12px',color:'#1e293b',marginTop:'14px',background:'#f0fdf4',padding:'12px 14px',borderRadius:'8px',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',gap:'8px'}}>
       <CheckCircle2 size={16} style={{color:'#16a34a',flexShrink:0}}/>
       <span>
        <b>Auto-Synced:</b> Updating these charges here automatically updates your checkout delivery calculations and updates Section 3 of your <Link to="/delivery-info" target="_blank" style={{color:'#16a34a',fontWeight:700}}>Shipping & Delivery Policy</Link>.
       </span>
      </div>
     </section>

     <section className="admin-card">
      <SectionTitle icon={BellRing} title="Admin notification preferences" text="Select what store events trigger administrator alerts."/>
      <Notification checked={settings.notifications.orders} onChange={()=>toggle('orders')} title="New customer orders" text="Receive instant sound and push notifications when a new order is placed."/>
      <Notification checked={settings.notifications.stock} onChange={()=>toggle('stock')} title="Low stock warnings" text="Be alerted when inventory falls below minimum reorder thresholds."/>
      <Notification checked={settings.notifications.customers} onChange={()=>toggle('customers')} title="Customer registrations" text="Get notified when new verified customer accounts register."/>
     </section>
    </>
   )}

   {/* TAB 2: STOREFRONT & HOME LAYOUT (ADMIN CONTROLS) */}
   {activeTab==='storefront'&&(
    <>
     {/* Control Center Hero Card */}
     <section className="admin-card storefront-hero-card">
      <div className="between" style={{alignItems:'center',flexWrap:'wrap',gap:'16px',width:'100%'}}>
       <div style={{flex:'1 1 400px',minWidth:0}}>
        <div className="storefront-hero-badge">
         <Sparkles size={14}/> STOREFRONT HOMEPAGE ARCHITECTURE
        </div>
        <h2 className="storefront-hero-title">Homepage Sections & Layout Merchandising</h2>
        <p className="storefront-hero-desc">
         Arrange the order (#1 to #11), visibility, and item display limits of all sections on your customer homepage.
        </p>
        <div className="storefront-stat-pills">
         <span className="storefront-stat-pill">
          <Layers size={13}/> 11 Sections
         </span>
         <span className="storefront-stat-pill success">
          <Eye size={13}/> {sectionsList.filter(s=>s.enabled).length} Active
         </span>
         <span className="storefront-stat-pill muted">
          <EyeOff size={13}/> {sectionsList.filter(s=>!s.enabled).length} Hidden
         </span>
         <span className="storefront-stat-pill">
          <Tag size={13}/> {categoriesList.length} Categories
         </span>
         <Link to="/admin/banners" className="storefront-stat-pill" style={{textDecoration:'none',color:'#047857',background:'#ecfdf5',borderColor:'#a7f3d0'}}>
          <ImageIcon size={13}/> Manage Banners (/admin/banners) →
         </Link>
        </div>
       </div>

       <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',flexShrink:0}}>
        <Button type="button" variant="outline" onClick={resetToDefaultLayout} style={{gap:'6px'}}>
         <RotateCcw size={15}/> Reset to Default
        </Button>
        <Button type="button" disabled={saving} onClick={submit} style={{gap:'6px',background:'#059669',color:'#fff',fontWeight:700}}>
         {saving?<LoaderCircle className="spin" size={15}/>:<Save size={15}/>} Save Layout
        </Button>
       </div>
      </div>
     </section>

     {/* Visual Customer Homepage Blueprint */}
     <div className="storefront-blueprint-card">
      <div className="blueprint-header">
       <h3>
        <Layers size={16} style={{color:'#10b981'}}/>
        Live Customer Homepage Sequence (Top to Bottom Flow)
       </h3>
       <small>Click any block below to jump directly to its card</small>
      </div>
      <div className="blueprint-strip">
       {sectionsList.map((sec)=>(
        <button
         key={sec.id}
         type="button"
         onClick={()=>{
          setStorefrontTab('sections');
          const el=document.getElementById(`sec-card-${sec.id}`);
          if(el){
           el.scrollIntoView({behavior:'smooth',block:'center'});
           el.style.boxShadow='0 0 0 3px #10b981';
           setTimeout(()=>{if(el)el.style.boxShadow='';},1800);
          }
         }}
         className={`blueprint-block ${sec.enabled?'is-active':'is-hidden'}`}
         title={`#${sec.order} ${sec.title||sec.label} — ${sec.enabled?'Visible on storefront':'Hidden from storefront'}`}
        >
         <span className="blueprint-num">#{sec.order}</span>
         <span>{SECTION_META[sec.id]?.icon || '📦'} {sec.title||sec.label}</span>
         <small style={{fontSize:'10px',opacity:0.8}}>{sec.enabled?'ON':'OFF'}</small>
        </button>
       ))}
      </div>
     </div>

     {/* Modern Segmented Sub-Navigation Bar */}
     <div className="storefront-tabs-bar">
      <button
       type="button"
       className={`storefront-tab-pill ${storefrontTab==='sections'?'active':''}`}
       onClick={()=>setStorefrontTab('sections')}
      >
       <Layers size={15}/>
       <span>1. Homepage Sections Sequence</span>
       <span className="storefront-tab-count">
        {sectionsList.filter(s=>s.enabled).length}/{sectionsList.length} Active
       </span>
      </button>

      <button
       type="button"
       className={`storefront-tab-pill ${storefrontTab==='categories'?'active':''}`}
       onClick={()=>setStorefrontTab('categories')}
      >
       <Grid size={15}/>
       <span>2. Category Sequence ("Shop by category")</span>
       <span className="storefront-tab-count">
        {categoriesList.length} Categories
       </span>
      </button>
     </div>

     {/* SUBTAB 1: HOMEPAGE SECTIONS SEQUENCE & VISIBILITY */}
     {storefrontTab==='sections'&&(
      <div>
       {/* Full Width Sections List */}
       <div className="layout-sections-container">
        {/* Filter Bar */}
        <div className="between" style={{marginBottom:'16px',flexWrap:'wrap',gap:'10px',alignItems:'center'}}>
         <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <button
           type="button"
           onClick={()=>setSectionFilter('all')}
           style={{padding:'6px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:700,border:sectionFilter==='all'?'1.5px solid #10b981':'1px solid #cbd5e1',background:sectionFilter==='all'?'#ecfdf5':'#fff',color:sectionFilter==='all'?'#064e3b':'#475569',cursor:'pointer'}}
          >
           All Sections ({sectionsList.length})
          </button>
          <button
           type="button"
           onClick={()=>setSectionFilter('visible')}
           style={{padding:'6px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:700,border:sectionFilter==='visible'?'1.5px solid #10b981':'1px solid #cbd5e1',background:sectionFilter==='visible'?'#ecfdf5':'#fff',color:sectionFilter==='visible'?'#064e3b':'#475569',cursor:'pointer'}}
          >
           <Eye size={13} style={{marginRight:4}}/> Visible Only ({sectionsList.filter(s=>s.enabled).length})
          </button>
          <button
           type="button"
           onClick={()=>setSectionFilter('hidden')}
           style={{padding:'6px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:700,border:sectionFilter==='hidden'?'1.5px solid #10b981':'1px solid #cbd5e1',background:sectionFilter==='hidden'?'#ecfdf5':'#fff',color:sectionFilter==='hidden'?'#064e3b':'#475569',cursor:'pointer'}}
          >
           <EyeOff size={13} style={{marginRight:4}}/> Hidden Only ({sectionsList.filter(s=>!s.enabled).length})
          </button>
         </div>

         <Link to="/" target="_blank" style={{fontSize:'12px',fontWeight:700,color:'#059669',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'5px'}}>
          Preview Live Storefront Homepage <ExternalLink size={13}/>
         </Link>
        </div>

        {/* Sections List */}
        <div className="layout-sections-list">
         {sectionsList
          .filter(sec=>{
           if(sectionFilter==='visible')return sec.enabled;
           if(sectionFilter==='hidden')return !sec.enabled;
           return true;
          })
          .map((sec,index)=>{
           const meta=SECTION_META[sec.id]||{};
           const isExpanded=expandedSectionId===sec.id;
           return (
            <article
             key={sec.id}
             id={`sec-card-${sec.id}`}
             className={`enhanced-section-card ${sec.enabled?'is-active':'is-hidden'}`}
            >
             <div className="enhanced-card-main">
              {/* Left: Rank Badge + Icon + Details */}
              <div className="enhanced-left-cluster">
               <span className={`enhanced-order-badge ${sec.order <= 3 ? 'top-order' : ''}`}>
                #{sec.order}
               </span>

               <div className="enhanced-icon-avatar">
                <span>{meta.icon||'📦'}</span>
               </div>

               <div className="enhanced-info-box">
                <div className="enhanced-title-row">
                 <h4>{sec.title||sec.label}</h4>
                 {meta.badge&&(
                  <span className="enhanced-type-badge">
                   {meta.badge}
                  </span>
                 )}
                </div>

                {meta.concept&&(
                 <p className="enhanced-concept-note">
                  {meta.concept}
                 </p>
                )}

                <div className="enhanced-meta-tags">
                 <span><b>Section ID:</b> <code>{sec.id}</code></span>
                 <span><b>Subtitle:</b> {sec.subtitle||'Default'}</span>
                 {(sec.count||sec.maxProducts)&&<span><b>Display Limit:</b> {sec.count||sec.maxProducts} items</span>}
                </div>
               </div>
              </div>

              {/* Right: Actions */}
              <div className="enhanced-actions-cluster">
               {/* Up Button */}
               <button
                type="button"
                disabled={index===0}
                onClick={()=>moveSection(index,-1)}
                aria-label={`Move ${sec.label} up`}
                className="enhanced-nav-btn"
                title="Move Up"
               >
                <ArrowUp size={15}/>
               </button>

               {/* Down Button */}
               <button
                type="button"
                disabled={index===sectionsList.length-1}
                onClick={()=>moveSection(index,1)}
                aria-label={`Move ${sec.label} down`}
                className="enhanced-nav-btn"
                title="Move Down"
               >
                <ArrowDown size={15}/>
               </button>

               {/* Visibility Toggle */}
               <button
                type="button"
                onClick={()=>toggleSection(sec.id)}
                className={`enhanced-toggle-btn ${sec.enabled?'is-on':'is-off'}`}
                title={sec.enabled?'Click to Hide from Storefront':'Click to Show on Storefront'}
               >
                {sec.enabled?(
                 <>
                  <Eye size={14}/> Visible (ON)
                 </>
                ):(
                 <>
                  <EyeOff size={14}/> Hidden (OFF)
                 </>
                )}
               </button>

               {/* Coming Soon Toggle */}
               <button
                type="button"
                onClick={()=>toggleSectionComingSoon(sec.id)}
                className={`enhanced-toggle-btn ${sec.comingSoon?'is-coming-soon':'is-not-coming-soon'}`}
                title={sec.comingSoon?'Click to turn OFF Coming Soon badge':'Click to turn ON Coming Soon badge'}
               >
                <Clock3 size={14}/>
                {sec.comingSoon?'Soon: ON':'Soon: OFF'}
               </button>

               {/* Customize Drawer Toggle */}
               <button
                type="button"
                onClick={()=>setExpandedSectionId(isExpanded?null:sec.id)}
                className="enhanced-customize-btn"
                title="Customize display text and limits"
               >
                <SlidersHorizontal size={14}/>
                <span>Customize</span>
                {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
               </button>
              </div>
             </div>

             {/* Expandable Customization Drawer */}
             {isExpanded&&(
              <div className="enhanced-settings-drawer">
               <div style={{fontSize:'12px',fontWeight:700,color:'#0f172a',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                <Sliders size={14} style={{color:'#10b981'}}/>
                Customize Section Display Titles & Item Limits
               </div>
               <div className="form-grid">
                <Field
                 label="Section Display Headline"
                 value={sec.title||''}
                 onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
                 placeholder={sec.label||'Section headline'}
                />
                <Field
                 label="Section Sub-Headline / Eyebrow"
                 value={sec.subtitle||''}
                 onChange={e=>updateSectionField(sec.id,'subtitle',e.target.value)}
                 placeholder="e.g. Handpicked best savings for your family"
                />
                <Field
                 label="Coming Soon Badge Label"
                 value={sec.comingSoonBadge||'Coming Soon'}
                 onChange={e=>updateSectionField(sec.id,'comingSoonBadge',e.target.value)}
                 placeholder="Coming Soon"
                />
                <Field
                 label="Coming Soon Notice Message"
                 value={sec.comingSoonNotice||''}
                 onChange={e=>updateSectionField(sec.id,'comingSoonNotice',e.target.value)}
                 placeholder="e.g. Stocking up fresh items shortly for Hathua zone!"
                />
                <Field
                 type="number"
                 min="2"
                 max="30"
                 label="Max Items To Display (Cards Limit)"
                 value={sec.count||sec.maxProducts||sec.maxCategories||10}
                 onChange={e=>{
                  const val=Math.max(2,parseInt(e.target.value,10)||10);
                  updateSectionField(sec.id,'count',val);
                  updateSectionField(sec.id,'maxProducts',val);
                  updateSectionField(sec.id,'maxCategories',val);
                 }}
                 placeholder="10"
                />
                {sec.id==='promoStrip'&&(
                 <>
                  <Field
                   label="Promo Button Text"
                   value={sec.buttonText||'Explore offers'}
                   onChange={e=>updateSectionField(sec.id,'buttonText',e.target.value)}
                   placeholder="Explore offers"
                  />
                  <Field
                   label="Promo Button Link"
                   value={sec.buttonLink||'/coupons'}
                   onChange={e=>updateSectionField(sec.id,'buttonLink',e.target.value)}
                   placeholder="/coupons"
                  />
                 </>
                )}
               </div>
              </div>
             )}
            </article>
           );
          })}
        </div>
       </div>
      </div>
     )}

          {/* SUBTAB 2: CATEGORY SEQUENCE & NUMBERING */}
     {storefrontTab==='categories'&&(
      <section className="admin-card">
       {/* Concept Explainer Box in 100% Clean English */}
       <div className="storefront-concept-box green">
        <HelpCircle size={18} style={{color:'#059669',flexShrink:0,marginTop:'2px'}}/>
        <div>
         <b style={{fontSize:'13.5px',color:'#064e3b',display:'block',marginBottom:'3px'}}>
          How Category Sequence & Ranking Works:
         </b>
         <p style={{margin:0,fontSize:'12.5px',color:'#334155',lineHeight:1.55}}>
          This controls the sequence of categories displayed inside the <b>"Shop by category"</b> shelf and capsule grid on the customer homepage.
          Categories ranked at <b>#1, #2, and #3</b> appear first and receive the highest visibility and customer conversions.
         </p>
        </div>
       </div>

       {(()=>{
        const fullOrder=getFullCategoryOrder();
        const orderMap=new Map(fullOrder.map((slug,idx)=>[slug,idx]));
        const sortedCats=[...categoriesList].sort((a,b)=>{
         const posA=orderMap.has(a.slug)?orderMap.get(a.slug):999;
         const posB=orderMap.has(b.slug)?orderMap.get(b.slug):999;
         return posA-posB;
        });

        const filteredCats=sortedCats.filter(c=>{
         if(!catSearch)return true;
         return c.name.toLowerCase().includes(catSearch.toLowerCase()) || (c.slug||'').toLowerCase().includes(catSearch.toLowerCase());
        });

        return (
         <>
          {/* Live Customer Capsule Preview Strip */}
          <div className="cat-preview-strip">
           <div className="cat-preview-header">
            <b>
             <Smartphone size={14} style={{color:'#10b981'}}/>
             Live Customer Homepage Preview ("Shop by category" Shelf)
            </b>
            <span style={{fontSize:'11.5px',color:'#64748b'}}>Exact sequence as displayed to customers</span>
           </div>
           <div className="cat-capsules-scroll">
            {sortedCats.map((cat, idx) => {
             const isSoon = (currentHomeLayout.comingSoonCategories||[]).includes(cat.slug);
             return (
             <div key={cat.id || cat.slug} className={`cat-capsule-chip ${idx < 3 ? 'top-rank' : ''}`} style={isSoon ? {border:'1.5px dashed #f59e0b',background:'#fffbeb'} : undefined}>
              <span className="cat-capsule-badge" style={{display:'inline-flex',alignItems:'center',gap:'3px'}}>
               {idx === 0 && <Crown size={11} style={{strokeWidth:2.4}}/>}
               {idx === 1 && <Medal size={11} style={{strokeWidth:2.4}}/>}
               {idx === 2 && <Award size={11} style={{strokeWidth:2.4}}/>}
               #{idx + 1}
              </span>
              {cat.image ? (
               <img src={cat.image} alt={cat.name} style={{width:'18px',height:'18px',objectFit:'contain'}}/>
              ) : (
               <Tag size={13} style={{color:'#10b981'}}/>
              )}
              <span>{cat.name}</span>
              {isSoon && <span style={{fontSize:'8.5px',fontWeight:800,color:'#b45309',background:'#fef3c7',padding:'1px 5px',borderRadius:'4px',marginLeft:'3px'}}>SOON</span>}
             </div>
            );
           })}
           </div>
          </div>

          {/* Clean Toolbar: Search, Counter, Quick Sort & Actions */}
          <div className="cat-toolbar-row">
           <div className="cat-search-box">
            <Search size={15} style={{position:'absolute',left:'11px',color:'#94a3b8'}}/>
            <input
             type="text"
             value={catSearch}
             onChange={e=>setCatSearch(e.target.value)}
             placeholder="Search category by name or slug..."
             className="cat-search-input"
            />
           </div>

           <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
            <span style={{fontSize:'12px',fontWeight:700,color:'#64748b',background:'#f1f5f9',padding:'6px 12px',borderRadius:'8px'}}>
             {filteredCats.length} of {categoriesList.length} Categories
            </span>
            <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={sortCategoriesAlphabetical}
             title="Sort all categories alphabetically A to Z"
             style={{fontSize:'12px',gap:'5px'}}
            >
             A–Z Sort
            </Button>
            <Button
             type="button"
             variant="outline"
             size="sm"
             onClick={resetCategoryOrderToDefault}
             title="Restore default category sequence"
             style={{fontSize:'12px',gap:'5px'}}
            >
             <RotateCcw size={13}/> Reset Order
            </Button>
            <Link to="/admin/categories" style={{fontSize:'12px',fontWeight:700,color:'#059669',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'4px',padding:'6px 10px',background:'#ecfdf5',borderRadius:'8px',border:'1px solid #a7f3d0'}}>
             Manage Categories →
            </Link>
           </div>
          </div>

          {/* Clean Category Rows */}
          <div className="cat-clean-list">
           {filteredCats.map(cat=>{
            const globalIdx = sortedCats.findIndex(c => (c.id || c.slug) === (cat.id || cat.slug));
            const isTopThree = globalIdx < 3;

            return (
             <div key={cat.id || cat.slug} className={`cat-clean-row ${isTopThree ? 'is-top-three' : ''}`}>
              {/* Left: Rank Badge, Icon/Image, Name, Slug */}
              <div className="cat-left-info">
               <div className={`cat-rank-badge ${globalIdx === 0 ? 'rank-1' : globalIdx === 1 ? 'rank-2' : globalIdx === 2 ? 'rank-3' : 'rank-default'}`}>
                {globalIdx === 0 && <Crown size={14} style={{strokeWidth: 2.4}} />}
                {globalIdx === 1 && <Medal size={14} style={{strokeWidth: 2.4}} />}
                {globalIdx === 2 && <Award size={14} style={{strokeWidth: 2.4}} />}
                <span>#{globalIdx + 1}</span>
               </div>

               <div className="cat-img-box" style={{background: cat.color || '#f8fafc'}}>
                {cat.image ? <img src={cat.image} alt={cat.name}/> : <Tag size={20} style={{color:'#10b981'}}/>}
               </div>

               <div className="cat-text-meta">
                <b>{cat.name}</b>
                <small>
                 <span>Slug: <code>/{cat.slug}</code></span>
                 {isTopThree && <span className="cat-top-tag">● High Visibility</span>}
                </small>
               </div>
              </div>

              {/* Right: Reorder Actions */}
              <div className="cat-right-tools">
               {/* Coming Soon Toggle */}
               <button
                type="button"
                onClick={()=>toggleCategoryComingSoon(cat.slug)}
                className={`enhanced-toggle-btn ${(currentHomeLayout.comingSoonCategories||[]).includes(cat.slug)?'is-coming-soon':'is-not-coming-soon'}`}
                style={{padding:'5px 10px',fontSize:'11px',height:'32px'}}
                title="Toggle Coming Soon status for this category"
               >
                <Clock3 size={13}/>
                {(currentHomeLayout.comingSoonCategories||[]).includes(cat.slug)?'Soon: ON':'Soon: OFF'}
               </button>

               {/* Quick Top Button */}
               <button
                type="button"
                disabled={globalIdx === 0}
                onClick={() => setCategoryPosition(cat.slug, 0)}
                className="cat-btn-top"
                title="Move category to #1 position"
               >
                ⏫ Top
               </button>

               {/* Up Button */}
               <button
                type="button"
                disabled={globalIdx === 0}
                onClick={() => moveCategory(cat.slug, -1)}
                className="cat-btn-nav"
                title="Move Up"
                aria-label={`Move ${cat.name} up`}
               >
                <ArrowUp size={15}/>
               </button>

               {/* Down Button */}
               <button
                type="button"
                disabled={globalIdx === sortedCats.length - 1}
                onClick={() => moveCategory(cat.slug, 1)}
                className="cat-btn-nav"
                title="Move Down"
                aria-label={`Move ${cat.name} down`}
               >
                <ArrowDown size={15}/>
               </button>
              </div>
             </div>
            );
           })}
          </div>
         </>
        );
       })()}
      </section>
     )}
    </>
   )}

   {/* TAB 3: LEGAL & GRIEVANCE */}
   {activeTab==='legal'&&(
    <section className="admin-card">
     <SectionTitle icon={Building2} title="Legal corporate entity & statutory details" text="Required by Ministry of Consumer Affairs under Consumer Protection (E-Commerce) Rules, 2020."/>
     <div style={{fontSize:'12px',color:'#1e293b',marginBottom:'16px',background:'#f0fdf4',padding:'12px 14px',borderRadius:'8px',border:'1px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
       <CheckCircle2 size={16} style={{color:'#16a34a',flexShrink:0}}/>
       <span>
        <b>Live Customer Desk Sync:</b> These company, support hotline, and address details power your <Link to="/contact" target="_blank" style={{color:'#16a34a',fontWeight:700}}>Contact Us Page (/contact)</Link>, footer, and legal policies in real time.
       </span>
      </div>
      <Link to="/contact" target="_blank" style={{fontSize:'12px',fontWeight:700,color:'#16a34a',display:'inline-flex',alignItems:'center',gap:'4px'}}>
       Preview /contact <ExternalLink size={12}/>
      </Link>
     </div>
     <div className="form-grid">
      <Field required label="Registered corporate entity name" value={settings.policies.legalName} onChange={e=>changePolicyTop('legalName',e.target.value)} placeholder="e.g. R2Cart Retail Pvt. Ltd."/>
      <Field required label="Statutory support hotline" value={settings.policies.supportPhone} onChange={e=>changePolicyTop('supportPhone',e.target.value)} placeholder="+91 80000 10001"/>
      <Field required type="email" label="Customer support email" value={settings.policies.supportEmail} onChange={e=>changePolicyTop('supportEmail',e.target.value)} placeholder="support@r2cart.in"/>
      <Field required label="Support operational hours" value={settings.policies.supportHours} onChange={e=>changePolicyTop('supportHours',e.target.value)} placeholder="07:00 AM – 11:00 PM IST (Daily)"/>
      <Field required label="Registered corporate office address" value={settings.policies.officeAddress} onChange={e=>changePolicyTop('officeAddress',e.target.value)} placeholder="Bailey Road, Patna, Bihar — 800001, India"/>
      <Field required label="Primary dark store fulfillment hub" value={settings.policies.fulfillmentHub} onChange={e=>changePolicyTop('fulfillmentHub',e.target.value)} placeholder="Hathua Service Zone & Patna Central Hub"/>
     </div>

     <div style={{marginTop:'1.75rem',paddingTop:'1.5rem',borderTop:'1px solid var(--line)'}}>
      <SectionTitle icon={ShieldCheck} title="Statutory Grievance Redressal Officer" text="Appointed officer responsible for resolving consumer disputes under Rule 5(6) of E-Commerce Rules, 2020."/>
      <div className="form-grid">
       <Field required label="Officer full name" value={settings.policies.grievanceOfficerName} onChange={e=>changePolicyTop('grievanceOfficerName',e.target.value)} placeholder="Mr. Nadeem Ahmad"/>
       <Field required label="Officer designation & role" value={settings.policies.grievanceOfficerRole} onChange={e=>changePolicyTop('grievanceOfficerRole',e.target.value)} placeholder="Grievance Redressal Officer & Operations Lead"/>
       <Field required type="email" label="Direct grievance email" value={settings.policies.grievanceOfficerEmail} onChange={e=>changePolicyTop('grievanceOfficerEmail',e.target.value)} placeholder="grievance@r2cart.in"/>
       <Field required label="Direct grievance contact number" value={settings.policies.grievanceOfficerPhone} onChange={e=>changePolicyTop('grievanceOfficerPhone',e.target.value)} placeholder="+91 80000 10001"/>
       <label className="full">
        <span>Grievance redressal physical correspondence address</span>
        <textarea required value={settings.policies.grievanceOfficerAddress} onChange={e=>changePolicyTop('grievanceOfficerAddress',e.target.value)} placeholder="Physical address where statutory legal notices may be served."/>
       </label>
      </div>
     </div>
    </section>
   )}

   {/* TAB 4: POLICY PAGES CMS (9 PAGES) */}
   {activeTab==='policies'&&(
    <section className="admin-card">
     <SectionTitle icon={FileText} title="Legal Policy Pages CMS (9 Complete Pages)" text="Customize the exact wording, header meta pills, and custom clauses across all 9 statutory store policies."/>

     {/* Policy Selector Pills */}
     <div className="cms-nav-grid" style={{display:'flex',flexWrap:'wrap',gap:'10px 12px',marginBottom:'24px'}}>
      {policyNav.map(navItem=>{
       const isCurrent=navItem.type===policyKey;
       return (
        <button
         key={navItem.type}
         type="button"
         className={`cms-nav-btn ${isCurrent?'active':''}`}
         onClick={()=>setPolicyKey(navItem.type)}
        >
         <span>{navItem.label}</span>
         <small>{navItem.path}</small>
        </button>
       );
      })}
     </div>

     {/* Active Policy Header & Reset */}
     <div className="cms-policy-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px',padding:'14px 16px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0',marginBottom:'20px'}}>
      <div>
       <b style={{fontSize:'15px',color:'#0f172a'}}>Currently Editing: {selectedNavItem.label}</b>
       <small style={{display:'block',color:'var(--muted)'}}>Publishes live at {selectedNavItem.path}</small>
      </div>
      <div className="row gap" style={{alignItems:'center',flexWrap:'wrap'}}>
       <Button type="button" variant="outline" onClick={()=>resetPolicyPage(policyKey)} title="Restore statutory baseline template" style={{fontSize:'12px',height:'36px'}}>
        <RotateCcw size={14}/> Reset to template
       </Button>
       <Link to={selectedNavItem.path} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px',fontWeight:700,color:'#2563eb',display:'inline-flex',alignItems:'center',gap:'4px',padding:'8px 12px',borderRadius:'6px',background:'#eff6ff',border:'1px solid #bfdbfe',textDecoration:'none'}}>
        Live preview <ExternalLink size={13}/>
       </Link>
       <Button type="button" disabled={saving} onClick={()=>savePolicyNow(policyKey)} style={{fontSize:'12px',height:'36px',background:'#059669',color:'#fff',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'6px'}}>
        {saving?<LoaderCircle className="spin" size={14}/>:<Save size={14}/>} Save & Publish
       </Button>
      </div>
     </div>

     {/* Policy Fields */}
     <div className="form-grid">
      <Field
       required
       label="Page Main Headline (H1)"
       value={currentPolicyPage.title||''}
       onChange={e=>changePolicyPage(policyKey,'title',e.target.value)}
       placeholder="e.g. Privacy Policy"
      />
      <Field
       required
       label="Category / Eyebrow Badge"
       value={currentPolicyPage.eyebrow||''}
       onChange={e=>changePolicyPage(policyKey,'eyebrow',e.target.value)}
       placeholder="e.g. LEGAL & DATA PRIVACY"
      />
      <label className="full">
       <span>Page Overview / Introduction Paragraph</span>
       <textarea
        required
        value={currentPolicyPage.intro||''}
        onChange={e=>changePolicyPage(policyKey,'intro',e.target.value)}
        placeholder="Introductory text describing this policy…"
        style={{minHeight:'90px'}}
       />
      </label>
      <label className="full">
       <span>Header Meta Badges (comma-separated)</span>
       <input
        value={currentPolicyPage.metaTags||''}
        onChange={e=>changePolicyPage(policyKey,'metaTags',e.target.value)}
        placeholder="e.g. Strict 5 km Radius, 15–30 Mins Delivery, Instant Handover"
       />
       <small>Each item separated by a comma will render as a verification pill badge on the page header.</small>
      </label>
      <label className="full">
       <span>Custom Policy Notice / Specific Store Clauses (Optional)</span>
       <textarea
        value={currentPolicyPage.customText||''}
        onChange={e=>changePolicyPage(policyKey,'customText',e.target.value)}
        placeholder="Add any custom rules, exceptions, operational notes, or specific store terms here. If filled, this appears in a highlighted card at the top of the policy page."
        style={{minHeight:'90px'}}
       />
       <small>Use this to write custom rules specific to your store. Appears in a dedicated notice card at the top of the policy page.</small>
      </label>
     </div>

     {/* Policy Sections & Clauses List */}
     <div style={{marginTop:'28px',paddingTop:'22px',borderTop:'1px solid var(--line)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
       <div>
        <h4 style={{margin:0,fontSize:'15px',fontWeight:800,color:'#0f172a'}}>
         Policy Clauses & Structured Sections ({currentSections.length})
        </h4>
        <p style={{margin:'2px 0 0',fontSize:'12px',color:'var(--muted)'}}>
         Customize the numbered sections, headings, clause paragraphs, and bullet points displayed on the live customer page.
        </p>
       </div>
       <Button type="button" variant="outline" onClick={()=>addPolicySection(policyKey)} style={{fontSize:'12px',height:'34px',display:'inline-flex',alignItems:'center',gap:'5px'}}>
        <Plus size={14}/> Add Clause / Section
       </Button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
       {currentSections.map((sec,idx)=>(
        <div key={idx} style={{background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.03)'}}>
         <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',paddingBottom:'8px',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
           <span style={{background:'#e0f2fe',color:'#0369a1',fontWeight:800,fontSize:'11px',padding:'2px 8px',borderRadius:'5px'}}>
            Clause {String(idx + 1).padStart(2,'0')}
           </span>
           <b style={{fontSize:'13px',color:'#1e293b'}}>{sec.title || 'Untitled Section'}</b>
          </div>
          <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
           <button
            type="button"
            disabled={idx===0}
            onClick={()=>movePolicySection(policyKey,idx,-1)}
            className="icon-btn"
            title="Move Up"
            style={{opacity:idx===0?0.3:1}}
           >
            <MoveUp size={14}/>
           </button>
           <button
            type="button"
            disabled={idx===currentSections.length-1}
            onClick={()=>movePolicySection(policyKey,idx,1)}
            className="icon-btn"
            title="Move Down"
            style={{opacity:idx===currentSections.length-1?0.3:1}}
           >
            <MoveDown size={14}/>
           </button>
           <button
            type="button"
            onClick={()=>removePolicySection(policyKey,idx)}
            className="icon-btn text-danger"
            title="Delete Section"
           >
            <Trash2 size={14}/>
           </button>
          </div>
         </div>

         <div style={{display:'grid',gap:'12px'}}>
          <label style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'11.5px',fontWeight:700}}>
           <span>Section Heading (Title)</span>
           <input
            value={sec.title || ''}
            onChange={e=>updatePolicySection(policyKey,idx,'title',e.target.value)}
            placeholder="e.g. 1. Account Eligibility & Responsibilities"
            style={{padding:'7px 10px',fontSize:'13px'}}
           />
          </label>

          <label style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'11.5px',fontWeight:700}}>
           <span>Section Clause Description (Body Text)</span>
           <textarea
            value={sec.text || ''}
            onChange={e=>updatePolicySection(policyKey,idx,'text',e.target.value)}
            placeholder="Write the full description or clause wording here…"
            style={{minHeight:'65px',padding:'7px 10px',fontSize:'12.5px',lineHeight:'1.5'}}
           />
          </label>

          <label style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'11.5px',fontWeight:700}}>
           <span>Bullet Points (Optional - 1 bullet point per line)</span>
           <textarea
            value={Array.isArray(sec.bullets)?sec.bullets.join('\n'):(sec.bullets||'')}
            onChange={e=>updatePolicySection(policyKey,idx,'bullets',e.target.value.split('\n'))}
            placeholder="First bullet point&#10;Second bullet point&#10;Third bullet point"
            style={{minHeight:'60px',padding:'7px 10px',fontSize:'12px',lineHeight:'1.5'}}
           />
           <small style={{fontSize:'10.5px',color:'var(--muted)'}}>Each new line in this box renders as an item with a green check dot on the customer page.</small>
          </label>
         </div>
        </div>
       ))}

       {!currentSections.length&&(
        <div style={{padding:'24px',textAlign:'center',background:'#f8fafc',borderRadius:'8px',border:'1px dashed #cbd5e1',color:'var(--muted)',fontSize:'13px'}}>
         No sections in this policy yet. Click below to add your first clause or click "Reset to template" to load standard legal clauses.
        </div>
       )}

       <Button
        type="button"
        variant="outline"
        onClick={()=>addPolicySection(policyKey)}
        style={{height:'42px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontWeight:700,borderStyle:'dashed'}}
       >
        <Plus size={16}/> Add New Policy Clause / Section
       </Button>
      </div>
     </div>

     {policyKey==='contact'&&(
      <div style={{fontSize:'12px',color:'#1e293b',marginTop:'20px',background:'#eff6ff',padding:'12px 14px',borderRadius:'8px',border:'1px solid #bfdbfe',display:'flex',alignItems:'flex-start',gap:'10px'}}>
       <Info size={16} style={{color:'#2563eb',flexShrink:0,marginTop:2}}/>
       <div>
        <b>Real-Time Contact Channels Sync:</b> The customer helpline ({settings.policies.supportPhone || settings.contactNumber}), support email ({settings.policies.supportEmail || settings.email}), operational hours ({settings.policies.supportHours || 'Daily'}), and registered office address shown on your <Link to="/contact" target="_blank" style={{color:'#2563eb',fontWeight:700}}>Contact Us Page (/contact)</Link> are live and managed from <button type="button" onClick={()=>setActiveTab('legal')} style={{background:'none',border:'none',padding:0,color:'#2563eb',fontWeight:700,cursor:'pointer',textDecoration:'underline'}}>Company & Grievance Details</button> and <button type="button" onClick={()=>setActiveTab('general')} style={{background:'none',border:'none',padding:0,color:'#2563eb',fontWeight:700,cursor:'pointer',textDecoration:'underline'}}>Store Profile</button>. Messages sent through the contact form are logged directly to your <Link to="/admin/support" style={{color:'#2563eb',fontWeight:700}}>Support Desk</Link>.
       </div>
      </div>
     )}
    </section>
   )}

   {/* TAB 5: ADMIN SECURITY */}
   {activeTab==='security'&&(
    <section className="admin-card">
     <SectionTitle icon={KeyRound} title="Admin login & security" text="Manage your administrator password and login credentials."/>
     
     <div style={{
       background: '#f0fdf4',
       border: '1px solid #bbf7d0',
       padding: '12px 16px',
       borderRadius: '8px',
       marginBottom: '20px',
       fontSize: '13px',
       color: '#166534',
       display: 'flex',
       alignItems: 'center',
       gap: '10px'
     }}>
       <ShieldCheck size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
       <span>
         <b>Full Authority Granted:</b> You can update your Login Email (ID) and Password here. To safeguard your account, confirm your current password when making changes.
       </span>
     </div>

     <div className="form-grid">
      <label>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span>Admin Login Email (ID)</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          Editable Login ID
        </span>
       </div>
       <input
        type="email"
        required
        value={adminEmail}
        onChange={e => setAdminEmail(e.target.value)}
        placeholder="admin@example.com"
       />
       <small>Primary administrator account email used to sign in.</small>
      </label>
      <PasswordField
        required
        label="Current password"
        value={currentPassword}
        onChange={e=>setCurrentPassword(e.target.value)}
        placeholder="Enter current password to authorize"
        show={showCurrent}
        onToggle={()=>setShowCurrent(!showCurrent)}
      />
      <PasswordField
        label="New password (optional)"
        value={newPassword}
        onChange={e=>setNewPassword(e.target.value)}
        placeholder="Minimum 8 characters (letters & numbers)"
        show={showNew}
        onToggle={()=>setShowNew(!showNew)}
      />
      <PasswordField
        label="Confirm new password"
        value={confirmPassword}
        onChange={e=>setConfirmPassword(e.target.value)}
        placeholder="Re-enter new password"
        show={showConfirm}
        onToggle={()=>setShowConfirm(!showConfirm)}
      />
     </div>
     <div style={{marginTop:'1.25rem',display:'flex',justifyContent:'flex-end'}}>
      <Button
        type="button"
        disabled={pwdSaving || !currentPassword || (!newPassword && adminEmail.trim().toLowerCase() === initialAdminEmail.toLowerCase())}
        onClick={updateCredentials}
      >
       {pwdSaving ? <LoaderCircle className="spin"/> : <ShieldCheck/>} {pwdSaving ? 'Saving credentials…' : 'Save Credentials (ID / Password)'}
      </Button>
     </div>
    </section>
   )}

   {/* Save Bar Sticky Footer */}
   <div className="settings-savebar">
    <div>
     <b>{dirty?'You have unsaved changes':'All changes are saved'}</b>
     <small>{saved?.updatedAt?`Last saved ${new Date(saved.updatedAt).toLocaleString('en-IN')}`:'Settings are stored in MySQL.'}</small>
    </div>
    <div className="row gap">
     <Button type="button" variant="ghost" disabled={!dirty||saving} onClick={()=>setSettings(normalize(saved))}>
      <RefreshCcw/> Discard
     </Button>
     <Button disabled={!dirty||saving||uploading}>
      {saving?<LoaderCircle className="spin"/>:<Save/>} {saving?'Saving…':'Save changes'}
     </Button>
    </div>
   </div>
     {/* TAB 5: EMERGENCY STORE PAUSE */}
   {activeTab==='emergency'&&(
    <section className="admin-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
      <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
      <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Emergency Management has its own Dedicated Module</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '540px', margin: '0 auto 24px', fontSize: '14px', lineHeight: 1.6 }}>
        To ensure clear separation between regular store operations and urgent crisis pauses, Emergency Management is now accessed via its own dedicated section with real-time controls, multi-village suspensions, auto-expiration, and activity audit logs.
      </p>
      <Link to="/admin/emergency">
        <Button style={{ background: '#ef4444', color: '#fff' }}>
          Open Emergency Management Dashboard →
        </Button>
      </Link>
    </section>
   )}
  </form>
 </>;
}

const Header=({action})=><div className="admin-title"><div><h1>Store Settings & Storefront Layout</h1><p>Manage storefront homepage layout, banner placements, store profile & branding, and statutory legal CMS.</p></div>{action}</div>;
const Notification=({checked,onChange,title,text})=><label className="switch-row"><span><b>{title}</b><small>{text}</small></span><input type="checkbox" checked={checked} onChange={onChange}/><i/></label>;
