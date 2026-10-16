import {useMemo, useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Leaf,ShieldCheck,Sparkles,Zap} from 'lucide-react';
import {ProductRail} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {normalizeHomeLayout} from '../../config/homeLayout';
import {catalogService} from '../../services/catalog.service';

export function HomePage(){
 const {categories,products,banners,deliveryConfig,storeSettings}=useApp();
 const homeLayout=useMemo(()=>normalizeHomeLayout(storeSettings?.policies?.homeLayout),[storeSettings?.policies?.homeLayout]);
 const bannerPlacements=homeLayout.bannerPlacements||{};

 const [bestSellersData, setBestSellersData] = useState(null);
 const [topPicksData, setTopPicksData] = useState(null);

 useEffect(() => {
  let mounted = true;
  Promise.all([
   catalogService.getBestSellers().catch(() => null),
   catalogService.getTopPicks().catch(() => null)
  ]).then(([bs, tp]) => {
   if (!mounted) return;
   if (bs) setBestSellersData(bs);
   if (tp) setTopPicksData(tp);
  });
  return () => { mounted = false; };
 }, []);

 const liveBanners=useMemo(()=>banners.filter(banner=>!banner.status||banner.status==='ACTIVE'),[banners]);

 const heroBanners=useMemo(()=>{
  return liveBanners.filter((banner,index)=>{
   const p=bannerPlacements[banner.id];
   if(p==='HERO'||p==='BOTH')return true;
   if(p==='CAMPAIGN')return false;
   return index<2;
  });
 },[liveBanners,bannerPlacements]);

 const campaignBanners=useMemo(()=>{
  return liveBanners.filter((banner,index)=>{
   const p=bannerPlacements[banner.id];
   if(p==='CAMPAIGN'||p==='BOTH')return true;
   if(p==='HERO')return false;
   return index>=2;
  });
 },[liveBanners,bannerPlacements]);

 const orderedCategories=useMemo(()=>{
  if(!homeLayout.categoryOrder?.length)return categories;
  const orderMap=new Map(homeLayout.categoryOrder.map((slugOrId,idx)=>[slugOrId,idx]));
  return [...categories].sort((a,b)=>{
   const posA=orderMap.has(a.slug)?orderMap.get(a.slug):(orderMap.has(a.id)?orderMap.get(a.id):999);
   const posB=orderMap.has(b.slug)?orderMap.get(b.slug):(orderMap.has(b.id)?orderMap.get(b.id):999);
   return posA-posB;
  });
 },[categories,homeLayout.categoryOrder]);

 const activeSections=useMemo(()=>{
  const list=(homeLayout.sections||[]).filter(s=>s.enabled!==false);
  return [...list].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 },[homeLayout.sections]);

 return <>
  {activeSections.map(section=>{
   switch(section.id){
    case 'heroBanners':
     if(!heroBanners.length)return null;
     return (
      <section className="hero container" key="heroBanners">
       {heroBanners.map((banner,index)=><HeroBanner banner={banner} index={index} products={products} key={banner.id}/>)}
      </section>
     );

    case 'campaignOffers':
     if(!campaignBanners.length)return null;
     return (
      <section className="container campaign-section" key="campaignOffers">
       <div className="section-head">
        <div>
         <h2>{section.title||'Offers picked for you'}</h2>
         <p>{section.subtitle||'Fresh deals, updated from R2Cart'}</p>
        </div>
       </div>
       <div className="campaign-rail">
        {campaignBanners.map((banner,index)=>(
         <Link
          className={`campaign-card campaign-${index%4}`}
          to={banner.destination||'/'}
          key={banner.id}
          style={banner.image?{backgroundImage:`linear-gradient(90deg,rgba(6,46,31,.92),rgba(6,46,31,.2)),url(${banner.image})`}:undefined}
         >
          <span>{banner.kicker||'R2CART OFFER'}</span>
          <h3>{banner.heading}</h3>
          <p>{banner.subtitle}</p>
          <b>{banner.ctaText||'Shop now'} →</b>
         </Link>
        ))}
       </div>
      </section>
     );

    case 'shopCategories':
     return (
      <section className="container section categories" key="shopCategories">
       <div className="section-head">
        <div>
         <h2>{section.title||'Shop by category'}</h2>
         <p>{section.subtitle||'Everything your home needs'}</p>
        </div>
        <Link to={`/category/${orderedCategories[0]?.slug||'fruits-vegetables'}`}>See all</Link>
       </div>
       <div className="category-grid">
        {orderedCategories.map(category=>(
         <Link to={`/category/${category.slug}`} key={category.slug}>
          <div style={{background:category.color}}>
           <img src={category.image} alt="" loading="lazy"/>
          </div>
          <b>{category.name}</b>
         </Link>
        ))}
       </div>
      </section>
     );

    case 'bestSellers':{
     if(bestSellersData&&bestSellersData.visible===false)return null;
     const items=bestSellersData?.products||products.filter(p=>p.bestSeller);
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length)return null;
     return (
      <div className="container" key="bestSellers">
       <ProductRail
        title={bestSellersData?.title||section.title||'Best sellers'}
        subtitle={bestSellersData?.subtitle||'Most popular grocery items bought by our customers'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
       />
      </div>
     );
    }

    case 'topPicks':{
     if(topPicksData&&topPicksData.visible===false)return null;
     const items=topPicksData?.products||[];
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length)return null;
     return (
      <div className="container" key="topPicks">
       <ProductRail
        title={topPicksData?.title||section.title||'Top picks'}
        subtitle={topPicksData?.subtitle||'Daily essentials, seasonal favorites, and great value'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
       />
      </div>
     );
    }

    case 'recommended':{
     const items=products.slice(2,2+(Number(section.count)||10));
     if(!items.length)return null;
     return (
      <div className="container" key="recommended">
       <ProductRail
        title={section.title||'Recommended for you'}
        to={orderedCategories[1]?`/category/${orderedCategories[1].slug}`:'/category/dairy-breakfast'}
        items={items}
       />
      </div>
     );
    }

    case 'promoStrip':
     return (
      <div className="container" key="promoStrip">
       <PromoStrip
        tag={section.tag||'YOUR SAVINGS'}
        title={section.title||'Stock up. Save more.'}
        subtitle={section.subtitle||'Explore the current offers available for your basket.'}
        buttonText={section.buttonText||'Explore offers'}
        buttonLink={section.buttonLink||'/coupons'}
       />
      </div>
     );

    case 'categoryRails':{
     const maxCats=Number(section.maxCategories)||8;
     const railsToRender=orderedCategories.slice(0,maxCats);
     return (
      <div className="container" key="categoryRails">
       {railsToRender.map(category=>{
        const catProducts=products.filter(p=>p.category===category.slug||p.category?.slug===category.slug||p.categoryId===category.id);
        if(!catProducts.length)return null;
        return <ProductRail key={category.slug} title={category.name} to={`/category/${category.slug}`} items={catProducts}/>;
       })}
      </div>
     );
    }

    case 'specialOffers':{
     const items=products.filter(p=>p.mrp-p.price>10).slice(0,Number(section.count)||10);
     if(!items.length)return null;
     return (
      <div className="container" key="specialOffers">
       <ProductRail title={section.title||'Special offers'} to="/coupons" items={items}/>
      </div>
     );
    }

    case 'recentlyViewed':{
     const items=products.slice(8,8+(Number(section.count)||8));
     if(!items.length)return null;
     return (
      <div className="container" key="recentlyViewed">
       <ProductRail
        title={section.title||'Recently viewed'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={items}
       />
      </div>
     );
    }

    case 'promise':
     return (
      <section className="promise" key="promise">
       <div className="container promise-grid">
        <div><Zap/><span><b>{deliveryConfig.estimatedDelivery} delivery</b><small>From store to doorstep</small></span></div>
        <div><Leaf/><span><b>Freshness guaranteed</b><small>Handpicked every day</small></span></div>
        <div><ShieldCheck/><span><b>Quality you can trust</b><small>Easy returns & support</small></span></div>
       </div>
      </section>
     );

    default:
     return null;
   }
  })}
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

const PromoStrip=({tag='YOUR SAVINGS',title='Stock up. Save more.',subtitle='Explore the current offers available for your basket.',buttonText='Explore offers',buttonLink='/coupons'})=>(
 <section className="promo-strip">
  <div>
   <span>{tag}</span>
   <h2>{title}</h2>
   <p>{subtitle}</p>
  </div>
  <Link className="btn btn-light" to={buttonLink}>{buttonText}</Link>
 </section>
);
