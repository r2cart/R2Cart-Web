import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Check,Heart,ShieldCheck,Star,Truck,Zap} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {Badge,Button,EmptyState,ProductRail,QuantitySelector,money} from '../../components/ui';
import ProductRating from '../../components/customer/ProductRating';
import {packOptions} from '../../utils/products';

export function ProductPage(){
 const {id}=useParams();
 const {favorites,toggleFavorite,categories,products,deliveryConfig}=useApp();
 const product=products.find(item=>item.id===id||item.slug===id);
 const [image,setImage]=useState(product?.image||'');
 useEffect(()=>setImage(product?.image||''),[product?.id,product?.image]);
 if(!product)return <div className="container page"><EmptyState icon="package" title="Product unavailable" text="This product is no longer available in the catalogue." action="Continue shopping"/></div>;
 const gallery=product.images?.length?product.images:[product.image];
 return <div className="container page">
  <div className="breadcrumbs"><Link to="/">Home</Link> / <Link to={`/category/${product.category}`}>{categories.find(category=>category.slug===product.category)?.name||'Category'}</Link> / {product.name}</div>
   <div className="product-detail"><div className="gallery"><div className="thumbnails">{gallery.map((source,index)=><button className={image===source?'active':''} onClick={()=>setImage(source)} key={`${source}-${index}`}><img src={source} alt=""/></button>)}</div><div className="main-image"><img src={image} alt={product.name}/><span>Actual product packaging may vary</span></div></div><div className="detail-copy"><Badge><Zap/> Delivery in {deliveryConfig.estimatedDelivery}</Badge><h1>{product.name}</h1><p className="unit">{product.unit}</p><div className="pack-options" aria-label="Choose pack size">{packOptions(product,products).map(pack=><Link key={pack.id} className={pack.id===product.id?'active':''} to={`/product/${pack.id}`}><b>{pack.unit}</b><small>{money(pack.price)}{!pack.stock?' · Out of stock':pack.stock<=5?` · Only ${pack.stock} left`:` · ${pack.stock} in stock`}</small></Link>)}</div><ProductRating key={product.id} product={product}/><div className="detail-price"><strong>{money(product.price)}</strong>{product.mrp>product.price&&<><del>{money(product.mrp)}</del><Badge tone="green">{Math.round((1-product.price/product.mrp)*100)}% OFF</Badge></>}</div><small>Inclusive of all taxes</small><div className={`stock ${!product.stock?'out':product.stock<=(product.lowStockThreshold||5)?'low':''}`}>{product.stock>0?<><Check/> In stock · <b>{product.stock} remaining</b> <span className="stock-unit-label">({product.unit})</span></>:<span className="out-of-stock-text">Currently out of stock</span>}</div><div className="detail-actions"><QuantitySelector id={product.id}/><Button variant="ghost" onClick={()=>toggleFavorite(product.id)}><Heart fill={favorites.includes(product.id)?'currentColor':'none'}/> {favorites.includes(product.id)?'Saved':'Save'}</Button></div><div className="service-list"><div><Truck/><span><b>Fast delivery</b><small>At your doorstep in {deliveryConfig.estimatedDelivery}</small></span></div><div><ShieldCheck/><span><b>Quality checked</b><small>Freshness you can count on</small></span></div></div></div></div>
  <div className="product-info"><h2>Product information</h2><div className="info-grid"><div><h3>Description</h3><p>{product.description}</p></div><div><h3>Product details</h3><dl><dt>Unit / Weight</dt><dd>{product.unit}</dd><dt>SKU</dt><dd>{product.sku}</dd><dt>Storage</dt><dd>Store in a cool, dry place. Refrigerate where applicable.</dd></dl></div><div><h3>Disclaimer</h3><p>Images are for representation. Product packaging, colour and appearance may differ slightly.</p></div></div></div>
  <ProductRail title="Similar products" items={products.filter(item=>item.category===product.category&&item.id!==product.id)}/><ProductRail title="You may also like" items={products.filter(item=>item.id!==product.id).slice(4,11)}/>
 </div>;
}
