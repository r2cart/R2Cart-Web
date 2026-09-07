import {Link} from 'react-router-dom';
import {Leaf,ShieldCheck,Zap} from 'lucide-react';
import {banners} from '../../data/content';
import {ProductRail} from '../../components/ui';
import {useApp} from '../../context/AppContext';

export function HomePage(){
 const {categories,products}=useApp();
 return <>
  <section className="hero container">{banners.map((banner,index)=><div className={`hero-card hero-${banner.tone} ${index?'second':''}`} key={banner.id}><div><span>{banner.kicker}</span><h1>{banner.title}</h1><p>{banner.text}</p><Link className="btn btn-dark" to={banner.to}>{banner.cta} →</Link></div><div className="hero-art"><img src={(index?products[5]:products[4])?.image} alt=""/><i><img src={(index?products[7]:products[0])?.image} alt=""/></i></div></div>)}</section>
  <section className="container section categories"><div className="section-head"><div><h2>Shop by category</h2><p>Everything your home needs</p></div><Link to={`/category/${categories[0]?.slug||'fruits-vegetables'}`}>See all</Link></div><div className="category-grid">{categories.map(category=><Link to={`/category/${category.slug}`} key={category.slug}><div style={{background:category.color}}><img src={category.image} alt="" loading="lazy"/></div><b>{category.name}</b></Link>)}</div></section>
  <div className="container"><ProductRail title="Best sellers" items={products.filter(product=>product.bestSeller)}/><ProductRail title="Recommended for you" items={products.slice(2,10)}/><PromoStrip/><ProductRail title="Fresh vegetables" items={products.filter(product=>product.category==='fruits-vegetables').slice(0,5)}/><ProductRail title="Dairy products" items={products.filter(product=>product.category==='dairy-breakfast')}/><ProductRail title="Snacks & beverages" items={products.filter(product=>['snacks','beverages'].includes(product.category))}/><ProductRail title="Household essentials" items={products.filter(product=>['household','personal'].includes(product.category))}/><ProductRail title="Special offers" items={products.filter(product=>product.mrp-product.price>10)}/><ProductRail title="Recently viewed" items={products.slice(8,14)}/></div>
  <section className="promise"><div className="container promise-grid"><div><Zap/><span><b>10 minute delivery</b><small>From store to doorstep</small></span></div><div><Leaf/><span><b>Freshness guaranteed</b><small>Handpicked every day</small></span></div><div><ShieldCheck/><span><b>Quality you can trust</b><small>Easy returns & support</small></span></div></div></section>
 </>;
}
const PromoStrip=()=> <section className="promo-strip"><div><span>WEEKEND SAVINGS</span><h2>Stock up. Save more.</h2><p>Extra value on pantry staples above ₹799</p></div><Link className="btn btn-light" to="/coupons">Explore offers</Link></section>;
