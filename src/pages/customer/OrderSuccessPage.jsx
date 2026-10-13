import {Check,Calendar,Zap} from 'lucide-react';
import {Link} from 'react-router-dom';
import {EmptyState,money} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {addressText} from '../../utils/address';

export function OrderSuccessPage(){
 const {deliveryConfig}=useApp();
 const last=JSON.parse(sessionStorage.getItem('last-order')||'null');
 if(!last)return <div className="container page"><EmptyState icon="package" title="No recent order" text="Place an order to see its confirmation here." action="Continue shopping"/></div>;
 const snapshot=last.address||last.addressSnapshot,address=addressText(snapshot),eta=snapshot?.deliveryZone?.estimatedDelivery||deliveryConfig.estimatedDelivery;
 const isScheduled=last.deliveryType==='SCHEDULED';

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
   <div className="row center gap">
    <Link className="btn btn-primary" to={`/orders/${last.id}`}>View order</Link>
    <Link className="btn btn-ghost" to="/">Continue shopping</Link>
   </div>
  </div>
 );
}
