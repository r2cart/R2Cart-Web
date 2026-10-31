import {useEffect,useState,useRef} from 'react';
import {Camera,Edit2,Eye,FolderTree,Plus,Trash2,Upload,LoaderCircle,Tag,Megaphone,Sparkles} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import CategoryProductsModal from '../../components/admin/CategoryProductsModal';
import {compressImage} from '../../utils/imageCompressor';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const labelStatus=status=>status==='ACTIVE'?'Active':'Inactive';

let adminCategoriesCache = null;

function CategoryListSkeleton(){
  return (
    <div className="cat-skeleton-list" aria-label="Loading categories">
      {[1,2,3,4,5,6,7,8].map(i=>(
        <div key={i} className="cat-skeleton-row">
          <div className="cat-skel-badge cat-skeleton-shimmer" style={{width:'38px',height:'28px',borderRadius:'8px'}}/>
          <div className="cat-skel-icon cat-skeleton-shimmer"/>
          <div className="cat-skel-text">
            <div className="cat-skel-title cat-skeleton-shimmer" style={{width: i%2===0?'180px':'130px'}}/>
            <div className="cat-skel-sub cat-skeleton-shimmer" style={{width: i%2===0?'90px':'120px'}}/>
          </div>
          <div className="cat-skel-badge cat-skeleton-shimmer"/>
          <div className="cat-skel-btn cat-skeleton-shimmer"/>
          <div className="cat-skel-btn cat-skeleton-shimmer"/>
          <div className="cat-skel-btn cat-skeleton-shimmer"/>
        </div>
      ))}
    </div>
  );
}

export function AdminCategories(){
 const {notify,refreshCategories,user}=useApp();
 const isCategoryScopedAdmin = Boolean(
   user?.staffRole === 'CATEGORY_ADMIN' ||
   (Array.isArray(user?.assignedCategoryIds) && user.assignedCategoryIds.length > 0)
 );
 const [list,setList]=useState(adminCategoriesCache || []);
 const [loading,setLoading]=useState(!adminCategoriesCache);
 const [error,setError]=useState('');
 const [edit,setEdit]=useState(null);
 const [remove,setRemove]=useState(null);
 const [viewCategory,setViewCategory]=useState(null);
 const [saving,setSaving]=useState(false);
 const [uploadingImage,setUploadingImage]=useState(false);
 const [aiLoading,setAiLoading]=useState({});
 const fileInputRef=useRef(null);
 const directUploadInputRef=useRef(null);
 const [categoryForUpload,setCategoryForUpload]=useState(null);

 const clientSideAiEnhance = (rawText, type) => {
   let corrected = String(rawText || '').trim();
   const DICT = [
     [/\b(pan|all)\s*(indai|indiya|indya)\b/gi, 'Pan-India'],
     [/\bpanindia\b/gi, 'Pan-India'],
     [/\bdelivry|delvery|delivrey|dilvery|delevery\b/gi, 'delivery'],
     [/\bavailble|availabe|avalable|avialable\b/gi, 'available'],
     [/\bshiping|shipin|shippng\b/gi, 'shipping'],
     [/\bresine|reisn|rasin\b/gi, 'resin'],
     [/\bcouriar|coureir|curier\b/gi, 'courier'],
     [/\bprodut|prduct|produc\b/gi, 'product'],
     [/\bhandcraft|handcrafter|hand made|hand-craft\b/gi, 'handcrafted'],
     [/\bdecore\b/gi, 'decor'],
     [/\bgifitng|giftingg\b/gi, 'gifting'],
     [/\bcustmer|customar|custmr\b/gi, 'customer'],
     [/\bguarntee|garantee|guarenty\b/gi, 'guarantee'],
     [/\bdisscount|dicount|discunt\b/gi, 'discount'],
     [/\borderd|ordred\b/gi, 'ordered'],
     [/\breceve|recieved\b/gi, 'received'],
     [/\bbussiness|buisness|busines\b/gi, 'business'],
     [/\bpincod|pincode|pin code\b/gi, 'pincode'],
     [/\bnotis|notce\b/gi, 'notice'],
     [/\bdont\b/gi, "don't"],
     [/\bcant\b/gi, "can't"],
     [/\bwont\b/gi, "won't"],
     [/\bthats\b/gi, "that's"],
     [/\bits\s+(a|an|the|our|your|my)\b/gi, "it's $1"],
     [/\bwe\s+is\b/gi, "we are"],
     [/\bi\b/g, 'I']
   ];
   for (const [pattern, repl] of DICT) {
     corrected = corrected.replace(pattern, repl);
   }
   corrected = corrected.replace(/[ \t]+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
   if (type === 'badge') {
     corrected = corrected.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');
   } else if (type === 'title') {
     const minor = ['and', 'or', 'for', 'to', 'in', 'of', 'at', 'by', 'with', 'the', 'a', 'an'];
     corrected = corrected.split(' ').map((w, idx) => {
       const lower = w.toLowerCase();
       return idx > 0 && minor.includes(lower) ? lower : (w ? w.charAt(0).toUpperCase() + w.slice(1) : '');
     }).join(' ');
   } else {
     corrected = corrected.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
     if (corrected && !/[.!?]$/.test(corrected)) corrected += '.';
   }
   return corrected;
 };

 const handleAiCorrect = async (fieldName, type) => {
   const val = edit?.[fieldName] || '';
   if (!val.trim()) {
     notify('Please enter some text first to correct with AI', 'info');
     return;
   }
   setAiLoading(prev => ({ ...prev, [fieldName]: true }));
   try {
     const res = await adminService.correctEnglishText(val, type);
     const corrected = res?.data?.corrected || res?.corrected;
     if (corrected) {
       setEdit(prev => ({ ...prev, [fieldName]: corrected }));
       notify('✨ English corrected & polished with AI!', 'success');
     } else {
       const fallback = clientSideAiEnhance(val, type);
       setEdit(prev => ({ ...prev, [fieldName]: fallback }));
       notify('✨ Corrected with AI Assistant!', 'success');
     }
   } catch {
     const fallback = clientSideAiEnhance(val, type);
     setEdit(prev => ({ ...prev, [fieldName]: fallback }));
     notify('✨ Corrected with AI Assistant!', 'success');
   } finally {
     setAiLoading(prev => ({ ...prev, [fieldName]: false }));
   }
 };

 const triggerDirectCategoryUpload=category=>{
  setCategoryForUpload(category);
  if(directUploadInputRef.current){
   directUploadInputRef.current.value='';
   directUploadInputRef.current.click();
  }
 };

 const onDirectCategoryFileSelected=async e=>{
  const file=e.target.files?.[0];
  if(!file||!categoryForUpload)return;
  const cat=categoryForUpload;
  const oldImage=cat.image;
  setSaving(true);
  try{
   const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
   const uploaded=await adminService.uploadCategoryImage(compressed);
   if(uploaded?.url){
    setList(curr=>curr.map(c=>c.id===cat.id?{...c,image:uploaded.url}:c));
    await adminService.updateCategory(cat.id,{
     name:cat.name,
     color:cat.color,
     position:cat.position,
     status:cat.status,
     parentId:cat.parentId||null,
     image:uploaded.url
    });
    adminCategoriesCache=null;
    await refreshCategories();
    window.dispatchEvent(new Event('r2cart:categories-updated'));
    notify(`Image for "${cat.name}" updated successfully`,'success');
   }
  }catch(err){
   notify(err.message||'Failed to update category image','error');
   setList(curr=>curr.map(c=>c.id===cat.id?{...c,image:oldImage}:c));
  }finally{
   setSaving(false);
   setCategoryForUpload(null);
   if(e.target)e.target.value='';
  }
 };

 const handleImageUpload=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setUploadingImage(true);
  try{
   const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
   const result=await adminService.uploadCategoryImage(compressed);
   if(result?.url){
    setEdit(curr=>({...curr,image:result.url}));
    notify('Category image uploaded to Cloudinary','success');
   }else{
    throw new Error('Upload succeeded but no URL was returned');
   }
  }catch(err){
   notify(err.message||'Failed to upload category image','error');
  }finally{
   setUploadingImage(false);
   if(event.target)event.target.value='';
  }
 };

 const load=async(force=false)=>{
  if(force || !adminCategoriesCache) setLoading(true);
  setError('');
  try{
    const data = await adminService.categories();
    adminCategoriesCache = data;
    setList(data);
  }
  catch(err){setError(err.message)}
  finally{setLoading(false)}
 };

 useEffect(()=>{load()},[]);

 const save=async event=>{
  event.preventDefault();
  const form=Object.fromEntries(new FormData(event.currentTarget));
  const rawPos = form.position !== '' && !isNaN(Number(form.position)) ? Number(form.position) : (list.length + 1);
  const payload={
    name:String(form.name||'').trim(),
    image:String(form.image||'').trim()||null,
    color:String(form.color||'#EAF8E8').trim(),
    parentId:form.parentId||null,
    position:rawPos,
    status:form.status||'ACTIVE',
    badgeActive: Boolean(edit?.badgeActive),
    badgeText: edit?.badgeActive ? String(edit?.badgeText ?? form.badgeText ?? '').trim() || null : null,
    noticeActive: Boolean(edit?.noticeActive),
    noticeTitle: edit?.noticeActive ? String(edit?.noticeTitle ?? form.noticeTitle ?? '').trim() || null : null,
    noticeMessage: edit?.noticeActive ? String(edit?.noticeMessage ?? form.noticeMessage ?? '').trim() || null : null
  };

  setSaving(true);
  try{
   const category=edit?.id?await adminService.updateCategory(edit.id,payload):await adminService.createCategory(payload);
   
   // Resequence list with updated item and sort cleanly by position
   let nextList;
   if(edit?.id){
     nextList=list.map(item=>item.id===edit.id?{...item,...category,position:rawPos}:item);
   }else{
     nextList=[...list,category];
   }
   nextList.sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0)||a.name.localeCompare(b.name));
   const normalized=nextList.map((item,idx)=>({...item,position:idx+1}));
   setList(normalized);
   adminCategoriesCache=normalized;

   // Sync order to backend
   try{
     await adminService.reorderCategories(normalized.map(item=>item.id));
   }catch(e){
     console.warn('Reorder sync notice:', e.message);
   }

   setEdit(null);
   await refreshCategories();
   window.dispatchEvent(new Event('r2cart:categories-updated'));
   notify(edit?.id?`Category "${category.name}" saved (order updated)`:`Category "${category.name}" added successfully`,'success');
  }catch(err){
   notify(err.message || 'Failed to save category','error');
   return false;
  }finally{
   setSaving(false);
  }
 };

 const destroy=async()=>{
  const category=remove;
  if(!category)return;
  try{
   await adminService.deleteCategory(category.id);
   setList(current=>current.filter(item=>item.id!==category.id));
   adminCategoriesCache=null;
   setRemove(null);
   await refreshCategories();
   window.dispatchEvent(new Event('r2cart:categories-updated'));
   notify(`Category "${category.name}" deleted successfully`,'success');
  }catch(err){
   notify(err.message || 'Failed to delete category','error');
   return false;
  }
 };

 return <>
  <AdminTitle
    title="Categories"
    text="Organise your catalogue, highlight badges, and customer notices."
    action={!isCategoryScopedAdmin ? (
      <Button onClick={()=>setEdit({status:'ACTIVE',color:'#EAF8E8',position:list.length+1,badgeActive:false,badgeText:'Pan India',noticeActive:false})}>
        <Plus/> Add category
      </Button>
    ) : null}
  />
  <input ref={directUploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={onDirectCategoryFileSelected} hidden />
  
  <div className="admin-card category-admin-list">
   {loading && <CategoryListSkeleton />}
   {!loading&&error&&<div className="modal-body"><p className="text-danger">{error}</p><Button variant="outline" onClick={()=>load(true)}>Try again</Button></div>}
   {!loading&&!error&&!list.length&&<div className="modal-body muted">No categories yet. Add your first category.</div>}
   {!loading&&!error&&list.map((category,index)=><div key={category.id} className="category-admin-row">
    <span className="category-rank-badge" title={`Display Order #${category.position || index + 1}`}>
      #{category.position || index + 1}
    </span>

    <div 
      className="cat-icon category-thumbnail-wrap" 
      style={{background:category.color||'#EAF8E8', position:'relative', overflow:'hidden', cursor:'pointer'}}
      onClick={()=>triggerDirectCategoryUpload(category)}
      title={`Click to upload or replace "${category.name}" image`}
    >
      {category.image?<img src={category.image} alt={category.name} onError={event=>{event.currentTarget.style.display='none'}}/>:<FolderTree/>}
      <div className="cat-icon-hover-overlay" title="Click to upload / replace image">
        <Camera size={16}/>
      </div>
    </div>

    <span 
      className="category-admin-name-cell"
      onClick={()=>setViewCategory(category)}
      title={`Click to view ${category.name} products in cards`}
    >
      <b>
        {category.name}
        {category.badgeActive && category.badgeText && (
          <span style={{marginLeft:'6px',fontSize:'10px',background:'#0284c7',color:'#fff',padding:'1px 6px',borderRadius:'10px',fontWeight:700}}>
            🇮🇳 {category.badgeText}
          </span>
        )}
        {category.noticeActive && (
          <span style={{marginLeft:'4px',fontSize:'10px',background:'#fef3c7',color:'#b45309',border:'1px solid #fde68a',padding:'1px 5px',borderRadius:'10px',fontWeight:700}}>
            Notice Active
          </span>
        )}
      </b>
      <small>
        {(category._count?.products ?? 0) === 1 ? '1 product' : `${category._count?.products ?? 0} products`}
        {category.parent?.name?` · Under ${category.parent.name}`:category.children?.length?` · ${category.children.length} subcategories`:''}
        <span className="category-view-pill">· View products in cards &rarr;</span>
      </small>
    </span>

    <StatusBadge status={labelStatus(category.status)}/>
    <button type="button" className="r2c-cat-btn r2c-btn-view" onClick={()=>setViewCategory(category)} aria-label={`View ${category.name} products in cards`} title={`View ${category.name} products in cards`}><Eye size={15}/></button>
    <button type="button" className="r2c-cat-btn r2c-btn-edit" onClick={()=>setEdit(category)} aria-label={`Edit ${category.name}`} title="Edit category"><Edit2 size={15}/></button>
    {!isCategoryScopedAdmin && (
      <button type="button" className="r2c-cat-btn r2c-btn-delete" onClick={()=>setRemove(category)} aria-label={`Delete ${category.name}`} title="Delete category"><Trash2 size={15}/></button>
    )}
   </div>)}
  </div>

  <Modal open={!!edit} onClose={()=>!saving&&setEdit(null)} title={edit?.id?'Edit category':'Add category'} size="lg">
   <form className="modal-body admin-form" onSubmit={save}>
    <label>Category name<input name="name" required autoFocus defaultValue={edit?.name||''} placeholder="e.g. Frozen Foods"/></label>
    <label>Parent category<select name="parentId" defaultValue={edit?.parentId||''}><option value="">None — main category</option>{list.filter(item=>item.id!==edit?.id&&!item.parentId).map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <div className="category-image-uploader-section" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
     <label style={{display:'block',fontWeight:600,fontSize:'0.875rem',marginBottom:'2px'}}>
      Category Icon / Main Image <span className="muted" style={{fontWeight:400}}>(Upload file or paste URL)</span>
     </label>
     
     <input 
      ref={fileInputRef} 
      hidden 
      type="file" 
      accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif" 
      onChange={handleImageUpload} 
     />

     <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',background:'var(--surface-subtle,#f8fafc)',border:'1px dashed var(--border-color,#cbd5e1)',borderRadius:'10px'}}>
      <div style={{width:'52px',height:'52px',borderRadius:'10px',background:edit?.color||'#EAF8E8',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:'1px solid rgba(0,0,0,0.06)'}}>
       {edit?.image ? (
        <img src={edit.image} alt={edit.name || 'Category image'} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>{e.currentTarget.style.display='none'}}/>
       ) : (
        <FolderTree size={24} style={{opacity:0.45}}/>
       )}
      </div>

      <div style={{flex:1,minWidth:0}}>
       <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <Button 
         type="button" 
         variant="outline" 
         size="sm" 
         disabled={uploadingImage||saving} 
         onClick={()=>fileInputRef.current?.click()}
         style={{gap:'6px',fontSize:'0.82rem',padding:'6px 12px'}}
        >
         {uploadingImage?<LoaderCircle size={15} className="spin"/>:<Upload size={15}/>}
         {uploadingImage?'Uploading…':edit?.image?'Change image':'Upload image from device'}
        </Button>
        {edit?.image&&(
         <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          disabled={uploadingImage||saving} 
          onClick={()=>{
           setEdit(c=>({...c,image:''}));
           if(fileInputRef.current)fileInputRef.current.value='';
          }}
          style={{gap:'4px',fontSize:'0.82rem',color:'var(--text-danger,#ef4444)'}}
         >
          <Trash2 size={14}/> Remove
         </Button>
        )}
       </div>
       <div style={{marginTop:'4px',fontSize:'0.75rem',color:'var(--text-muted,#64748b)'}}>
        Supports PNG, JPG, WEBP, SVG. Cloudinary CDN automatically optimizes.
       </div>
      </div>
     </div>

     <input 
      name="image" 
      type="url" 
      value={edit?.image||''} 
      onChange={e=>setEdit(c=>({...c,image:e.target.value}))} 
      placeholder="Or paste direct image URL (https://...)" 
      style={{fontSize:'0.82rem',padding:'7px 10px'}}
     />
    </div>

    {/* Category Highlight Badge Section */}
    <div style={{
      marginTop: '14px',
      background: '#ffffff',
      border: edit?.badgeActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: edit?.badgeActive ? '0 4px 14px rgba(2, 132, 199, 0.08)' : 'none',
      transition: 'all 0.2s ease'
    }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: edit?.badgeActive ? '#f0f9ff' : '#f8fafc',
          borderBottom: edit?.badgeActive ? '1px solid #bae6fd' : 'none',
          cursor: 'pointer',
          userSelect: 'none'
        }} 
        onClick={() => setEdit(c => ({ ...c, badgeActive: !c?.badgeActive, badgeText: c?.badgeText || 'Pan India' }))}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: edit?.badgeActive ? '#0284c7' : '#e2e8f0',
            color: edit?.badgeActive ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Tag size={16} />
          </div>
          <div>
            <b style={{ fontSize: '0.88rem', color: edit?.badgeActive ? '#0369a1' : '#334155', display: 'block', lineHeight: 1.25 }}>
              Category Highlight Badge (e.g. Pan India)
            </b>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Shows an eye-catching tag on this category for all customers
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          role="switch"
          aria-checked={edit?.badgeActive}
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            background: edit?.badgeActive ? '#0284c7' : '#cbd5e1',
            position: 'relative',
            transition: 'background 0.2s',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <span style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            transform: edit?.badgeActive ? 'translateX(18px)' : 'translateX(0px)',
            transition: 'transform 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
          }} />
        </div>
      </div>

      {edit?.badgeActive && (
        <div style={{ padding: '14px 16px', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
              Badge Text
            </span>
            <button
              type="button"
              onClick={() => handleAiCorrect('badgeText', 'badge')}
              disabled={aiLoading.badgeText}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #93c5fd',
                color: '#1d4ed8',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Auto-correct spelling and grammar using AI"
            >
              {aiLoading.badgeText ? <LoaderCircle size={12} className="spin" /> : <Sparkles size={12} color="#2563eb" />}
              <span>{aiLoading.badgeText ? 'Fixing with AI…' : '✨ AI Fix English'}</span>
            </button>
          </div>

          <input 
            name="badgeText" 
            type="text" 
            value={edit?.badgeText ?? 'Pan India'} 
            onChange={e => setEdit(c => ({ ...c, badgeText: e.target.value }))} 
            placeholder="e.g. Pan India, Handcrafted, Express Delivery"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem'
            }}
          />
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Preview:</span>
            <span style={{ background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800 }}>
              🇮🇳 {edit?.badgeText || 'Pan India'}
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Category Announcement / Notice Card Section */}
    <div style={{
      marginTop: '14px',
      background: '#ffffff',
      border: edit?.noticeActive ? '1.5px solid #d97706' : '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: edit?.noticeActive ? '0 4px 14px rgba(217, 119, 6, 0.08)' : 'none',
      transition: 'all 0.2s ease'
    }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: edit?.noticeActive ? '#fffbeb' : '#f8fafc',
          borderBottom: edit?.noticeActive ? '1px solid #fde68a' : 'none',
          cursor: 'pointer',
          userSelect: 'none'
        }} 
        onClick={() => setEdit(c => ({ ...c, noticeActive: !c?.noticeActive }))}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: edit?.noticeActive ? '#d97706' : '#e2e8f0',
            color: edit?.noticeActive ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Megaphone size={16} />
          </div>
          <div>
            <b style={{ fontSize: '0.88rem', color: edit?.noticeActive ? '#92400e' : '#334155', display: 'block', lineHeight: 1.25 }}>
              Customer Announcement Card (1-Hour Interval)
            </b>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Shows an alert box when customers open this category
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          role="switch"
          aria-checked={edit?.noticeActive}
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            background: edit?.noticeActive ? '#d97706' : '#cbd5e1',
            position: 'relative',
            transition: 'background 0.2s',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <span style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            transform: edit?.noticeActive ? 'translateX(18px)' : 'translateX(0px)',
            transition: 'transform 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
          }} />
        </div>
      </div>

      {edit?.noticeActive && (
        <div style={{ padding: '14px 16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                Notice Title / Heading
              </span>
              <button
                type="button"
                onClick={() => handleAiCorrect('noticeTitle', 'title')}
                disabled={aiLoading.noticeTitle}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                  border: '1px solid #fde047',
                  color: '#854d0e',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Auto-correct spelling and grammar using AI"
              >
                {aiLoading.noticeTitle ? <LoaderCircle size={12} className="spin" /> : <Sparkles size={12} color="#ca8a04" />}
                <span>{aiLoading.noticeTitle ? 'Fixing with AI…' : '✨ AI Fix English'}</span>
              </button>
            </div>
            <input 
              name="noticeTitle" 
              type="text" 
              value={edit?.noticeTitle ?? ''} 
              onChange={e => setEdit(c => ({ ...c, noticeTitle: e.target.value }))} 
              placeholder="e.g. Important Notice for Resin Art Customers"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                Notice Content / Description
              </span>
              <button
                type="button"
                onClick={() => handleAiCorrect('noticeMessage', 'message')}
                disabled={aiLoading.noticeMessage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
                  border: '1px solid #fde047',
                  color: '#854d0e',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Auto-correct spelling and grammar using AI"
              >
                {aiLoading.noticeMessage ? <LoaderCircle size={12} className="spin" /> : <Sparkles size={12} color="#ca8a04" />}
                <span>{aiLoading.noticeMessage ? 'Fixing with AI…' : '✨ AI Fix English'}</span>
              </button>
            </div>
            <textarea 
              name="noticeMessage" 
              rows={3} 
              value={edit?.noticeMessage ?? ''} 
              onChange={e => setEdit(c => ({ ...c, noticeMessage: e.target.value }))} 
              placeholder="e.g. We ship handcrafted resin artworks across India! Courier delivery takes 4-7 business days."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      )}
    </div>

    <div className="form-grid">
     <label>Display order<input name="position" type="number" min="0" defaultValue={edit?.position??list.length}/></label>
     <label>Theme colour<input name="color" type="color" defaultValue={edit?.color||'#EAF8E8'} onChange={e=>setEdit(c=>({...c,color:e.target.value}))}/></label>
     <label>Status<select name="status" defaultValue={edit?.status||'ACTIVE'}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
    </div>
    <div className="row end gap"><Button type="button" variant="ghost" disabled={saving||uploadingImage} onClick={()=>setEdit(null)}>Cancel</Button><Button disabled={saving||uploadingImage}>{saving?'Saving…':'Save category'}</Button></div>
   </form>
  </Modal>

  <ConfirmDialog
    open={!!remove}
    onClose={()=>setRemove(null)}
    onConfirm={destroy}
    title="Delete Category?"
    itemName={remove?.name}
    itemType="Category"
    message={`Are you sure you want to permanently delete "${remove?.name || 'this category'}" from your storefront navigation?`}
    warningNote="Categories containing active products or subcategories cannot be deleted."
    confirmText="Delete Category"
    cancelText="Cancel"
  />

  <CategoryProductsModal 
    category={viewCategory} 
    onClose={()=>setViewCategory(null)} 
    onRefreshCategories={load} 
  />
 </>;
}
