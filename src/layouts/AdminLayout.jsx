import {useState} from 'react';
import AdminNavbarActions from '../components/admin/AdminNavbarActions';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,Bell,ChevronLeft,ChevronRight,FileText,Image as ImageIcon,LayoutDashboard,Menu,Package,PanelLeftClose,Search,Settings,ShoppingBasket,Tags,Ticket,Truck,Users,X} from 'lucide-react';
import {Logo} from './CustomerLayout';
import {authService} from '../services/auth.service';
import {BRAND} from '../config/brand';

const links=[['/admin/dashboard','Dashboard',LayoutDashboard],['/admin/products','Products',ShoppingBasket],['/admin/categories','Categories',Tags],['/admin/orders','Orders',Package],['/admin/customers','Customers',Users],['/admin/inventory','Inventory',PanelLeftClose],['/admin/coupons','Coupons',Ticket],['/admin/banners','Banners',ImageIcon],['/admin/delivery','Delivery',Truck],['/admin/policies','Policies & CMS',FileText],['/admin/support','Support',Bell],['/admin/settings','Settings',Settings]];

function getAdminInfo(){
 try{
  const raw=localStorage.getItem('grocify-admin-user');
  const user=raw?JSON.parse(raw):null;
  const name=user?.name||'Store administrator';
  const initials=(user?.name||'Admin').trim().split(/\s+/).map(x=>x[0]).filter(Boolean).join('').slice(0,2).toUpperCase()||'AD';
  return {name,initials};
 }catch{
  return {name:'Store administrator',initials:'AD'};
 }
}

export default function AdminLayout({children}){
 const [collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(false);
 const nav=useNavigate(),location=useLocation(),showBack=location.pathname!=='/admin/dashboard';
 const {name:adminName,initials:adminInitials}=getAdminInfo();

 useState(()=>{
  const token=localStorage.getItem('grocify-admin-access-token');
  if(!token){
   window.location.replace('/admin/login');
  }
 });

 return <div className={`admin-shell ${collapsed?'collapsed':''}`}>
  <div className={`admin-overlay ${mobile?'show':''}`} onClick={()=>setMobile(false)}/>
  <aside className={`admin-sidebar ${mobile?'mobile-show':''}`}>
   <div className="admin-brand"><Logo/><button onClick={()=>setMobile(false)}><X/></button></div>
   <div className="workspace-label">STORE MANAGEMENT</div>
   <nav>{links.map(([to,label,Icon])=><NavLink to={to} key={to} onClick={()=>setMobile(false)}><Icon/><span>{label}</span></NavLink>)}</nav>
   <div className="admin-user"><div>{adminInitials}</div><span><b>{adminName}</b><small>Store administrator</small></span><button onClick={async()=>{await authService.adminLogout();nav('/admin/login')}} aria-label="Sign out">↗</button></div>
  </aside>
  <div className="admin-content">
   <header className="admin-header"><div className="row gap"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button>{showBack&&<button className="admin-back" onClick={()=>location.key!=='default'?nav(-1):nav('/admin/dashboard')} title="Go back"><ArrowLeft/></button>}<button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</button><div><b>{BRAND.name} Admin</b><small>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</small></div></div><AdminNavbarActions/></header>
   <main className="admin-main">{children}</main>
  </div>
 </div>
}
