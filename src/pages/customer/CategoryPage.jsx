import {useState, useEffect} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Clock, Megaphone} from 'lucide-react';
import {EmptyState,ProductGrid,Skeletons} from '../../components/ui';
import {useApp} from '../../context/AppContext';
import {dedupeProductPacks} from '../../utils/products';

const PageHead=({eyebrow,title,badge,text})=>(
  <div className="page-head">
    <div>
      <span>{eyebrow}</span>
      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginTop:'4px'}}>
        <h1 style={{margin:0}}>{title}</h1>
        {badge && (
          <span style={{
            background:'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color:'#ffffff',
            fontSize:'11.5px',
            fontWeight:800,
            padding:'3px 10px',
            borderRadius:'20px',
            boxShadow:'0 2px 6px rgba(2, 132, 199, 0.25)',
            display:'inline-flex',
            alignItems:'center',
            gap:'4px'
          }}>
            🇮🇳 {badge}
          </span>
        )}
      </div>
      {text&&<p style={{marginTop:'6px'}}>{text}</p>}
    </div>
  </div>
);

export function CategoryPage(){
 const {slug}=useParams();
 const {categories,products,storeSettings}=useApp();
 const active=categories.find(category=>category.slug===slug)||categories[0];
 const [sort,setSort]=useState('popular');
 const [stock,setStock]=useState('all');
 const [catLoading,setCatLoading]=useState(false);
 const [showNotice,setShowNotice]=useState(false);

 const comingSoonCats = storeSettings?.policies?.homeLayout?.comingSoonCategories || [];
 const isCatSoon = Boolean(active && comingSoonCats.includes(active.slug));

 useEffect(()=>{
  setCatLoading(true);
  const timer=setTimeout(()=>setCatLoading(false),200);
  return()=>clearTimeout(timer);
 },[slug]);

 useEffect(()=>{
  if(active?.noticeActive && (active.noticeTitle || active.noticeMessage)){
   setShowNotice(true);
  } else {
   setShowNotice(false);
  }
 },[active?.id, active?.noticeActive, active?.noticeTitle, active?.noticeMessage, slug]);

 if(!active)return null;
 let raw=products.filter(product=>product.category===active.slug||product.category?.slug===active.slug||product.categoryId===active.id);
 if(stock==='in')raw=raw.filter(product=>product.stock);
 if(sort==='low')raw=[...raw].sort((a,b)=>a.price-b.price);
 if(sort==='high')raw=[...raw].sort((a,b)=>b.price-a.price);
 const list=dedupeProductPacks(raw);
 return <div className="container page category-page-container">
  <div className="listing-layout">
   <aside className="category-sidebar">
    <h3>Categories</h3>
    <div className="sidebar-sticky">
     {categories.map(category=>{
      const isSoon = comingSoonCats.includes(category.slug);
      return (
       <Link className={category.slug===active.slug?'active':''} to={`/category/${category.slug}`} key={category.slug}>
        <span className="category-icon-wrap">
         <img src={category.image} alt={category.name || 'Category'} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2242%22 height=%2242%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2310b981%22 stroke-width=%221.75%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z%22/%3E%3C/svg%3E'}}/>
        </span>
        <span className="category-title-text" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flex:1,minWidth:0}}>
         <span>{category.name}</span>
         {category.badgeActive && category.badgeText ? (
           <span style={{fontSize:'9px',fontWeight:800,padding:'1px 5px',borderRadius:'4px',background:'#0284c7',color:'#ffffff',marginLeft:'6px',flexShrink:0}}>
             {category.badgeText}
           </span>
         ) : isSoon ? (
           <span style={{fontSize:'9.5px',fontWeight:800,padding:'1px 5px',borderRadius:'4px',background:'#fef3c7',color:'#b45309',border:'1px solid #fde68a',marginLeft:'6px',flexShrink:0}}>
             SOON
           </span>
         ) : null}
        </span>
       </Link>
      );
     })}
    </div>
   </aside>
   <section className="listing-main">
    <PageHead 
      eyebrow="CATEGORY" 
      title={active.name} 
      badge={active.badgeActive && active.badgeText ? active.badgeText : null} 
      text={`${list.length} quality products available`}
    />

    {/* 1-Hour Frequency Capped Notice Card */}
    {showNotice && (
     <div style={{
       position: 'relative',
       display: 'flex',
       alignItems: 'flex-start',
       gap: '12px',
       background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
       border: '1.5px solid #3b82f6',
       borderRadius: '12px',
       padding: '14px 16px',
       marginBottom: '16px',
       boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)'
     }}>
       <div style={{
         width: '36px',
         height: '36px',
         borderRadius: '50%',
         background: '#2563eb',
         color: '#ffffff',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         flexShrink: 0
       }}>
         <Megaphone size={18} />
       </div>
       <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
         {active.noticeTitle && (
           <b style={{ color: '#1e3a8a', display: 'block', fontSize: '14.5px', marginBottom: '3px' }}>
             {active.noticeTitle}
           </b>
         )}
         {active.noticeMessage && (
           <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
             {active.noticeMessage}
           </div>
         )}
       </div>
       <button
         type="button"
         onClick={() => setShowNotice(false)}
         style={{
           position: 'absolute',
           top: '8px',
           right: '10px',
           background: 'transparent',
           border: 'none',
           fontSize: '20px',
           lineHeight: 1,
           color: '#3b82f6',
           cursor: 'pointer',
           padding: '4px 6px',
           borderRadius: '4px'
         }}
         aria-label="Dismiss notice"
         title="Close notice"
       >
         &times;
       </button>
     </div>
    )}

    {isCatSoon && (
     <div style={{display:'flex',alignItems:'center',gap:'12px',background:'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',border:'1px solid #fde68a',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',boxShadow:'0 2px 6px rgba(217,119,6,0.06)'}}>
       <Clock size={22} color="#d97706" style={{flexShrink:0}}/>
       <div style={{fontSize:'13px',color:'#92400e',lineHeight:1.45}}>
         <b style={{color:'#78350f',display:'block',fontSize:'13.5px'}}>{active.name} — Coming Soon</b>
         <span>Products in this category are coming soon and currently cannot be ordered. We are restocking fresh inventory!</span>
       </div>
     </div>
    )}
    <div className="listing-toolbar">
      <div className="chips">
        <button className={stock==='all'?'active':''} onClick={()=>setStock('all')}>All products</button>
        <button className={stock==='in'?'active':''} onClick={()=>setStock('in')}>In stock</button>
      </div>
      <select value={sort} onChange={event=>setSort(event.target.value)}>
        <option value="popular">Sort: Popular</option>
        <option value="low">Price: Low to High</option>
        <option value="high">Price: High to Low</option>
      </select>
    </div>
    {catLoading || !products.length ? <Skeletons count={8}/> : list.length ? <ProductGrid items={list}/> : <EmptyState icon="package" title="Products coming soon" text={`No products have been added to ${active.name} yet.`}/>}
   </section>
  </div>
 </div>;
}
