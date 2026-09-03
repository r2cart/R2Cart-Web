import {useState} from 'react';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,Bell,ChevronLeft,ChevronRight,Image as ImageIcon,LayoutDashboard,Menu,Package,PanelLeftClose,Search,Settings,ShoppingBasket,Tags,Ticket,Truck,Users,X} from 'lucide-react';
import {Logo} from './CustomerLayout';

const links=[['/admin/dashboard','Dashboard',LayoutDashboard],['/admin/products','Products',ShoppingBasket],['/admin/categories','Categories',Tags],['/admin/orders','Orders',Package],['/admin/customers','Customers',Users],['/admin/inventory','Inventory',PanelLeftClose],['/admin/coupons','Coupons',Ticket],['/admin/banners','Banners',ImageIcon],['/admin/delivery','Delivery',Truck],['/admin/support','Support',Bell],['/admin/settings','Settings',Settings]];

export default function AdminLayout({children}){
 const [collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(false);
 const nav=useNavigate(),location=useLocation(),showBack=location.pathname!=='/admin/dashboard';
 return <div className={`admin-shell ${collapsed?'collapsed':''}`}>
  <div className={`admin-overlay ${mobile?'show':''}`} onClick={()=>setMobile(false)}/>
  <aside className={`admin-sidebar ${mobile?'mobile-show':''}`}>
   <div className="admin-brand"><Logo/><button onClick={()=>setMobile(false)}><X/></button></div>
   <div className="workspace-label">STORE MANAGEMENT</div>
   <nav>{links.map(([to,label,Icon])=><NavLink to={to} key={to} onClick={()=>setMobile(false)}><Icon/><span>{label}</span></NavLink>)}</nav>
   <div className="admin-user"><div>AS</div><span><b>Aarav Sharma</b><small>Store administrator</small></span><button onClick={()=>{localStorage.removeItem('grocify-admin');nav('/admin/login')}} aria-label="Sign out">↗</button></div>
  </aside>
  <div className="admin-content">
   <header className="admin-header"><div className="row gap"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button>{showBack&&<button className="admin-back" onClick={()=>location.key!=='default'?nav(-1):nav('/admin/dashboard')} title="Go back"><ArrowLeft/></button>}<button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</button><div><b>Grocify Admin</b><small>Thursday, 03 September 2026</small></div></div><div className="admin-head-actions"><div className="admin-search"><Search/><input placeholder="Search anything…"/></div><button className="notification"><Bell/><i>3</i></button><div className="head-avatar">AS</div></div></header>
   <main className="admin-main">{children}</main>
  </div>
 </div>
}
