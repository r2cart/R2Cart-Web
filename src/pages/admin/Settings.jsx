import {useEffect,useMemo,useRef,useState} from 'react';
import {BellRing,Clock3,Image as ImageIcon,KeyRound,LoaderCircle,RefreshCcw,Save,ShieldCheck,Store,Trash2,Upload} from 'lucide-react';
import {Button} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import {mediaUrl} from '../../utils/media';

const blank={storeName:'',logo:'',contactNumber:'',email:'',address:'',openingTime:'',closingTime:'',currency:'INR',minimumOrder:'',deliveryFee:'',freeDeliveryThreshold:'',estimatedDelivery:'',notifications:{orders:false,stock:false,customers:false}};
const normalize=value=>({...blank,...value,logo:mediaUrl(value?.logo||''),minimumOrder:value?.minimumOrder??'',deliveryFee:value?.deliveryFee??'',freeDeliveryThreshold:value?.freeDeliveryThreshold??'',notifications:{...blank.notifications,...(value?.notifications||{})}});
const Field=({label,hint,...props})=><label><span>{label}</span><input {...props}/>{hint&&<small>{hint}</small>}</label>;
const SectionTitle=({icon:Icon,title,text})=><div className="settings-section-title"><i><Icon/></i><div><h3>{title}</h3><p>{text}</p></div></div>;

export function AdminSettings(){
 const {notify}=useApp();
 const [settings,setSettings]=useState(null),[saved,setSaved]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
 const [adminEmail,setAdminEmail]=useState('r2cartsupport@gmail.com');
 const [currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[pwdSaving,setPwdSaving]=useState(false);
 const fileRef=useRef(null);
 const load=async()=>{setLoading(true);try{const data=normalize(await adminService.settings());setSettings(data);setSaved(data);try{const prof=await adminService.getProfile();if(prof?.email)setAdminEmail(prof.email)}catch{}}catch(error){notify(error.message,'error')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const updatePassword=async()=>{
  if(!currentPassword)return notify('Enter your current password','error');
  if(newPassword.length<8)return notify('New password must be at least 8 characters with letters & numbers','error');
  if(newPassword!==confirmPassword)return notify('New passwords do not match','error');
  setPwdSaving(true);
  try{await adminService.changePassword(currentPassword,newPassword);notify('Password changed successfully! Keep it safe.');setCurrentPassword('');setNewPassword('');setConfirmPassword('')}catch(err){notify(err.message,'error')}finally{setPwdSaving(false)}
 };
 const dirty=useMemo(()=>settings&&saved&&JSON.stringify(settings)!==JSON.stringify(saved),[settings,saved]);
 const change=(key,value)=>setSettings(current=>({...current,[key]:value}));
 const toggle=key=>setSettings(current=>({...current,notifications:{...current.notifications,[key]:!current.notifications[key]}}));
 const uploadLogo=async event=>{const file=event.target.files?.[0];if(!file)return;setUploading(true);try{const data=await adminService.uploadStoreLogo(file);change('logo',data.url);notify('Logo uploaded. Save changes to publish it.')}catch(error){notify(error.message,'error')}finally{setUploading(false);event.target.value=''}};
 const submit=async event=>{event.preventDefault();setSaving(true);try{const payload={storeName:settings.storeName,logo:settings.logo,contactNumber:settings.contactNumber,email:settings.email,address:settings.address,openingTime:settings.openingTime,closingTime:settings.closingTime,currency:settings.currency,notifications:settings.notifications};const data=normalize(await adminService.saveSettings(payload));setSettings(data);setSaved(data);window.dispatchEvent(new Event('grocify:settings-updated'));notify('Store settings saved to database')}catch(error){notify(error.message,'error')}finally{setSaving(false)}};
 if(loading)return <><Header/><div className="admin-card settings-loading"><LoaderCircle className="spin"/><b>Loading store settings…</b><small>Fetching the latest configuration from the server.</small></div></>;
 if(!settings)return <><Header/><div className="admin-card settings-loading"><b>Settings could not be loaded</b><small>Check the backend connection and try again.</small><Button type="button" variant="outline" onClick={load}><RefreshCcw/> Try again</Button></div></>;
 return <>
  <Header action={<span className={`settings-sync ${dirty?'pending':'saved'}`}>{dirty?'Unsaved changes':'Synced with database'}</span>}/>
  <form className="settings-form proper-settings" onSubmit={submit}>
   <section className="admin-card"><SectionTitle icon={Store} title="Store identity" text="Information customers use to identify and contact your store."/><div className="settings-logo-row"><div className="settings-logo-preview">{settings.logo?<img src={settings.logo} alt="Store logo"/>:<><ImageIcon/><small>No logo</small></>}</div><div><b>Store logo</b><p>Use a square JPG, PNG or WebP image up to 5 MB.</p><div className="row gap"><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadLogo}/><Button type="button" variant="outline" disabled={uploading} onClick={()=>fileRef.current?.click()}>{uploading?<LoaderCircle className="spin"/>:<Upload/>}{uploading?'Uploading…':'Choose logo'}</Button>{settings.logo&&<Button type="button" variant="ghost" className="text-danger" onClick={()=>change('logo','')}><Trash2/> Remove</Button>}</div></div></div><div className="form-grid"><Field required label="Store name" value={settings.storeName} onChange={e=>change('storeName',e.target.value)} placeholder="Your store name"/><Field required label="Contact number" value={settings.contactNumber} onChange={e=>change('contactNumber',e.target.value)} placeholder="Customer support number"/><Field required type="email" label="Store email" value={settings.email} onChange={e=>change('email',e.target.value)} placeholder="support@example.com"/><label className="full"><span>Store address</span><textarea required value={settings.address} onChange={e=>change('address',e.target.value)} placeholder="Complete operating address"/></label></div></section>
   <section className="admin-card"><SectionTitle icon={Clock3} title="Store operations" text="Control store timing and storefront currency. Delivery pricing is managed separately under Delivery."/><div className="form-grid"><Field required type="time" label="Opening time" value={settings.openingTime} onChange={e=>change('openingTime',e.target.value)}/><Field required type="time" label="Closing time" value={settings.closingTime} onChange={e=>change('closingTime',e.target.value)}/><label><span>Currency</span><select value={settings.currency} onChange={e=>change('currency',e.target.value)}><option value="INR">INR — Indian Rupee (₹)</option></select><small>Used for prices and order totals.</small></label></div></section>
   <section className="admin-card"><SectionTitle icon={BellRing} title="Admin notifications" text="Choose which operational events should notify the admin team."/><Notification checked={settings.notifications.orders} onChange={()=>toggle('orders')} title="New order notifications" text="Notify admins whenever a customer places an order."/><Notification checked={settings.notifications.stock} onChange={()=>toggle('stock')} title="Low stock alerts" text="Warn the team when inventory reaches its threshold."/><Notification checked={settings.notifications.customers} onChange={()=>toggle('customers')} title="Customer activity notifications" text="Receive important customer account and support updates."/></section>
   <section className="admin-card">
    <SectionTitle icon={KeyRound} title="Admin login & security" text="Manage your administrator password and login credentials."/>
    <div className="form-grid">
     <label><span>Admin login email</span><input disabled value={adminEmail||'Loading…'} style={{opacity:0.8,background:'rgba(0,0,0,0.03)'}}/><small>Primary administrator account email</small></label>
     <Field required type="password" label="Current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Enter current password"/>
     <Field required type="password" label="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters"/>
     <Field required type="password" label="Confirm new password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter new password"/>
    </div>
    <div style={{marginTop:'1.25rem',display:'flex',justifyContent:'flex-end'}}>
     <Button type="button" disabled={pwdSaving||!currentPassword||!newPassword} onClick={updatePassword}>
      {pwdSaving?<LoaderCircle className="spin"/>:<ShieldCheck/>} {pwdSaving?'Updating password…':'Update password'}
     </Button>
    </div>
   </section>
   <div className="settings-savebar"><div><b>{dirty?'You have unsaved changes':'All changes are saved'}</b><small>{saved?.updatedAt?`Last saved ${new Date(saved.updatedAt).toLocaleString('en-IN')}`:'Settings will be stored in MySQL.'}</small></div><div className="row gap"><Button type="button" variant="ghost" disabled={!dirty||saving} onClick={()=>setSettings(normalize(saved))}><RefreshCcw/> Discard</Button><Button disabled={!dirty||saving||uploading}>{saving?<LoaderCircle className="spin"/>:<Save/>}{saving?'Saving…':'Save changes'}</Button></div></div>
  </form>
 </>;
}
const Header=({action})=><div className="admin-title"><div><h1>Store settings</h1><p>Manage storefront identity, business rules and operational preferences.</p></div>{action}</div>;
const Notification=({checked,onChange,title,text})=><label className="switch-row"><span><b>{title}</b><small>{text}</small></span><input type="checkbox" checked={checked} onChange={onChange}/><i/></label>;
