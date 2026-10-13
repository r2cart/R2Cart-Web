import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Clock3,Trash2} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {Button,EmptyState,QuantitySelector,money} from '../../components/ui';
import {ItemPrice,PriceSummary} from '../../components/customer/PriceSummary';
import {customerService} from '../../services/customer.service';
const PageHead=({eyebrow,title,text})=><div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1>{text&&<p>{text}</p>}</div></div>;

export function CartPage(){
 const {cartItems,qty,subtotal,mrpTotal,notify,user,deliveryConfig,openAuthModal}=useApp();const nav=useNavigate();
 const [coupon,setCoupon]=useState(()=>sessionStorage.getItem('grocify-coupon')||'');
 const [applied,setApplied]=useState(()=>{const code=sessionStorage.getItem('grocify-coupon'),discount=Number(sessionStorage.getItem('grocify-coupon-discount')||0);return code?{code,discount}:null});
 const [applying,setApplying]=useState(false);
 if(!cartItems.length)return <div className="container page"><EmptyState icon="cart" title="Your basket feels light" text="Fresh produce and pantry favourites are waiting." action="Start shopping"/></div>;
 const itemCount=cartItems.reduce((sum,item)=>sum+item.qty,0),deliveryFee=subtotal>=deliveryConfig.freeDeliveryThreshold?0:deliveryConfig.deliveryFee,total=subtotal+deliveryFee-(applied?.discount||0),minimumRemaining=Math.max(0,deliveryConfig.minimumOrder-subtotal);
 const apply=async()=>{if(!user)return notify('Please sign in to apply a coupon','error');if(!coupon.trim())return notify('Enter a coupon code','error');setApplying(true);try{const result=await customerService.validateCoupon(coupon.trim());const value={code:result.code,discount:Number(result.discount)};setApplied(value);setCoupon(result.code);sessionStorage.setItem('grocify-coupon',result.code);sessionStorage.setItem('grocify-coupon-discount',String(result.discount));notify(`Coupon applied. You save ${money(result.discount)}`)}catch(error){setApplied(null);sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify(error.message,'error')}finally{setApplying(false)}};
 const removeCoupon=()=>{setApplied(null);setCoupon('');sessionStorage.removeItem('grocify-coupon');sessionStorage.removeItem('grocify-coupon-discount');notify('Coupon removed')};
 const handleProceed=()=>{
  if(minimumRemaining)return notify(`Add ${money(minimumRemaining)} more to continue`,'error');
  const outOfStockItem=cartItems.find(p=>p.stock<p.qty);
  if(outOfStockItem){
   return notify(outOfStockItem.stock<=0?`${outOfStockItem.name} is out of stock`:`Only ${outOfStockItem.stock} remaining in stock for ${outOfStockItem.name}`,'error');
  }
  if(!user&&!localStorage.getItem('grocify-access-token')){
   sessionStorage.setItem('grocify-auth-redirect','/checkout');
   openAuthModal('order');
   return;
  }
  nav('/checkout');
 };
 return <div className="container page narrow-page"><PageHead eyebrow="YOUR BASKET" title="Review your order" text={`${itemCount} items across ${cartItems.length} products`}/><div className="cart-layout"><section><div className="delivery-card"><Clock3/><div><b>Delivery in {deliveryConfig.estimatedDelivery}</b><small>{minimumRemaining?`Add ${money(minimumRemaining)} more to reach the minimum order`:'Your order is eligible for delivery'}</small></div></div><div className="cart-items">{cartItems.map(product=><div className="cart-line clear-price" key={product.id}><img src={product.image} alt=""/><div className="cart-product-copy"><Link to={`/product/${product.id}`}>{product.name}</Link><small>{product.unit}</small>{product.stock<=0?<span className="cart-stock-warning">Out of stock! Please remove.</span>:product.stock<product.qty?<span className="cart-stock-warning">Only {product.stock} available in stock</span>:product.stock<=5?<span className="cart-stock-low">Only {product.stock} left</span>:null}<ItemPrice product={product}/></div><QuantitySelector id={product.id}/><button className="icon-btn" onClick={()=>{qty(product.id,0);notify('Product removed')}} aria-label={`Remove ${product.name}`}><Trash2/></button></div>)}</div><label className="textarea-label">Delivery instructions<textarea placeholder="E.g. Leave with security if unavailable"/></label></section><aside className="bill-card clarified-bill"><h3>Apply coupon</h3><div className="coupon-input"><input value={coupon} disabled={!!applied} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"/><Button variant="outline" disabled={applying} onClick={applied?removeCoupon:apply}>{applied?'Remove':applying?'Checking…':'Apply'}</Button></div>{applied&&<p className="success-text">✓ {applied.code} applied. Additional saving {money(applied.discount)}.</p>}<PriceSummary title="Bill details" mrpTotal={mrpTotal} subtotal={subtotal} deliveryFee={deliveryFee} couponDiscount={applied?.discount||0} couponCode={applied?.code}/><small className="delivery-threshold-note">{minimumRemaining?`Minimum order is ${money(deliveryConfig.minimumOrder)}.`:`Free delivery above ${money(deliveryConfig.freeDeliveryThreshold)}.`}</small><Button className="wide" onClick={handleProceed}>Proceed · Pay {money(total)}</Button></aside></div></div>;
}
