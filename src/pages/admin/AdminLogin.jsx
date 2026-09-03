import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Button} from '../../components/ui';
import {authService} from '../../services/auth.service';

export function AdminLogin(){
 const nav=useNavigate();const [show,setShow]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const submit=async event=>{event.preventDefault();setLoading(true);setError('');const data=new FormData(event.currentTarget);try{await authService.adminLogin({email:data.get('email'),password:data.get('password')});nav('/admin/dashboard')}catch(reason){setError(reason.message)}finally{setLoading(false)}};
 return <div className="admin-login"><div className="admin-login-copy"><Link to="/" className="logo"><span>G</span>rocify<i>.</i></Link><div><span>STORE OPERATIONS</span><h1>Run your grocery business with clarity.</h1><p>Orders, stock, customers and performance—all in one focused workspace.</p></div></div><form onSubmit={submit}><span>ADMIN PORTAL</span><h2>Welcome back</h2><p>Sign in to manage your store.</p>{error&&<p className="form-error">{error}</p>}<label>Email address<input name="email" type="email" defaultValue="admin@grocify.in" required/></label><label>Password<div className="password"><input name="password" type={show?'text':'password'} defaultValue="admin123" required/><button type="button" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div></label><div className="row between"><label className="check"><input type="checkbox" defaultChecked/> Remember me</label><span className="muted">Contact store owner to reset access</span></div><Button className="wide" disabled={loading}>{loading?'Signing in…':'Sign in to dashboard'}</Button><small>Development credentials are pre-filled</small></form></div>
}
