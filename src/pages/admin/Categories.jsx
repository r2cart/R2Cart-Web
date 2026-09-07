import {useEffect,useState} from 'react';
import {Edit2,FolderTree,Plus,Trash2} from 'lucide-react';
import {Button,ConfirmDialog,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const AdminTitle=({title,text,action})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>;
const labelStatus=status=>status==='ACTIVE'?'Active':'Inactive';

export function AdminCategories(){
 const {notify,refreshCategories}=useApp();
 const [list,setList]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [edit,setEdit]=useState(null);
 const [remove,setRemove]=useState(null);
 const [saving,setSaving]=useState(false);

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
   notify(edit?.id?'Category updated':'New category added');
  }catch(err){notify(err.message,'error')}
  finally{setSaving(false)}
 };

 const destroy=async()=>{
  const category=remove;
  if(!category)return;
  try{
   await adminService.deleteCategory(category.id);
   setList(current=>current.filter(item=>item.id!==category.id));
   await refreshCategories();
   window.dispatchEvent(new Event('grocify:categories-updated'));
   notify('Category deleted');
  }catch(err){notify(err.message,'error')}
 };

 return <>
  <AdminTitle title="Categories" text="Organise your catalogue and storefront navigation." action={<Button onClick={()=>setEdit({status:'ACTIVE',color:'#EAF8E8',position:list.length})}><Plus/> Add category</Button>}/>
  <div className="admin-card category-admin-list">
   {loading&&<div className="modal-body muted">Loading categories…</div>}
   {!loading&&error&&<div className="modal-body"><p className="text-danger">{error}</p><Button variant="outline" onClick={load}>Try again</Button></div>}
   {!loading&&!error&&!list.length&&<div className="modal-body muted">No categories yet. Add your first category.</div>}
   {!loading&&!error&&list.map(category=><div key={category.id}>
    <span className="drag" title={`Display order ${category.position}`}>⠿</span>
    <div className="cat-icon" style={{background:category.color||'#EAF8E8'}}>{category.image?<img src={category.image} alt="" onError={event=>{event.currentTarget.style.display='none'}}/>:<FolderTree/>}</div>
    <span><b>{category.name}</b><small>{category._count?.products??0} products{category.parent?.name?` · Under ${category.parent.name}`:category.children?.length?` · ${category.children.length} subcategories`:''}</small></span>
    <StatusBadge status={labelStatus(category.status)}/>
    <button onClick={()=>setEdit(category)} aria-label={`Edit ${category.name}`}><Edit2/></button>
    <button onClick={()=>setRemove(category)} aria-label={`Delete ${category.name}`}><Trash2/></button>
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
  <ConfirmDialog open={!!remove} onClose={()=>setRemove(null)} onConfirm={destroy} title={`Delete ${remove?.name||'category'}?`} message="This permanently removes an empty category. Categories containing products or subcategories cannot be deleted."/>
 </>;
}
