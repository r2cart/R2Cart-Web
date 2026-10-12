import {useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {Eye,MapPin,Package,Search} from 'lucide-react';
import {Button,Modal,StatusBadge,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {adminService} from '../../services/admin.service';

const AdminTitle=({title,text})=><div className="admin-title"><div><h1>{title}</h1><p>{text}</p></div></div>;
const date=value=>value?new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const statusLabel=value=>value==='ACTIVE'?'Active':'Inactive';
const orderStatus=value=>String(value||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const addressLine=address=>[address.house,address.street,address.landmark,address.area,address.city,address.district,address.state,address.pin].filter(Boolean).join(', ');

export function AdminCustomers(){
 const {notify}=useApp();
 const [params]=useSearchParams();
 const [customers,setCustomers]=useState([]);
 const [selected,setSelected]=useState(null);
 const [q,setQ]=useState(()=>params.get('q')||'');
 useEffect(()=>{setQ(params.get('q')||'')},[params]);
 const [status,setStatus]=useState('all');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const toggle=async customer=>{setSaving(true);try{await adminService.updateCustomerStatus(customer.id,customer.status==='ACTIVE'?'INACTIVE':'ACTIVE');await load();notify('Customer account status saved')}catch(reason){notify(reason.message,'error')}finally{setSaving(false)}};
 const load=async()=>{setLoading(true);setError('');try{setCustomers(await adminService.customers())}catch(err){setError(err.message);notify(err.message,'error')}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const list=useMemo(()=>{const query=q.trim().toLowerCase();return customers.filter(customer=>(status==='all'||customer.status===status)&&(!query||[customer.name,customer.email,customer.mobile].some(value=>String(value||'').toLowerCase().includes(query))))},[customers,q,status]);
 return <>
  <AdminTitle title="Customers" text={`${customers.length} registered customers from the database`}/>
  <FilterBar q={q} setQ={setQ}><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></FilterBar>
  <div className="admin-card table-card"><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Total orders</th><th>Spent · delivered orders</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>
   {loading?<tr><td colSpan="7">Loading customers…</td></tr>:error?<tr><td colSpan="7"><span className="text-danger">{error}</span> <Button variant="outline" onClick={load}>Try again</Button></td></tr>:!list.length?<tr><td colSpan="7">No customers match these filters.</td></tr>:list.map(customer=><tr key={customer.id}><td><b>{customer.name||'Unnamed customer'}</b><small>{customer.email}</small></td><td>{customer.mobile||'—'}</td><td>{customer.totalOrders??customer.orders?.length??0}</td><td><b>{money(customer.totalSpent||0)}</b></td><td>{date(customer.createdAt)}</td><td><button disabled={saving} onClick={()=>toggle(customer)} aria-label="Toggle customer account status"><StatusBadge status={statusLabel(customer.status)}/></button></td><td><button className="icon-btn" onClick={()=>setSelected(customer)} aria-label={`View ${customer.name}`}><Eye/></button></td></tr>)}
  </tbody></table></div></div>
  <CustomerDetails customer={selected} close={()=>setSelected(null)}/>
 </>;
}

function FilterBar({q,setQ,children}){return <div className="filter-bar"><div className="filter-search"><Search/><input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search by name, email or mobile"/></div>{children}</div>}

function CustomerDetails({customer,close}){
 if(!customer)return null;
 const addresses=customer.addresses||[],orders=[...(customer.orders||[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
 const initials=(customer.name||customer.email||'C').split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase();
 return <Modal open onClose={close} title="Customer details" size="location-modal"><div className="modal-body customer-detail"><div className="large-avatar">{initials}</div><h3>{customer.name||'Unnamed customer'}</h3><p>{customer.email}<br/>{customer.mobile||'Mobile not provided'}</p><StatusBadge status={statusLabel(customer.status)}/><div className="mini-stats"><div><span>Total orders</span><b>{customer.totalOrders??orders.length}</b></div><div><span>Total spending</span><b>{money(customer.totalSpent||0)}</b></div></div><h4><MapPin/> Saved addresses</h4>{addresses.length?addresses.map(address=><div className="message-box" key={address.id}><b>{address.type||'Address'}{address.isDefault?' · Default':''}</b><p>{addressLine(address)||'Address details unavailable'}</p></div>):<p className="muted">No saved addresses.</p>}<h4><Package/> Recent orders</h4>{orders.length?orders.slice(0,5).map(order=><div className="message-box row between" key={order.id}><span><Link to={`/admin/orders/${order.id}`}><b>#{order.orderNumber||order.id}</b></Link><small>{date(order.createdAt)}</small></span><span><b>{money(order.grandTotal||0)}</b><small>{orderStatus(order.status)}</small></span></div>):<p className="muted">No orders placed yet.</p>}</div></Modal>;
}
