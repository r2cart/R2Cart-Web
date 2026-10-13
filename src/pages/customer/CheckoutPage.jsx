import {useEffect,useState} from 'react';
import {Banknote,Calendar,Check,Clock,ShieldCheck,Tag,Zap} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useApp} from '../../context/AppContext';
import {AddressForm} from '../../layouts/CustomerLayout';
import {Badge,Button,EmptyState,Modal,money} from '../../components/ui';
import {orderService} from '../../services/order.service';
import {customerService} from '../../services/customer.service';
import {addressPayload,addressView} from '../../utils/address';
import {PriceSummary} from '../../components/customer/PriceSummary';

const PageHead=({eyebrow,title,text})=><div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1>{text&&<p>{text}</p>}</div></div>;
const offer=coupon=>coupon.type==='PERCENTAGE'?`${Number(coupon.discount)}% OFF`:`${money(coupon.discount)} OFF`;

const TIME_SLOTS=[
 {id:'morning',label:'Morning Slot',time:'07:00 AM - 10:00 AM',endHour:10},
 {id:'midday',label:'Midday Slot',time:'10:00 AM - 01:00 PM',endHour:13},
 {id:'afternoon',label:'Afternoon Slot',time:'01:00 PM - 04:00 PM',endHour:16},
 {id:'evening',label:'Evening Slot',time:'04:00 PM - 07:00 PM',endHour:19},
 {id:'night',label:'Night Slot',time:'07:00 PM - 10:00 PM',endHour:22}
];

function isSlotAvailable(slot,isToday){
 if(!isToday)return true;
 const currentHour=new Date().getHours();
 return currentHour<slot.endHour-1;
}

function getAvailableDates(){
 const dates=[];
 const now=new Date();
 for(let i=0;i<4;i++){
  const d=new Date(now);
  d.setDate(now.getDate()+i);
  const isToday=i===0;
  const isTomorrow=i===1;
  const dayName=isToday?'Today':isTomorrow?'Tomorrow':d.toLocaleDateString('en-IN',{weekday:'short'});
  const dateFormatted=d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  const label=`${dayName}, ${dateFormatted}`;
  const hasAvailableSlot=isToday?TIME_SLOTS.some(s=>isSlotAvailable(s,true)):true;
  dates.push({
   id:d.toISOString().split('T')[0],
   dayName,
   dateFormatted,
   label,
   isToday,
   isTomorrow,
   hasAvailableSlot
  });
 }
 return dates;
}

export function CheckoutPage(){
 const {cartItems,subtotal,mrpTotal,addressList,setAddressList,setOrderList,setCart,notify,deliveryConfig,deliveryZones,deliveryRulesFor}=useApp();
 const nav=useNavigate();
 const [selected,setSelected]=useState();
 const [addressModal,setAddressModal]=useState(false);
 const [instruction,setInstruction]=useState('Call before delivery');
 const [customNote,setCustomNote]=useState('');
 const [coupons,setCoupons]=useState([]);
 const [couponLoading,setCouponLoading]=useState(true);
 const [applying,setApplying]=useState('');
 const [showCoupons,setShowCoupons]=useState(true);
 const [coupon,setCoupon]=useState(()=>{const code=sessionStorage.getItem('grocify-coupon'),discount=Number(sessionStorage.getItem('grocify-coupon-discount')||0);return code?{code,discount}:null});

 const dates=getAvailableDates();
 const [deliveryType,setDeliveryType]=useState('INSTANT');
 const [selectedDate,setSelectedDate]=useState(()=>{
  const first=dates.find(d=>d.hasAvailableSlot)||dates[1]||dates[0];
  return first;
 });
 const [selectedSlot,setSelectedSlot]=useState(()=>{
  const isToday=dates[0]?.hasAvailableSlot;
  const initialAvail=TIME_SLOTS.find(s=>isSlotAvailable(s,isToday));
  return initialAvail||TIME_SLOTS[0];
 });

 useEffect(()=>{const available=addressList.filter(item=>deliveryRulesFor(item.area));if(!available.some(item=>item.id===selected))setSelected(available.find(item=>item.default)?.id||available[0]?.id)},[addressList,deliveryZones,selected]);
 useEffect(()=>{let active=true;const refresh=async()=>{try{const rows=await customerService.coupons();if(active)setCoupons(rows);const code=sessionStorage.getItem('grocify-coupon');if(code){try{const result=await customerService.validateCoupon(code);if(active){setCoupon({code:result.code,discount:Number(result.discount)});setShowCoupons(false);sessionStorage.setItem('grocify-coupon-discount',String(result.discount))}}catch(error){if(active){setCoupon(null);setShowCoupons(true);sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify(error.message,'error')}}}}catch(error){if(active)notify(error.message,'error')}finally{if(active)setCouponLoading(false)}};refresh();window.addEventListener('focus',refresh);window.addEventListener('grocify:coupons-updated',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('grocify:coupons-updated',refresh)}},[subtotal]);

 if(!cartItems.length)return <div className="container page"><EmptyState icon="cart" title="No items to checkout" text="Add a few groceries before continuing." action="Browse products"/></div>;
 const selectedAddress=addressList.find(item=>item.id===selected),rules=deliveryRulesFor(selectedAddress?.area)||deliveryConfig,deliveryFee=subtotal>=rules.freeDeliveryThreshold?0:rules.deliveryFee,total=Math.max(0,subtotal+deliveryFee-(coupon?.discount||0)),minimumRemaining=Math.max(0,rules.minimumOrder-subtotal);
 const applyCoupon=async selectedCoupon=>{setApplying(selectedCoupon.code);try{const result=await customerService.validateCoupon(selectedCoupon.code);const next={code:result.code,discount:Number(result.discount)};setCoupon(next);setShowCoupons(false);sessionStorage.setItem('grocify-coupon',next.code);sessionStorage.setItem('grocify-coupon-discount',String(next.discount));notify(`${next.code} applied. You save ${money(next.discount)}`)}catch(error){notify(error.message,'error')}finally{setApplying('')}};
 const removeCoupon=()=>{setCoupon(null);setShowCoupons(true);sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify('Coupon removed')};

 const handleDateSelect=date=>{
  setSelectedDate(date);
  if(!isSlotAvailable(selectedSlot,date.isToday)){
   const firstAvail=TIME_SLOTS.find(s=>isSlotAvailable(s,date.isToday));
   if(firstAvail)setSelectedSlot(firstAvail);
  }
 };

 const place=async()=>{
  if(!selected||!selectedAddress)return notify('Select an available delivery address','error');
  if(!deliveryRulesFor(selectedAddress.area))return notify(`Delivery is unavailable in ${selectedAddress.area}`,'error');
  if(minimumRemaining)return notify(`Add ${money(minimumRemaining)} more to place this order`,'error');
  if(deliveryType==='SCHEDULED'&&(!selectedDate||!selectedSlot))return notify('Select a valid delivery date and time slot','error');

  try{
   const order=await orderService.create({
    addressId:String(selected),
    couponCode:coupon?.code,
    deliveryInstruction:instruction==='Custom note'?customNote:instruction,
    paymentMethod:'COD',
    deliveryType,
    deliveryDate:deliveryType==='SCHEDULED'?selectedDate.label:null,
    deliverySlot:deliveryType==='SCHEDULED'?selectedSlot.time:null
   });
   sessionStorage.setItem('last-order',JSON.stringify(order));
   sessionStorage.removeItem('grocify-coupon');
   sessionStorage.removeItem('grocify-coupon-discount');
   setOrderList(current=>[order,...current]);
   setCart({});
   notify('Order placed successfully');
   nav('/order-success');
  }catch(error){
   notify(error.message,'error');
  }
 };

 const saveAddress=async value=>{try{const saved=addressView(await customerService.addAddress(addressPayload(value)));setAddressList(items=>[saved,...items]);setSelected(saved.id);setAddressModal(false);notify('Address saved to your account')}catch(error){notify(error.message,'error')}};

 return <div className="container page checkout-page"><PageHead eyebrow="SECURE CHECKOUT" title="Almost there" text="Review your delivery and payment details."/><div className="checkout-layout"><div className="checkout-steps">
  <CheckoutSection n="1" title="Delivery address" done={!!selected}><div className="address-grid">{addressList.map(address=>{const zone=deliveryRulesFor(address.area);return <button disabled={!zone} className={`address-card selectable ${selected===address.id?'selected':''} ${!zone?'unavailable':''}`} onClick={()=>zone&&setSelected(address.id)} key={address.id}><span className="address-type">{address.type}</span>{selected===address.id&&<i><Check/></i>}<b>{address.name}</b><p>{address.line}<br/>{address.cityLine||address.city}</p><small>{zone?`${zone.zoneName} · ${zone.estimatedDelivery}`:'Delivery currently unavailable'}</small></button>})}<button className="add-address" onClick={()=>setAddressModal(true)}>+ Add new address</button></div></CheckoutSection>

  <CheckoutSection n="2" title="Delivery schedule & timing" done={deliveryType==='INSTANT'||(deliveryType==='SCHEDULED'&&!!selectedSlot)}>
   <div className="delivery-type-grid">
    <div role="button" tabIndex={0} className={`delivery-type-card ${deliveryType==='INSTANT'?'selected':''}`} onClick={()=>setDeliveryType('INSTANT')}>
     <div className="delivery-type-icon zap"><Zap/></div>
     <div className="delivery-type-info">
      <div className="delivery-type-head"><b>Instant Delivery</b><span className="type-badge fast">Fastest</span></div>
      <p>Estimated in {rules.estimatedDelivery||'15–30 mins'}</p>
     </div>
     {deliveryType==='INSTANT'&&<i className="check-icon"><Check/></i>}
    </div>

    <div role="button" tabIndex={0} className={`delivery-type-card ${deliveryType==='SCHEDULED'?'selected':''}`} onClick={()=>{
     setDeliveryType('SCHEDULED');
     if(!selectedDate?.hasAvailableSlot){
      const valid=dates.find(d=>d.hasAvailableSlot)||dates[1];
      if(valid)handleDateSelect(valid);
     }
    }}>
     <div className="delivery-type-icon cal"><Calendar/></div>
     <div className="delivery-type-info">
      <div className="delivery-type-head"><b>Schedule for Later</b><span className="type-badge slot">Custom Slot</span></div>
      <p>Choose your preferred date & time slot</p>
     </div>
     {deliveryType==='SCHEDULED'&&<i className="check-icon"><Check/></i>}
    </div>
   </div>

   {deliveryType==='SCHEDULED'&&(
    <div className="schedule-picker-box">
     <div className="schedule-subhead"><Calendar size={16}/><span>1. Select Delivery Date</span></div>
     <div className="date-pills-row">
      {dates.map(date=>{
       const isSelected=selectedDate?.id===date.id;
       const disabled=!date.hasAvailableSlot;
       return (
        <button type="button" key={date.id} disabled={disabled} className={`date-pill ${isSelected?'selected':''} ${disabled?'disabled':''}`} onClick={()=>handleDateSelect(date)}>
         <span className="date-pill-day">{date.dayName}</span>
         <span className="date-pill-num">{date.dateFormatted}</span>
         {disabled&&<small className="date-pill-closed">Slots closed</small>}
        </button>
       );
      })}
     </div>

     <div className="schedule-subhead"><Clock size={16}/><span>2. Choose Delivery Time Slot</span></div>
     <div className="slots-grid">
      {TIME_SLOTS.map(slot=>{
       const available=isSlotAvailable(slot,selectedDate?.isToday);
       const isSelected=selectedSlot?.id===slot.id&&available;
       return (
        <button type="button" key={slot.id} disabled={!available} className={`slot-chip ${isSelected?'selected':''} ${!available?'disabled':''}`} onClick={()=>available&&setSelectedSlot(slot)}>
         <div className="slot-chip-head">
          <b>{slot.label}</b>
          {available?(isSelected&&<Check size={14}/>):<span className="closed-tag">Closed</span>}
         </div>
         <span className="slot-chip-time">{slot.time}</span>
        </button>
       );
      })}
     </div>

     {selectedDate&&selectedSlot&&(
      <div className="scheduled-notice">
       <Calendar size={18}/>
       <div>
        <b>Delivery scheduled for {selectedDate.label}</b>
        <p>Your groceries will arrive between <strong>{selectedSlot.time}</strong></p>
       </div>
      </div>
     )}
    </div>
   )}
  </CheckoutSection>

  <CheckoutSection n="3" title="Order summary"><div className="summary-products">{cartItems.map(product=><div key={product.id}><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.unit} × {product.qty}</small></span><strong>{money(product.price*product.qty)}</strong></div>)}</div></CheckoutSection>
  <CheckoutSection n="4" title="Coupon" done={!!coupon}>{coupon&&<div className="coupon-select applied"><span><Tag/></span><div><b>{coupon.code} applied</b><small>You save {money(coupon.discount)}</small></div><span className="checkout-coupon-actions"><button onClick={()=>setShowCoupons(value=>!value)}>CHANGE</button><button onClick={removeCoupon}>REMOVE</button></span></div>}{showCoupons&&(couponLoading?<p className="muted">Loading available coupons…</p>:<div className="checkout-coupon-list">{coupons.map(item=>{const enabled=item.displayStatus==='Available';return <div className={`coupon-select ${!enabled?'disabled':''}`} key={item.id}><span><Tag/></span><div><b>{item.code} · {offer(item)}</b><small>Minimum order {money(item.minimumOrder)}{item.maximumDiscount!==null?` · Max ${money(item.maximumDiscount)}`:''}</small></div><Button variant="outline" disabled={!enabled||applying===item.code} onClick={()=>applyCoupon(item)}>{applying===item.code?'Applying…':enabled?'Apply':item.displayStatus}</Button></div>})}{!coupons.length&&<p className="muted">No coupons are available right now.</p>}</div>)}</CheckoutSection>
  <CheckoutSection n="5" title="Delivery instructions"><div className="radio-cards">{['Leave at door','Call before delivery','Do not ring bell','Custom note'].map(option=><label className={instruction===option?'active':''} key={option}><input type="radio" checked={instruction===option} onChange={()=>setInstruction(option)}/>{option}</label>)}</div>{instruction==='Custom note'&&<textarea value={customNote} onChange={event=>setCustomNote(event.target.value)} placeholder="Add a note for your delivery partner"/>}</CheckoutSection>
  <CheckoutSection n="6" title="Payment"><label className="payment-option"><input type="radio" checked readOnly/><span><Banknote/></span><div><b>Cash on Delivery</b><small>Pay when your order arrives</small></div><Badge>Available</Badge></label></CheckoutSection>
 </div><aside className="bill-card checkout-bill clarified-bill">
  {rules.zoneName&&<p className="checkout-zone"><span>Delivery zone</span><b>{rules.zoneName}</b></p>}
  <div className="checkout-timing-summary">
   <span>Delivery timing</span>
   <b>{deliveryType==='SCHEDULED'?`📅 ${selectedDate?.label} (${selectedSlot?.time})`:`⚡ Instant (${rules.estimatedDelivery||'15–30 mins'})`}</b>
  </div>
  <PriceSummary title="Final price breakdown" mrpTotal={mrpTotal} subtotal={subtotal} deliveryFee={deliveryFee} couponDiscount={coupon?.discount||0} couponCode={coupon?.code}/>{minimumRemaining&&<p className="checkout-minimum">Add {money(minimumRemaining)} more to meet this zone’s minimum order.</p>}<Button className="wide" onClick={place}>Place order · Pay {money(total)}</Button><small className="secure-note"><ShieldCheck/> {deliveryType==='SCHEDULED'?`Scheduled: ${selectedDate?.label}`:rules.estimatedDelivery} · Safe & secure checkout</small></aside></div>
  <Modal open={addressModal} onClose={()=>setAddressModal(false)} title="Add delivery address" size="location-modal"><div className="modal-body"><AddressForm onCancel={()=>setAddressModal(false)} onSave={saveAddress}/></div></Modal>
 </div>;
}
function CheckoutSection({n,title,done,children}){return <section className="checkout-section"><div className="step-title"><span>{done?<Check/>:n}</span><h2>{title}</h2></div>{children}</section>}
