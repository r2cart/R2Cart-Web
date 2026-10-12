import {useEffect,useState} from 'react';
import {Banknote,Check,ShieldCheck,Tag} from 'lucide-react';
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

 useEffect(()=>{const available=addressList.filter(item=>deliveryRulesFor(item.area));if(!available.some(item=>item.id===selected))setSelected(available.find(item=>item.default)?.id||available[0]?.id)},[addressList,deliveryZones,selected]);
 useEffect(()=>{let active=true;const refresh=async()=>{try{const rows=await customerService.coupons();if(active)setCoupons(rows);const code=sessionStorage.getItem('grocify-coupon');if(code){try{const result=await customerService.validateCoupon(code);if(active){setCoupon({code:result.code,discount:Number(result.discount)});setShowCoupons(false);sessionStorage.setItem('grocify-coupon-discount',String(result.discount))}}catch(error){if(active){setCoupon(null);setShowCoupons(true);sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify(error.message,'error')}}}}catch(error){if(active)notify(error.message,'error')}finally{if(active)setCouponLoading(false)}};refresh();window.addEventListener('focus',refresh);window.addEventListener('grocify:coupons-updated',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('grocify:coupons-updated',refresh)}},[subtotal]);

 if(!cartItems.length)return <div className="container page"><EmptyState icon="cart" title="No items to checkout" text="Add a few groceries before continuing." action="Browse products"/></div>;
 const selectedAddress=addressList.find(item=>item.id===selected),rules=deliveryRulesFor(selectedAddress?.area)||deliveryConfig,deliveryFee=subtotal>=rules.freeDeliveryThreshold?0:rules.deliveryFee,total=Math.max(0,subtotal+deliveryFee-(coupon?.discount||0)),minimumRemaining=Math.max(0,rules.minimumOrder-subtotal);
 const applyCoupon=async selectedCoupon=>{setApplying(selectedCoupon.code);try{const result=await customerService.validateCoupon(selectedCoupon.code);const next={code:result.code,discount:Number(result.discount)};setCoupon(next);setShowCoupons(false);sessionStorage.setItem('grocify-coupon',next.code);sessionStorage.setItem('grocify-coupon-discount',String(next.discount));notify(`${next.code} applied. You save ${money(next.discount)}`)}catch(error){notify(error.message,'error')}finally{setApplying('')}};
 const removeCoupon=()=>{setCoupon(null);setShowCoupons(true);sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify('Coupon removed')};
 const place=async()=>{if(!selected||!selectedAddress)return notify('Select an available delivery address','error');if(!deliveryRulesFor(selectedAddress.area))return notify(`Delivery is unavailable in ${selectedAddress.area}`,'error');if(minimumRemaining)return notify(`Add ${money(minimumRemaining)} more to place this order`,'error');try{const order=await orderService.create({addressId:String(selected),couponCode:coupon?.code,deliveryInstruction:instruction==='Custom note'?customNote:instruction,paymentMethod:'COD'});sessionStorage.setItem('last-order',JSON.stringify(order));sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');setOrderList(current=>[order,...current]);setCart({});notify('Order placed successfully');nav('/order-success')}catch(error){notify(error.message,'error')}};
 const saveAddress=async value=>{try{const saved=addressView(await customerService.addAddress(addressPayload(value)));setAddressList(items=>[saved,...items]);setSelected(saved.id);setAddressModal(false);notify('Address saved to your account')}catch(error){notify(error.message,'error')}};

 return <div className="container page checkout-page"><PageHead eyebrow="SECURE CHECKOUT" title="Almost there" text="Review your delivery and payment details."/><div className="checkout-layout"><div className="checkout-steps">
  <CheckoutSection n="1" title="Delivery address" done={!!selected}><div className="address-grid">{addressList.map(address=>{const zone=deliveryRulesFor(address.area);return <button disabled={!zone} className={`address-card selectable ${selected===address.id?'selected':''} ${!zone?'unavailable':''}`} onClick={()=>zone&&setSelected(address.id)} key={address.id}><span className="address-type">{address.type}</span>{selected===address.id&&<i><Check/></i>}<b>{address.name}</b><p>{address.line}<br/>{address.cityLine||address.city}</p><small>{zone?`${zone.zoneName} · ${zone.estimatedDelivery}`:'Delivery currently unavailable'}</small></button>})}<button className="add-address" onClick={()=>setAddressModal(true)}>+ Add new address</button></div></CheckoutSection>
  <CheckoutSection n="2" title="Order summary"><div className="summary-products">{cartItems.map(product=><div key={product.id}><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.unit} × {product.qty}</small></span><strong>{money(product.price*product.qty)}</strong></div>)}</div></CheckoutSection>
  <CheckoutSection n="3" title="Coupon" done={!!coupon}>{coupon&&<div className="coupon-select applied"><span><Tag/></span><div><b>{coupon.code} applied</b><small>You save {money(coupon.discount)}</small></div><span className="checkout-coupon-actions"><button onClick={()=>setShowCoupons(value=>!value)}>CHANGE</button><button onClick={removeCoupon}>REMOVE</button></span></div>}{showCoupons&&(couponLoading?<p className="muted">Loading available coupons…</p>:<div className="checkout-coupon-list">{coupons.map(item=>{const enabled=item.displayStatus==='Available';return <div className={`coupon-select ${!enabled?'disabled':''}`} key={item.id}><span><Tag/></span><div><b>{item.code} · {offer(item)}</b><small>Minimum order {money(item.minimumOrder)}{item.maximumDiscount!==null?` · Max ${money(item.maximumDiscount)}`:''}</small></div><Button variant="outline" disabled={!enabled||applying===item.code} onClick={()=>applyCoupon(item)}>{applying===item.code?'Applying…':enabled?'Apply':item.displayStatus}</Button></div>})}{!coupons.length&&<p className="muted">No coupons are available right now.</p>}</div>)}</CheckoutSection>
  <CheckoutSection n="4" title="Delivery instructions"><div className="radio-cards">{['Leave at door','Call before delivery','Do not ring bell','Custom note'].map(option=><label className={instruction===option?'active':''} key={option}><input type="radio" checked={instruction===option} onChange={()=>setInstruction(option)}/>{option}</label>)}</div>{instruction==='Custom note'&&<textarea value={customNote} onChange={event=>setCustomNote(event.target.value)} placeholder="Add a note for your delivery partner"/>}</CheckoutSection>
  <CheckoutSection n="5" title="Payment"><label className="payment-option"><input type="radio" checked readOnly/><span><Banknote/></span><div><b>Cash on Delivery</b><small>Pay when your order arrives</small></div><Badge>Available</Badge></label></CheckoutSection>
 </div><aside className="bill-card checkout-bill clarified-bill">{rules.zoneName&&<p className="checkout-zone"><span>Delivery zone</span><b>{rules.zoneName}</b></p>}<PriceSummary title="Final price breakdown" mrpTotal={mrpTotal} subtotal={subtotal} deliveryFee={deliveryFee} couponDiscount={coupon?.discount||0} couponCode={coupon?.code}/>{minimumRemaining&&<p className="checkout-minimum">Add {money(minimumRemaining)} more to meet this zone’s minimum order.</p>}<Button className="wide" onClick={place}>Place order · Pay {money(total)}</Button><small className="secure-note"><ShieldCheck/> {rules.estimatedDelivery} · Safe & secure checkout</small></aside></div>
  <Modal open={addressModal} onClose={()=>setAddressModal(false)} title="Add delivery address" size="location-modal"><div className="modal-body"><AddressForm onCancel={()=>setAddressModal(false)} onSave={saveAddress}/></div></Modal>
 </div>;
}
function CheckoutSection({n,title,done,children}){return <section className="checkout-section"><div className="step-title"><span>{done?<Check/>:n}</span><h2>{title}</h2></div>{children}</section>}
