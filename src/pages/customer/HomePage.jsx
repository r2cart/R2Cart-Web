import {useMemo, useState, useEffect, useRef} from 'react';
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
 const [festivalOffers, setFestivalOffers] = useState([]);

 useEffect(() => {
  let mounted = true;
  Promise.all([
   catalogService.getBestSellers().catch(() => null),
   catalogService.getTopPicks().catch(() => null),
   catalogService.getActiveMarketing().catch(() => null)
  ]).then(([bs, tp, mkt]) => {
   if (!mounted) return;
   if (bs) setBestSellersData(bs);
   if (tp) setTopPicksData(tp);
   if (mkt?.festivalOffers) setFestivalOffers(mkt.festivalOffers);
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
  const promoBanners = (festivalOffers || []).map((f, idx) => ({
   id: `fest-${f.id || idx}`,
   kicker: f.badge || 'FESTIVAL SPECIAL',
   heading: f.title || f.name,
   subtitle: f.subtitle || f.content,
   image: f.imageUrl,
   destination: f.linkUrl && f.linkUrl !== '/' && f.linkUrl !== '#' ? f.linkUrl : '/coupons',
   ctaText: f.metadata?.ctaText || 'Shop festival deals'
  }));

  const regularBanners = liveBanners.filter((banner,index)=>{
   const p=bannerPlacements[banner.id];
   if(p==='CAMPAIGN'||p==='BOTH')return true;
   if(p==='HERO')return false;
   return index>=2;
  });

  return [...promoBanners, ...regularBanners];
 },[liveBanners,bannerPlacements,festivalOffers]);

 const orderedCategories=useMemo(()=>{
  if(!homeLayout.categoryOrder?.length)return categories;
  const orderMap=new Map(homeLayout.categoryOrder.map((slugOrId,idx)=>[slugOrId,idx]));
  return [...categories].sort((a,b)=>{
   const posA=orderMap.has(a.slug)?orderMap.get(a.slug):(orderMap.has(a.id)?orderMap.get(a.id):999);
   const posB=orderMap.has(b.slug)?orderMap.get(b.slug):(orderMap.has(b.id)?orderMap.get(b.id):999);
   if (posA === posB) {
     return (Number(a.position) || 999) - (Number(b.position) || 999);
   }
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
      <HeroBannerSection heroBanners={heroBanners} products={products} key="heroBanners" />
     );

    case 'campaignOffers':
     if(!campaignBanners.length && !section.comingSoon)return null;
     return (
      <section className="container campaign-section" key="campaignOffers">
       <div className="section-head">
        <div>
         <h2>
          {section.title||'Offers picked for you'}
          {section.comingSoon && <span className="section-coming-soon-badge"><Sparkles size={12}/> {section.comingSoonBadge||'Coming Soon'}</span>}
         </h2>
         <p>{section.subtitle||'Fresh deals, updated from R2Cart'}</p>
        </div>
       </div>
       {section.comingSoon ? (
        <div className="section-cs-banner">
         <span className="cs-chip"><Sparkles size={12}/> COMING SOON</span>
         <h4>{section.comingSoonTitle || 'Offers Launching Soon'}</h4>
         <p>{section.comingSoonNotice || 'We are preparing handpicked merchant deals and festival promotions for your area.'}</p>
        </div>
       ) : (
        <div className={`campaign-rail ${campaignBanners.length === 1 ? 'single-banner' : ''}`}>
         {campaignBanners.map((banner,index)=>{
          const hasImage = Boolean(banner.image);
          const rawCta = banner.ctaText || 'Claim Offer Now';
          const ctaClean = rawCta.replace(/[→\->\s]+$/, '').trim() || 'Claim Offer Now';

          // Smart subtitle cleaner: if subtitle repeats the heading, extract the unique tail or omit repetition
          const cleanSub = (() => {
           if (!banner.subtitle) return null;
           const cleanHead = (banner.heading || '').replace(/^[⚡🎉🔥💥\s]+/, '').trim().toLowerCase();
           const rawSub = banner.subtitle.trim();
           if (cleanHead === rawSub.toLowerCase()) return null;

           const normWord = w => w.toLowerCase().replace(/[^a-z0-9]/g, '').replace('minute', 'min');
           const headWords = cleanHead.split(/\s+/).map(normWord).filter(Boolean);
           const subWords = rawSub.split(/\s+/);

           let matchCount = 0;
           for (let i = 0; i < Math.min(headWords.length, subWords.length); i++) {
            if (headWords[i] === normWord(subWords[i])) {
             matchCount++;
            } else {
             break;
            }
           }
           if (matchCount >= 4) {
            const tail = subWords.slice(matchCount).join(' ').replace(/^[\s,.\-–—]+/, '').trim();
            if (!tail) return null;
            return tail.charAt(0).toUpperCase() + tail.slice(1);
           }
           return rawSub;
          })();

          return (
           <Link
            className={`campaign-card campaign-${index%4}`}
            to={banner.destination||'/'}
            key={banner.id}
            style={hasImage ? {
             backgroundImage: `linear-gradient(95deg, rgba(7, 24, 16, 0.96) 0%, rgba(7, 24, 16, 0.88) 45%, rgba(7, 24, 16, 0.40) 70%, rgba(7, 24, 16, 0.10) 100%), url(${banner.image})`
            } : undefined}
           >
            <div className="campaign-card-content">
             <span className="campaign-card-kicker">
              {banner.kicker || 'SPECIAL OFFER'}
             </span>
             <h3 className="campaign-card-title">{banner.heading}</h3>
             {cleanSub && (
              <p className="campaign-card-desc">{cleanSub}</p>
             )}
            </div>
            <div className="campaign-card-action">
             <span className="campaign-card-btn">
              <span>{ctaClean}</span>
              <span className="campaign-card-arrow" aria-hidden="true">→</span>
             </span>
            </div>
           </Link>
          );
         })}
        </div>
       )}
      </section>
     );

    case 'shopCategories':
     return (
      <section className="container section categories" key="shopCategories">
       <div className="section-head">
        <div>
         <h2>
          {section.title||'Shop by category'}
          {section.comingSoon && <span className="section-coming-soon-badge"><Sparkles size={12}/> {section.comingSoonBadge||'Coming Soon'}</span>}
         </h2>
         <p>{section.subtitle||'Everything your home needs'}</p>
        </div>
        <Link to={`/category/${orderedCategories[0]?.slug||'fruits-vegetables'}`}>See all</Link>
       </div>
       {section.comingSoon ? (
        <div className="section-cs-banner">
         <span className="cs-chip"><Sparkles size={12}/> COMING SOON</span>
         <h4>{section.comingSoonTitle || 'Categories Opening Soon'}</h4>
         <p>{section.comingSoonNotice || 'Categories are being organized for your quick 10-minute delivery.'}</p>
        </div>
       ) : (
        <div className="category-grid">
         {orderedCategories.length === 0 ? (
          Array.from({length: 8}).map((_, i) => (
           <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',padding:'8px'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'var(--surface-hover,#f1f5f9)',opacity:0.7}}/>
            <div style={{width:'52px',height:'10px',borderRadius:'4px',background:'var(--surface-hover,#f1f5f9)',opacity:0.7}}/>
           </div>
          ))
         ) : (
          orderedCategories.map(category=>{
           const isCatSoon = (homeLayout.comingSoonCategories||[]).includes(category.slug);
           return (
            <Link 
             to={`/category/${category.slug}`} 
             key={category.slug}
             className="category-card-item"
             title={isCatSoon ? `${category.name} (Coming Soon)` : `Browse ${category.name}`}
            >
             <div className="category-thumb-wrap" style={{background:category.color, position:'relative'}}>
              {isCatSoon && <span className="cat-soon-badge">SOON</span>}
              <img 
               src={category.image} 
               alt={category.name} 
               loading="lazy"
               onError={(e)=>{
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=320&q=75';
               }}
              />
             </div>
             <b>{category.name}</b>
            </Link>
           );
          })
         )}
        </div>
       )}
      </section>
     );

    case 'bestSellers':{
     if(bestSellersData&&bestSellersData.visible===false)return null;
     const items=bestSellersData?.products||products.filter(p=>p.bestSeller);
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length && !section.comingSoon)return null;
     return (
      <div className="container" key="bestSellers">
       <ProductRail
        title={bestSellersData?.title||section.title||'Best sellers'}
        subtitle={bestSellersData?.subtitle||'Most popular grocery items bought by our customers'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
     );
    }

    case 'topPicks':{
     if(topPicksData&&topPicksData.visible===false)return null;
     const items=topPicksData?.products||[];
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length && !section.comingSoon)return null;
     return (
      <div className="container" key="topPicks">
       <ProductRail
        title={topPicksData?.title||section.title||'Top picks'}
        subtitle={topPicksData?.subtitle||'Daily essentials, seasonal favorites, and great value'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
     );
    }

    case 'recommended':{
     const items=products.slice(2,2+(Number(section.count)||10));
     if(!items.length && !section.comingSoon)return null;
     return (
      <div className="container" key="recommended">
       <ProductRail
        title={section.title||'Recommended for you'}
        to={orderedCategories[1]?`/category/${orderedCategories[1].slug}`:'/category/dairy-breakfast'}
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
     );
    }

    case 'promoStrip':
     if(section.comingSoon){
      return (
       <div className="container" key="promoStrip">
        <div className="section-cs-banner" style={{margin:'30px 0'}}>
         <span className="cs-chip"><Sparkles size={12}/> COMING SOON</span>
         <h4>{section.title||'Special Savings Deals'}</h4>
         <p>{section.comingSoonNotice||'Exclusive coupon packages and festive vouchers will be available here soon.'}</p>
        </div>
       </div>
      );
     }
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
     if(section.comingSoon){
      return (
       <div className="container" key="categoryRails">
        <div className="section-cs-banner" style={{margin:'20px 0'}}>
         <span className="cs-chip"><Sparkles size={12}/> COMING SOON</span>
         <h4>Category Aisles Under Preparation</h4>
         <p>{section.comingSoonNotice||'Dedicated aisles for snacks, dairy, fruits and more are being stocked.'}</p>
        </div>
       </div>
      );
     }
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
     if(!items.length && !section.comingSoon)return null;
     return (
      <div className="container" key="specialOffers">
       <ProductRail 
        title={section.title||'Special offers'} 
        to="/coupons" 
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
     );
    }

    case 'recentlyViewed':{
     const items=products.slice(8,8+(Number(section.count)||8));
     if(!items.length && !section.comingSoon)return null;
     return (
      <div className="container" key="recentlyViewed">
       <ProductRail
        title={section.title||'Recently viewed'}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
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

function HeroBannerSection({ heroBanners, products }) {
 const [activeSlide, setActiveSlide] = useState(0);
 const trackRef = useRef(null);

 const handleScroll = (e) => {
  const el = e.currentTarget;
  if (!el) return;
  const slideWidth = el.offsetWidth;
  if (slideWidth > 0) {
   const idx = Math.round(el.scrollLeft / slideWidth);
   if (idx !== activeSlide && idx >= 0 && idx < heroBanners.length) {
    setActiveSlide(idx);
   }
  }
 };

 const goToSlide = (idx) => {
  setActiveSlide(idx);
  if (trackRef.current) {
   const slideWidth = trackRef.current.offsetWidth;
   trackRef.current.scrollTo({
    left: idx * slideWidth,
    behavior: 'smooth'
   });
  }
 };

 useEffect(() => {
  if (heroBanners.length <= 1) return;
  const timer = setInterval(() => {
   setActiveSlide(prev => {
    const next = (prev + 1) % heroBanners.length;
    if (trackRef.current) {
     const slideWidth = trackRef.current.offsetWidth;
     trackRef.current.scrollTo({
      left: next * slideWidth,
      behavior: 'smooth'
     });
    }
    return next;
   });
  }, 4500);
  return () => clearInterval(timer);
 }, [heroBanners.length]);

 return (
  <section className="hero-section-wrap container" key="heroBanners">
   {/* Desktop View: 2 side-by-side banners */}
   <div className="hero desktop-hero-grid">
    {heroBanners.map((banner, index) => (
     <HeroBanner banner={banner} index={index} products={products} key={banner.id} />
    ))}
   </div>

   {/* Mobile View: 2-Slide Banner Carousel */}
   <div className="mobile-hero-carousel">
    <div 
     className="mobile-hero-track"
     ref={trackRef}
     onScroll={handleScroll}
    >
     {heroBanners.map((banner, index) => (
      <div className="mobile-hero-slide" key={banner.id}>
       <HeroBanner banner={banner} index={index} products={products} />
      </div>
     ))}
    </div>
    {heroBanners.length > 1 && (
     <div className="mobile-hero-dots">
      {heroBanners.map((_, idx) => (
       <button
        key={idx}
        type="button"
        className={`mobile-hero-dot ${activeSlide === idx ? 'active' : ''}`}
        onClick={() => goToSlide(idx)}
        aria-label={`Go to banner slide ${idx + 1}`}
       />
      ))}
     </div>
    )}
   </div>
  </section>
 );
}

