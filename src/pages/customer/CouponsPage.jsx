import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button,money,Skeletons} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {customerService} from '../../services/customer.service';

const PageHead=({eyebrow,title,text})=><div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div></div>;
const date=value=>new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const offer=c=>c.type==='PERCENTAGE'?`${Number(c.discount)}% OFF`:`${money(c.discount)} OFF`;

export function CouponsPage(){
 const {notify,cartItems,user}=useApp();const nav=useNavigate();const [coupons,setCoupons]=useState([]);const [loading,setLoading]=useState(true);const [applied,setApplied]=useState(()=>sessionStorage.getItem('r2cart-coupon')||'');
 useEffect(()=>{if(!user){setCoupons([]);setLoading(false);return}let active=true;const load=()=>customerService.coupons().then(rows=>{if(active)setCoupons(rows)}).catch(error=>{if(active)notify(error.message,'error')}).finally(()=>{if(active)setLoading(false)});load();window.addEventListener('focus',load);window.addEventListener('r2cart:coupons-updated',load);return()=>{active=false;window.removeEventListener('focus',load);window.removeEventListener('r2cart:coupons-updated',load)}},[user?.id]);
 const apply=async coupon=>{if(!cartItems.length){notify('Add products to your basket before applying a coupon','error');nav('/');return}try{const result=await customerService.validateCoupon(coupon.code);sessionStorage.setItem('r2cart-coupon',result.code);sessionStorage.setItem('r2cart-coupon-discount',String(result.discount));setApplied(result.code);notify(`${result.code} applied. You save ${money(result.discount)}`);nav('/cart')}catch(error){notify(error.message,'error')}};
 if(!user)return <div className="container page"><PageHead eyebrow="OFFERS" title="Coupons & savings" text="Sign in to see offers available for your account."/><Button onClick={()=>nav('/login')}>Sign in to view coupons</Button></div>;
 return <div className="container page"><PageHead eyebrow="OFFERS" title="Coupons & savings" text="Live offers fetched securely from R2Cart."/>{loading?<Skeletons/>:<div className="coupon-grid">{coupons.map(c=>{const enabled=c.displayStatus==='Available';return <article className={`coupon-card ${!enabled?'disabled':''}`} key={c.id}><div className="coupon-cut left"/><div className="coupon-cut right"/><div className="coupon-value">{offer(c)}</div><div><span className="coupon-code">{c.code}</span><p>Minimum order {money(c.minimumOrder)}{c.maximumDiscount!==null&&` · Max discount ${money(c.maximumDiscount)}`}</p><small>Valid until {date(c.expiresAt)}</small><details><summary>View terms</summary><p>Limited to {c.perUserLimit} use{c.perUserLimit===1?'':'s'} per customer. Subject to availability.</p></details></div><Button disabled={!enabled} variant={applied===c.code?'primary':'outline'} onClick={()=>apply(c)}>{enabled?(applied===c.code?'Applied ✓':'Apply'):c.displayStatus}</Button></article>})}{!coupons.length&&<p>No coupons are available right now.</p>}</div>}</div>;
}
