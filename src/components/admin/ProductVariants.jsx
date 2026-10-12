import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button,money} from '../ui';
import {adminService} from '../../services/admin.service';
import {useApp} from '../../context/AppContext';

const empty={unit:'',mrp:'',price:'',stock:''};
export default function ProductVariants({productId}){
 const {notify,refreshProducts}=useApp();
 const [packs,setPacks]=useState([]),[form,setForm]=useState(empty),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{try{setPacks(await adminService.productVariants(productId));setError('')}catch(reason){setError(reason.message)}};
 useEffect(()=>{load()},[productId]);
 const add=async()=>{if(!form.unit.trim()||Object.values(form).some(value=>value===''))return notify('Complete all pack size fields','error');setBusy(true);try{await adminService.addProductVariant(productId,{...form,mrp:Number(form.mrp),price:Number(form.price),stock:Number(form.stock)});setForm(empty);await load();await refreshProducts();window.dispatchEvent(new Event('grocify:products-updated'));notify('New pack size saved')}catch(reason){notify(reason.message,'error')}finally{setBusy(false)}};
 return <section className="admin-card"><h3>Pack sizes / variants</h3><p className="muted">Each pack has its own price, stock and automatic SKU. Save the main product before adding more sizes.</p>{error?<><p className="text-danger">{error}</p><Button type="button" variant="outline" onClick={load}>Retry</Button></>:<div className="variant-admin-list">{packs.map(pack=><div key={pack.id}><b>{pack.unit}</b><span>{money(pack.price)} · {pack.stock} in stock · {pack.status}</span><Link to={`/admin/products/${pack.id}/edit`}>Edit pack</Link></div>)}</div>}<div className="form-grid">{[['unit','Pack size','text'],['mrp','MRP (₹)','number'],['price','Selling price (₹)','number'],['stock','Stock','number']].map(([key,label,type])=><label key={key}>{label}<input type={type} min="0" step={key==='stock'?'1':'any'} placeholder={key==='unit'?'e.g. 1 L or 1 kg':undefined} value={form[key]} onChange={event=>setForm(value=>({...value,[key]:event.target.value}))}/></label>)}</div><Button type="button" variant="outline" disabled={busy} onClick={add}>{busy?'Saving pack…':'Add pack size'}</Button></section>;
}
