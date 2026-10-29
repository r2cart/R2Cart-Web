import {useEffect,useState,useRef} from 'react';
import {Camera,Edit2,Eye,FolderTree,Plus,Trash2,Upload,LoaderCircle} from 'lucide-react';
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
 const {notify,refreshCategories}=useApp();
 const [list,setList]=useState(adminCategoriesCache || []);
 const [loading,setLoading]=useState(!adminCategoriesCache);
 const [error,setError]=useState('');
 const [edit,setEdit]=useState(null);
 const [remove,setRemove]=useState(null);
 const [viewCategory,setViewCategory]=useState(null);
 const [saving,setSaving]=useState(false);
 const [uploadingImage,setUploadingImage]=useState(false);
 const fileInputRef=useRef(null);
 const directUploadInputRef=useRef(null);
 const [categoryForUpload,setCategoryForUpload]=useState(null);

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
    status:form.status||'ACTIVE'
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
  <AdminTitle title="Categories" text="Organise your catalogue and storefront navigation." action={<Button onClick={()=>setEdit({status:'ACTIVE',color:'#EAF8E8',position:list.length+1})}><Plus/> Add category</Button>}/>
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
      <b>{category.name}</b>
      <small>
        {(category._count?.products ?? 0) === 1 ? '1 product' : `${category._count?.products ?? 0} products`}
        {category.parent?.name?` · Under ${category.parent.name}`:category.children?.length?` · ${category.children.length} subcategories`:''}
        <span className="category-view-pill">· View products in cards &rarr;</span>
      </small>
    </span>

    <StatusBadge status={labelStatus(category.status)}/>
    <button type="button" className="r2c-cat-btn r2c-btn-view" onClick={()=>setViewCategory(category)} aria-label={`View ${category.name} products in cards`} title={`View ${category.name} products in cards`}><Eye size={15}/></button>
    <button type="button" className="r2c-cat-btn r2c-btn-edit" onClick={()=>setEdit(category)} aria-label={`Edit ${category.name}`} title="Edit category"><Edit2 size={15}/></button>
    <button type="button" className="r2c-cat-btn r2c-btn-delete" onClick={()=>setRemove(category)} aria-label={`Delete ${category.name}`} title="Delete category"><Trash2 size={15}/></button>
   </div>)}
  </div>

  <Modal open={!!edit} onClose={()=>!saving&&setEdit(null)} title={edit?.id?'Edit category':'Add category'}>
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
