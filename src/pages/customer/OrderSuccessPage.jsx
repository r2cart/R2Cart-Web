import {Check,Calendar,Zap,Bell,Smartphone} from 'lucide-react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {EmptyState,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {addressText} from '../../utils/address';
import {subscribeToPush,isIOS,isStandalone,isPushSupported} from '../../services/pushNotification.service';

export function OrderSuccessPage(){
 const {deliveryConfig}=useApp();
 const [subscribed,setSubscribed]=useState(typeof Notification!=='undefined'&&Notification.permission==='granted');
 const last=JSON.parse(sessionStorage.getItem('last-order')||'null');
 if(!last)return <div className="container page"><EmptyState icon="package" title="No recent order" text="Place an order to see its confirmation here." action="Continue shopping"/></div>;
 const snapshot=last.address||last.addressSnapshot,address=addressText(snapshot),eta=snapshot?.deliveryZone?.estimatedDelivery||deliveryConfig.estimatedDelivery;
 const isScheduled=last.deliveryType==='SCHEDULED';

 const enablePush=async()=>{
  const res=await subscribeToPush({role:'CUSTOMER'});
  if(res?.success)setSubscribed(true);
 };

 return (
  <div className="success-page">
   <div className="success-ring"><Check/></div>
   <span>ORDER CONFIRMED</span>
   <h1>{isScheduled?'Order scheduled successfully!':'Thank you! Your groceries are on the way.'}</h1>
   <p>{isScheduled?`Your order is booked for delivery on ${last.deliveryDate}.`:'We’ve received your order and started preparing it with care.'}</p>
   
   <div className="success-card">
    <div><span>Order ID</span><b>#{last.orderNumber||last.id}</b></div>
    <div>
     <span>Delivery timing</span>
     <b>{isScheduled?`📅 ${last.deliveryDate} · ${last.deliverySlot}`:`⚡ ${eta}`}</b>
    </div>
    <div><span>Delivering to</span><b>{address.line}{address.cityLine&&<><br/>{address.cityLine}</>}</b></div>
    <div><span>Total payable</span><b>{money(last.total??last.grandTotal)}</b></div>
   </div>

   {isPushSupported()&&!subscribed&&(
    <div style={{margin:'16px auto',maxWidth:'460px',padding:'12px 16px',background:'rgba(20,133,66,0.06)',border:'1px solid rgba(20,133,66,0.2)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
     <div style={{display:'flex',alignItems:'center',gap:'10px',textAlign:'left'}}>
      <Bell size={20} color="#148542"/>
      <div>
       <b style={{fontSize:'13px',color:'#148542',display:'block'}}>Get Live Order Updates</b>
       <small style={{fontSize:'12px',color:'#555'}}>Receive push alerts when items are packed & out for delivery.</small>
      </div>
     </div>
     <button className="btn btn-primary" style={{padding:'6px 14px',fontSize:'12px',whiteSpace:'nowrap'}} onClick={enablePush}>Enable</button>
    </div>
   )}

   {isIOS()&&!isStandalone()&&(
    <div style={{margin:'16px auto',maxWidth:'460px',padding:'12px 16px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',textAlign:'left'}}>
     <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
      <Smartphone size={18} color="#148542"/>
      <b style={{fontSize:'13px',color:'#148542'}}>iPhone Live Order Notifications</b>
     </div>
     <p style={{fontSize:'12px',color:'#333',margin:0,lineHeight:1.4}}>
      iPhone par delivery status notifications paane ke liye: Safari me niche <b>Share icon (⎋)</b> par tap karke <b>"Add to Home Screen" (+)</b> karein.
     </p>
    </div>
   )}

   <div className="row center gap">
    <Link className="btn btn-primary" to={`/orders/${last.id}`}>View order</Link>
    <Link className="btn btn-ghost" to="/">Continue shopping</Link>
   </div>
  </div>
 );
}
