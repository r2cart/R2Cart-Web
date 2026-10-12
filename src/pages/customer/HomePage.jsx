import {Link} from 'react-router-dom';
import {ArrowRight,Leaf,ShieldCheck,Sparkles,Zap} from 'lucide-react';
import {ProductRail} from '../../components/ui';
import {useApp} from '../../context/AppContext';

export function HomePage(){
 const {categories,products,banners,deliveryConfig}=useApp();
 const liveBanners=banners.filter(banner=>!banner.status||banner.status==='ACTIVE');
 return <>
  <section className="hero container">{liveBanners.slice(0,2).map((banner,index)=><HeroBanner banner={banner} index={index} products={products} key={banner.id}/>)}</section>
  {liveBanners.length>2&&<section className="container campaign-section"><div className="section-head"><div><h2>Offers picked for you</h2><p>Fresh deals, updated from R2Cart</p></div></div><div className="campaign-rail">{liveBanners.slice(2).map((banner,index)=><Link className={`campaign-card campaign-${index%4}`} to={banner.destination||'/'} key={banner.id} style={banner.image?{backgroundImage:`linear-gradient(90deg,rgba(6,46,31,.92),rgba(6,46,31,.2)),url(${banner.image})`}:undefined}><span>{banner.kicker||'R2CART OFFER'}</span><h3>{banner.heading}</h3><p>{banner.subtitle}</p><b>{banner.ctaText||'Shop now'} →</b></Link>)}</div></section>}
  <section className="container section categories"><div className="section-head"><div><h2>Shop by category</h2><p>Everything your home needs</p></div><Link to={`/category/${categories[0]?.slug||'fruits-vegetables'}`}>See all</Link></div><div className="category-grid">{categories.map(category=><Link to={`/category/${category.slug}`} key={category.slug}><div style={{background:category.color}}><img src={category.image} alt="" loading="lazy"/></div><b>{category.name}</b></Link>)}</div></section>
  <div className="container"><ProductRail title="Best sellers" items={products.filter(product=>product.bestSeller)}/><ProductRail title="Recommended for you" items={products.slice(2,10)}/><PromoStrip/><ProductRail title="Fresh vegetables" items={products.filter(product=>product.category==='fruits-vegetables').slice(0,5)}/><ProductRail title="Dairy products" items={products.filter(product=>product.category==='dairy-breakfast')}/><ProductRail title="Snacks & beverages" items={products.filter(product=>['snacks','beverages'].includes(product.category))}/><ProductRail title="Household essentials" items={products.filter(product=>['household','personal'].includes(product.category))}/><ProductRail title="Special offers" items={products.filter(product=>product.mrp-product.price>10)}/><ProductRail title="Recently viewed" items={products.slice(8,14)}/></div>
  <section className="promise"><div className="container promise-grid"><div><Zap/><span><b>{deliveryConfig.estimatedDelivery} delivery</b><small>From store to doorstep</small></span></div><div><Leaf/><span><b>Freshness guaranteed</b><small>Handpicked every day</small></span></div><div><ShieldCheck/><span><b>Quality you can trust</b><small>Easy returns & support</small></span></div></div></section>
 </>;
}
function relatedProducts(banner,products){
 const copy=`${banner.kicker||''} ${banner.heading||banner.title||''} ${banner.subtitle||banner.text||''}`.toLowerCase();
 const groups=[
  [['milk','egg','bread','morning','breakfast'],['dairy-breakfast','bakery']],
  [['snack','chip','biscuit','crunch'],['snacks']],
  [['fruit','vegetable','fresh choice'],['fruits-vegetables']],
  [['juice','drink','chill','sip'],['beverages']],
  [['atta','rice','dal','pantry'],['staples']],
  [['clean','household','home'],['household']],
  [['care','shampoo','soap'],['personal']],
  [['instant','quick meal','noodle'],['instant']],
  [['oil','spice','cook','kitchen'],['cooking']]
 ];
 const categories=groups.find(([words])=>words.some(word=>copy.includes(word)))?.[1]||[];
 const matches=products.filter(product=>categories.includes(product.category));
 return [...matches,...products.filter(product=>!matches.includes(product))].slice(0,3);
}
function HeroBanner({banner,index,products}){
 const picks=relatedProducts(banner,products),main=banner.image||picks[0]?.image,secondary=picks[banner.image?0:1]?.image,third=picks[banner.image?1:2]?.image;
 const replaceOrHide=(fallback,event)=>{const image=event.currentTarget;if(fallback&&!image.dataset.fallbackUsed){image.dataset.fallbackUsed='true';image.src=fallback}else image.parentElement.style.display='none'};
 return <article className={`hero-card premium-hero hero-${index?'cream':'green'} ${index?'second':''}`}><div className="hero-copy"><span className="hero-kicker"><Sparkles/>{banner.kicker||'R2CART FRESH'}</span><h1>{banner.heading||banner.title}</h1><p>{banner.subtitle||banner.text}</p><Link className="hero-cta" to={banner.destination||banner.to||'/'}><b>{banner.ctaText||banner.cta||'Shop now'}</b><i><ArrowRight/></i></Link><small className="hero-note">Fresh picks · Honest prices · Fast delivery</small></div><div className="hero-visual" aria-hidden="true"><div className="hero-photo"><img src={main} alt="" onError={event=>replaceOrHide(secondary,event)}/></div>{secondary&&<div className="hero-product hero-product-one"><img src={secondary} alt="" onError={event=>replaceOrHide(third,event)}/></div>}{third&&<div className="hero-product hero-product-two"><img src={third} alt="" onError={event=>replaceOrHide('',event)}/></div>}<span className="hero-offer"><b>Fresh</b><small>every day</small></span></div></article>;
}
const PromoStrip=()=> <section className="promo-strip"><div><span>YOUR SAVINGS</span><h2>Stock up. Save more.</h2><p>Explore the current offers available for your basket.</p></div><Link className="btn btn-light" to="/coupons">Explore offers</Link></section>;
