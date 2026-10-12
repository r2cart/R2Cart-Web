import {useEffect,useMemo,useState} from 'react';
import {Button,Modal,StatusBadge} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const AdminTitle=({title,text})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div></div>;
const tabs=[['All','ALL'],['Low Stock','LOW_STOCK'],['Out of Stock','OUT_OF_STOCK']];
const statusLabel=status=>status==='OUT_OF_STOCK'?'Out of stock':status==='LOW_STOCK'?'Low stock':'Active';

export function AdminInventory(){
 const {notify,refreshProducts}=useApp();
 const [items,setItems]=useState([]);
 const [tab,setTab]=useState('ALL');
 const [selected,setSelected]=useState(null);
 const [stock,setStock]=useState('');
 const [threshold,setThreshold]=useState('');
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');

 const load=async()=>{setLoading(true);setError('');try{setItems(await adminService.inventory())}catch(err){setError(err.message);notify(err.message,'error')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const list=useMemo(()=>tab==='ALL'?items:items.filter(item=>item.stockStatus===tab),[items,tab]);
 const open=product=>{setSelected(product);setStock(String(product.stock));setThreshold(String(product.lowStockThreshold))};
 const close=()=>{if(!saving)setSelected(null)};
 const save=async event=>{event.preventDefault();const nextStock=Number(stock),nextThreshold=Number(threshold);if(!Number.isInteger(nextStock)||nextStock<0||!Number.isInteger(nextThreshold)||nextThreshold<0)return notify('Enter valid whole-number stock values','error');setSaving(true);try{const saved=await adminService.updateStock(selected.id,{stock:nextStock,lowStockThreshold:nextThreshold});setItems(current=>current.map(item=>item.id===saved.id?saved:item));await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify('Inventory updated');setSelected(null)}catch(err){notify(err.message,'error')}finally{setSaving(false)}};

 return <>
  <AdminTitle title="Inventory" text={`${items.length} database products · stock updates publish to the customer store`}/>
  <div className="tabs admin-tabs">{tabs.map(([label,value])=><button className={tab===value?'active':''} onClick={()=>setTab(value)} key={value}>{label} <small>{value==='ALL'?items.length:items.filter(item=>item.stockStatus===value).length}</small></button>)}</div>
  <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Current stock</th><th>Low stock threshold</th><th>Status</th><th>Action</th></tr></thead><tbody>
   {loading?<tr><td colSpan="5">Loading inventory…</td></tr>:error?<tr><td colSpan="5"><span className="text-danger">{error}</span> <Button variant="outline" onClick={load}>Try again</Button></td></tr>:!list.length?<tr><td colSpan="5">No products in this stock state.</td></tr>:list.map(product=><tr key={product.id}><td><div className="product-cell">{product.image&&<img src={product.image} alt=""/>}<span><b>{product.name}</b><small>{product.sku} · {product.unit}</small></span></div></td><td><b>{product.stock}</b></td><td>{product.lowStockThreshold}</td><td><StatusBadge status={statusLabel(product.stockStatus)}/></td><td><Button variant="outline" onClick={()=>open(product)}>Update stock</Button></td></tr>)}
  </tbody></table></div></div>
  <Modal open={!!selected} onClose={close} title={`Update ${selected?.name||'stock'}`}><form className="modal-body admin-form" onSubmit={save}><label>Current stock<input type="number" min="0" step="1" required value={stock} onChange={event=>setStock(event.target.value)}/></label><label>Low stock threshold<input type="number" min="0" step="1" required value={threshold} onChange={event=>setThreshold(event.target.value)}/></label><p className="muted">The product will show as low stock when its quantity is at or below this threshold.</p><div className="row end gap"><Button type="button" variant="ghost" disabled={saving} onClick={close}>Cancel</Button><Button disabled={saving}>{saving?'Updating…':'Update stock'}</Button></div></form></Modal>
 </>;
}
