import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {addresses as seedAddresses} from '../../data/content';
import {orders as seedOrders} from '../../data/orders';
import {money} from '../../components/ui';
export function OrderSuccessPage(){const last=JSON.parse(sessionStorage.getItem('last-order')||'null')||seedOrders[0];return <div className="success-page"><div className="success-ring"><Check/></div><span>ORDER CONFIRMED</span><h1>Thank you! Your groceries are on the way.</h1><p>We’ve received your order and started preparing it with care.</p><div className="success-card"><div><span>Order ID</span><b>#{last.id}</b></div><div><span>Estimated delivery</span><b>Today, 7:15 – 7:25 PM</b></div><div><span>Delivering to</span><b>{last.address?.line||seedAddresses[0].line}</b></div><div><span>Total payable</span><b>{money(last.total)}</b></div></div><div className="row center gap"><Link className="btn btn-primary" to={`/orders/${last.id}`}>View order</Link><Link className="btn btn-ghost" to="/">Continue shopping</Link></div></div>}
