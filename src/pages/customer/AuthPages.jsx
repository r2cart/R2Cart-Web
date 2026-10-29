import {useEffect,useState} from 'react';
import {Link,useNavigate,useLocation} from 'react-router-dom';
import {ArrowLeft,CheckCircle2,Eye,EyeOff,AlertCircle} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {Button} from '../../components/ui';
import {authService,resolveRoleRedirect} from '../../services/auth.service';
import {BRAND} from '../../config/brand';
import {Logo} from '../../layouts/CustomerLayout';

export function sanitizeRedirect(target){
 if(!target||typeof target!=='string')return '/';
 const clean=target.trim();
 const lower=clean.toLowerCase();
 if(
  lower==='/login'||
  lower.startsWith('/login?')||
  lower==='/signup'||
  lower.startsWith('/signup?')||
  lower==='/verify-otp'||
  lower.startsWith('/verify-otp?')||
  lower==='/forgot-password'||
  lower.startsWith('/forgot-password?')
 ){
  return '/';
 }
 return clean;
}

function getAuthSeed(){
 try{
  const s=sessionStorage.getItem('r2cart-auth');
  if(s){
   const parsed=JSON.parse(s);
   if(parsed?.email)return parsed;
  }
 }catch{}
 try{
  const l=localStorage.getItem('r2cart-auth');
  if(l){
   const parsed=JSON.parse(l);
   if(parsed?.email)return parsed;
  }
 }catch{}
 return {};
}

function saveAuthSeed(payload){
 try{sessionStorage.setItem('r2cart-auth',JSON.stringify(payload));}catch{}
 try{localStorage.setItem('r2cart-auth',JSON.stringify(payload));}catch{}
}

function clearAuthSeed(){
 try{sessionStorage.removeItem('r2cart-auth');}catch{}
 try{localStorage.removeItem('r2cart-auth');}catch{}
}

export function LoginPage({signup=false}){
 const nav=useNavigate();
 const {user,setUser,notify}=useApp();
 const [form,setForm]=useState({name:'',email:'',mobile:'',password:'',confirmPassword:''});
 const [loading,setLoading]=useState(false);
 const [authError,setAuthError]=useState('');

 const params=new URLSearchParams(window.location.search);
 const rawRedirect=params.get('redirect')||sessionStorage.getItem('r2cart-auth-redirect')||'/';
 const redirect=sanitizeRedirect(rawRedirect);
 const redirectParam=redirect&&redirect!=='/'?`?redirect=${encodeURIComponent(redirect)}`:'';

 useEffect(()=>{
  if(user?.id){
   const target=resolveRoleRedirect(user,redirect);
   nav(target,{replace:true});
  }
 },[user,redirect,nav]);

 const submit=async e=>{
  e.preventDefault();
  setAuthError('');
  if(signup&&form.password!==form.confirmPassword)return notify('Passwords do not match','error');
  setLoading(true);
  try{
   if(signup){
    const email=form.email.trim().toLowerCase();
    const mobile=form.mobile.trim();
    const name=form.name.trim();
    await authService.requestOtp({name,email,mobile,password:form.password,mode:'signup'});
    const seedData={email,mode:'signup',redirect};
    saveAuthSeed(seedData);
    notify('OTP sent to your email');
    nav('/verify-otp',{state:seedData});
   }else{
    const identifier=form.email.trim();
    const loggedUser=await authService.login({identifier,password:form.password});
    setUser(loggedUser);
    sessionStorage.removeItem('r2cart-auth-redirect');
    const rolePrompt=(loggedUser.role==='SUPER_ADMIN'||loggedUser.role==='ADMIN'||loggedUser.role==='MANAGER')?'ADMIN':(loggedUser.role==='DELIVERY_PERSON'?'DELIVERY':'CUSTOMER');
    sessionStorage.setItem('r2cart-auth-prompt',rolePrompt);
    const targetPath=resolveRoleRedirect(loggedUser,redirect);
    window.location.replace(targetPath);
   }
  }catch(error){
   setAuthError(error.message);
   notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 return (
  <AuthShell title={signup?'Create your account':`Welcome to ${BRAND.name}`} text={signup?'Create a password, then verify your email with OTP.':'Sign in with your email or mobile number.'}>
   {authError && (
     <div style={{
       padding: '12px 14px',
       borderRadius: '8px',
       background: '#fef2f2',
       border: '1.5px solid #fecaca',
       color: '#b91c1c',
       fontSize: '13px',
       marginBottom: '16px',
       display: 'flex',
       alignItems: 'center',
       gap: '10px'
     }}>
       <AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
       <span>{authError}</span>
     </div>
   )}
   <form className="auth-form" onSubmit={submit}>
    {signup&&<label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name"/></label>}
    {signup?(
      <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
    ):(
      <label>Email, Mobile, or Delivery Staff ID<input type="text" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email, phone, or Staff ID (e.g. R2D-1001)"/></label>
    )}
    {signup&&<label>Mobile number<input required pattern="[0-9]{10}" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10-digit mobile number"/></label>}
    <PasswordField label="Password" required minLength={signup ? "8" : "6"} maxLength="72" autoComplete={signup?'new-password':'current-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder={signup ? "Minimum 8 characters" : "Enter your password"}/>
    {!signup&&<div className="auth-help-row"><Link to="/forgot-password">Forgot password?</Link></div>}
    {signup&&<PasswordField label="Confirm password" required minLength="8" maxLength="72" autoComplete="new-password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} placeholder="Enter password again"/>}
    <Button className="wide" type="submit" disabled={loading}>{loading?(signup?'Sending OTP…':'Signing in…'):(signup?'Create account':'Sign in')}</Button>
   </form>
   <p className="auth-switch">{signup?'Already have an account?':`New to ${BRAND.name}?`} <Link to={signup?`/login${redirectParam}`:`/signup${redirectParam}`}>{signup?'Sign in':'Create account'}</Link></p>
  </AuthShell>
 );
}

function PasswordField({label,...props}){
 const [visible,setVisible]=useState(false);
 return (
  <label>
   {label}
   <span className="auth-password">
    <input {...props} type={visible?'text':'password'}/>
    <button type="button" onClick={()=>setVisible(value=>!value)} aria-label={visible?`Hide ${label.toLowerCase()}`:`Show ${label.toLowerCase()}`} title={visible?'Hide password':'Show password'}>
     {visible?<EyeOff/>:<Eye/>}
    </button>
   </span>
  </label>
 );
}

function AuthShell({title,text,children}){
 return (
  <div className="auth-page customer-auth">
   <div className="auth-art">
    <Logo/>
    <div>
     <span>FRESH DELIVERY</span>
     <h1>Daily needs, delivered fresh.</h1>
     <p>Quality groceries, trusted essentials and everyday savings—delivered straight to your door.</p>
    </div>
   </div>
   <div className="auth-panel">
    <div className="auth-box">
     <Link className="back-link" to="/"><ArrowLeft/> Back to store</Link>
     <span className="auth-portal-label">{BRAND.name.toUpperCase()} CUSTOMER</span>
     <h2>{title}</h2>
     <p>{text}</p>
     {children}
     <small className="legal-note">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</small>
    </div>
   </div>
  </div>
 );
}

export function ForgotPasswordPage(){
 const {notify}=useApp();
 const [stage,setStage]=useState('email');
 const [email,setEmail]=useState('');
 const [otp,setOtp]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [loading,setLoading]=useState(false);
 const [seconds,setSeconds]=useState(0);
 const [errorMsg,setErrorMsg]=useState('');

 useEffect(()=>{
  if(seconds<=0)return;
  const timer=setInterval(()=>setSeconds(value=>Math.max(0,value-1)),1000);
  return()=>clearInterval(timer);
 },[seconds]);

 const send=async event=>{
  event?.preventDefault();
  setErrorMsg('');
  const cleanEmail=email.trim().toLowerCase();
  if(!cleanEmail)return notify('Please enter your email','error');
  setLoading(true);
  try{
   await authService.requestPasswordReset(cleanEmail);
   setSeconds(60);
   setStage('reset');
   notify('Reset code sent to your email');
  }catch(error){
   setErrorMsg(error.message);
   notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 const reset=async event=>{
  event.preventDefault();
  setErrorMsg('');
  if(password!==confirm)return notify('Passwords do not match','error');
  setLoading(true);
  try{
   await authService.resetPassword({email:email.trim().toLowerCase(),otp,password});
   setStage('done');
   notify('Password reset successfully');
  }catch(error){
   setErrorMsg(error.message);
   notify(error.message,'error');
  }finally{
   setLoading(false);
  }
 };

 if(stage==='done')return (
  <AuthShell title="Password updated" text="Your account is secure and your new password is ready to use.">
   <div className="password-reset-success">
    <CheckCircle2/>
    <p>You can now sign in with your new password.</p>
    <Button className="wide" onClick={()=>window.location.assign('/login')}>Return to sign in</Button>
   </div>
  </AuthShell>
 );

 return (
  <AuthShell title={stage==='email'?'Forgot password?':'Check your email'} text={stage==='email'?'Enter your registered email and we’ll send a secure reset code.':`Enter the 6-digit code sent to ${email} and choose a new password.`}>
   {errorMsg && (
     <div style={{
       padding: '12px 14px',
       borderRadius: '8px',
       background: '#fef2f2',
       border: '1.5px solid #fecaca',
       color: '#b91c1c',
       fontSize: '13px',
       marginBottom: '16px',
       display: 'flex',
       alignItems: 'center',
       gap: '10px'
     }}>
       <AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
       <span>{errorMsg}</span>
     </div>
   )}
   {stage==='email'?(
    <form className="auth-form" onSubmit={send}>
     <label>Email address<input type="email" required autoComplete="email" value={email} onChange={event=>{setEmail(event.target.value);setErrorMsg('');}} placeholder="you@example.com"/></label>
     <Button className="wide" disabled={loading}>{loading?'Sending code…':'Send reset code'}</Button>
    </form>
   ):(
    <form className="auth-form" onSubmit={reset}>
     <label>6-digit reset code<input className="reset-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength="6" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000"/></label>
     <PasswordField label="New password" required minLength="8" maxLength="72" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Minimum 8 characters"/>
     <PasswordField label="Confirm new password" required minLength="8" maxLength="72" autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)} placeholder="Enter password again"/>
     <Button className="wide" disabled={loading}>{loading?'Updating password…':'Reset password'}</Button>
     <div className="row between auth-links">
      <button type="button" onClick={()=>{setStage('email');setErrorMsg('');}}>Change email</button>
      <button type="button" disabled={seconds>0||loading} onClick={()=>send()}>{seconds?`Resend in ${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`:'Resend code'}</button>
     </div>
    </form>
   )}
   <p className="auth-switch">Remembered your password? <Link to="/login">Sign in</Link></p>
  </AuthShell>
 );
}

export function OTPPage(){
 const nav=useNavigate();
 const location=useLocation();
 const {setUser,notify}=useApp();
 const seed=(location.state?.email&&location.state?.mode==='signup')?location.state:getAuthSeed();
 const [otp,setOtp]=useState(['','','','','','']);
 const [seconds,setSeconds]=useState(60);
 const [loading,setLoading]=useState(false);
 const [errorMsg,setErrorMsg]=useState('');

 useEffect(()=>{
  if(!seed.email||seed.mode!=='signup'){
   nav('/signup',{replace:true});
   return;
  }
  const x=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);
  return()=>clearInterval(x);
 },[nav,seed.email,seed.mode]);

 const verify=async()=>{
  const code=otp.join('');
  if(code.length<6)return notify('Enter the complete 6-digit OTP','error');
  setErrorMsg('');
  setLoading(true);
  try{
   const user=await authService.verifyOtp({email:seed.email,mode:'signup',otp:code});
   setUser(user);
   clearAuthSeed();
   sessionStorage.removeItem('r2cart-auth-redirect');
   sessionStorage.setItem('r2cart-auth-prompt','CUSTOMER');
   const cleanRedirect=sanitizeRedirect(seed.redirect||'/');
   const targetPath=resolveRoleRedirect(user,cleanRedirect);
   window.location.replace(targetPath);
  }catch(error){
   setErrorMsg(error.message);
   notify(error.message,'error');
   setLoading(false);
  }
 };

 const resend=async()=>{
  try{
   await authService.requestOtp({email:seed.email,mode:'signup'});
   setSeconds(60);
   notify('A new OTP was sent');
  }catch(error){
   notify(error.message,'error');
  }
 };

 return (
  <AuthShell title="Verify your email" text={`We sent a 6-digit code to ${seed.email||'your email address'}.`}>
   {errorMsg && (
     <div style={{
       padding: '12px 14px',
       borderRadius: '8px',
       background: '#fef2f2',
       border: '1.5px solid #fecaca',
       color: '#b91c1c',
       fontSize: '13px',
       marginBottom: '16px',
       display: 'flex',
       alignItems: 'center',
       gap: '10px'
     }}>
       <AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
       <span>{errorMsg}</span>
     </div>
   )}
   <div className="otp-row">
    {otp.map((v,i)=>(
      <input
        key={i}
        maxLength="1"
        inputMode="numeric"
        value={v}
        onChange={e=>{
          const n=[...otp];
          n[i]=e.target.value.replace(/\D/g,'');
          setOtp(n);
          if(n[i])document.getElementById(`otp-${i+1}`)?.focus();
        }}
        onKeyDown={e=>{
          if(e.key==='Backspace'&&!otp[i])document.getElementById(`otp-${i-1}`)?.focus();
        }}
        id={`otp-${i}`}
      />
    ))}
   </div>
   <Button className="wide" onClick={verify} disabled={loading}>{loading?'Verifying…':'Verify & create account'}</Button>
   <div className="row between auth-links">
    <Link to="/signup">Change details</Link>
    <button type="button" disabled={seconds>0} onClick={resend}>
      {seconds ? `Resend in ${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` : 'Resend OTP'}
    </button>
   </div>
  </AuthShell>
 );
}
