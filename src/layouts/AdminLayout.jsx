import {useEffect,useState} from 'react';
import AdminNavbarActions from '../components/admin/AdminNavbarActions';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,Bell,ChevronLeft,ChevronRight,FileText,Image as ImageIcon,LayoutDashboard,LayoutTemplate,Menu,Package,PanelLeftClose,Search,Settings,ShoppingBasket,Tags,Ticket,Truck,Users,X} from 'lucide-react';
import {Logo} from './CustomerLayout';
import {authService} from '../services/auth.service';
import {BRAND} from '../config/brand';
import {subscribeToPush,getNotificationPermission} from '../services/pushNotification.service';

const links=[['/admin/dashboard','Dashboard',LayoutDashboard],['/admin/products','Products',ShoppingBasket],['/admin/categories','Categories',Tags],['/admin/orders','Orders',Package],['/admin/customers','Customers',Users],['/admin/inventory','Inventory',PanelLeftClose],['/admin/coupons','Coupons',Ticket],['/admin/banners','Banners',ImageIcon],['/admin/storefront','Storefront Layout',LayoutTemplate],['/admin/delivery','Delivery',Truck],['/admin/policies','Policies & CMS',FileText],['/admin/support','Support',Bell],['/admin/settings','Settings',Settings]];

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
 const [perm,setPerm]=useState(()=>getNotificationPermission());
 const [orderAlert,setOrderAlert]=useState(null);
 const nav=useNavigate(),location=useLocation(),showBack=location.pathname!=='/admin/dashboard';
 const {name:adminName,initials:adminInitials}=getAdminInfo();

 useState(()=>{
  const token=localStorage.getItem('grocify-admin-access-token');
  if(!token){
   window.location.replace('/admin/login');
  }
 });

 useEffect(()=>{
  if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
   subscribeToPush({role:'ADMIN'}).catch(()=>{});
  }

  // Listen for new order alerts dispatched from SW push or polling
  const handleOrderAlert=(e)=>{
   if(e.detail){
    setOrderAlert(e.detail);
   }
  };
  window.addEventListener('r2cart:new-order-alert',handleOrderAlert);
  return()=>window.removeEventListener('r2cart:new-order-alert',handleOrderAlert);
 },[]);

 return <div className={`admin-shell ${collapsed?'collapsed':''}`}>
  <div className={`admin-overlay ${mobile?'show':''}`} onClick={()=>setMobile(false)}/>
  <aside className={`admin-sidebar ${mobile?'mobile-show':''}`}>
   <div className="admin-brand"><Logo/><button onClick={()=>setMobile(false)}><X/></button></div>
   <div className="workspace-label">STORE MANAGEMENT</div>
   <nav>{links.map(([to,label,Icon])=><NavLink to={to} key={to} onClick={()=>setMobile(false)}><Icon/><span>{label}</span></NavLink>)}</nav>
   <div className="admin-user"><div>{adminInitials}</div><span><b>{adminName}</b><small>Store administrator</small></span><button onClick={async()=>{await authService.adminLogout();nav('/admin/login')}} aria-label="Sign out">↗</button></div>
  </aside>
  <div className="admin-content">
   {/* In-App Floating New Order Banner */}
   {orderAlert&&(
    <aside
     role="alert"
     aria-live="assertive"
     style={{
      position:'fixed',
      top:'18px',
      right:'24px',
      zIndex:99999,
      maxWidth:'460px',
      width:'calc(100vw - 48px)',
      background:'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      border:'2px solid #10b981',
      boxShadow:'0 20px 40px -5px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.45)',
      borderRadius:'14px',
      padding:'16px 18px',
      color:'#fff'
     }}
    >
     <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
      <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(16, 185, 129, 0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>
       🚨
      </div>
      <div style={{flex:1,minWidth:0}}>
       <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
        <strong style={{fontSize:'13px',color:'#6ee7b7',letterSpacing:'0.5px',textTransform:'uppercase'}}>
         New Order Received!
        </strong>
        <button
         onClick={()=>setOrderAlert(null)}
         style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',padding:'2px 4px',fontSize:'16px',lineHeight:1}}
         aria-label="Dismiss banner"
        >
         ✕
        </button>
       </div>
       <div style={{fontSize:'13px',marginTop:'4px',color:'#f3f4f6',lineHeight:1.4}}>
        Order <b>#{orderAlert.orderNumber}</b>
        {orderAlert.total?` · ₹${orderAlert.total}`:''}
        {orderAlert.customerName?` by ${orderAlert.customerName}`:''}
       </div>
       <div style={{marginTop:'12px',display:'flex',gap:'8px'}}>
        <button
         onClick={()=>{
          const url=orderAlert.url||'/admin/orders';
          setOrderAlert(null);
          nav(url);
         }}
         style={{background:'#10b981',color:'#022c22',fontWeight:700,fontSize:'12px',padding:'7px 14px',borderRadius:'8px',border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px'}}
        >
         <span>View Order</span>
         <span>→</span>
        </button>
        <button
         onClick={()=>setOrderAlert(null)}
         style={{background:'rgba(255, 255, 255, 0.1)',color:'#e5e7eb',fontWeight:500,fontSize:'12px',padding:'7px 12px',borderRadius:'8px',border:'1px solid rgba(255, 255, 255, 0.15)',cursor:'pointer'}}
        >
         Dismiss
        </button>
       </div>
      </div>
     </div>
    </aside>
   )}

   {perm!=='granted'&&perm!=='unsupported'&&(
    <div style={{background:'linear-gradient(90deg, #148542, #0d5f2e)',color:'#fff',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'12px',fontWeight:500,zIndex:10}}>
     <span>🔔 <b>Turn on Order Alerts:</b> Get instant Windows notifications and sound alerts when a customer places an order, even when your browser is minimized or closed.</span>
     <button onClick={async()=>{const res=await subscribeToPush({role:'ADMIN'});if(res?.success)setPerm('granted')}} style={{background:'#fff',color:'#148542',border:'none',borderRadius:'6px',padding:'5px 12px',fontWeight:600,cursor:'pointer',fontSize:'12px',whiteSpace:'nowrap',marginLeft:'12px'}}>Enable Alerts</button>
    </div>
   )}
   <header className="admin-header"><div className="row gap"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button>{showBack&&<button className="admin-back" onClick={()=>location.key!=='default'?nav(-1):nav('/admin/dashboard')} title="Go back"><ArrowLeft/></button>}<button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</button><div><b>{BRAND.name} Admin</b><small>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</small></div></div><AdminNavbarActions/></header>
   <main className="admin-main">{children}</main>
  </div>
 </div>;
}
