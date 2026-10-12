import {money} from '../ui';

export function PriceSummary({mrpTotal,subtotal,deliveryFee=0,couponDiscount=0,couponCode,title='Price breakdown',compact=false}){
 const productSavings=Math.max(0,Number(mrpTotal)-Number(subtotal));
 const payable=Math.max(0,Number(subtotal)+Number(deliveryFee)-Number(couponDiscount));
 return <div className={`price-summary ${compact?'compact':''}`}>
  {title&&<h3>{title}</h3>}
  <p><span>Items total <small>After all product offers</small></span><b>{money(subtotal)}</b></p>
  <p><span>Delivery fee</span><b>{Number(deliveryFee)===0?<em>FREE</em>:money(deliveryFee)}</b></p>
  {Number(couponDiscount)>0&&<p className="saving"><span>Coupon savings{couponCode?` · ${couponCode}`:''}</span><b>-{money(couponDiscount)}</b></p>}
  <p className="grand"><span>Final amount payable</span><b>{money(payable)}</b></p>
  {productSavings>0&&<div className="total-saving">You saved {money(productSavings+Number(couponDiscount))} on this order</div>}
 </div>;
}

export function ItemPrice({product}){
 const quantity=Number(product.qty||product.quantity||1),lineTotal=Number(product.price)*quantity;
 return <div className="item-price-detail"><span><strong>{money(lineTotal)}</strong><small>item total</small></span><small>Offer price {money(product.price)} each {product.mrp>product.price&&<>· MRP <del>{money(product.mrp)}</del></>}</small></div>;
}
