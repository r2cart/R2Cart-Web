import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {
 BellRing,Building2,Clock3,Eye,EyeOff,FileText,Image as ImageIcon,
 KeyRound,LoaderCircle,RefreshCcw,Save,ShieldCheck,Store,Trash2,
 Upload,ExternalLink,RotateCcw,Truck,XCircle,AlertCircle,Cookie,Phone,CheckCircle2,
 LayoutTemplate,ArrowUp,ArrowDown,Sliders,Sparkles,Layers,Grid,ShoppingBag,
 Tag,Check,MoveUp,MoveDown,Info,ShieldAlert,AlertOctagon,CalendarClock,Plus
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
   title:'Fresh Daily Essentials, Delivered Fast.',
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

export function AdminSettings(){
 const {notify}=useApp();
 const location=useLocation();
 const [activeTab,setActiveTab]=useState(()=>{
  if(location.pathname.includes('/storefront'))return 'storefront';
  if(location.pathname.includes('/policies'))return 'policies';
  return 'general';
 });
 const [policyKey,setPolicyKey]=useState('privacy');

 const [settings,setSettings]=useState(null);
 const [saved,setSaved]=useState(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState(false);

 const [bannersList,setBannersList]=useState([]);
 const [categoriesList,setCategoriesList]=useState([]);

 const [adminEmail,setAdminEmail]=useState('r2cartsupport@gmail.com');
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

 const load=async()=>{
  setLoading(true);
  try{
   const [data,bans,cats]=await Promise.all([
    adminService.settings().then(normalize),
    adminService.banners().catch(()=>[]),
    adminService.categories().catch(()=>[])
   ]);
   setSettings(data);
   setSaved(data);
   setBannersList(bans);
   setCategoriesList(cats);
   try{
    const prof=await adminService.getProfile();
    if(prof?.email)setAdminEmail(prof.email);
   }catch{}
  }catch(error){
   notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 useEffect(()=>{load()},[]);

 const updatePassword=async()=>{
  if(!currentPassword)return notify('Enter your current password','error');
  if(newPassword.length<8)return notify('New password must be at least 8 characters with letters & numbers','error');
  if(newPassword!==confirmPassword)return notify('New passwords do not match','error');
  setPwdSaving(true);
  try{
   await adminService.changePassword(currentPassword,newPassword);
   notify('Password changed successfully! Keep it safe.');
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
  }catch(err){
   notify(err.message,'error');
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
   setSettings(data);
   setSaved(data);
   window.dispatchEvent(new Event('grocify:settings-updated'));
   window.dispatchEvent(new Event('grocify:delivery-updated'));
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

 const moveCategory=(index,direction)=>{
  const currentCats=categoriesList.length?categoriesList:[];
  const currentOrder=settings.policies?.homeLayout?.categoryOrder?.length
   ?[...settings.policies.homeLayout.categoryOrder]
   :currentCats.map(c=>c.slug);
  const target=index+direction;
  if(target<0||target>=currentOrder.length)return;
  const temp=currentOrder[index];
  currentOrder[index]=currentOrder[target];
  currentOrder[target]=temp;
  changeHomeLayout(layout=>({...layout,categoryOrder:currentOrder}));
 };

 const resetToDefaultLayout=()=>{
  changeHomeLayout(defaultHomeLayout);
  notify('Reset storefront homepage layout to default sequence');
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
   setSettings(data);
   setSaved(data);
   window.dispatchEvent(new Event('grocify:settings-updated'));
   window.dispatchEvent(new Event('grocify:delivery-updated'));
   notify('Store settings, storefront layout and policy CMS saved');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setSaving(false);
  }
 };

 if(loading)return <><Header/><div className="admin-card settings-loading"><LoaderCircle className="spin"/><b>Loading store settings & CMS…</b><small>Fetching configuration from the database.</small></div></>;
 if(!settings)return <><Header/><div className="admin-card settings-loading"><b>Settings could not be loaded</b><small>Check the backend connection and try again.</small><Button type="button" variant="outline" onClick={load}><RefreshCcw/> Try again</Button></div></>;

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
     {/* Control Center Banner */}
     <section className="admin-card storefront-hero-card">
      <div className="between" style={{alignItems:'flex-start',flexWrap:'wrap',gap:'14px',width:'100%'}}>
       <div style={{flex:'1 1 320px',minWidth:0}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(16,185,129,0.12)',color:'#10b981',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:700,marginBottom:'8px'}}>
         <Sparkles size={14}/> STOREFRONT HOMEPAGE CONTROLLER
        </div>
        <h2 style={{fontSize:'1.35rem',fontWeight:800,color:'var(--ink)',margin:'0 0 6px'}}>Customer Homepage Layout & Placements</h2>
        <p style={{margin:0,color:'var(--muted)',fontSize:'13.5px',maxWidth:'780px',lineHeight:1.5}}>
         Admin has full control over what appears on the customer's screen: turn sections on or off, set their top-to-bottom order numbering, rename sections (like “Offers picked for you”), and designate which banners appear in the top Hero Carousel vs the horizontal campaign rail.
        </p>
       </div>
       <Button type="button" variant="outline" onClick={resetToDefaultLayout} style={{gap:'6px',flexShrink:0}}>
        <RotateCcw size={15}/> Reset to default layout
       </Button>
      </div>

      {/* Live Order Visual Strip */}
      <div style={{marginTop:'20px',paddingTop:'18px',borderTop:'1px solid var(--line)'}}>
       <span style={{fontSize:'11.5px',fontWeight:700,letterSpacing:'0.05em',textTransform:'uppercase',color:'var(--muted)',display:'block',marginBottom:'10px'}}>
        Live Storefront Section Sequence:
       </span>
       <div className="layout-preview-strip">
        {sectionsList.map((sec,idx)=>(
         <span key={sec.id} className={`layout-chip ${sec.enabled?'is-enabled':'is-disabled'}`} title={sec.description}>
          <b className="chip-num">#{sec.order}</b>
          <span className="chip-name">{sec.title||sec.label}</span>
          <i className="chip-status">{sec.enabled?'ON':'OFF'}</i>
         </span>
        ))}
       </div>
      </div>
     </section>

     {/* SECTIONS NUMBERING, REORDERING & VISIBILITY */}
     <section className="admin-card">
      <SectionTitle icon={Layers} title="Homepage Sections Ordering & Visibility" text="Reorder sections using Up/Down arrows or direct sequence numbering. Toggle visibility to show or hide sections from the storefront."/>

      <div className="layout-sections-list">
       {sectionsList.map((sec,index)=>(
        <article key={sec.id} className={`layout-section-item ${sec.enabled?'active':'disabled'}`}>
         <div className="layout-item-header">
          <div className="layout-order-tools">
           <span className="layout-order-badge">#{sec.order}</span>
           <div className="layout-arrow-btns">
            <button
             type="button"
             disabled={index===0}
             onClick={()=>moveSection(index,-1)}
             aria-label={`Move ${sec.label} up`}
             className="layout-btn-arrow"
            >
             <ArrowUp size={14}/>
            </button>
            <button
             type="button"
             disabled={index===sectionsList.length-1}
             onClick={()=>moveSection(index,1)}
             aria-label={`Move ${sec.label} down`}
             className="layout-btn-arrow"
            >
             <ArrowDown size={14}/>
            </button>
           </div>
           <label className="layout-seq-label" title="Direct sequence order">
            <span>Seq:</span>
            <input
             type="number"
             min="1"
             max="20"
             value={sec.order}
             onChange={e=>setSectionOrder(sec.id,e.target.value)}
             className="layout-seq-input"
            />
           </label>
          </div>

          <div className="layout-item-info">
           <div className="layout-item-title-row">
            <h4>{sec.label}</h4>
            <span className={`layout-badge-pill ${sec.enabled?'badge-on':'badge-off'}`}>
             {sec.enabled?'● Active on screen':'○ Hidden from screen'}
            </span>
           </div>
           <p className="layout-item-desc">{sec.description}</p>
          </div>

          <div className="layout-item-actions">
           <Button
            type="button"
            variant={sec.enabled?'outline':'ghost'}
            className={sec.enabled?'':'text-muted'}
            onClick={()=>toggleSection(sec.id)}
            style={{gap:'6px',fontSize:'13px'}}
           >
            {sec.enabled?<EyeOff size={15}/>:<Eye size={15}/>}
            {sec.enabled?'Hide section':'Show section'}
           </Button>
          </div>
         </div>

         {/* Editable Parameters for this section */}
         {sec.enabled&&(
          <div className="layout-item-controls">
           {/* Section Custom Title & Subtitle */}
           {sec.id==='campaignOffers'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Offers picked for you'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Offers picked for you"
             />
             <Field
              label="Section Subtitle"
              value={sec.subtitle||'Fresh deals, updated from R2Cart'}
              onChange={e=>updateSectionField(sec.id,'subtitle',e.target.value)}
              placeholder="Fresh deals, updated from R2Cart"
             />
            </div>
           )}

           {sec.id==='shopCategories'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Shop by category'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Shop by category"
             />
             <Field
              label="Section Subtitle"
              value={sec.subtitle||'Everything your home needs'}
              onChange={e=>updateSectionField(sec.id,'subtitle',e.target.value)}
              placeholder="Everything your home needs"
             />
            </div>
           )}

           {sec.id==='bestSellers'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Best sellers'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Best sellers"
             />
             <Field
              type="number"
              min="2"
              max="30"
              label="Display Product Count"
              value={sec.count||10}
              onChange={e=>updateSectionField(sec.id,'count',Number(e.target.value))}
              hint="Maximum products to show in this rail"
             />
            </div>
           )}

           {sec.id==='recommended'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Recommended for you'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Recommended for you"
             />
             <Field
              type="number"
              min="2"
              max="30"
              label="Display Product Count"
              value={sec.count||10}
              onChange={e=>updateSectionField(sec.id,'count',Number(e.target.value))}
              hint="Maximum recommended products to show"
             />
            </div>
           )}

           {sec.id==='promoStrip'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Eyebrow Tag"
              value={sec.tag||'YOUR SAVINGS'}
              onChange={e=>updateSectionField(sec.id,'tag',e.target.value)}
              placeholder="YOUR SAVINGS"
             />
             <Field
              label="Main Heading"
              value={sec.title||'Stock up. Save more.'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Stock up. Save more."
             />
             <Field
              className="full"
              label="Description Subtitle"
              value={sec.subtitle||'Explore the current offers available for your basket.'}
              onChange={e=>updateSectionField(sec.id,'subtitle',e.target.value)}
              placeholder="Explore the current offers available for your basket."
             />
             <Field
              label="Button Label"
              value={sec.buttonText||'Explore offers'}
              onChange={e=>updateSectionField(sec.id,'buttonText',e.target.value)}
              placeholder="Explore offers"
             />
             <Field
              label="Button Destination"
              value={sec.buttonLink||'/coupons'}
              onChange={e=>updateSectionField(sec.id,'buttonLink',e.target.value)}
              placeholder="/coupons"
             />
            </div>
           )}

           {sec.id==='categoryRails'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              type="number"
              min="1"
              max="20"
              label="Maximum Category Rails"
              value={sec.maxCategories||8}
              onChange={e=>updateSectionField(sec.id,'maxCategories',Number(e.target.value))}
              hint="How many categories to show as full horizontal product rails"
             />
            </div>
           )}

           {sec.id==='specialOffers'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Special offers'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Special offers"
             />
             <Field
              type="number"
              min="2"
              max="30"
              label="Display Product Count"
              value={sec.count||10}
              onChange={e=>updateSectionField(sec.id,'count',Number(e.target.value))}
             />
            </div>
           )}

           {sec.id==='recentlyViewed'&&(
            <div className="form-grid" style={{marginTop:'12px'}}>
             <Field
              label="Section Heading"
              value={sec.title||'Recently viewed'}
              onChange={e=>updateSectionField(sec.id,'title',e.target.value)}
              placeholder="Recently viewed"
             />
             <Field
              type="number"
              min="2"
              max="20"
              label="Display Product Count"
              value={sec.count||8}
              onChange={e=>updateSectionField(sec.id,'count',Number(e.target.value))}
             />
            </div>
           )}
          </div>
         )}
        </article>
       ))}
      </div>
     </section>

     {/* BANNERS PLACEMENT CONTROLLER ("kon sa banner ko sa carasoul") */}
     <section className="admin-card">
      <div className="between" style={{marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
       <SectionTitle icon={ImageIcon} title="Storefront Banner Placements" text="Designate where each banner appears: Hero Banner Carousel (Top) vs “Offers picked for you” horizontal campaign rail."/>
       <Link to="/admin/banners" style={{fontSize:'13px',fontWeight:700,color:'var(--green)',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'4px'}}>
        Manage Banners & Images →
       </Link>
      </div>

      {!bannersList.length?(
       <div style={{padding:'20px',background:'rgba(0,0,0,0.02)',borderRadius:'10px',textAlign:'center',color:'var(--muted)'}}>
        No storefront banners found. <Link to="/admin/banners" style={{color:'var(--green)',fontWeight:700}}>Create your first banner here</Link>.
       </div>
      ):(
       <div className="layout-banners-grid">
        {bannersList.map((banner,idx)=>{
         const currentPlacement=bannerPlacements[banner.id]||(idx<2?'HERO':'CAMPAIGN');
         return (
          <div key={banner.id} className="layout-banner-card">
           <div
            className="layout-banner-preview"
            style={banner.image?{backgroundImage:`linear-gradient(90deg,rgba(6,46,31,.88),rgba(6,46,31,.2)),url(${banner.image})`}:undefined}
           >
            <span className="layout-banner-kicker">{banner.kicker||'OFFER'}</span>
            <h4>{banner.heading}</h4>
            <p>{banner.subtitle}</p>
            <small>{banner.destination||'/'}</small>
           </div>

           <div className="layout-banner-controls">
            <span style={{fontSize:'12px',fontWeight:700,color:'var(--ink)',display:'block',marginBottom:'6px'}}>
             Placement on Storefront:
            </span>
            <div className="placement-options">
             <button
              type="button"
              className={`placement-pill ${currentPlacement==='HERO'?'active':''}`}
              onClick={()=>setBannerPlacement(banner.id,'HERO')}
             >
              👑 Top Hero Carousel
             </button>
             <button
              type="button"
              className={`placement-pill ${currentPlacement==='CAMPAIGN'?'active':''}`}
              onClick={()=>setBannerPlacement(banner.id,'CAMPAIGN')}
             >
              🏷️ Offers Picked For You Rail
             </button>
             <button
              type="button"
              className={`placement-pill ${currentPlacement==='BOTH'?'active':''}`}
              onClick={()=>setBannerPlacement(banner.id,'BOTH')}
             >
              🌟 Both Placements
             </button>
            </div>
           </div>
          </div>
         );
        })}
       </div>
      )}
     </section>

     {/* CATEGORY ORDERING & NUMBERING ("kis numbering me category") */}
     <section className="admin-card">
      <div className="between" style={{marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
       <SectionTitle icon={Grid} title="Homepage Category Sequence & Numbering" text="Control the display order of categories in the “Shop by category” capsules and product rails."/>
       <Link to="/admin/categories" style={{fontSize:'13px',fontWeight:700,color:'var(--green)',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'4px'}}>
        Manage Categories & Subcategories →
       </Link>
      </div>

      {(()=>{
       const orderMap=new Map((currentHomeLayout.categoryOrder||[]).map((slug,idx)=>[slug,idx]));
       const sortedCats=[...categoriesList].sort((a,b)=>{
        const posA=orderMap.has(a.slug)?orderMap.get(a.slug):999;
        const posB=orderMap.has(b.slug)?orderMap.get(b.slug):999;
        return posA-posB;
       });

       return (
        <div className="layout-cats-list">
         {sortedCats.map((cat,cIdx)=>(
          <div key={cat.id||cat.slug} className="layout-cat-row">
           <div className="cat-order-num">#{cIdx+1}</div>
           <div className="cat-icon-box" style={{background:cat.color||'rgba(16,185,129,0.1)'}}>
            {cat.image?<img src={cat.image} alt={cat.name}/>:<Tag size={16}/>}
           </div>
           <div className="cat-info">
            <b>{cat.name}</b>
            <small>/{cat.slug}</small>
           </div>
           <div className="cat-actions">
            <button
             type="button"
             disabled={cIdx===0}
             onClick={()=>moveCategory(cIdx,-1)}
             className="layout-btn-arrow"
             aria-label={`Move ${cat.name} up`}
            >
             <ArrowUp size={14}/>
            </button>
            <button
             type="button"
             disabled={cIdx===sortedCats.length-1}
             onClick={()=>moveCategory(cIdx,1)}
             className="layout-btn-arrow"
             aria-label={`Move ${cat.name} down`}
            >
             <ArrowDown size={14}/>
            </button>
           </div>
          </div>
         ))}
        </div>
       );
      })()}
     </section>
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
     <div className="form-grid">
      <label>
       <span>Admin login email</span>
       <input disabled value={adminEmail||'Loading…'} style={{opacity:0.8,background:'rgba(0,0,0,0.03)'}}/>
       <small>Primary administrator account email</small>
      </label>
      <PasswordField required label="Current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Enter current password" show={showCurrent} onToggle={()=>setShowCurrent(!showCurrent)}/>
      <PasswordField required label="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters" show={showNew} onToggle={()=>setShowNew(!showNew)}/>
      <PasswordField required label="Confirm new password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter new password" show={showConfirm} onToggle={()=>setShowConfirm(!showConfirm)}/>
     </div>
     <div style={{marginTop:'1.25rem',display:'flex',justifyContent:'flex-end'}}>
      <Button type="button" disabled={pwdSaving||!currentPassword||!newPassword} onClick={updatePassword}>
       {pwdSaving?<LoaderCircle className="spin"/>:<ShieldCheck/>} {pwdSaving?'Updating password…':'Update password'}
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
