import {useState, useEffect} from 'react';
import {useLocation, useNavigate, Link} from 'react-router-dom';
import {Eye, EyeOff, ShieldCheck, Store, AlertCircle} from 'lucide-react';
import {Button} from '../../components/ui';
import {authService, resolveRoleRedirect} from '../../services/auth.service';
import {BRAND} from '../../config/brand';
import {Logo} from '../../layouts/CustomerLayout';

export function AdminLogin({superAdmin: isSuperAdminProp = false}){
 const location = useLocation();
 const nav = useNavigate();
 const isSuperAdmin = isSuperAdminProp || location.pathname.includes('/super-admin');

 const [show, setShow] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('error') === 'deactivated') {
   setError('Your staff account is currently deactivated. Please contact administrator.');
  }
 }, [location.search]);

 const submit = async event => {
  event.preventDefault();
  setLoading(true);
  setError('');
  const data = new FormData(event.currentTarget);
  const identifier = data.get('email')?.trim();
  const password = data.get('password')?.trim();

  try{
   const user = isSuperAdmin
     ? await authService.superAdminLogin({identifier, email: identifier, password})
     : await authService.adminLogin({identifier, email: identifier, password});

   const rolePrompt = (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER') ? 'ADMIN' : (user?.role === 'DELIVERY_PERSON' ? 'DELIVERY' : 'CUSTOMER');
   sessionStorage.setItem('r2cart-auth-prompt', rolePrompt);
   const defaultTarget = isSuperAdmin ? '/super-admin/dashboard' : '/admin/dashboard';
   const target = resolveRoleRedirect(user, defaultTarget);
   window.location.assign(target);
  }catch(reason){
   console.error(`${isSuperAdmin ? 'Super Admin' : 'Admin'} login error:`, reason);
   setError(reason.message || 'Invalid credentials or unauthorized access.');
  }finally{
   setLoading(false);
  }
 };

 return <div className="admin-login">
  <div className="admin-login-copy">
   <Logo/>
   <div>
    <span>{isSuperAdmin ? 'PLATFORM GOVERNANCE' : 'STORE OPERATIONS'}</span>
    <h1>{isSuperAdmin ? 'Platform-wide security, controls & governance.' : 'Run your grocery business with clarity.'}</h1>
    <p>{isSuperAdmin ? 'Centralized control over system security, staff roles, and store configurations.' : `${BRAND.tagline} Manage orders, stock and customers from one focused workspace.`}</p>
   </div>
  </div>
  <form onSubmit={submit}>
   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    {isSuperAdmin ? <ShieldCheck size={18} style={{ color: '#047857' }} /> : <Store size={18} style={{ color: '#059669' }} />}
    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', color: isSuperAdmin ? '#047857' : '#059669' }}>
     {BRAND.name.toUpperCase()} {isSuperAdmin ? 'SUPER ADMIN PORTAL' : 'STORE ADMIN PORTAL'}
    </span>
   </div>
   <h2>{isSuperAdmin ? 'Super Admin Access' : 'Store Admin Sign In'}</h2>
   <p>{isSuperAdmin ? 'Sign in to access global governance and security controls.' : 'Sign in to manage store catalog, orders, and fulfillment.'}</p>
   
   {error && (
     <div style={{
       padding: '12px 14px',
       borderRadius: '8px',
       background: '#fef2f2',
       border: '1.5px solid #fecaca',
       color: '#b91c1c',
       fontSize: '13px',
       marginBottom: '16px',
       display: 'flex',
       flexDirection: 'column',
       gap: '6px'
     }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
         <AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
         <span style={{ fontWeight: 600 }}>{error}</span>
       </div>
       {error.includes('/super-admin/login') && (
         <Link
           to="/super-admin/login"
           style={{
             display: 'inline-flex',
             alignItems: 'center',
             gap: '4px',
             marginTop: '4px',
             color: '#047857',
             fontWeight: 700,
             textDecoration: 'underline',
             fontSize: '12px'
           }}
         >
           → Click here to open Super Admin Login Portal
         </Link>
       )}
     </div>
   )}

   <label>
    {isSuperAdmin ? 'Super Admin Email or Mobile' : 'Email, Mobile or Staff ID'}
    <input
      name="email"
      type="text"
      placeholder={isSuperAdmin ? "super@example.com" : "admin@example.com"}
      required
    />
   </label>
   <label>
    Password
    <div className="password">
     <input
       name="password"
       type={show ? 'text' : 'password'}
       placeholder="••••••••"
       required
     />
     <button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} title={show?'Hide password':'Show password'}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
     </button>
    </div>
   </label>

   <div className="row between" style={{ marginTop: '4px', marginBottom: '8px' }}>
    <label className="check"><input type="checkbox" defaultChecked/> Remember session</label>
    <span className="muted" style={{ fontSize: '12px', color: '#64748b' }}>Authorized access only</span>
   </div>

   <Button className="wide" type="submit" disabled={loading}>
    {loading ? 'Authenticating…' : (isSuperAdmin ? 'Sign in as Super Admin' : 'Sign in as Store Admin')}
   </Button>

   <div style={{
     marginTop: '16px',
     paddingTop: '12px',
     borderTop: '1px solid #f1f5f9',
     textAlign: 'center',
     fontSize: '12.5px',
     color: '#64748b'
   }}>
     {isSuperAdmin ? (
       <span>
         Store Admin or Manager?{' '}
         <Link to="/admin/login" style={{ color: '#047857', fontWeight: 700, textDecoration: 'none' }}>
           Store Admin Sign In →
         </Link>
       </span>
     ) : (
       <span>
         Platform Super Admin?{' '}
         <Link to="/super-admin/login" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
           Super Admin Sign In →
         </Link>
       </span>
     )}
   </div>
  </form>
 </div>
}

