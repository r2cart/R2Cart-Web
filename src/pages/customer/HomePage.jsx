import {useMemo, useState, useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Leaf,ShieldCheck,Sparkles,Zap} from 'lucide-react';
import {ProductRail} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {useLanguage} from '../../context/LanguageContext';
import {normalizeHomeLayout} from '../../config/homeLayout';
import {catalogService} from '../../services/catalog.service';
import {dedupeProductPacks} from '../../utils/products';
import {useScrollReveal} from '../../hooks/useScrollReveal';

/**
 * Reveal — wraps any section with a scroll-triggered animation.
 * @param {'section'|'zoom'|'up'|'fade'} type - animation style
 * @param {string} delay - optional CSS delay class ('delay-1'..'delay-4')
 */
function Reveal({ children, type = 'section', delay = '' }) {
 const ref = useScrollReveal('is-revealed', 0.1, '0px 0px -40px 0px');
 return (
  <div ref={ref} className={`reveal-${type}${delay ? ` ${delay}` : ''}`}>
   {children}
  </div>
 );
}

export function HomePage(){
 const {categories,products,banners,deliveryConfig,storeSettings}=useApp();
 const {lang, t, tCat, tEta} = useLanguage();
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

 const heroRotation = homeLayout.heroRotation || {};
 const bannerVisuals = homeLayout.bannerVisuals || {};

 const allHeroCandidates = useMemo(()=>{
  return liveBanners.filter((banner,index)=>{
   const p=bannerPlacements[banner.id];
   if(p==='HERO'||p==='BOTH')return true;
   if(p==='CAMPAIGN')return false;
   return index<2;
  });
 },[liveBanners,bannerPlacements]);

 const heroBanners = useMemo(() => {
  if (allHeroCandidates.length <= 1) return allHeroCandidates;

  const { manualBannerId, manualChangedAt, intervalHours = 24 } = heroRotation;
  const cycleMs = (Number(intervalHours) || 24) * 60 * 60 * 1000;
  const now = Date.now();

  let activeIndex = 0;

  if (manualBannerId && manualChangedAt) {
   const manualTime = new Date(manualChangedAt).getTime();
   if (!isNaN(manualTime)) {
    const elapsed = now - manualTime;
    const manualIdx = allHeroCandidates.findIndex(b => String(b.id) === String(manualBannerId));
    if (manualIdx !== -1) {
     if (elapsed >= 0 && elapsed < cycleMs) {
      // Admin manual override is active within the 24-hour cycle
      activeIndex = manualIdx;
     } else {
      // 24 hours elapsed since admin manual change, auto-rotate forward daily
      const periods = Math.floor(elapsed / cycleMs);
      activeIndex = (manualIdx + periods) % allHeroCandidates.length;
     }
    }
   }
  } else {
   // Synchronized 24-hour daily calendar rotation for all users
   const dayNumber = Math.floor(now / (24 * 60 * 60 * 1000));
   activeIndex = dayNumber % allHeroCandidates.length;
  }

  // Reorder so active banner is at index 0
  const reordered = [];
  for (let i = 0; i < allHeroCandidates.length; i++) {
   reordered.push(allHeroCandidates[(activeIndex + i) % allHeroCandidates.length]);
  }
  return reordered;
 }, [allHeroCandidates, heroRotation]);

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
      <Reveal key="heroBanners" type="zoom">
       <HeroBannerSection heroBanners={heroBanners} products={products} bannerVisuals={bannerVisuals} />
      </Reveal>
     );

    case 'campaignOffers':
     if(!campaignBanners.length && !section.comingSoon)return null;
     return (
      <Reveal key="campaignOffers" type="section">
       <section className="container campaign-section">
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
      </Reveal>
     );

    case 'shopCategories':
     return (
      <Reveal key="shopCategories" type="section"><section className="container section categories">
       <div className="section-head">
        <div>
         <h2>
          {lang === 'hi' ? t('shopByCategory') : (section.title||'Shop by category')}
          {section.comingSoon && <span className="section-coming-soon-badge"><Sparkles size={12}/> {section.comingSoonBadge||(lang==='hi'?'जल्द आ रहा है':'Coming Soon')}</span>}
         </h2>
         <p>{lang === 'hi' ? 'आपकी दैनिक ज़रूरतों का हर सामान' : (section.subtitle||'Everything your home needs')}</p>
        </div>
        <Link to={`/category/${orderedCategories[0]?.slug||'fruits-vegetables'}`}>{t('seeAll', 'See all')}</Link>
       </div>
       {section.comingSoon ? (
        <div className="section-cs-banner">
         <span className="cs-chip"><Sparkles size={12}/> {lang==='hi'?'जल्द आ रहा है':'COMING SOON'}</span>
         <h4>{section.comingSoonTitle || (lang==='hi'?'कैटेगरीज जल्द शुरू हो रही हैं':'Categories Opening Soon')}</h4>
         <p>{section.comingSoonNotice || (lang==='hi'?'10-मिनट डिलीवरी के लिए सभी कैटेगरीज व्यवस्थित की जा रही हैं।':'Categories are being organized for your quick 10-minute delivery.')}</p>
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
             style={{ position: 'relative', overflow: 'visible' }}
             title={isCatSoon ? `${tCat(category.name)} (Coming Soon)` : `Browse ${tCat(category.name)}`}
            >
             {category.badgeActive && category.badgeText && (
               <span
                 style={{
                   position: 'absolute',
                   top: '-9px',
                   left: '50%',
                   transform: 'translateX(-50%)',
                   background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                   color: '#ffffff',
                   fontSize: '9.5px',
                   fontWeight: 800,
                   padding: '2.5px 8px',
                   borderRadius: '999px',
                   whiteSpace: 'nowrap',
                   boxShadow: '0 3px 8px rgba(2, 132, 199, 0.4)',
                   zIndex: 10,
                   lineHeight: 1.15,
                   border: '1.5px solid #ffffff',
                   pointerEvents: 'none',
                   letterSpacing: '0.2px'
                 }}
               >
                 {category.badgeText}
               </span>
             )}
             <div className="category-thumb-wrap" style={{background:category.color, position:'relative'}}>
              {isCatSoon && <span className="cat-soon-badge">SOON</span>}
              <img 
               src={category.image} 
               alt={tCat(category.name)} 
               loading="lazy"
               onError={(e)=>{
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=320&q=75';
               }}
              />
             </div>
             <b>{tCat(category.name)}</b>
            </Link>
           );
          })
         )}
        </div>
       )}
      </section>
      </Reveal>
     );

    case 'bestSellers':{
     if(bestSellersData&&bestSellersData.visible===false)return null;
     const items=bestSellersData?.products||products.filter(p=>p.bestSeller);
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length && !section.comingSoon)return null;
     return (
      <Reveal key="bestSellers" type="up"><div className="container">
       <ProductRail
        title={lang==='hi' ? t('bestSellers') : (bestSellersData?.title||section.title||'Best sellers')}
        subtitle={lang==='hi' ? 'ग्राहकों द्वारा सबसे ज्यादा खरीदे गए ताज़ा सामान' : (bestSellersData?.subtitle||'Most popular grocery items bought by our customers')}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
      </Reveal>
     );
    }

    case 'topPicks':{
     if(topPicksData&&topPicksData.visible===false)return null;
     const items=topPicksData?.products||[];
     const count=Number(section.count)||10;
     const displayItems=items.slice(0,count);
     if(!displayItems.length && !section.comingSoon)return null;
     return (
      <Reveal key="topPicks" type="up"><div className="container">
       <ProductRail
        title={lang==='hi' ? t('topPicks') : (topPicksData?.title||section.title||'Top picks')}
        subtitle={lang==='hi' ? 'दैनिक जरूरतें, मौसमी उत्पाद और बेहतरीन कीमतें' : (topPicksData?.subtitle||'Daily essentials, seasonal favorites, and great value')}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={displayItems}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
      </Reveal>
     );
    }

    case 'recommended':{
     const items=products.slice(2,2+(Number(section.count)||10));
     if(!items.length && !section.comingSoon)return null;
     return (
      <Reveal key="recommended" type="up"><div className="container">
       <ProductRail
        title={lang==='hi' ? t('recommended') : (section.title||'Recommended for you')}
        to={orderedCategories[1]?`/category/${orderedCategories[1].slug}`:'/category/dairy-breakfast'}
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
      </Reveal>
     );
    }

    case 'promoStrip':
     if(section.comingSoon){
      return (
       <Reveal key="promoStrip-cs" type="fade">
        <div className="container">
        <div className="section-cs-banner" style={{margin:'30px 0'}}>
         <span className="cs-chip"><Sparkles size={12}/> {lang==='hi'?'जल्द आ रहा है':'COMING SOON'}</span>
         <h4>{lang==='hi' ? t('specialOffers') : (section.title||'Special Savings Deals')}</h4>
         <p>{section.comingSoonNotice||(lang==='hi'?'विशेष कूपन ऑफर्स और डिस्काउंट वाउचर्स जल्द उपलब्ध होंगे।':'Exclusive coupon packages and festive vouchers will be available here soon.')}</p>
        </div>
        </div>
       </Reveal>
      );
     }
     return (
      <Reveal key="promoStrip" type="fade"><div className="container">
       <PromoStrip
        tag={lang==='hi' ? 'आपकी बचत' : (section.tag||'YOUR SAVINGS')}
        title={lang==='hi' ? 'खरीदें ज्यादा · बचाएं ज्यादा' : (section.title||'Stock up. Save more.')}
        subtitle={lang==='hi' ? 'अपनी कार्ट के लिए आकर्षक ऑफर्स और छूट देखें।' : (section.subtitle||'Explore the current offers available for your basket.')}
        buttonText={lang==='hi' ? 'ऑफ़र्स देखें' : (section.buttonText||'Explore offers')}
        buttonLink={section.buttonLink||'/coupons'}
       />
      </div>
      </Reveal>
     );

    case 'categoryRails':{
     if(section.comingSoon){
      return (
       <Reveal key="categoryRails-cs" type="section">
        <div className="container">
        <div className="section-cs-banner" style={{margin:'20px 0'}}>
         <span className="cs-chip"><Sparkles size={12}/> {lang==='hi'?'जल्द आ रहा है':'COMING SOON'}</span>
         <h4>{lang==='hi'?'कैटेगरी सेक्शन तैयार हो रहे हैं':'Category Aisles Under Preparation'}</h4>
         <p>{section.comingSoonNotice||(lang==='hi'?'स्नैक्स, डेयरी, फल व सब्जियों के सेक्शन में स्टॉक भरा जा रहा है।':'Dedicated aisles for snacks, dairy, fruits and more are being stocked.')}</p>
        </div>
        </div>
       </Reveal>
      );
     }
     const maxCats=Number(section.maxCategories)||8;
     const railsToRender=orderedCategories.slice(0,maxCats);
     return (
      <Reveal key="categoryRails" type="up"><div className="container">
       {railsToRender.map(category=>{
        const catProducts=products.filter(p=>p.category===category.slug||p.category?.slug===category.slug||p.categoryId===category.id);
        if(!catProducts.length)return null;
        return (
          <ProductRail 
            key={category.slug} 
            title={category.badgeActive && category.badgeText ? `${tCat(category.name)} · 🇮🇳 ${category.badgeText}` : tCat(category.name)} 
            to={`/category/${category.slug}`} 
            items={dedupeProductPacks(catProducts)}
          />
        );
       })}
      </div>
      </Reveal>
     );
    }

    case 'specialOffers':{
     const items=products.filter(p=>p.mrp-p.price>10).slice(0,Number(section.count)||10);
     if(!items.length && !section.comingSoon)return null;
     return (
      <Reveal key="specialOffers" type="up"><div className="container">
       <ProductRail 
        title={lang==='hi' ? t('specialOffers') : (section.title||'Special offers')} 
        to="/coupons" 
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
      </Reveal>
     );
    }

    case 'recentlyViewed':{
     const items=products.slice(8,8+(Number(section.count)||8));
     if(!items.length && !section.comingSoon)return null;
     return (
      <Reveal key="recentlyViewed" type="up"><div className="container">
       <ProductRail
        title={lang==='hi' ? t('recentlyViewed') : (section.title||'Recently viewed')}
        to={orderedCategories[0]?`/category/${orderedCategories[0].slug}`:'/category/fruits-vegetables'}
        items={items}
        comingSoon={Boolean(section.comingSoon)}
        comingSoonBadge={section.comingSoonBadge}
        comingSoonNotice={section.comingSoonNotice}
       />
      </div>
      </Reveal>
     );
    }

    case 'promise':
     return (
      <Reveal key="promise" type="fade"><section className="promise">
       <div className="container promise-grid">
        <div><Zap/><span><b>{deliveryConfig.estimatedDelivery ? tEta(deliveryConfig.estimatedDelivery) : (lang==='hi'?'10-मिनट डिलीवरी':t('tagline'))}</b><small>{t('doorstepDelivery')}</small></span></div>
        <div><Leaf/><span><b>{t('freshnessGuaranteed')}</b><small>{t('handpickedDaily')}</small></span></div>
        <div><ShieldCheck/><span><b>{t('qualityTrust')}</b><small>{t('easyReturns')}</small></span></div>
       </div>
      </section>
      </Reveal>
     );

    default:
     return null;
   }
  })}
 </>;
}

function resolveBannerVisualsList(heroBanners, products, bannerVisuals) {
 const globalUsed = new Set();

 return (heroBanners || []).map((banner, bannerIndex) => {
  const visualConfig = bannerVisuals?.[banner.id] || {};
  
  // Explicit Admin uploads take highest precedence
  let main = visualConfig.mainImage || (banner.image && !banner.image.includes('placeholder') ? banner.image : '');
  let secondary = visualConfig.secondaryImage || '';
  let third = visualConfig.thirdImage || '';

  // Detect theme of the banner based on text
  const copy = `${banner.kicker || ''} ${banner.heading || banner.title || ''} ${banner.subtitle || banner.text || ''}`.toLowerCase();
  const isBreakfast = copy.includes('breakfast') || copy.includes('mornings') || copy.includes('morning') || copy.includes('milk') || copy.includes('egg') || copy.includes('bread');
  const isFarm = copy.includes('farm') || copy.includes('fruit') || copy.includes('vegetable') || copy.includes('fresh choice');
  const isSnacks = copy.includes('snack') || copy.includes('munch') || copy.includes('biscuit') || copy.includes('crisp');

  let targetKeywords = [];
  if (isBreakfast) {
   targetKeywords = ['dairy', 'milk', 'egg', 'bread', 'bakery', 'tea', 'coffee', 'breakfast'];
  } else if (isFarm) {
   targetKeywords = ['fruit', 'vegetable', 'apple', 'banana', 'potato', 'onion', 'tomato', 'fresh'];
  } else if (isSnacks) {
   targetKeywords = ['snack', 'munch', 'chip', 'biscuit', 'bhurji', 'bhujia', 'namkeen'];
  } else {
   targetKeywords = ['atta', 'rice', 'dal', 'oil', 'grocery', 'staple'];
  }

  // Filter catalog products matching the theme
  const themeProducts = (products || []).filter(p => {
   const cat = typeof p.category === 'object' ? p.category?.slug : String(p.category || '');
   const pName = String(p.name || '').toLowerCase();
   const cName = String(p.categoryName || '').toLowerCase();
   return targetKeywords.some(kw => cat.toLowerCase().includes(kw) || pName.includes(kw) || cName.includes(kw));
  });

  const availableProductImages = themeProducts
   .map(p => p.image)
   .filter(img => Boolean(img) && !globalUsed.has(img));

  // Curated theme visuals matching the banner subject (eggs/milk/toast for breakfast; veggies/fruits for farm)
  const defaultBreakfastVisuals = [
   'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80', // Breakfast feast: milk bottle, eggs, toasted bread
   'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80', // Hot morning coffee & cookies
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80'  // Artisanal bread slice
  ];

  const defaultFarmVisuals = [
   'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80', // Farm fresh fruit crate (oranges, apples)
   'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80', // Ripe bananas
   'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'  // Fresh green bell peppers / salad
  ];

  const defaultGenericVisuals = [
   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', // Fresh grocery basket
   'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=400&auto=format&fit=crop&q=80', // Dairy & morning cereal
   'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&auto=format&fit=crop&q=80'  // Fresh market produce
  ];

  const themeDefaults = isBreakfast ? defaultBreakfastVisuals : isFarm ? defaultFarmVisuals : defaultGenericVisuals;

  // Resolve main image (ensuring distinct across both banners)
  if (!main || globalUsed.has(main)) {
   main = availableProductImages.find(img => !globalUsed.has(img)) || themeDefaults.find(img => !globalUsed.has(img)) || themeDefaults[0];
  }
  globalUsed.add(main);

  // Resolve secondary image (ensuring distinct from main and all other images)
  if (!secondary || globalUsed.has(secondary)) {
   secondary = availableProductImages.find(img => !globalUsed.has(img)) || themeDefaults.find(img => !globalUsed.has(img)) || themeDefaults[1];
  }
  globalUsed.add(secondary);

  // Resolve third image (ensuring distinct from main, secondary and all other images)
  if (!third || globalUsed.has(third)) {
   third = availableProductImages.find(img => !globalUsed.has(img)) || themeDefaults.find(img => !globalUsed.has(img)) || themeDefaults[2];
  }
  globalUsed.add(third);

  return {
   banner,
   index: bannerIndex,
   main,
   secondary,
   third
  };
 });
}

function HeroBanner({banner,index,main,secondary,third}){
 const {lang, t} = useLanguage();
 const isHi = lang === 'hi';
 const replaceOrHide=(fallback,event)=>{const image=event.currentTarget;if(fallback&&!image.dataset.fallbackUsed){image.dataset.fallbackUsed='true';image.src=fallback}else image.parentElement.style.display='none'};

 const rawKicker = banner.kicker || 'R2CART FRESH';
 const kicker = isHi && (!banner.kicker || rawKicker.toUpperCase() === 'R2CART FRESH') ? 'आर2कार्ट फ्रेश' : rawKicker;

 const rawHeading = banner.heading || banner.title || '';
 const heading = isHi && (!rawHeading || rawHeading.toLowerCase().includes('mornings made')) ? t('bannerTitleDefault') : (rawHeading || 'Mornings made delicious.');

 const rawSub = banner.subtitle || banner.text || '';
 const subtitle = isHi && (!rawSub || rawSub.toLowerCase().includes('milk, eggs, bread')) ? t('bannerSubDefault') : (rawSub || 'Milk, eggs, bread and more in minutes');

 const rawCta = banner.ctaText || banner.cta || 'Shop now';
 const ctaText = isHi && (rawCta.toLowerCase().includes('shop now') || rawCta.toLowerCase() === 'shop') ? t('shopNow') : rawCta;

 const note = isHi ? t('freshPicks') : 'Fresh picks · Honest prices · Fast delivery';
 const stickerBold = isHi ? 'ताज़ा' : 'Fresh';
 const stickerSmall = isHi ? 'प्रतिदिन' : 'every day';

 return (
  <article className={`hero-card premium-hero hero-${index?'cream':'green'} ${index?'second':''}`}>
   <div className="hero-copy">
    <span className="hero-kicker"><Sparkles/>{kicker}</span>
    <h1>{heading}</h1>
    <p>{subtitle}</p>
    <Link className="hero-cta" to={banner.destination||banner.to||'/'}>
     <b>{ctaText}</b><i><ArrowRight/></i>
    </Link>
    <small className="hero-note">{note}</small>
   </div>
   <div className="hero-visual" aria-hidden="true">
    <div className="hero-photo"><img src={main} alt={heading || 'Fresh daily groceries'} onError={event=>replaceOrHide(secondary,event)}/></div>
    {secondary&&<div className="hero-product hero-product-one"><img src={secondary} alt={subtitle || 'Featured grocery item'} onError={event=>replaceOrHide(third,event)}/></div>}
    {third&&<div className="hero-product hero-product-two"><img src={third} alt="Quality farm fresh groceries" onError={event=>replaceOrHide('',event)}/></div>}
    <span className="hero-offer"><b>{stickerBold}</b><small>{stickerSmall}</small></span>
   </div>
  </article>
 );
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

function HeroBannerSection({ heroBanners, products, bannerVisuals }) {
 const [activeSlide, setActiveSlide] = useState(0);
 const trackRef = useRef(null);

 const resolvedBanners = useMemo(() => {
  return resolveBannerVisualsList(heroBanners, products, bannerVisuals);
 }, [heroBanners, products, bannerVisuals]);

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
    {resolvedBanners.map((item) => (
     <HeroBanner banner={item.banner} index={item.index} main={item.main} secondary={item.secondary} third={item.third} key={item.banner.id} />
    ))}
   </div>

   {/* Mobile View: 2-Slide Banner Carousel */}
   <div className="mobile-hero-carousel">
    <div 
     className="mobile-hero-track"
     ref={trackRef}
     onScroll={handleScroll}
    >
     {resolvedBanners.map((item) => (
      <div className="mobile-hero-slide" key={item.banner.id}>
       <HeroBanner banner={item.banner} index={item.index} main={item.main} secondary={item.secondary} third={item.third} />
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

