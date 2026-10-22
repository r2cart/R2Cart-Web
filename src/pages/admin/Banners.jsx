import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDown,ArrowUp,Edit2,Eye,EyeOff,ImagePlus,LayoutTemplate,LoaderCircle,Plus,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const emptyBanner={kicker:'FRESH DEALS',heading:'',subtitle:'',image:'',ctaText:'Shop now',destination:'/',position:0,status:'ACTIVE',placement:'HERO'};
const AdminTitle=({action})=><div className="admin-title"><div><h1>Banners</h1><p>Manage live storefront campaigns, visibility, placement and display order.</p></div>{action}</div>;

export function AdminBanners(){
 const {notify}=useApp();
 const [list,setList]=useState([]),[storeSettings,setStoreSettings]=useState(null),[loading,setLoading]=useState(true),[edit,setEdit]=useState(null),[remove,setRemove]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const fileRef=useRef(null);

 const load=async()=>{
  setLoading(true);
  setError('');
  try{
   const [banners,settings]=await Promise.all([
    adminService.banners(),
    adminService.settings().catch(()=>null)
   ]);
   setList(banners);
   setStoreSettings(settings);
  }catch(reason){
   setList([]);
   setError(reason.message);
  }finally{
   setLoading(false);
  }
 };

 useEffect(()=>{load()},[]);

 const publish=()=>{
  window.dispatchEvent(new Event('grocify:banners-updated'));
  window.dispatchEvent(new Event('grocify:settings-updated'));
 };

 const save=async event=>{
  event.preventDefault();
  setBusy(true);
  try{
   const values=Object.fromEntries(new FormData(event.currentTarget));
   const payload={
    kicker:values.kicker,
    heading:values.heading,
    subtitle:values.subtitle,
    image:values.image,
    ctaText:values.ctaText,
    destination:values.destination,
    position:Number(values.position),
    status:values.status||'ACTIVE'
   };

   let savedBanner;
   if(edit.id){
    savedBanner=await adminService.updateBanner(edit.id,payload);
   }else{
    savedBanner=await adminService.createBanner(payload);
   }

   const bannerId=edit.id||savedBanner?.id;
   const selectedPlacement=values.placement||edit.placement||'HERO';

   if(bannerId&&storeSettings){
    try{
     const currentLayout=storeSettings.policies?.homeLayout||{};
     const nextLayout={
      ...currentLayout,
      bannerPlacements:{
       ...(currentLayout.bannerPlacements||{}),
       [bannerId]:selectedPlacement
      }
     };
     const nextSettings={
      ...storeSettings,
      policies:{
       ...(storeSettings.policies||{}),
       homeLayout:nextLayout
      }
     };
     await adminService.saveSettings(nextSettings);
    }catch{}
   }

   setEdit(null);
   await load();
   publish();
   notify(edit.id?'Banner updated':'Banner added to storefront');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setBusy(false);
  }
 };

 const uploadImage=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setBusy(true);
  try{
   const result=await adminService.uploadBannerImage(file);
   setEdit(current=>({...current,image:result.url}));
   notify('Banner image uploaded');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setBusy(false);
   event.target.value='';
  }
 };

 const toggle=async banner=>{
  setBusy(true);
  try{
   const status=banner.status==='ACTIVE'?'INACTIVE':'ACTIVE';
   await adminService.updateBannerStatus(banner.id,status);
   await load();
   publish();
   notify(status==='ACTIVE'?'Banner is now visible':'Banner hidden from storefront');
  }catch(error){
   notify(error.message,'error');
  }finally{
   setBusy(false);
  }
 };

 const move=async(index,direction)=>{
  const other=index+direction;
  if(other<0||other>=list.length)return;
  setBusy(true);
  try{
   const next=[...list];
   [next[index],next[other]]=[next[other],next[index]];
   await adminService.reorderBanners(next.map(item=>item.id));
   await load();
   publish();
  }catch(error){
   notify(error.message,'error');
  }finally{
   setBusy(false);
  }
 };

 const deleteBanner=async()=>{
  try{
   await adminService.deleteBanner(remove.id);
   setList(current=>current.filter(item=>item.id!==remove.id));
   publish();
   notify(`Banner "${remove?.heading || ''}" deleted successfully`,'success');
  }catch(error){
   notify(error.message,'error');
   return false;
  }
 };

 const getPlacementLabel=bannerId=>{
  const p=storeSettings?.policies?.homeLayout?.bannerPlacements?.[bannerId];
  if(p==='HERO')return '👑 Hero Carousel';
  if(p==='CAMPAIGN')return '🏷️ Offers Rail';
  if(p==='BOTH')return '🌟 Hero & Offers';
  return null;
 };

 return <>
  <AdminTitle action={
   <div className="row gap" style={{alignItems:'center'}}>
    <Link to="/admin/storefront">
     <Button variant="outline"><LayoutTemplate size={15}/> Storefront Layout</Button>
    </Link>
    <Button onClick={()=>setEdit({...emptyBanner,position:list.length,placement:'HERO'})}>
     <Plus/> Add banner
    </Button>
   </div>
  }/>

  {loading?<div className="admin-card banner-loading"><LoaderCircle className="spin"/> Loading banners…</div>
  :error?<div className="admin-card bulk-error"><p role="alert">{error}</p><Button variant="outline" onClick={load}>Try again</Button></div>
  :!list.length?<div className="admin-card banner-loading">No banners yet. Add the first storefront campaign.</div>
  :<div className="banner-admin-grid">
   {list.map((banner,index)=>{
    const placementText=getPlacementLabel(banner.id)||(index<2?'👑 Hero Carousel':'🏷️ Offers Rail');
    return (
     <article className="admin-card banner-admin" key={banner.id}>
      <div className="banner-preview" style={banner.image?{backgroundImage:`linear-gradient(90deg,rgba(7,45,29,.9),rgba(7,45,29,.2)),url(${banner.image})`}:undefined}>
       <span>{banner.kicker||'R2CART'}</span>
       <h3>{banner.heading}</h3>
       <p>{banner.subtitle}</p>
       <b>{banner.ctaText||'Shop now'} →</b>
      </div>
      <div className="between">
       <div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
         <b>Display order {banner.position}</b>
         <span style={{fontSize:'11.5px',fontWeight:700,background:'rgba(16,185,129,0.12)',color:'#10b981',padding:'2px 8px',borderRadius:'12px'}}>
          {placementText}
         </span>
        </div>
        <small>{banner.status==='ACTIVE'?'Visible on homepage':'Hidden from homepage'}</small>
       </div>
       <StatusBadge status={banner.status==='ACTIVE'?'Active':'Inactive'}/>
      </div>
      <div className="banner-actions">
       <button disabled={busy||index===0} onClick={()=>move(index,-1)} aria-label="Move banner up"><ArrowUp/></button>
       <button disabled={busy||index===list.length-1} onClick={()=>move(index,1)} aria-label="Move banner down"><ArrowDown/></button>
       <Button variant="outline" onClick={()=>setEdit({
        ...banner,
        placement:storeSettings?.policies?.homeLayout?.bannerPlacements?.[banner.id]||(index<2?'HERO':'CAMPAIGN')
       })}>
        <Edit2/> Edit
       </Button>
       <Button variant="ghost" onClick={()=>toggle(banner)}>{banner.status==='ACTIVE'?<EyeOff/>:<Eye/>}{banner.status==='ACTIVE'?'Hide':'Show'}</Button>
       <Button variant="ghost" className="text-danger" onClick={()=>setRemove(banner)}><Trash2/> Delete</Button>
      </div>
     </article>
    );
   })}
  </div>}

  <Modal open={!!edit} onClose={()=>!busy&&setEdit(null)} title={edit?.id?'Edit banner':'Add banner'} size="location-modal">
   <form className="modal-body admin-form" onSubmit={save}>
    <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage}/>
    <div className={`upload-box banner-upload ${edit?.image?'has-image':''}`} style={edit?.image?{backgroundImage:`linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)),url(${edit.image})`}:undefined}>
     <ImagePlus/>
     <b>{edit?.image?'Change banner image':'Upload banner image'}</b>
     <small>JPG, PNG or WebP · maximum 5 MB</small>
     <Button type="button" variant="outline" onClick={()=>fileRef.current?.click()} disabled={busy}>Choose from device</Button>
    </div>
    <label>
     Image URL
     <input name="image" value={edit?.image||''} onChange={event=>setEdit(current=>({...current,image:event.target.value}))} placeholder="https://… or upload from device"/>
    </label>
    <div className="form-grid">
     <label>Campaign label<input name="kicker" value={edit?.kicker||''} onChange={event=>setEdit(current=>({...current,kicker:event.target.value}))}/></label>
     <label>Heading<input required name="heading" value={edit?.heading||''} onChange={event=>setEdit(current=>({...current,heading:event.target.value}))}/></label>
     <label className="full">Subtitle<input name="subtitle" value={edit?.subtitle||''} onChange={event=>setEdit(current=>({...current,subtitle:event.target.value}))}/></label>
     <label>CTA text<input name="ctaText" value={edit?.ctaText||''} onChange={event=>setEdit(current=>({...current,ctaText:event.target.value}))}/></label>
     <label>Destination<input required name="destination" value={edit?.destination||''} onChange={event=>setEdit(current=>({...current,destination:event.target.value}))} placeholder="/category/fruits-vegetables"/></label>
     <label>
      Storefront placement
      <select name="placement" value={edit?.placement||'HERO'} onChange={event=>setEdit(current=>({...current,placement:event.target.value}))}>
       <option value="HERO">👑 Hero Carousel (Top Banner)</option>
       <option value="CAMPAIGN">🏷️ Offers Picked For You (Campaign Rail)</option>
       <option value="BOTH">🌟 Both Placements</option>
      </select>
     </label>
     <label>Display order<input name="position" min="0" type="number" value={edit?.position??0} onChange={event=>setEdit(current=>({...current,position:event.target.value}))}/></label>
     <label>Status<select name="status" value={edit?.status||'ACTIVE'} onChange={event=>setEdit(current=>({...current,status:event.target.value}))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
    </div>
    <div className="form-actions">
     <Button type="button" variant="ghost" onClick={()=>setEdit(null)} disabled={busy}>Cancel</Button>
     <Button disabled={busy}>{busy?<><LoaderCircle className="spin"/> Saving…</>:'Save banner'}</Button>
    </div>
   </form>
  </Modal>

  <ConfirmDialog
    open={!!remove}
    onClose={() => setRemove(null)}
    onConfirm={deleteBanner}
    title="Delete Banner?"
    itemName={remove?.heading}
    itemType="Banner"
    message={`Are you sure you want to permanently delete banner "${remove?.heading || 'this banner'}"?`}
    warningNote="It will be immediately removed from customer home carousels and promotional sections."
    confirmText="Delete Banner"
    cancelText="Cancel"
  />
 </>;
}
