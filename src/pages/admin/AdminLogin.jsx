import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Eye,EyeOff} from 'lucide-react';
import {Button} from '../../components/ui';
import {authService} from '../../services/auth.service';
import {BRAND} from '../../config/brand';
import {Logo} from '../../layouts/CustomerLayout';

export function AdminLogin(){
 const nav=useNavigate();
 const [show,setShow]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');

 const submit=async event=>{
  event.preventDefault();
  setLoading(true);
  setError('');
  const data=new FormData(event.currentTarget);
  const email=data.get('email')?.trim();
  const password=data.get('password')?.trim();

  try{
   await authService.adminLogin({email,password});
   window.location.assign('/admin/dashboard');
  }catch(reason){
   console.error('Admin login error:', reason);
   setError(reason.message||'Invalid admin credentials');
  }finally{
   setLoading(false);
  }
 };

 return <div className="admin-login">
  <div className="admin-login-copy">
   <Logo/>
   <div>
    <span>STORE OPERATIONS</span>
    <h1>Run your grocery business with clarity.</h1>
    <p>{BRAND.tagline} Manage orders, stock and customers from one focused workspace.</p>
   </div>
  </div>
  <form onSubmit={submit}>
   <span>{BRAND.name.toUpperCase()} ADMIN PORTAL</span>
   <h2>Welcome back</h2>
   <p>Sign in to manage your store.</p>
   {error&&<p className="form-error">{error}</p>}
   <label>
    Email address
    <input name="email" type="email" defaultValue="admin@r2cart.in" required/>
   </label>
   <label>
    Password
    <div className="password">
     <input name="password" type={show?'text':'password'} defaultValue="Admin@R2Cart" required/>
     <button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'} title={show?'Hide password':'Show password'}>
      {show?<EyeOff/>:<Eye/>}
     </button>
    </div>
   </label>
   <div className="row between">
    <label className="check"><input type="checkbox" defaultChecked/> Remember me</label>
    <span className="muted">Contact store owner to reset access</span>
   </div>
   <Button className="wide" type="submit" disabled={loading}>
    {loading?'Signing in…':'Sign in to dashboard'}
   </Button>
   <small>Development credentials are pre-filled</small>
  </form>
 </div>
}
