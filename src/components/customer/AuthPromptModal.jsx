import {useState} from 'react';
import {useNavigate,Link} from 'react-router-dom';
import {Eye,EyeOff,ShoppingBag,Sparkles} from 'lucide-react';
import {Button,Modal} from '../ui';
import {useApp} from '../../context/AppContext';
import {authService} from '../../services/auth.service';
import {BRAND} from '../../config/brand';
import brandWordmark from '../../assets/r2cart-logo.png';
import {autoPromptPushPermission} from '../../services/pushNotification.service';

export function AuthPromptModal(){
 const {authModalOpen,closeAuthModal,authModalReason,setUser,notify}=useApp();
 const nav=useNavigate();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showPassword,setShowPassword]=useState(false);
 const [loading,setLoading]=useState(false);

 if(!authModalOpen)return null;

 const isOrder=authModalReason==='order';

 const handleLogin=async e=>{
  e.preventDefault();
  setLoading(true);
  try{
   const user=await authService.login({email,password});
   setUser(user);
   sessionStorage.setItem('r2cart-auth-prompt','CUSTOMER');
   notify(`Welcome back, ${user.name||'Shopper'}!`);
   closeAuthModal();
   if(isOrder){
    sessionStorage.removeItem('grocify-auth-redirect');
    nav('/checkout');
   }else{
    setTimeout(()=>{
     const role=sessionStorage.getItem('r2cart-auth-prompt');
     if(role){
      sessionStorage.removeItem('r2cart-auth-prompt');
      autoPromptPushPermission(role);
     }
    },1200);
   }
  }catch(error){
   notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 const handleGoToSignup=()=>{
  if(isOrder)sessionStorage.setItem('grocify-auth-redirect','/checkout');
  closeAuthModal();
  nav(isOrder?'/signup?redirect=/checkout':'/signup');
 };

 return (
  <Modal open={authModalOpen} onClose={closeAuthModal} title="" size="auth-prompt-modal">
   <div className="auth-prompt-body">
    <div className="auth-prompt-header">
     <div className="auth-prompt-badge">
      {isOrder?<ShoppingBag size={16}/>:<Sparkles size={16}/>}
      <span>{isOrder?'Complete your order':'Member benefits'}</span>
     </div>
     <img className="auth-prompt-logo" src={brandWordmark} alt={BRAND.name}/>
     <h2>{isOrder?'Sign in to place order':'Welcome to R2Cart'}</h2>
     <p>{isOrder?'Please sign in or create an account so we can deliver your groceries to the right address.':'Sign in to access exclusive member discounts, saved addresses, and fast delivery in Hathua.'}</p>
    </div>

    <form onSubmit={handleLogin} className="auth-prompt-form">
     <label>
      <span>Email address</span>
      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/>
     </label>
     <label>
      <div className="between">
       <span>Password</span>
       <Link to="/forgot-password" onClick={closeAuthModal} className="auth-forgot-link">Forgot password?</Link>
      </div>
      <div className="auth-password">
       <input type={showPassword?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/>
       <button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>
        {showPassword?<EyeOff size={16}/>:<Eye size={16}/>}
       </button>
      </div>
     </label>

     <Button type="submit" className="wide auth-prompt-submit" disabled={loading}>
      {loading?'Signing in…':'Sign in & continue'}
     </Button>
    </form>

    <div className="auth-prompt-divider">
     <span>or</span>
    </div>

    <div className="auth-prompt-actions">
     <Button type="button" variant="outline" className="wide" onClick={handleGoToSignup}>
      Create new account
     </Button>
     <button type="button" className="auth-prompt-cancel" onClick={closeAuthModal}>
      {isOrder?'Cancel & return to cart':'Continue browsing as guest'}
     </button>
    </div>
   </div>
  </Modal>
 );
}
