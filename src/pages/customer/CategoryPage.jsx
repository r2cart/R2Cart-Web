import {useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {EmptyState,ProductGrid} from '../../components/ui';
import {useApp} from '../../context/AppContext';

const PageHead=({eyebrow,title,text})=><div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1>{text&&<p>{text}</p>}</div></div>;
export function CategoryPage(){
 const {slug}=useParams();
 const {categories,products}=useApp();
 const active=categories.find(category=>category.slug===slug)||categories[0];
 const [sort,setSort]=useState('popular');
 const [stock,setStock]=useState('all');
 if(!active)return null;
 let list=products.filter(product=>product.category===active.slug||product.category?.slug===active.slug||product.categoryId===active.id);
 if(stock==='in')list=list.filter(product=>product.stock);
 if(sort==='low')list=[...list].sort((a,b)=>a.price-b.price);
 if(sort==='high')list=[...list].sort((a,b)=>b.price-a.price);
 return <div className="container page category-page-container">
  <div className="listing-layout"><aside className="category-sidebar"><h3>Categories</h3><div className="sidebar-sticky">{categories.map(category=><Link className={category.slug===active.slug?'active':''} to={`/category/${category.slug}`} key={category.slug}><span className="category-icon-wrap"><img src={category.image} alt="" loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2242%22 height=%2242%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2310b981%22 stroke-width=%221.75%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z%22/%3E%3C/svg%3E'}}/></span><span className="category-title-text">{category.name}</span></Link>)}</div></aside><section className="listing-main"><PageHead eyebrow="CATEGORY" title={active.name} text={`${list.length} quality products available`}/><div className="listing-toolbar"><div className="chips"><button className={stock==='all'?'active':''} onClick={()=>setStock('all')}>All products</button><button className={stock==='in'?'active':''} onClick={()=>setStock('in')}>In stock</button></div><select value={sort} onChange={event=>setSort(event.target.value)}><option value="popular">Sort: Popular</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>{list.length?<ProductGrid items={list}/>:<EmptyState icon="package" title="Products coming soon" text={`No products have been added to ${active.name} yet.`}/>}</section></div>
 </div>;
}
