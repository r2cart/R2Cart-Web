import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {
 BellRing,Building2,Clock3,Eye,EyeOff,FileText,Image as ImageIcon,
 KeyRound,LoaderCircle,RefreshCcw,Save,ShieldCheck,Store,Trash2,
 Upload,ExternalLink,RotateCcw,Truck,XCircle,AlertCircle,Cookie,Phone,CheckCircle2
} from 'lucide-react';
import {Button} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import {mediaUrl} from '../../utils/media';
import {policyNav,getPolicyContent} from '../customer/StaticPage';
import {BRAND} from '../../config/brand';

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
 }
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
   }
  }
 };
};

const Field=({label,hint,...props})=><label><span>{label}</span><input {...props}/>{hint&&<small>{hint}</small>}</label>;
const PasswordField=({label,hint,show,onToggle,...props})=><label><span>{label}</span><div style={{position:'relative',display:'flex',alignItems:'center'}}><input {...props} type={show?'text':'password'} style={{width:'100%',paddingRight:'2.5rem'}}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={onToggle} style={{position:'absolute',right:'0.75rem',background:'none',border:'none',cursor:'pointer',padding:'0.25rem',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{hint&&<small>{hint}</small>}</label>;
const SectionTitle=({icon:Icon,title,text})=><div className="settings-section-title"><i><Icon/></i><div><h3>{title}</h3><p>{text}</p></div></div>;

export function AdminSettings(){
 const {notify}=useApp();
 const location=useLocation();
 const [activeTab,setActiveTab]=useState(()=>location.pathname.includes('/policies')?'policies':'general');
 const [policyKey,setPolicyKey]=useState('privacy');

 const [settings,setSettings]=useState(null);
 const [saved,setSaved]=useState(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState(false);

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
  if(location.pathname.includes('/policies'))setActiveTab('policies');
 },[location.pathname]);

 const load=async()=>{
  setLoading(true);
  try{
   const data=normalize(await adminService.settings());
   setSettings(data);
   setSaved(data);
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
   notify('Store settings and legal policy CMS saved to database');
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

 return <>
  <Header action={<span className={`settings-sync ${dirty?'pending':'saved'}`}>{dirty?'Unsaved changes':'Synced with database'}</span>}/>

  {/* Top Navigation Tabs */}
  <div className="tabs admin-tabs" style={{marginBottom:'20px'}}>
   <button type="button" className={activeTab==='general'?'active':''} onClick={()=>setActiveTab('general')}>
    <Store size={16}/>
    <span>Store Identity & Operations</span>
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
      <SectionTitle icon={Clock3} title="Store operations" text="Control store timing and storefront currency. Delivery pricing is managed under Delivery."/>
      <div className="form-grid">
       <Field required type="time" label="Opening time" value={settings.openingTime} onChange={e=>change('openingTime',e.target.value)}/>
       <Field required type="time" label="Closing time" value={settings.closingTime} onChange={e=>change('closingTime',e.target.value)}/>
       <label>
        <span>Currency</span>
        <select value={settings.currency} onChange={e=>change('currency',e.target.value)}>
         <option value="INR">INR — Indian Rupee (₹)</option>
        </select>
        <small>Used for prices and order totals.</small>
       </label>
      </div>
     </section>

     <section className="admin-card">
      <SectionTitle icon={BellRing} title="Admin notifications" text="Choose which operational events should notify the admin team."/>
      <Notification checked={settings.notifications.orders} onChange={()=>toggle('orders')} title="New order notifications" text="Notify admins whenever a customer places an order."/>
      <Notification checked={settings.notifications.stock} onChange={()=>toggle('stock')} title="Low stock alerts" text="Warn the team when inventory reaches its threshold."/>
      <Notification checked={settings.notifications.customers} onChange={()=>toggle('customers')} title="Customer activity notifications" text="Receive important customer account and support updates."/>
     </section>
    </>
   )}

   {/* TAB 2: COMPANY & GRIEVANCE REDRESSAL DETAILS */}
   {activeTab==='legal'&&(
    <>
     <section className="admin-card">
      <SectionTitle icon={Building2} title="Corporate & Legal Entity Details" text="This information is displayed on official invoices, Contact Us, and statutory compliance sections across all 9 policy pages."/>
      <div className="form-grid">
       <Field required label="Corporate Legal Entity Name" value={settings.policies.legalName} onChange={e=>changePolicyTop('legalName',e.target.value)} placeholder="e.g. R2Cart Retail Pvt. Ltd." hint="Official registered company / LLP name under the Companies Act"/>
       <Field required label="Customer Helpline Number" value={settings.policies.supportPhone} onChange={e=>changePolicyTop('supportPhone',e.target.value)} placeholder="+91 80000 10001" hint="Appears on Contact Us helpline and policy headers"/>
       <Field required type="email" label="Official Support Email" value={settings.policies.supportEmail} onChange={e=>changePolicyTop('supportEmail',e.target.value)} placeholder="support@r2cart.in" hint="Customer care and grievance Level 1 contact"/>
       <Field required label="Support Helpline Operating Hours" value={settings.policies.supportHours} onChange={e=>changePolicyTop('supportHours',e.target.value)} placeholder="07:00 AM – 11:00 PM IST (Daily)" hint="Timings displayed on the Contact Us cards"/>
       <label className="full">
        <span>Registered Corporate Office Address</span>
        <textarea required value={settings.policies.officeAddress} onChange={e=>changePolicyTop('officeAddress',e.target.value)} placeholder="Bailey Road, Patna, Bihar — 800001, India" style={{minHeight:'70px'}}/>
        <small>Displayed on statutory consumer disclosures, Grievance Officer card, and website footer.</small>
       </label>
       <label className="full">
        <span>Fulfillment Hubs & Service Localities</span>
        <input required value={settings.policies.fulfillmentHub} onChange={e=>changePolicyTop('fulfillmentHub',e.target.value)} placeholder="Hathua Service Zone & Patna Central Hub"/>
        <small>Referenced in Shipping & Delivery and Contact Us pages.</small>
       </label>
      </div>
     </section>

     <section className="admin-card">
      <SectionTitle icon={ShieldCheck} title="Designated Grievance Redressal Officer" text="Statutory requirement under Information Technology Act, 2000 and Consumer Protection (E-Commerce) Rules, 2020."/>
      <div className="form-grid">
       <Field required label="Officer Full Name" value={settings.policies.grievanceOfficerName} onChange={e=>changePolicyTop('grievanceOfficerName',e.target.value)} placeholder="e.g. Mr. Nadeem Ahmad"/>
       <Field required label="Designation / Role" value={settings.policies.grievanceOfficerRole} onChange={e=>changePolicyTop('grievanceOfficerRole',e.target.value)} placeholder="Grievance Redressal Officer & Operations Lead"/>
       <Field required type="email" label="Grievance Redressal Email" value={settings.policies.grievanceOfficerEmail} onChange={e=>changePolicyTop('grievanceOfficerEmail',e.target.value)} placeholder="grievance@r2cart.in"/>
       <Field required label="Officer Phone / Helpline" value={settings.policies.grievanceOfficerPhone} onChange={e=>changePolicyTop('grievanceOfficerPhone',e.target.value)} placeholder="+91 80000 10001"/>
       <label className="full">
        <span>Officer Physical Office Address</span>
        <textarea required value={settings.policies.grievanceOfficerAddress} onChange={e=>changePolicyTop('grievanceOfficerAddress',e.target.value)} placeholder="Bailey Road, Patna, Bihar — 800001, India" style={{minHeight:'70px'}}/>
       </label>
      </div>
     </section>
    </>
   )}

   {/* TAB 3: POLICY PAGES CMS (9 PAGES) */}
   {activeTab==='policies'&&(
    <section className="admin-card">
     <SectionTitle icon={FileText} title="Static & Legal Policies CMS (9 Pages)" text="Customize the titles, introductions, meta badges, and custom clauses for all policy pages. Any changes take effect immediately on your storefront."/>

     {/* 9 Pages Pill Strip */}
     <div className="cms-nav-tabs">
      {policyNav.map(navItem=>{
       const Icon=navItem.icon;
       const isCurrent=navItem.type===policyKey;
       return (
        <button
         key={navItem.type}
         type="button"
         className={`cms-nav-btn ${isCurrent?'active':''}`}
         onClick={()=>setPolicyKey(navItem.type)}
        >
         <Icon size={14}/>
         <span>{navItem.label}</span>
        </button>
       );
      })}
     </div>

     {/* Active Policy Header & Preview Link */}
     <div className="cms-policy-header">
      <div className="row gap">
       <span className="badge badge-green">Editing: {selectedNavItem.label}</span>
       <b>Route: <code>{selectedNavItem.path}</code></b>
      </div>
      <div className="row gap">
       <Button
        type="button"
        variant="ghost"
        onClick={()=>resetPolicyPage(policyKey)}
        title="Restore default legally verified template"
       >
        <RotateCcw size={13}/> Reset template
       </Button>
       <a href={selectedNavItem.path} target="_blank" rel="noopener noreferrer">
        Preview live page <ExternalLink size={13}/>
       </a>
      </div>
     </div>

     {/* Editable Form for Selected Page */}
     <div className="form-grid">
      <Field
       required
       label="Page Title"
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

   {/* TAB 4: ADMIN SECURITY */}
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

const Header=({action})=><div className="admin-title"><div><h1>Store Settings & Legal CMS</h1><p>Manage storefront identity, business operations, grievance redressal, and all 9 legal policy pages.</p></div>{action}</div>;
const Notification=({checked,onChange,title,text})=><label className="switch-row"><span><b>{title}</b><small>{text}</small></span><input type="checkbox" checked={checked} onChange={onChange}/><i/></label>;
