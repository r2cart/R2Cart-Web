import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDown,ArrowUp,Clock,Edit2,Eye,EyeOff,ImagePlus,LayoutTemplate,LoaderCircle,Plus,RotateCw,Sparkles,Star,Trash2,X} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const emptyBanner={
  kicker:'FRESH DEALS',
  heading:'',
  subtitle:'',
  image:'',
  secondaryImage:'',
  thirdImage:'',
  ctaText:'Shop now',
  destination:'/',
  position:0,
  status:'ACTIVE',
  placement:'HERO',
  setActiveNow:false
};

const AdminTitle=({action})=><div className="admin-title"><div><h1>Banners & Hero Visuals</h1><p>Manage 3-image hero banners, 24-hour auto-rotation, placements and campaigns.</p></div>{action}</div>;

let cachedBannersList = null;
let cachedStoreSettings = null;
let lastBannersFetch = 0;

export function AdminBanners(){
 const {notify}=useApp();
 const [list,setList]=useState(()=>cachedBannersList||[]);
 const [storeSettings,setStoreSettings]=useState(()=>cachedStoreSettings||null);
 const [loading,setLoading]=useState(()=>!cachedBannersList);
 const [edit,setEdit]=useState(null);
 const [remove,setRemove]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 const mainFileRef=useRef(null);
 const secFileRef=useRef(null);
 const thirdFileRef=useRef(null);

 const load=async(silent=false)=>{
  if(!silent&&!cachedBannersList)setLoading(true);
  setError('');
  try{
   const [banners,settings]=await Promise.all([
    adminService.banners(),
    adminService.settings().catch(()=>null)
   ]);
   cachedBannersList=banners;
   cachedStoreSettings=settings;
   lastBannersFetch=Date.now();
   setList(banners);
   setStoreSettings(settings);
  }catch(reason){
   if(!cachedBannersList){
    setList([]);
    setError(reason.message);
   }
  }finally{
   setLoading(false);
  }
 };

 useEffect(()=>{
  if(cachedBannersList){
   setLoading(false);
   if(Date.now()-lastBannersFetch>60000){
    load(true);
   }
  }else{
   load(false);
  }
 },[]);

 const publish=()=>{
  window.dispatchEvent(new Event('r2cart:banners-updated'));
  window.dispatchEvent(new Event('r2cart:settings-updated'));
 };

 const uploadVisual=async (event, fieldName)=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setBusy(true);
  try{
   const result=await adminService.uploadBannerImage(file);
   setEdit(curr=>({...curr,[fieldName]:result.url}));
   const label = fieldName === 'image' ? 'Main hero photo' : fieldName === 'secondaryImage' ? 'Badge 1 (Top-right)' : 'Badge 2 (Bottom-left)';
   notify(`${label} uploaded successfully`);
  }catch(err){
   notify(err.message,'error');
  }finally{
   setBusy(false);
   event.target.value='';
  }
 };

 const openEditModal=(banner=null)=>{
  if(!banner){
   setEdit({
    ...emptyBanner,
    position:list.length,
    placement:'HERO',
    setActiveNow:true
   });
   return;
  }
  const visuals=storeSettings?.policies?.homeLayout?.bannerVisuals?.[banner.id]||{};
  const placement=storeSettings?.policies?.homeLayout?.bannerPlacements?.[banner.id]||(list.indexOf(banner)<2?'HERO':'CAMPAIGN');
  setEdit({
   ...banner,
   placement,
   image:banner.image||visuals.mainImage||'',
   secondaryImage:visuals.secondaryImage||'',
   thirdImage:visuals.thirdImage||'',
   setActiveNow:false
  });
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
    image:values.image||edit.image||'',
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
   const makeActiveNow=Boolean(values.setActiveNow==='on'||edit.setActiveNow);

   if(bannerId&&storeSettings){
    try{
     const currentLayout=storeSettings.policies?.homeLayout||{};
     const nextLayout={
      ...currentLayout,
      bannerPlacements:{
       ...(currentLayout.bannerPlacements||{}),
       [bannerId]:selectedPlacement
      },
      bannerVisuals:{
       ...(currentLayout.bannerVisuals||{}),
       [bannerId]:{
        mainImage:values.image||edit.image||'',
        secondaryImage:values.secondaryImage||edit.secondaryImage||'',
        thirdImage:values.thirdImage||edit.thirdImage||''
       }
      },
      heroRotation:makeActiveNow?{
       ...(currentLayout.heroRotation||{}),
       manualBannerId:bannerId,
       manualChangedAt:new Date().toISOString(),
       intervalHours:24
      }:(currentLayout.heroRotation||{})
     };
     const nextSettings={
      ...storeSettings,
      policies:{
       ...(storeSettings.policies||{}),
       homeLayout:nextLayout
      }
     };
     await adminService.saveSettings(nextSettings);
     setStoreSettings(nextSettings);
    }catch{}
   }

   setEdit(null);
   await load();
   publish();
   notify(edit.id?'Banner and visual assets updated':'Banner added with 3 images');
  }catch(err){
   notify(err.message,'error');
  }finally{
   setBusy(false);
  }
 };

 const setActiveHeroBanner=async (bannerId)=>{
  if(!storeSettings)return;
  setBusy(true);
  try{
   const currentLayout=storeSettings.policies?.homeLayout||{};
   const nextLayout={
    ...currentLayout,
    bannerPlacements:{
     ...(currentLayout.bannerPlacements||{}),
     [bannerId]:'HERO'
    },
    heroRotation:{
     ...(currentLayout.heroRotation||{}),
     manualBannerId:bannerId,
     manualChangedAt:new Date().toISOString(),
     intervalHours:24
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
   setStoreSettings(nextSettings);
   publish();
   notify('🌟 Active Hero Banner set! Will remain active for the next 24 hours.', 'success');
  }catch(err){
   notify(err.message,'error');
  }finally{
   setBusy(false);
  }
 };

 const resetToAutoRotation=async ()=>{
  if(!storeSettings)return;
  setBusy(true);
  try{
   const currentLayout=storeSettings.policies?.homeLayout||{};
   const nextLayout={
    ...currentLayout,
    heroRotation:{
     intervalHours:24
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
   setStoreSettings(nextSettings);
   publish();
   notify('🔄 Reset to default 24-hour daily automatic rotation', 'success');
  }catch(err){
   notify(err.message,'error');
  }finally{
   setBusy(false);
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
  }catch(err){
   notify(err.message,'error');
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
  }catch(err){
   notify(err.message,'error');
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
  }catch(err){
   notify(err.message,'error');
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

 const getBannerRotationStatus=(bannerId)=>{
  const heroRotation=storeSettings?.policies?.homeLayout?.heroRotation||{};
  const {manualBannerId,manualChangedAt,intervalHours=24}=heroRotation;
  const cycleMs=(Number(intervalHours)||24)*60*60*1000;
  const heroList=list.filter(b=>{
   const p=storeSettings?.policies?.homeLayout?.bannerPlacements?.[b.id];
   return p==='HERO'||p==='BOTH'||(!p&&list.indexOf(b)<2);
  });

  if(!heroList.length)return null;

  let activeBannerId=heroList[0].id;
  let isManual=false;
  let remainingMs=0;

  if(manualBannerId&&manualChangedAt){
   const manualTime=new Date(manualChangedAt).getTime();
   const elapsed=Date.now()-manualTime;
   const idx=heroList.findIndex(b=>String(b.id)===String(manualBannerId));
   if(idx!==-1){
    if(elapsed<cycleMs){
     activeBannerId=manualBannerId;
     isManual=true;
     remainingMs=cycleMs-elapsed;
    }else{
     const periods=Math.floor(elapsed/cycleMs);
     const activeIdx=(idx+periods)%heroList.length;
     activeBannerId=heroList[activeIdx].id;
     remainingMs=cycleMs-(elapsed%cycleMs);
    }
   }
  }else{
   const dayNumber=Math.floor(Date.now()/(24*60*60*1000));
   const activeIdx=dayNumber%heroList.length;
   activeBannerId=heroList[activeIdx]?.id;
   const now=new Date();
   const midnight=new Date(now);
   midnight.setHours(24,0,0,0);
   remainingMs=midnight.getTime()-now.getTime();
  }

  const isActive=String(activeBannerId)===String(bannerId);
  const hours=Math.floor(remainingMs/(1000*60*60));
  const mins=Math.floor((remainingMs%(1000*60*60))/(1000*60));

  return {isActive,isManual,hours,mins};
 };

 const hasManualActive=Boolean(storeSettings?.policies?.homeLayout?.heroRotation?.manualBannerId);

 return <>
  <AdminTitle action={
   <div className="row gap" style={{alignItems:'center'}}>
    {hasManualActive&&(
     <Button variant="outline" onClick={resetToAutoRotation} title="Reset to daily calendar schedule" disabled={busy}>
      <RotateCw size={14}/> Reset to Daily Auto-Rotation
     </Button>
    )}
    <Link to="/admin/storefront">
     <Button variant="outline"><LayoutTemplate size={15}/> Storefront Layout</Button>
    </Link>
    <Button onClick={()=>openEditModal(null)}>
     <Plus/> Add banner
    </Button>
   </div>
  }/>

  {/* Auto-Rotation Info Banner */}
  <div style={{
   background:'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
   color:'#ffffff',
   borderRadius:'16px',
   padding:'16px 20px',
   marginBottom:'20px',
   display:'flex',
   alignItems:'center',
   justifyContent:'space-between',
   gap:'16px',
   boxShadow:'0 4px 14px rgba(6,78,59,0.18)'
  }}>
   <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
    <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(255,255,255,0.18)',display:'grid',placeItems:'center'}}>
     <Clock size={20} color="#fef08a"/>
    </div>
    <div>
     <strong style={{fontSize:'14px',display:'block'}}>
      24-Hour Hero Banner Cycle Active
     </strong>
     <small style={{fontSize:'12px',color:'#d1fae5'}}>
      {hasManualActive 
       ? 'Admin manual change active · Rotates automatically after 24 hours.' 
       : 'Default daily rotation active · Each hero banner automatically switches every 24 hours.'}
     </small>
    </div>
   </div>
   <span style={{fontSize:'11.5px',fontWeight:800,background:'rgba(255,255,255,0.2)',padding:'6px 12px',borderRadius:'20px',color:'#fef08a'}}>
    3-Image Visual Engine Active
   </span>
  </div>

  {loading && !list.length ? (
   <div className="banner-admin-grid">
    {Array.from({ length: 3 }).map((_, i) => (
     <div key={i} className="admin-card" style={{ padding: '20px', borderRadius: '16px' }}>
      <div className="r2c-skeleton-box" style={{ width: '100%', height: '160px', borderRadius: '12px', marginBottom: '14px' }} />
      <div className="r2c-skeleton-box" style={{ width: '70%', height: '20px', borderRadius: '6px', marginBottom: '8px' }} />
      <div className="r2c-skeleton-box" style={{ width: '90%', height: '14px', borderRadius: '4px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '10px' }}>
       <div className="r2c-skeleton-box" style={{ width: '80px', height: '34px', borderRadius: '8px' }} />
       <div className="r2c-skeleton-box" style={{ width: '80px', height: '34px', borderRadius: '8px' }} />
      </div>
     </div>
    ))}
   </div>
  )
  :error?<div className="admin-card bulk-error"><p role="alert">{error}</p><Button variant="outline" onClick={load}>Try again</Button></div>
  :!list.length?<div className="admin-card banner-loading">No banners yet. Add the first storefront campaign.</div>
  :<div className="banner-admin-grid">
   {list.map((banner,index)=>{
    const placementText=getPlacementLabel(banner.id)||(index<2?'👑 Hero Carousel':'🏷️ Offers Rail');
    const visuals=storeSettings?.policies?.homeLayout?.bannerVisuals?.[banner.id]||{};
    const mainImg=visuals.mainImage||banner.image;
    const secImg=visuals.secondaryImage;
    const thirdImg=visuals.thirdImage;
    const rot=getBannerRotationStatus(banner.id);

    return (
     <article className="admin-card banner-admin" key={banner.id} style={rot?.isActive?{borderColor:'#10b981',boxShadow:'0 0 0 2px rgba(16,185,129,0.25)'}:undefined}>
      <div className="banner-preview" style={mainImg?{backgroundImage:`linear-gradient(90deg,rgba(7,45,29,.9),rgba(7,45,29,.2)),url(${mainImg})`}:undefined}>
       <span>{banner.kicker||'R2CART'}</span>
       <h3>{banner.heading}</h3>
       <p>{banner.subtitle}</p>
       <b>{banner.ctaText||'Shop now'} →</b>
      </div>

      {/* 3-Image Thumbnails Showcase */}
      <div style={{display:'flex',gap:'8px',padding:'10px 14px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',alignItems:'center'}}>
       <span style={{fontSize:'11px',fontWeight:700,color:'#64748b'}}>3 Images:</span>
       <div style={{display:'flex',gap:'6px',flex:1}}>
        <div title="Main Photo" style={{width:'32px',height:'32px',borderRadius:'6px',overflow:'hidden',background:'#e2e8f0',border:'1px solid #cbd5e1'}}>
         {mainImg?<img src={mainImg} alt="Main" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:'9px',textAlign:'center',lineHeight:'32px',color:'#94a3b8'}}>Main</div>}
        </div>
        <div title="Badge 1 (Top-right)" style={{width:'32px',height:'32px',borderRadius:'6px',overflow:'hidden',background:'#e2e8f0',border:'1px solid #cbd5e1'}}>
         {secImg?<img src={secImg} alt="Badge 1" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:'9px',textAlign:'center',lineHeight:'32px',color:'#94a3b8'}}>B1</div>}
        </div>
        <div title="Badge 2 (Bottom-left)" style={{width:'32px',height:'32px',borderRadius:'6px',overflow:'hidden',background:'#e2e8f0',border:'1px solid #cbd5e1'}}>
         {thirdImg?<img src={thirdImg} alt="Badge 2" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:'9px',textAlign:'center',lineHeight:'32px',color:'#94a3b8'}}>B2</div>}
        </div>
       </div>

       {/* Rotation Status Badge */}
       {rot?.isActive ? (
        <span style={{fontSize:'11px',fontWeight:800,color:'#047857',background:'#d1fae5',padding:'3px 8px',borderRadius:'12px',display:'inline-flex',alignItems:'center',gap:'4px'}}>
         <Sparkles size={11}/> Active Now ({rot.hours}h {rot.mins}m)
        </span>
       ) : (
        <span style={{fontSize:'10.5px',color:'#64748b',background:'#f1f5f9',padding:'3px 7px',borderRadius:'10px'}}>
         In 24h Queue
        </span>
       )}
      </div>

      <div className="between" style={{padding:'10px 14px'}}>
       <div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
         <b>Order {banner.position}</b>
         <span style={{fontSize:'11px',fontWeight:700,background:'rgba(16,185,129,0.12)',color:'#10b981',padding:'2px 8px',borderRadius:'12px'}}>
          {placementText}
         </span>
        </div>
        <small>{banner.status==='ACTIVE'?'Visible on storefront':'Hidden from storefront'}</small>
       </div>
       <StatusBadge status={banner.status==='ACTIVE'?'Active':'Inactive'}/>
      </div>

      <div className="banner-actions" style={{padding:'10px 14px',borderTop:'1px solid #f1f5f9'}}>
       <button disabled={busy||index===0} onClick={()=>move(index,-1)} aria-label="Move banner up"><ArrowUp/></button>
       <button disabled={busy||index===list.length-1} onClick={()=>move(index,1)} aria-label="Move banner down"><ArrowDown/></button>

       {/* Quick Set Active for 24h Button */}
       {!rot?.isActive&&(
        <Button variant="outline" size="sm" onClick={()=>setActiveHeroBanner(banner.id)} disabled={busy} title="Make active hero banner now (24-hour cycle begins)">
         <Star size={13} color="#f59e0b"/> Make Active (24h)
        </Button>
       )}

       <Button variant="outline" onClick={()=>openEditModal(banner)}>
        <Edit2/> Edit
       </Button>
       <Button variant="ghost" onClick={()=>toggle(banner)}>{banner.status==='ACTIVE'?<EyeOff/>:<Eye/>}{banner.status==='ACTIVE'?'Hide':'Show'}</Button>
       <Button variant="ghost" className="text-danger" onClick={()=>setRemove(banner)}><Trash2/> Delete</Button>
      </div>
     </article>
    );
   })}
  </div>}

  {/* Edit / Create Banner Modal with 3 Images and 24h Rotation Setting */}
  <Modal open={!!edit} onClose={()=>!busy&&setEdit(null)} title={edit?.id?'Edit 3-Image Banner':'Add 3-Image Banner'} size="location-modal">
   <form className="modal-body admin-form" onSubmit={save}>
    {/* Hidden file inputs for 3 distinct images */}
    <input ref={mainFileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadVisual(e,'image')}/>
    <input ref={secFileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadVisual(e,'secondaryImage')}/>
    <input ref={thirdFileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadVisual(e,'thirdImage')}/>

    {/* Section 1: 3-Image Upload Visual System */}
    <div style={{background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:'16px',padding:'16px',marginBottom:'18px'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
      <div>
       <strong style={{fontSize:'13.5px',color:'#0f172a',display:'block'}}>
        📸 Hero Banner Visual System (3 Images)
       </strong>
       <small style={{fontSize:'11.5px',color:'#64748b'}}>
        Upload all 3 distinct images to be shown together in this banner.
       </small>
      </div>
     </div>

     <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'12px'}}>
      {/* 1. Main Large Image */}
      <div style={{background:'#ffffff',border:'1px solid #cbd5e1',borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column'}}>
       <span style={{fontSize:'11.5px',fontWeight:800,color:'#0f172a',marginBottom:'4px'}}>
        1. Main Photo (बड़ी इमेज)
       </span>
       <div style={{
        aspectRatio:'1/1',
        borderRadius:'8px',
        overflow:'hidden',
        background:'#f1f5f9',
        border:'1px dashed #94a3b8',
        marginBottom:'8px',
        position:'relative'
       }}>
        {edit?.image ? (
         <>
          <img src={edit.image} alt="Main" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <button type="button" onClick={()=>setEdit(c=>({...c,image:''}))} style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',width:'20px',height:'20px',borderRadius:'50%',display:'grid',placeItems:'center',cursor:'pointer'}}>
           <X size={12}/>
          </button>
         </>
        ) : (
         <div style={{height:'100%',display:'grid',placeItems:'center',color:'#94a3b8',fontSize:'10.5px',textAlign:'center',padding:'6px'}}>
          Hero Plate / Fruit
         </div>
        )}
       </div>
       <Button type="button" variant="outline" size="sm" onClick={()=>mainFileRef.current?.click()} disabled={busy} style={{width:'100%',fontSize:'11px',padding:'5px'}}>
        <ImagePlus size={13}/> Choose File
       </Button>
       <input
        name="image"
        value={edit?.image||''}
        onChange={e=>setEdit(c=>({...c,image:e.target.value}))}
        placeholder="Or Image URL"
        style={{marginTop:'6px',fontSize:'11px',padding:'5px 8px'}}
       />
      </div>

      {/* 2. Secondary Floating Badge 1 (Top-Right) */}
      <div style={{background:'#ffffff',border:'1px solid #cbd5e1',borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column'}}>
       <span style={{fontSize:'11.5px',fontWeight:800,color:'#0f172a',marginBottom:'4px'}}>
        2. Badge 1 (ऊपर दाईं)
       </span>
       <div style={{
        aspectRatio:'1/1',
        borderRadius:'8px',
        overflow:'hidden',
        background:'#f1f5f9',
        border:'1px dashed #94a3b8',
        marginBottom:'8px',
        position:'relative'
       }}>
        {edit?.secondaryImage ? (
         <>
          <img src={edit.secondaryImage} alt="Secondary" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <button type="button" onClick={()=>setEdit(c=>({...c,secondaryImage:''}))} style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',width:'20px',height:'20px',borderRadius:'50%',display:'grid',placeItems:'center',cursor:'pointer'}}>
           <X size={12}/>
          </button>
         </>
        ) : (
         <div style={{height:'100%',display:'grid',placeItems:'center',color:'#94a3b8',fontSize:'10.5px',textAlign:'center',padding:'6px'}}>
          Coffee / Cookies
         </div>
        )}
       </div>
       <Button type="button" variant="outline" size="sm" onClick={()=>secFileRef.current?.click()} disabled={busy} style={{width:'100%',fontSize:'11px',padding:'5px'}}>
        <ImagePlus size={13}/> Choose File
       </Button>
       <input
        name="secondaryImage"
        value={edit?.secondaryImage||''}
        onChange={e=>setEdit(c=>({...c,secondaryImage:e.target.value}))}
        placeholder="Or Image URL"
        style={{marginTop:'6px',fontSize:'11px',padding:'5px 8px'}}
       />
      </div>

      {/* 3. Third Floating Badge 2 (Bottom-Left) */}
      <div style={{background:'#ffffff',border:'1px solid #cbd5e1',borderRadius:'12px',padding:'12px',display:'flex',flexDirection:'column'}}>
       <span style={{fontSize:'11.5px',fontWeight:800,color:'#0f172a',marginBottom:'4px'}}>
        3. Badge 2 (नीचे बाईं)
       </span>
       <div style={{
        aspectRatio:'1/1',
        borderRadius:'8px',
        overflow:'hidden',
        background:'#f1f5f9',
        border:'1px dashed #94a3b8',
        marginBottom:'8px',
        position:'relative'
       }}>
        {edit?.thirdImage ? (
         <>
          <img src={edit.thirdImage} alt="Third" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <button type="button" onClick={()=>setEdit(c=>({...c,thirdImage:''}))} style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',width:'20px',height:'20px',borderRadius:'50%',display:'grid',placeItems:'center',cursor:'pointer'}}>
           <X size={12}/>
          </button>
         </>
        ) : (
         <div style={{height:'100%',display:'grid',placeItems:'center',color:'#94a3b8',fontSize:'10.5px',textAlign:'center',padding:'6px'}}>
          Milk / Fruit cut
         </div>
        )}
       </div>
       <Button type="button" variant="outline" size="sm" onClick={()=>thirdFileRef.current?.click()} disabled={busy} style={{width:'100%',fontSize:'11px',padding:'5px'}}>
        <ImagePlus size={13}/> Choose File
       </Button>
       <input
        name="thirdImage"
        value={edit?.thirdImage||''}
        onChange={e=>setEdit(c=>({...c,thirdImage:e.target.value}))}
        placeholder="Or Image URL"
        style={{marginTop:'6px',fontSize:'11px',padding:'5px 8px'}}
       />
      </div>
     </div>
    </div>

    {/* Section 2: Banner Details */}
    <div className="form-grid">
     <label>Campaign label<input name="kicker" value={edit?.kicker||''} onChange={e=>setEdit(c=>({...c,kicker:e.target.value}))}/></label>
     <label>Heading<input required name="heading" value={edit?.heading||''} onChange={e=>setEdit(c=>({...c,heading:e.target.value}))}/></label>
     <label className="full">Subtitle<input name="subtitle" value={edit?.subtitle||''} onChange={e=>setEdit(c=>({...c,subtitle:e.target.value}))}/></label>
     <label>CTA text<input name="ctaText" value={edit?.ctaText||''} onChange={e=>setEdit(c=>({...c,ctaText:e.target.value}))}/></label>
     <label>Destination<input required name="destination" value={edit?.destination||''} onChange={e=>setEdit(c=>({...c,destination:e.target.value}))} placeholder="/category/fruits-vegetables"/></label>
     <label>
      Storefront placement
      <select name="placement" value={edit?.placement||'HERO'} onChange={e=>setEdit(c=>({...c,placement:e.target.value}))}>
       <option value="HERO">👑 Hero Carousel (Top Banner)</option>
       <option value="CAMPAIGN">🏷️ Offers Picked For You (Campaign Rail)</option>
       <option value="BOTH">🌟 Both Placements</option>
      </select>
     </label>
     <label>Display order<input name="position" min="0" type="number" value={edit?.position??0} onChange={e=>setEdit(c=>({...c,position:e.target.value}))}/></label>
     <label>Status<select name="status" value={edit?.status||'ACTIVE'} onChange={e=>setEdit(c=>({...c,status:e.target.value}))}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
    </div>

    {/* Section 3: 24-Hour Active Cycle Trigger */}
    <div style={{
     background:'#ecfdf5',
     border:'1px solid #a7f3d0',
     borderRadius:'12px',
     padding:'12px 14px',
     marginTop:'16px',
     display:'flex',
     alignItems:'flex-start',
     gap:'10px'
    }}>
     <input
      type="checkbox"
      id="setActiveNow"
      name="setActiveNow"
      checked={Boolean(edit?.setActiveNow)}
      onChange={e=>setEdit(c=>({...c,setActiveNow:e.target.checked}))}
      style={{marginTop:'3px',accentColor:'#059669',width:'16px',height:'16px'}}
     />
     <label htmlFor="setActiveNow" style={{cursor:'pointer',margin:0}}>
      <strong style={{color:'#065f46',fontSize:'13px',display:'block'}}>
       🌟 Set as Active Hero Banner Now (Starts 24-hour cycle)
      </strong>
      <small style={{color:'#047857',fontSize:'11.5px'}}>
       इस बैनर को अभी से अगले 24 घंटे के लिए एक्टिव बनाएँ। 24 घंटे बाद अगला बैनर ऑटोमैटिकली बदलेगा।
      </small>
     </label>
    </div>

    <div className="form-actions" style={{marginTop:'18px'}}>
     <Button type="button" variant="ghost" onClick={()=>setEdit(null)} disabled={busy}>Cancel</Button>
     <Button disabled={busy}>{busy?<><LoaderCircle className="spin"/> Saving…</>:'Save 3-Image Banner'}</Button>
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
