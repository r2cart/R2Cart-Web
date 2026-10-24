import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUp,Edit2,Eye,FolderTree,Plus,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';
import CategoryProductsModal from '../../components/admin/CategoryProductsModal';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const labelStatus=status=>status==='ACTIVE'?'Active':'Inactive';

export function AdminCategories(){
 const {notify,refreshCategories}=useApp();
 const [list,setList]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [edit,setEdit]=useState(null);
 const [remove,setRemove]=useState(null);
 const [viewCategory,setViewCategory]=useState(null);
 const [saving,setSaving]=useState(false);
 const move=async(index,direction)=>{const next=[...list],target=index+direction;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];setSaving(true);try{await adminService.reorderCategories(next.map(item=>item.id));await load();await refreshCategories();window.dispatchEvent(new Event('grocify:categories-updated'))}catch(reason){notify(reason.message,'error')}finally{setSaving(false)}};

 const load=async()=>{
  setLoading(true);setError('');
  try{setList(await adminService.categories())}
  catch(err){setError(err.message)}
  finally{setLoading(false)}
 };
 useEffect(()=>{load()},[]);

 const save=async event=>{
  event.preventDefault();
  const form=Object.fromEntries(new FormData(event.currentTarget));
  const payload={name:form.name,image:form.image,color:form.color,parentId:form.parentId||null,position:Number(form.position||0),status:form.status};
  setSaving(true);
  try{
   const category=edit?.id?await adminService.updateCategory(edit.id,payload):await adminService.createCategory(payload);
   setList(current=>edit?.id?current.map(item=>item.id===edit.id?category:item):[...current,category].sort((a,b)=>a.position-b.position||a.name.localeCompare(b.name)));
   setEdit(null);
   await refreshCategories();
   window.dispatchEvent(new Event('grocify:categories-updated'));
   notify(edit?.id?`Category "${category.name}" updated successfully`:`Category "${category.name}" added successfully`,'success');
  }catch(err){notify(err.message || 'Failed to save category','error');return false}
  finally{setSaving(false)}
 };

 const destroy=async()=>{
  const category=remove;
  if(!category)return;
  try{
   await adminService.deleteCategory(category.id);
   setList(current=>current.filter(item=>item.id!==category.id));
   setRemove(null);
   await refreshCategories();
   window.dispatchEvent(new Event('grocify:categories-updated'));
   notify(`Category "${category.name}" deleted successfully`,'success');
  }catch(err){notify(err.message || 'Failed to delete category','error');return false}
 };

 return <>
  <AdminTitle title="Categories" text="Organise your catalogue and storefront navigation." action={<Button onClick={()=>setEdit({status:'ACTIVE',color:'#EAF8E8',position:list.length})}><Plus/> Add category</Button>}/>
  <div className="admin-card category-admin-list">
   {loading&&<div className="modal-body muted">Loading categories…</div>}
   {!loading&&error&&<div className="modal-body"><p className="text-danger">{error}</p><Button variant="outline" onClick={load}>Try again</Button></div>}
   {!loading&&!error&&!list.length&&<div className="modal-body muted">No categories yet. Add your first category.</div>}
   {!loading&&!error&&list.map((category,index)=><div key={category.id} className="category-admin-row">
    <div className="category-order-actions"><button disabled={saving||index===0} onClick={()=>move(index,-1)} aria-label="Move category up"><ArrowUp size={16}/></button><button disabled={saving||index===list.length-1} onClick={()=>move(index,1)} aria-label="Move category down"><ArrowDown size={16}/></button></div>
    <div 
      className="cat-icon category-clickable-target" 
      style={{background:category.color||'#EAF8E8'}}
      onClick={()=>setViewCategory(category)}
      title={`Click to view ${category.name} products in cards`}
    >
      {category.image?<img src={category.image} alt="" onError={event=>{event.currentTarget.style.display='none'}}/>:<FolderTree/>}
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
    <button type="button" onClick={()=>setViewCategory(category)} aria-label={`View ${category.name} products in cards`} title={`View ${category.name} products in card shape`} style={{color:'var(--green, #10b981)'}}><Eye size={17}/></button>
    <button type="button" onClick={()=>setEdit(category)} aria-label={`Edit ${category.name}`} title="Edit category"><Edit2/></button>
    <button type="button" onClick={()=>setRemove(category)} aria-label={`Delete ${category.name}`} title="Delete category"><Trash2/></button>
   </div>)}
  </div>
  <Modal open={!!edit} onClose={()=>!saving&&setEdit(null)} title={edit?.id?'Edit category':'Add category'}>
   <form className="modal-body admin-form" onSubmit={save}>
    <label>Category name<input name="name" required autoFocus defaultValue={edit?.name||''} placeholder="e.g. Frozen Foods"/></label>
    <label>Parent category<select name="parentId" defaultValue={edit?.parentId||''}><option value="">None — main category</option>{list.filter(item=>item.id!==edit?.id&&!item.parentId).map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label>Image URL <span className="muted">(optional)</span><input name="image" type="url" defaultValue={edit?.image||''} placeholder="https://example.com/category.jpg"/></label>
    <div className="form-grid">
     <label>Display order<input name="position" type="number" min="0" defaultValue={edit?.position??list.length}/></label>
     <label>Theme colour<input name="color" type="color" defaultValue={edit?.color||'#EAF8E8'}/></label>
     <label>Status<select name="status" defaultValue={edit?.status||'ACTIVE'}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
    </div>
    <div className="row end gap"><Button type="button" variant="ghost" disabled={saving} onClick={()=>setEdit(null)}>Cancel</Button><Button disabled={saving}>{saving?'Saving…':'Save category'}</Button></div>
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
