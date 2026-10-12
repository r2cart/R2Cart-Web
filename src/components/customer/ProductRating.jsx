import {useState} from 'react';
import {Star} from 'lucide-react';
import {Button} from '../ui';
import {useApp} from '../../context/AppContext';
import {customerService} from '../../services/customer.service';

export default function ProductRating({product}){
 const {user,orderList,notify,refreshProducts}=useApp();
 const [score,setScore]=useState('5'),[busy,setBusy]=useState(false);
 const eligible=user&&orderList.some(order=>order.status==='Delivered'&&order.items?.some(item=>item.productId===product.id));
 const submit=async()=>{setBusy(true);try{await customerService.rateProduct(product.id,Number(score));await refreshProducts();notify('Your rating has been saved')}catch(error){notify(error.message,'error')}finally{setBusy(false)}};
 return <div className="product-rating"><div className="rating"><Star fill={product.ratingCount?'currentColor':'none'}/>{product.ratingCount>0?<>{Number(product.rating).toFixed(1)} <span>{product.ratingCount} verified rating{product.ratingCount===1?'':'s'}</span></>:<span>No ratings yet</span>}</div>{eligible&&<div className="rating-form"><label>Your rating<select value={score} onChange={event=>setScore(event.target.value)}>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} star{value===1?'':'s'}</option>)}</select></label><Button variant="outline" disabled={busy} onClick={submit}>{busy?'Saving…':'Submit rating'}</Button></div>}</div>;
}
