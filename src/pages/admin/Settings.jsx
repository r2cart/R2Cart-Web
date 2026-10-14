import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {
 BellRing,Building2,Clock3,Eye,EyeOff,FileText,Image as ImageIcon,
 KeyRound,LoaderCircle,RefreshCcw,Save,ShieldCheck,Store,Trash2,
 Upload,ExternalLink,RotateCcw,Truck,XCircle,AlertCircle,Cookie,Phone,CheckCircle2,
 LayoutTemplate,ArrowUp,ArrowDown,Sliders,Sparkles,Layers,Grid,ShoppingBag,
 Tag,Check,MoveUp,MoveDown,Info
} from 'lucide-react';
import {Button} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import {mediaUrl} from '../../utils/media';
import {policyNav,getPolicyContent} from '../customer/StaticPage';
import {BRAND} from '../../config/brand';
import {defaultHomeSections,defaultHomeLayout,normalizeHomeLayout} from '../../config/homeLayout';

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
   intro:'Have questions about your order, want to partner with us, or have feedback? The R2Cart team is here to assist you 7 days a week.',
   metaTags:'Entity: R2Cart Retail Pvt. Ltd., Support: 7:00 AM – 11:00 PM IST, Email: support@r2cart.in',
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
 minimumOrder:'',
 deliveryFee:'',
 freeDeliveryThreshold:'',
 estimatedDelivery:'',
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
  minimumOrder:value?.minimumOrder??'',
  deliveryFee:value?.deliveryFee??'',
  freeDeliveryThreshold:value?.freeDeliveryThreshold??'',
  notifications:{...blank.notifications,...(value?.notifications||{})},
  policies:{
   ...defaultPolicies,
   ...rawPol,
   legalName:rawPol.legalName||defaultPolicies.legalName,
   supportPhone:rawPol.supportPhone||value?.contactNumber||defaultPolicies.supportPhone,
   supportEmail:rawPol.supportEmail||value?.email||defaultPolicies.supportEmail,
   supportHours:rawPol.supportHours||defaultPolicies.supportHours,
   officeAddress:rawPol.officeAddress||value?.address||defaultPolicies.officeAddress,
   fulfillmentHub:rawPol.fulfillmentHub||defaultPolicies.fulfillmentHub,
   grievanceOfficerName:rawPol.grievanceOfficerName||defaultPolicies.grievanceOfficerName,
   grievanceOfficerRole:rawPol.grievanceOfficerRole||defaultPolicies.grievanceOfficerRole,
   grievanceOfficerEmail:rawPol.grievanceOfficerEmail||defaultPolicies.grievanceOfficerEmail,
   grievanceOfficerPhone:rawPol.grievanceOfficerPhone||defaultPolicies.grievanceOfficerPhone,
   grievanceOfficerAddress:rawPol.grievanceOfficerAddress||defaultPolicies.grievanceOfficerAddress,
   customPages:{
    ...defaultPolicies.customPages,
    ...rawCustom
   },
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

 const change=(key,value)=>setSettings(current=>({...current,[key]:value}));
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
      ...(curr.policies.customPages?.[pKey]||defaultPolicies.customPages[pKey]),
      [field]:val
     }
    }
   }
  }));
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
  };
  const standard=getPolicyContent(storeInfo)[pKey]||defaultPolicies.customPages[pKey];
  setSettings(curr=>({
   ...curr,
   policies:{
    ...curr.policies,
    customPages:{
     ...curr.policies.customPages,
     [pKey]:{
      title:standard.title,
      eyebrow:standard.eyebrow,
      intro:standard.intro,
      metaTags:Array.isArray(standard.metaTags)?standard.metaTags.join(', '):standard.metaTags,
      customText:''
     }
    }
   }
  }));
  notify(`Reset ${pKey} page to verified legal template`);
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
    notifications:settings.notifications,
    policies:settings.policies
   };
   const data=normalize(await adminService.saveSettings(payload));
   setSettings(data);
   setSaved(data);
   window.dispatchEvent(new Event('grocify:settings-updated'));
   notify('Store settings, storefront layout and policy CMS saved');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setSaving(false);
  }
 };

 if(loading)return <><Header/><div className="admin-card settings-loading"><LoaderCircle className="spin"/><b>Loading store settings & CMS…</b><small>Fetching configuration from the database.</small></div></>;
 if(!settings)return <><Header/><div className="admin-card settings-loading"><b>Settings could not be loaded</b><small>Check the backend connection and try again.</small><Button type="button" variant="outline" onClick={load}><RefreshCcw/> Try again</Button></div></>;

 const currentPolicyPage=settings.policies.customPages?.[policyKey]||defaultPolicies.customPages[policyKey];
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
    <span>Store Identity & Operations</span>
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
  </div>

  <form className="settings-form proper-settings" onSubmit={submit}>

   {/* TAB 1: GENERAL & STORE IDENTITY */}
   {activeTab==='general'&&(
    <>
     <section className="admin-card">
      <SectionTitle icon={Store} title="Store identity" text="Information customers use to identify and contact your store."/>
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
      <SectionTitle icon={Clock3} title="Operating schedule" text="Opening and closing hours displayed to shoppers."/>
      <div className="form-grid">
       <Field required type="time" label="Opening time" value={settings.openingTime} onChange={e=>change('openingTime',e.target.value)}/>
       <Field required type="time" label="Closing time" value={settings.closingTime} onChange={e=>change('closingTime',e.target.value)}/>
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
      <div className="between" style={{alignItems:'flex-start',flexWrap:'wrap',gap:'14px'}}>
       <div>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(16,185,129,0.12)',color:'#10b981',padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:700,marginBottom:'8px'}}>
         <Sparkles size={14}/> STOREFRONT HOMEPAGE CONTROLLER
        </div>
        <h2 style={{fontSize:'1.35rem',fontWeight:800,color:'var(--ink)',margin:'0 0 6px'}}>Customer Homepage Layout & Placements</h2>
        <p style={{margin:0,color:'var(--muted)',fontSize:'13.5px',maxWidth:'780px',lineHeight:1.5}}>
         Admin has full control over what appears on the customer's screen: turn sections on or off, set their top-to-bottom order numbering, rename sections (like “Offers picked for you”), and designate which banners appear in the top Hero Carousel vs the horizontal campaign rail.
        </p>
       </div>
       <Button type="button" variant="outline" onClick={resetToDefaultLayout} style={{gap:'6px'}}>
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
     <div className="cms-nav-grid" style={{marginBottom:'24px'}}>
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
     <div className="cms-policy-header">
      <div>
       <b>Currently Editing: {selectedNavItem.label}</b>
       <small style={{display:'block',color:'var(--muted)'}}>Publishes live at {selectedNavItem.path}</small>
      </div>
      <div className="row gap" style={{alignItems:'center'}}>
       <Button type="button" variant="ghost" onClick={()=>resetPolicyPage(policyKey)} title="Restore statutory baseline template">
        <RotateCcw size={15}/> Reset to verified template
       </Button>
       <Link to={selectedNavItem.path} target="_blank" rel="noopener noreferrer">
        Live preview <ExternalLink size={13}/>
       </Link>
      </div>
     </div>

     {/* Policy Fields */}
     <div className="form-grid">
      <Field
       required
       label="Page Main Headline (H1)"
       value={currentPolicyPage.title}
       onChange={e=>changePolicyPage(policyKey,'title',e.target.value)}
       placeholder="e.g. Privacy Policy"
      />
      <Field
       required
       label="Category / Eyebrow Badge"
       value={currentPolicyPage.eyebrow}
       onChange={e=>changePolicyPage(policyKey,'eyebrow',e.target.value)}
       placeholder="e.g. LEGAL & DATA PRIVACY"
      />
      <label className="full">
       <span>Page Overview / Introduction Paragraph</span>
       <textarea
        required
        value={currentPolicyPage.intro}
        onChange={e=>changePolicyPage(policyKey,'intro',e.target.value)}
        placeholder="Introductory text describing this policy…"
        style={{minHeight:'90px'}}
       />
      </label>
      <label className="full">
       <span>Header Meta Badges (comma-separated)</span>
       <input
        value={currentPolicyPage.metaTags}
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
        style={{minHeight:'110px'}}
       />
       <small>Use this to write custom rules specific to your store. The standard statutory legal framework continues to serve as the baseline below it.</small>
      </label>
     </div>
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
  </form>
 </>;
}

const Header=({action})=><div className="admin-title"><div><h1>Store Settings & Storefront Layout</h1><p>Manage storefront homepage layout, banner placements, store identity, operations, and statutory legal CMS.</p></div>{action}</div>;
const Notification=({checked,onChange,title,text})=><label className="switch-row"><span><b>{title}</b><small>{text}</small></span><input type="checkbox" checked={checked} onChange={onChange}/><i/></label>;
